import os
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Determine base directory (project root)
BASE_DIR = Path(__file__).resolve().parent.parent

# Database directory and file path
DB_DIR = BASE_DIR / "database"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "taskmanager.db"

# SQLite connection URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create SQLite engine (connect_args={"check_same_thread": False} is required for SQLite with multi-threaded FastAPI)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for models
Base = declarative_base()


def init_db():
    """
    Initializes database tables and performs automatic schema migrations
    for SQLite to ensure newly added columns exist without crashing.
    Also seeds demo accounts and roadmaps for all 5 study/career categories.
    """
    from backend.models import User, Task, StudyPath, RoadmapPhase, RoadmapItem, StudySession
    from backend.templates import ROADMAP_TEMPLATES
    from backend.auth import hash_password

    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        # Migrate users table columns
        try:
            result = conn.execute(text("PRAGMA table_info(users)"))
            user_columns = [row[1] for row in result.fetchall()]
            if user_columns:
                if "category" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN category VARCHAR(50) DEFAULT 'FULL_STACK'"))
                if "current_level" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN current_level VARCHAR(30) DEFAULT 'Beginner'"))
                if "daily_study_goal_minutes" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN daily_study_goal_minutes INTEGER DEFAULT 120"))
                if "study_days_per_week" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN study_days_per_week INTEGER DEFAULT 6"))
                if "target_date" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN target_date VARCHAR(50)"))
                if "phone" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(30)"))
                if "timezone" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'"))
                if "specific_goal" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN specific_goal VARCHAR(200)"))
                if "bio" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR(300)"))
                if "avatar_icon" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_icon VARCHAR(20) DEFAULT '👨‍💻'"))
                if "avatar_color" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_color VARCHAR(30) DEFAULT '#4f46e5'"))
                if "institution" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN institution VARCHAR(100)"))
                if "study_mode" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN study_mode VARCHAR(50) DEFAULT 'Self-Taught / Independent'"))
                if "focus_subjects" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN focus_subjects VARCHAR(250) DEFAULT ''"))
                if "daily_reminder_time" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN daily_reminder_time VARCHAR(20) DEFAULT '09:00 AM'"))
                if "theme_preference" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN theme_preference VARCHAR(20) DEFAULT 'light'"))
                if "onboarding_completed" not in user_columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0"))
                conn.commit()
        except Exception as e:
            print(f"[DB Migration Users Note]: {e}")

        # Migrate tasks table columns
        try:
            result = conn.execute(text("PRAGMA table_info(tasks)"))
            task_columns = [row[1] for row in result.fetchall()]
            if task_columns:
                if "roadmap_item_id" not in task_columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN roadmap_item_id INTEGER"))
                if "planned_date" not in task_columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN planned_date VARCHAR(50)"))
                if "estimated_minutes" not in task_columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN estimated_minutes INTEGER DEFAULT 60"))
                if "actual_minutes" not in task_columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN actual_minutes INTEGER DEFAULT 0"))
                if "completed_at" not in task_columns:
                    conn.execute(text("ALTER TABLE tasks ADD COLUMN completed_at DATETIME"))
                conn.commit()
        except Exception as e:
            print(f"[DB Migration Tasks Note]: {e}")

    # Seed demo users & active roadmaps
    try:
        db = SessionLocal()

        demo_accounts = [
            {
                "name": "Suryakanta Rout",
                "email": "surya@example.com",
                "password": "Password123!",
                "category": "FULL_STACK",
                "level": "Intermediate",
                "goal_minutes": 150,
                "days_per_week": 6,
                "target_date": "2026-12-15",
                "specific_goal": "Crack Senior Full Stack Role & Build 3 Microservices",
                "onboarding": True
            },
            {
                "name": "Rahul Sharma",
                "email": "rahul.ssc@example.com",
                "password": "Password123!",
                "category": "SSC",
                "level": "Intermediate",
                "goal_minutes": 180,
                "days_per_week": 6,
                "target_date": "2026-11-20",
                "specific_goal": "Target SSC CGL Tier-1 160+ Score",
                "onboarding": True
            },
            {
                "name": "Priya Verma",
                "email": "priya.jee@example.com",
                "password": "Password123!",
                "category": "JEE",
                "level": "Advanced",
                "goal_minutes": 240,
                "days_per_week": 7,
                "target_date": "2026-11-30",
                "specific_goal": "JEE Main Top 1% Percentile in Physics & Maths",
                "onboarding": True
            },
            {
                "name": "Amit Kumar",
                "email": "amit.railway@example.com",
                "password": "Password123!",
                "category": "RAILWAY",
                "level": "Beginner",
                "goal_minutes": 120,
                "days_per_week": 5,
                "target_date": "2026-12-10",
                "specific_goal": "RRB NTPC CBT-1 Preparation",
                "onboarding": True
            },
            {
                "name": "Ananya Sen",
                "email": "ananya.neet@example.com",
                "password": "Password123!",
                "category": "NEET",
                "level": "Intermediate",
                "goal_minutes": 210,
                "days_per_week": 6,
                "target_date": "2026-11-25",
                "specific_goal": "NEET 680+ Score with Full Biology Command",
                "onboarding": True
            }
        ]

        today = datetime.utcnow()

        for acc in demo_accounts:
            existing = db.query(User).filter(User.email == acc["email"]).first()
            if not existing:
                new_user = User(
                    name=acc["name"],
                    email=acc["email"],
                    password_hash=hash_password(acc["password"]),
                    category=acc["category"],
                    current_level=acc["level"],
                    daily_study_goal_minutes=acc["goal_minutes"],
                    study_days_per_week=acc["days_per_week"],
                    target_date=acc["target_date"],
                    specific_goal=acc["specific_goal"],
                    onboarding_completed=acc["onboarding"]
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)

                # Seed StudyPath & Roadmap from template
                seed_user_roadmap(db, new_user, acc["category"])

                # Add sample study sessions for the user (last 5 days) to populate weekly analytics
                for d in range(1, 6):
                    session_date = today - timedelta(days=d)
                    db.add(StudySession(
                        user_id=new_user.id,
                        duration_minutes=45 + (d * 15),
                        notes=f"Completed practice drills on {acc['category']} syllabus.",
                        started_at=session_date - timedelta(minutes=60),
                        ended_at=session_date
                    ))
                db.commit()

            else:
                # Ensure roadmap exists for existing user
                active_path = db.query(StudyPath).filter(StudyPath.user_id == existing.id, StudyPath.is_active == True).first()
                if not active_path:
                    seed_user_roadmap(db, existing, existing.category or "FULL_STACK")

        db.close()
    except Exception as e:
        print(f"[DB Seed Note]: {e}")


