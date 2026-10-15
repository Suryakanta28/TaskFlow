/**
 * TaskFlow - Study Path & Roadmap Interactive Controller
 * Structured Curriculum, Shortcut Milestone Flow & Compact Checklists
 */

let activeStudyPath = null;
let currentFilter = 'all'; // 'all', 'pending', 'completed'
let searchQuery = '';
let isCompactView = true;
const topicsMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  // Load user profile chip
  renderUserProfile();

  // Load active roadmap
  await loadRoadmap();

  // Initialize custom topic form, edit form, and schedule form
  initTopicForm();
  initEditTopicForm();
  initScheduleTopicForm();
});

function renderUserProfile() {
  const user = Auth.getUser();
  if (!user) return;
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';
  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initials);
  document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
}

async function loadRoadmap() {
  const container = document.getElementById('roadmap-phases-container');
  if (!container) return;

  try {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: var(--text-muted, #94a3b8);">
        <div style="font-size: 2.2rem; animation: spin 1s linear infinite; display: inline-block;">⚙️</div>
        <p style="margin-top: 1rem; font-weight: 600;">Loading your structured curriculum...</p>
      </div>
    `;

    const path = await api.studyPaths.getActive();
    activeStudyPath = path;

    // Cache topics in map for instant editing and scheduling
    topicsMap.clear();
    if (path.phases) {
      path.phases.forEach(ph => {
        if (ph.items) {
          ph.items.forEach(it => {
            topicsMap.set(it.id, it);
          });
        }
      });
    }

    renderRoadmapHeader(path);
    renderShortcutFlowStrip(path);
    updateFilterCounts(path);
    renderPhases(path);
    populatePhaseSelect(path);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 3rem; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚠️</div>
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">Failed to load study path</h3>
        <p style="color: #64748b; margin-bottom: 1.25rem;">${err.message || 'Could not fetch your roadmap.'}</p>
        <button class="btn btn-primary" onclick="loadRoadmap()">Retry</button>
      </div>
    `;
  }
}

function renderRoadmapHeader(path) {
  const catInfo = Auth.getCategoryInfo(path.category);

  const iconEl = document.getElementById('roadmap-track-icon');
  if (iconEl) iconEl.textContent = catInfo.icon || '🗺️';

  const titleEl = document.getElementById('roadmap-track-title');
  if (titleEl) titleEl.textContent = path.title || `${catInfo.name} Roadmap`;

  const descEl = document.getElementById('roadmap-track-desc');
  if (descEl) descEl.textContent = path.description || catInfo.description;

  const pctEl = document.getElementById('roadmap-overall-pct');
  if (pctEl) pctEl.textContent = `${path.completion_percentage}%`;

  const fillEl = document.getElementById('roadmap-overall-fill');
  if (fillEl) fillEl.style.width = `${path.completion_percentage}%`;

  const phasesEl = document.getElementById('roadmap-total-phases');
  if (phasesEl) phasesEl.textContent = path.total_phases || (path.phases ? path.phases.length : 0);

  const topicsEl = document.getElementById('roadmap-total-topics');
  if (topicsEl) topicsEl.textContent = path.total_items || 0;

  const compEl = document.getElementById('roadmap-completed-topics');
  if (compEl) compEl.textContent = path.completed_items || 0;

  // Calculate Total Estimated Hours across all phases
  let totalMinutes = 0;
  if (path.phases) {
    path.phases.forEach(phase => {
      if (phase.items) {
        phase.items.forEach(item => {
          totalMinutes += (item.estimated_minutes || 60);
        });
      }
    });
  }
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const hoursEl = document.getElementById('roadmap-total-hours');
  if (hoursEl) hoursEl.textContent = `~${totalHours}h`;

  const switcher = document.getElementById('roadmap-track-switcher');
  if (switcher && path.category) {
    switcher.value = path.category.toUpperCase();
  }
}

/**
 * Render Horizontal Shortcut Milestone Flow Strip
 */
function renderShortcutFlowStrip(path) {
  const strip = document.getElementById('roadmap-flow-strip');
  if (!strip || !path.phases || path.phases.length === 0) return;

  let html = '';

  path.phases.forEach((phase, idx) => {
    const isCompleted = phase.completed_items === phase.total_items && phase.total_items > 0;
    const isFirstIncomplete = !isCompleted && path.phases.slice(0, idx).every(p => p.completed_items === p.total_items);

    // Format concise short phase title (e.g. "Phase 1: HTML5 & Modern CSS3" -> "HTML & CSS")
    const cleanTitle = phase.title
      .replace(/^Phase\s*\d+:\s*/i, '')
      .replace(/Fundamentals|Mastery|Architecture|Development/gi, '')
      .trim();

    const shortTitle = cleanTitle.length > 20 ? cleanTitle.substring(0, 18) + '...' : cleanTitle;

    const nodeClass = isCompleted 
      ? 'flow-milestone-node is-completed' 
      : (isFirstIncomplete ? 'flow-milestone-node is-current' : 'flow-milestone-node');

    html += `
      <div class="${nodeClass}" onclick="scrollToPhase(${phase.id})" title="Jump to Phase ${phase.sequence_number}: ${escapeHtml(phase.title)}">
        <span class="flow-badge-num">${isCompleted ? '✓' : phase.sequence_number}</span>
        <span>${escapeHtml(shortTitle)}</span>
        <span style="font-size: 0.7rem; opacity: 0.85;">(${phase.progress_percentage}%)</span>
      </div>
    `;

    if (idx < path.phases.length - 1) {
      html += `<span class="flow-arrow-separator">→</span>`;
    }
  });

  strip.innerHTML = html;
}

/**
 * Filter & Search Functions
 */
function updateFilterCounts(path) {
  let total = 0;
  let completed = 0;
  let pending = 0;

  if (path && path.phases) {
    path.phases.forEach(p => {
      if (p.items) {
        p.items.forEach(item => {
          total++;
          if (item.status === 'Completed') completed++;
          else pending++;
        });
      }
    });
  }

  const allEl = document.getElementById('count-filter-all');
  if (allEl) allEl.textContent = total;

  const pendingEl = document.getElementById('count-filter-pending');
  if (pendingEl) pendingEl.textContent = pending;

  const compEl = document.getElementById('count-filter-completed');
  if (compEl) compEl.textContent = completed;
}

function setTopicFilter(filterType, btnEl) {
  currentFilter = filterType;
  document.querySelectorAll('.filter-pill-btn[data-filter]').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  if (activeStudyPath) renderPhases(activeStudyPath);
}

function filterTopics() {
  const searchInput = document.getElementById('roadmap-search');
  searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (activeStudyPath) renderPhases(activeStudyPath);
}

function toggleViewMode() {
  isCompactView = !isCompactView;
  const btn = document.getElementById('view-mode-btn');
  if (btn) {
    btn.textContent = isCompactView ? '⚡ Shortcut View' : '📋 Detailed View';
    btn.classList.toggle('active', isCompactView);
  }
  if (activeStudyPath) renderPhases(activeStudyPath);
}

/**
 * Render Structured Phase Accordion Cards with Shortcut Topics
 */
function renderPhases(path) {
  const container = document.getElementById('roadmap-phases-container');
  if (!container) return;

  if (!path.phases || path.phases.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 3rem; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📚</div>
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">No roadmap phases found</h3>
        <p style="color: #64748b; margin-bottom: 1.25rem;">Click "+ Add Custom Topic" above to start building your custom curriculum!</p>
      </div>
    `;
    return;
  }

  let html = '';
  let visiblePhasesCount = 0;

  path.phases.forEach((phase, phaseIdx) => {
    // Filter items based on status & search query
    let filteredItems = (phase.items || []).filter(item => {
      // Status filter
      if (currentFilter === 'completed' && item.status !== 'Completed') return false;
      if (currentFilter === 'pending' && item.status === 'Completed') return false;

      // Search query filter
      if (searchQuery) {
        const titleMatch = (item.title || '').toLowerCase().includes(searchQuery);
        const subjectMatch = (item.subject || '').toLowerCase().includes(searchQuery);
        const phaseMatch = (phase.title || '').toLowerCase().includes(searchQuery);
        return titleMatch || subjectMatch || phaseMatch;
      }
      return true;
    });

    // If searching or filtering, skip phases with zero matching items
    if ((searchQuery || currentFilter !== 'all') && filteredItems.length === 0) {
      return;
    }

    visiblePhasesCount++;

    const isPhaseDone = phase.completed_items === phase.total_items && phase.total_items > 0;
    const isFirstIncomplete = !isPhaseDone && path.phases.slice(0, phaseIdx).every(p => p.completed_items === p.total_items);
    
    // Automatically open first incomplete phase or when filtering/searching
    const isOpen = Boolean(searchQuery) || currentFilter !== 'all' || phaseIdx === 0 || isFirstIncomplete;

    // Calculate phase estimated hours
    let phaseMinutes = 0;
    (phase.items || []).forEach(it => phaseMinutes += (it.estimated_minutes || 60));
    const phaseHours = Math.round((phaseMinutes / 60) * 10) / 10;

    html += `
      <div class="phase-card ${isPhaseDone ? 'is-phase-completed' : ''}" data-phase-id="${phase.id}" id="phase-card-${phase.id}">
        
        <!-- Phase Header Accordion Toggle -->
        <div class="phase-card-header" onclick="togglePhase(${phase.id})">
          <div class="phase-header-left">
            <span class="phase-badge">${isPhaseDone ? '✓ Completed' : `Phase ${phase.sequence_number}`}</span>
            <div class="phase-title-wrap">
              <h3 class="phase-title">${escapeHtml(phase.title)}</h3>
              <p class="phase-desc">
                ${phase.total_items} Topics • ~${phaseHours} Hours
                ${phase.description && !isCompactView ? ` • ${escapeHtml(phase.description)}` : ''}
              </p>
            </div>
          </div>

          <div class="phase-header-right">
            <div class="phase-progress-widget">
              <span class="phase-progress-text">${phase.completed_items}/${phase.total_items} Topics (${phase.progress_percentage}%)</span>
              <div class="phase-progress-bar-bg">
                <div class="phase-progress-bar-fill" style="width: ${phase.progress_percentage}%;"></div>
              </div>
            </div>
            <span class="phase-chevron ${isOpen ? 'open' : ''}" id="phase-chevron-${phase.id}">▼</span>
          </div>
        </div>

        <!-- Phase Topics Body (Structured Shortcut Checklist) -->
        <div class="phase-body ${isOpen ? 'open' : ''}" id="phase-body-${phase.id}">
          <div class="topics-list">
    `;

    if (filteredItems.length === 0) {
      html += `
        <div style="padding: 1.25rem; text-align: center; color: var(--text-muted, #94a3b8); font-size: 0.85rem;">
          No topics in this phase match your current filter.
        </div>
      `;
    } else {
      filteredItems.forEach(item => {
        const itemDone = item.status === 'Completed';
        const itemInProgress = item.status === 'In Progress';

        // Check if description is generic template filler (e.g., "Core learning item for...")
        const isGenericFiller = !item.description || item.description.startsWith('Core learning item for');
        const showCustomNote = !isGenericFiller && !isCompactView;

        html += `
          <div class="topic-row ${itemDone ? 'is-done' : (itemInProgress ? 'is-in-progress' : '')}" id="topic-row-${item.id}">
            
            <!-- Topic Left: Checkbox, Title & Badges -->
            <div class="topic-row-left">
              <button 
                type="button" 
                class="topic-check-btn" 
                onclick="handleToggleTopicComplete(${item.id})"
                title="${itemDone ? 'Mark as Incomplete' : 'Mark as Completed'}"
              >
                ${itemDone ? '✓' : ''}
              </button>

              <div class="topic-details">
                <span class="topic-name ${itemDone ? 'strike' : ''}">${escapeHtml(item.title)}</span>
                <span class="subject-pill">${escapeHtml(item.subject || 'General')}</span>
                
                ${itemInProgress ? '<span class="topic-status-badge status-badge-progress">⚡ In Progress</span>' : ''}
                ${itemDone ? '<span class="topic-status-badge status-badge-done">✓ Done</span>' : ''}

                ${showCustomNote ? `
                  <div style="width: 100%; font-size: 0.78rem; color: #64748b; margin-top: 0.2rem;">
                    📝 ${escapeHtml(item.description)}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Topic Right: Duration, Notes Link, Plan, Edit, Done Buttons -->
            <div class="topic-row-right">
              <span class="topic-duration">⏱️ ${item.estimated_minutes}m</span>
              
              ${item.resource_url ? `
                <a href="${escapeHtml(item.resource_url)}" target="_blank" rel="noopener" class="topic-link-btn" title="Open Docs / Reference">
                  🔗 Notes
                </a>
              ` : ''}

              <button 
                type="button" 
                class="topic-action-btn btn-plan" 
                onclick="openScheduleTopicModal(${item.id})"
                title="Schedule this topic into your Study Plan"
              >
                📅 Plan
              </button>

              <button 
                type="button" 
                class="topic-action-btn btn-edit" 
                onclick="openEditTopicModal(${item.id})"
                title="Edit topic title, time, module, or notes"
              >
                ✏️ Edit
              </button>

              <button 
                type="button" 
                class="topic-action-btn ${itemDone ? 'btn-reopen' : 'btn-done'}" 
                onclick="handleToggleTopicComplete(${item.id})"
              >
                ${itemDone ? '↩ Reopen' : '✓ Done'}
              </button>
            </div>

          </div>
        `;
      });
    }

    html += `
          </div>
        </div>
      </div>
    `;
  });

  if (visiblePhasesCount === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
        <h4 style="font-weight: 700; color: #0f172a; margin-bottom: 0.25rem;">No topics matched "${escapeHtml(searchQuery)}"</h4>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">Try adjusting your keyword or reset filters.</p>
        <button class="btn btn-secondary btn-sm" onclick="clearFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = html;
}

