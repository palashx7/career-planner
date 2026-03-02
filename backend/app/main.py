from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routes import auth, workflow, dashboard, admin
from app.utils.cache import init_redis, close_redis
from app.utils.logger import setup_logging, logger
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Logging and Redis
    setup_logging()
    logger.info("Application starting up...", version="1.0.0")
    await init_redis()
    yield
    # Shutdown: Close connections
    logger.info("Application shutting down...")
    await close_redis()


# Create database tables (For production use alembic migrations)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error("Failed to create tables. Database might not be connected", error=str(e), exc_info=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Career Planner SaaS",
    version="1.0.0",
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(workflow.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome to Career Planner API"}
