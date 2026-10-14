/**
 * TaskFlow - Authentication & Session Management Module
 */

const TOKEN_KEY = 'tm_access_token';
const USER_KEY = 'tm_user';

const CATEGORIES = {
  FULL_STACK: {
    code: 'FULL_STACK',
    name: 'Full Stack Development',
    icon: '💻',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    description: 'Web development, Frontend, Backend, REST APIs, Databases & System Design',
    subjects: ['HTML5 & CSS3', 'JavaScript ES6+', 'Python & FastAPI', 'SQL & Database Design', 'React Fundamentals', 'Security & JWT', 'Cloud & Deployment']
  },
  SSC: {
    code: 'SSC',
    name: 'SSC Preparation',
    icon: '🏛️',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: 'Staff Selection Commission (CGL, CHSL, MTS) exam syllabus & mock tests',
    subjects: ['Quantitative Aptitude', 'Logical Reasoning', 'English Language', 'General Awareness & GK', 'Mock Tests & PYQs']
  },
  RAILWAY: {
    code: 'RAILWAY',
    name: 'Railway Exam Preparation',
    icon: '🚆',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Indian Railways RRB NTPC, Group D, ALP & Technical preparation',
    subjects: ['General Science (Physics/Chem/Bio)', 'Railway Mathematics', 'General Intelligence', 'Railway GK & Current Affairs', 'Mock Papers']
  },
  JEE: {
    code: 'JEE',
    name: 'JEE Preparation',
    icon: '📐',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'Joint Entrance Examination (Main & Advanced) Engineering preparation',
    subjects: ['Physics Mechanics & Waves', 'Physical & Inorganic Chemistry', 'Calculus & Coordinate Geometry', 'Organic Chemistry', 'CBT Mock Series']
  },
  NEET: {
    code: 'NEET',
    name: 'NEET Preparation',
    icon: '🩺',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    description: 'National Eligibility cum Entrance Test Medical preparation',
    subjects: ['Human Physiology & Zoology', 'Genetics & Evolution', 'Botany & Plant Diversity', 'Organic Reaction Mechanisms', 'Physics Optics & Mechanics']
  }
};

const Auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    Auth.updateNavUserInfo();
  },

  updateNavUserInfo: () => {
    const user = Auth.getUser();
    if (!user) return;

    const userIcon = user.avatar_icon || (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '👨‍💻');
    const userColor = user.avatar_color || '#4f46e5';

    document.querySelectorAll('.user-avatar').forEach(el => {
      el.textContent = userIcon;
      if (user.avatar_color) el.style.background = userColor;
    });

    document.querySelectorAll('.user-name').forEach(el => {
      el.textContent = user.name || 'User';
    });

    document.querySelectorAll('.user-email').forEach(el => {
      el.textContent = user.email || '';
    });
  },

  getCategoryInfo: (categoryCode) => {
    const code = (categoryCode || 'FULL_STACK').toUpperCase();
    return CATEGORIES[code] || CATEGORIES.FULL_STACK;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  },

  // Route Guards
  requireAuth: () => {
    if (!Auth.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  },

  requireGuest: () => {
    if (Auth.isAuthenticated()) {
      window.location.href = 'dashboard.html';
    }
  }
};

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span style="font-weight: 700; font-size: 1.1rem;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutRight 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Attach Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('tm_theme');
  document.documentElement.removeAttribute('data-theme');

  // Login Form Handling
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    Auth.requireGuest();

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter your email and password', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Signing in...';

        const data = await api.auth.login(email, password);
        Auth.setToken(data.access_token);
        Auth.setUser(data.user);

        showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');

        setTimeout(() => {
          if (data.user && data.user.onboarding_completed === false) {
            window.location.href = 'onboarding.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 600);
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In to Dashboard →';
      }
    });
  }

  // Registration Form Handling
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    Auth.requireGuest();

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password')?.value;
      const category = document.getElementById('category')?.value || 'FULL_STACK';
      const targetDate = document.getElementById('target-date')?.value || null;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        showToast('Passwords do not match. Please verify.', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Creating Account...';

        await api.auth.register(name, email, password, category, targetDate);

        showToast('Account created successfully! Redirecting to login...', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account & Start →';
      }
    });
  }

  // Password Visibility Toggle
  const toggleButtons = document.querySelectorAll('.password-toggle');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling || btn.parentElement.querySelector('input[type="password"], input[type="text"]');
      if (input) {
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
});

// Export to window
window.Auth = Auth;
window.CATEGORIES = CATEGORIES;
window.showToast = showToast;