function clearFilters() {
  currentFilter = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('roadmap-search');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-pill-btn[data-filter]').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });
  if (activeStudyPath) renderPhases(activeStudyPath);
}

/**
 * Scroll directly to a Phase Card from the Shortcut Milestone Flow Strip
 */
function scrollToPhase(phaseId) {
  const card = document.getElementById(`phase-card-${phaseId}`);
  const body = document.getElementById(`phase-body-${phaseId}`);
  const chevron = document.getElementById(`phase-chevron-${phaseId}`);

  if (body) body.classList.add('open');
  if (chevron) chevron.classList.add('open');

  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.style.borderColor = 'var(--accent-primary, #4f46e5)';
    card.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.2)';
    setTimeout(() => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
    }, 1800);
  }
}

function togglePhase(phaseId) {
  const body = document.getElementById(`phase-body-${phaseId}`);
  const chevron = document.getElementById(`phase-chevron-${phaseId}`);
  if (body) body.classList.toggle('open');
  if (chevron) chevron.classList.toggle('open');
}

function expandAllPhases() {
  document.querySelectorAll('.phase-body').forEach(el => el.classList.add('open'));
  document.querySelectorAll('.phase-chevron').forEach(el => el.classList.add('open'));
}

function collapseAllPhases() {
  document.querySelectorAll('.phase-body').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.phase-chevron').forEach(el => el.classList.remove('open'));
}

