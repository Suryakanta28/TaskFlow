/**
 * TaskFlow - Dedicated Task Management Module
 */

const taskState = {
  tasks: [],
  filters: {
    status: 'all',
    priority: 'all',
    search: '',
    sort_by: 'created_at',
    order: 'desc'
  },
  currentView: 'grid',
  editingTaskId: null,
  deletingTaskId: null
};

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  // Load User Info
  Auth.updateNavUserInfo();

  // Fetch initial tasks
  await loadTasks();

  // Initialize event bindings
  initTaskEvents();
});

async function loadTasks() {
  const container = document.getElementById('tasks-list-container');
  if (!container) return;

  try {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
        <div style="font-size: 2rem; animation: spin 1s linear infinite; display: inline-block;">⏳</div>
        <p style="margin-top: 1rem;">Loading your tasks...</p>
      </div>
    `;

    const tasks = await api.tasks.getAll(taskState.filters);
    taskState.tasks = tasks;

    renderTasksView();
    updateSummaryCounts();
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load tasks</h3>
        <p>${err.message || 'An error occurred while fetching your tasks.'}</p>
        <button class="btn btn-primary" onclick="loadTasks()">Retry</button>
      </div>
    `;
  }
}

function updateSummaryCounts() {
  const total = taskState.tasks.length;
  const completed = taskState.tasks.filter(t => t.status === 'Completed').length;
  const pending = total - completed;

  const countLabel = document.getElementById('tasks-count-label');
  if (countLabel) countLabel.textContent = `Showing ${total} task${total === 1 ? '' : 's'}`;

  const compBadge = document.getElementById('summary-completed-count');
  if (compBadge) compBadge.textContent = `${completed} Completed`;

  const pendBadge = document.getElementById('summary-pending-count');
  if (pendBadge) pendBadge.textContent = `${pending} Pending`;

  const sidebarCount = document.getElementById('sidebar-task-count');
  if (sidebarCount) sidebarCount.textContent = total;
}

