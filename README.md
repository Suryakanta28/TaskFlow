# ⚡ TaskFlow — Multi-User Study & Career Preparation Task Manager

A production-style **Multi-User Study Path & Task Management Platform** tailored for students and competitive exam aspirants across 5 dedicated career tracks:
1. 💻 **Full Stack Development** (`FULL_STACK`)
2. 🏛️ **SSC (Staff Selection Commission)** (`SSC`)
3. 🚆 **Railway (RRB NTPC / Group D)** (`RAILWAY`)
4. 📐 **JEE (Engineering Entrance)** (`JEE`)
5. 🩺 **NEET (Medical Entrance)** (`NEET`)

Built with **Python FastAPI**, **SQLite + SQLAlchemy ORM**, **JWT Bearer Authentication**, **Bcrypt Password Hashing**, and **Vanilla HTML5 / CSS3 / JavaScript (ES6+)**.

---

## 🌟 Key Architecture & Features

### 🎯 1. Multi-User Category Specialization
- **Track-Specific Dashboards**: Dynamic greetings, category badge tags, preparation level, daily target hours, and exam countdown pill.
- **Hierarchical Syllabus Roadmap**: Multi-phase study curriculum for all 5 tracks with topic completion tracking, resource links, and custom topic additions.
- **Daily & Weekly Study Planner**: Schedule tasks on specific dates, calculate daily planned minutes, and avoid backlog buildup.
- **Progress & Analytics**: 7-day study velocity bar chart, subject mastery breakdown, study streak tracking, and study session logger.
- **Customizable Profile**: Multi-tab management for personal info, avatar emoji & color customizer, achievement badges, security, safe track switching, and JSON data export.

### 🔐 2. Strict Multi-User Security & Isolation
- **1-to-Many Relationship**: Every `Task`, `StudyPath`, `RoadmapItem`, and `StudySession` is strictly scoped to `user_id` with cascading deletion.
- **JWT Identity Resolution**: Every API endpoint resolves the current user identity from the Bearer token payload.
- **Data Protection**: Users can NEVER view, edit, complete, or delete tasks belonging to other accounts (verified by automated test suite).

### 📊 3. Modern Student Dashboard UI
- **Category-Aware Overview**: Real-time stats (Total Tasks, Pending, In Progress, Completed, Overdue, Roadmap Completion %, and Study Hours).
- **Interactive Controls**: Instant search, status filters (Pending, In Progress, Completed), priority filters (Low, Medium, High), sorting by due date / title / priority, and Grid vs Table view toggle.
- **Integrated Pomodoro Focus Timer**: Built-in 25-minute study focus timer with automatic study session logging.
- **Responsive Layout**: Fluid experience optimized for Desktop, Tablet, and Mobile.

---

## 🛠️ Full-Stack Tech Stack

| Layer | Technology | Key Concepts & Patterns |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+) | Fetch API + Async/Await, Token Management in `localStorage`, DOM manipulation, CSS Grid & Flexbox, Glassmorphism |
| **Backend** | Python 3.10+ with FastAPI | REST API routing, Pydantic v2 schemas, Dependency Injection (`Depends`), HTTP status codes, Auto-migrations |
| **Database** | SQLite + SQLAlchemy ORM | Relational schema (`users`, `tasks`, `study_paths`, `roadmap_phases`, `roadmap_items`, `study_sessions`), SQLite `PRAGMA` migrations |
| **Security** | PyJWT + Bcrypt (12 rounds) | JWT Bearer token authorization, password hashing, user isolation guards |

---

## 📁 Project Structure

