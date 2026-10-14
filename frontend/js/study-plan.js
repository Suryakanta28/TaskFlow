/**
 * TaskFlow - Study Plan & Weekly Schedule Logic
 * Directly integrated with active syllabus topics, 1-click scheduling & task editor
 */

let currentPlanData = null;
const tasksMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  Auth.updateNavUserInfo();

  initRescheduleForm();
  await loadStudyPlan();
});

async function loadStudyPlan() {
  try {
    const plan = await api.studyPlan.get();
    currentPlanData = plan;

    // Cache tasks in map
    tasksMap.clear();
    if (plan.today_plan) {
      plan.today_plan.forEach(t => tasksMap.set(t.id, t));
    }
    if (plan.weekly_schedule) {
      plan.weekly_schedule.forEach(day => {
        if (day.tasks) {
          day.tasks.forEach(t => tasksMap.set(t.id, t));
        }
      });
    }

    renderPlanHeader(plan);
    renderPlanSummary(plan);
    renderUnscheduledTopics(plan.unscheduled_topics || []);
    renderWeeklyDays(plan.weekly_schedule);
    renderTodayDetailed(plan.today_plan);
  } catch (err) {
    showToast(err.message || 'Failed to load study plan', 'error');
  }
}

function renderPlanHeader(plan) {
  const badge = document.getElementById('plan-track-badge');
  if (badge) {
    const trackName = plan.study_path_display || plan.study_path_title || 'General';
    badge.textContent = `🎯 ${trackName}`;
  }
}

