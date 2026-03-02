import multiprocessing
import os

# Server socket
bind = os.getenv("BIND_ADDRESS", "0.0.0.0:8000")

# Worker processes
# Calculate workers based on CPU cores for optimal performance if not overridden
cores = multiprocessing.cpu_count()
workers_per_core = 2
default_workers = (workers_per_core * cores) + 1
workers = int(os.getenv("WORKERS", str(default_workers)))

# Uvicorn worker class for FastAPI
worker_class = "uvicorn.workers.UvicornWorker"

# Timeout and keepalive
timeout = int(os.getenv("TIMEOUT", "120"))
keepalive = int(os.getenv("KEEPALIVE", "5"))

# Logging
accesslog = "-" # Stdout
errorlog = "-" # Stderr
loglevel = os.getenv("LOG_LEVEL", "info")

# Load app before forking for memory efficiency
preload_app = True
