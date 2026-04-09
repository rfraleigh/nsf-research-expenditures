"""
build_all_years_json.py
=======================
Iterates through every higher_education_r_and_d_YYYY.zip file in the data
directory, processes each year's HERD microdata in one pass, and writes a
single consolidated data.json consumed by app.js.

All institution names and field names are normalised consistently across years
using the same FIELD_MAP and shorten_name() logic.  Fields that were not
collected in a given year (e.g. "Industrial & Mfg Eng" is absent from the
2012 survey) will simply have no entry for that year in the rankings records.

Usage:
    cd data/
    python build_all_years_json.py
    python build_all_years_json.py --data-dir . --top 50 --out data.json

Output:
    data.json   — multi-year rankings file; each rankings record carries
                  one key per available year (y2012, y2013, …, y2024) plus
                  a 'ranking' key equal to the institution's overall R&D rank
                  in the most recent year.
"""
import os
import csv
import io
import re
import sys
import json
import argparse
import zipfile
from collections import defaultdict

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Field mapping: HERD 'row' value → (display name, group number) ────────────
# Groups: 1=Eng, 2=Physical Sci, 3=Geosciences, 4=Math, 5=CS,
#         6=Life Sci, 7=Psychology, 8=Social Sci, 9=Other S&E, 10=Non-S&E
FIELD_MAP = {
    # Engineering (1)
    "Engineering, aerospace, aeronautical, and astronautical":        ("Aerospace Eng",               1),
    "Engineering, bioengineering and biomedical engineering":         ("Bioengineering",               1),
    "Engineering, chemical":                                          ("Chemical Eng",                 1),
    "Engineering, civil":                                             ("Civil Eng",                    1),
    "Engineering, electrical, electronic, and communications":        ("Electrical Eng",               1),
    "Engineering, industrial and manufacturing":                      ("Industrial & Mfg Eng",         1),
    "Engineering, metallurgical and materials":                       ("Materials Eng",                1),
    "Engineering, mechanical":                                        ("Mechanical Eng",               1),
    "Engineering, other":                                             ("Other Eng",                    1),
    # Physical Sciences (2)
    "Physical sciences, astronomy and astrophysics":                  ("Astronomy & Astrophysics",     2),
    "Physical sciences, chemistry":                                   ("Chemistry",                    2),
    "Physical sciences, materials science":                           ("Materials Science",            2),
    "Physical sciences, physics":                                     ("Physics",                      2),
    "Physical sciences, other":                                       ("Other Physical Sci",           2),
    # Geosciences (3)
    "Geosciences, atmospheric sciences, and ocean sciences, atmospheric science and meteorology":
                                                                      ("Atmospheric Sci",              3),
    "Geosciences, atmospheric sciences, and ocean sciences, geological and earth sciences":
                                                                      ("Geological & Earth Sci",       3),
    "Geosciences, atmospheric sciences, and ocean sciences, ocean sciences and marine sciences":
                                                                      ("Ocean Sciences",               3),
    "Geosciences, atmospheric sciences, and ocean sciences, other":   ("Other Geosciences",           3),
    # Mathematics (4)
    "Mathematics and statistics, all":                                ("Mathematics & Statistics",     4),
    # Computer Science (5)
    "Computer and information sciences, all":                         ("Computer & Info Sciences",     5),
    # Life Sciences (6)
    "Life sciences, agricultural sciences":                           ("Agricultural Sciences",        6),
    "Life sciences, biological and biomedical sciences":              ("Biological & Biomedical Sci",  6),
    "Life sciences, health sciences":                                 ("Health Sciences",              6),
    "Life sciences, natural resources and conservation":              ("Natural Resources",            6),
    "Life sciences, other":                                           ("Other Life Sciences",          6),
    # Psychology (7)
    "Psychology, all":                                                ("Psychology",                   7),
    # Social Sciences (8)
    "Social sciences, anthropology":                                  ("Anthropology",                 8),
    "Social sciences, economics":                                     ("Economics",                    8),
    "Social sciences, political science and government":              ("Political Science",            8),
    "Social sciences, sociology, demography, and population studies": ("Sociology & Demography",       8),
    "Social sciences, other":                                         ("Other Social Sciences",        8),
    # Other S&E (9)
    "Other sciences, all":                                            ("Other Sciences",               9),
    # Non-S&E (10)
    "Non-S&E, all":                                                   ("Non-S&E",                     10),
}