function renderTasksView() {
  const container = document.getElementById('tasks-list-container');
  if (!container) return;

  if (taskState.tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 4rem 1rem; text-align: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl);">
        <div style="font-size: 3rem; margin-bottom: 0.75rem;">📋</div>
        <h3>No tasks found</h3>
        <p style="color: var(--text-muted); max-width: 420px; margin: 0 auto 1.5rem auto;">
          ${taskState.filters.search || taskState.filters.status !== 'all' || taskState.filters.priority !== 'all'
            ? 'No tasks match your filter criteria. Try clearing your search or filter options.'
            : 'You haven’t created any study tasks yet. Add a new task to organize your preparation.'}
        </p>
        <button class="btn btn-primary" onclick="openAddTaskModal()">+ Create New Task</button>
      </div>
    `;
    return;
  }

  if (taskState.currentView === 'grid') {
    renderGridView(container);
  } else {
    renderTableView(container);
  }
}

function renderGridView(container) {
  let html = '<div class="tasks-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">';

  taskState.tasks.forEach(task => {
    const isDone = task.status === 'Completed';
    const statusClass = (task.status || 'Pending').toLowerCase().replace(' ', '-');
    const priorityClass = (task.priority || 'Medium').toLowerCase();

    const formattedDueDate = task.due_date
      ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'No due date';

    html += `
      <div class="task-card ${isDone ? 'is-completed' : ''}" data-id="${task.id}" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; box-shadow: var(--shadow-sm); transition: all 0.2s ease;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem;">
            <h4 style="font-size: 1.05rem; margin: 0; font-weight: 700; ${isDone ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: var(--text-primary);'}">
              ${escapeHtml(task.title)}
            </h4>
            <span class="badge badge-${priorityClass}">${task.priority}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
            ${task.description ? escapeHtml(task.description) : '<em style="color: var(--text-muted)">No description provided.</em>'}
          </p>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: var(--text-muted); padding-top: 0.75rem; border-top: 1px dashed var(--border-color); margin-bottom: 0.75rem;">
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <span class="category-tag"><span class="category-tag-dot"></span>${escapeHtml(task.category || 'General')}</span>
              <span>⏱️ ${task.estimated_minutes || 60}m</span>
            </div>
            <span>📅 ${formattedDueDate}</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <button class="btn btn-sm ${isDone ? 'btn-secondary' : 'btn-outline'}" onclick="handleTaskToggleComplete(${task.id})" style="flex: 1; justify-content: center;">
              ${isDone ? '↩️ Reopen' : '✓ Mark Complete'}
            </button>
            <button class="btn btn-sm btn-secondary" onclick="openEditTaskModal(${task.id})" title="Edit Task">
              ✏️
            </button>
            <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${task.id}, '${escapeHtml(task.title)}')" title="Delete Task">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderTableView(container) {
  let html = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow-x: auto; box-shadow: var(--shadow-sm);">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
        <thead>
          <tr style="background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">
            <th style="padding: 0.85rem 1rem; width: 44px;">Status</th>
            <th style="padding: 0.85rem 1rem;">Task Title & Details</th>
            <th style="padding: 0.85rem 1rem;">Subject</th>
            <th style="padding: 0.85rem 1rem;">Priority</th>
            <th style="padding: 0.85rem 1rem;">Due Date</th>
            <th style="padding: 0.85rem 1rem; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  taskState.tasks.forEach(task => {
    const isDone = task.status === 'Completed';
    const priorityClass = (task.priority || 'Medium').toLowerCase();
    const formattedDueDate = task.due_date
      ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '-';

    html += `
      <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;" class="${isDone ? 'is-completed' : ''}">
        <td style="padding: 0.85rem 1rem;">
          <input type="checkbox" ${isDone ? 'checked' : ''} onchange="handleTaskToggleComplete(${task.id})" style="cursor: pointer; width: 18px; height: 18px; accent-color: var(--accent-primary);">
        </td>
        <td style="padding: 0.85rem 1rem;">
          <div style="font-weight: 600; ${isDone ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: var(--text-primary);'}">
            ${escapeHtml(task.title)}
          </div>
          ${task.description ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">${escapeHtml(task.description.substring(0, 60))}${task.description.length > 60 ? '...' : ''}</div>` : ''}
        </td>
        <td style="padding: 0.85rem 1rem;">
          <span class="category-tag"><span class="category-tag-dot"></span>${escapeHtml(task.category || 'General')}</span>
        </td>
        <td style="padding: 0.85rem 1rem;">
          <span class="badge badge-${priorityClass}">${task.priority}</span>
        </td>
        <td style="padding: 0.85rem 1rem; color: var(--text-secondary);">
          ${formattedDueDate}
        </td>
        <td style="padding: 0.85rem 1rem; text-align: right;">
          <button class="btn btn-sm btn-secondary" onclick="openEditTaskModal(${task.id})" style="margin-right: 0.25rem;">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${task.id}, '${escapeHtml(task.title)}')">🗑️</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function initTaskEvents() {
  // Search Input
  const searchInput = document.getElementById('tasks-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        taskState.filters.search = e.target.value.trim();
        loadTasks();
      }, 300);
    });
  }

  // Status Filter
  const statusSelect = document.getElementById('filter-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      taskState.filters.status = e.target.value;
      loadTasks();
    });
  }

  // Priority Filter
  const prioritySelect = document.getElementById('filter-priority');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      taskState.filters.priority = e.target.value;
      loadTasks();
    });
  }

  // Sort By
  const sortSelect = document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      taskState.filters.sort_by = e.target.value;
      loadTasks();
    });
  }

  // View Switchers
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewTableBtn = document.getElementById('view-table-btn');
  if (viewGridBtn && viewTableBtn) {
    viewGridBtn.addEventListener('click', () => {
      taskState.currentView = 'grid';
      viewGridBtn.classList.add('active');
      viewTableBtn.classList.remove('active');
      renderTasksView();
    });
    viewTableBtn.addEventListener('click', () => {
      taskState.currentView = 'table';
      viewTableBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      renderTasksView();
    });
  }

  // Add Task Form
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
      const planned_date = document.getElementById('task-planned-date').value || null;
      const estimated_minutes = parseInt(document.getElementById('task-est-minutes').value, 10) || 60;

      try {
        await api.tasks.create({
          title, description, category, priority, status, due_date, planned_date, estimated_minutes
        });
        closeModal('add-task-modal');
        addForm.reset();
        showToast('Task created successfully! ✨', 'success');
        await loadTasks();
      } catch (err) {
        showToast(err.message || 'Failed to create task', 'error');
      }
    });
  }

  // Edit Task Form
  const editForm = document.getElementById('edit-task-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!taskState.editingTaskId) return;

      const title = document.getElementById('edit-task-title').value.trim();
      const description = document.getElementById('edit-task-desc').value.trim() || null;
      const category = document.getElementById('edit-task-category').value.trim() || 'General';
      const priority = document.getElementById('edit-task-priority').value;
      const status = document.getElementById('edit-task-status').value;
      const due_date = document.getElementById('edit-task-due-date').value || null;
      const planned_date = document.getElementById('edit-task-planned-date').value || null;
      const estimated_minutes = parseInt(document.getElementById('edit-task-est-minutes').value, 10) || 60;

      try {
        await api.tasks.update(taskState.editingTaskId, {
          title, description, category, priority, status, due_date, planned_date, estimated_minutes
        });
        closeModal('edit-task-modal');
        showToast('Task updated successfully! ✨', 'success');
        await loadTasks();
      } catch (err) {
        showToast(err.message || 'Failed to update task', 'error');
      }
    });
  }

  // Delete Confirm
  const deleteBtn = document.getElementById('confirm-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!taskState.deletingTaskId) return;
      try {
        await api.tasks.delete(taskState.deletingTaskId);
        closeModal('delete-modal');
        showToast('Task deleted successfully', 'success');
        await loadTasks();
      } catch (err) {
        showToast(err.message || 'Failed to delete task', 'error');
      }
    });
  }
}

