from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column("password", String(255), nullable=False)
    category = Column(String(50), default="FULL_STACK", nullable=False)  # 'FULL_STACK', 'SSC', 'RAILWAY', 'JEE', 'NEET'
    
    # Study Information & Preferences
    current_level = Column(String(30), default="Beginner", nullable=False)  # 'Beginner', 'Intermediate', 'Advanced'
    daily_study_goal_minutes = Column(Integer, default=120, nullable=False)  # e.g., 120 minutes (2 hrs)
    study_days_per_week = Column(Integer, default=6, nullable=False)         # e.g., 6 days
    target_date = Column(String(50), nullable=True)                          # e.g., '2026-12-31'
    phone = Column(String(30), nullable=True)
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    specific_goal = Column(String(200), nullable=True)                       # e.g., 'Target SSC CGL 2026 Rank under 500'
    bio = Column(String(300), nullable=True)                                 # Short bio or preparation vision
    avatar_icon = Column(String(20), default="👨‍💻", nullable=False)          # Emoji/icon chosen for avatar
    avatar_color = Column(String(30), default="#4f46e5", nullable=False)     # Hex/HSL accent color for avatar
    institution = Column(String(100), nullable=True)                         # College / Coaching Institute
    study_mode = Column(String(50), default="Self-Taught / Independent", nullable=False)
    focus_subjects = Column(String(250), default="", nullable=True)          # Comma-separated focus subjects
    daily_reminder_time = Column(String(20), default="09:00 AM", nullable=True)
    theme_preference = Column(String(20), default="light", nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    study_paths = relationship("StudyPath", back_populates="user", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")

    @property
    def password(self) -> str:
        return self.password_hash

    @password.setter
    def password(self, val: str):
        self.password_hash = val

    @property
    def study_path(self) -> str:
        return self.category

    @study_path.setter
    def study_path(self, val: str):
        self.category = val


class StudyPath(Base):
    __tablename__ = "study_paths"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # 'FULL_STACK', 'SSC', 'RAILWAY', 'JEE', 'NEET'
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="study_paths")
    phases = relationship("RoadmapPhase", back_populates="study_path", cascade="all, delete-orphan", order_by="RoadmapPhase.sequence_number")


class RoadmapPhase(Base):
    __tablename__ = "roadmap_phases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    study_path_id = Column(Integer, ForeignKey("study_paths.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    sequence_number = Column(Integer, default=1, nullable=False)

    # Relationships
    study_path = relationship("StudyPath", back_populates="phases")
    items = relationship("RoadmapItem", back_populates="phase", cascade="all, delete-orphan", order_by="RoadmapItem.sequence_number")


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phase_id = Column(Integer, ForeignKey("roadmap_phases.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), default="General", nullable=False)
    item_type = Column(String(50), default="topic", nullable=False)  # 'topic', 'chapter', 'lab', 'mock', 'revision'
    sequence_number = Column(Integer, default=1, nullable=False)
    estimated_minutes = Column(Integer, default=60, nullable=False)
    status = Column(String(30), default="Not Started", nullable=False)  # 'Not Started', 'In Progress', 'Completed'
    resource_url = Column(String(300), nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    phase = relationship("RoadmapPhase", back_populates="items")
    tasks = relationship("Task", back_populates="roadmap_item")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    roadmap_item_id = Column(Integer, ForeignKey("roadmap_items.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General", nullable=False, index=True)  # Subject or Module
    priority = Column(String(20), default="Medium", nullable=False)                # 'Low', 'Medium', 'High'
    status = Column(String(20), default="Pending", nullable=False)                  # 'Pending', 'In Progress', 'Completed'
    due_date = Column(String(50), nullable=True)                                    # ISO date string e.g., '2026-10-15'
    planned_date = Column(String(50), nullable=True)                                # Date scheduled for study planning
    estimated_minutes = Column(Integer, default=60, nullable=False)                # Planned duration in minutes
    actual_minutes = Column(Integer, default=0, nullable=False)                     # Actual study duration in minutes
    subtasks = Column(Text, default="[]", nullable=True)                            # JSON string: [{"id": 1, "text": "...", "done": false}]
    tags = Column(String(150), default="", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    owner = relationship("User", back_populates="tasks")
    roadmap_item = relationship("RoadmapItem", back_populates="tasks")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    roadmap_item_id = Column(Integer, ForeignKey("roadmap_items.id", ondelete="SET NULL"), nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    notes = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="study_sessions")
