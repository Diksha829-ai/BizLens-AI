import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree


# ============================================================
# PATH SETUP
# ============================================================

CURRENT_DIR = Path(__file__).resolve().parent

PROJECT_ROOT = CURRENT_DIR.parent

DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "bizlens_features_v3.csv"
)

# Allow importing category_mapping.py
sys.path.append(str(CURRENT_DIR))

from category_mapping import BIZLENS_CATEGORIES


# ============================================================
# CONSTANTS
# ============================================================

EARTH_RADIUS_M = 6_371_000

RADIUS_500M = 500
RADIUS_1KM = 1000
RADIUS_2KM = 2000

ALL_42_CATEGORIES = list(BIZLENS_CATEGORIES.keys())


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - LOCATION FEATURE GENERATOR")
print("=" * 60)

print("\nLoading OSM feature dataset...")

df = pd.read_csv(DATA_FILE, low_memory=False)

print(f"Rows loaded: {len(df):,}")


# ============================================================
# VALIDATE COORDINATES
# ============================================================

df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
df["lon"] = pd.to_numeric(df["lon"], errors="coerce")

df = df.dropna(subset=["lat", "lon"]).copy()

print(f"Valid coordinate rows: {len(df):,}")


# ============================================================
# CATEGORY VALIDATION
# ============================================================

print("\nBizLens categories configured:", len(ALL_42_CATEGORIES))

if len(ALL_42_CATEGORIES) != 42:
    raise ValueError(
        f"Expected exactly 42 BizLens categories, "
        f"but found {len(ALL_42_CATEGORIES)}"
    )

print("All 42 BizLens categories validated successfully.")


# ============================================================
# GENERAL POI BALL TREE
# ============================================================

print("\nBuilding general POI spatial index...")

all_coords_rad = np.radians(
    df[["lat", "lon"]].to_numpy()
)

all_tree = BallTree(
    all_coords_rad,
    metric="haversine"
)

print("General POI spatial index ready.")


# ============================================================
# CATEGORY SPATIAL INDEXES
# ============================================================

category_trees = {}
category_data = {}

print("\nBuilding category spatial indexes...")

for category in ALL_42_CATEGORIES:

    category_df = df[
        df["bizlens_category"] == category
    ].copy()

    category_data[category] = category_df

    if len(category_df) == 0:
        category_trees[category] = None
        continue

    coords_rad = np.radians(
        category_df[["lat", "lon"]].to_numpy()
    )

    category_trees[category] = BallTree(
        coords_rad,
        metric="haversine"
    )

print("Category spatial indexes ready.")

mapped_categories = [
    category
    for category in ALL_42_CATEGORIES
    if category_trees[category] is not None
]

missing_categories = [
    category
    for category in ALL_42_CATEGORIES
    if category_trees[category] is None
]

print(f"\nCategories with OSM data : {len(mapped_categories)}")
print(f"Categories without data  : {len(missing_categories)}")

if missing_categories:
    print("\nCurrently missing OSM categories:")
    for category in missing_categories:
        print(f"  - {category}")


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def count_points(tree, latitude, longitude, radius_m):
    """
    Count POIs within a radius around a location.
    """

    if tree is None:
        return 0

    location_rad = np.radians(
        [[latitude, longitude]]
    )

    radius_rad = radius_m / EARTH_RADIUS_M

    count = tree.query_radius(
        location_rad,
        r=radius_rad,
        count_only=True
    )[0]

    return int(count)


def nearest_distance(tree, latitude, longitude):
    """
    Return nearest competitor distance in meters.

    Returns 2000 meters when category data is unavailable.
    The separate category_coverage_available feature tells
    the model that the category data was unavailable.
    """

    if tree is None:
        return float(RADIUS_2KM)

    location_rad = np.radians(
        [[latitude, longitude]]
    )

    distance_rad, _ = tree.query(
        location_rad,
        k=1
    )

    distance_m = (
        distance_rad[0][0]
        * EARTH_RADIUS_M
    )

    return float(distance_m)


def calculate_density(count, radius_m):
    """
    Calculate POI density per square kilometer.
    """

    radius_km = radius_m / 1000

    area_km2 = np.pi * (radius_km ** 2)

    return float(count / area_km2)


# ============================================================
# MAIN FEATURE GENERATOR
# ============================================================

