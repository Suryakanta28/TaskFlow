from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from backend.database import get_db, seed_user_roadmap
from backend.models import User, Task, StudyPath, RoadmapPhase, RoadmapItem, StudySession
from backend.schemas import (
    UserUpdate, 
    UserOnboarding, 
    UserResponse, 
    AvatarUpdate, 
    VALID_CATEGORIES, 
    normalize_category
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


def build_user_response(user: User, db: Session) -> UserResponse:
    total_tasks = db.query(Task).filter(Task.user_id == user.id).count()
    completed_tasks = db.query(Task).filter(Task.user_id == user.id, Task.status == "Completed").count()
    pending_tasks = total_tasks - completed_tasks

    # Calculate active roadmap completion rate and current phase
    active_path = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == user.id, StudyPath.is_active == True)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .first()
    )

    roadmap_rate = 0
    current_phase_title = "Phase 1"
    if active_path and active_path.phases:
        total_items = 0
        completed_items = 0
        found_current_phase = False
        for phase in active_path.phases:
            for item in phase.items:
                total_items += 1
                if item.status == "Completed":
                    completed_items += 1
                elif not found_current_phase:
                    current_phase_title = phase.title
                    found_current_phase = True
        if total_items > 0:
            roadmap_rate = int(round((completed_items / total_items * 100)))

    # Calculate total study minutes from sessions and tasks
    session_minutes = db.query(func.sum(StudySession.duration_minutes)).filter(StudySession.user_id == user.id).scalar() or 0
    task_minutes = db.query(func.sum(Task.actual_minutes)).filter(Task.user_id == user.id).scalar() or 0
    total_study_minutes = int(session_minutes + task_minutes)

    # Calculate streak (active study days in last 30 days)
    today = datetime.utcnow().date()
    streak = 0
    for day_offset in range(30):
        target_day = today - timedelta(days=day_offset)
        day_start = datetime.combine(target_day, datetime.min.time())
        day_end = datetime.combine(target_day, datetime.max.time())
        
        has_session = db.query(StudySession).filter(
            StudySession.user_id == user.id,
            StudySession.started_at >= day_start,
            StudySession.started_at <= day_end
        ).first() is not None

        has_completed_task = db.query(Task).filter(
            Task.user_id == user.id,
            Task.completed_at >= day_start,
            Task.completed_at <= day_end
        ).first() is not None

        if has_session or has_completed_task:
            streak += 1
        elif day_offset > 0:
            break

    cat_code = user.category or "FULL_STACK"
    cat_display = VALID_CATEGORIES.get(cat_code, cat_code)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        category=cat_code,
        study_path=cat_code,
        study_path_display=cat_display,
        current_level=user.current_level or "Beginner",
        daily_study_goal_minutes=user.daily_study_goal_minutes or 120,
        study_days_per_week=user.study_days_per_week or 6,
        target_date=user.target_date,
        phone=user.phone,
        timezone=user.timezone or "Asia/Kolkata",
        specific_goal=user.specific_goal,
        bio=user.bio,
        avatar_icon=user.avatar_icon or "👨‍💻",
        avatar_color=user.avatar_color or "#4f46e5",
        institution=user.institution,
        study_mode=user.study_mode or "Self-Taught / Independent",
        focus_subjects=user.focus_subjects or "",
        daily_reminder_time=user.daily_reminder_time or "09:00 AM",
        theme_preference=user.theme_preference or "light",
        onboarding_completed=user.onboarding_completed,
        created_at=user.created_at,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=max(pending_tasks, 0),
        roadmap_completion_rate=roadmap_rate,
        current_phase=current_phase_title,
        total_study_minutes=total_study_minutes,
        current_streak=streak
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user profile and study path progress"
)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return build_user_response(current_user, db)


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user profile and study settings"
)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.name is not None:
        trimmed_name = user_update.name.strip()
        if len(trimmed_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name must be at least 2 characters long."
            )
        current_user.name = trimmed_name

    category_changed = False
    old_category = current_user.category

    if user_update.category is not None:
        category_val = normalize_category(user_update.category)
        if category_val != old_category:
            current_user.category = category_val
            category_changed = True

    if user_update.current_level is not None:
        current_user.current_level = user_update.current_level
    if user_update.daily_study_goal_minutes is not None:
        current_user.daily_study_goal_minutes = user_update.daily_study_goal_minutes
    if user_update.study_days_per_week is not None:
        current_user.study_days_per_week = user_update.study_days_per_week
    if user_update.target_date is not None:
        current_user.target_date = user_update.target_date
    if user_update.phone is not None:
        current_user.phone = user_update.phone.strip() if user_update.phone else None
    if user_update.timezone is not None:
        current_user.timezone = user_update.timezone
    if user_update.specific_goal is not None:
        current_user.specific_goal = user_update.specific_goal.strip() if user_update.specific_goal else None
    if user_update.bio is not None:
        current_user.bio = user_update.bio.strip() if user_update.bio else None
    if user_update.avatar_icon is not None:
        current_user.avatar_icon = user_update.avatar_icon
    if user_update.avatar_color is not None:
        current_user.avatar_color = user_update.avatar_color
    if user_update.institution is not None:
        current_user.institution = user_update.institution.strip() if user_update.institution else None
    if user_update.study_mode is not None:
        current_user.study_mode = user_update.study_mode
    if user_update.focus_subjects is not None:
        current_user.focus_subjects = user_update.focus_subjects
    if user_update.daily_reminder_time is not None:
        current_user.daily_reminder_time = user_update.daily_reminder_time
    if user_update.theme_preference is not None:
        current_user.theme_preference = user_update.theme_preference

    # Handle Category Change & Roadmap Preservation
    if category_changed:
        db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})

        existing_path = db.query(StudyPath).filter(
            StudyPath.user_id == current_user.id,
            StudyPath.category == current_user.category
        ).first()

        if existing_path and not user_update.archive_previous_roadmap:
            existing_path.is_active = True
        else:
            seed_user_roadmap(db, current_user, current_user.category)

    db.commit()
    db.refresh(current_user)

    return build_user_response(current_user, db)