async function handleTaskToggleComplete(taskId) {
  try {
    const updated = await api.tasks.toggleComplete(taskId);
    showToast(updated.status === 'Completed' ? 'Task marked as completed! 🎉' : 'Task reopened as Pending', 'info');
    await loadTasks();
  } catch (err) {
    showToast(err.message || 'Failed to toggle task completion', 'error');
  }
}

function openAddTaskModal() {
  const form = document.getElementById('add-task-form');
  if (form) form.reset();
  openModal('add-task-modal');
}

function openEditTaskModal(taskId) {
  const task = taskState.tasks.find(t => t.id === taskId);
  if (!task) return;

  taskState.editingTaskId = taskId;
  document.getElementById('edit-task-title').value = task.title;
  document.getElementById('edit-task-desc').value = task.description || '';
  document.getElementById('edit-task-category').value = task.category || 'General';
  document.getElementById('edit-task-priority').value = task.priority || 'Medium';
  document.getElementById('edit-task-status').value = task.status || 'Pending';
  document.getElementById('edit-task-due-date').value = task.due_date || '';
  document.getElementById('edit-task-planned-date').value = task.planned_date || '';
  document.getElementById('edit-task-est-minutes').value = task.estimated_minutes || 60;

  openModal('edit-task-modal');
}

function openDeleteModal(taskId, title) {
  taskState.deletingTaskId = taskId;
  const titleEl = document.getElementById('delete-task-title');
  if (titleEl) titleEl.textContent = `"${title}"`;
  openModal('delete-modal');
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

window.openAddTaskModal = openAddTaskModal;
window.openEditTaskModal = openEditTaskModal;
window.openDeleteModal = openDeleteModal;
window.closeModal = closeModal;
window.handleTaskToggleComplete = handleTaskToggleComplete;
window.loadTasks = loadTasks;
