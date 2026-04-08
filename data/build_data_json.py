"""
build_data_json.py
==================
Combines all year CSVs (2012_quilt.csv through 2024_quilt.csv) into a single
data.json consumed by app.js.

Usage:
    cd data/
    python build_data_json.py

Prerequisites:
    2024_quilt.csv must exist (run build_2024_quilt_full.py first)
    Older quilt CSVs (2012–2016) should also be present for multi-year data.
"""
import os
import json
import re
import csv
import pandas as pd

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Field → group mapping ──────────────────────────────────────────────────────
# Covers both FY2024 subfield names AND legacy FY2012-2016 names so multi-year
# data is colored consistently.
FIELD_GROUPS = {
    # Engineering (1) — FY2024 names
    "Aerospace Eng": 1, "Bioengineering": 1, "Chemical Eng": 1,
    "Civil Eng": 1, "Electrical Eng": 1, "Industrial & Mfg Eng": 1,
    "Materials Eng": 1, "Mechanical Eng": 1, "Other Eng": 1,
    # Engineering (1) — legacy FY2016 names
    "Aero/Astro-Engineering": 1, "Bio-Engineering": 1, "Chemical Engineering": 1,
    "Civil Engineering": 1, "Eng - Electrical": 1, "Eng - Materials": 1,
    "Eng - Mechanical": 1, "Eng- Industrial and Manufacturing Engineering ": 1,
    "Total Engineering": 1,
    # Physical Sciences (2) — FY2024
    "Astronomy & Astrophysics": 2, "Chemistry": 2, "Materials Science": 2,
    "Physics": 2, "Other Physical Sci": 2,
    # Physical Sciences (2) — legacy
    "Astronomy": 2, "Material Science": 2, "Total Physical Sciences": 2,
    # Geosciences (3) — FY2024
    "Atmospheric Sci": 3, "Geological & Earth Sci": 3,
    "Ocean Sciences": 3, "Other Geosciences": 3,
    # Geosciences (3) — legacy
    "Atmospheric": 3, "Geological and Earth Sciences": 3,
    "Total Environmental Sci": 3,
    # Mathematics (4)
    "Mathematics & Statistics": 4, "Mathematical": 4,
    # Computer Science (5)
    "Computer & Info Sciences": 5, "Computer Science": 5,
    # Life Sciences (6) — FY2024
    "Agricultural Sciences": 6, "Biological & Biomedical Sci": 6,
    "Health Sciences": 6, "Natural Resources": 6, "Other Life Sciences": 6,
    # Life Sciences (6) — legacy
    "Agricultural": 6, "Biological": 6, "Natural resources": 6,
    "Total Life Sciences": 6,
    # Psychology (7)
    "Psychology": 7,
    # Social Sciences (8) — FY2024
    "Anthropology": 8, "Economics": 8, "Political Science": 8,
    "Sociology & Demography": 8, "Other Social Sciences": 8,
    # Social Sciences (8) — legacy
    "Political Science": 8, "Sociology": 8, "Total Social Sciences": 8,
    # Other S&E (9)
    "Other Sciences": 9,
    # Non-S&E (10)
    "Non-S&E": 10,
}

# Fields to exclude from the viz (aggregates, duplicates, meta-columns)
EXCLUDE_FIELDS = {
    "Number In Top Ten Fields/Subfields", "Industry",
    # Legacy aggregate columns that are just sums of subfields shown elsewhere
    "Total Engineering", "Total Environmental Sci", "Total Life Sciences",
    "Total Physical Sciences", "Total Social Sciences",
    # FY2024 broad totals (we show subfields instead)
    "All R&D expenditures", "Rank",
    "Engineering", "Life sciences", "Physical sciences",
    "Geosciences, atmospheric sciences, and ocean sciences", "Social sciences",
    "Sciences nec", "All non-S&E fields",
    # old multi-year tsv meta cols
    "log2ratio",
}


def read_quilt_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, index_col=0, encoding="utf-8", low_memory=False)
    return df


def extract_year(filename: str) -> str:
    m = re.search(r"(\d{4})", filename)
    return m.group(1) if m else "unknown"


def get_field_columns(df: pd.DataFrame) -> list:
    meta = re.compile(r"(fy\d{4}\s*ranking|number in)", re.I)
    return [c for c in df.columns
            if not meta.search(c) and c not in EXCLUDE_FIELDS]