async function handleToggleTopicComplete(itemId) {
  try {
    const updated = await api.roadmap.toggleComplete(itemId);
    const isDone = updated.status === 'Completed';
    showToast(isDone ? 'Topic marked completed! 🎉' : 'Topic reopened', 'info');
    await loadRoadmap();
  } catch (err) {
    showToast(err.message || 'Could not update topic', 'error');
  }
}

async function resumeNextTopic() {
  try {
    const resumeData = await api.roadmap.getResume();
    if (resumeData && resumeData.topic_id) {
      const targetRow = document.getElementById(`topic-row-${resumeData.topic_id}`);
      if (targetRow) {
        const parentPhase = targetRow.closest('.phase-body');
        if (parentPhase) {
          parentPhase.classList.add('open');
          const chevron = parentPhase.parentElement?.querySelector('.phase-chevron');
          if (chevron) chevron.classList.add('open');
        }
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetRow.style.transition = 'all 0.3s ease';
        targetRow.style.background = '#ede9fe';
        targetRow.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.25)';
        setTimeout(() => {
          targetRow.style.background = '';
          targetRow.style.boxShadow = '';
        }, 2500);
        showToast(`Resuming: ${resumeData.topic_title}`, 'info');
      } else {
        showToast(`Next topic: ${resumeData.topic_title}`, 'info');
      }
    } else {
      showToast('All syllabus topics are currently completed! 🏆', 'success');
    }
  } catch (err) {
    showToast('Could not find next topic', 'error');
  }
}

