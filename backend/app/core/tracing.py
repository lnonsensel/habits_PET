import os
import logging

logger = logging.getLogger("habitpet.tracing")

_OTEL_ENABLED = os.getenv("OTEL_ENABLED", "false").lower() == "true"
_OTEL_ENDPOINT = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "otel-collector:4317")


def setup_tracing(app, engine=None) -> None:
    if not _OTEL_ENABLED:
        return

    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

    resource = Resource.create({"service.name": "habitpet-backend", "service.version": "1.0.0"})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=_OTEL_ENDPOINT, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    if engine is not None:
        SQLAlchemyInstrumentor().instrument(engine=engine)

    logger.info("OpenTelemetry tracing → %s", _OTEL_ENDPOINT)
