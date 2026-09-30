import pandas as pd
import numpy as np
import joblib

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

INPUT_FILE = Path(
    "../data/processed/candidate_locations_labeled_v2.csv"
)

OUTPUT_FILE = Path(
    "../data/processed/baseline_v2_feature_importance.csv"
)

MODEL_DIR = Path(
    "../models"
)

MODEL_FILE = MODEL_DIR / "bizlens_model_v2.joblib"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - RANDOM FOREST BASELINE V2")
print("=" * 60)

print()
print("Loading labeled dataset...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print(f"Dataset shape: {df.shape}")
print()


# ============================================================
# FEATURES
# ============================================================

FEATURES = [

    # --------------------------------------------------------
    # General geographic context
    # --------------------------------------------------------

    "pois_500m",
    "pois_1km",
    "pois_2km",

    # --------------------------------------------------------
    # General competition
    # --------------------------------------------------------

    "competitors_500m",
    "competitors_1km",
    "nearest_competitor_m",
    "competition_ratio",

    # --------------------------------------------------------
    # Category context
    # --------------------------------------------------------

    "category_poi_count",
    "category_coverage_available",

    # --------------------------------------------------------
    # Category-specific competition
    # --------------------------------------------------------

    "category_competitors_500m",
    "category_competitors_1km",
    "category_competitors_2km",

    # --------------------------------------------------------
    # Category-specific density
    # --------------------------------------------------------

    "category_density_500m",
    "category_density_1km",
    "category_density_2km",

    # --------------------------------------------------------
    # General density
    # --------------------------------------------------------

    "poi_density_500m",
    "poi_density_1km",
    "poi_density_2km",
    "competitor_density_500m",
    "competitor_density_1km"
]


TARGET = "proxy_success"


# ============================================================
# CHECK COLUMNS
# ============================================================

print("=" * 60)
print("CHECKING FEATURES")
print("=" * 60)

missing_features = [
    feature
    for feature in FEATURES
    if feature not in df.columns
]

if missing_features:

    print("Missing features:")

    for feature in missing_features:
        print(f"  - {feature}")

    raise ValueError(
        "Required features are missing."
    )

print("All required features are available.")
print()


# ============================================================
# PREPARE X AND y
# ============================================================

X = df[FEATURES].copy()

y = df[TARGET].copy()


# Replace infinite values
X = X.replace(
    [np.inf, -np.inf],
    np.nan
)


# Fill missing numeric values
X = X.fillna(
    X.median(numeric_only=True)
)


# ============================================================
# TARGET DISTRIBUTION
# ============================================================

print("=" * 60)
print("TARGET DISTRIBUTION")
print("=" * 60)

print(
    y.value_counts()
)

print()

print(
    y.value_counts(
        normalize=True
    ).mul(100).round(2)
)

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

print(
    f"Training samples: {len(X_train)}"
)

print(
    f"Testing samples:  {len(X_test)}"
)

print()


# ============================================================
# RANDOM FOREST
# ============================================================

print("=" * 60)
print("TRAINING RANDOM FOREST V2")
print("=" * 60)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)

print("Training completed.")
print()


# ============================================================
# PREDICTIONS
# ============================================================

y_pred = model.predict(
    X_test
)

y_probability = model.predict_proba(
    X_test
)[:, 1]


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

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


# ============================================================
# MODEL PERFORMANCE
# ============================================================

print("=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(
    f"Accuracy : {accuracy:.4f}"
)

print(
    f"Precision: {precision:.4f}"
)

print(
    f"Recall   : {recall:.4f}"
)

print(
    f"F1 Score : {f1:.4f}"
)

print(
    f"ROC-AUC  : {roc_auc:.4f}"
)

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

cm = confusion_matrix(
    y_test,
    y_pred
)

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
        f"{row['feature']:<35}"
        f"{row['importance']:.4f}"
    )

print()


# ============================================================
# SAVE FEATURE IMPORTANCE
# ============================================================

importance_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SAVE TRAINED MODEL
# ============================================================

print("=" * 60)
print("SAVING TRAINED MODEL")
print("=" * 60)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_FILE
)

print()
print("Model saved successfully.")

print(
    f"Model path: {MODEL_FILE}"
)

print()


# ============================================================
# FINAL STATUS
# ============================================================

print("=" * 60)
print("SAVED FILES")
print("=" * 60)

print()
print("Feature importance:")
print(OUTPUT_FILE)

print()
print("Trained model:")
print(MODEL_FILE)

print()
print("Baseline V2 training completed successfully.")