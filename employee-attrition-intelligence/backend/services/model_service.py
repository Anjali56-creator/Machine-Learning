"""Model service: owns the trained pipeline and turns feature dicts into
predictions.

Design rules enforced here:
- The `attrition_pipeline.joblib` artifact is loaded exactly once (at app
  startup) and reused for every request.
- No preprocessing is re-implemented. Scaling / one-hot encoding already live
  inside the saved `Pipeline`; this service only builds a correctly-ordered
  single-row DataFrame and calls `predict_proba`.
- The probability returned always corresponds to the positive class
  (Attrition == "Yes", encoded as 1), located via `pipeline.classes_`.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import joblib
import pandas as pd

from backend.config import Settings, get_settings
from backend.utils.errors import InvalidFeatureError, ModelUnavailableError

logger = logging.getLogger(__name__)

# The dataset encodes Attrition as Attrition_Flag: 1 == "Yes", 0 == "No".
POSITIVE_CLASS = 1


class ModelService:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._pipeline = None
        self._metadata: dict = {}
        self._feature_order: list[str] = []
        self._categories: dict[str, list[str]] = {}
        self._pos_index: int = 1
        self._load_error: str | None = None

    # --- lifecycle -------------------------------------------------------------
    def load(self) -> None:
        """Load the pipeline + metadata. Called once on startup."""
        try:
            pipeline_path: Path = self._settings.pipeline_path
            metadata_path: Path = self._settings.metadata_path

            self._pipeline = joblib.load(pipeline_path)
            self._metadata = json.loads(Path(metadata_path).read_text())
            self._feature_order = self._metadata["feature_order"]

            # Exact categories the OneHotEncoder saw during training - used for
            # clear validation errors on unseen categorical values.
            pre = self._pipeline.named_steps["preprocessor"]
            cat_cols = self._metadata["categorical_cols"]
            encoder = pre.named_transformers_["cat"]
            self._categories = {
                col: list(cats) for col, cats in zip(cat_cols, encoder.categories_)
            }

            classes = list(self._pipeline.classes_)
            self._pos_index = classes.index(POSITIVE_CLASS)

            self._load_error = None
            logger.info(
                "Loaded pipeline '%s' from %s (%d features)",
                self._metadata.get("model_name", "unknown"),
                pipeline_path,
                len(self._feature_order),
            )
        except Exception as exc:  # noqa: BLE001 - captured for /health reporting
            self._pipeline = None
            self._load_error = str(exc)
            logger.exception("Failed to load model pipeline")

    # --- introspection ------------------------------------------------------
    @property
    def ready(self) -> bool:
        return self._pipeline is not None

    @property
    def load_error(self) -> str | None:
        return self._load_error

    @property
    def metadata(self) -> dict:
        return self._metadata

    def allowed_categories(self) -> dict[str, list[str]]:
        return self._categories

    # --- prediction -------------------------------------------------------------
    def predict(self, features: dict) -> dict:
        if not self.ready:
            raise ModelUnavailableError(
                self._load_error or "Model pipeline is not loaded"
            )

        self._validate_categories(features)

        # Single-row frame with columns in the exact training order.
        row = {col: features[col] for col in self._feature_order}
        frame = pd.DataFrame([row], columns=self._feature_order)

        proba = float(self._pipeline.predict_proba(frame)[0][self._pos_index])
        label = "Yes" if proba >= 0.5 else "No"
        risk_level = self.risk_level(proba)

        return {
            "prediction": label,
            "probability": round(proba, 4),
            "risk_level": risk_level,
            "thresholds": {
                "medium": self._settings.risk_medium_threshold,
                "high": self._settings.risk_high_threshold,
            },
            "top_factors": self._top_factors(frame),
        }

    def risk_level(self, probability: float) -> str:
        if probability >= self._settings.risk_high_threshold:
            return "High"
        if probability >= self._settings.risk_medium_threshold:
            return "Medium"
        return "Low"

    # --- helpers -------------------------------------------------------------
    def _validate_categories(self, features: dict) -> None:
        for col, allowed in self._categories.items():
            value = features.get(col)
            if value is not None and value not in allowed:
                raise InvalidFeatureError(
                    f"Invalid value {value!r} for {col!r}. Allowed values: {allowed}"
                )

    def _top_factors(self, frame: pd.DataFrame, k: int = 5) -> list[dict]:
        """Best-effort local explanation.

        For the linear final model this is (standardized input) x (coefficient)
        per expanded feature, which indicates how each feature moved *this*
        prediction's log-odds. Falls back to global feature_importances_ for
        tree models, and to an empty list if neither is available.
        """
        try:
            pre = self._pipeline.named_steps["preprocessor"]
            clf = self._pipeline.named_steps["classifier"]
            names = list(pre.get_feature_names_out())
            transformed = pre.transform(frame)
            if hasattr(transformed, "toarray"):
                transformed = transformed.toarray()
            transformed = transformed[0]

            if hasattr(clf, "coef_"):
                contributions = clf.coef_[0] * transformed
            elif hasattr(clf, "feature_importances_"):
                contributions = clf.feature_importances_ * transformed
            else:
                return []

            order = sorted(
                range(len(contributions)),
                key=lambda i: abs(contributions[i]),
                reverse=True,
            )[:k]
            factors = []
            for i in order:
                c = float(contributions[i])
                if c == 0:
                    continue
                factors.append(
                    {
                        "feature": names[i],
                        "direction": "increases" if c > 0 else "decreases",
                        "weight": round(abs(c), 4),
                    }
                )
            return factors
        except Exception:  # noqa: BLE001 - explanation is optional, never fatal
            logger.debug("Could not compute top factors", exc_info=True)
            return []


# Module-level singleton reused across requests.
model_service = ModelService()