def build_data_json():
    quilt_files = sorted([
        f for f in os.listdir(DATA_DIR)
        if re.match(r"\d{4}_quilt\.csv$", f)
    ])

    if not quilt_files:
        print("ERROR: No *_quilt.csv files found. Run build_2024_quilt_full.py first.")
        return

    print(f"Found quilt files: {quilt_files}")

    year_dfs = {}
    all_institutions = []   # ordered: latest year first, then others
    all_fields = set()

    for fname in quilt_files:
        year = extract_year(fname)
        df = read_quilt_csv(os.path.join(DATA_DIR, fname))
        year_dfs[year] = df
        all_fields.update(get_field_columns(df))

    # Institution order: latest year's rank order (already sorted in quilt CSV)
    latest_year = max(year_dfs.keys())
    latest_df = year_dfs[latest_year]
    # Find overall ranking column
    rank_col = next((c for c in latest_df.columns
                     if re.search(r"fy\d{4}\s*ranking", c, re.I)), None)
    if rank_col:
        inst_order = latest_df.sort_values(rank_col).index.tolist()
    else:
        inst_order = list(latest_df.index)

    # Append any institutions only in older years
    seen = set(inst_order)
    for year, df in sorted(year_dfs.items()):
        for inst in df.index:
            if inst not in seen:
                inst_order.append(inst)
                seen.add(inst)

    # Remove excluded fields, sort by group then name
    all_fields -= EXCLUDE_FIELDS
    all_fields_sorted = sorted(
        all_fields,
        key=lambda f: (FIELD_GROUPS.get(f, 99), f)
    )

    print(f"  Institutions: {len(inst_order)}  |  Fields: {len(all_fields_sorted)}  |  Years: {sorted(year_dfs)}")

    # Build index maps (1-based)
    inst_index  = {name: i + 1 for i, name in enumerate(inst_order)}
    field_index = {f: i + 1   for i, f    in enumerate(all_fields_sorted)}
    field_dict  = {f: FIELD_GROUPS.get(f, 0) for f in all_fields_sorted}

    headers = {
        "uni_name":   inst_order,
        "uni_ind":    list(range(1, len(inst_order) + 1)),
        "field_name": all_fields_sorted,
        "field_ind":  list(range(1, len(all_fields_sorted) + 1)),
        "field_dict": field_dict,
        "years":      sorted(year_dfs.keys()),
        "latest_year": latest_year,
    }

    # Build rankings records
    records = {}
    for inst_name in inst_order:
        for field in all_fields_sorted:
            key = (inst_index[inst_name], field_index[field])
            records[key] = {"row": inst_index[inst_name], "col": field_index[field], "ranking": 999}

    for year, df in year_dfs.items():
        field_cols = [c for c in get_field_columns(df) if c in field_index]
        rank_col   = next((c for c in df.columns if re.search(r"fy\d{4}\s*ranking", c, re.I)), None)
        year_key   = f"y{year}"

        for inst_name in df.index:
            if inst_name not in inst_index:
                continue
            row_idx = inst_index[inst_name]

            # Overall rank for this institution in this year
            inst_rank = 999
            if rank_col and pd.notna(df.loc[inst_name, rank_col]):
                try:
                    inst_rank = int(df.loc[inst_name, rank_col])
                except (ValueError, TypeError):
                    pass

            for field in field_cols:
                col_idx = field_index[field]
                key = (row_idx, col_idx)
                if key not in records:
                    records[key] = {"row": row_idx, "col": col_idx, "ranking": 999}

                val = 999
                raw = df.loc[inst_name, field]
                if raw != "" and pd.notna(raw):
                    try:
                        val = int(float(raw))
                    except (ValueError, TypeError):
                        pass
                records[key][year_key] = val

                # Set the 'ranking' field from the latest year's overall rank.
                # This drives the "By Count of Top N" sort in app.js.
                if year == latest_year:
                    records[key]["ranking"] = inst_rank

    rankings_list = sorted(records.values(), key=lambda r: (r["row"], r["col"]))

    output = {"headers": headers, "rankings": rankings_list}

    out_path = os.path.join(DATA_DIR, "data.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"\nWrote {out_path}  ({size_kb:.0f} KB)")
    print(f"  {len(inst_order)} unis × {len(all_fields_sorted)} fields × {len(year_dfs)} years")
    print(f"  {len(rankings_list):,} total records")

    # Also write headers.json for backward compat
    hpath = os.path.join(DATA_DIR, "headers.json")
    with open(hpath, "w", encoding="utf-8") as f:
        json.dump(headers, f, indent=2)
    print(f"  Also wrote {hpath}")


if __name__ == "__main__":
    build_data_json()
