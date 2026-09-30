from pathlib import Path
import pandas as pd


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = Path("../data/processed/osm_pois.csv")
OUTPUT_DIR = Path("../data/processed")
OUTPUT_FILE = OUTPUT_DIR / "osm_pois_clean.csv"


# ============================================================
# START
# ============================================================

print("=" * 60)
print("BIZLENS AI - OSM DATA PREPROCESSING")
print("=" * 60)


# ============================================================
# CHECK INPUT
# ============================================================

if not INPUT_FILE.exists():
    print("\nERROR: Input CSV not found!")
    print("Expected:")
    print(INPUT_FILE.resolve())
    raise SystemExit


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading OSM POI dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(f"Original rows: {len(df):,}")
print(f"Original columns: {len(df.columns)}")


# ============================================================
# 1. VALIDATE COORDINATES
# ============================================================

print("\nChecking coordinates...")

df["lat"] = pd.to_numeric(
    df["lat"],
    errors="coerce"
)

df["lon"] = pd.to_numeric(
    df["lon"],
    errors="coerce"
)

before = len(df)

df = df.dropna(
    subset=["lat", "lon"]
)

# Valid latitude / longitude ranges
df = df[
    (df["lat"] >= -90) &
    (df["lat"] <= 90) &
    (df["lon"] >= -180) &
    (df["lon"] <= 180)
]

print(f"Rows after coordinate validation: {len(df):,}")
print(f"Removed: {before - len(df):,}")


# ============================================================
# 2. REMOVE EXACT DUPLICATES
# ============================================================

print("\nRemoving exact duplicate rows...")

before = len(df)

df = df.drop_duplicates()

print(f"Duplicates removed: {before - len(df):,}")
print(f"Rows remaining: {len(df):,}")


# ============================================================
# 3. NORMALIZE NAME
# ============================================================

print("\nCleaning names...")

if "name" in df.columns:

    df["name"] = (
        df["name"]
        .fillna("")
        .astype(str)
        .str.strip()
    )


# ============================================================
# 4. NORMALIZE IMPORTANT OSM CATEGORY FIELDS
# ============================================================

category_columns = [
    "amenity",
    "shop",
    "office",
    "tourism",
    "craft",
    "building",
    "landuse"
]

print("\nNormalizing category fields...")

for column in category_columns:

    if column in df.columns:

        df[column] = (
            df[column]
            .fillna("")
            .astype(str)
            .str.strip()
            .str.lower()
        )


# ============================================================
# 5. CREATE A GENERAL OSM CATEGORY
# ============================================================

print("\nCreating normalized OSM category...")

def get_osm_category(row):

    for column in [
        "amenity",
        "shop",
        "office",
        "tourism",
        "craft",
        "building",
        "landuse"
    ]:

        if column in row.index:

            value = row[column]

            if pd.notna(value) and str(value).strip():

                return f"{column}:{str(value).strip()}"

    return "unknown"


df["osm_category"] = df.apply(
    get_osm_category,
    axis=1
)


# ============================================================
# 6. CREATE SIMPLE DISPLAY CATEGORY
# ============================================================

df["osm_subcategory"] = (
    df["osm_category"]
    .str.split(":", n=1)
    .str[-1]
)


# ============================================================
# 7. KEEP USEFUL COLUMNS
# ============================================================

preferred_columns = [
    "id",
    "name",
    "lat",
    "lon",
    "osm_type",
    "osm_category",
    "osm_subcategory",
    "amenity",
    "shop",
    "office",
    "tourism",
    "craft",
    "building",
    "landuse",
    "opening_hours",
    "website",
    "phone",
    "addr:city",
    "addr:postcode",
    "addr:street"
]

available_columns = [
    column
    for column in preferred_columns
    if column in df.columns
]

clean_df = df[available_columns].copy()


# ============================================================
# 8. REMOVE UNKNOWN CATEGORY RECORDS
# ============================================================

print("\nChecking unknown categories...")

unknown_count = (
    clean_df["osm_category"] == "unknown"
).sum()

print(f"Unknown category rows: {unknown_count:,}")

# We DO NOT remove them yet.
# They may become useful later through other OSM tags.


# ============================================================
# 9. SAVE CLEAN DATASET
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

print("\nSaving cleaned dataset...")

clean_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# FINAL REPORT
# ============================================================

print("\n" + "=" * 60)
print("PREPROCESSING COMPLETE")
print("=" * 60)

print(f"\nOriginal rows: {len(df):,}")
print(f"Clean rows: {len(clean_df):,}")
print(f"Columns: {len(clean_df.columns):,}")

print("\nOutput file:")
print(OUTPUT_FILE.resolve())

print("\nTop OSM categories:")

print(
    clean_df["osm_category"]
    .value_counts()
    .head(30)
    .to_string()
)

print("\nDone!")