/**
 * TaskFlow - Progress & Preparation Analytics Module
 * Comprehensive visual analytics, 7-day velocity chart, subject mastery, and focus session tracker.
 */

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  Auth.updateNavUserInfo();

  await loadAnalytics();
  initSessionForm();
});

// Category Icons mapping
const TRACK_ICONS = {
  'FULL_STACK': '💻',
  'SSC': '🏛️',
  'RAILWAY': '🚆',
  'JEE': '📐',
  'NEET': '🩺'
};

async function loadAnalytics() {
  try {
    const data = await api.analytics.getOverview();
    
    renderHeroCard(data);
    renderKPICards(data);
    renderWeeklyChart(data.weekly_progress, data.daily_goal_minutes || 120);
    renderSubjectBreakdown(data.subject_breakdown, data.priority_breakdown);
    renderRecentSessions(data.recent_sessions);
  } catch (err) {
    console.error('Failed to load analytics:', err);
    showToast(err.message || 'Failed to load progress analytics', 'error');
  }
}

/**
 * 1. Render Hero Banner with Preparation Readiness Gauge & Target Countdown
 */
function renderHeroCard(data) {
  // Track Badge
  const trackCode = data.study_path_code || 'FULL_STACK';
  const trackIcon = TRACK_ICONS[trackCode] || '⚡';
  const trackName = data.study_path_display || 'Full Stack Track';
  
  const trackBadge = document.getElementById('hero-track-badge');
  if (trackBadge) {
    trackBadge.innerHTML = `<span>${trackIcon}</span> <span>${escapeHtml(trackName)}</span>`;
  }

  // Level Badge
  const levelBadge = document.getElementById('hero-level-badge');
  if (levelBadge) {
    levelBadge.textContent = `${data.current_level || 'Beginner'} Level`;
  }

  // Countdown Badge
  const countdownBadge = document.getElementById('hero-countdown-badge');
  if (countdownBadge) {
    if (data.days_remaining !== null && data.days_remaining !== undefined) {
      countdownBadge.style.display = 'inline-flex';
      countdownBadge.textContent = `⏳ ${data.days_remaining} Days Remaining`;
    } else {
      countdownBadge.style.display = 'none';
    }
  }

  // Daily Target
  const targetEl = document.getElementById('hero-daily-target');
  if (targetEl) {
    targetEl.textContent = `${data.daily_goal_minutes || 120} mins/day`;
  }

  // Target Date
  const targetDateEl = document.getElementById('hero-target-date');
  if (targetDateEl) {
    if (data.target_date) {
      const d = new Date(data.target_date);
      targetDateEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      targetDateEl.textContent = 'Not Set';
    }
  }

  // Habit Status
  const habitEl = document.getElementById('hero-habit-status');
  if (habitEl) {
    const streak = data.streak_days || 0;
    if (streak >= 7) habitEl.textContent = '🔥 Highly Consistent';
    else if (streak >= 3) habitEl.textContent = '⚡ Building Momentum';
    else if (streak >= 1) habitEl.textContent = '🌱 Active Starter';
    else habitEl.textContent = '🚀 Ready to Study';
  }

  // Motivational Status Message
  const msgEl = document.getElementById('hero-status-message');
  if (msgEl) {
    const score = data.readiness_score || 0;
    if (score >= 80) {
      msgEl.textContent = 'Outstanding progress! You have mastered the vast majority of your syllabus milestones.';
    } else if (score >= 50) {
      msgEl.textContent = 'Great momentum! You are steadily advancing through your track and daily study goals.';
    } else if (score >= 20) {
      msgEl.textContent = 'Solid foundation built. Keep scheduling daily tasks and logging focus sessions!';
    } else {
      msgEl.textContent = 'Track your syllabus roadmap completion, daily study streaks, and task execution velocity.';
    }
  }

  // Readiness Score Circle Gauge (Circumference of r=45 is ~283)
  const scoreVal = Math.min(Math.max(data.readiness_score || 0, 0), 100);
  const scoreText = document.getElementById('readiness-score-val');
  if (scoreText) scoreText.textContent = `${scoreVal}%`;

  const gaugeFill = document.getElementById('readiness-gauge-fill');
  if (gaugeFill) {
    const maxOffset = 283;
    const offset = maxOffset - (maxOffset * scoreVal / 100);
    setTimeout(() => {
      gaugeFill.style.strokeDashoffset = offset;
    }, 100);
  }
}

