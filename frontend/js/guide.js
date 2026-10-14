/**
 * TaskFlow - Interactive User Guide Modal Component
 * Clean, organized step-by-step instructions.
 */

(function () {
  const guideModalHTML = `
  <div class="modal-backdrop guide-modal-backdrop" id="how-to-guide-modal" role="dialog" aria-labelledby="guide-modal-title" aria-modal="true">
    <div class="modal-box guide-modal-box">
      <!-- Guide Header -->
      <div class="modal-header guide-modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="guide-header-icon">📖</div>
          <div>
            <h3 id="guide-modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
              TaskFlow User Guide & Instructions
            </h3>
            <p style="margin: 0.15rem 0 0 0; font-size: 0.825rem; color: var(--text-secondary);">
              Organized step-by-step guide for login, task management & navigation
            </p>
          </div>
        </div>
        <button class="modal-close" onclick="closeGuideModal()" aria-label="Close Guide">✕</button>
      </div>

      <!-- Guide Tab Bar -->
      <div class="guide-tab-bar">
        <button class="guide-tab-btn active" data-tab="guide-tab-login" onclick="switchGuideTab('guide-tab-login')">
          <span>🔐</span>
          <span>1. Login & Registration</span>
        </button>
        <button class="guide-tab-btn" data-tab="guide-tab-tasks" onclick="switchGuideTab('guide-tab-tasks')">
          <span>📋</span>
          <span>2. Task Management</span>
        </button>
        <button class="guide-tab-btn" data-tab="guide-tab-nav" onclick="switchGuideTab('guide-tab-nav')">
          <span>🧭</span>
          <span>3. Navigation & Tips</span>
        </button>
      </div>

      <!-- Guide Body -->
      <div class="modal-body guide-modal-body">
        
        <!-- Tab 1: How to Login & Sign Up (Organized Steps) -->
        <div class="guide-tab-content active" id="guide-tab-login">
          <div class="guide-steps-list">
            
            <!-- Step 1 -->
            <div class="guide-step-card">
              <div class="guide-step-number">1</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Create a New Account</strong>
                  <span class="guide-step-tag">New Users</span>
                </div>
                <p>Click on <strong>"Get Started"</strong> or <strong>"Create Account"</strong>. Fill in your Full Name, Email, and Password (minimum 6 characters) to register.</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="guide-step-card">
              <div class="guide-step-number">2</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Sign In with Your Credentials</strong>
                  <span class="guide-step-tag">Sign In</span>
                </div>
                <p>Go to the <strong>Sign In</strong> page, enter your registered email and password, then click <strong>"Sign In to Dashboard"</strong>.</p>
              </div>
            </div>

            <!-- Step 3 (Clean Demo Helper) -->
            <div class="guide-step-card">
              <div class="guide-step-number">3</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Quick Demo Testing</strong>
                  <span class="guide-step-tag" style="background: var(--accent-primary-light); color: var(--accent-primary);">Instant Test</span>
                </div>
                <p>To test the dashboard immediately, use the demo credentials below or click <strong>"⚡ Quick Demo Fill"</strong> on the login screen:</p>
                
                <div class="guide-credential-box" style="margin-top: 0.6rem;">
                  <div class="guide-credential-row">
                    <span class="guide-cred-label">Email:</span>
                    <code class="guide-cred-val">alex.morgan@example.com</code>
                  </div>
                  <div class="guide-credential-row">
                    <span class="guide-cred-label">Password:</span>
                    <code class="guide-cred-val">SecurePassword123!</code>
                  </div>
                </div>

                <div style="margin-top: 0.6rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="copyDemoCredentials()">
                    📋 Copy Credentials
                  </button>
                  <a href="login.html" class="btn btn-primary btn-sm" onclick="closeGuideModal()">
                    🔑 Open Login Page
                  </a>
                </div>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="guide-step-card">
              <div class="guide-step-number">4</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Session Security & Logout</strong>
                  <span class="guide-step-tag">Security</span>
                </div>
                <p>Your authentication token is securely stored. When you are done, click the <strong>"🚪 Logout"</strong> button at the bottom of the sidebar to exit.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Tab 2: Managing Tasks (Organized Steps) -->
        <div class="guide-tab-content" id="guide-tab-tasks">
          <div class="guide-steps-list">
            
            <!-- Step 1 -->
            <div class="guide-step-card">
              <div class="guide-step-number">1</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Create New Tasks</strong>
                  <span class="guide-step-tag">Dashboard</span>
                </div>
                <p>Click the <strong>"+ New Task"</strong> button in the top navbar. Enter Task Title, Description, Priority (High 🔥, Medium ⏳, Low 🟢), and Due Date.</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="guide-step-card">
              <div class="guide-step-number">2</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Organize by Priority</strong>
                  <span class="guide-step-tag">Priority</span>
                </div>
                <p>Mark urgent tasks as <strong>High Priority</strong>. You can instantly filter all high-priority items with one click in the sidebar.</p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="guide-step-card">
              <div class="guide-step-number">3</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Search & Live Status Filters</strong>
                  <span class="guide-step-tag">Filter</span>
                </div>
                <p>Filter tasks by <strong>Pending, In Progress,</strong> or <strong>Completed</strong>. Use the real-time search bar to find any task by keyword instantly.</p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="guide-step-card">
              <div class="guide-step-number">4</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Grid & Table Layout Views</strong>
                  <span class="guide-step-tag">Layout</span>
                </div>
                <p>Switch between the visual <strong>🔲 Grid Card</strong> view and structured spreadsheet-style <strong>📑 Table</strong> view using the toggle buttons.</p>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="guide-step-card">
              <div class="guide-step-number">5</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Complete & Reopen Tasks</strong>
                  <span class="guide-step-tag">Actions</span>
                </div>
                <p>Click <strong>"✓ Complete"</strong> on any task to mark it done. If you need to restore it, simply click <strong>"↩️ Reopen"</strong>.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Tab 3: Home & Navigation (Organized Steps) -->
        <div class="guide-tab-content" id="guide-tab-nav">
          <div class="guide-steps-list">
            
            <!-- Step 1 -->
            <div class="guide-step-card">
              <div class="guide-step-number">1</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Home Button Navigation</strong>
                  <span class="guide-step-tag">Navbar</span>
                </div>
                <p>Click the <strong>"🏠 Home"</strong> button in the top navbar at any time to return to the landing page and product overview without losing your session.</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="guide-step-card">
              <div class="guide-step-number">2</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Sidebar Task Views</strong>
                  <span class="guide-step-tag">Sidebar</span>
                </div>
                <p>Use the left sidebar to quickly switch between <em>All Tasks, Pending, In Progress, Completed,</em> and <em>High Priority</em>.</p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="guide-step-card">
              <div class="guide-step-number">3</div>
              <div class="guide-step-body">
                <div class="guide-step-top">
                  <strong>Mobile Responsive Menu</strong>
                  <span class="guide-step-tag">Mobile</span>
                </div>
                <p>On mobile phones and tablets, tap the <strong>"☰"</strong> hamburger button at the top left to open the full navigation sidebar.</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Guide Footer -->
      <div class="modal-footer guide-modal-footer">
        <span style="font-size: 0.85rem; color: var(--text-muted); margin-right: auto;">
          ⚡ TaskFlow Guide
        </span>
        <button type="button" class="btn btn-secondary" onclick="closeGuideModal()">Close</button>
        <button type="button" class="btn btn-primary" onclick="closeGuideModal();">
          Got it! 👍
        </button>
      </div>
    </div>
  </div>
  `;

  // Inject modal into DOM once ready
  function initGuide() {
    if (!document.getElementById('how-to-guide-modal')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = guideModalHTML;
      document.body.appendChild(wrapper.firstElementChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGuide);
  } else {
    initGuide();
  }

  // Global Guide Functions
  window.openGuideModal = function (targetTab = 'guide-tab-login') {
    initGuide();
    const modal = document.getElementById('how-to-guide-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      window.switchGuideTab(targetTab);
    }
  };

  window.closeGuideModal = function () {
    const modal = document.getElementById('how-to-guide-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.switchGuideTab = function (tabId) {
    const tabButtons = document.querySelectorAll('.guide-tab-btn');
    const tabContents = document.querySelectorAll('.guide-tab-content');

    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  };

  window.copyDemoCredentials = function () {
    const email = 'alex.morgan@example.com';
    const pwd = 'SecurePassword123!';
    const text = `Email: ${email}\nPassword: ${pwd}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof showToast === 'function') {
          showToast('Demo credentials copied to clipboard! 📋', 'success');
        } else {
          alert('Demo credentials copied:\n' + text);
        }
      }).catch(() => {
        if (typeof showToast === 'function') {
          showToast(`Email: ${email} | Password: ${pwd}`, 'info');
        }
      });
    } else {
      if (typeof showToast === 'function') {
        showToast(`Email: ${email} | Password: ${pwd}`, 'info');
      }
    }
  };

  // Close on Backdrop Click & ESC key
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('how-to-guide-modal');
    if (modal && modal.classList.contains('active') && e.target === modal) {
      window.closeGuideModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('how-to-guide-modal');
      if (modal && modal.classList.contains('active')) {
        window.closeGuideModal();
      }
    }
  });
})();
