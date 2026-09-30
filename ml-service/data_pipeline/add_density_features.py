import pandas as pd
import numpy as np

from pathlib import Path


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = Path("../data/processed/bizlens_features.csv")
OUTPUT_FILE = Path("../data/processed/bizlens_features_v2.csv")


# ============================================================
# CONSTANTS
# ============================================================

# Area of a circle:
# area = pi * radius^2
#
# Radius is converted to square kilometres.

AREA_500M_KM2 = np.pi * (0.5 ** 2)
AREA_1KM_KM2 = np.pi * (1.0 ** 2)
AREA_2KM_KM2 = np.pi * (2.0 ** 2)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - DENSITY FEATURE ENGINEERING")
print("=" * 60)

print()
print("Loading BizLens feature dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")
print()


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_columns = [
    "pois_500m",
    "pois_1km",
    "pois_2km",
    "competitors_500m",
    "competitors_1km",
    "category_poi_count",
]

missing_columns = [
    col for col in required_columns
    if col not in df.columns
]

if missing_columns:
    print("Missing required columns:")

    for col in missing_columns:
        print(f"  - {col}")

    raise ValueError("Required columns are missing.")


# ============================================================
# GENERAL POI DENSITY
# ============================================================

print("Calculating general POI density...")

df["poi_density_500m"] = (
    df["pois_500m"] / AREA_500M_KM2
)

df["poi_density_1km"] = (
    df["pois_1km"] / AREA_1KM_KM2
)

df["poi_density_2km"] = (
    df["pois_2km"] / AREA_2KM_KM2
)


# ============================================================
# COMPETITOR DENSITY
# ============================================================

print("Calculating competitor density...")

df["competitor_density_500m"] = (
    df["competitors_500m"] / AREA_500M_KM2
)

df["competitor_density_1km"] = (
    df["competitors_1km"] / AREA_1KM_KM2
)


# ============================================================
# CATEGORY DENSITY
# ============================================================

print("Calculating category density...")

# category_poi_count represents the total mapped POIs
# belonging to the selected BizLens category in the dataset.
#
# We use it as a category-context feature.
#
# NOTE:
# This is not a radius-specific count.

df["category_density_context"] = (
    df["category_poi_count"] / AREA_1KM_KM2
)


# ============================================================
# CLEAN VALUES
# ============================================================

print("Cleaning feature values...")

numeric_columns = [
    "poi_density_500m",
    "poi_density_1km",
    "poi_density_2km",
    "competitor_density_500m",
    "competitor_density_1km",
    "category_density_context",
]

for column in numeric_columns:

    df[column] = df[column].replace(
        [np.inf, -np.inf],
        np.nan
    )

    df[column] = df[column].fillna(0)


# ============================================================
# ROUNDING
# ============================================================

for column in numeric_columns:
    df[column] = df[column].round(4)


# ============================================================
# SAVE
# ============================================================

print()
print("Saving enhanced feature dataset...")

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 60)
print("DENSITY FEATURE ENGINEERING COMPLETE")
print("=" * 60)

print()
print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")

print()
print("New features:")

for column in numeric_columns:
    print(f"  {column}")

print()
print("Output file:")
print(OUTPUT_FILE)

print()
print("Done!")