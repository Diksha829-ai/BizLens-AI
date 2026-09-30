import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.neighbors import BallTree

from category_mapping import BIZLENS_CATEGORIES


# ============================================================
# BIZLENS AI - CATEGORY-AWARE FEATURE ENGINEERING
# ============================================================

INPUT_FILE = Path("../data/processed/osm_pois_clean.csv")
OUTPUT_DIR = Path("../data/processed")
OUTPUT_FILE = OUTPUT_DIR / "bizlens_features.csv"

EARTH_RADIUS = 6_371_000


print("=" * 60)
print("BIZLENS AI - CATEGORY-AWARE FEATURE ENGINEERING")
print("=" * 60)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading cleaned OSM dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")


# ============================================================
# COORDINATES
# ============================================================

print("\nPreparing coordinates...")

df["lat"] = pd.to_numeric(
    df["lat"],
    errors="coerce"
)

df["lon"] = pd.to_numeric(
    df["lon"],
    errors="coerce"
)

df = df.dropna(
    subset=["lat", "lon"]
).reset_index(drop=True)

print(f"Valid locations: {len(df):,}")


coordinates = np.radians(
    df[["lat", "lon"]].values
)


# ============================================================
# SPATIAL INDEX
# ============================================================

print("\nCreating spatial index...")

tree = BallTree(
    coordinates,
    metric="haversine"
)

print("Spatial index created.")


# ============================================================
# OSM → BIZLENS CATEGORY
# ============================================================

print("\nMapping OSM categories to BizLens categories...")

osm_category = (
    df["osm_category"]
    .fillna("")
    .astype(str)
    .str.lower()
)

df["bizlens_category"] = "unmapped"


for category, tags in BIZLENS_CATEGORIES.items():

    tags = [
        tag.lower()
        for tag in tags
    ]

    mask = osm_category.isin(tags)

    assign_mask = (
        mask &
        (df["bizlens_category"] == "unmapped")
    )

    df.loc[
        assign_mask,
        "bizlens_category"
    ] = category


mapped = (
    df["bizlens_category"] != "unmapped"
).sum()

unmapped = (
    df["bizlens_category"] == "unmapped"
).sum()


print("\nMapping summary:")
print(f"Mapped POIs   : {mapped:,}")
print(f"Unmapped POIs : {unmapped:,}")


# ============================================================
# GENERAL POI DENSITY
# ============================================================

print("\nCalculating general location features...")


def calculate_density(radius_m):

    radius = radius_m / EARTH_RADIUS

    result = tree.query_radius(
        coordinates,
        r=radius,
        count_only=True
    )

    return result - 1


df["pois_500m"] = calculate_density(500)

print("  POIs within 500m complete")


df["pois_1km"] = calculate_density(1000)

print("  POIs within 1km complete")


df["pois_2km"] = calculate_density(2000)

print("  POIs within 2km complete")


# ============================================================
# CATEGORY COVERAGE
# ============================================================

print("\nCalculating category coverage...")


category_counts = (
    df[
        df["bizlens_category"] != "unmapped"
    ]
    ["bizlens_category"]
    .value_counts()
)


df["category_poi_count"] = (
    df["bizlens_category"]
    .map(category_counts)
    .fillna(0)
    .astype(int)
)


df["category_coverage_available"] = (
    df["category_poi_count"] > 0
).astype(int)


# ============================================================
# CATEGORY COMPETITION
# ============================================================

print("\nCalculating category-specific competition...")

df["competitors_500m"] = 0

df["competitors_1km"] = 0

df["nearest_competitor_m"] = np.nan


category_groups = (
    df[
        df["bizlens_category"] != "unmapped"
    ]
    .groupby(
        "bizlens_category"
    ).groups
)


print(
    f"Categories with mapped POIs: "
    f"{len(category_groups)}"
)


for number, (category, indices) in enumerate(
    category_groups.items(),
    start=1
):

    indices = np.asarray(indices)

    print(
        f"  [{number}/{len(category_groups)}] "
        f"{category}: "
        f"{len(indices):,} locations"
    )


    # --------------------------------------------------------
    # NOT ENOUGH DATA
    # --------------------------------------------------------

    if len(indices) <= 1:
        continue


    category_coordinates = (
        coordinates[indices]
    )


    category_tree = BallTree(
        category_coordinates,
        metric="haversine"
    )


    # --------------------------------------------------------
    # 500m
    # --------------------------------------------------------

    radius_500 = (
        500 /
        EARTH_RADIUS
    )


    counts_500 = (
        category_tree.query_radius(
            category_coordinates,
            r=radius_500,
            count_only=True
        )
    )


    counts_500 = counts_500 - 1


    df.loc[
        indices,
        "competitors_500m"
    ] = counts_500


    # --------------------------------------------------------
    # 1km
    # --------------------------------------------------------

    radius_1km = (
        1000 /
        EARTH_RADIUS
    )


    counts_1km = (
        category_tree.query_radius(
            category_coordinates,
            r=radius_1km,
            count_only=True
        )
    )


    counts_1km = counts_1km - 1


    df.loc[
        indices,
        "competitors_1km"
    ] = counts_1km


    # --------------------------------------------------------
    # NEAREST COMPETITOR
    # --------------------------------------------------------

    distances, _ = (
        category_tree.query(
            category_coordinates,
            k=2
        )
    )


    nearest_distance = (
        distances[:, 1] *
        EARTH_RADIUS
    )


    df.loc[
        indices,
        "nearest_competitor_m"
    ] = nearest_distance


# ============================================================
# COMPETITION RATIO
# ============================================================

df["competition_ratio"] = (
    df["competitors_1km"] /
    (df["pois_1km"] + 1)
)


# ============================================================
# SAVE
# ============================================================

print("\nSaving BizLens feature dataset...")

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("BIZLENS FEATURE ENGINEERING COMPLETE")
print("=" * 60)

print(
    f"\nFinal rows    : {len(df):,}"
)

print(
    f"Final columns : {len(df.columns)}"
)


print("\nCategory distribution:")

print(
    df[
        "bizlens_category"
    ]
    .value_counts()
)


print("\nOutput file:")

print(
    OUTPUT_FILE
)

print("\nDone!")