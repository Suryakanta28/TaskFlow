from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db, seed_user_roadmap
from backend.models import User
from backend.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    PasswordChangeRequest,
    normalize_category
)
from backend.auth import hash_password, verify_password, create_access_token
from backend.dependencies import get_current_user
from backend.routers.user_routes import build_user_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account"
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    normalized_email = user_data.email.strip().lower()

    # Check for existing email
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # Hash the password
    hashed_pwd = hash_password(user_data.password)
    category_val = normalize_category(user_data.category)

    # Create new User
    new_user = User(
        name=user_data.name.strip(),
        email=normalized_email,
        password_hash=hashed_pwd,
        category=category_val,
        current_level=user_data.current_level or "Beginner",
        daily_study_goal_minutes=user_data.daily_study_goal_minutes or 120,
        study_days_per_week=user_data.study_days_per_week or 6,
        target_date=user_data.target_date,
        phone=user_data.phone,
        timezone=user_data.timezone or "Asia/Kolkata",
        specific_goal=user_data.specific_goal,
        onboarding_completed=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Seed initial starter roadmap for chosen study path
    seed_user_roadmap(db, new_user, category_val)

    # Generate JWT token
    access_token = create_access_token(
        data={
            "sub": str(new_user.id),
            "user_id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "category": new_user.category
        }
    )

    user_resp = build_user_response(new_user, db)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp
    )


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User login with email and password"
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    normalized_email = login_data.email.strip().lower()

    # Find user
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password hash
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "category": user.category or "FULL_STACK"
        }
    )

    user_resp = build_user_response(user, db)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user"
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return build_user_response(current_user, db)


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change user account password"
)
def change_password(
    pwd_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )

    if len(pwd_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.password_hash = hash_password(pwd_data.new_password)
    db.commit()

    return {"message": "Password updated successfully."}
