from datetime import datetime
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


# ==========================================
# CATEGORY CONSTANTS & NORMALIZATION
# ==========================================

VALID_CATEGORIES = {
    "FULL_STACK": "Full Stack Development",
    "SSC": "SSC Preparation",
    "RAILWAY": "Railway Exam Preparation",
    "JEE": "JEE Preparation",
    "NEET": "NEET Preparation"
}

CATEGORY_MAP = {
    "FULL_STACK": "FULL_STACK",
    "FULL STACK DEVELOPMENT": "FULL_STACK",
    "FULL STACK": "FULL_STACK",
    "SSC": "SSC",
    "SSC PREPARATION": "SSC",
    "RAILWAY": "RAILWAY",
    "RAILWAY PREPARATION": "RAILWAY",
    "JEE": "JEE",
    "JEE PREPARATION": "JEE",
    "NEET": "NEET",
    "NEET PREPARATION": "NEET"
}


def normalize_category(cat: Optional[str]) -> str:
    if not cat:
        return "FULL_STACK"
    cleaned = cat.strip().upper()
    return CATEGORY_MAP.get(cleaned, cleaned)


# ==========================================
# USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name of the user")
    email: EmailStr = Field(..., description="Valid user email address")
    category: Optional[str] = Field(default="FULL_STACK", description="Study Path: FULL_STACK, SSC, RAILWAY, JEE, NEET")
    current_level: Optional[str] = Field(default="Beginner", description="Preparation Level: Beginner, Intermediate, Advanced")
    daily_study_goal_minutes: Optional[int] = Field(default=120, description="Daily study target in minutes")
    study_days_per_week: Optional[int] = Field(default=6, description="Study days per week (1-7)")
    target_date: Optional[str] = Field(None, description="Target Exam/Completion Date (e.g., '2026-12-31')")
    phone: Optional[str] = Field(None, description="Optional phone number")
    timezone: Optional[str] = Field(default="Asia/Kolkata", description="User timezone")
    specific_goal: Optional[str] = Field(None, description="Specific target goal or rank")
    bio: Optional[str] = Field(None, max_length=300, description="Short bio or career aspiration")
    avatar_icon: Optional[str] = Field("👨‍💻", description="Avatar emoji/icon")
    avatar_color: Optional[str] = Field("#4f46e5", description="Avatar accent color")
    institution: Optional[str] = Field(None, max_length=100, description="College / Coaching / Organization")
    study_mode: Optional[str] = Field("Self-Taught / Independent", description="Study mode")
    focus_subjects: Optional[str] = Field("", description="Comma-separated focus subjects")
    daily_reminder_time: Optional[str] = Field("09:00 AM", description="Daily reminder time")
    theme_preference: Optional[str] = Field("light", description="Theme preference")

    @field_validator("category", mode="before")
    @classmethod
    def format_category(cls, v):
        if isinstance(v, str):
            return normalize_category(v)
        return "FULL_STACK"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Password (min 6 characters)")


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserOnboarding(BaseModel):
    study_path: Optional[str] = Field("FULL_STACK", description="Selected study path")
    current_level: Optional[str] = Field("Beginner", description="Beginner, Intermediate, Advanced")
    daily_study_goal_minutes: Optional[int] = Field(120, description="Daily goal in minutes")
    study_days_per_week: Optional[int] = Field(6, description="Study days per week")
    target_date: Optional[str] = Field(None, description="Target completion/exam date")
    specific_goal: Optional[str] = Field(None, description="Specific goal or focus areas")
    focus_subjects: Optional[List[str]] = Field(default=[], description="Selected focus subjects")


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    category: Optional[str] = Field(None, description="Updated study path")
    current_level: Optional[str] = None
    daily_study_goal_minutes: Optional[int] = None
    study_days_per_week: Optional[int] = None
    target_date: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None
    specific_goal: Optional[str] = None
    bio: Optional[str] = None
    avatar_icon: Optional[str] = None
    avatar_color: Optional[str] = None
    institution: Optional[str] = None
    study_mode: Optional[str] = None
    focus_subjects: Optional[str] = None
    daily_reminder_time: Optional[str] = None
    theme_preference: Optional[str] = None
    archive_previous_roadmap: Optional[bool] = Field(False, description="Whether to archive previous roadmap when changing study path")
    seed_new_roadmap: Optional[bool] = Field(True, description="Whether to seed new roadmap for the selected study path")

    @field_validator("category", mode="before")
    @classmethod
    def format_category(cls, v):
        if v is not None and isinstance(v, str):
            return normalize_category(v)
        return v