def seed_user_roadmap(db, user, category_code: str):
    """
    Creates a full active StudyPath and Roadmap hierarchy for a given user based on ROADMAP_TEMPLATES.
    Also creates starter actionable tasks for the user.
    """
    from backend.models import StudyPath, RoadmapPhase, RoadmapItem, Task
    from backend.templates import ROADMAP_TEMPLATES

    code = (category_code or "FULL_STACK").upper()
    template = ROADMAP_TEMPLATES.get(code, ROADMAP_TEMPLATES["FULL_STACK"])

    study_path = StudyPath(
        user_id=user.id,
        title=template["title"],
        category=code,
        description=template["description"],
        is_active=True
    )
    db.add(study_path)
    db.commit()
    db.refresh(study_path)

    today = datetime.utcnow()

    phase_idx = 0
    for phase_data in template["phases"]:
        phase_idx += 1
        phase = RoadmapPhase(
            study_path_id=study_path.id,
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
            # Mark the very first phase items as completed/in progress for realistic initial state
            status = "Not Started"
            completed_at = None
            if phase_idx == 1 and item_idx == 1:
                status = "Completed"
                completed_at = today - timedelta(days=2)
            elif phase_idx == 1 and item_idx == 2:
                status = "In Progress"

            roadmap_item = RoadmapItem(
                phase_id=phase.id,
                title=item_data["title"],
                description=f"Core learning item for {phase_data['title']}",
                subject=item_data.get("subject", "General"),
                item_type=item_data.get("item_type", "topic"),
                sequence_number=item_idx,
                estimated_minutes=item_data.get("estimated_minutes", 60),
                status=status,
                resource_url=item_data.get("resource_url"),
                completed_at=completed_at
            )
            db.add(roadmap_item)
            db.commit()
            db.refresh(roadmap_item)

            # Create associated task for in-progress and next pending item
            if phase_idx == 1:
                task_status = "Completed" if status == "Completed" else ("In Progress" if status == "In Progress" else "Pending")
                task_due = (today + timedelta(days=item_idx * 3)).strftime("%Y-%m-%d")
                task = Task(
                    user_id=user.id,
                    roadmap_item_id=roadmap_item.id,
                    title=f"Study: {roadmap_item.title}",
                    description=f"Read notes, solve practice problems, and mark complete for {phase_data['title']}.",
                    category=roadmap_item.subject,
                    priority="High" if item_idx <= 2 else "Medium",
                    status=task_status,
                    due_date=task_due,
                    planned_date=today.strftime("%Y-%m-%d") if item_idx <= 2 else None,
                    estimated_minutes=roadmap_item.estimated_minutes,
                    actual_minutes=roadmap_item.estimated_minutes if task_status == "Completed" else 0,
                    completed_at=completed_at
                )
                db.add(task)

    db.commit()


def get_db():
    """
    Dependency generator for database sessions.
    Ensures session is closed after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