/**
 * 2. Render 4 Primary KPI Summary Cards
 */
function renderKPICards(data) {
  // Streak
  const streakEl = document.getElementById('kpi-streak');
  if (streakEl) streakEl.textContent = `${data.streak_days || 0}d`;

  const streakSub = document.getElementById('kpi-streak-sub');
  if (streakSub) {
    const s = data.streak_days || 0;
    streakSub.textContent = s > 0 ? `${s} consecutive active day${s > 1 ? 's' : ''}` : 'Start a streak today!';
  }

  // Study Time
  const totalMins = data.total_study_minutes || 0;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeEl = document.getElementById('kpi-study-time');
  if (timeEl) timeEl.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const weekMins = data.weekly_study_minutes || 0;
  const wHours = Math.floor(weekMins / 60);
  const wMins = weekMins % 60;
  const weekTimeEl = document.getElementById('kpi-week-time');
  if (weekTimeEl) weekTimeEl.textContent = `${wHours > 0 ? `${wHours}h ` : ''}${wMins}m this week`;

  // Task Mastery
  const taskCountEl = document.getElementById('kpi-tasks-completed');
  if (taskCountEl) taskCountEl.textContent = `${data.completed_tasks_count || 0} / ${data.total_tasks_count || 0}`;

  const taskRateEl = document.getElementById('kpi-task-rate');
  if (taskRateEl) taskRateEl.textContent = `${data.task_completion_rate || 0}% completion rate`;

  // Syllabus Coverage
  const roadmapPctEl = document.getElementById('kpi-roadmap-pct');
  if (roadmapPctEl) roadmapPctEl.textContent = `${data.roadmap_completion_pct || 0}%`;

  const roadmapSub = document.getElementById('kpi-roadmap-sub');
  if (roadmapSub) {
    roadmapSub.textContent = `${data.completed_roadmap_topics || 0} of ${data.total_roadmap_topics || 0} topics mastered`;
  }
}

/**
 * 3. Render 7-Day Velocity Interactive Bar Chart
 */
function renderWeeklyChart(weekly, dailyGoal) {
  const container = document.getElementById('analytics-weekly-chart');
  if (!container) return;

  if (!weekly || !weekly.days || weekly.days.length === 0) {
    container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.85rem;">No study data recorded for this week.</div>`;
    return;
  }

  const maxMin = Math.max(...weekly.days.map(d => d.study_minutes || 0), dailyGoal || 120, 60);

  let html = '';
  weekly.days.forEach(day => {
    const studyMins = day.study_minutes || 0;
    const heightPct = Math.round((studyMins / maxMin) * 100);
    const isToday = new Date(day.date).toDateString() === new Date().toDateString();
    const isGoalMet = day.goal_reached || (studyMins >= (dailyGoal || 120) && studyMins > 0);

    let pillClass = 'velocity-bar-pill';
    if (isGoalMet) pillClass += ' goal-met';
    else if (isToday) pillClass += ' today';

    html += `
      <div class="velocity-bar-col" title="${day.day_of_week} (${day.date}): ${studyMins} mins studied, ${day.completed_tasks_count || 0} tasks completed">
        <span class="velocity-bar-val">${studyMins > 0 ? `${studyMins}m` : '0'}</span>
        <div 
          class="${pillClass}" 
          style="height: ${Math.max(heightPct, 6)}%;"
        ></div>
        <span class="velocity-bar-day ${isToday ? 'today' : ''}">
          ${day.day_of_week}
        </span>
      </div>
    `;
  });

  container.innerHTML = html;

  // Velocity Summary Strip
  const totalMins = weekly.actual_studied_minutes || 0;
  const totHours = Math.floor(totalMins / 60);
  const totRem = totalMins % 60;
  const sumTotEl = document.getElementById('summary-week-total');
  if (sumTotEl) sumTotEl.textContent = totHours > 0 ? `${totHours}h ${totRem}m` : `${totRem}m`;

  const sumAvgEl = document.getElementById('summary-daily-avg');
  if (sumAvgEl) sumAvgEl.textContent = `${weekly.daily_average_minutes || Math.round(totalMins / 7)}m/day`;

  const sumPeakEl = document.getElementById('summary-peak-day');
  if (sumPeakEl) {
    if (weekly.best_day_name && weekly.best_day_minutes > 0) {
      sumPeakEl.textContent = `${weekly.best_day_name} (${weekly.best_day_minutes}m)`;
    } else {
      sumPeakEl.textContent = '-';
    }
  }

  const sumGoalsEl = document.getElementById('summary-goals-met');
  if (sumGoalsEl) sumGoalsEl.textContent = `${weekly.days_goal_reached || 0}/7 Days`;
}

