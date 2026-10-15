/**
 * TaskFlow - Comprehensive Personalized Student Dashboard Logic
 * Modern Structured Workspace with Real-time Metrics, Pomodoro & Tasks
 */

let dashboardData = null;
const POMODORO_DURATION_SECONDS = 25 * 60; // 25 minutes
let pomodoroInterval = null;
let pomodoroSecondsLeft = POMODORO_DURATION_SECONDS;
let isPomodoroRunning = false;

// Task Tab State
let currentTaskTab = 'today'; // 'today', 'all', 'completed'
let cachedTodayTasks = [];
let cachedAllTasks = [];
let cachedCompletedTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce authentication
  Auth.requireAuth();

  // Load complete dashboard data from API
  await loadDashboardOverview();

  // Initialize event listeners
  initDashboardEvents();
});

/**
 * Load complete dashboard payload from `/api/analytics/dashboard-overview`
 */
async function loadDashboardOverview() {
  try {
    const overview = await api.analytics.getDashboardOverview();
    dashboardData = overview;

    // Normalize user object
    const user = overview.user || {
      name: overview.user_name,
      category: overview.study_path_code,
      current_level: overview.current_level,
      daily_study_goal_minutes: overview.daily_study_goal_minutes,
      target_date: overview.upcoming_deadline,
      specific_goal: overview.specific_goal
    };
    Auth.setUser(user);

    // Normalize stats object
    const stats = overview.stats || {
      total_tasks: overview.total_tasks,
      pending_tasks: overview.pending_tasks,
      in_progress_tasks: overview.in_progress_tasks,
      completed_tasks: overview.completed_tasks,
      overdue_tasks: overview.overdue_tasks,
      roadmap_completion_pct: overview.roadmap_completion_rate
    };

    // Synchronize quick track switcher dropdown
    const switcher = document.getElementById('track-switcher-select');
    if (switcher && user.category) {
      switcher.value = user.category.toUpperCase();
    }

    // Render all dashboard sections
    renderHeroBanner(user, overview.continue_learning);
    renderStatsGrid(stats);

    // Update Tasks with Tabs
    const todayTasks = overview.today_study_plan || overview.today_plan || [];
    const allTasks = overview.all_tasks || [];
    updateTasksState(todayTasks, allTasks);

    renderUpcomingTasks(overview.upcoming_tasks);
    renderContinueLearning(overview.continue_learning, overview.syllabus_phases || [], overview.syllabus_subjects || [], user);
    renderWeeklyVelocity(overview.weekly_progress);

    // Update global user chips across sidebar and top nav
    Auth.updateNavUserInfo();

  } catch (err) {
    console.error('Failed to load dashboard overview:', err);
    showToast(err.message || 'Failed to load dashboard data', 'error');
  }
}

/**
 * Switch Study Path Track with 1 click
 */
async function switchStudyTrack(categoryCode) {
  if (!categoryCode) return;
  try {
    showToast('Switching study path curriculum...', 'info');
    const updatedUser = await api.users.update({ category: categoryCode });
    if (updatedUser) {
      Auth.setUser(updatedUser);
    }
    await loadDashboardOverview();
    showToast(`Switched to ${categoryCode} track! Dashboard & curriculum updated. ✨`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to switch track', 'error');
  }
}

/**
 * SECTION 1: Render Welcome Hero Banner
 */
function renderHeroBanner(user, continueLearning) {
  if (!user) return;

  const catCode = (user.category || 'FULL_STACK').toUpperCase();
  const catInfo = Auth.getCategoryInfo(catCode);

  // Top Nav Greeting & Chip
  const greetingEl = document.getElementById('user-greeting');
  if (greetingEl) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    greetingEl.innerHTML = `${timeOfDay}, <strong>${escapeHtml(user.name.split(' ')[0])}</strong>! 👋`;
  }

  const navCategoryEl = document.getElementById('user-category-display');
  if (navCategoryEl) {
    navCategoryEl.innerHTML = `
      <span class="user-category-chip" style="background: ${catInfo.bg}; color: ${catInfo.color}; border: 1px solid ${catInfo.border}; font-size: 0.8rem; padding: 0.2rem 0.65rem; font-weight: 700;">
        <span>${catInfo.icon}</span>
        <span>${catInfo.name}</span>
      </span>
    `;
  }

  // Hero Card Fields
  const trackIcon = document.getElementById('hero-track-icon');
  if (trackIcon) trackIcon.textContent = catInfo.icon;

  const heroTitle = document.getElementById('hero-welcome-title');
  if (heroTitle) heroTitle.textContent = `Welcome back, ${user.name}! 🚀`;

  const dailyGoalEl = document.getElementById('hero-daily-goal');
  if (dailyGoalEl) dailyGoalEl.textContent = `${user.daily_study_goal_minutes || 120} mins / day`;

  const deadlineVal = document.getElementById('hero-deadline-val');
  if (deadlineVal) {
    if (user.target_date) {
      const d = new Date(user.target_date);
      const today = new Date();
      const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      deadlineVal.textContent = diffDays > 0 ? `${diffDays} days left (${formatted})` : formatted;
    } else {
      deadlineVal.textContent = 'Set in Profile';
    }
  }
}

