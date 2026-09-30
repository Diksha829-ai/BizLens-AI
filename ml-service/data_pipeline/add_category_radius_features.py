import pandas as pd
import numpy as np

from pathlib import Path
from sklearn.neighbors import BallTree


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = Path("../data/processed/bizlens_features_v2.csv")
OUTPUT_FILE = Path("../data/processed/bizlens_features_v3.csv")


# ============================================================
# CONSTANTS
# ============================================================

EARTH_RADIUS_M = 6_371_000

RADIUS_500M = 500
RADIUS_1KM = 1_000
RADIUS_2KM = 2_000


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - CATEGORY RADIUS FEATURES")
print("=" * 60)

print()
print("Loading feature dataset...")

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

required_columns = [
    "lat",
    "lon",
    "bizlens_category"
]

missing_columns = [
    column
    for column in required_columns
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
# PREPARE COORDINATES
# ============================================================

print("Preparing coordinates...")

df["lat"] = pd.to_numeric(
    df["lat"],
    errors="coerce"
)

df["lon"] = pd.to_numeric(
    df["lon"],
    errors="coerce"
)

valid_coordinates = (
    df["lat"].notna()
    & df["lon"].notna()
)

df = df.loc[
    valid_coordinates
].copy()

print(
    f"Valid locations: {len(df):,}"
)

print()


# ============================================================
# INITIALIZE FEATURES
# ============================================================

df["category_competitors_500m"] = 0
df["category_competitors_1km"] = 0
df["category_competitors_2km"] = 0

df["category_density_500m"] = 0.0
df["category_density_1km"] = 0.0
df["category_density_2km"] = 0.0


# ============================================================
# CATEGORY LIST
# ============================================================

categories = sorted(
    [
        category
        for category in df["bizlens_category"].dropna().unique()
        if category != "unmapped"
    ]
)

print(
    f"Categories with mapped POIs: {len(categories)}"
)

print()


# ============================================================
# PROCESS EACH CATEGORY
# ============================================================

for index, category in enumerate(
    categories,
    start=1
):

    print(
        f"[{index}/{len(categories)}] "
        f"Processing: {category}"
    )

    category_mask = (
        df["bizlens_category"] == category
    )

    category_indices = df.index[
        category_mask
    ]

    if len(category_indices) == 0:
        continue

    category_data = df.loc[
        category_indices,
        ["lat", "lon"]
    ].to_numpy()

    # Convert degrees to radians
    category_coords_rad = np.radians(
        category_data
    )

    # BallTree using haversine distance
    tree = BallTree(
        category_coords_rad,
        metric="haversine"
    )

    # Query ONLY locations belonging to this category.
    #
    # The location itself will be included in the result.
    # We subtract 1 from the count to exclude itself.

    for radius_m, feature_name in [
        (
            RADIUS_500M,
            "category_competitors_500m"
        ),
        (
            RADIUS_1KM,
            "category_competitors_1km"
        ),
        (
            RADIUS_2KM,
            "category_competitors_2km"
        )
    ]:

        radius_rad = (
            radius_m / EARTH_RADIUS_M
        )

        neighbour_counts = tree.query_radius(
            category_coords_rad,
            r=radius_rad,
            count_only=True
        )

        neighbour_counts = np.maximum(
            neighbour_counts - 1,
            0
        )

        df.loc[
            category_indices,
            feature_name
        ] = neighbour_counts


# ============================================================
# CALCULATE CATEGORY DENSITY
# ============================================================

print()
print("Calculating category density...")


AREA_500M_KM2 = np.pi * (0.5 ** 2)
AREA_1KM_KM2 = np.pi * (1.0 ** 2)
AREA_2KM_KM2 = np.pi * (2.0 ** 2)


df["category_density_500m"] = (
    df["category_competitors_500m"]
    / AREA_500M_KM2
)

df["category_density_1km"] = (
    df["category_competitors_1km"]
    / AREA_1KM_KM2
)

df["category_density_2km"] = (
    df["category_competitors_2km"]
    / AREA_2KM_KM2
)


# ============================================================
# CLEAN VALUES
# ============================================================

density_columns = [
    "category_density_500m",
    "category_density_1km",
    "category_density_2km"
]

for column in density_columns:

    df[column] = df[column].replace(
        [np.inf, -np.inf],
        np.nan
    )

    df[column] = df[column].fillna(0)

    df[column] = df[column].round(4)


# ============================================================
# SAVE
# ============================================================

print()
print("Saving enhanced dataset...")

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 60)
print("CATEGORY RADIUS FEATURES COMPLETE")
print("=" * 60)

print()
print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")

print()
print("New features:")

new_features = [
    "category_competitors_500m",
    "category_competitors_1km",
    "category_competitors_2km",
    "category_density_500m",
    "category_density_1km",
    "category_density_2km"
]

for feature in new_features:
    print(f"  {feature}")

print()
print("Output file:")
print(OUTPUT_FILE)

print()
print("Done!")