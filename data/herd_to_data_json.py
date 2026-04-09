"""
herd_to_data_json.py
====================
Reads a single HERD zip file, builds field rankings for the top-N institutions,
and writes data.json (consumed by app.js) — replacing the two-step pipeline of
build_2024_quilt_full.py → build_data_json.py.

Usage:
    cd data/
    python herd_to_data_json.py higher_education_r_and_d_2024.zip
    python herd_to_data_json.py higher_education_r_and_d_2024.zip --top 100 --out dist/data/data_2024.json

The zip may contain the CSV at its root OR in a single subdirectory; both layouts
are handled automatically.
"""
import os
import csv
import io
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

# Canonical display fields ordered by group, then by display name within group
DISPLAY_FIELDS = sorted(
    {v[0] for v in FIELD_MAP.values()},
    key=lambda name: (next(v[1] for v in FIELD_MAP.values() if v[0] == name), name)
)
FIELD_GROUP = {v[0]: v[1] for v in FIELD_MAP.values()}


# ── Zip helpers ────────────────────────────────────────────────────────────────

def find_csv_in_zip(zf: zipfile.ZipFile) -> str:
    """Return the name of the first .csv entry inside the zip."""
    for name in zf.namelist():
        if name.endswith(".csv") and not name.startswith("__MACOSX"):
            return name
    raise FileNotFoundError("No .csv file found inside the zip archive.")


def open_herd_csv(zip_path: str):
    """
    Open the HERD microdata CSV from a zip, yielding a csv.DictReader.
    Handles both flat (herd2024.csv) and subdirectory layouts.
    """
    zf = zipfile.ZipFile(zip_path)
    csv_name = find_csv_in_zip(zf)
    raw = zf.open(csv_name)
    return zf, io.TextIOWrapper(raw, encoding="latin-1")


# ── Parsing ────────────────────────────────────────────────────────────────────

def shorten_name(name: str) -> str:
    """Trim verbose suffixes that appear in official HERD institution names."""
    name = name.replace(", The", "").replace(", the", "")
    name = name.replace(" in the City of New York", "")
    name = name.replace(" at Urbana-Champaign", "")
    return name.strip()


def parse_herd_zip(zip_path: str) -> tuple[dict, dict]:
    """
    Parse a HERD zip in one pass.

    Returns:
        totals  : {short_inst_name: total_rd_dollars}
        amounts : {short_inst_name: {display_field: dollars}}
    """
    totals = {}
    nonfed = defaultdict(lambda: defaultdict(int))
    fed    = defaultdict(lambda: defaultdict(int))

    print(f"  Reading {os.path.basename(zip_path)} …")
    zf, text_stream = open_herd_csv(zip_path)
    with zf:
        reader = csv.DictReader(text_stream)
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

            elif q == "Nonfederal expenditures by field and source" and col == "Total" and row in FIELD_MAP:
                nonfed[inst][FIELD_MAP[row][0]] += val

            elif q == "Federal expenditures by field and agency" and col == "Total" and row in FIELD_MAP:
                fed[inst][FIELD_MAP[row][0]] += val

    # Combine fed + nonfed → total expenditure by field
    amounts: dict[str, dict[str, int]] = {}
    for inst in set(list(nonfed) + list(fed)):
        inst_amounts = {}
        for field in DISPLAY_FIELDS:
            total = nonfed[inst].get(field, 0) + fed[inst].get(field, 0)
            if total > 0:
                inst_amounts[field] = total
        if inst_amounts:
            amounts[inst] = inst_amounts

    print(f"  Parsed {len(totals)} institutions, {len(amounts)} with field data")
    return totals, amounts


# ── Rankings ───────────────────────────────────────────────────────────────────

