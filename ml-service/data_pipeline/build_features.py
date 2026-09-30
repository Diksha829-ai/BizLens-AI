import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.neighbors import BallTree

print("=" * 60)
print("BIZLENS AI - GEOGRAPHIC FEATURE ENGINEERING")
print("=" * 60)

# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

INPUT_FILE = Path("../data/processed/osm_pois_clean.csv")
OUTPUT_DIR = Path("../data/processed")
OUTPUT_FILE = OUTPUT_DIR / "osm_features.csv"

# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

print("\nLoading cleaned OSM dataset...")

df = pd.read_csv(INPUT_FILE, low_memory=False)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")

# ---------------------------------------------------------
# COORDINATES
# ---------------------------------------------------------

print("\nPreparing coordinates...")

df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
df["lon"] = pd.to_numeric(df["lon"], errors="coerce")

df = df.dropna(
    subset=["lat", "lon"]
).reset_index(drop=True)

print(f"Valid locations: {len(df):,}")

coordinates = np.radians(
    df[["lat", "lon"]].values
)

EARTH_RADIUS = 6_371_000

# One spatial index for ALL POIs
tree = BallTree(
    coordinates,
    metric="haversine"
)

print("Spatial index created.")

# ---------------------------------------------------------
# GENERAL POI DENSITY
# ---------------------------------------------------------

print("\nCalculating general POI density...")

def count_all_within(radius_m):

    radius = radius_m / EARTH_RADIUS

    counts = tree.query_radius(
        coordinates,
        r=radius,
        count_only=True
    )

    # Remove the current POI itself
    return counts - 1


df["pois_500m"] = count_all_within(500)

print("  500m density complete")

df["pois_1km"] = count_all_within(1000)

print("  1km density complete")

df["pois_2km"] = count_all_within(2000)

print("  2km density complete")

# ---------------------------------------------------------
# CATEGORY COUNTS
# ---------------------------------------------------------

print("\nCalculating category features...")

def add_category_feature(
    feature_name,
    keyword,
    radius_m=1000
):

    mask = (
        df["osm_category"]
        .fillna("")
        .str.contains(
            keyword,
            case=False,
            regex=False
        )
    )

    category_coordinates = coordinates[
        mask.values
    ]

    if len(category_coordinates) == 0:

        df[feature_name] = 0

        return

    category_tree = BallTree(
        category_coordinates,
        metric="haversine"
    )

    radius = radius_m / EARTH_RADIUS

    counts = category_tree.query_radius(
        coordinates,
        r=radius,
        count_only=True
    )

    df[feature_name] = counts


# ---------------------------------------------------------
# IMPORTANT BUSINESS CATEGORIES
# ---------------------------------------------------------

categories = {

    "restaurants_1km": "restaurant",

    "cafes_1km": "cafe",

    "schools_1km": "school",

    "colleges_1km": "college",

    "hospitals_1km": "hospital",

    "clinics_1km": "clinic",

    "pharmacies_1km": "pharmacy",

    "banks_1km": "bank",

    "hotels_1km": "hotel",

    "shops_1km": "shop",

    "parking_1km": "parking",

    "gyms_1km": "fitness"
}


for feature_name, keyword in categories.items():

    print(f"  Calculating {feature_name}...")

    add_category_feature(
        feature_name,
        keyword,
        1000
    )


# ---------------------------------------------------------
# SAME-CATEGORY COMPETITION
# ---------------------------------------------------------

print("\nCalculating same-category competition...")

df["competitors_500m"] = 0
df["competitors_1km"] = 0

# Group locations by exact OSM category
category_groups = df.groupby(
    "osm_category",
    dropna=False
).groups

print(
    f"Unique OSM categories: "
    f"{len(category_groups):,}"
)

for category, indices in category_groups.items():

    indices = np.asarray(indices)

    if len(indices) <= 1:
        continue

    category_coordinates = coordinates[
        indices
    ]

    category_tree = BallTree(
        category_coordinates,
        metric="haversine"
    )

    # -----------------------------------------------------
    # 500 METERS
    # -----------------------------------------------------

    radius_500 = 500 / EARTH_RADIUS

    counts_500 = category_tree.query_radius(
        category_coordinates,
        r=radius_500,
        count_only=True
    )

    # Remove itself
    counts_500 = counts_500 - 1

    df.loc[
        indices,
        "competitors_500m"
    ] = counts_500

    # -----------------------------------------------------
    # 1 KILOMETER
    # -----------------------------------------------------

    radius_1km = 1000 / EARTH_RADIUS

    counts_1km = category_tree.query_radius(
        category_coordinates,
        r=radius_1km,
        count_only=True
    )

    # Remove itself
    counts_1km = counts_1km - 1

    df.loc[
        indices,
        "competitors_1km"
    ] = counts_1km


print("Same-category competition complete.")

# ---------------------------------------------------------
# COMPETITION RATIO
# ---------------------------------------------------------

df["competition_ratio"] = (
    df["competitors_1km"] /
    (df["pois_1km"] + 1)
)

# ---------------------------------------------------------
# SAVE DATASET
# ---------------------------------------------------------

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

print("\nSaving feature dataset...")

df.to_csv(
    OUTPUT_FILE,
    index=False
)

# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("GEOGRAPHIC FEATURE ENGINEERING COMPLETE")
print("=" * 60)

print(f"\nFinal rows: {len(df):,}")
print(f"Final columns: {len(df.columns)}")

print("\nCreated features:")

features = [
    "pois_500m",
    "pois_1km",
    "pois_2km",
    "restaurants_1km",
    "cafes_1km",
    "schools_1km",
    "colleges_1km",
    "hospitals_1km",
    "clinics_1km",
    "pharmacies_1km",
    "banks_1km",
    "hotels_1km",
    "shops_1km",
    "parking_1km",
    "gyms_1km",
    "competitors_500m",
    "competitors_1km",
    "competition_ratio"
]

for feature in features:
    print(f"  {feature}")

print("\nOutput file:")
print(OUTPUT_FILE)

print("\nDone!")