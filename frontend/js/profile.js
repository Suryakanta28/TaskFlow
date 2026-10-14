/**
 * TaskFlow - Clean & Standard Profile Management
 */

let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  Auth.requireAuth();

  // Load user profile details
  await loadUserProfile();

  // Bind forms and events
  initProfileForm();
  initPasswordForm();
  initPasswordToggles();
});

/**
 * Fetch and display user profile details
 */
async function loadUserProfile() {
  try {
    const user = await api.users.getMe();
    Auth.setUser(user);
    currentProfile = user;

    const catCode = (user.category || 'FULL_STACK').toUpperCase();
    const catInfo = Auth.getCategoryInfo(catCode);
    const userIcon = user.avatar_icon || '👨‍💻';
    const userColor = user.avatar_color || '#4f46e5';

    // 1. Profile Header Display
    const nameEl = document.getElementById('hero-user-name');
    if (nameEl) nameEl.textContent = user.name || 'User';

    const emailEl = document.getElementById('hero-user-email');
    if (emailEl) emailEl.textContent = user.email || '';

    const avatarDisplay = document.getElementById('profile-avatar-display');
    if (avatarDisplay) {
      avatarDisplay.textContent = userIcon;
      avatarDisplay.style.background = userColor;
    }

    const categoryEl = document.getElementById('hero-user-category');
    if (categoryEl) {
      categoryEl.innerHTML = `
        <span class="user-category-chip" style="background: ${catInfo.bg}; color: ${catInfo.color}; border: 1px solid ${catInfo.border}; font-size: 0.85rem; padding: 0.25rem 0.75rem; font-weight: 700;">
          <span>${catInfo.icon}</span>
          <span>${catInfo.name}</span>
        </span>
      `;
    }

    const memberSinceEl = document.getElementById('hero-member-since');
    if (memberSinceEl && user.created_at) {
      const d = new Date(user.created_at);
      memberSinceEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // 2. Task Stats Counters
    const totalEl = document.getElementById('stat-total-tasks');
    if (totalEl) totalEl.textContent = user.total_tasks || 0;

    const completedEl = document.getElementById('stat-completed-tasks');
    if (completedEl) completedEl.textContent = user.completed_tasks || 0;

    const pendingEl = document.getElementById('stat-pending-tasks');
    if (pendingEl) pendingEl.textContent = user.pending_tasks || 0;

    // 3. Populate Edit Profile Form
    const nameInput = document.getElementById('profile-name');
    if (nameInput) nameInput.value = user.name || '';

    const emailInput = document.getElementById('profile-email');
    if (emailInput) emailInput.value = user.email || '';

    const categorySelect = document.getElementById('profile-category');
    if (categorySelect) categorySelect.value = catCode;

    const phoneInput = document.getElementById('profile-phone');
    if (phoneInput) phoneInput.value = user.phone || '';

    // Set selected avatar
    selectAvatar(userIcon);

    // Sidebar update
    Auth.updateNavUserInfo();

  } catch (err) {
    showToast(err.message || 'Failed to load profile', 'error');
  }
}

/**
 * Handle Avatar Selection
 */
function selectAvatar(icon) {
  document.querySelectorAll('.avatar-icon-btn').forEach(btn => {
    if (btn.getAttribute('data-icon') === icon) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });

  const hiddenInput = document.getElementById('profile-avatar-icon');
  if (hiddenInput) hiddenInput.value = icon;

  const avatarDisplay = document.getElementById('profile-avatar-display');
  if (avatarDisplay) avatarDisplay.textContent = icon;
}
window.selectAvatar = selectAvatar;

function openAvatarSelector() {
  const avatarSection = document.getElementById('profile-avatar-icon');
  if (avatarSection) {
    avatarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
window.openAvatarSelector = openAvatarSelector;

/**
 * Handle Profile Details Form Update
 */
function initProfileForm() {
  const form = document.getElementById('profile-details-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profile-name').value.trim();
    const category = document.getElementById('profile-category').value;
    const phone = document.getElementById('profile-phone').value.trim() || null;
    const avatar_icon = document.getElementById('profile-avatar-icon').value || '👨‍💻';
    const submitBtn = document.getElementById('save-profile-btn');

    if (!name || name.length < 2) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving Changes...';
      }

      const updatedUser = await api.users.update({
        name,
        category,
        phone,
        avatar_icon
      });

      Auth.setUser(updatedUser);
      showToast('Profile updated successfully! ✨', 'success');
      await loadUserProfile();
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Profile';
      }
    }
  });
}

/**
 * Handle Change Password Form
 */
function initPasswordForm() {
  const form = document.getElementById('change-password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = document.getElementById('update-password-btn');

    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match. Please verify.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Updating Password...';
      }

      await api.auth.changePassword(currentPassword, newPassword);
      form.reset();
      showToast('Password updated successfully! 🔒', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Password';
      }
    }
  });
}

/**
 * Toggle Password Visibility Eye Button
 */
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling;
      if (input && (input.type === 'password' || input.type === 'text')) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '👁️‍🗨️';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });
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