function populatePhaseSelect(path) {
  const select = document.getElementById('topic-phase-select');
  if (!select || !path.phases) return;

  select.innerHTML = path.phases.map(p => `
    <option value="${p.id}">${escapeHtml(p.title)}</option>
  `).join('');
}

function openAddTopicModal() {
  const form = document.getElementById('add-topic-form');
  if (form) form.reset();
  if (activeStudyPath) populatePhaseSelect(activeStudyPath);
  openModal('add-topic-modal');
}

function initTopicForm() {
  const form = document.getElementById('add-topic-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phaseId = parseInt(document.getElementById('topic-phase-select').value, 10);
    const title = document.getElementById('topic-title').value.trim();
    const description = document.getElementById('topic-desc').value.trim();
    const subject = document.getElementById('topic-subject').value.trim() || 'General';
    const estimatedMinutes = parseInt(document.getElementById('topic-duration').value, 10) || 60;
    const resourceUrl = document.getElementById('topic-resource').value.trim() || null;

    if (!title) {
      showToast('Please enter a topic title', 'error');
      return;
    }

    try {
      await api.roadmap.createItem({
        phase_id: phaseId,
        title,
        description,
        subject,
        item_type: 'topic',
        estimated_minutes: estimatedMinutes,
        resource_url: resourceUrl
      });

      closeModal('add-topic-modal');
      showToast('Custom topic added to your roadmap! ✨', 'success');
      await loadRoadmap();
    } catch (err) {
      showToast(err.message || 'Failed to add topic', 'error');
    }
  });
}