DISPLAY_FIELDS = sorted(
    {v[0] for v in FIELD_MAP.values()},
    key=lambda name: (next(v[1] for v in FIELD_MAP.values() if v[0] == name), name)
)
FIELD_GROUP = {v[0]: v[1] for v in FIELD_MAP.values()}


# ── Zip / CSV helpers ──────────────────────────────────────────────────────────

def find_csv_in_zip(zf: zipfile.ZipFile) -> str:
    for name in zf.namelist():
        if name.endswith(".csv") and not name.startswith("__MACOSX"):
            return name
    raise FileNotFoundError("No .csv found in zip.")


def shorten_name(name: str) -> str:
    name = name.replace(", The", "").replace(", the", "")
    name = name.replace(" in the City of New York", "")
    name = name.replace(" at Urbana-Champaign", "")
    return name.strip()


# ── Per-year parsing ───────────────────────────────────────────────────────────

def parse_year_zip(zip_path: str) -> tuple[dict, dict]:
    """
    Parse one HERD zip file.

    Returns:
        totals  : {short_inst_name: total_rd_dollars}
        amounts : {short_inst_name: {display_field: dollars}}
    """
    totals = {}
    nonfed: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    fed:    dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    with zipfile.ZipFile(zip_path) as zf:
        csv_name = find_csv_in_zip(zf)
        with zf.open(csv_name) as raw:
            reader = csv.DictReader(io.TextIOWrapper(raw, encoding="latin-1"))
            for r in reader:
                inst = shorten_name(r["inst_name_long"])
                q    = r["question"]
                row  = r["row"]
                col  = r["column"]
                try:
                    val = int(r["data"])
                except (ValueError, TypeError):
                    continue

                if q == "Source" and row == "Total":
                    totals[inst] = val
                elif (q == "Nonfederal expenditures by field and source"
                      and col == "Total" and row in FIELD_MAP):
                    nonfed[inst][FIELD_MAP[row][0]] += val
                elif (q == "Federal expenditures by field and agency"
                      and col == "Total" and row in FIELD_MAP):
                    fed[inst][FIELD_MAP[row][0]] += val

    amounts: dict[str, dict[str, int]] = {}
    for inst in set(list(nonfed) + list(fed)):
        inst_amounts = {
            field: nonfed[inst].get(field, 0) + fed[inst].get(field, 0)
            for field in DISPLAY_FIELDS
            if nonfed[inst].get(field, 0) + fed[inst].get(field, 0) > 0
        }
        if inst_amounts:
            amounts[inst] = inst_amounts

    return totals, amounts


def compute_field_ranks(amounts: dict) -> dict[str, dict[str, int]]:
    """Rank ALL institutions per field (not just top-N)."""
    field_ranks: dict[str, dict[str, int]] = defaultdict(dict)
    for field in DISPLAY_FIELDS:
        pairs = [(inst, amounts[inst][field])
                 for inst in amounts if field in amounts[inst]]
        pairs.sort(key=lambda x: x[1], reverse=True)
        for rank_pos, (inst, _) in enumerate(pairs, 1):
            field_ranks[inst][field] = rank_pos
    return dict(field_ranks)


# ── Multi-year consolidation ───────────────────────────────────────────────────

def discover_zips(data_dir: str) -> list[tuple[str, str]]:
    """Return [(year, abs_path), …] sorted by year for all HERD zips found."""
    pattern = re.compile(r"higher_education_r_and_d_(\d{4})\.zip$", re.I)
    results = []
    for fname in os.listdir(data_dir):
        m = pattern.match(fname)
        if m:
            results.append((m.group(1), os.path.join(data_dir, fname)))
    return sorted(results, key=lambda x: x[0])