class AvatarUpdate(BaseModel):
    avatar_icon: str = Field("👨‍💻", description="Avatar icon")
    avatar_color: str = Field("#4f46e5", description="Avatar background color")


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    category: str = "FULL_STACK"
    study_path: Optional[str] = "FULL_STACK"
    study_path_display: Optional[str] = "Full Stack Development"
    current_level: str = "Beginner"
    daily_study_goal_minutes: int = 120
    study_days_per_week: int = 6
    target_date: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    specific_goal: Optional[str] = None
    bio: Optional[str] = None
    avatar_icon: Optional[str] = "👨‍💻"
    avatar_color: Optional[str] = "#4f46e5"
    institution: Optional[str] = None
    study_mode: Optional[str] = "Self-Taught / Independent"
    focus_subjects: Optional[str] = ""
    daily_reminder_time: Optional[str] = "09:00 AM"
    theme_preference: Optional[str] = "light"
    onboarding_completed: bool = False
    created_at: datetime
    total_tasks: Optional[int] = 0
    completed_tasks: Optional[int] = 0
    pending_tasks: Optional[int] = 0
    roadmap_completion_rate: Optional[int] = 0
    current_phase: Optional[str] = None
    total_study_minutes: Optional[int] = 0
    current_streak: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# ROADMAP & STUDY PATH SCHEMAS
# ==========================================

class RoadmapItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    subject: str = Field(default="General")
    item_type: str = Field(default="topic")  # 'topic', 'chapter', 'lab', 'mock', 'revision'
    sequence_number: Optional[int] = 1
    estimated_minutes: Optional[int] = 60
    status: Optional[str] = Field(default="Not Started")  # 'Not Started', 'In Progress', 'Completed'
    resource_url: Optional[str] = None


class RoadmapItemCreate(RoadmapItemBase):
    phase_id: int


class RoadmapItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    item_type: Optional[str] = None
    sequence_number: Optional[int] = None
    estimated_minutes: Optional[int] = None
    status: Optional[str] = None
    resource_url: Optional[str] = None


