import logging
import sys
import structlog
from app.config import settings

def setup_logging():
    """Configure structlog for either local development or JSON production logs"""

    shared_processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    # In production, output as pure JSON for log aggregators (e.g. Datadog / ELK)
    # Locally, use the ConsoleRenderer for easy readability
    if settings.PROJECT_NAME != "Career Planner API": # Or rely on a specific ENV variable like ENVIRONMENT=prod
        processors = shared_processors + [
            structlog.processors.JSONRenderer()
        ]
    else:
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

# Initialize a global logger object so imports are clean
logger = structlog.get_logger()