/**
 * 4. Render Subject Mastery Breakdown & Priority Distribution
 */
function renderSubjectBreakdown(breakdown, priorityBreakdown) {
  const container = document.getElementById('analytics-subject-breakdown');
  if (!container) return;

  if (!breakdown || breakdown.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No syllabus topics found. Create tasks or check your Study Path!</p>`;
  } else {
    let html = '';
    breakdown.slice(0, 5).forEach(sub => {
      const pct = sub.progress_percentage || 0;
      
      html += `
        <div class="subject-item-row">
          <div class="subject-item-header">
            <span class="subject-item-title">
              <span>📖</span>
              <span>${escapeHtml(sub.subject)}</span>
            </span>
            <span class="subject-item-meta">${sub.completed}/${sub.total} (${pct}%)</span>
          </div>
          <div class="subject-progress-track">
            <div class="subject-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  // Priority Distribution
  if (priorityBreakdown) {
    const highEl = document.getElementById('priority-high-count');
    if (highEl) highEl.textContent = priorityBreakdown.High || 0;

    const medEl = document.getElementById('priority-med-count');
    if (medEl) medEl.textContent = priorityBreakdown.Medium || 0;

    const lowEl = document.getElementById('priority-low-count');
    if (lowEl) lowEl.textContent = priorityBreakdown.Low || 0;
  }
}

/**
 * 5. Render Recent Focus Study Sessions History List
 */
function renderRecentSessions(sessions) {
  const container = document.getElementById('analytics-sessions-list');
  if (!container) return;

  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏱️</div>
        <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem;">No Study Sessions Logged Yet</p>
        <p style="font-size: 0.85rem; margin-bottom: 1rem;">Track your study time by logging focus intervals and pomodoro sessions.</p>
        <button class="btn btn-primary btn-sm" onclick="openLogSessionModal()">⚡ Log Your First Session</button>
      </div>
    `;
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 0.65rem;">';
  sessions.forEach(s => {
    const d = new Date(s.started_at);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="session-card-item">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background: var(--accent-primary-light); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            ⏱️
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">
              ${s.notes ? escapeHtml(s.notes) : 'Deep Focus Study Session'}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
              📅 ${dateStr} at ${timeStr}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="badge badge-in-progress" style="font-size: 0.8rem; font-weight: 700;">
            ${s.duration_minutes} min
          </span>
          <button 
            type="button" 
            class="btn btn-danger btn-icon btn-sm" 
            style="width: 30px; height: 30px; padding: 0;" 
            title="Delete Session"
            onclick="handleDeleteSession(${s.id})"
          >
            🗑️
          </button>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * 6. Quick Duration Presets & Modal Handling
 */
function selectDurationPreset(minutes, btnElement) {
  const durationInput = document.getElementById('session-duration');
  if (durationInput) durationInput.value = minutes;

  // Toggle active class on preset buttons
  document.querySelectorAll('.session-preset-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
}

function openLogSessionModal() {
  openModal('log-session-modal');
  const durInput = document.getElementById('session-duration');
  if (durInput) durInput.focus();
}

function initSessionForm() {
  const form = document.getElementById('log-session-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const duration = parseInt(document.getElementById('session-duration').value, 10) || 45;
    const notes = document.getElementById('session-notes').value.trim() || null;
    const submitBtn = document.getElementById('save-session-btn');

    try {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Saving...'; }

      await api.analytics.logStudySession({
        duration_minutes: duration,
        notes: notes
      });

      closeModal('log-session-modal');
      form.reset();
      showToast('Focus session logged successfully! 🔥', 'success');
      await loadAnalytics();
    } catch (err) {
      showToast(err.message || 'Failed to log study session', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Save Session'; }
    }
  });
}

async function handleDeleteSession(sessionId) {
  if (!confirm('Are you sure you want to delete this study session?')) return;

  try {
    await api.analytics.deleteStudySession(sessionId);
    showToast('Session deleted', 'success');
    await loadAnalytics();
  } catch (err) {
    showToast(err.message || 'Failed to delete session', 'error');
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.openLogSessionModal = openLogSessionModal;
window.selectDurationPreset = selectDurationPreset;
window.handleDeleteSession = handleDeleteSession;
window.openModal = openModal;
window.closeModal = closeModal;