def compute_field_ranks(amounts: dict) -> dict[str, dict[str, int]]:
    """
    Rank all institutions for each display field (full universe, not just top-N).

    Returns: {inst_name: {display_field: rank_int}}
    """
    field_ranks: dict[str, dict[str, int]] = defaultdict(dict)
    for field in DISPLAY_FIELDS:
        pairs = [(inst, amounts[inst][field])
                 for inst in amounts if field in amounts[inst]]
        pairs.sort(key=lambda x: x[1], reverse=True)
        for rank_pos, (inst, _) in enumerate(pairs, 1):
            field_ranks[inst][field] = rank_pos
    return dict(field_ranks)


# ── data.json builder ──────────────────────────────────────────────────────────

def build_data_json(totals: dict, amounts: dict, field_ranks: dict,
                    year: str, top_n: int) -> dict:
    """
    Assemble the data.json structure consumed by app.js.

      headers.uni_name     — institution names (rank order)
      headers.field_name   — display field names (group-sorted)
      headers.field_dict   — {field_name: group_number}
      rankings             — [{row, col, ranking, y<YEAR>}, …]
    """
    top_insts = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:top_n]
    inst_order = [inst for inst, _ in top_insts]
    inst_index = {name: i + 1 for i, name in enumerate(inst_order)}
    field_index = {f: i + 1 for i, f in enumerate(DISPLAY_FIELDS)}

    headers = {
        "uni_name":    inst_order,
        "uni_ind":     list(range(1, len(inst_order) + 1)),
        "field_name":  DISPLAY_FIELDS,
        "field_ind":   list(range(1, len(DISPLAY_FIELDS) + 1)),
        "field_dict":  FIELD_GROUP,
        "years":       [year],
        "latest_year": year,
    }

    year_key = f"y{year}"
    records = []
    for rank_pos, (inst, _) in enumerate(top_insts, 1):
        ranks = field_ranks.get(inst, {})
        for field in DISPLAY_FIELDS:
            field_rank = ranks.get(field, 999)
            records.append({
                "row":     inst_index[inst],
                "col":     field_index[field],
                "ranking": rank_pos,        # overall R&D rank, used for sort
                year_key:  field_rank,
            })

    records.sort(key=lambda r: (r["row"], r["col"]))
    return {"headers": headers, "rankings": records}


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Build data.json from a single HERD zip file"
    )
    parser.add_argument("zip", nargs="?",
                        default=os.path.join(DATA_DIR, "higher_education_r_and_d_2024.zip"),
                        help="Path to HERD zip (default: higher_education_r_and_d_2024.zip)")
    parser.add_argument("--top",  type=int, default=50,
                        help="Number of top institutions to include (default: 50)")
    parser.add_argument("--out",  default=os.path.join(DATA_DIR, "data.json"),
                        help="Output path for data.json (default: data/data.json)")
    args = parser.parse_args()

    if not os.path.exists(args.zip):
        print(f"ERROR: {args.zip} not found.")
        sys.exit(1)

    # Infer year from filename
    import re
    m = re.search(r"(\d{4})", os.path.basename(args.zip))
    year = m.group(1) if m else "unknown"

    print(f"\nBuilding data.json — FY{year}, top {args.top} institutions, "
          f"{len(DISPLAY_FIELDS)} fields")
    print(f"Source: {args.zip}\n")

    totals, amounts = parse_herd_zip(args.zip)

    print("  Computing per-field rankings …")
    field_ranks = compute_field_ranks(amounts)

    payload = build_data_json(totals, amounts, field_ranks, year, args.top)

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    size_kb = os.path.getsize(args.out) / 1024
    n_unis  = len(payload["headers"]["uni_name"])
    n_recs  = len(payload["rankings"])
    print(f"\nWrote {args.out}  ({size_kb:.0f} KB)")
    print(f"  {n_unis} unis × {len(DISPLAY_FIELDS)} fields = {n_recs:,} records")

    print(f"\nTop 5 institutions (FY{year}):")
    for i, name in enumerate(payload["headers"]["uni_name"][:5], 1):
        print(f"  #{i}  {name}")


if __name__ == "__main__":
    main()
