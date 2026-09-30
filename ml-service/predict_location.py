import sys
from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# PATH SETUP
# ============================================================

CURRENT_DIR = Path(__file__).resolve().parent

DATA_PIPELINE_DIR = CURRENT_DIR / "data_pipeline"

MODEL_FILE = (
    CURRENT_DIR
    / "models"
    / "bizlens_model_v2.joblib"
)


# ============================================================
# IMPORT LOCATION FEATURE GENERATOR
# ============================================================

sys.path.append(
    str(DATA_PIPELINE_DIR)
)

from generate_location_features import (
    generate_location_features
)


# ============================================================
# MODEL FEATURES
# ============================================================

FEATURES = [

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


# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 60)
print("BIZLENS AI - LOCATION PREDICTION")
print("=" * 60)

print()
print("Loading trained model...")

if not MODEL_FILE.exists():

    raise FileNotFoundError(
        f"Model not found:\n{MODEL_FILE}"
    )

model = joblib.load(
    MODEL_FILE
)

print("Model loaded successfully.")
print()


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict_location(
    latitude,
    longitude,
    category
):
    """
    Generate geographic features and use the trained
    Random Forest model to predict proxy opportunity.

    IMPORTANT:
    This model predicts the proxy target created from
    OSM geographic features. It is not a guarantee of
    actual business success.
    """

    # --------------------------------------------------------
    # Generate location features
    # --------------------------------------------------------

    features = generate_location_features(
        latitude,
        longitude,
        category
    )

    # --------------------------------------------------------
    # Convert to DataFrame
    # --------------------------------------------------------

    X = pd.DataFrame(
        [features]
    )

    # --------------------------------------------------------
    # Check required model features
    # --------------------------------------------------------

    missing_features = [
        feature
        for feature in FEATURES
        if feature not in X.columns
    ]

    if missing_features:

        raise ValueError(
            "Missing model features:\n"
            + "\n".join(missing_features)
        )

    # --------------------------------------------------------
    # Select features in EXACT training order
    # --------------------------------------------------------

    X = X[FEATURES].copy()

    # --------------------------------------------------------
    # Handle infinite values
    # --------------------------------------------------------

    X = X.replace(
        [float("inf"), float("-inf")],
        float("nan")
    )

    # --------------------------------------------------------
    # Handle missing values
    # --------------------------------------------------------

    X = X.fillna(0)

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = model.predict(
        X
    )[0]

    probabilities = model.predict_proba(
        X
    )[0]

    probability_negative = probabilities[0]
    probability_positive = probabilities[1]


    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    result = {

        "latitude": float(latitude),

        "longitude": float(longitude),

        "category": category,

        "prediction": int(prediction),

        "prediction_label": (
            "Opportunity"
            if prediction == 1
            else "Lower Opportunity"
        ),

        "opportunity_probability":
            float(probability_positive),

        "lower_opportunity_probability":
            float(probability_negative),

        "category_coverage_available":
            int(
                features[
                    "category_coverage_available"
                ]
            ),

        "nearest_competitor_m":
            float(
                features[
                    "nearest_competitor_m"
                ]
            ),

        "competitors_1km":
            int(
                features[
                    "competitors_1km"
                ]
            ),

        "pois_1km":
            int(
                features[
                    "pois_1km"
                ]
            )
    }

    return result


# ============================================================
# TEST PREDICTION
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("TEST LOCATION")
    print("=" * 60)

    # Pune test location
    latitude = 18.5204
    longitude = 73.8567
    category = "restaurant"

    print()
    print(f"Latitude : {latitude}")
    print(f"Longitude: {longitude}")
    print(f"Category : {category}")
    print()

    result = predict_location(
        latitude,
        longitude,
        category
    )

    print("=" * 60)
    print("PREDICTION RESULT")
    print("=" * 60)

    print()

    print(
        f"Prediction                 : "
        f"{result['prediction']}"
    )

    print(
        f"Prediction Label           : "
        f"{result['prediction_label']}"
    )

    print(
        f"Opportunity Probability    : "
        f"{result['opportunity_probability']:.4f}"
    )

    print(
        f"Opportunity Probability %  : "
        f"{result['opportunity_probability'] * 100:.2f}%"
    )

    print(
        f"Lower Opportunity %        : "
        f"{result['lower_opportunity_probability'] * 100:.2f}%"
    )

    print()

    print(
        f"POIs within 1 km           : "
        f"{result['pois_1km']}"
    )

    print(
        f"Competitors within 1 km    : "
        f"{result['competitors_1km']}"
    )

    print(
        f"Nearest competitor         : "
        f"{result['nearest_competitor_m']:.2f} m"
    )

    print(
        f"Category OSM coverage      : "
        f"{result['category_coverage_available']}"
    )

    print()

    print("=" * 60)
    print("IMPORTANT")
    print("=" * 60)

    print(
        "This prediction represents geographic "
        "opportunity based on the trained proxy target."
    )

    print(
        "It is NOT a guarantee of actual business success."
    )

    print()
    print("Prediction completed successfully.")