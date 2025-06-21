from fastapi import APIRouter
from .auth import router as auth_router
from .tasks import router as tasks_router
from .calendar import router as calendar_router

# Create the main v1 API router
api_v1_router = APIRouter(prefix="/api/v1")

# Include all the sub-routers
api_v1_router.include_router(auth_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(calendar_router) 