from celery import Celery
import os


celery_app = Celery(
    "planner",
    broker=os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
    backend=os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
)

celery_app.conf.beat_schedule = {}
celery_app.conf.timezone = "UTC"


