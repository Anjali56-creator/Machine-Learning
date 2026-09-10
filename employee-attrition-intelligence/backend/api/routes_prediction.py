"""Prediction endpoint. Delegates entirely to `model_service` - no preprocessing
or model logic lives here.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from backend.schemas.prediction import EmployeeFeatures, PredictionResponse
from backend.services.model_service import model_service
from backend.utils.errors import InvalidFeatureError, ModelUnavailableError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: EmployeeFeatures):
    try:
        result = model_service.predict(payload.model_dump())
    except ModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction model is not available",
        ) from exc
    except InvalidFeatureError as exc:
        # Structurally valid but not acceptable to the trained pipeline.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed",
        ) from exc
    return result
