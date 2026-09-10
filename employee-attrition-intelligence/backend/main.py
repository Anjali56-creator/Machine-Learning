"""FastAPI application entry point.

Run locally with:
    uvicorn backend.main:app --reload --port 8000
(from the repository root, with the project venv active).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api import routes_dashboard, routes_prediction
from backend.config import get_settings
from backend.schemas.dashboard import HealthResponse
from backend.services.analytics_service import analytics_service
from backend.services.model_service import model_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("attrition.api")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load heavy resources once, at startup.
    model_service.load()
    analytics_service.load()
    if not model_service.ready:
        logger.warning("Model pipeline did not load: %s", model_service.load_error)
    if not analytics_service.ready:
        logger.warning("Analytics dataset did not load: %s", analytics_service.load_error)
    yield


app = FastAPI(
    title="Employee Attrition Analysis & Prediction API",
    version="1.0.0",
    description="Serves dashboard analytics and ML attrition predictions from the trained pipeline.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_prediction.router)
app.include_router(routes_dashboard.router)


@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health():
    ok = model_service.ready and analytics_service.ready
    detail = None
    if not model_service.ready:
        detail = f"model load error: {model_service.load_error}"
    elif not analytics_service.ready:
        detail = f"data load error: {analytics_service.load_error}"
    return HealthResponse(
        status="ok" if ok else "degraded",
        model_loaded=model_service.ready,
        data_loaded=analytics_service.ready,
        model_name=model_service.metadata.get("model_name") if model_service.ready else None,
        detail=detail,
    )


@app.get("/", tags=["meta"])
def root():
    return {"service": app.title, "docs": "/docs", "health": "/health"}


# --- Error handling: never leak stack traces to clients -----------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(
            {"detail": exc.errors(), "message": "Request validation failed"}
        ),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal server error"},
    )