def build_consolidated_json(data_dir: str, top_n: int) -> dict:
    """
    Process all HERD zip files and return a single merged data.json payload.

    Institution order is determined by the most recent year's overall R&D rank.
    Each ranking record carries one key per available year (e.g. y2024: 5).
    The 'ranking' field is the institution's overall R&D rank in the latest year
    (or 999 if the institution only appears in older years).
    """
    zips = discover_zips(data_dir)
    if not zips:
        print("ERROR: No higher_education_r_and_d_YYYY.zip files found.")
        sys.exit(1)

    print(f"Found {len(zips)} zip file(s): {[yr for yr, _ in zips]}\n")

    # Per-year data: {year: (totals, amounts, field_ranks)}
    year_data: dict[str, tuple[dict, dict, dict]] = {}
    for year, zip_path in zips:
        print(f"Processing FY{year} …")
        totals, amounts = parse_year_zip(zip_path)
        field_ranks = compute_field_ranks(amounts)
        year_data[year] = (totals, amounts, field_ranks)
        print(f"  FY{year}: {len(totals)} institutions total")

    # Institution order: top-N from most recent year, then any additional insts
    # from older years (sorted by their own year's rank)
    latest_year = max(year_data.keys())
    latest_totals = year_data[latest_year][0]
    top_latest = sorted(latest_totals.items(), key=lambda x: x[1], reverse=True)[:top_n]
    inst_order = [inst for inst, _ in top_latest]
    # Overall rank for latest year (1-based, used as 'ranking' sentinel)
    latest_overall_rank = {inst: i + 1 for i, (inst, _) in enumerate(top_latest)}

    # Include any institution that appears in an older year but not the latest
    seen = set(inst_order)
    for year, (totals, _, _) in sorted(year_data.items()):
        if year == latest_year:
            continue
        for inst in sorted(totals, key=lambda i: totals[i], reverse=True):
            if inst not in seen:
                inst_order.append(inst)
                seen.add(inst)

    inst_index  = {name: i + 1 for i, name in enumerate(inst_order)}
    field_index = {f:    i + 1 for i, f    in enumerate(DISPLAY_FIELDS)}

    available_years = sorted(year_data.keys())

    headers = {
        "uni_name":    inst_order,
        "uni_ind":     list(range(1, len(inst_order) + 1)),
        "field_name":  DISPLAY_FIELDS,
        "field_ind":   list(range(1, len(DISPLAY_FIELDS) + 1)),
        "field_dict":  FIELD_GROUP,
        "years":       available_years,
        "latest_year": latest_year,
    }

    # Pre-seed records dict so every (inst, field) combo gets a row
    records: dict[tuple[int, int], dict] = {}
    for inst in inst_order:
        row_idx = inst_index[inst]
        for field in DISPLAY_FIELDS:
            col_idx = field_index[field]
            records[(row_idx, col_idx)] = {
                "row":     row_idx,
                "col":     col_idx,
                "ranking": latest_overall_rank.get(inst, 999),
            }

    # Fill in per-year field ranks
    for year, (totals, amounts, field_ranks) in year_data.items():
        year_key = f"y{year}"
        for inst in inst_order:
            if inst not in inst_index:
                continue
            row_idx = inst_index[inst]
            ranks = field_ranks.get(inst, {})
            for field in DISPLAY_FIELDS:
                col_idx = field_index[field]
                key = (row_idx, col_idx)
                field_rank = ranks.get(field, 999)
                records[key][year_key] = field_rank

    # Drop records that are 999 across all year keys (inst never reported that field)
    def has_real_data(rec: dict) -> bool:
        return any(v != 999 for k, v in rec.items() if k.startswith("y"))

    rankings_list = [r for r in records.values() if has_real_data(r)]
    rankings_list.sort(key=lambda r: (r["row"], r["col"]))

    print(f"\nConsolidated: {len(inst_order)} institutions × "
          f"{len(DISPLAY_FIELDS)} fields × {len(available_years)} years")
    print(f"  {len(rankings_list):,} non-empty records")

    return {"headers": headers, "rankings": rankings_list}


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Consolidate all HERD zip files into a single multi-year data.json"
    )
    parser.add_argument("--data-dir", default=DATA_DIR,
                        help="Directory containing HERD zip files (default: same dir as this script)")
    parser.add_argument("--top",  type=int, default=50,
                        help="Top-N institutions from the latest year (default: 50)")
    parser.add_argument("--out",  default=os.path.join(DATA_DIR, "data.json"),
                        help="Output path for data.json (default: data/data.json)")
    args = parser.parse_args()

    print(f"Building consolidated data.json  (top {args.top} from latest year)\n")
    payload = build_consolidated_json(args.data_dir, args.top)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    size_kb = os.path.getsize(args.out) / 1024
    print(f"\nWrote {args.out}  ({size_kb:.0f} KB)")

    print(f"\nTop 5 institutions (latest year: FY{payload['headers']['latest_year']}):")
    for i, name in enumerate(payload["headers"]["uni_name"][:5], 1):
        print(f"  #{i}  {name}")

    print(f"\nYears included: {payload['headers']['years']}")


if __name__ == "__main__":
    main()