@router.post(
    "/avatar",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update avatar icon and color"
)
def update_avatar(
    avatar_data: AvatarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.avatar_icon = avatar_data.avatar_icon
    current_user.avatar_color = avatar_data.avatar_color
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user, db)


@router.get(
    "/export-data",
    summary="Export all user tasks, study paths, roadmaps, and sessions as JSON backup"
)
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all tasks
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    task_list = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "due_date": t.due_date,
            "planned_date": t.planned_date,
            "estimated_minutes": t.estimated_minutes,
            "actual_minutes": t.actual_minutes,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "created_at": t.created_at.isoformat()
        }
        for t in tasks
    ]

    # Fetch study paths & roadmaps
    study_paths = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == current_user.id)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .all()
    )
    paths_list = []
    for sp in study_paths:
        phases_list = []
        for ph in sp.phases:
            items_list = [
                {
                    "id": item.id,
                    "title": item.title,
                    "subject": item.subject,
                    "item_type": item.item_type,
                    "status": item.status,
                    "estimated_minutes": item.estimated_minutes,
                    "completed_at": item.completed_at.isoformat() if item.completed_at else None
                }
                for item in ph.items
            ]
            phases_list.append({
                "id": ph.id,
                "title": ph.title,
                "sequence_number": ph.sequence_number,
                "items": items_list
            })
        paths_list.append({
            "id": sp.id,
            "title": sp.title,
            "category": sp.category,
            "is_active": sp.is_active,
            "phases": phases_list
        })

    # Fetch study sessions
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()
    session_list = [
        {
            "id": s.id,
            "duration_minutes": s.duration_minutes,
            "notes": s.notes,
            "started_at": s.started_at.isoformat(),
            "ended_at": s.ended_at.isoformat() if s.ended_at else None
        }
        for s in sessions
    ]

    backup_payload = {
        "export_metadata": {
            "app": "TaskFlow Study Path & Task Manager",
            "version": "2.0",
            "exported_at": datetime.utcnow().isoformat() + "Z",
        },
        "user_profile": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "category": current_user.category,
            "current_level": current_user.current_level,
            "daily_study_goal_minutes": current_user.daily_study_goal_minutes,
            "study_days_per_week": current_user.study_days_per_week,
            "target_date": current_user.target_date,
            "specific_goal": current_user.specific_goal,
            "bio": current_user.bio,
            "avatar_icon": current_user.avatar_icon,
            "avatar_color": current_user.avatar_color,
            "institution": current_user.institution,
            "study_mode": current_user.study_mode,
            "focus_subjects": current_user.focus_subjects,
            "timezone": current_user.timezone,
            "created_at": current_user.created_at.isoformat()
        },
        "study_paths": paths_list,
        "tasks": task_list,
        "study_sessions": session_list
    }

    return JSONResponse(
        content=backup_payload,
        headers={"Content-Disposition": f"attachment; filename=taskflow-backup-{current_user.id}.json"}
    )


@router.post(
    "/reset-roadmap",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset and re-seed the syllabus roadmap for the user's active study path"
)
def reset_user_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Archive existing study paths
    db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})
    # Seed fresh roadmap
    seed_user_roadmap(db, current_user, current_user.category)
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user, db)


@router.post(
    "/onboarding",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete study path onboarding questionnaire"
)
def complete_onboarding(
    onboarding_data: UserOnboarding,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat_code = normalize_category(onboarding_data.study_path)
    current_user.category = cat_code
    current_user.current_level = onboarding_data.current_level or "Beginner"
    current_user.daily_study_goal_minutes = onboarding_data.daily_study_goal_minutes or 120
    current_user.study_days_per_week = onboarding_data.study_days_per_week or 6
    current_user.target_date = onboarding_data.target_date
    current_user.specific_goal = onboarding_data.specific_goal
    if onboarding_data.focus_subjects:
        current_user.focus_subjects = ", ".join(onboarding_data.focus_subjects)
    current_user.onboarding_completed = True

    # Check if user already has an active study path for this category
    existing_path = db.query(StudyPath).filter(
        StudyPath.user_id == current_user.id,
        StudyPath.category == cat_code
    ).first()

    if not existing_path:
        db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})
        seed_user_roadmap(db, current_user, cat_code)
    else:
        db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})
        existing_path.is_active = True

    db.commit()
    db.refresh(current_user)

    return build_user_response(current_user, db)
