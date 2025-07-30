import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from ...db.session import get_db
from ...db.models import User, Task, Category, TaskComment, UserCalendarDay
from ...schemas.tasks import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    TaskCommentCreate, TaskCommentUpdate, TaskCommentResponse
)
from ...core.auth import get_current_user
import logging
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler
from datetime import datetime, timedelta, timezone
from dateutil import parser as date_parser

router = APIRouter(prefix="/tasks", tags=["tasks"])


# Category endpoints
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all categories for the current user."""
    categories = db.query(Category).filter(Category.user_id == current_user.user_id).all()
    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new category."""
    # Check if category name already exists for this user
    existing_category = db.query(Category).filter(
        Category.user_id == current_user.user_id,
        Category.name == category_data.name
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists"
        )
    
    db_category = Category(
        user_id=current_user.user_id,
        name=category_data.name,
        color_hex=category_data.color_hex
    )
    
    try:
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category creation failed"
        )


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a category."""
    category = db.query(Category).filter(
        Category.category_id == category_id,
        Category.user_id == current_user.user_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    update_data = category_update.dict(exclude_unset=True)
    
    # Check for name conflicts
    if "name" in update_data:
        existing_category = db.query(Category).filter(
            Category.user_id == current_user.user_id,
            Category.name == update_data["name"],
            Category.category_id != category_id
        ).first()
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists"
            )
    
    for field, value in update_data.items():
        setattr(category, field, value)
    
    # If color was updated, we need to invalidate cache for all tasks using this category
    if "color_hex" in update_data:
        affected_tasks = db.query(Task).filter(
            Task.category_id == category_id,
            Task.scheduled_slots.isnot(None)
        ).all()
        if affected_tasks:
            logging.info(f"Category {category_id} color updated, {len(affected_tasks)} tasks with scheduled slots affected")
    
    try:
        db.commit()
        db.refresh(category)
        return category
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category update failed"
        )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category."""
    category = db.query(Category).filter(
        Category.category_id == category_id,
        Category.user_id == current_user.user_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    try:
        db.delete(category)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with associated tasks"
        )


