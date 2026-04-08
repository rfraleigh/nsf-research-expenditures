"""
build_2024_quilt_full.py
========================
Builds 2024_quilt.csv directly from the full-form HERD microdata CSV
(Higher_Education_R_and_D_2024.zip → herd2024.csv).

This replaces build_2024_quilt.py (which required the Excel Table 15).
The microdata has richer subfield breakdowns not available in Table 15.

Usage:
    cd data/
    python build_2024_quilt_full.py [--csv path/to/herd2024.csv] [--top N]

Outputs:
    2024_quilt.csv    — rank positions per field (input to build_data_json.py)
    2024_amounts.csv  — raw dollar amounts in $K (for future visualizations)
"""
import os
import csv
import sys
import argparse
from collections import defaultdict

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Field mapping: CSV 'row' value → (display name, group number) ─────────────
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

# Ordered display fields (group-sorted, then alphabetical within group)
DISPLAY_FIELDS = sorted(
    set(v[0] for v in FIELD_MAP.values()),
    key=lambda name: next(v[1] for v in FIELD_MAP.values() if v[0] == name)
)
FIELD_GROUP = {v[0]: v[1] for v in FIELD_MAP.values()}


def parse_herd_csv(csv_path: str) -> tuple[dict, dict]:
    """
    Single-pass parse of herd2024.csv.
    Returns:
        totals: {inst_name: total_rd_dollars}
        amounts: {inst_name: {display_field: dollars}}
    """
    totals = {}
    nonfed = defaultdict(lambda: defaultdict(int))
    fed    = defaultdict(lambda: defaultdict(int))

    print(f"  Reading {csv_path} ...")
    with open(csv_path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            inst = r["inst_name_long"]
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
    amounts = defaultdict(dict)
    for inst in set(list(nonfed) + list(fed)):
        for display in DISPLAY_FIELDS:
            total = nonfed[inst].get(display, 0) + fed[inst].get(display, 0)
            if total > 0:
                amounts[inst][display] = total

    print(f"  Parsed {len(totals)} institutions, {len(amounts)} with field data")
    return totals, dict(amounts)


def compute_field_ranks(totals: dict, amounts: dict) -> dict:
    """
    For each display field, rank ALL institutions (full universe, not just top 50).
    Returns: {inst_name: {display_field: rank_int}}
    """
    field_ranks = defaultdict(dict)
    for display in DISPLAY_FIELDS:
        # Only institutions that reported spending in this field
        field_vals = [(inst, amounts[inst][display])
                      for inst in amounts if display in amounts[inst]]
        field_vals.sort(key=lambda x: x[1], reverse=True)
        for rank_pos, (inst, _) in enumerate(field_vals, 1):
            field_ranks[inst][display] = rank_pos
    return dict(field_ranks)


def shorten_name(name: str) -> str:
    """Clean up long official names to match prior quilt style."""
    name = name.replace(", The", "").replace(", the", "")
    name = name.replace(" in the City of New York", "")
    name = name.replace(" at Urbana-Champaign", "")
    return name.strip()


def build_quilt(totals, amounts, field_ranks, top_n: int) -> list[dict]:
    """Build list of quilt rows for the top_n institutions."""
    top_insts = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:top_n]
    rows = []
    for overall_rank, (inst, total_val) in enumerate(top_insts, 1):
        ranks = field_ranks.get(inst, {})
        top10 = sum(1 for f in DISPLAY_FIELDS if ranks.get(f, 9999) <= 10)
        row = {
            "University":    shorten_name(inst),
            "FY2024 Ranking": overall_rank,
            **{f: ranks.get(f, "") for f in DISPLAY_FIELDS},
            "Number In Top Ten Fields/Subfields": top10,
        }
        rows.append(row)
    return rows


def build_amounts_csv(totals, amounts, top_n: int) -> list[dict]:
    top_insts = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:top_n]
    rows = []
    for rank, (inst, total_val) in enumerate(top_insts, 1):
        row = {
            "University":    shorten_name(inst),
            "FY2024 Ranking": rank,
            "Total R&D ($K)": total_val,
            **{f: amounts.get(inst, {}).get(f, "") for f in DISPLAY_FIELDS},
        }
        rows.append(row)
    return rows


def write_csv(rows: list[dict], path: str):
    if not rows:
        print(f"  WARNING: no rows to write to {path}")
        return
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Wrote {len(rows)} rows → {path}")


def main():
    parser = argparse.ArgumentParser(description="Build FY2024 quilt CSV from full HERD microdata")
    parser.add_argument("--csv",  default=os.path.join(DATA_DIR, "herd2024.csv"),
                        help="Path to herd2024.csv (default: data/herd2024.csv)")
    parser.add_argument("--top",  type=int, default=50,
                        help="Number of top institutions to include (default: 50)")
    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"ERROR: {args.csv} not found.")
        print("       Extract herd2024.csv from Higher_Education_R_and_D_2024.zip")
        print("       and place it in the data/ directory (or pass --csv <path>).")
        sys.exit(1)

    print(f"\nBuilding FY2024 quilt (top {args.top} institutions, {len(DISPLAY_FIELDS)} fields)")
    print(f"Source: {args.csv}\n")

    totals, amounts = parse_herd_csv(args.csv)

    print("  Computing per-field rankings across full universe...")
    field_ranks = compute_field_ranks(totals, amounts)

    quilt_rows   = build_quilt(totals, amounts, field_ranks, args.top)
    amounts_rows = build_amounts_csv(totals, amounts, args.top)

    quilt_path   = os.path.join(DATA_DIR, "2024_quilt.csv")
    amounts_path = os.path.join(DATA_DIR, "2024_amounts.csv")

    write_csv(quilt_rows,   quilt_path)
    write_csv(amounts_rows, amounts_path)

    # Quick sanity check
    print(f"\nTop 5 institutions:")
    for row in quilt_rows[:5]:
        print(f"  #{row['FY2024 Ranking']} {row['University']}")
    print(f"\nFields ({len(DISPLAY_FIELDS)}):")
    for f in DISPLAY_FIELDS:
        print(f"  group {FIELD_GROUP[f]}: {f}")
    print("\nDone. Run build_data_json.py next.")


if __name__ == "__main__":
    main()