class RoadmapItemResponse(RoadmapItemBase):
    id: int
    phase_id: int
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoadmapPhaseResponse(BaseModel):
    id: int
    study_path_id: int
    title: str
    description: Optional[str] = None
    sequence_number: int
    total_items: int = 0
    completed_items: int = 0
    progress_percentage: int = 0
    items: List[RoadmapItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StudyPathCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    seed_template: Optional[bool] = True
    archive_existing: Optional[bool] = False


class StudyPathUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class StudyPathResponse(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    category_display: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    total_phases: int = 0
    total_items: int = 0
    completed_items: int = 0
    completion_percentage: int = 0
    phases: List[RoadmapPhaseResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# TASK SCHEMAS
# ==========================================

PriorityType = Literal["Low", "Medium", "High"]
StatusType = Literal["Pending", "In Progress", "Completed"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task Title")
    description: Optional[str] = Field(None, max_length=2000, description="Task Description")
    category: Optional[str] = Field(default="General", description="Subject or Module Name")
    priority: PriorityType = Field(default="Medium", description="Task Priority (Low, Medium, High)")
    status: StatusType = Field(default="Pending", description="Task Status (Pending, In Progress, Completed)")
    due_date: Optional[str] = Field(None, description="Due date string e.g., '2026-10-15'")
    planned_date: Optional[str] = Field(None, description="Scheduled study plan date")
    estimated_minutes: Optional[int] = Field(default=60, description="Estimated study duration in minutes")
    actual_minutes: Optional[int] = Field(default=0, description="Actual study time in minutes")
    roadmap_item_id: Optional[int] = Field(None, description="Associated roadmap item ID")
    subtasks: Optional[str] = Field(default="[]", description="JSON array string of subtask items")
    tags: Optional[str] = Field(default="", description="Comma-separated tags")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[PriorityType] = None
    status: Optional[StatusType] = None
    due_date: Optional[str] = None
    planned_date: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    roadmap_item_id: Optional[int] = None
    subtasks: Optional[str] = None
    tags: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class SubtaskToggleRequest(BaseModel):
    subtask_id: int
    completed: bool


# ==========================================
# STUDY SESSIONS & STUDY PLAN SCHEMAS
# ==========================================

class StudySessionCreate(BaseModel):
    task_id: Optional[int] = None
    roadmap_item_id: Optional[int] = None
    duration_minutes: int = Field(..., ge=1, le=720, description="Session study duration in minutes")
    notes: Optional[str] = None


class StudySessionResponse(BaseModel):
    id: int
    user_id: int
    task_id: Optional[int] = None
    roadmap_item_id: Optional[int] = None
    duration_minutes: int
    notes: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudyPlanScheduleRequest(BaseModel):
    task_id: int
    planned_date: str
    estimated_minutes: Optional[int] = 60
    priority: Optional[PriorityType] = None


class ScheduleTopicRequest(BaseModel):
    roadmap_item_id: int
    planned_date: str
    estimated_minutes: Optional[int] = 60
    priority: Optional[PriorityType] = "Medium"


class StudyPlanDay(BaseModel):
    date: str
    day_name: str
    total_planned_minutes: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    tasks: List[TaskResponse] = []


class StudyPlanResponse(BaseModel):
    today: str
    study_path_title: Optional[str] = None
    study_path_category: Optional[str] = "FULL_STACK"
    study_path_display: Optional[str] = "Full Stack Development"
    today_plan: List[TaskResponse] = []
    today_total_minutes: int = 0
    today_completed_minutes: int = 0
    overdue_tasks: List[TaskResponse] = []
    weekly_schedule: List[StudyPlanDay] = []
    unscheduled_topics: List[Dict[str, Any]] = []


# ==========================================
# DASHBOARD & ANALYTICS OVERVIEW SCHEMAS
# ==========================================

class ContinueLearningWidget(BaseModel):
    has_active_topic: bool = False
    phase_title: Optional[str] = None
    subject: Optional[str] = None
    topic_id: Optional[int] = None
    topic_title: Optional[str] = None
    estimated_minutes: Optional[int] = 60
    overall_progress: int = 0
    resource_url: Optional[str] = None


class DayProgress(BaseModel):
    date: str
    day_of_week: str
    completed_tasks_count: int = 0
    study_minutes: int = 0
    goal_reached: bool = False


class WeeklyProgressWidget(BaseModel):
    days: List[DayProgress] = []
    weekly_goal_minutes: int = 0
    actual_studied_minutes: int = 0
    goal_completion_percentage: int = 0
    total_tasks_completed_this_week: int = 0
    daily_average_minutes: int = 0
    best_day_name: Optional[str] = None
    best_day_minutes: int = 0
    days_goal_reached: int = 0


class SubjectBreakdownItem(BaseModel):
    subject: str
    completed: int = 0
    total: int = 0
    progress_percentage: int = 0
    estimated_minutes: int = 0


class DashboardOverviewResponse(BaseModel):
    user_name: str
    study_path_code: str
    study_path_display: str
    current_level: str
    current_phase: str
    daily_study_goal_minutes: int
    upcoming_deadline: Optional[str] = None
    specific_goal: Optional[str] = None
    
    # Real Dynamic Statistics
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    roadmap_completion_rate: int

    # Dashboard Content Sections
    today_study_plan: List[TaskResponse] = []
    all_tasks: List[TaskResponse] = []
    continue_learning: ContinueLearningWidget
    upcoming_tasks: List[TaskResponse] = []
    weekly_progress: WeeklyProgressWidget
    syllabus_subjects: List[SubjectBreakdownItem] = []
    syllabus_phases: List[Dict[str, Any]] = []
    user: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None


class AnalyticsOverviewResponse(BaseModel):
    user_name: Optional[str] = None
    study_path_code: Optional[str] = "FULL_STACK"
    study_path_display: Optional[str] = "Full Stack Development"
    current_level: Optional[str] = "Beginner"
    target_date: Optional[str] = None
    days_remaining: Optional[int] = None
    readiness_score: int = 0
    daily_goal_minutes: int = 120

    # Key Metrics
    streak_days: int = 0
    total_study_minutes: int = 0
    weekly_study_minutes: int = 0
    completed_tasks_count: int = 0
    total_tasks_count: int = 0
    pending_tasks_count: int = 0
    overdue_tasks_count: int = 0
    task_completion_rate: int = 0

    roadmap_completion_pct: int = 0
    total_roadmap_topics: int = 0
    completed_roadmap_topics: int = 0

    # Charts & Lists
    weekly_progress: WeeklyProgressWidget
    subject_breakdown: List[SubjectBreakdownItem] = []
    priority_breakdown: Dict[str, int] = {}
    recent_sessions: List[StudySessionResponse] = []

    # Backward compatibility fields
    total_tasks: int = 0
    completed_tasks: int = 0
    pending_tasks: int = 0
    overdue_tasks: int = 0
    total_study_minutes_logged: int = 0
    study_streak_days: int = 0
    roadmap_completion_rate: int = 0


class TaskStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    completed: int
    overdue: int = 0
    high_priority: int
    completion_rate: int = 0
    category: Optional[str] = "FULL_STACK"
    category_display: Optional[str] = "Full Stack Development"
