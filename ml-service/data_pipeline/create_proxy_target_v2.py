import pandas as pd
import numpy as np

from pathlib import Path


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = Path(
    "../data/processed/candidate_locations_v2.csv"
)

OUTPUT_FILE = Path(
    "../data/processed/candidate_locations_labeled_v2.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - PROXY OPPORTUNITY TARGET V2")
print("=" * 60)

print()
print("Loading candidate dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")
print()


# ============================================================
# REQUIRED FEATURES
# ============================================================

REQUIRED_COLUMNS = [
    "pois_500m",
    "pois_1km",
    "pois_2km",

    "category_competitors_500m",
    "category_competitors_1km",
    "category_competitors_2km",

    "category_density_500m",
    "category_density_1km",
    "category_density_2km",

    "nearest_competitor_m",

    "category_coverage_available"
]


missing_columns = [
    column
    for column in REQUIRED_COLUMNS
    if column not in df.columns
]

if missing_columns:

    print("ERROR: Missing required columns:")

    for column in missing_columns:
        print(f"  - {column}")

    raise ValueError(
        "Required features are missing."
    )


# ============================================================
# CLEAN NUMERIC FEATURES
# ============================================================

print("Preparing geographic indicators...")

for column in REQUIRED_COLUMNS:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )

    df[column] = df[column].replace(
        [np.inf, -np.inf],
        np.nan
    )

    df[column] = df[column].fillna(0)


# ============================================================
# PERCENTILE NORMALIZATION
# ============================================================

def percentile_rank(series):
    """
    Convert a feature into a 0-1 percentile score.
    """

    return series.rank(
        pct=True,
        method="average"
    )


# ============================================================
# DEMAND PROXY
# ============================================================

print("Calculating demand proxy...")

pois_500m_score = percentile_rank(
    df["pois_500m"]
)

pois_1km_score = percentile_rank(
    df["pois_1km"]
)

pois_2km_score = percentile_rank(
    df["pois_2km"]
)


# More nearby POIs are treated as a proxy for
# greater surrounding activity / demand.

demand_proxy = (
    0.40 * pois_500m_score
    + 0.40 * pois_1km_score
    + 0.20 * pois_2km_score
)


# ============================================================
# CATEGORY COMPETITION PRESSURE
# ============================================================

print("Calculating category competition pressure...")

category_competition_500m = percentile_rank(
    df["category_competitors_500m"]
)

category_competition_1km = percentile_rank(
    df["category_competitors_1km"]
)

category_competition_2km = percentile_rank(
    df["category_competitors_2km"]
)


# Weighted category competition.

competition_pressure = (
    0.50 * category_competition_500m
    + 0.35 * category_competition_1km
    + 0.15 * category_competition_2km
)


# ============================================================
# COMPETITION DISTANCE
# ============================================================

print("Calculating competition distance score...")

distance_score = percentile_rank(
    df["nearest_competitor_m"]
)


# Larger distance from nearest competitor
# contributes positively to opportunity.

competition_distance_score = distance_score


# ============================================================
# CATEGORY COVERAGE
# ============================================================

coverage_score = (
    df["category_coverage_available"]
    .clip(0, 1)
)


# ============================================================
# RAW OPPORTUNITY SCORE
# ============================================================

print("Calculating raw opportunity score...")


# Interpretation:
#
# Demand:
#   45%
#
# Lower category competition:
#   30%
#
# Distance from nearest competitor:
#   15%
#
# OSM category coverage:
#   10%

raw_score = (
    0.45 * demand_proxy
    + 0.30 * (1 - competition_pressure)
    + 0.15 * competition_distance_score
    + 0.10 * coverage_score
)


# ============================================================
# NORMALIZE TO 0-100
# ============================================================

print("Normalizing opportunity score to 0-100...")

min_score = raw_score.min()
max_score = raw_score.max()

if max_score == min_score:

    df["opportunity_score"] = 50.0

else:

    df["opportunity_score"] = (
        (raw_score - min_score)
        / (max_score - min_score)
        * 100
    )


df["opportunity_score"] = (
    df["opportunity_score"]
    .clip(0, 100)
    .round(2)
)


# ============================================================
# PROXY SUCCESS LABEL
# ============================================================

# Locations scoring 60 or above are classified
# as high-opportunity locations.

df["proxy_success"] = (
    df["opportunity_score"] >= 60
).astype(int)


# ============================================================
# SAVE INTERMEDIATE COMPONENTS
# ============================================================

df["demand_proxy"] = (
    demand_proxy.round(4)
)

df["competition_pressure"] = (
    competition_pressure.round(4)
)

df["competition_distance_score"] = (
    competition_distance_score.round(4)
)


# ============================================================
# STATISTICS
# ============================================================

print()
print("=" * 60)
print("PROXY TARGET V2 CREATION COMPLETE")
print("=" * 60)

print()
print(f"Rows: {len(df):,}")

print()
print("Opportunity score statistics:")

print(
    df["opportunity_score"].describe()
)

print()
print("Opportunity score range:")

print(
    f"Minimum score: "
    f"{df['opportunity_score'].min():.2f}"
)

print(
    f"Maximum score: "
    f"{df['opportunity_score'].max():.2f}"
)


# ============================================================
# TARGET DISTRIBUTION
# ============================================================

print()
print("Proxy target distribution:")

print(
    df["proxy_success"].value_counts()
)

print()
print("Proxy target percentages:")

percentages = (
    df["proxy_success"]
    .value_counts(
        normalize=True
    )
    .mul(100)
    .round(2)
)

for label, percentage in percentages.items():

    print(
        f"proxy_success = {label}: "
        f"{percentage:.2f}%"
    )


# ============================================================
# SAVE
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("IMPORTANT:")
print(
    "proxy_success is NOT a real business-success label."
)

print(
    "It is a geographic opportunity proxy "
    "derived from OSM-based features."
)

print(
    "The 0-100 opportunity score represents "
    "relative geographic opportunity within "
    "this candidate dataset."
)

print()
print("Output file:")
print(OUTPUT_FILE)

print()
print("Done!")