/**
 * SECTION 2: Render KPI Statistics Cards
 */
function renderStatsGrid(stats) {
  if (!stats) return;

  const totalEl = document.getElementById('stat-total-count');
  if (totalEl) totalEl.textContent = stats.total_tasks || 0;

  const inProgSub = document.getElementById('stat-inprogress-sub');
  if (inProgSub) {
    const inProg = stats.in_progress_tasks || 0;
    inProgSub.textContent = inProg > 0 ? `${inProg} In Progress` : 'All caught up';
  }

  const pendingEl = document.getElementById('stat-pending-count');
  if (pendingEl) pendingEl.textContent = stats.pending_tasks || 0;

  const completedEl = document.getElementById('stat-completed-count');
  if (completedEl) completedEl.textContent = stats.completed_tasks || 0;

  const roadmapPctEl = document.getElementById('stat-roadmap-pct');
  if (roadmapPctEl) roadmapPctEl.textContent = `${stats.roadmap_completion_pct || 0}%`;

  const roadmapFillEl = document.getElementById('stat-roadmap-fill');
  if (roadmapFillEl) roadmapFillEl.style.width = `${stats.roadmap_completion_pct || 0}%`;

  // Overdue banner handling
  const overdueBanner = document.getElementById('overdue-alert-banner');
  const overdueBadge = document.getElementById('overdue-count-badge');
  const overdueCount = stats.overdue_tasks || 0;
  if (overdueBanner) {
    if (overdueCount > 0) {
      overdueBanner.style.display = 'flex';
      if (overdueBadge) overdueBadge.textContent = overdueCount;
    } else {
      overdueBanner.style.display = 'none';
    }
  }

  // Sidebar badge
  const sidebarBadge = document.getElementById('sidebar-badge-all');
  if (sidebarBadge) sidebarBadge.textContent = stats.total_tasks || 0;
}

/**
 * SECTION 3: Task State & Tabs Management
 */
function updateTasksState(todayTasks, allTasks) {
  cachedTodayTasks = todayTasks;
  cachedAllTasks = allTasks.filter(t => t.status !== 'Completed');
  cachedCompletedTasks = allTasks.filter(t => t.status === 'Completed');

  // Update Tab Count Badges
  const todayCountEl = document.getElementById('count-tab-today');
  if (todayCountEl) todayCountEl.textContent = cachedTodayTasks.length;

  const allCountEl = document.getElementById('count-tab-all');
  if (allCountEl) allCountEl.textContent = cachedAllTasks.length;

  const compCountEl = document.getElementById('count-tab-completed');
  if (compCountEl) compCountEl.textContent = cachedCompletedTasks.length;

  // Render current tab contents
  renderActiveTaskTab();
}

function switchTaskTab(tab) {
  currentTaskTab = tab;
  ['today', 'all', 'completed'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) {
      if (t === tab) el.classList.add('active');
      else el.classList.remove('active');
    }
  });
  renderActiveTaskTab();
}

