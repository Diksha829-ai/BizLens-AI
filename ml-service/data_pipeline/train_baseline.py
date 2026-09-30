import pandas as pd
import numpy as np

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = Path("../data/processed/candidate_locations_labeled.csv")


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("LOADING DATA")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print(f"Dataset shape: {df.shape}")
print()


# ============================================================
# FEATURES
# ============================================================

# IMPORTANT:
# We do NOT use:
# - opportunity_score
# - proxy_success
# - demand_proxy
# - competition_pressure
# - competition_distance_score
#
# because these values were used to create the proxy target.
#
# Using them would cause target leakage.

FEATURES = [
    "lat",
    "lon",
    "pois_500m",
    "pois_1km",
    "pois_2km",
    "competitors_500m",
    "competitors_1km",
    "nearest_competitor_m",
    "competition_ratio",
    "category_poi_count",
    "category_coverage_available"
]

TARGET = "proxy_success"


# ============================================================
# CHECK FEATURES
# ============================================================

print("=" * 60)
print("CHECKING FEATURES")
print("=" * 60)

missing_features = [
    feature for feature in FEATURES
    if feature not in df.columns
]

if missing_features:
    print("Missing features:")
    for feature in missing_features:
        print(f"  - {feature}")

    raise ValueError("Required features are missing from the dataset.")

print("All required features are available.")
print()


# ============================================================
# PREPARE X AND y
# ============================================================

X = df[FEATURES].copy()
y = df[TARGET].copy()


# Replace infinite values
X = X.replace([np.inf, -np.inf], np.nan)

# Fill missing numeric values with median
X = X.fillna(X.median())


print("=" * 60)
print("TARGET DISTRIBUTION")
print("=" * 60)

print(y.value_counts())
print()
print(y.value_counts(normalize=True).mul(100).round(2))
print()


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

print("=" * 60)
print("TRAIN / TEST SPLIT")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples:  {len(X_test)}")
print()


# ============================================================
# RANDOM FOREST
# ============================================================

print("=" * 60)
print("TRAINING RANDOM FOREST")
print("=" * 60)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)

model.fit(X_train, y_train)

print("Training completed.")
print()


# ============================================================
# PREDICTIONS
# ============================================================

y_pred = model.predict(X_test)

y_probability = model.predict_proba(X_test)[:, 1]


# ============================================================
# EVALUATION
# ============================================================

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)


print("=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")
print()


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("=" * 60)
print("CONFUSION MATRIX")
print("=" * 60)

cm = confusion_matrix(y_test, y_pred)

print(cm)
print()


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("=" * 60)
print("FEATURE IMPORTANCE")
print("=" * 60)

importance_df = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
})

importance_df = importance_df.sort_values(
    by="importance",
    ascending=False
)

for _, row in importance_df.iterrows():
    print(
        f"{row['feature']:<30} "
        f"{row['importance']:.4f}"
    )

print()


# ============================================================
# SAVE FEATURE IMPORTANCE
# ============================================================

OUTPUT_FILE = Path("../data/processed/baseline_feature_importance.csv")

importance_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("=" * 60)
print("SAVED")
print("=" * 60)

print(f"Feature importance saved to:")
print(OUTPUT_FILE)

print()
print("Baseline training completed successfully.")