# Task endpoints
@router.get("", response_model=TaskListResponse)
async def get_tasks(
    status: Optional[str] = Query(None, pattern="^(todo|in_progress|completed|blocked|cancelled)$"),
    category_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None, pattern="^(low|medium|high|urgent)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", pattern="^(title|priority|deadline|created_at|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks with filtering, pagination, and sorting."""
    query = db.query(Task).filter(Task.user_id == current_user.user_id)
    
    # Apply filters
    if status:
        query = query.filter(Task.status == status.upper())
    if category_id:
        query = query.filter(Task.category_id == category_id)
    if priority:
        query = query.filter(Task.priority == priority.upper())
    
    # Get total count
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Task, sort_by)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)
    
    # Apply pagination
    offset = (page - 1) * limit
    tasks = query.offset(offset).limit(limit).options(
        joinedload(Task.category)
    ).all()
    
    return TaskListResponse(
        tasks=[TaskResponse.model_validate(task) for task in tasks],
        total=total,
        page=page,
        limit=limit,
        has_next=offset + limit < total,
        has_prev=page > 1
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: Request,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task."""
    try:
        raw_body = await request.body()
        logging.warning(f"[create_task] Raw request body: {raw_body}")
        try:
            json_body = await request.json()
            logging.warning(f"[create_task] Parsed JSON body: {json_body}")
        except Exception as e:
            logging.warning(f"[create_task] Could not parse JSON body: {e}")
        logging.warning(f"[create_task] Parsed task_data: {task_data}")
        logging.warning(f"[create_task] task_data.deadline type: {type(task_data.deadline)}, value: {task_data.deadline}")
    except Exception as e:
        logging.warning(f"[create_task] Could not log request body: {e}")
    # Validate category belongs to user
    if task_data.category_id:
        category = db.query(Category).filter(
            Category.category_id == task_data.category_id,
            Category.user_id == current_user.user_id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category"
            )
    
    # Validate parent task belongs to user
    if task_data.parent_task_id:
        parent_task = db.query(Task).filter(
            Task.task_id == task_data.parent_task_id,
            Task.user_id == current_user.user_id
        ).first()
        if not parent_task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid parent task"
            )
    
    db_task = Task(
        user_id=current_user.user_id,
        **task_data.model_dump()
    )
    
    try:
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task creation failed"
        )


def slot_overlaps(slot_start, slot_end, range_start, range_end):
    return slot_start < range_end and slot_end > range_start

def is_slot_within_availability(slot_start, slot_end, availability_slots):
    for slot in availability_slots:
        try:
            avail_start = datetime.strptime(slot['start_time'], '%H:%M').time()
            avail_end = datetime.strptime(slot['end_time'], '%H:%M').time()
            if slot['status'] == 'available':
                # Check if the scheduled slot is fully within this available slot
                if (slot_start.time() >= avail_start and slot_end.time() <= avail_end):
                    return True
        except Exception:
            continue
    return False

def is_slot_within_focus(slot_start, slot_end, focus_slots):
    for slot in focus_slots:
        try:
            focus_start = datetime.strptime(slot['start_time'], '%H:%M').time()
            focus_end = datetime.strptime(slot['end_time'], '%H:%M').time()
            if slot_overlaps(slot_start, slot_end, datetime.combine(slot_start.date(), focus_start), datetime.combine(slot_start.date(), focus_end)):
                return True
        except Exception:
            continue
    return False

@router.get("/scheduled", response_model=List[dict])
async def get_scheduled_events(
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all scheduled events for the user in the given date range."""
    logging.warning(f"[scheduled_events] Incoming start: {start}, end: {end}")
    start_date = date_parser.isoparse(start).astimezone(timezone.utc)
    end_date = date_parser.isoparse(end).astimezone(timezone.utc)
    logging.warning(f"[scheduled_events] Parsed start_date: {start_date}, end_date: {end_date}")

    # Query all tasks for the user with scheduled slots
    tasks = db.query(Task).filter(Task.user_id == current_user.user_id).all()
    logging.warning(f"[scheduled_events] Found {len(tasks)} tasks for user {current_user.user_id}")
    # Query all calendar days in range for the user
    calendar_days = db.query(UserCalendarDay).filter(
        UserCalendarDay.user_id == current_user.user_id,
        UserCalendarDay.date >= start,
        UserCalendarDay.date <= end
    ).all()
    logging.warning(f"[scheduled_events] Found {len(calendar_days)} calendar days for user {current_user.user_id}")
    calendar_day_map = {str(d.date): d for d in calendar_days}

    scheduled_events = []
    for task in tasks:
        slots = task.scheduled_slots if isinstance(task.scheduled_slots, list) else []
        for slot in slots:
            slot_start = date_parser.isoparse(slot['start_time']).astimezone(timezone.utc) if 'start_time' in slot else None
            slot_end = date_parser.isoparse(slot['end_time']).astimezone(timezone.utc) if 'end_time' in slot else None
            if not slot_start or not slot_end:
                logging.warning(f"[scheduled_events] Skipping slot with missing start/end: {slot}")
                continue
            # Check if slot overlaps with the requested range
            if slot_end < start_date or slot_start > end_date:
                continue
            # Validation
            validation = {'valid': True, 'reasons': []}
            calendar_day = calendar_day_map.get(slot_start.strftime('%Y-%m-%d'))
            if not calendar_day:
                validation['valid'] = False
                validation['reasons'].append('No calendar context for this day')
            else:
                # Check work environment
                fitting_envs = task.fitting_environments if isinstance(task.fitting_environments, list) else []
                if isinstance(fitting_envs, list) and len(fitting_envs) > 0:
                    if calendar_day.work_environment not in fitting_envs:
                        validation['valid'] = False
                        validation['reasons'].append('Work environment mismatch')
                # Check availability
                if not is_slot_within_availability(slot_start, slot_end, calendar_day.availability_slots):
                    validation['valid'] = False
                    validation['reasons'].append('Not within available time')
                # Check focus if required
                if getattr(task, 'requires_focus', False):
                    if not is_slot_within_focus(slot_start, slot_end, calendar_day.focus_slots):
                        validation['valid'] = False
                        validation['reasons'].append('Not within focus time')
            scheduled_events.append({
                'id': f"{task.task_id}-{slot['start_time']}",
                'task_id': str(task.task_id),
                'title': task.title,
                'start': slot['start_time'],
                'end': slot['end_time'],
                'category': task.category.name if task.category else None,
                'color': task.category.color_hex if task.category else None,
                'status': task.status,
                'estimated_duration_minutes': task.estimated_duration_minutes,
                'scheduled_slot': slot,
                'validation': validation
            })
    logging.warning(f"[scheduled_events] Returning {len(scheduled_events)} events")
    return scheduled_events


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task."""
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).options(
        joinedload(Task.category),
        joinedload(Task.comments)
    ).first()
    
    # Sort comments by creation time if they exist
    if task and task.comments:
        task.comments.sort(key=lambda c: c.created_at)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task."""
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Validate category belongs to user
    if "category_id" in update_data and update_data["category_id"]:
        category = db.query(Category).filter(
            Category.category_id == update_data["category_id"],
            Category.user_id == current_user.user_id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category"
            )
    
    # Validate parent task belongs to user
    if "parent_task_id" in update_data and update_data["parent_task_id"]:
        parent_task = db.query(Task).filter(
            Task.task_id == update_data["parent_task_id"],
            Task.user_id == current_user.user_id
        ).first()
        if not parent_task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid parent task"
            )
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # If category was updated and task has scheduled slots, we need to invalidate cache
    # This is a simple approach - in a production system you might want more sophisticated cache invalidation
    if "category_id" in update_data and task.scheduled_slots:
        logging.info(f"Task {task.task_id} category updated, scheduled events cache should be invalidated")
    
    try:
        db.commit()
        db.refresh(task)
        return task
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task update failed"
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task."""
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    try:
        db.delete(task)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete task with subtasks"
        )


# Task comments endpoints
@router.get("/{task_id}/comments", response_model=List[TaskCommentResponse])
async def get_task_comments(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comments for a task."""
    # Verify task belongs to user
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    comments = db.query(TaskComment).filter(
        TaskComment.task_id == task_id
    ).order_by(TaskComment.created_at.asc()).all()
    
    return comments