function renderActiveTaskTab() {
  const container = document.getElementById('today-plan-container');
  if (!container) return;

  let tasks = [];
  let emptyMsg = '';
  let emptyIcon = '🎉';

  if (currentTaskTab === 'today') {
    tasks = cachedTodayTasks;
    emptyMsg = 'No study tasks scheduled for today.';
    emptyIcon = '🎉';
  } else if (currentTaskTab === 'all') {
    tasks = cachedAllTasks;
    emptyMsg = 'No active tasks found in your workspace.';
    emptyIcon = '📋';
  } else {
    tasks = cachedCompletedTasks;
    emptyMsg = 'No completed tasks yet. Finish a task to see it here!';
    emptyIcon = '⏳';
  }

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${emptyIcon}</div>
        <h4 style="color: var(--text-primary); margin-bottom: 0.25rem; font-weight: 700;">${emptyMsg}</h4>
        <p style="font-size: 0.85rem; margin-bottom: 1.25rem; color: #64748b;">Schedule topics from your curriculum roadmap or add custom study tasks.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddTaskModal()">+ Schedule Task for Today</button>
      </div>
    `;
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 0.65rem;">';
  tasks.forEach(task => {
    const isDone = task.status === 'Completed';
    const priorityClass = (task.priority || 'Medium').toLowerCase();
    const isSyllabus = Boolean(task.roadmap_item_id);

    html += `
      <div class="dash-task-row ${isDone ? 'is-completed' : ''}" id="task-row-${task.id}">
        <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
          <button 
            type="button" 
            class="dash-task-check" 
            onclick="handleTaskToggle(${task.id})"
            title="${isDone ? 'Mark as Incomplete' : 'Mark as Completed'}"
          >
            ${isDone ? '✓' : ''}
          </button>
          
          <div style="flex: 1; min-width: 0;">
            <div class="dash-task-title">
              ${escapeHtml(task.title)}
            </div>
            <div class="dash-task-meta">
              <span class="category-tag"><span class="category-tag-dot"></span>${escapeHtml(task.category || 'General')}</span>
              ${isSyllabus ? `<span class="syllabus-topic-pill" title="This task is directly from your Study Path Syllabus">🗺️ Syllabus Topic</span>` : ''}
              <span>⏱️ ${task.estimated_minutes || 60}m</span>
              <span class="badge badge-${priorityClass}">${task.priority}</span>
              ${task.due_date ? `<span style="color: #64748b;">📅 Due: ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0;">
          ${!isDone ? `
            <button class="btn-focus-task" onclick="startFocusOnTask('${escapeHtml(task.title)}')">
              ⏱️ Focus
            </button>
          ` : `
            <span style="font-size: 0.75rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 0.2rem 0.55rem; border-radius: 999px; white-space: nowrap;">
              Completed ✓
            </span>
          `}
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * SECTION 4: Render Active Syllabus & Study Path Milestones
 */
function renderContinueLearning(widget, phases = [], subjects = [], user = null) {
  const container = document.getElementById('continue-learning-container');
  if (!container) return;

  const catCode = user ? (user.category || 'FULL_STACK').toUpperCase() : 'FULL_STACK';
  const catInfo = Auth.getCategoryInfo(catCode);

  let html = '';

  // 1. Current Active Topic Card
  if (widget && widget.has_active_topic) {
    html += `
      <div class="active-topic-card" style="background: #f8fafc; border: 1.5px solid #e0e7ff; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 2px 5px rgba(79, 70, 229, 0.05); min-width: 0; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 0.75rem; min-width: 0;">
          <div style="min-width: 0; flex: 1;">
            <span style="font-size: 0.72rem; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; background: #e0e7ff; padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(widget.phase_title || 'Phase 1')} • ${escapeHtml(widget.subject || 'General')}
            </span>
            <h4 style="margin: 0.5rem 0 0 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.35; word-break: break-word; overflow-wrap: break-word;">
              ${escapeHtml(widget.topic_title)}
            </h4>
          </div>
          <span class="badge" style="background: #ede9fe; color: #7c3aed; font-weight: 700; font-size: 0.75rem; flex-shrink: 0; white-space: nowrap;">
            ⏱️ ${widget.estimated_minutes || 60}m
          </span>
        </div>

        <div style="margin-bottom: 1.15rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.35rem;">
            <span style="color: #64748b; font-weight: 600;">Overall Syllabus Progress</span>
            <strong style="color: #4f46e5; font-weight: 800;">${widget.overall_progress || 0}%</strong>
          </div>
          <div style="height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${widget.overall_progress || 0}%; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%); border-radius: 999px; transition: width 0.4s ease;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 0.6rem; justify-content: space-between; flex-wrap: wrap;">
          <a href="study-path.html" class="btn btn-primary btn-sm" style="flex: 1; min-width: 140px; justify-content: center; text-decoration: none; padding: 0.55rem 0.85rem; font-weight: 700; white-space: nowrap;">
            🗺️ Resume in Roadmap →
          </a>
          ${widget.topic_id ? `
            <button class="btn btn-secondary btn-sm" onclick="markRoadmapTopicDone(${widget.topic_id})" title="Mark Topic as Completed" style="font-weight: 700; white-space: nowrap;">
              ✓ Mark Done
            </button>
          ` : ''}
        </div>
      </div>
    `;
  } else {
    html += `
      <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem; text-align: center; min-width: 0; width: 100%; box-sizing: border-box;">
        <div style="font-size: 2rem; margin-bottom: 0.25rem;">🎉</div>
        <h4 style="color: #065f46; font-weight: 800; margin-bottom: 0.25rem;">All Syllabus Milestones Completed!</h4>
        <p style="color: #047857; font-size: 0.85rem; margin-bottom: 0.75rem;">Great job! You've completed all topics in this study path curriculum.</p>
        <a href="study-path.html" class="btn btn-primary btn-sm" style="text-decoration: none;">Review Syllabus Roadmap</a>
      </div>
    `;
  }

  // 2. Syllabus Phases Pathway
  if (phases && phases.length > 0) {
    html += `
      <div style="margin-bottom: 1.25rem; min-width: 0; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.04em;">
            Milestone Phases (${phases.length})
          </span>
          <a href="study-path.html" style="font-size: 0.75rem; color: #4f46e5; font-weight: 700; text-decoration: none; flex-shrink: 0;">View All →</a>
        </div>
        <div class="syllabus-phases-strip">
    `;

    phases.forEach((ph, idx) => {
      const isCur = ph.is_current;
      const isDone = ph.completed_items === ph.total_items && ph.total_items > 0;
      html += `
        <a href="study-path.html" class="syllabus-phase-chip ${isCur ? 'is-active' : ''}" title="${escapeHtml(ph.title)}">
          <span>${isDone ? '✅' : isCur ? '🎯' : `${idx + 1}.`}</span>
          <span>${escapeHtml(ph.title.split(':')[0] || `Phase ${idx+1}`)}</span>
          <span style="font-size: 0.68rem; opacity: 0.85;">(${ph.progress_percentage}%)</span>
        </a>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  // 3. Subject-wise Syllabus Progress
  if (subjects && subjects.length > 0) {
    html += `
      <div style="min-width: 0; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; gap: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.04em;">
            Core Subjects Breakdown
          </span>
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; white-space: nowrap;">${catInfo.name}</span>
        </div>
    `;

    subjects.slice(0, 5).forEach(sub => {
      html += `
        <div class="syllabus-subject-card">
          <div class="syllabus-subject-header">
            <span class="syllabus-subject-title" title="${escapeHtml(sub.subject)}">${escapeHtml(sub.subject)}</span>
            <span class="syllabus-subject-meta">${sub.completed}/${sub.total} topics (${sub.progress_percentage}%)</span>
          </div>
          <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${sub.progress_percentage}%; background: ${sub.progress_percentage === 100 ? '#059669' : '#4f46e5'}; border-radius: 999px; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  container.innerHTML = html;
}

/**
 * SECTION 5: Render Upcoming Deadlines & Tasks
 */
function renderUpcomingTasks(tasks) {
  const container = document.getElementById('upcoming-tasks-container');
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); min-width: 0; width: 100%; box-sizing: border-box;">
        <p style="font-size: 0.85rem; margin: 0; color: #64748b;">No upcoming deadlines for the next 7 days. You're fully caught up! 🎉</p>
      </div>
    `;
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 0.65rem; min-width: 0; width: 100%; box-sizing: border-box;">';
  tasks.forEach(task => {
    const formattedDate = task.due_date 
      ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '-';

    html += `
      <div class="dash-task-row">
        <div style="flex: 1; min-width: 0;">
          <div class="dash-task-title">
            ${escapeHtml(task.title)}
          </div>
          <div class="dash-task-meta">
            <span class="category-tag"><span class="category-tag-dot"></span>${escapeHtml(task.category || 'General')}</span>
            <span class="badge badge-${(task.priority || 'Medium').toLowerCase()}">${task.priority}</span>
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #4f46e5; background: #eef2ff; padding: 0.25rem 0.6rem; border-radius: 6px; border: 1px solid #c7d2fe; white-space: nowrap;">
            📅 ${formattedDate}
          </span>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * SECTION 6: Render Weekly Velocity Bar Chart
 */
function renderWeeklyVelocity(progress) {
  const container = document.getElementById('weekly-progress-container');
  if (!container) return;

  const defaultWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Normalize days array safely
  let days = [];
  if (progress && Array.isArray(progress.days) && progress.days.length > 0) {
    days = progress.days;
  } else {
    days = defaultWeekdays.map((name, idx) => ({
      day_of_week: name,
      day: name,
      study_minutes: 0,
      completed_tasks_count: 0,
      goal_reached: false
    }));
  }

  // Calculate total weekly study minutes strictly using valid numeric values
  let totalStudyMinutes = 0;
  if (progress && typeof progress.actual_studied_minutes === 'number' && !isNaN(progress.actual_studied_minutes)) {
    totalStudyMinutes = progress.actual_studied_minutes;
  } else if (progress && typeof progress.total_study_minutes_week === 'number' && !isNaN(progress.total_study_minutes_week)) {
    totalStudyMinutes = progress.total_study_minutes_week;
  } else if (days.length > 0) {
    totalStudyMinutes = days.reduce((sum, d) => {
      const mins = Number(d.study_minutes);
      return sum + (!isNaN(mins) && mins > 0 ? mins : 0);
    }, 0);
  }
  if (isNaN(totalStudyMinutes) || totalStudyMinutes < 0) totalStudyMinutes = 0;

  // Safe Total Hours calculation (rounded to 1 decimal place, e.g., 0, 1.5, 4)
  const totalHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
  const displayTotalHours = isNaN(totalHours) || totalHours < 0 ? 0 : totalHours;

  // Safe Completed Tasks calculation
  let totalTasksCompleted = 0;
  if (progress && typeof progress.total_tasks_completed_this_week === 'number' && !isNaN(progress.total_tasks_completed_this_week)) {
    totalTasksCompleted = progress.total_tasks_completed_this_week;
  } else if (progress && typeof progress.total_tasks_completed_week === 'number' && !isNaN(progress.total_tasks_completed_week)) {
    totalTasksCompleted = progress.total_tasks_completed_week;
  } else {
    totalTasksCompleted = days.reduce((sum, d) => {
      const c = Number(d.completed_tasks_count ?? d.completed_tasks ?? 0);
      return sum + (!isNaN(c) && c > 0 ? c : 0);
    }, 0);
  }
  if (isNaN(totalTasksCompleted) || totalTasksCompleted < 0) totalTasksCompleted = 0;

  // Determine if any study activity actually occurred this week
  const hasStudyActivity = totalStudyMinutes > 0 || days.some(d => (Number(d.study_minutes) || 0) > 0);

  // Maximum minutes for proportional bar heights (minimum 120 mins ceiling for visual balance)
  const maxMinutes = Math.max(...days.map(d => Number(d.study_minutes) || 0), 120);

  let html = `
    <div class="velocity-header-strip">
      <div class="velocity-total-box">
        <span class="velocity-total-label">Total:</span>
        <strong class="velocity-total-value">${displayTotalHours} Hours</strong>
      </div>
      <span class="velocity-completed-badge">
        ✅ ${totalTasksCompleted} completed
      </span>
    </div>

    <div class="velocity-bars-container" role="region" aria-label="7-Day Weekly Study Velocity Chart">
  `;

  days.forEach((day, idx) => {
    // Ensure clean weekday name without undefined
    const rawName = day.day_of_week || day.day || defaultWeekdays[idx] || `Day ${idx + 1}`;
    const weekdayName = rawName.length > 3 ? rawName.slice(0, 3) : rawName;

    // Safe duration value
    const rawMins = Number(day.study_minutes);
    const studyMins = !isNaN(rawMins) && rawMins > 0 ? rawMins : 0;
    const dayHours = Math.round((studyMins / 60) * 10) / 10;
    const dayCompletedTasks = Number(day.completed_tasks_count ?? day.completed_tasks ?? 0) || 0;

    // Height percentage
    const heightPct = studyMins > 0 ? Math.min(100, Math.max(12, Math.round((studyMins / maxMinutes) * 100))) : 8;

    // Is today
    let isToday = false;
    if (day.date) {
      isToday = new Date(day.date).toDateString() === new Date().toDateString();
    } else {
      isToday = weekdayName.toLowerCase() === new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    }

    // Bar state styling
    const isGoalReached = Boolean(day.goal_reached || (studyMins >= 120 && studyMins > 0));
    let barClass = 'velocity-bar';
    if (isGoalReached) barClass += ' bar-goal-reached';
    else if (isToday && studyMins > 0) barClass += ' bar-today';
    else if (studyMins > 0) barClass += ' bar-active';
    else if (isToday) barClass += ' bar-today-empty';
    else barClass += ' bar-empty';

    const durationDisplay = studyMins >= 60 ? `${dayHours}h` : studyMins > 0 ? `${studyMins}m` : '0h';
    const tooltipText = `${weekdayName} (${day.date || 'This Week'}): ${studyMins > 0 ? `${dayHours} hrs (${studyMins} mins)` : '0 hrs'} studied • ${dayCompletedTasks} task(s) done`;

    html += `
      <div class="velocity-bar-col ${isToday ? 'is-today-col' : ''}" title="${tooltipText}" tabIndex="0">
        <span class="velocity-duration-label">${durationDisplay}</span>
        <div class="velocity-bar-track">
          <div class="${barClass}" style="height: ${heightPct}%;"></div>
        </div>
        <span class="velocity-day-name ${isToday ? 'is-today-text' : ''}">
          ${weekdayName}
        </span>
      </div>
    `;
  });

  html += '</div>';

  // Helpful empty-state messaging when no study data exists yet
  if (!hasStudyActivity) {
    html += `
      <div class="velocity-empty-notice">
        <span class="empty-notice-icon">⏱️</span>
        <span>No study sessions logged yet this week. Start a 25-minute Pomodoro focus session to boost your velocity!</span>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Handle Toggle Complete on Task
 */
async function handleTaskToggle(taskId) {
  try {
    const updated = await api.tasks.toggleComplete(taskId);
    showToast(updated.status === 'Completed' ? 'Task completed! ✨' : 'Task reopened as Pending', 'info');
    await loadDashboardOverview();
  } catch (err) {
    showToast(err.message || 'Failed to update task', 'error');
  }
}

/**
 * Handle Roadmap Topic Complete
 */
async function markRoadmapTopicDone(topicId) {
  try {
    await api.roadmap.toggleComplete(topicId);
    showToast('Roadmap topic completed! 🎉', 'success');
    await loadDashboardOverview();
  } catch (err) {
    showToast(err.message || 'Failed to complete topic', 'error');
  }
}

/**
 * Pomodoro Focus Timer Logic
 */
function togglePomodoroTimer() {
  const btn = document.getElementById('timer-start-btn');
  const statusEl = document.getElementById('pomodoro-status');

  if (isPomodoroRunning) {
    // Pause timer
    if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
    }
    isPomodoroRunning = false;
    if (btn) btn.innerHTML = '▶ Resume Focus';
    if (statusEl) statusEl.textContent = 'Ready to Study';
  } else {
    // Start countdown - ALWAYS clear any existing interval first to prevent multiple timers!
    if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;
    }

    // If timer was completed at 00:00, reset to 25:00 before starting
    if (pomodoroSecondsLeft <= 0) {
      pomodoroSecondsLeft = POMODORO_DURATION_SECONDS;
      updatePomodoroDisplay();
    }

    isPomodoroRunning = true;
    if (btn) btn.innerHTML = '⏸ Pause Focus';
    if (statusEl) statusEl.textContent = 'Studying';

    pomodoroInterval = setInterval(() => {
      if (pomodoroSecondsLeft > 0) {
        pomodoroSecondsLeft--;
        updatePomodoroDisplay();
      }

      if (pomodoroSecondsLeft <= 0) {
        // Complete session
        if (pomodoroInterval) {
          clearInterval(pomodoroInterval);
          pomodoroInterval = null;
        }
        isPomodoroRunning = false;
        pomodoroSecondsLeft = 0;
        updatePomodoroDisplay();

        if (btn) btn.innerHTML = '▶ Start Focus (25m)';
        if (statusEl) statusEl.textContent = 'Session Completed';
        showToast('Pomodoro focus session completed! Great job! 🎉', 'success');

        // Automatically log study session to API (25 mins)
        api.analytics.logStudySession({
          duration_minutes: 25,
          notes: 'Completed 25-minute Pomodoro focus block.'
        }).then(() => loadDashboardOverview()).catch(err => {
          console.error('Failed to auto-log study session:', err);
        });
      }
    }, 1000);
  }
}

function resetPomodoroTimer() {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
  }
  isPomodoroRunning = false;
  pomodoroSecondsLeft = POMODORO_DURATION_SECONDS;
  updatePomodoroDisplay();
  const btn = document.getElementById('timer-start-btn');
  if (btn) btn.innerHTML = '▶ Start Focus (25m)';
  const statusEl = document.getElementById('pomodoro-status');
  if (statusEl) statusEl.textContent = 'Ready to Study';
}

function updatePomodoroDisplay() {
  const display = document.getElementById('pomodoro-timer-display');
  if (!display) return;
  const mins = Math.floor(pomodoroSecondsLeft / 60);
  const secs = pomodoroSecondsLeft % 60;
  display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startFocusOnTask(taskTitle) {
  resetPomodoroTimer();
  togglePomodoroTimer();
  const statusEl = document.getElementById('pomodoro-status');
  if (statusEl) statusEl.textContent = 'Studying';
  showToast(`Focus timer started for "${taskTitle}"! ⏱️`, 'info');
}

/**
 * Event Bindings & Modal Controls
 */
function initDashboardEvents() {
  // Mobile menu toggle
  const toggleBtn = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.querySelector('.app-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Add Task Form Handler
  const addForm = document.getElementById('add-task-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title').value.trim();
      const description = document.getElementById('task-desc').value.trim() || null;
      const category = document.getElementById('task-category').value.trim() || 'General';
      const priority = document.getElementById('task-priority').value;
      const status = document.getElementById('task-status').value;
      const due_date = document.getElementById('task-due-date').value || null;
      let planned_date = document.getElementById('task-planned-date').value || null;
      const estimated_minutes = parseInt(document.getElementById('task-est-minutes').value, 10) || 60;

      // If user is on today tab and planned_date is empty, default to local today
      if (!planned_date && currentTaskTab === 'today') {
        planned_date = new Date().toLocaleDateString('en-CA');
      }

      const submitBtn = document.getElementById('save-task-btn');
      try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Creating...'; }

        await api.tasks.create({
          title, description, category, priority, status, due_date, planned_date, estimated_minutes
        });

        closeModal('add-task-modal');
        addForm.reset();
        showToast('Study task created successfully! 📋', 'success');
        await loadDashboardOverview();
      } catch (err) {
        showToast(err.message || 'Failed to create task', 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Create Task'; }
      }
    });
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openAddTaskModal() {
  const form = document.getElementById('add-task-form');
  if (form) {
    form.reset();
    const plannedInput = document.getElementById('task-planned-date');
    if (plannedInput) {
      plannedInput.value = new Date().toLocaleDateString('en-CA');
    }
  }
  openModal('add-task-modal');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global attachments
window.switchStudyTrack = switchStudyTrack;
window.switchTaskTab = switchTaskTab;
window.openAddTaskModal = openAddTaskModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleTaskToggle = handleTaskToggle;
window.markRoadmapTopicDone = markRoadmapTopicDone;
window.togglePomodoroTimer = togglePomodoroTimer;
window.resetPomodoroTimer = resetPomodoroTimer;
window.startFocusOnTask = startFocusOnTask;
