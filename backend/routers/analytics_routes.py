from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db, seed_user_roadmap
from backend.models import User, Task, StudyPath, RoadmapPhase, RoadmapItem, StudySession
from backend.schemas import (
    DashboardOverviewResponse,
    AnalyticsOverviewResponse,
    WeeklyProgressWidget,
    DayProgress,
    SubjectBreakdownItem,
    ContinueLearningWidget,
    StudySessionCreate,
    StudySessionResponse,
    TaskResponse,
    VALID_CATEGORIES
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Dashboard Overview"])


@router.get(
    "/dashboard-overview",
    response_model=DashboardOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complete personalized dashboard payload"
)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow()
    today_str = today.strftime("%Y-%m-%d")
    today_date = today.date()

    # 1. Resolve Active study path & roadmap calculation (Strictly aligned with current_user.category)
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

    # Ensure this path is marked active and any older paths are deactivated
    db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})
    if active_path:
        active_path.is_active = True
        db.commit()

    total_roadmap_items = 0
    completed_roadmap_items = 0
    current_phase_title = "Phase 1"
    first_incomplete_item = None
    active_roadmap_item_ids = set()
    syllabus_phases = []
    subject_map: Dict[str, Dict[str, Any]] = {}

    if active_path and active_path.phases:
        for phase in active_path.phases:
            p_items = phase.items or []
            p_total = len(p_items)
            p_completed = sum(1 for item in p_items if item.status == "Completed")
            p_pct = int(round((p_completed / p_total * 100))) if p_total > 0 else 0

            syllabus_phases.append({
                "id": phase.id,
                "title": phase.title,
                "sequence_number": phase.sequence_number,
                "total_items": p_total,
                "completed_items": p_completed,
                "progress_percentage": p_pct,
                "is_current": False
            })

            for item in p_items:
                total_roadmap_items += 1
                active_roadmap_item_ids.add(item.id)
                if item.status == "Completed":
                    completed_roadmap_items += 1
                elif not first_incomplete_item:
                    first_incomplete_item = item
                    current_phase_title = phase.title

                # Aggregate by subject
                sub = item.subject or "General"
                if sub not in subject_map:
                    subject_map[sub] = {"subject": sub, "total": 0, "completed": 0, "minutes": 0}
                subject_map[sub]["total"] += 1
                if item.status == "Completed":
                    subject_map[sub]["completed"] += 1
                subject_map[sub]["minutes"] += (item.estimated_minutes or 60)

    # Mark current active phase in list
    for sp in syllabus_phases:
        if sp["title"] == current_phase_title:
            sp["is_current"] = True
            break
    if not any(sp["is_current"] for sp in syllabus_phases) and syllabus_phases:
        syllabus_phases[0]["is_current"] = True

    roadmap_pct = int(round((completed_roadmap_items / total_roadmap_items * 100))) if total_roadmap_items > 0 else 0

    # Build structured subject breakdown items
    syllabus_subjects = []
    for sub_name, data in subject_map.items():
        pct = int(round((data["completed"] / data["total"] * 100))) if data["total"] > 0 else 0
        syllabus_subjects.append(SubjectBreakdownItem(
            subject=sub_name,
            completed=data["completed"],
            total=data["total"],
            progress_percentage=pct,
            estimated_minutes=data["minutes"]
        ))
    syllabus_subjects.sort(key=lambda s: s.total, reverse=True)

    # Continue Learning Widget
    if first_incomplete_item:
        continue_learning = ContinueLearningWidget(
            has_active_topic=True,
            phase_title=current_phase_title,
            subject=first_incomplete_item.subject,
            topic_id=first_incomplete_item.id,
            topic_title=first_incomplete_item.title,
            estimated_minutes=first_incomplete_item.estimated_minutes,
            overall_progress=roadmap_pct,
            resource_url=first_incomplete_item.resource_url
        )
    else:
        continue_learning = ContinueLearningWidget(
            has_active_topic=False,
            phase_title=active_path.phases[0].title if (active_path and active_path.phases) else "Phase 1",
            subject="All Done",
            topic_title="All syllabus items completed! 🎉",
            overall_progress=roadmap_pct
        )

    # 2. Filter User Tasks: MUST RELATE to the Active Study Path
    all_raw_user_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    user_tasks = []
    for t in all_raw_user_tasks:
        if t.roadmap_item_id is not None:
            # If linked to a roadmap item, MUST belong to this active study path!
            if t.roadmap_item_id in active_roadmap_item_ids:
                user_tasks.append(t)
        else:
            # Custom tasks created by user
            user_tasks.append(t)

    total_tasks = len(user_tasks)
    pending_tasks = sum(1 for t in user_tasks if t.status == "Pending")
    in_progress_tasks = sum(1 for t in user_tasks if t.status == "In Progress")
    completed_tasks = sum(1 for t in user_tasks if t.status == "Completed")

    overdue_tasks = 0
    for t in user_tasks:
        if t.due_date and t.status != "Completed":
            try:
                d = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                if d < today_date:
                    overdue_tasks += 1
            except ValueError:
                pass

    # Today's Study Plan Tasks:
    # Includes tasks scheduled for today, due today, in progress, created today, or open tasks
    today_plan_tasks = []
    for t in user_tasks:
        is_planned_today = (t.planned_date == today_str)
        is_due_today = (t.due_date == today_str)
        is_in_progress = (t.status == "In Progress")
        is_created_today = (t.created_at and t.created_at.date() == today_date)
        is_open_no_date = (t.status != "Completed" and not t.planned_date and not t.due_date)

        if is_planned_today or is_due_today or is_in_progress or is_created_today or is_open_no_date:
            today_plan_tasks.append(t)

    today_plan_tasks.sort(key=lambda t: (1 if t.status == "Completed" else 0, 0 if t.priority == "High" else 1))

    # Upcoming Tasks (due in the next 7 days, excluding today)
    upcoming_tasks = []
    for t in user_tasks:
        if t.due_date and t.status != "Completed":
            try:
                d = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                if today_date < d <= today_date + timedelta(days=7):
                    upcoming_tasks.append(t)
            except ValueError:
                pass
        if t.due_date and t.status != "Completed":
            try:
                d = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                if today_date < d <= today_date + timedelta(days=7):
                    upcoming_tasks.append(t)
            except ValueError:
                pass
    upcoming_tasks.sort(key=lambda t: t.due_date or "")

    # Weekly Progress Widget (last 7 days of actual data)
    days_progress = []
    total_week_study_min = 0
    total_tasks_completed_week = 0
    daily_goal_min = current_user.daily_study_goal_minutes or 120
    days_goal_reached = 0
    best_day_name = None
    best_day_minutes = 0

    study_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.started_at >= today - timedelta(days=7)
    ).all()

    for i in range(6, -1, -1):
        d_date = today_date - timedelta(days=i)
        d_str = d_date.strftime("%Y-%m-%d")
        day_abbr = d_date.strftime("%a")

        # Count completed tasks on this date
        day_completed = sum(1 for t in user_tasks if t.completed_at and t.completed_at.date() == d_date)
        total_tasks_completed_week += day_completed

        # Sum study minutes on this date
        day_study_min = sum(s.duration_minutes for s in study_sessions if s.started_at and s.started_at.date() == d_date)
        total_week_study_min += day_study_min

        goal_reached = day_study_min >= daily_goal_min and day_study_min > 0
        if goal_reached:
            days_goal_reached += 1
        if day_study_min > best_day_minutes:
            best_day_minutes = day_study_min
            best_day_name = day_abbr

        days_progress.append(DayProgress(
            date=d_str,
            day_of_week=day_abbr,
            completed_tasks_count=day_completed,
            study_minutes=day_study_min,
            goal_reached=goal_reached
        ))

    weekly_goal_min = daily_goal_min * (current_user.study_days_per_week or 6)
    goal_pct = int(round((total_week_study_min / weekly_goal_min * 100))) if weekly_goal_min > 0 else 0
    daily_avg_min = int(round(total_week_study_min / 7))

    weekly_progress = WeeklyProgressWidget(
        days=days_progress,
        weekly_goal_minutes=weekly_goal_min,
        actual_studied_minutes=total_week_study_min,
        goal_completion_percentage=min(goal_pct, 100),
        total_tasks_completed_this_week=total_tasks_completed_week,
        daily_average_minutes=daily_avg_min,
        best_day_name=best_day_name or "None",
        best_day_minutes=best_day_minutes,
        days_goal_reached=days_goal_reached
    )

    cat_code = current_user.category or "FULL_STACK"
    cat_display = VALID_CATEGORIES.get(cat_code, cat_code)

    user_dict = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "category": cat_code,
        "study_path": cat_code,
        "current_level": current_user.current_level or "Beginner",
        "daily_study_goal_minutes": current_user.daily_study_goal_minutes or 120,
        "study_days_per_week": current_user.study_days_per_week or 6,
        "target_date": current_user.target_date,
        "specific_goal": current_user.specific_goal,
        "avatar_icon": current_user.avatar_icon or "👨‍💻",
        "avatar_color": current_user.avatar_color or "#4f46e5"
    }

    stats_dict = {
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "roadmap_completion_pct": roadmap_pct,
        "roadmap_completion_rate": roadmap_pct
    }

    return DashboardOverviewResponse(
        user_name=current_user.name,
        study_path_code=cat_code,
        study_path_display=cat_display,
        current_level=current_user.current_level or "Beginner",
        current_phase=current_phase_title,
        daily_study_goal_minutes=current_user.daily_study_goal_minutes or 120,
        upcoming_deadline=current_user.target_date,
        specific_goal=current_user.specific_goal,
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        roadmap_completion_rate=roadmap_pct,
        today_study_plan=[TaskResponse.model_validate(t) for t in today_plan_tasks],
        all_tasks=[TaskResponse.model_validate(t) for t in user_tasks],
        continue_learning=continue_learning,
        upcoming_tasks=[TaskResponse.model_validate(t) for t in upcoming_tasks[:8]],
        weekly_progress=weekly_progress,
        syllabus_subjects=syllabus_subjects,
        syllabus_phases=syllabus_phases,
        user=user_dict,
        stats=stats_dict
    )


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get analytics metrics overview"
)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow()
    today_date = today.date()

    # User tasks breakdown
    user_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    total_tasks = len(user_tasks)
    completed_tasks = sum(1 for t in user_tasks if t.status == "Completed")
    pending_tasks = sum(1 for t in user_tasks if t.status == "Pending")

    overdue_tasks = 0
    priority_counts: Dict[str, int] = {"Low": 0, "Medium": 0, "High": 0}

    for t in user_tasks:
        if t.priority in priority_counts:
            priority_counts[t.priority] += 1

        if t.due_date and t.status != "Completed":
            try:
                d = datetime.strptime(t.due_date, "%Y-%m-%d").date()
                if d < today_date:
                    overdue_tasks += 1
            except ValueError:
                pass

    task_rate = int(round((completed_tasks / total_tasks * 100))) if total_tasks > 0 else 0

    # Roadmap progress and subject breakdown
    active_path = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == current_user.id, StudyPath.is_active == True)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .first()
    )

    total_roadmap_topics = 0
    completed_roadmap_topics = 0
    subject_map: Dict[str, Dict[str, int]] = {}

    if active_path and active_path.phases:
        for phase in active_path.phases:
            for item in phase.items:
                total_roadmap_topics += 1
                sub = item.subject or "Core Topics"
                if sub not in subject_map:
                    subject_map[sub] = {"completed": 0, "total": 0, "estimated_minutes": 0}
                subject_map[sub]["total"] += 1
                subject_map[sub]["estimated_minutes"] += (item.estimated_minutes or 60)
                if item.status == "Completed":
                    completed_roadmap_topics += 1
                    subject_map[sub]["completed"] += 1

    # Fallback to tasks if no active roadmap items found
    if not subject_map and user_tasks:
        for t in user_tasks:
            sub = t.category or "General"
            if sub not in subject_map:
                subject_map[sub] = {"completed": 0, "total": 0, "estimated_minutes": 0}
            subject_map[sub]["total"] += 1
            subject_map[sub]["estimated_minutes"] += (t.estimated_minutes or 60)
            if t.status == "Completed":
                subject_map[sub]["completed"] += 1

    subject_breakdown: List[SubjectBreakdownItem] = []
    for sub_name, counts in subject_map.items():
        pct = int(round((counts["completed"] / counts["total"] * 100))) if counts["total"] > 0 else 0
        subject_breakdown.append(SubjectBreakdownItem(
            subject=sub_name,
            completed=counts["completed"],
            total=counts["total"],
            progress_percentage=pct,
            estimated_minutes=counts["estimated_minutes"]
        ))
    subject_breakdown.sort(key=lambda x: (x.total, x.progress_percentage), reverse=True)

    roadmap_rate = int(round((completed_roadmap_topics / total_roadmap_topics * 100))) if total_roadmap_topics > 0 else 0

    # Overall Preparation Readiness Score (Roadmap 60%, Tasks 40%)
    if total_roadmap_topics > 0 and total_tasks > 0:
        readiness_score = int(round((roadmap_rate * 0.6) + (task_rate * 0.4)))
    elif total_roadmap_topics > 0:
        readiness_score = roadmap_rate
    elif total_tasks > 0:
        readiness_score = task_rate
    else:
        readiness_score = 0

    # Target Date Countdown
    days_remaining = None
    if current_user.target_date:
        try:
            t_date = datetime.strptime(current_user.target_date, "%Y-%m-%d").date()
            diff = (t_date - today_date).days
            days_remaining = max(diff, 0)
        except ValueError:
            pass

    # Study sessions
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).order_by(StudySession.started_at.desc()).all()
    total_study_minutes = sum(s.duration_minutes for s in sessions)
    week_sessions = [s for s in sessions if s.started_at and s.started_at >= today - timedelta(days=7)]
    weekly_study_minutes = sum(s.duration_minutes for s in week_sessions)

    # 7-Day Velocity Calculation
    daily_goal_min = current_user.daily_study_goal_minutes or 120
    days_progress = []
    total_week_study_min = 0
    total_tasks_completed_week = 0
    days_goal_reached = 0
    best_day_name = None
    best_day_minutes = 0

    for i in range(6, -1, -1):
        d_date = today_date - timedelta(days=i)
        d_str = d_date.strftime("%Y-%m-%d")
        day_abbr = d_date.strftime("%a")

        day_completed = sum(1 for t in user_tasks if t.completed_at and t.completed_at.date() == d_date)
        total_tasks_completed_week += day_completed

        day_study_min = sum(s.duration_minutes for s in week_sessions if s.started_at and s.started_at.date() == d_date)
        total_week_study_min += day_study_min

        goal_reached = day_study_min >= daily_goal_min and day_study_min > 0
        if goal_reached:
            days_goal_reached += 1
        if day_study_min > best_day_minutes:
            best_day_minutes = day_study_min
            best_day_name = day_abbr

        days_progress.append(DayProgress(
            date=d_str,
            day_of_week=day_abbr,
            completed_tasks_count=day_completed,
            study_minutes=day_study_min,
            goal_reached=goal_reached
        ))

    weekly_goal_min = daily_goal_min * (current_user.study_days_per_week or 6)
    goal_pct = int(round((total_week_study_min / weekly_goal_min * 100))) if weekly_goal_min > 0 else 0
    daily_avg_min = int(round(total_week_study_min / 7))

    weekly_progress = WeeklyProgressWidget(
        days=days_progress,
        weekly_goal_minutes=weekly_goal_min,
        actual_studied_minutes=total_week_study_min,
        goal_completion_percentage=min(goal_pct, 100),
        total_tasks_completed_this_week=total_tasks_completed_week,
        daily_average_minutes=daily_avg_min,
        best_day_name=best_day_name or "None",
        best_day_minutes=best_day_minutes,
        days_goal_reached=days_goal_reached
    )

    # Streak calculation (past 30 days)
    streak = 0
    for i in range(30):
        check_date = today_date - timedelta(days=i)
        has_activity = any(
            (s.started_at and s.started_at.date() == check_date) or 
            (t.completed_at and t.completed_at.date() == check_date)
            for s in sessions for t in user_tasks
        )
        if has_activity:
            streak += 1
        elif i > 0:
            break

    cat_code = current_user.category or "FULL_STACK"
    cat_display = VALID_CATEGORIES.get(cat_code, cat_code)

    recent_session_list = [StudySessionResponse.model_validate(s) for s in sessions[:15]]

    return AnalyticsOverviewResponse(
        user_name=current_user.name,
        study_path_code=cat_code,
        study_path_display=cat_display,
        current_level=current_user.current_level or "Beginner",
        target_date=current_user.target_date,
        days_remaining=days_remaining,
        readiness_score=readiness_score,
        daily_goal_minutes=daily_goal_min,

        streak_days=max(streak, 1) if (total_tasks > 0 or total_study_minutes > 0) else 0,
        total_study_minutes=total_study_minutes,
        weekly_study_minutes=weekly_study_minutes,
        completed_tasks_count=completed_tasks,
        total_tasks_count=total_tasks,
        pending_tasks_count=pending_tasks,
        overdue_tasks_count=overdue_tasks,
        task_completion_rate=task_rate,

        roadmap_completion_pct=roadmap_rate,
        total_roadmap_topics=total_roadmap_topics,
        completed_roadmap_topics=completed_roadmap_topics,

        weekly_progress=weekly_progress,
        subject_breakdown=subject_breakdown,
        priority_breakdown=priority_counts,
        recent_sessions=recent_session_list,

        # Backward compatibility
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        total_study_minutes_logged=total_study_minutes,
        study_streak_days=max(streak, 1) if (total_tasks > 0 or total_study_minutes > 0) else 0,
        roadmap_completion_rate=roadmap_rate
    )


