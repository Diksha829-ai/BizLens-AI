import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# BIZLENS AI - PROXY TARGET CREATION
# ============================================================

INPUT_FILE = Path(
    "../data/processed/candidate_locations.csv"
)

OUTPUT_DIR = Path(
    "../data/processed"
)

OUTPUT_FILE = (
    OUTPUT_DIR /
    "candidate_locations_labeled.csv"
)


print("=" * 60)
print("BIZLENS AI - PROXY OPPORTUNITY TARGET")
print("=" * 60)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading candidate dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(
    f"Rows loaded: {len(df):,}"
)

print(
    f"Columns loaded: {len(df.columns)}"
)


# ============================================================
# PREPARE NUMERIC FEATURES
# ============================================================

numeric_columns = [
    "pois_500m",
    "pois_1km",
    "pois_2km",
    "competitors_500m",
    "competitors_1km",
    "nearest_competitor_m",
    "competition_ratio",
]


for column in numeric_columns:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


df[numeric_columns] = (
    df[numeric_columns]
    .replace(
        [np.inf, -np.inf],
        np.nan
    )
    .fillna(0)
)


# ============================================================
# NORMALIZED FEATURES
# ============================================================

print("\nCreating normalized geographic indicators...")


def percentile_rank(series):
    """
    Convert a numeric feature into a percentile
    between 0 and 1.
    """

    return (
        series
        .rank(
            pct=True,
            method="average"
        )
        .fillna(0)
    )


# ============================================================
# DEMAND PROXY
# ============================================================

df["demand_proxy"] = (
    0.40 * percentile_rank(
        df["pois_1km"]
    )
    +
    0.30 * percentile_rank(
        df["pois_500m"]
    )
    +
    0.30 * percentile_rank(
        df["pois_2km"]
    )
)


# ============================================================
# COMPETITION PRESSURE
# ============================================================

df["competition_pressure"] = (
    0.50 * percentile_rank(
        df["competitors_1km"]
    )
    +
    0.30 * percentile_rank(
        df["competitors_500m"]
    )
    +
    0.20 * percentile_rank(
        df["competition_ratio"]
    )
)


# ============================================================
# COMPETITOR DISTANCE
# ============================================================

# Larger distance to the nearest competitor
# indicates lower immediate competition pressure.

df["competition_distance_score"] = (
    percentile_rank(
        df["nearest_competitor_m"]
    )
)


# ============================================================
# RAW OPPORTUNITY SCORE
# ============================================================

print(
    "\nCalculating raw opportunity score..."
)


raw_score = (
    0.60 * df["demand_proxy"]
    +
    0.40 * (
        1 -
        df["competition_pressure"]
    )
)


# ============================================================
# NORMALIZE SCORE TO 0-100
# ============================================================

print(
    "Normalizing opportunity score to 0-100..."
)


min_score = raw_score.min()

max_score = raw_score.max()


# Prevent division by zero
# in case all raw scores are identical.

if max_score == min_score:

    df["opportunity_score"] = 50.0

else:

    df["opportunity_score"] = (
        (
            raw_score -
            min_score
        )
        /
        (
            max_score -
            min_score
        )
        *
        100
    )


# Final safety limits

df["opportunity_score"] = (
    df["opportunity_score"]
    .clip(0, 100)
    .round(2)
)


# ============================================================
# PROXY TARGET
# ============================================================

# IMPORTANT:
# This is NOT an actual business-success label.
# It is only a proxy derived from OSM geographic features.
#
# proxy_success = 1 means the location has an opportunity
# score >= 60.
#
# proxy_success = 0 means the location has an opportunity
# score < 60.

df["proxy_success"] = (
    df["opportunity_score"] >= 60
).astype(int)


# ============================================================
# SAVE
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("PROXY TARGET CREATION COMPLETE")
print("=" * 60)


print(
    f"\nRows: {len(df):,}"
)


# ============================================================
# SCORE STATISTICS
# ============================================================

print(
    "\nOpportunity score statistics:"
)


print(
    df["opportunity_score"]
    .describe()
)


# ============================================================
# SCORE RANGE
# ============================================================

print(
    "\nOpportunity score range:"
)


print(
    f"Minimum score: "
    f"{df['opportunity_score'].min():.2f}"
)


print(
    f"Maximum score: "
    f"{df['opportunity_score'].max():.2f}"
)


# ============================================================
# PROXY TARGET DISTRIBUTION
# ============================================================

print(
    "\nProxy target distribution:"
)


print(
    df["proxy_success"]
    .value_counts()
)


# ============================================================
# PROXY TARGET PERCENTAGES
# ============================================================

print(
    "\nProxy target percentages:"
)


target_percentages = (
    df["proxy_success"]
    .value_counts(
        normalize=True
    )
    * 100
)


for label, percentage in (
    target_percentages
    .sort_index()
    .items()
):

    print(
        f"proxy_success = {label}: "
        f"{percentage:.2f}%"
    )


# ============================================================
# IMPORTANT NOTICE
# ============================================================

print(
    "\nIMPORTANT:"
)


print(
    "proxy_success is NOT a real business-success label."
)


print(
    "It is derived only from geographic OSM features."
)


print(
    "\nThe 0-100 opportunity score represents"
)


print(
    "relative geographic opportunity within this dataset."
)


# ============================================================
# OUTPUT
# ============================================================

print(
    "\nOutput file:"
)


print(
    OUTPUT_FILE
)


print("\nDone!")