@router.post("/{task_id}/comments", response_model=TaskCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_task_comment(
    task_id: uuid.UUID,
    comment_data: TaskCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a comment for a task."""
    # Verify task belongs to user
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db_comment = TaskComment(
        task_id=task_id,
        user_id=current_user.user_id,
        content=comment_data.content
    )
    
    try:
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment creation failed"
        )


@router.put("/{task_id}/comments/{comment_id}", response_model=TaskCommentResponse)
async def update_task_comment(
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    comment_data: TaskCommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment for a task."""
    # Verify task belongs to user
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify comment exists and belongs to the task
    comment = db.query(TaskComment).filter(
        TaskComment.comment_id == comment_id,
        TaskComment.task_id == task_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Update the comment content
    setattr(comment, 'content', comment_data.content)
    
    try:
        db.commit()
        db.refresh(comment)
        return comment
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment update failed"
        )


@router.delete("/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_comment(
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment for a task."""
    # Verify task belongs to user
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify comment exists and belongs to the task
    comment = db.query(TaskComment).filter(
        TaskComment.comment_id == comment_id,
        TaskComment.task_id == task_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    try:
        db.delete(comment)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment deletion failed"
        )

# Add a global exception handler for 422 errors if not present
app = None
try:
    from ...main import app
except ImportError:
    pass
if app is not None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        raw_body = await request.body()
        logging.error(f"[422] Validation error: {exc.errors()} for raw body: {raw_body}")
        return await request_validation_exception_handler(request, exc) 