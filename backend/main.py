from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import init_db
from backend.routers import (
    auth_routes,
    user_routes,
    roadmap_routes,
    study_plan_routes,
    analytics_routes,
    task_routes
)

# Initialize database tables, migrations, and seed data
init_db()

# Initialize FastAPI application
app = FastAPI(
    title="Multi-User Study Path & Progress Management Platform API",
    description="A modern, high-performance REST API for personalized study paths, syllabus roadmaps, daily study plans, tasks, and analytics built with FastAPI, SQLite, SQLAlchemy, and JWT.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local frontend development and production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(roadmap_routes.router)
app.include_router(study_plan_routes.router)
app.include_router(analytics_routes.router)
app.include_router(task_routes.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "ok", "message": "Study Path & Task Manager API is running smoothly."}


# Determine frontend directory path
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

if FRONTEND_DIR.exists():
    # Mount static assets (CSS, JS, images)
    app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")

    # Serve main frontend pages directly from root
    page_routes = [
        ("index", "index.html"),
        ("login", "login.html"),
        ("register", "register.html"),
        ("onboarding", "onboarding.html"),
        ("dashboard", "dashboard.html"),
        ("study-path", "study-path.html"),
        ("study-plan", "study-plan.html"),
        ("tasks", "tasks.html"),
        ("analytics", "analytics.html"),
        ("profile", "profile.html")
    ]

    for route_name, file_name in page_routes:
        file_path = FRONTEND_DIR / file_name

        def make_handler(p=file_path):
            async def serve_file():
                return FileResponse(str(p))
            return serve_file

        # Root route for index
        if route_name == "index":
            app.add_api_route("/", make_handler(file_path), methods=["GET"], include_in_schema=False)

        app.add_api_route(f"/{route_name}", make_handler(file_path), methods=["GET"], include_in_schema=False)
        app.add_api_route(f"/{file_name}", make_handler(file_path), methods=["GET"], include_in_schema=False)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
