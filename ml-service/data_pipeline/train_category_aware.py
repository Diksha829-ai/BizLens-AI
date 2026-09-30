import pandas as pd
import numpy as np

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

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
    "../data/processed/category_aware_feature_importance.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("BIZLENS AI - CATEGORY-AWARE RANDOM FOREST")
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

NUMERIC_FEATURES = [

    # General geographic context
    "pois_500m",
    "pois_1km",
    "pois_2km",

    # General competition
    "competitors_500m",
    "competitors_1km",
    "nearest_competitor_m",
    "competition_ratio",

    # Category context
    "category_poi_count",
    "category_coverage_available",

    # Category-specific competition
    "category_competitors_500m",
    "category_competitors_1km",
    "category_competitors_2km",

    # Category-specific density
    "category_density_500m",
    "category_density_1km",
    "category_density_2km",

    # General density
    "poi_density_500m",
    "poi_density_1km",
    "poi_density_2km",
    "competitor_density_500m",
    "competitor_density_1km"
]

CATEGORICAL_FEATURES = [
    "bizlens_category"
]

TARGET = "proxy_success"


# ============================================================
# CHECK FEATURES
# ============================================================

print("=" * 60)
print("CHECKING FEATURES")
print("=" * 60)

required_features = (
    NUMERIC_FEATURES
    + CATEGORICAL_FEATURES
    + [TARGET]
)

missing_features = [
    feature
    for feature in required_features
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
# PREPARE DATA
# ============================================================

X = df[
    NUMERIC_FEATURES + CATEGORICAL_FEATURES
].copy()

y = df[TARGET].copy()


# ============================================================
# CLEAN NUMERIC FEATURES
# ============================================================

for column in NUMERIC_FEATURES:

    X[column] = pd.to_numeric(
        X[column],
        errors="coerce"
    )

    X[column] = X[column].replace(
        [np.inf, -np.inf],
        np.nan
    )

    X[column] = X[column].fillna(
        X[column].median()
    )


# ============================================================
# CLEAN CATEGORY
# ============================================================

X["bizlens_category"] = (
    X["bizlens_category"]
    .fillna("unknown")
    .astype(str)
)


# ============================================================
# CATEGORY DISTRIBUTION
# ============================================================

print("=" * 60)
print("BIZLENS CATEGORY DISTRIBUTION")
print("=" * 60)

print(
    X["bizlens_category"]
    .value_counts()
)

print()


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
# ONE-HOT ENCODER
# ============================================================

print("=" * 60)
print("PREPARING CATEGORY ENCODER")
print("=" * 60)

preprocessor = ColumnTransformer(
    transformers=[
        (
            "category",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            CATEGORICAL_FEATURES
        ),
        (
            "numeric",
            "passthrough",
            NUMERIC_FEATURES
        )
    ]
)


# ============================================================
# RANDOM FOREST
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)


# ============================================================
# PIPELINE
# ============================================================

pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            model
        )
    ]
)


# ============================================================
# TRAIN
# ============================================================

print("=" * 60)
print("TRAINING CATEGORY-AWARE RANDOM FOREST")
print("=" * 60)

pipeline.fit(
    X_train,
    y_train
)

print("Training completed.")
print()


# ============================================================
# PREDICTIONS
# ============================================================

y_pred = pipeline.predict(
    X_test
)

y_probability = pipeline.predict_proba(
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

trained_model = pipeline.named_steps[
    "model"
]

trained_preprocessor = pipeline.named_steps[
    "preprocessor"
]

feature_names = (
    trained_preprocessor
    .get_feature_names_out()
)

importance_df = pd.DataFrame({
    "feature": feature_names,
    "importance": trained_model.feature_importances_
})

importance_df = importance_df.sort_values(
    by="importance",
    ascending=False
)

for _, row in importance_df.iterrows():

    print(
        f"{row['feature']:<45}"
        f"{row['importance']:.4f}"
    )


# ============================================================
# SAVE FEATURE IMPORTANCE
# ============================================================

importance_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("=" * 60)
print("SAVED")
print("=" * 60)

print()
print(
    "Feature importance saved to:"
)

print(
    OUTPUT_FILE
)

print()
print(
    "Category-aware baseline training completed successfully."
)