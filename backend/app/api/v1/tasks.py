from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from ...db.session import get_db
from ...db.models import User, Task, Category, TaskComment
from ...schemas.tasks import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    TaskCommentCreate, TaskCommentUpdate, TaskCommentResponse
)
from ...core.auth import get_current_user

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
    category_id: str,
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
    category_id: str,
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
    status: Optional[str] = Query(None, regex="^(todo|in_progress|completed|blocked|cancelled)$"),
    category_id: Optional[str] = Query(None),
    priority: Optional[str] = Query(None, regex="^(low|medium|high|urgent)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", regex="^(title|priority|deadline|created_at|updated_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks with filtering, pagination, and sorting."""
    query = db.query(Task).filter(Task.user_id == current_user.user_id)
    
    # Apply filters
    if status:
        query = query.filter(Task.status == status)
    if category_id:
        query = query.filter(Task.category_id == category_id)
    if priority:
        query = query.filter(Task.priority == priority)
    
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
        tasks=tasks,
        total=total,
        page=page,
        limit=limit,
        has_next=offset + limit < total,
        has_prev=page > 1
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task."""
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
        **task_data.dict()
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


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task."""
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.user_id == current_user.user_id
    ).options(
        joinedload(Task.category)
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
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
    
    update_data = task_update.dict(exclude_unset=True)
    
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
    task_id: str,
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
    task_id: str,
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
    ).order_by(TaskComment.created_at.desc()).all()
    
    return comments


@router.post("/{task_id}/comments", response_model=TaskCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_task_comment(
    task_id: str,
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