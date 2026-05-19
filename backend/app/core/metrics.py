import os
from prometheus_client import Counter, Gauge
from prometheus_fastapi_instrumentator import Instrumentator

# ── Custom business metrics ──────────────────────────────────────
crud_ops_total = Counter(
    "habitpet_crud_ops_total",
    "Total CRUD operations",
    ["table", "operation"],
)

habits_active = Gauge(
    "habitpet_habits_active_total",
    "Active (non-archived) habits",
)

users_total_gauge = Gauge(
    "habitpet_users_total",
    "Total registered users",
)

_EXCLUDED_PATHS = [r".*\/metrics$", r".*\/health.*", r".*\/docs.*", r".*\/openapi.*"]


def setup_metrics(app) -> None:
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        excluded_handlers=_EXCLUDED_PATHS,
    ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
