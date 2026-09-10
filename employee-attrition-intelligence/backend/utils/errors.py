"""Shared error types and helpers.

Keeps user-facing error messages clean (no stack traces) while letting the API
layer translate internal failures into appropriate HTTP responses.
"""

from __future__ import annotations


class ModelUnavailableError(RuntimeError):
    """Raised when a prediction is requested but the pipeline failed to load."""


class InvalidFeatureError(ValueError):
    """Raised when incoming feature values are structurally valid but not
    acceptable to the trained pipeline (e.g. an unseen category)."""


class AnalyticsError(RuntimeError):
    """Raised when a dashboard/analytics computation fails unexpectedly."""
