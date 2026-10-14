from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db, seed_user_roadmap
from backend.models import User, Task, StudyPath, RoadmapPhase, RoadmapItem
from backend.schemas import (
    StudyPlanResponse,
    StudyPlanDay,
    StudyPlanScheduleRequest,
    ScheduleTopicRequest,
    TaskResponse,
    VALID_CATEGORIES
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/study-plan", tags=["Study Plan"])


@router.get(
    "",
    response_model=StudyPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Get today's study plan and 7-day weekly schedule"
)
def get_study_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow()
    today_str = today.strftime("%Y-%m-%d")
    today_date = today.date()

    # 1. Resolve Active study path & roadmap
    user_cat = current_user.category or "FULL_STACK"
    active_path = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == current_user.id, StudyPath.category == user_cat)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .first()
    )

    if not active_path:
        seed_user_roadmap(db, current_user, user_cat)
        active_path = (
            db.query(StudyPath)
            .filter(StudyPath.user_id == current_user.id, StudyPath.category == user_cat)
            .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
            .first()
        )

    active_roadmap_item_ids = set()
    roadmap_item_map = {}
    unscheduled_topics = []

    if active_path and active_path.phases:
        for phase in active_path.phases:
            for item in phase.items:
                active_roadmap_item_ids.add(item.id)
                roadmap_item_map[item.id] = {
                    "id": item.id,
                    "title": item.title,
                    "subject": item.subject,
                    "phase_title": phase.title,
                    "estimated_minutes": item.estimated_minutes,
                    "status": item.status
                }

    # 2. Filter User's tasks strictly for Active Study Path
    all_raw_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    user_tasks = []
    scheduled_item_ids = set()

    for t in all_raw_tasks:
        if t.roadmap_item_id is not None:
            if t.roadmap_item_id in active_roadmap_item_ids:
                user_tasks.append(t)
                scheduled_item_ids.add(t.roadmap_item_id)
        else:
            user_tasks.append(t)

    # Incomplete topics from active syllabus not yet in today/weekly schedule
    for it_id, it_data in roadmap_item_map.items():
        if it_data["status"] != "Completed" and it_id not in scheduled_item_ids:
            unscheduled_topics.append(it_data)

    # Today's plan
    today_plan_tasks = [
        t for t in user_tasks
        if t.planned_date == today_str or t.due_date == today_str or (t.status == "In Progress" and not t.planned_date)
    ]
    today_plan_tasks.sort(key=lambda t: (1 if t.status == "Completed" else 0, 0 if t.priority == "High" else (1 if t.priority == "Medium" else 2)))

    today_total_minutes = sum(t.estimated_minutes for t in today_plan_tasks)
    today_completed_minutes = sum(t.estimated_minutes for t in today_plan_tasks if t.status == "Completed")

    # Overdue tasks
    overdue_tasks = []
    for t in user_tasks:
        if t.due_date and t.status != "Completed":
            try:
                d = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                if d < today_date:
                    overdue_tasks.append(t)
            except ValueError:
                pass

    # Weekly schedule: next 7 days
    weekly_schedule = []
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for i in range(7):
        target_day = today_date + timedelta(days=i)
        target_str = target_day.strftime("%Y-%m-%d")
        day_name = day_names[target_day.weekday()]

        day_tasks = [
            t for t in user_tasks
            if t.planned_date == target_str or (t.due_date == target_str and not t.planned_date)
        ]

        total_day_min = sum(t.estimated_minutes for t in day_tasks)
        completed_day_tasks = sum(1 for t in day_tasks if t.status == "Completed")

        weekly_schedule.append(StudyPlanDay(
            date=target_str,
            day_name=f"Today ({day_name})" if i == 0 else day_name,
            total_planned_minutes=total_day_min,
            total_tasks=len(day_tasks),
            completed_tasks=completed_day_tasks,
            tasks=[TaskResponse.model_validate(t) for t in day_tasks]
        ))

    cat_display = VALID_CATEGORIES.get(user_cat, user_cat)

    return StudyPlanResponse(
        today=today_str,
        study_path_title=active_path.title if active_path else f"{cat_display} Study Path",
        study_path_category=user_cat,
        study_path_display=cat_display,
        today_plan=[TaskResponse.model_validate(t) for t in today_plan_tasks],
        today_total_minutes=today_total_minutes,
        today_completed_minutes=today_completed_minutes,
        overdue_tasks=[TaskResponse.model_validate(t) for t in overdue_tasks],
        weekly_schedule=weekly_schedule,
        unscheduled_topics=unscheduled_topics[:10]
    )


@router.post(
    "/schedule",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Schedule or reschedule an existing study task"
)
def schedule_study_task(
    req: StudyPlanScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == req.task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {req.task_id} not found."
        )

    task.planned_date = req.planned_date
    if req.estimated_minutes:
        task.estimated_minutes = req.estimated_minutes
    if req.priority:
        task.priority = req.priority

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.post(
    "/schedule-topic",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Schedule a syllabus roadmap topic into the study plan"
)
def schedule_syllabus_topic(
    req: ScheduleTopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify roadmap item exists and belongs to current user
    item = (
        db.query(RoadmapItem)
        .join(RoadmapPhase)
        .join(StudyPath)
        .filter(RoadmapItem.id == req.roadmap_item_id, StudyPath.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Syllabus topic with ID {req.roadmap_item_id} not found."
        )

    # Check if a task already exists for this roadmap item
    task = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.roadmap_item_id == item.id
    ).first()

    if task:
        task.planned_date = req.planned_date
        task.estimated_minutes = req.estimated_minutes or item.estimated_minutes or 60
        if req.priority:
            task.priority = req.priority
        if task.status == "Completed":
            task.status = "In Progress"
        task.updated_at = datetime.utcnow()
    else:
        task = Task(
            user_id=current_user.id,
            roadmap_item_id=item.id,
            title=f"Study: {item.title}",
            description=f"Read notes and practice problems for {item.title}.",
            category=item.subject or "General",
            priority=req.priority or "Medium",
            status="Pending",
            planned_date=req.planned_date,
            due_date=req.planned_date,
            estimated_minutes=req.estimated_minutes or item.estimated_minutes or 60
        )
        db.add(task)

    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)

