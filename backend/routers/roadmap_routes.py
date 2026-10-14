from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import User, StudyPath, RoadmapPhase, RoadmapItem, Task
from backend.schemas import (
    StudyPathResponse,
    StudyPathCreate,
    StudyPathUpdate,
    RoadmapPhaseResponse,
    RoadmapItemCreate,
    RoadmapItemUpdate,
    RoadmapItemResponse,
    ContinueLearningWidget,
    VALID_CATEGORIES,
    normalize_category
)
from backend.dependencies import get_current_user
from backend.templates import ROADMAP_TEMPLATES

router = APIRouter(tags=["Study Paths & Roadmaps"])


def build_study_path_response(path: StudyPath) -> StudyPathResponse:
    total_phases = len(path.phases)
    total_items = 0
    completed_items = 0
    phases_resp = []

    for phase in path.phases:
        phase_total = len(phase.items)
        phase_completed = sum(1 for item in phase.items if item.status == "Completed")
        total_items += phase_total
        completed_items += phase_completed
        phase_pct = int(round((phase_completed / phase_total * 100))) if phase_total > 0 else 0

        items_resp = [RoadmapItemResponse.model_validate(item) for item in phase.items]
        phases_resp.append(RoadmapPhaseResponse(
            id=phase.id,
            study_path_id=phase.study_path_id,
            title=phase.title,
            description=phase.description,
            sequence_number=phase.sequence_number,
            total_items=phase_total,
            completed_items=phase_completed,
            progress_percentage=phase_pct,
            items=items_resp
        ))

    overall_pct = int(round((completed_items / total_items * 100))) if total_items > 0 else 0
    cat_display = VALID_CATEGORIES.get(path.category, path.category)

    return StudyPathResponse(
        id=path.id,
        user_id=path.user_id,
        title=path.title,
        category=path.category,
        category_display=cat_display,
        description=path.description,
        is_active=path.is_active,
        created_at=path.created_at,
        total_phases=total_phases,
        total_items=total_items,
        completed_items=completed_items,
        completion_percentage=overall_pct,
        phases=phases_resp
    )


@router.get(
    "/api/study-paths",
    response_model=List[StudyPathResponse],
    status_code=status.HTTP_200_OK,
    summary="List all study paths for current user"
)
def get_user_study_paths(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paths = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == current_user.id)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .all()
    )
    return [build_study_path_response(p) for p in paths]


@router.get(
    "/api/study-paths/active",
    response_model=StudyPathResponse,
    status_code=status.HTTP_200_OK,
    summary="Get active study path and full roadmap"
)
def get_active_study_path(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_cat = current_user.category or "FULL_STACK"
    active_path = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == current_user.id, StudyPath.category == user_cat)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .first()
    )

    if not active_path:
        from backend.database import seed_user_roadmap
        seed_user_roadmap(db, current_user, user_cat)
        active_path = (
            db.query(StudyPath)
            .filter(StudyPath.user_id == current_user.id, StudyPath.category == user_cat)
            .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
            .first()
        )

    # Ensure this path is marked active
    db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})
    if active_path:
        active_path.is_active = True
        db.commit()

    if not active_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active study path found for this user."
        )

    return build_study_path_response(active_path)


@router.post(
    "/api/study-paths",
    response_model=StudyPathResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new study path or switch track"
)
def create_study_path(
    path_data: StudyPathCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category_code = normalize_category(path_data.category)

    # If archive_existing is requested or setting new as active
    if path_data.archive_existing:
        db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})
    else:
        # Deactivate previous so new path becomes the single active path
        db.query(StudyPath).filter(StudyPath.user_id == current_user.id).update({"is_active": False})

    # Update user's category
    current_user.category = category_code

    new_path = StudyPath(
        user_id=current_user.id,
        title=path_data.title,
        category=category_code,
        description=path_data.description,
        is_active=True
    )
    db.add(new_path)
    db.commit()
    db.refresh(new_path)

    # Seed template if requested
    if path_data.seed_template:
        template = ROADMAP_TEMPLATES.get(category_code, ROADMAP_TEMPLATES.get("FULL_STACK"))
        if template:
            for phase_data in template["phases"]:
                phase = RoadmapPhase(
                    study_path_id=new_path.id,
                    title=phase_data["title"],
                    description=phase_data["description"],
                    sequence_number=phase_data["sequence_number"]
                )
                db.add(phase)
                db.commit()
                db.refresh(phase)

                item_idx = 0
                for item_data in phase_data["items"]:
                    item_idx += 1
                    roadmap_item = RoadmapItem(
                        phase_id=phase.id,
                        title=item_data["title"],
                        description=f"Core learning item for {phase_data['title']}",
                        subject=item_data.get("subject", "General"),
                        item_type=item_data.get("item_type", "topic"),
                        sequence_number=item_idx,
                        estimated_minutes=item_data.get("estimated_minutes", 60),
                        status="Not Started",
                        resource_url=item_data.get("resource_url")
                    )
                    db.add(roadmap_item)

            db.commit()

    db.refresh(new_path)
    return build_study_path_response(new_path)


@router.get(
    "/api/study-paths/{path_id}/roadmap",
    response_model=StudyPathResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complete roadmap of a specific study path"
)
def get_study_path_roadmap(
    path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    path = (
        db.query(StudyPath)
        .filter(StudyPath.id == path_id, StudyPath.user_id == current_user.id)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .first()
    )
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study path with ID {path_id} not found."
        )

    return build_study_path_response(path)