function openEditTopicModal(itemId) {
  const item = topicsMap.get(itemId);
  if (!item) {
    showToast('Topic details not found', 'error');
    return;
  }

  document.getElementById('edit-topic-id').value = item.id;
  document.getElementById('edit-topic-title').value = item.title || '';
  document.getElementById('edit-topic-desc').value = item.description || '';
  document.getElementById('edit-topic-subject').value = item.subject || 'General';
  document.getElementById('edit-topic-duration').value = item.estimated_minutes || 60;
  document.getElementById('edit-topic-resource').value = item.resource_url || '';

  openModal('edit-topic-modal');
}

function initEditTopicForm() {
  const form = document.getElementById('edit-topic-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = parseInt(document.getElementById('edit-topic-id').value, 10);
    const title = document.getElementById('edit-topic-title').value.trim();
    const description = document.getElementById('edit-topic-desc').value.trim() || null;
    const subject = document.getElementById('edit-topic-subject').value.trim() || 'General';
    const estimatedMinutes = parseInt(document.getElementById('edit-topic-duration').value, 10) || 60;
    const resourceUrl = document.getElementById('edit-topic-resource').value.trim() || null;

    if (!title) {
      showToast('Please enter a topic title', 'error');
      return;
    }

    try {
      await api.roadmap.updateItem(itemId, {
        title,
        description,
        subject,
        estimated_minutes: estimatedMinutes,
        resource_url: resourceUrl
      });
      closeModal('edit-topic-modal');
      showToast('Syllabus topic updated successfully! ✨', 'success');
      await loadRoadmap();
    } catch (err) {
      showToast(err.message || 'Failed to update topic', 'error');
    }
  });
}