@router.get(
    "/weekly",
    response_model=WeeklyProgressWidget,
    status_code=status.HTTP_200_OK,
    summary="Get 7-day weekly study analytics"
)
def get_weekly_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow()
    today_date = today.date()

    user_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    study_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.started_at >= today - timedelta(days=7)
    ).all()

    daily_goal_min = current_user.daily_study_goal_minutes or 120
    days_progress = []
    total_week_study_min = 0
    total_tasks_completed_week = 0
    days_goal_reached = 0
    best_day_name = None
    best_day_minutes = 0

    for i in range(6, -1, -1):
        d_date = today_date - timedelta(days=i)
        d_str = d_date.strftime("%Y-%m-%d")
        day_abbr = d_date.strftime("%a")

        day_completed = sum(1 for t in user_tasks if t.completed_at and t.completed_at.date() == d_date)
        total_tasks_completed_week += day_completed

        day_study_min = sum(s.duration_minutes for s in study_sessions if s.started_at and s.started_at.date() == d_date)
        total_week_study_min += day_study_min

        goal_reached = day_study_min >= daily_goal_min and day_study_min > 0
        if goal_reached:
            days_goal_reached += 1
        if day_study_min > best_day_minutes:
            best_day_minutes = day_study_min
            best_day_name = day_abbr

        days_progress.append(DayProgress(
            date=d_str,
            day_of_week=day_abbr,
            completed_tasks_count=day_completed,
            study_minutes=day_study_min,
            goal_reached=goal_reached
        ))

    weekly_goal_min = daily_goal_min * (current_user.study_days_per_week or 6)
    goal_pct = int(round((total_week_study_min / weekly_goal_min * 100))) if weekly_goal_min > 0 else 0
    daily_avg_min = int(round(total_week_study_min / 7))

    return WeeklyProgressWidget(
        days=days_progress,
        weekly_goal_minutes=weekly_goal_min,
        actual_studied_minutes=total_week_study_min,
        goal_completion_percentage=min(goal_pct, 100),
        total_tasks_completed_this_week=total_tasks_completed_week,
        daily_average_minutes=daily_avg_min,
        best_day_name=best_day_name or "None",
        best_day_minutes=best_day_minutes,
        days_goal_reached=days_goal_reached
    )


@router.post(
    "/study-sessions",
    response_model=StudySessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a study focus session"
)
def log_study_session(
    session_data: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_session = StudySession(
        user_id=current_user.id,
        task_id=session_data.task_id,
        roadmap_item_id=session_data.roadmap_item_id,
        duration_minutes=session_data.duration_minutes,
        notes=session_data.notes,
        started_at=datetime.utcnow() - timedelta(minutes=session_data.duration_minutes),
        ended_at=datetime.utcnow()
    )
    db.add(new_session)

    # If linked to a task, update actual_minutes
    if session_data.task_id:
        task = db.query(Task).filter(Task.id == session_data.task_id, Task.user_id == current_user.id).first()
        if task:
            task.actual_minutes = (task.actual_minutes or 0) + session_data.duration_minutes

    db.commit()
    db.refresh(new_session)
    return StudySessionResponse.model_validate(new_session)


@router.delete(
    "/study-sessions/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a study focus session"
)
def delete_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session_obj = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()

    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study session with ID {session_id} not found."
        )

    db.delete(session_obj)
    db.commit()
    return {"message": "Study session deleted successfully", "id": session_id}
