import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Task, User, RoadmapItem
from backend.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskStats,
    SubtaskToggleRequest,
    VALID_CATEGORIES
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get(
    "",
    response_model=List[TaskResponse],
    status_code=status.HTTP_200_OK,
    summary="Get tasks for the current user with filters and search"
)
def get_tasks(
    status: Optional[str] = Query(None, description="Filter by status: 'Pending', 'In Progress', 'Completed'"),
    priority: Optional[str] = Query(None, description="Filter by priority: 'Low', 'Medium', 'High'"),
    category: Optional[str] = Query(None, description="Filter by subject or module"),
    search: Optional[str] = Query(None, description="Search keyword in title, description, or tags"),
    sort_by: Optional[str] = Query("created_at", description="Field to sort by: 'due_date', 'created_at', 'priority', 'title', 'planned_date'"),
    order: Optional[str] = Query("desc", description="Sort order: 'asc' or 'desc'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # MULTI-USER ISOLATION
    query = db.query(Task).filter(Task.user_id == current_user.id)

    # Status filter
    if status and status.strip() and status.lower() != "all":
        query = query.filter(Task.status == status.strip())

    # Priority filter
    if priority and priority.strip() and priority.lower() != "all":
        query = query.filter(Task.priority == priority.strip())

    # Category filter
    if category and category.strip() and category.lower() != "all":
        query = query.filter(Task.category == category.strip())

    # Search filter
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
                Task.tags.ilike(search_pattern),
                Task.category.ilike(search_pattern)
            )
        )

    # Sorting
    sort_column = Task.created_at
    if sort_by == "due_date":
        sort_column = Task.due_date
    elif sort_by == "planned_date":
        sort_column = Task.planned_date
    elif sort_by == "title":
        sort_column = Task.title
    elif sort_by == "priority":
        sort_column = Task.priority
    elif sort_by == "status":
        sort_column = Task.status

    if order and order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    tasks = query.all()
    return tasks


@router.get(
    "/stats",
    response_model=TaskStats,
    status_code=status.HTTP_200_OK,
    summary="Get task statistics for the logged-in user"
)
def get_task_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today_date = datetime.utcnow().date()
    user_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    total = len(user_tasks)
    pending = sum(1 for t in user_tasks if t.status == "Pending")
    in_progress = sum(1 for t in user_tasks if t.status == "In Progress")
    completed = sum(1 for t in user_tasks if t.status == "Completed")
    high_priority = sum(1 for t in user_tasks if t.priority == "High")

    overdue = 0
    for t in user_tasks:
        if t.due_date and t.status != "Completed":
            try:
                d = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                if d < today_date:
                    overdue += 1
            except ValueError:
                pass

    completion_rate = int(round((completed / total * 100))) if total > 0 else 0
    cat_code = current_user.category or "FULL_STACK"
    cat_display = VALID_CATEGORIES.get(cat_code, cat_code)

    return TaskStats(
        total=total,
        pending=pending,
        in_progress=in_progress,
        completed=completed,
        overdue=overdue,
        high_priority=high_priority,
        completion_rate=completion_rate,
        category=cat_code,
        category_display=cat_display
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get details of a specific task"
)
def get_task_by_id(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} was not found."
        )
    return task


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task"
)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_task = Task(
        title=task_data.title.strip(),
        description=task_data.description.strip() if task_data.description else None,
        category=task_data.category.strip() if task_data.category else "General",
        priority=task_data.priority,
        status=task_data.status,
        due_date=task_data.due_date,
        planned_date=task_data.planned_date,
        estimated_minutes=task_data.estimated_minutes or 60,
        actual_minutes=task_data.actual_minutes or 0,
        roadmap_item_id=task_data.roadmap_item_id,
        subtasks=task_data.subtasks or "[]",
        tags=task_data.tags.strip() if task_data.tags else "",
        user_id=current_user.id,
        completed_at=datetime.utcnow() if task_data.status == "Completed" else None
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update an existing task"
)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )

    if task_update.title is not None:
        task.title = task_update.title.strip()
    if task_update.description is not None:
        task.description = task_update.description.strip() if task_update.description else None
    if task_update.category is not None:
        task.category = task_update.category.strip()
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.status is not None:
        task.status = task_update.status
        if task_update.status == "Completed" and not task.completed_at:
            task.completed_at = datetime.utcnow()
        elif task_update.status != "Completed":
            task.completed_at = None
    if task_update.due_date is not None:
        task.due_date = task_update.due_date
    if task_update.planned_date is not None:
        task.planned_date = task_update.planned_date
    if task_update.estimated_minutes is not None:
        task.estimated_minutes = task_update.estimated_minutes
    if task_update.actual_minutes is not None:
        task.actual_minutes = task_update.actual_minutes
    if task_update.roadmap_item_id is not None:
        task.roadmap_item_id = task_update.roadmap_item_id
    if task_update.subtasks is not None:
        task.subtasks = task_update.subtasks
    if task_update.tags is not None:
        task.tags = task_update.tags.strip()

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a task"
)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully", "id": task_id}


@router.patch(
    "/{task_id}/complete",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle or mark task as Completed"
)
def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )

    if task.status == "Completed":
        task.status = "Pending"
        task.completed_at = None
    else:
        task.status = "Completed"
        task.completed_at = datetime.utcnow()

    # If linked to roadmap item, sync status
    if task.roadmap_item_id:
        r_item = db.query(RoadmapItem).filter(RoadmapItem.id == task.roadmap_item_id).first()
        if r_item:
            r_item.status = task.status
            r_item.completed_at = task.completed_at

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.patch(
    "/{task_id}/toggle-subtask",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle subtask completion"
)
def toggle_subtask(
    task_id: int,
    subtask_data: SubtaskToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )

    try:
        subtasks_list = json.loads(task.subtasks) if task.subtasks else []
    except Exception:
        subtasks_list = []

    for item in subtasks_list:
        if item.get("id") == subtask_data.subtask_id:
            item["done"] = subtask_data.completed
            break

    task.subtasks = json.dumps(subtasks_list)
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task
