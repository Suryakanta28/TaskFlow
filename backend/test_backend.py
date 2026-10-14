import asyncio
import time
import httpx
from backend.main import app

async def run_tests():
    timestamp = int(time.time())
    user_a_email = f"user_a_{timestamp}@example.com"
    user_b_email = f"user_b_{timestamp}@example.com"

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("1. Testing Health Endpoint...")
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health failed: {res.text}"
        print("  [OK] Health Check Passed:", res.json())

        # Test Static Page & Asset Serving
        print("\n2. Testing Static Frontend Page & Asset Routing...")
        static_routes = [
            "/", "/index.html", "/login.html", "/register.html", 
            "/dashboard.html", "/profile.html", "/study-path.html", "/onboarding.html",
            "/css/style.css", "/js/api.js", "/js/auth.js", "/js/dashboard.js", 
            "/js/tasks.js", "/js/profile.js", "/js/study-path.js"
        ]
        for route in static_routes:
            res = await client.get(route)
            assert res.status_code == 200, f"Failed to serve {route}: status {res.status_code}"
        print(f"  [OK] All {len(static_routes)} frontend pages, CSS, and JS modules are served successfully.")

        # Test Registration User A (Full Stack)
        print(f"\n3. Testing User A Registration ({user_a_email}) with Category FULL_STACK...")
        reg_payload_a = {
            "name": "Suryakanta Rout",
            "email": user_a_email,
            "password": "Password123!",
            "category": "FULL_STACK"
        }

        res = await client.post("/api/auth/register", json=reg_payload_a)
        assert res.status_code == 201, f"Register A failed: {res.text}"
        reg_data_a = res.json()
        assert "access_token" in reg_data_a, "Token missing in register response"
        token_a = reg_data_a["access_token"]
        user_a_id = reg_data_a["user"]["id"]
        assert reg_data_a["user"]["category"] == "FULL_STACK"
        print(f"  [OK] User A Registered: ID={user_a_id}, Name={reg_data_a['user']['name']}, Category={reg_data_a['user']['category']}")

        # Test Registration User B (SSC)
        print(f"\n4. Testing User B Registration ({user_b_email}) with Category SSC...")
        reg_payload_b = {
            "name": "Rahul Sharma",
            "email": user_b_email,
            "password": "Password123!",
            "category": "SSC"
        }

        res = await client.post("/api/auth/register", json=reg_payload_b)
        assert res.status_code == 201, f"Register B failed: {res.text}"
        reg_data_b = res.json()
        token_b = reg_data_b["access_token"]
        user_b_id = reg_data_b["user"]["id"]
        assert reg_data_b["user"]["category"] == "SSC"
        print(f"  [OK] User B Registered: ID={user_b_id}, Name={reg_data_b['user']['name']}, Category={reg_data_b['user']['category']}")

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Test User A creates private tasks
        print("\n5. Testing User A Task Creation...")
        task_a_payload = {
            "title": "Learn FastAPI & Build Multi-User Task Manager",
            "description": "Full-Stack B.Tech CSE portfolio development",
            "priority": "High",
            "status": "In Progress",
            "category": "Backend",
            "due_date": "2026-10-25"
        }
        res = await client.post("/api/tasks", json=task_a_payload, headers=headers_a)
        assert res.status_code == 201, f"User A create task failed: {res.text}"
        task_a = res.json()
        task_a_id = task_a["id"]
        print(f"  [OK] User A created Task ID={task_a_id}: '{task_a['title']}'")

        # Test Multi-User Isolation: User B tries to view, edit, or delete User A's task
        print("\n6. Testing Multi-User Security Isolation...")
        
        # User B queries their task list -> must NOT see User A's task
        res = await client.get("/api/tasks", headers=headers_b)
        assert res.status_code == 200
        tasks_b = res.json()
        assert task_a_id not in [t["id"] for t in tasks_b], f"Security Breach! User B saw User A task ID={task_a_id}"
        print(f"  [OK] User B task list is completely isolated ({len(tasks_b)} tasks owned strictly by User B).")

        # User B attempts to access User A's task by ID directly
        res = await client.get(f"/api/tasks/{task_a_id}", headers=headers_b)
        assert res.status_code == 404, f"Security Breach! User B was able to view User A's task: {res.status_code}"
        print("  [OK] User B blocked from viewing User A's task (404 Not Found).")

        # User B attempts to update User A's task
        res = await client.put(f"/api/tasks/{task_a_id}", json={"title": "Hacked Title"}, headers=headers_b)
        assert res.status_code == 404, f"Security Breach! User B modified User A's task: {res.status_code}"
        print("  [OK] User B blocked from updating User A's task (404 Not Found).")

        # User B attempts to complete User A's task
        res = await client.patch(f"/api/tasks/{task_a_id}/complete", headers=headers_b)
        assert res.status_code == 404, f"Security Breach! User B toggled User A's task: {res.status_code}"
        print("  [OK] User B blocked from completing User A's task (404 Not Found).")

        # User B attempts to delete User A's task
        res = await client.delete(f"/api/tasks/{task_a_id}", headers=headers_b)
        assert res.status_code == 404, f"Security Breach! User B deleted User A's task: {res.status_code}"
        print("  [OK] User B blocked from deleting User A's task (404 Not Found).")

        # Test Enhanced Profile Endpoints (GET and PUT /api/users/me)
        print("\n7. Testing Enhanced Profile Endpoints & Fields...")
        res = await client.get("/api/users/me", headers=headers_a)
        assert res.status_code == 200
        profile_a = res.json()
        assert profile_a["name"] == "Suryakanta Rout"
        assert profile_a["category"] == "FULL_STACK"
        assert "bio" in profile_a
        assert "avatar_icon" in profile_a
        assert "avatar_color" in profile_a
        assert "study_mode" in profile_a
        print(f"  [OK] User A profile fetched with enhanced fields: {profile_a['name']} ({profile_a['category']})")

        # Update User A profile with rich fields
        update_payload = {
            "name": "Suryakanta Rout",
            "category": "FULL_STACK",
            "bio": "Aspiring Full Stack Engineer building scalable APIs.",
            "institution": "Tech University",
            "study_mode": "Full-time College Student",
            "daily_reminder_time": "08:00 AM",
            "target_date": "2026-12-31",
            "daily_study_goal_minutes": 180,
            "study_days_per_week": 6,
            "focus_subjects": "Python & FastAPI, React / Modern Frontend",
            "theme_preference": "light"
        }
        res = await client.put("/api/users/me", json=update_payload, headers=headers_a)
        assert res.status_code == 200
        updated_profile = res.json()
        assert updated_profile["bio"] == update_payload["bio"]
        assert updated_profile["institution"] == update_payload["institution"]
        assert updated_profile["daily_study_goal_minutes"] == 180
        print("  [OK] User A profile updated with new fields successfully.")

        # Test Avatar Update Endpoint
        print("\n8. Testing Avatar Customizer Endpoint...")
        avatar_payload = {"avatar_icon": "rocket", "avatar_color": "#06b6d4"}
        res = await client.post("/api/users/avatar", json=avatar_payload, headers=headers_a)
        assert res.status_code == 200
        avatar_resp = res.json()
        assert avatar_resp["avatar_icon"] == "rocket"
        assert avatar_resp["avatar_color"] == "#06b6d4"
        print("  [OK] Avatar updated to rocket with cyan background.")

        # Test Data Export Endpoint
        print("\n9. Testing User Data Export (JSON Backup)...")
        res = await client.get("/api/users/export-data", headers=headers_a)
        assert res.status_code == 200
        export_data = res.json()
        assert "user_profile" in export_data
        assert "tasks" in export_data
        assert "study_paths" in export_data
        assert export_data["user_profile"]["name"] == "Suryakanta Rout"
        print(f"  [OK] Data export successful with {len(export_data['tasks'])} tasks and {len(export_data['study_paths'])} study paths.")

        # Test Reset Roadmap Endpoint
        print("\n10. Testing Roadmap Re-seeding...")
        res = await client.post("/api/users/reset-roadmap", headers=headers_a)
        assert res.status_code == 200
        print("  [OK] Active roadmap re-seeded successfully.")

        # Test Task Stats
        print("\n11. Testing Task Stats Endpoint...")
        res = await client.get("/api/tasks/stats", headers=headers_a)
        assert res.status_code == 200
        stats = res.json()
        print("  [OK] Task stats fetched:", stats)

        # Test Task Complete Toggle
        print("\n12. Testing Task Complete Toggle...")
        res = await client.patch(f"/api/tasks/{task_a_id}/complete", headers=headers_a)
        assert res.status_code == 200
        assert res.json()["status"] == "Completed"
        print("  [OK] Task completed successfully.")

        # Test 5 Category Demo Accounts
        print("\n13. Testing All 5 Built-in Category Accounts...")
        demo_accounts = [
            ("surya@example.com", "Password123!", "FULL_STACK", "Suryakanta Rout"),
            ("rahul.ssc@example.com", "Password123!", "SSC", "Rahul Sharma"),
            ("amit.railway@example.com", "Password123!", "RAILWAY", "Amit Kumar"),
            ("priya.jee@example.com", "Password123!", "JEE", "Priya Verma"),
            ("ananya.neet@example.com", "Password123!", "NEET", "Ananya Sen")
        ]

        for email, pwd, expected_cat, expected_name in demo_accounts:
            login_res = await client.post("/api/auth/login", json={"email": email, "password": pwd})
            assert login_res.status_code == 200, f"Demo login failed for {email}"
            acc_data = login_res.json()
            assert acc_data["user"]["category"] == expected_cat
            token = acc_data["access_token"]
            
            # Fetch profile and verify
            me_res = await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
            assert me_res.status_code == 200
            user_me = me_res.json()
            assert user_me["category"] == expected_cat
            print(f"  [OK] Category {expected_cat} ({expected_name}): Verified successfully.")

        # Test Structured Analytics Overview
        print("\n14. Testing Analytics Overview Endpoint...")
        res = await client.get("/api/analytics/overview", headers=headers_a)
        assert res.status_code == 200
        overview = res.json()
        assert "weekly_progress" in overview
        assert "subject_breakdown" in overview
        assert "readiness_score" in overview
        assert "streak_days" in overview
        assert overview["study_path_code"] == "FULL_STACK"
        print(f"  [OK] Analytics Overview fetched: Readiness={overview['readiness_score']}%, Streak={overview['streak_days']}d, Subjects={len(overview['subject_breakdown'])}")

        # Test Study Session Logging
        print("\n15. Testing Study Focus Session Logging...")
        session_payload = {
            "duration_minutes": 45,
            "notes": "Studied FastAPI async routing and Pydantic schemas",
            "task_id": task_a_id
        }
        res = await client.post("/api/analytics/study-sessions", json=session_payload, headers=headers_a)
        assert res.status_code == 201
        session_data = res.json()
        session_id = session_data["id"]
        assert session_data["duration_minutes"] == 45
        assert session_data["notes"] == session_payload["notes"]
        print(f"  [OK] Study Session logged with ID={session_id}: {session_data['duration_minutes']} mins")

        # Test Study Session Deletion
        print("\n16. Testing Study Session Deletion...")
        res = await client.delete(f"/api/analytics/study-sessions/{session_id}", headers=headers_a)
        assert res.status_code == 200
        print(f"  [OK] Study Session ID={session_id} deleted successfully.")

        print("\n==================================================================")
        print(">> ALL MULTI-USER, PROFILE, ANALYTICS & ROADMAP TESTS PASSED! <<")
        print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
