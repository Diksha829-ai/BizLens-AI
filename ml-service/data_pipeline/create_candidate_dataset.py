import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = Path("../data/processed/bizlens_features_v3.csv")
OUTPUT_FILE = Path("../data/processed/candidate_locations_v2.csv")


# ============================================================
# REQUIRED COLUMNS
# ============================================================

COLUMNS = [
    "lat",
    "lon",
    "bizlens_category",

    # General geographic features
    "pois_500m",
    "pois_1km",
    "pois_2km",

    # General competition features
    "competitors_500m",
    "competitors_1km",
    "nearest_competitor_m",
    "competition_ratio",

    # Category context
    "category_poi_count",
    "category_coverage_available",

    # General density features
    "poi_density_500m",
    "poi_density_1km",
    "poi_density_2km",
    "competitor_density_500m",
    "competitor_density_1km",

    # True category-specific competition
    "category_competitors_500m",
    "category_competitors_1km",
    "category_competitors_2km",

    # True category-specific density
    "category_density_500m",
    "category_density_1km",
    "category_density_2km",
]


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - UPDATED CANDIDATE DATASET")
print("=" * 60)

print()
print("Loading BizLens feature dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")
print()


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

missing_columns = [
    column
    for column in COLUMNS
    if column not in df.columns
]

if missing_columns:

    print("Missing required columns:")

    for column in missing_columns:
        print(f"  - {column}")

    raise ValueError(
        "Required columns are missing."
    )


# ============================================================
# SELECT MAPPED BUSINESS LOCATIONS
# ============================================================

print("Selecting mapped BizLens business locations...")

candidate_df = df[
    df["bizlens_category"].notna()
    & (df["bizlens_category"] != "unmapped")
].copy()

print(
    f"Mapped candidate locations: "
    f"{len(candidate_df):,}"
)

print()


# ============================================================
# SELECT COLUMNS
# ============================================================

candidate_df = candidate_df[
    COLUMNS
].copy()


# ============================================================
# VALIDATE COORDINATES
# ============================================================

print("Validating coordinates...")

candidate_df["lat"] = pd.to_numeric(
    candidate_df["lat"],
    errors="coerce"
)

candidate_df["lon"] = pd.to_numeric(
    candidate_df["lon"],
    errors="coerce"
)

before = len(candidate_df)

candidate_df = candidate_df.dropna(
    subset=["lat", "lon"]
)

after = len(candidate_df)

removed = before - after

print(f"Removed invalid coordinates: {removed:,}")
print()


# ============================================================
# SAVE
# ============================================================

candidate_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("=" * 60)
print("UPDATED CANDIDATE DATASET CREATED")
print("=" * 60)

print()
print(f"Candidate rows : {len(candidate_df):,}")
print(f"Columns        : {len(candidate_df.columns)}")

print()
print("Columns:")

for column in candidate_df.columns:
    print(f"  {column}")

print()
print("Category distribution:")

print(
    candidate_df["bizlens_category"]
    .value_counts()
)

print()
print("Output file:")
print(OUTPUT_FILE)

print()
print("Done!")