async function handleDeleteCurrentEditingTopic() {
  const itemId = parseInt(document.getElementById('edit-topic-id').value, 10);
  if (!itemId) return;

  if (!confirm('Are you sure you want to delete this syllabus topic?')) {
    return;
  }

  try {
    await api.roadmap.deleteItem(itemId);
    closeModal('edit-topic-modal');
    showToast('Topic removed from syllabus roadmap', 'info');
    await loadRoadmap();
  } catch (err) {
    showToast(err.message || 'Failed to delete topic', 'error');
  }
}

function openScheduleTopicModal(itemId) {
  const item = topicsMap.get(itemId);
  if (!item) {
    showToast('Topic details not found', 'error');
    return;
  }

  document.getElementById('schedule-topic-id').value = item.id;
  document.getElementById('schedule-topic-name').textContent = item.title;
  document.getElementById('schedule-topic-sub').textContent = `${item.subject || 'General'} • Est. ${item.estimated_minutes || 60}m`;

  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('schedule-topic-date').value = todayStr;
  document.getElementById('schedule-topic-duration').value = item.estimated_minutes || 60;
  document.getElementById('schedule-topic-priority').value = 'Medium';

  openModal('schedule-topic-modal');
}

function initScheduleTopicForm() {
  const form = document.getElementById('schedule-topic-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = parseInt(document.getElementById('schedule-topic-id').value, 10);
    const plannedDate = document.getElementById('schedule-topic-date').value;
    const estimatedMinutes = parseInt(document.getElementById('schedule-topic-duration').value, 10) || 60;
    const priority = document.getElementById('schedule-topic-priority').value || 'Medium';

    if (!plannedDate) {
      showToast('Please select a study date', 'error');
      return;
    }

    try {
      await api.studyPlan.scheduleTopic(itemId, plannedDate, estimatedMinutes, priority);
      closeModal('schedule-topic-modal');
      showToast('Topic scheduled into your Study Plan! 📅 Check "My Study Plan".', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to schedule topic', 'error');
    }
  });
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleRoadmapTrackSwitch(categoryCode) {
  try {
    showToast('Switching curriculum roadmap...', 'info');
    const updatedUser = await api.users.update({ category: categoryCode });
    if (updatedUser) {
      Auth.setUser(updatedUser);
    }
    await loadRoadmap();
    showToast(`Switched to ${categoryCode} track! Roadmap updated. ✨`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to switch track', 'error');
  }
}

// Global bindings for inline onclicks
window.handleRoadmapTrackSwitch = handleRoadmapTrackSwitch;
window.scrollToPhase = scrollToPhase;
window.togglePhase = togglePhase;
window.expandAllPhases = expandAllPhases;
window.collapseAllPhases = collapseAllPhases;
window.handleToggleTopicComplete = handleToggleTopicComplete;
window.resumeNextTopic = resumeNextTopic;
window.setTopicFilter = setTopicFilter;
window.filterTopics = filterTopics;
window.clearFilters = clearFilters;
window.toggleViewMode = toggleViewMode;
window.openAddTopicModal = openAddTopicModal;
window.openEditTopicModal = openEditTopicModal;
window.handleDeleteCurrentEditingTopic = handleDeleteCurrentEditingTopic;
window.openScheduleTopicModal = openScheduleTopicModal;
window.openModal = openModal;
window.closeModal = closeModal;
