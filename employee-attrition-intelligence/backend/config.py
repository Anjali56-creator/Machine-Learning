"""Central configuration for the backend.

All tunable values live here so they can be changed in one place (or overridden
via environment variables / a `.env` file) without touching business logic.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repository root = two levels up from this file (backend/config.py -> backend -> repo root)
REPO_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / "backend" / ".env"),
        env_prefix="ATTRITION_",
        extra="ignore",
    )

    # --- Paths -------------------------------------------------------------
    # Fitted preprocessing + model pipeline produced by notebooks/03_modeling.ipynb
    pipeline_path: Path = REPO_ROOT / "backend" / "ml" / "artifacts" / "attrition_pipeline.joblib"
    metadata_path: Path = REPO_ROOT / "backend" / "ml" / "artifacts" / "model_metadata.json"
    # Cleaned dataset produced by notebooks/01_cleaning.ipynb
    data_path: Path = REPO_ROOT / "data" / "processed" / "cleaned_employee_attrition.csv"

    # --- CORS ------------------------------------------------------------------
    # Comma-separated list of allowed frontend origins. Defaults cover the common
    # Vite (5173) and CRA (3000) dev-server ports. Override with
    # ATTRITION_FRONTEND_ORIGINS in the environment / .env for other setups.
    frontend_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # --- Risk level thresholds ----------------------------------------------
    # Applied to the model-estimated probability of Attrition="Yes" (the "risk
    # score"). These are product thresholds, not a calibrated statistical claim:
    #   score <  risk_medium_threshold                     -> "Low"
    #   risk_medium_threshold <= score < risk_high_threshold -> "Medium"
    #   score >= risk_high_threshold                        -> "High"
    # The final model is LogisticRegression(class_weight="balanced"), so scores
    # are shifted upward relative to the ~16% base rate; the defaults below are
    # chosen around that shifted distribution and can be tuned freely here.
    risk_medium_threshold: float = 0.35
    risk_high_threshold: float = 0.65

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