def generate_location_features(
    latitude,
    longitude,
    category
):
    """
    Generate the exact geographic feature set required
    by the BizLens ML model.
    """

    # --------------------------------------------------------
    # Validate coordinates
    # --------------------------------------------------------

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        raise ValueError(
            "Latitude and longitude must be numeric."
        )

    if not (-90 <= latitude <= 90):
        raise ValueError(
            "Latitude must be between -90 and 90."
        )

    if not (-180 <= longitude <= 180):
        raise ValueError(
            "Longitude must be between -180 and 180."
        )

    # --------------------------------------------------------
    # Validate category
    # --------------------------------------------------------

    category = str(category).strip().lower()

    if category not in ALL_42_CATEGORIES:
        raise ValueError(
            f"Invalid BizLens category: {category}\n"
            f"Expected one of the 42 configured categories."
        )

    # --------------------------------------------------------
    # General POI counts
    # --------------------------------------------------------

    pois_500m = count_points(
        all_tree,
        latitude,
        longitude,
        RADIUS_500M
    )

    pois_1km = count_points(
        all_tree,
        latitude,
        longitude,
        RADIUS_1KM
    )

    pois_2km = count_points(
        all_tree,
        latitude,
        longitude,
        RADIUS_2KM
    )

    # --------------------------------------------------------
    # Category data
    # --------------------------------------------------------

    category_tree = category_trees[category]

    category_df = category_data[category]

    category_coverage_available = (
        1 if category_tree is not None else 0
    )

    category_poi_count = len(category_df)

    # --------------------------------------------------------
    # Category competition
    # --------------------------------------------------------

    category_competitors_500m = count_points(
        category_tree,
        latitude,
        longitude,
        RADIUS_500M
    )

    category_competitors_1km = count_points(
        category_tree,
        latitude,
        longitude,
        RADIUS_1KM
    )

    category_competitors_2km = count_points(
        category_tree,
        latitude,
        longitude,
        RADIUS_2KM
    )

    # --------------------------------------------------------
    # Nearest competitor
    # --------------------------------------------------------

    nearest_competitor_m = nearest_distance(
        category_tree,
        latitude,
        longitude
    )

    # --------------------------------------------------------
    # Competition ratio
    # --------------------------------------------------------

    competition_ratio = (
        category_competitors_1km
        / max(pois_1km, 1)
    )

    # --------------------------------------------------------
    # General POI density
    # --------------------------------------------------------

    poi_density_500m = calculate_density(
        pois_500m,
        RADIUS_500M
    )

    poi_density_1km = calculate_density(
        pois_1km,
        RADIUS_1KM
    )

    poi_density_2km = calculate_density(
        pois_2km,
        RADIUS_2KM
    )

    # --------------------------------------------------------
    # Category density
    # --------------------------------------------------------

    category_density_500m = calculate_density(
        category_competitors_500m,
        RADIUS_500M
    )

    category_density_1km = calculate_density(
        category_competitors_1km,
        RADIUS_1KM
    )

    category_density_2km = calculate_density(
        category_competitors_2km,
        RADIUS_2KM
    )

    # --------------------------------------------------------
    # EXACT MODEL FEATURES
    # --------------------------------------------------------

    features = {

        # Location
        "lat": latitude,
        "lon": longitude,

        # Category
        "bizlens_category": category,

        # General POI features
        "pois_500m": pois_500m,
        "pois_1km": pois_1km,
        "pois_2km": pois_2km,

        # Competition features
        "competitors_500m": category_competitors_500m,
        "competitors_1km": category_competitors_1km,

        # Competition ratio
        "competition_ratio": competition_ratio,

        # Category context
        "category_poi_count": category_poi_count,
        "category_coverage_available": category_coverage_available,

        # Density features
        "poi_density_500m": poi_density_500m,
        "poi_density_1km": poi_density_1km,
        "poi_density_2km": poi_density_2km,

        "competitor_density_500m": category_density_500m,
        "competitor_density_1km": category_density_1km,

        # Category-specific competition
        "category_competitors_500m":
            category_competitors_500m,

        "category_competitors_1km":
            category_competitors_1km,

        "category_competitors_2km":
            category_competitors_2km,

        # Category-specific density
        "category_density_500m":
            category_density_500m,

        "category_density_1km":
            category_density_1km,

        "category_density_2km":
            category_density_2km,

        # Nearest competitor
        "nearest_competitor_m":
            nearest_competitor_m,
    }

    return features


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("TESTING LOCATION FEATURE GENERATOR")
    print("=" * 60)

    # Pune test location
    latitude = 18.5204
    longitude = 73.8567
    category = "restaurant"

    print(f"\nLatitude : {latitude}")
    print(f"Longitude: {longitude}")
    print(f"Category : {category}")

    features = generate_location_features(
        latitude,
        longitude,
        category
    )

    print("\n" + "=" * 60)
    print("GENERATED FEATURES")
    print("=" * 60)

    for key, value in features.items():
        print(f"{key:35} : {value}")

    print("\n" + "=" * 60)
    print("TESTING ALL 42 CATEGORIES")
    print("=" * 60)

    successful = 0
    failed = 0

    for test_category in ALL_42_CATEGORIES:

        try:

            result = generate_location_features(
                latitude,
                longitude,
                test_category
            )

            successful += 1

            print(
                f"[OK]   {test_category:25} "
                f"coverage={result['category_coverage_available']}"
            )

        except Exception as error:

            failed += 1

            print(
                f"[FAIL] {test_category:25} "
                f"{error}"
            )

    print("\n" + "=" * 60)
    print("FINAL TEST RESULT")
    print("=" * 60)

    print(f"Total categories : {len(ALL_42_CATEGORIES)}")
    print(f"Successful       : {successful}")
    print(f"Failed           : {failed}")

    if successful == 42 and failed == 0:
        print("\nALL 42 CATEGORY TESTS PASSED.")
        print("Location feature generation successful.")
    else:
        print("\nSome category tests failed.")