function renderPlanSummary(plan) {
  const todayTasks = plan.today_plan || [];
  const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
  const totalMinutes = todayTasks.reduce((acc, t) => acc + (t.estimated_minutes || 60), 0);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const minEl = document.getElementById('today-planned-minutes');
  if (minEl) minEl.textContent = timeStr;

  const countEl = document.getElementById('today-tasks-count');
  if (countEl) countEl.textContent = todayTasks.length;

  const compEl = document.getElementById('today-completed-count');
  if (compEl) compEl.textContent = completedToday;

  const weekTasksCount = plan.weekly_schedule
    ? plan.weekly_schedule.reduce((acc, d) => acc + (d.tasks?.length || 0), 0)
    : 0;

  const weekEl = document.getElementById('week-planned-tasks');
  if (weekEl) weekEl.textContent = weekTasksCount;

  const dateHeading = document.getElementById('today-date-heading');
  if (dateHeading) {
    dateHeading.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
}

function renderUnscheduledTopics(topics) {
  const container = document.getElementById('unscheduled-topics-container');
  if (!container) return;

  if (!topics || topics.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; background: #f8fafc; border-radius: 10px; color: #64748b; font-size: 0.875rem;">
        <span>🎉 All active syllabus topics are already scheduled or completed!</span>
      </div>
    `;
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = topics.map(item => `
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0.95rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.65rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s ease;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
          <span style="font-size: 0.7rem; font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 0.15rem 0.5rem; border-radius: 6px; text-transform: uppercase;">
            ${escapeHtml(item.subject || 'General')}
          </span>
          <span style="font-size: 0.72rem; color: #64748b; font-weight: 600;">
            ⏱️ ${item.estimated_minutes || 60}m
          </span>
        </div>
        <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; line-height: 1.35;">
          ${escapeHtml(item.title)}
        </div>
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">
          ${escapeHtml(item.phase_title || 'Active Curriculum')}
        </div>
      </div>

      <div style="display: flex; gap: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed #e2e8f0;">
        <button 
          class="btn btn-primary btn-sm" 
          onclick="quickScheduleToToday(${item.id})"
          style="flex: 1; justify-content: center; font-size: 0.78rem; padding: 0.35rem 0.5rem;"
          title="Schedule to today's focus agenda"
        >
          + Add to Today
        </button>
        <button 
          class="btn btn-secondary btn-sm" 
          onclick="promptPickDate(${item.id})"
          style="font-size: 0.78rem; padding: 0.35rem 0.6rem;"
          title="Schedule for another date"
        >
          📅 Date
        </button>
      </div>
    </div>
  `).join('');
}

function renderWeeklyDays(schedule) {
  const container = document.getElementById('weekly-days-grid');
  if (!container || !schedule) return;

  container.innerHTML = schedule.map(day => {
    const isToday = new Date(day.date).toDateString() === new Date().toDateString();
    const taskCount = day.tasks ? day.tasks.length : 0;
    const totalMin = day.total_estimated_minutes || 0;

    return `
      <div style="background: ${isToday ? 'var(--accent-primary-light, #eef2ff)' : 'var(--bg-tertiary, #f8fafc)'}; border: 1.5px solid ${isToday ? 'var(--accent-primary, #4f46e5)' : 'var(--border-color, #e2e8f0)'}; border-radius: var(--radius-md, 10px); padding: 1rem 0.75rem; text-align: center; box-shadow: ${isToday ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none'};">
        <div style="font-size: 0.775rem; font-weight: 700; color: ${isToday ? 'var(--accent-primary, #4f46e5)' : 'var(--text-muted, #64748b)'}; text-transform: uppercase;">
          ${day.day_name}
        </div>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0.25rem 0;">
          ${new Date(day.date).getDate()}
        </div>
        <div style="font-size: 0.775rem; color: var(--text-secondary, #475569); margin-top: 0.35rem;">
          <strong>${taskCount}</strong> tasks (${totalMin}m)
        </div>
      </div>
    `;
  }).join('');
}

function renderTodayDetailed(tasks) {
  const container = document.getElementById('today-detailed-container');
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
        <h4 style="color: #0f172a; font-weight: 700; margin-bottom: 0.25rem;">No study tasks scheduled for today</h4>
        <p style="font-size: 0.85rem; margin-bottom: 1rem; color: #64748b;">Choose topics from the active syllabus above or your full curriculum roadmap to schedule them.</p>
        <a href="study-path.html" class="btn btn-primary btn-sm">🗺️ Explore Syllabus Roadmap</a>
      </div>
    `;
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
  tasks.forEach(task => {
    const isDone = task.status === 'Completed';
    const priorityClass = (task.priority || 'Medium').toLowerCase();
    const isSyllabus = Boolean(task.roadmap_item_id);

    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.15rem; border: 1.5px solid ${isDone ? '#e2e8f0' : '#c7d2fe'}; border-radius: var(--radius-md, 12px); background: ${isDone ? '#f8fafc' : '#ffffff'}; box-shadow: 0 2px 5px rgba(0,0,0,0.02); transition: all 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1;">
          <input 
            type="checkbox" 
            ${isDone ? 'checked' : ''} 
            onchange="toggleTaskDone(${task.id})" 
            style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--accent-primary, #4f46e5); flex-shrink: 0;"
            title="${isDone ? 'Mark as Incomplete' : 'Mark as Completed'}"
          >
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.95rem; ${isDone ? 'text-decoration: line-through; color: var(--text-muted, #94a3b8);' : 'color: var(--text-primary, #0f172a);'}">
              ${escapeHtml(task.title)}
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.78rem; color: var(--text-muted); margin-top: 0.3rem; flex-wrap: wrap;">
              <span class="category-tag"><span class="category-tag-dot"></span>${escapeHtml(task.category || 'General')}</span>
              ${isSyllabus ? `<span class="badge" style="background: #e0e7ff; color: #4338ca; font-weight: 700;">🗺️ Syllabus Topic</span>` : ''}
              <span>⏱️ ${task.estimated_minutes || 60} mins</span>
              <span class="badge badge-${priorityClass}">${task.priority}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.45rem; align-items: center;">
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            onclick="openRescheduleModal(${task.id})"
            title="Edit planned date, time, or priority"
            style="font-size: 0.78rem; padding: 0.35rem 0.65rem;"
          >
            ✏️ Reschedule
          </button>
          <button 
            type="button" 
            class="btn btn-danger btn-sm" 
            onclick="removeTaskFromToday(${task.id})"
            title="Remove this task from today's plan"
            style="font-size: 0.78rem; padding: 0.35rem 0.6rem;"
          >
            ✕
          </button>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

async function quickScheduleToToday(itemId) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await api.studyPlan.scheduleTopic(itemId, todayStr, 60, 'Medium');
    showToast('Topic added to Today\'s Focus Agenda! 🚀', 'success');
    await loadStudyPlan();
  } catch (err) {
    showToast(err.message || 'Failed to schedule topic', 'error');
  }
}

async function promptPickDate(itemId) {
  const chosenDate = prompt('Enter study date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
  if (!chosenDate) return;

  try {
    await api.studyPlan.scheduleTopic(itemId, chosenDate.trim(), 60, 'Medium');
    showToast(`Topic scheduled for ${chosenDate}! 📅`, 'success');
    await loadStudyPlan();
  } catch (err) {
    showToast(err.message || 'Failed to schedule topic', 'error');
  }
}

function openRescheduleModal(taskId) {
  const task = tasksMap.get(taskId);
  if (!task) {
    showToast('Task details not found', 'error');
    return;
  }

  document.getElementById('reschedule-task-id').value = task.id;
  document.getElementById('reschedule-task-title').textContent = task.title;
  document.getElementById('reschedule-task-category').textContent = `${task.category || 'General'} • Current Status: ${task.status}`;

  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('reschedule-task-date').value = task.planned_date || task.due_date || todayStr;
  document.getElementById('reschedule-task-duration').value = task.estimated_minutes || 60;
  document.getElementById('reschedule-task-priority').value = task.priority || 'Medium';

  openModal('reschedule-task-modal');
}

function initRescheduleForm() {
  const form = document.getElementById('reschedule-task-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = parseInt(document.getElementById('reschedule-task-id').value, 10);
    const plannedDate = document.getElementById('reschedule-task-date').value;
    const duration = parseInt(document.getElementById('reschedule-task-duration').value, 10) || 60;
    const priority = document.getElementById('reschedule-task-priority').value || 'Medium';

    if (!plannedDate) {
      showToast('Please select a planned study date', 'error');
      return;
    }

    try {
      await api.studyPlan.schedule(taskId, plannedDate, duration, priority);
      closeModal('reschedule-task-modal');
      showToast('Study schedule updated! ✨', 'success');
      await loadStudyPlan();
    } catch (err) {
      showToast(err.message || 'Failed to update schedule', 'error');
    }
  });
}

async function removeTaskFromToday(taskId) {
  if (!confirm('Remove this task from today\'s plan?')) return;
  try {
    // Setting planned_date to null or past/future removes it from today
    await api.tasks.update(taskId, { planned_date: null });
    showToast('Task removed from today\'s agenda', 'info');
    await loadStudyPlan();
  } catch (err) {
    showToast(err.message || 'Failed to remove task', 'error');
  }
}

async function handleRemoveTaskFromPlan() {
  const taskId = parseInt(document.getElementById('reschedule-task-id').value, 10);
  if (!taskId) return;
  closeModal('reschedule-task-modal');
  await removeTaskFromToday(taskId);
}

async function toggleTaskDone(taskId) {
  try {
    const updated = await api.tasks.toggleComplete(taskId);
    showToast(updated.status === 'Completed' ? 'Task marked as completed! 🎉' : 'Task reopened as Pending', 'info');
    await loadStudyPlan();
  } catch (err) {
    showToast(err.message || 'Failed to update task', 'error');
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

window.toggleTaskDone = toggleTaskDone;
window.quickScheduleToToday = quickScheduleToToday;
window.promptPickDate = promptPickDate;
window.openRescheduleModal = openRescheduleModal;
window.removeTaskFromToday = removeTaskFromToday;
window.handleRemoveTaskFromPlan = handleRemoveTaskFromPlan;
window.openModal = openModal;
window.closeModal = closeModal;
