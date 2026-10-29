
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

ROOT = Path(__file__).resolve().parent

DATA_FILE = (
    ROOT / "data" / "processed" / "bizlens_features_v3.csv"
)

LATITUDE = 16.690828
LONGITUDE = 74.220178
RADIUS_M = 1000
EARTH_RADIUS_M = 6_371_000

df = pd.read_csv(DATA_FILE, low_memory=False)

df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
df["lon"] = pd.to_numeric(df["lon"], errors="coerce")

df = df.dropna(subset=["lat", "lon"]).copy()

coords = np.radians(df[["lat", "lon"]].to_numpy())
tree = BallTree(coords, metric="haversine")

location = np.radians([[LATITUDE, LONGITUDE]])

radius_rad = RADIUS_M / EARTH_RADIUS_M

indices = tree.query_radius(location, r=radius_rad)[0]
nearby = df.iloc[indices].copy()


print("\nNearby rows with category and OSM tags:")

columns = [
    col for col in [
        "id",
        "name",
        "lat",
        "lon",
        "osm_category",
        "osm_subcategory",
        "amenity",
        "shop",
        "bizlens_category",
    ]
    if col in nearby.columns
]

print(
    nearby[columns]
    .sort_values("bizlens_category")
    .to_string(index=False)
)

print("\nOSM category distribution within 1 km:")
if "osm_category" in nearby.columns:
    print(
        nearby["osm_category"]
        .value_counts(dropna=False)
        .to_string()
    )

print("\nOSM subcategory distribution within 1 km:")
if "osm_subcategory" in nearby.columns:
    print(
        nearby["osm_subcategory"]
        .value_counts(dropna=False)
        .to_string()
    )

print("\nUnmapped named businesses:")
if "bizlens_category" in nearby.columns:
    unmapped = nearby[
        nearby["bizlens_category"]
        .astype(str)
        .str.strip()
        .str.lower()
        .eq("unmapped")
    ]

    if "name" in unmapped.columns:
        unmapped = unmapped[unmapped["name"].notna()]

    print(unmapped[columns].to_string(index=False))

print("\nCategory distribution:")
print(nearby["bizlens_category"].value_counts(dropna=False))

print("\nPharmacy rows within 1 km:")
pharmacies = nearby[
    nearby["bizlens_category"].astype(str).str.strip().str.lower()
    == "pharmacy"
]

columns = [
    col for col in [
        "id", "name", "lat", "lon",
        "osm_category", "osm_subcategory",
        "amenity", "bizlens_category"
    ]
    if col in pharmacies.columns
]

print(pharmacies[columns].to_string(index=False))

print("\nStored features for nearby rows:")
feature_columns = [
    col for col in [
        "id", "name", "bizlens_category",
        "competitors_1km", "nearest_competitor_m",
        "category_competitors_1km"
    ]
    if col in nearby.columns
]

print(nearby[feature_columns].head(30).to_string(index=False))
