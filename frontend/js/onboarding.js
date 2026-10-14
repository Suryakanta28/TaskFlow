/**
 * TaskFlow - Interactive Study Path Onboarding Controller
 * Modern 3-Step Wizard with Dynamic Presets, Validation & Micro-interactions
 */

let currentStep = 1;

const TRACK_GOAL_SUGGESTIONS = {
  FULL_STACK: [
    'Crack SDE-1 at Top Product Co',
    'Build & Launch Full-Stack SaaS MVP',
    'Master FastAPI, React & System Design',
    'Prepare for Technical Coding Interviews'
  ],
  SSC: [
    'Target 160+ Score in SSC CGL Tier-1',
    'Crack SSC CHSL in First Attempt',
    'Master Quantitative Aptitude & Reasoning',
    'Top 500 All India Rank in SSC'
  ],
  RAILWAY: [
    'Clear RRB NTPC CBT-1 & CBT-2',
    'Score 85+ Marks in Railway Exam',
    'Complete General Science & Railway Math',
    'Secure Technical / Non-Technical Railway Post'
  ],
  JEE: [
    'Target Top 1% Percentile in JEE Main',
    'Crack IIT JEE Advanced Engineering',
    'Master Physics Mechanics & Calculus',
    'Aim for Top NIT or IIT Computer Science'
  ],
  NEET: [
    'Score 680+ Marks in NEET Medical',
    'Master 100% NCERT Biology Zoology & Botany',
    'Target Top Government Medical College (MBBS)',
    'Master Organic Chemistry & High-Yield Physics'
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  const user = Auth.getUser();
  if (user && user.category) {
    const radio = document.querySelector(`input[name="study_path"][value="${user.category}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  // Initialize UI components
  updateSubjectChips();
  updateGoalSuggestions();
  updateRoutineSummary();

  // Listen to study path changes
  document.querySelectorAll('input[name="study_path"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateSubjectChips();
      updateGoalSuggestions();
    });
  });

  // Handle Form Submit
  const form = document.getElementById('onboarding-form');
  if (form) {
    form.addEventListener('submit', handleOnboardingSubmit);
  }
});

/**
 * Step Navigation (1 -> 2 -> 3)
 */
function goToStep(step) {
  if (step < 1 || step > 3) return;

  // Validate step before proceeding forward
  if (step > currentStep) {
    if (currentStep === 1) {
      const selectedTrack = document.querySelector('input[name="study_path"]:checked');
      if (!selectedTrack) {
        showToast('Please select a study track to proceed', 'error');
        return;
      }
    }
  }

  currentStep = step;

  // Show/Hide step panes
  document.querySelectorAll('.step-pane').forEach((pane, idx) => {
    if (idx + 1 === step) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Update Stepper Navigation & Progress Bar
  const progressFill = document.getElementById('onboard-progress-fill');
  const percentages = { 1: '33.33%', 2: '66.66%', 3: '100%' };
  if (progressFill) {
    progressFill.style.width = percentages[step];
  }

  // Update Step Pills
  for (let s = 1; s <= 3; s++) {
    const pill = document.getElementById(`step-nav-${s}`);
    const numEl = pill ? pill.querySelector('.onboard-step-num') : null;
    if (!pill || !numEl) continue;

    pill.classList.remove('active', 'completed');

    if (s < step) {
      pill.classList.add('completed');
      numEl.innerHTML = '✓';
    } else if (s === step) {
      pill.classList.add('active');
      numEl.innerHTML = s;
    } else {
      numEl.innerHTML = s;
    }
  }

  // Scroll smoothly to top of card
  const card = document.querySelector('.onboard-card');
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Daily Minutes Preset Selection
 */
function setDailyMinutes(minutes, btnEl) {
  const select = document.getElementById('daily-minutes');
  if (select) select.value = minutes;

  document.querySelectorAll('#time-presets-row .time-preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (btnEl) btnEl.classList.add('active');

  updateRoutineSummary();
}

/**
 * Study Days Preset Selection
 */
function setStudyDays(days, btnEl) {
  const select = document.getElementById('study-days');
  if (select) select.value = days;

  document.querySelectorAll('#days-presets-row .day-preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (btnEl) btnEl.classList.add('active');

  updateRoutineSummary();
}

/**
 * Recalculate Live Weekly Routine Summary
 */
function updateRoutineSummary() {
  const minutes = parseInt(document.getElementById('daily-minutes')?.value, 10) || 120;
  const days = parseInt(document.getElementById('study-days')?.value, 10) || 6;
  const display = document.getElementById('weekly-hours-display');
  if (!display) return;

  const totalWeeklyHours = Math.round((minutes / 60) * days * 10) / 10;
  display.textContent = `${totalWeeklyHours} Hours / week`;
}

/**
 * Preset Target Date (+3m, +6m, +1y)
 */
function setPresetTargetDate(monthsToAdd) {
  const input = document.getElementById('onboard-target-date');
  if (!input) return;

  const target = new Date();
  target.setMonth(target.getMonth() + monthsToAdd);

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');

  input.value = `${yyyy}-${mm}-${dd}`;
  input.focus();
}

function clearTargetDate() {
  const input = document.getElementById('onboard-target-date');
  if (input) input.value = '';
}

/**
 * Update Goal Suggestions based on track
 */
function updateGoalSuggestions() {
  const container = document.getElementById('goal-suggestions-container');
  if (!container) return;

  const selectedPath = document.querySelector('input[name="study_path"]:checked')?.value || 'FULL_STACK';
  const suggestions = TRACK_GOAL_SUGGESTIONS[selectedPath] || TRACK_GOAL_SUGGESTIONS.FULL_STACK;

  container.innerHTML = suggestions.map(text => `
    <button type="button" class="goal-chip-btn" onclick="applyGoalSuggestion(this)">
      + ${text}
    </button>
  `).join('');
}

function applyGoalSuggestion(btn) {
  const input = document.getElementById('specific-goal');
  if (!input) return;
  input.value = btn.textContent.replace(/^\+\s*/, '').trim();
  input.focus();
}

/**
 * Dynamic Focus Subjects Rendering
 */
function updateSubjectChips() {
  const container = document.getElementById('subject-chips-container');
  if (!container) return;

  const selectedPath = document.querySelector('input[name="study_path"]:checked')?.value || 'FULL_STACK';
  const catInfo = Auth.getCategoryInfo(selectedPath);

  if (!catInfo || !catInfo.subjects) return;

  container.innerHTML = catInfo.subjects.map((sub, idx) => `
    <button type="button" class="subject-chip ${idx < 3 ? 'selected' : ''}" data-subject="${sub}" onclick="toggleSubjectChip(this)">
      <span class="chip-check">✓</span>
      <span>${sub}</span>
    </button>
  `).join('');

  updateSubjectCountBadge();
}

function toggleSubjectChip(el) {
  el.classList.toggle('selected');
  updateSubjectCountBadge();
}

function selectAllSubjects() {
  document.querySelectorAll('#subject-chips-container .subject-chip').forEach(c => {
    c.classList.add('selected');
  });
  updateSubjectCountBadge();
}

function resetDefaultSubjects() {
  document.querySelectorAll('#subject-chips-container .subject-chip').forEach((c, idx) => {
    if (idx < 3) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });
  updateSubjectCountBadge();
}

function updateSubjectCountBadge() {
  const countBadge = document.getElementById('selected-subjects-count');
  if (!countBadge) return;

  const total = document.querySelectorAll('#subject-chips-container .subject-chip').length;
  const selected = document.querySelectorAll('#subject-chips-container .subject-chip.selected').length;

  countBadge.textContent = `(Selected: ${selected} of ${total})`;
}

/**
 * Form Submit Handler
 */
async function handleOnboardingSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('onboard-submit-btn');

  const studyPath = document.querySelector('input[name="study_path"]:checked')?.value || 'FULL_STACK';
  const currentLevel = document.querySelector('input[name="current_level"]:checked')?.value || 'Beginner';
  const dailyMinutes = parseInt(document.getElementById('daily-minutes').value, 10) || 120;
  const studyDays = parseInt(document.getElementById('study-days').value, 10) || 6;
  const targetDate = document.getElementById('onboard-target-date').value || null;
  const specificGoal = document.getElementById('specific-goal').value.trim() || null;

  const selectedSubjects = Array.from(document.querySelectorAll('.subject-chip.selected')).map(c => c.dataset.subject);

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span style="display: inline-block; animation: spin 1s infinite linear;">⚙️</span>
      Generating your syllabus roadmap...
    `;

    const updatedUser = await api.users.onboarding({
      study_path: studyPath,
      current_level: currentLevel,
      daily_study_goal_minutes: dailyMinutes,
      study_days_per_week: studyDays,
      target_date: targetDate,
      specific_goal: specificGoal,
      focus_subjects: selectedSubjects
    });

    Auth.setUser(updatedUser);
    showToast('🎉 Personalized study path initialized! Loading your dashboard...', 'success');

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 700);
  } catch (err) {
    showToast(err.message || 'Failed to complete onboarding setup', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Complete Setup & Launch Dashboard 🚀';
  }
}

/**
 * Skip Onboarding Handler
 */
async function skipOnboarding() {
  try {
    const user = Auth.getUser();
    if (user) {
      await api.users.update({ onboarding_completed: true });
    }
    window.location.href = 'dashboard.html';
  } catch {
    window.location.href = 'dashboard.html';
  }
}

// Expose functions globally for inline onclick handlers
window.goToStep = goToStep;
window.setDailyMinutes = setDailyMinutes;
window.setStudyDays = setStudyDays;
window.setPresetTargetDate = setPresetTargetDate;
window.clearTargetDate = clearTargetDate;
window.applyGoalSuggestion = applyGoalSuggestion;
window.toggleSubjectChip = toggleSubjectChip;
window.selectAllSubjects = selectAllSubjects;
window.resetDefaultSubjects = resetDefaultSubjects;
window.skipOnboarding = skipOnboarding;