@router.post(
    "/api/roadmap/items",
    response_model=RoadmapItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a custom topic/item to a roadmap phase"
)
def create_roadmap_item(
    item_data: RoadmapItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify phase ownership
    phase = (
        db.query(RoadmapPhase)
        .join(StudyPath)
        .filter(RoadmapPhase.id == item_data.phase_id, StudyPath.user_id == current_user.id)
        .first()
    )
    if not phase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Phase with ID {item_data.phase_id} not found."
        )

    # Compute sequence number
    existing_count = db.query(RoadmapItem).filter(RoadmapItem.phase_id == phase.id).count()

    new_item = RoadmapItem(
        phase_id=phase.id,
        title=item_data.title.strip(),
        description=item_data.description.strip() if item_data.description else None,
        subject=item_data.subject.strip() if item_data.subject else "General",
        item_type=item_data.item_type or "topic",
        sequence_number=existing_count + 1,
        estimated_minutes=item_data.estimated_minutes or 60,
        status="Not Started",
        resource_url=item_data.resource_url.strip() if item_data.resource_url else None
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return RoadmapItemResponse.model_validate(new_item)


@router.put(
    "/api/roadmap/items/{item_id}",
    response_model=RoadmapItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a roadmap topic/item"
)
def update_roadmap_item(
    item_id: int,
    item_update: RoadmapItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = (
        db.query(RoadmapItem)
        .join(RoadmapPhase)
        .join(StudyPath)
        .filter(RoadmapItem.id == item_id, StudyPath.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Roadmap item with ID {item_id} not found."
        )

    if item_update.title is not None:
        item.title = item_update.title.strip()
    if item_update.description is not None:
        item.description = item_update.description.strip() if item_update.description else None
    if item_update.subject is not None:
        item.subject = item_update.subject.strip()
    if item_update.item_type is not None:
        item.item_type = item_update.item_type
    if item_update.estimated_minutes is not None:
        item.estimated_minutes = item_update.estimated_minutes
    if item_update.resource_url is not None:
        item.resource_url = item_update.resource_url.strip() if item_update.resource_url else None
    if item_update.status is not None:
        item.status = item_update.status
        if item_update.status == "Completed" and not item.completed_at:
            item.completed_at = datetime.utcnow()
        elif item_update.status != "Completed":
            item.completed_at = None

    db.commit()
    db.refresh(item)
    return RoadmapItemResponse.model_validate(item)


@router.delete(
    "/api/roadmap/items/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a custom roadmap topic/item"
)
def delete_roadmap_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = (
        db.query(RoadmapItem)
        .join(RoadmapPhase)
        .join(StudyPath)
        .filter(RoadmapItem.id == item_id, StudyPath.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Roadmap item with ID {item_id} not found."
        )

    db.delete(item)
    db.commit()
    return {"message": "Roadmap item deleted successfully", "id": item_id}


@router.patch(
    "/api/roadmap/items/{item_id}/complete",
    response_model=RoadmapItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle topic completion status"
)
def toggle_roadmap_item_complete(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = (
        db.query(RoadmapItem)
        .join(RoadmapPhase)
        .join(StudyPath)
        .filter(RoadmapItem.id == item_id, StudyPath.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Roadmap item with ID {item_id} not found."
        )

    if item.status == "Completed":
        item.status = "In Progress"
        item.completed_at = None
    else:
        item.status = "Completed"
        item.completed_at = datetime.utcnow()

    # Also sync any linked task if exists
    linked_task = db.query(Task).filter(Task.roadmap_item_id == item.id, Task.user_id == current_user.id).first()
    if linked_task:
        linked_task.status = "Completed" if item.status == "Completed" else "In Progress"
        linked_task.completed_at = item.completed_at

    db.commit()
    db.refresh(item)
    return RoadmapItemResponse.model_validate(item)


@router.get(
    "/api/roadmap/resume",
    response_model=ContinueLearningWidget,
    status_code=status.HTTP_200_OK,
    summary="Get last incomplete topic for Continue Learning widget"
)
def get_resume_topic(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_path = (
        db.query(StudyPath)
        .filter(StudyPath.user_id == current_user.id, StudyPath.is_active == True)
        .options(joinedload(StudyPath.phases).joinedload(RoadmapPhase.items))
        .first()
    )

    if not active_path or not active_path.phases:
        return ContinueLearningWidget(has_active_topic=False, overall_progress=0)

    total_items = 0
    completed_items = 0
    first_incomplete = None
    current_phase_title = None

    for phase in active_path.phases:
        for item in phase.items:
            total_items += 1
            if item.status == "Completed":
                completed_items += 1
            elif not first_incomplete:
                first_incomplete = item
                current_phase_title = phase.title

    overall_progress = int(round((completed_items / total_items * 100))) if total_items > 0 else 0

    if not first_incomplete:
        # All completed! Return the last item
        last_phase = active_path.phases[-1] if active_path.phases else None
        last_item = last_phase.items[-1] if last_phase and last_phase.items else None
        return ContinueLearningWidget(
            has_active_topic=True if last_item else False,
            phase_title=last_phase.title if last_phase else "Complete",
            subject=last_item.subject if last_item else "All Done",
            topic_id=last_item.id if last_item else None,
            topic_title=last_item.title if last_item else "All syllabus topics completed!",
            estimated_minutes=last_item.estimated_minutes if last_item else 0,
            overall_progress=100,
            resource_url=last_item.resource_url if last_item else None
        )

    return ContinueLearningWidget(
        has_active_topic=True,
        phase_title=current_phase_title,
        subject=first_incomplete.subject,
        topic_id=first_incomplete.id,
        topic_title=first_incomplete.title,
        estimated_minutes=first_incomplete.estimated_minutes,
        overall_progress=overall_progress,
        resource_url=first_incomplete.resource_url
    )