```
Task Manager Project/
│
├── frontend/
│   ├── index.html            # Landing / Overview Page with Supported Tracks
│   ├── login.html            # User Login with 1-Click Demo Selectors
│   ├── register.html         # Registration with Category Selection Dropdown
│   ├── onboarding.html       # Study Path Questionnaire & Goal Setup
│   ├── dashboard.html        # Category-Specific Student Dashboard (Sections A-F)
│   ├── study-path.html       # Hierarchical Syllabus Roadmap Page
│   ├── study-plan.html       # Daily & Weekly Study Planner Page
│   ├── tasks.html            # Dedicated Task Management & Filtering Page
│   ├── analytics.html        # Progress Analytics, Charts & Study Session Logger
│   ├── profile.html          # Profile, Avatar Customizer, Badges & Backup Page
│   │
│   ├── css/
│   │   └── style.css         # Complete Design System & Category Badge Styles
│   │
│   └── js/
│       ├── api.js            # Central Fetch REST API Client (Auth, Users, Tasks, Roadmap, Plan, Analytics)
│       ├── auth.js           # JWT Session, Route Guards & Category Metadata
│       ├── tasks.js          # Task CRUD, Filtering, Sorting & View Toggles
│       ├── dashboard.js      # Dashboard State, Sections A-F & Pomodoro Timer
│       ├── study-path.js     # Roadmap Accordion, Progress Bar & Topic Completion
│       ├── study-plan.js     # 7-Day Schedule & Daily Focus Agenda
│       ├── analytics.js      # Progress Analytics & Session Logging
│       └── profile.js        # Multi-Tab Profile, Avatar Customizer & JSON Export
│
├── backend/
│   ├── main.py               # FastAPI App, CORS, Static Mounting & Route Registration
│   ├── database.py           # SQLite Engine, SessionLocal, PRAGMA Auto-Migrations & Seeder
│   ├── models.py             # SQLAlchemy Models (User, Task, StudyPath, RoadmapPhase, RoadmapItem, StudySession)
│   ├── schemas.py            # Pydantic v2 Validation Schemas
│   ├── auth.py               # Bcrypt Password Hashing & JWT Token Generation
│   ├── dependencies.py       # JWT Bearer Token Dependency (get_current_user)
│   ├── templates.py          # Structured Curricula for all 5 Study Tracks
│   ├── test_backend.py       # Automated Test Suite (13 Multi-User & Isolation Tests)
│   │
│   ├── routers/
│   │   ├── auth_routes.py    # POST /register, POST /login, GET /me, POST /change-password
│   │   ├── user_routes.py    # GET/PUT /api/users/me, POST /avatar, GET /export-data, POST /reset-roadmap
│   │   ├── task_routes.py    # GET, POST, PUT, DELETE, PATCH /api/tasks & /stats
│   │   ├── roadmap_routes.py # GET /api/study-paths, POST/PUT/DELETE/PATCH /api/roadmap/items
│   │   ├── study_plan_routes.py # GET /api/study-plan, POST /api/study-plan/schedule
│   │   └── analytics_routes.py  # GET /api/analytics/dashboard-overview, /overview, POST /study-sessions
│   │
│   └── requirements.txt      # Python Dependencies
│
├── database/
│   └── taskmanager.db        # SQLite Database File
│
├── package.json              # NPM scripts
└── README.md
```

---

## ⚡ Quick Start & Running Locally

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Start the FastAPI Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
or with npm:
```bash
npm run dev
```

### 3. Open in Browser
- **Landing Page**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Login Page**: [http://127.0.0.1:8000/login.html](http://127.0.0.1:8000/login.html)
- **Register Page**: [http://127.0.0.1:8000/register.html](http://127.0.0.1:8000/register.html)
- **Dashboard**: [http://127.0.0.1:8000/dashboard.html](http://127.0.0.1:8000/dashboard.html)
- **Interactive API Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔑 Demo Accounts (Pre-Seeded for Instant Evaluation)

| Category | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Full Stack** | Suryakanta Rout | `surya@example.com` | `Password123!` |
| **SSC** | Rahul Sharma | `rahul.ssc@example.com` | `Password123!` |
| **Railway** | Amit Kumar | `amit.railway@example.com` | `Password123!` |
| **JEE** | Priya Verma | `priya.jee@example.com` | `Password123!` |
| **NEET** | Ananya Sen | `ananya.neet@example.com` | `Password123!` |

*(You can also 1-click autofill any of these credentials directly on `login.html`)*

---

## 🧪 Running Automated Tests

Run the complete backend multi-user isolation and API test suite:
```bash
python -m backend.test_backend
```

All 13 automated test cases verify:
1. Health check endpoint
2. Static asset & page routing (15 pages & modules)
3. Registration with category selection
4. Login with JWT generation
5. Multi-user security isolation (blocking cross-user reads, updates, toggles, and deletes)
6. Profile retrieval & category customization via `PUT /api/users/me`
7. Avatar customization endpoint (`POST /api/users/avatar`)
8. JSON data backup export (`GET /api/users/export-data`)
9. Roadmap re-seeding (`POST /api/users/reset-roadmap`)
10. Task CRUD, Completion toggle & Deletion
11. Category roadmap seeding
12. Isolation across all 5 category accounts
