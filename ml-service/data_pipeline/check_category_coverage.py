import pandas as pd
from pathlib import Path

from category_mapping import BIZLENS_CATEGORIES


# ============================================================
# BIZLENS AI - CATEGORY COVERAGE ANALYSIS
# ============================================================

INPUT_FILE = Path("../data/processed/osm_pois_clean.csv")
OUTPUT_FILE = Path("../data/processed/category_coverage.csv")


print("=" * 60)
print("BIZLENS AI - CATEGORY COVERAGE ANALYSIS")
print("=" * 60)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading cleaned OSM dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(f"Rows: {len(df):,}")


# ============================================================
# NORMALIZE OSM CATEGORY
# ============================================================

osm_categories = (
    df["osm_category"]
    .fillna("")
    .astype(str)
    .str.lower()
)


# ============================================================
# CHECK EACH BIZLENS CATEGORY
# ============================================================

results = []


for category, osm_tags in BIZLENS_CATEGORIES.items():

    matched_mask = osm_categories.isin(
        [tag.lower() for tag in osm_tags]
    )

    matched_count = int(
        matched_mask.sum()
    )

    results.append({
        "bizlens_category": category,
        "osm_tags": ", ".join(osm_tags),
        "matched_pois": matched_count
    })


# ============================================================
# CREATE RESULT DATAFRAME
# ============================================================

coverage = pd.DataFrame(results)


# ============================================================
# COVERAGE STATUS
# ============================================================

def get_status(count):

    if count >= 100:
        return "GOOD"

    elif count >= 20:
        return "LOW"

    elif count > 0:
        return "VERY_LOW"

    else:
        return "NO_DATA"


coverage["coverage_status"] = (
    coverage["matched_pois"]
    .apply(get_status)
)


# ============================================================
# SAVE
# ============================================================

coverage.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# DISPLAY RESULTS
# ============================================================

print("\nCategory coverage:")
print("-" * 60)

for _, row in coverage.iterrows():

    print(
        f"{row['bizlens_category']:20s} "
        f"{row['matched_pois']:6d} POIs   "
        f"{row['coverage_status']}"
    )


# ============================================================
# SUMMARY
# ============================================================

good = (
    coverage["coverage_status"] == "GOOD"
).sum()

low = (
    coverage["coverage_status"] == "LOW"
).sum()

very_low = (
    coverage["coverage_status"] == "VERY_LOW"
).sum()

no_data = (
    coverage["coverage_status"] == "NO_DATA"
).sum()


print("\n" + "=" * 60)
print("COVERAGE SUMMARY")
print("=" * 60)

print(f"\nTotal categories : {len(coverage)}")
print(f"GOOD             : {good}")
print(f"LOW              : {low}")
print(f"VERY LOW         : {very_low}")
print(f"NO DATA          : {no_data}")

print("\nOutput:")
print(OUTPUT_FILE)

print("\nDone!")