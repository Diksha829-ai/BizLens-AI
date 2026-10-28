from pathlib import Path
import sys
import traceback

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd

# ============================================================
# PATH SETUP
# ============================================================

CURRENT_DIR = Path(__file__).resolve().parent
DATA_PIPELINE_DIR = CURRENT_DIR / "data_pipeline"
MODEL_FILE = CURRENT_DIR / "models" / "bizlens_model_v2.joblib"

# ============================================================
# IMPORT LOCATION FEATURE GENERATOR
# ============================================================

sys.path.append(str(DATA_PIPELINE_DIR))

from generate_location_features import generate_location_features

# ============================================================
# MODEL FEATURES
# Keep the same feature order used during training.
# ============================================================

FEATURES = [
    "pois_500m",
    "pois_1km",
    "pois_2km",
    "competitors_500m",
    "competitors_1km",
    "nearest_competitor_m",
    "competition_ratio",
    "category_poi_count",
    "category_coverage_available",
    "category_competitors_500m",
    "category_competitors_1km",
    "category_competitors_2km",
    "category_density_500m",
    "category_density_1km",
    "category_density_2km",
    "poi_density_500m",
    "poi_density_1km",
    "poi_density_2km",
    "competitor_density_500m",
    "competitor_density_1km",
]

# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("=" * 60, flush=True)
print("BIZLENS AI - ML PREDICTION API", flush=True)
print("=" * 60, flush=True)
print("Loading trained model...", flush=True)

if not MODEL_FILE.exists():
    raise FileNotFoundError(
        f"Trained model not found: {MODEL_FILE}"
    )

model = joblib.load(MODEL_FILE)

print("Model loaded successfully.", flush=True)

# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="BizLens AI ML API",
    description="Geographic business opportunity prediction API",
    version="1.0.0",
)

# ============================================================
# REQUEST MODEL
# ============================================================

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    category: str = Field(..., min_length=1)

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "service": "BizLens AI ML API",
        "status": "running",
        "model": "bizlens_model_v2",
        "categories_supported": 42,
    }

# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "categories_supported": 42,
    }

# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict(request: LocationRequest):

    # Confirm that the request reaches the Python endpoint.
    print("ML PREDICT REQUEST RECEIVED", flush=True)

    print(
        "ML REQUEST DETAILS: "
        f"latitude={request.latitude}, "
        f"longitude={request.longitude}, "
        f"category={request.category!r}",
        flush=True,
    )

    try:
        # ----------------------------------------------------
        # Generate geographic features
        # ----------------------------------------------------

        print("Generating geographic features...", flush=True)

        features = generate_location_features(
            request.latitude,
            request.longitude,
            request.category,
        )

        print("Geographic features generated.", flush=True)

        # ----------------------------------------------------
        # Convert features to DataFrame
        # ----------------------------------------------------

        X = pd.DataFrame([features])

        # ----------------------------------------------------
        # Verify required model features
        # ----------------------------------------------------

        missing_features = [
            feature
            for feature in FEATURES
            if feature not in X.columns
        ]

        if missing_features:
            raise ValueError(
                "Missing model features: "
                + ", ".join(missing_features)
            )

        # Keep the exact feature order used during training.
        X = X[FEATURES].copy()

        # Handle invalid numeric values.
        X = X.replace(
            [float("inf"), float("-inf")],
            float("nan"),
        )

        X = X.fillna(0)

        # ----------------------------------------------------
        # Generate prediction
        # ----------------------------------------------------

        print("Running model prediction...", flush=True)

        prediction = int(model.predict(X)[0])

        probabilities = model.predict_proba(X)[0]

        if len(probabilities) < 2:
            raise ValueError(
                "The model did not return two class probabilities. "
                "Check the trained model's class labels."
            )

        lower_probability = float(probabilities[0])
        opportunity_probability = float(probabilities[1])

        print(
            "ML API RAW PROBABILITIES:",
            probabilities,
            flush=True,
        )

        print(
            "ML API OPPORTUNITY PROBABILITY:",
            opportunity_probability,
            flush=True,
        )

        # ----------------------------------------------------
        # Category data availability
        # ----------------------------------------------------

        category_data_available = (
            features["category_coverage_available"] == 1
        )

        category_data_warning = None

        if not category_data_available:
            category_data_warning = (
                "Category-specific OSM data is unavailable "
                "for this category. The prediction is based "
                "on available general geographic features "
                "and should be interpreted with caution."
            )

        # ----------------------------------------------------
        # Geographic explanation signals
        # ----------------------------------------------------

        geographic_signals = []

        competitors_1km = features["competitors_1km"]

        if competitors_1km == 0:
            geographic_signals.append(
                "No competitors were found within 1 km."
            )

        elif competitors_1km <= 3:
            geographic_signals.append(
                f"Low competition: only {competitors_1km} "
                "competitors within 1 km."
            )

        else:
            geographic_signals.append(
                f"Competition detected: {competitors_1km} "
                "competitors within 1 km."
            )

        nearest_competitor_m = features["nearest_competitor_m"]

        if nearest_competitor_m >= 1000:
            geographic_signals.append(
                "Nearest competitor is more than 1 km away."
            )

        elif nearest_competitor_m >= 500:
            geographic_signals.append(
                "Nearest competitor is more than 500 m away."
            )

        else:
            geographic_signals.append(
                "Nearest competitor is within 500 m."
            )

        pois_1km = features["pois_1km"]

        if pois_1km >= 100:
            geographic_signals.append(
                f"High surrounding activity: {pois_1km} "
                "POIs within 1 km."
            )

        elif pois_1km >= 50:
            geographic_signals.append(
                f"Moderate surrounding activity: {pois_1km} "
                "POIs within 1 km."
            )

        else:
            geographic_signals.append(
                f"Lower surrounding activity: {pois_1km} "
                "POIs within 1 km."
            )

        poi_density_1km = features["poi_density_1km"]

        if poi_density_1km >= 25:
            geographic_signals.append(
                f"High POI density: {poi_density_1km:.2f} POIs/km²."
            )

        elif poi_density_1km >= 10:
            geographic_signals.append(
                f"Moderate POI density: "
                f"{poi_density_1km:.2f} POIs/km²."
            )

        else:
            geographic_signals.append(
                f"Lower POI density: {poi_density_1km:.2f} POIs/km²."
            )

        # ----------------------------------------------------
        # Build prediction response
        # ----------------------------------------------------

        response_data = {
            "success": True,

            "location": {
                "latitude": request.latitude,
                "longitude": request.longitude,
            },

            "category": request.category,

            "prediction": prediction,

            "prediction_label": (
                "Opportunity"
                if prediction == 1
                else "Lower Opportunity"
            ),

            "opportunity_probability": round(
                opportunity_probability, 6
            ),

            "opportunity_probability_percent": round(
                opportunity_probability * 100, 2
            ),

            "lower_opportunity_probability": round(
                lower_probability, 6
            ),

            "geographic_features": {
                "pois_500m": features["pois_500m"],
                "pois_1km": features["pois_1km"],
                "pois_2km": features["pois_2km"],

                "competitors_500m": features["competitors_500m"],
                "competitors_1km": features["competitors_1km"],

                "category_competitors_2km": (
                    features["category_competitors_2km"]
                ),

                "nearest_competitor_m": round(
                    features["nearest_competitor_m"], 2
                ),

                "competition_ratio": round(
                    features["competition_ratio"], 4
                ),

                "poi_density_1km": round(
                    features["poi_density_1km"], 4
                ),

                "category_density_1km": round(
                    features["category_density_1km"], 4
                ),

                "category_poi_count": (
                    features["category_poi_count"]
                ),

                "category_coverage_available": (
                    features["category_coverage_available"]
                ),

                "category_data_available": (
                    category_data_available
                ),

                "category_data_warning": (
                    category_data_warning
                ),

                "geographic_signals": geographic_signals,
            },

            "interpretation": (
                "Geographic opportunity prediction based on "
                "OSM-derived proxy data. This is not a guarantee "
                "of actual business success."
            ),
        }

        print(
            "ML PREDICTION RESPONSE READY: "
            f"label={response_data['prediction_label']}, "
            f"probability={response_data['opportunity_probability']}",
            flush=True,
        )

        return response_data

    except HTTPException:
        raise

    except ValueError as error:
        print(
            f"ML PREDICTION VALIDATION ERROR: {error}",
            flush=True,
        )

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"ML PREDICTION INTERNAL ERROR: {error!r}",
            flush=True,
        )

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                "ML prediction failed. "
                "Check the ML service logs for details."
            ),
        ) from error

# ============================================================
# LOCAL RUN
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )