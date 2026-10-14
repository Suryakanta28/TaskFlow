/**
 * TaskFlow - Universal API Client Module
 * Handles all REST API communications with the FastAPI backend.
 */

// Detect API Base URL dynamically
const getApiBaseUrl = () => {
  if (window.location.origin.includes('localhost:8000') || window.location.origin.includes('127.0.0.1:8000')) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Universal Fetch Helper with JWT Bearer Token Injection
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('tm_access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Parse JSON or return empty object
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      // Handle Unauthorized (expired or invalid token)
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        localStorage.removeItem('tm_access_token');
        localStorage.removeItem('tm_user');
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html') && 
            !window.location.pathname.endsWith('/') &&
            !window.location.pathname.includes('index.html')) {
          window.location.href = 'login.html';
        }
      }

      const errorMessage = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

/**
 * API Service Objects
 */
const api = {
  auth: {
    register: (name, email, password, category = 'FULL_STACK', target_date = null) => {
      return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, category, target_date }),
      });
    },

    login: (email, password) => {
      return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    getMe: () => {
      return request('/api/auth/me');
    },

    changePassword: (current_password, new_password) => {
      return request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password, new_password }),
      });
    }
  },

  users: {
    getMe: () => {
      return request('/api/users/me');
    },

    update: (userData) => {
      return request('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },

    updateAvatar: (avatarIcon, avatarColor) => {
      return request('/api/users/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar_icon: avatarIcon, avatar_color: avatarColor }),
      });
    },

    exportData: () => {
      return request('/api/users/export-data');
    },

    resetRoadmap: () => {
      return request('/api/users/reset-roadmap', {
        method: 'POST',
      });
    },

    onboarding: (onboardingData) => {
      return request('/api/users/onboarding', {
        method: 'POST',
        body: JSON.stringify(onboardingData),
      });
    }
  },

  studyPaths: {
    getAll: () => {
      return request('/api/study-paths');
    },

    getActive: () => {
      return request('/api/study-paths/active');
    },

    create: (pathData) => {
      return request('/api/study-paths', {
        method: 'POST',
        body: JSON.stringify(pathData),
      });
    },

    getRoadmap: (pathId) => {
      return request(`/api/study-paths/${pathId}/roadmap`);
    }
  },

  roadmap: {
    createItem: (itemData) => {
      return request('/api/roadmap/items', {
        method: 'POST',
        body: JSON.stringify(itemData),
      });
    },

    updateItem: (id, itemData) => {
      return request(`/api/roadmap/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      });
    },

    deleteItem: (id) => {
      return request(`/api/roadmap/items/${id}`, {
        method: 'DELETE',
      });
    },

    toggleComplete: (id) => {
      return request(`/api/roadmap/items/${id}/complete`, {
        method: 'PATCH',
      });
    },

    getResume: () => {
      return request('/api/roadmap/resume');
    }
  },

  studyPlan: {
    get: () => {
      return request('/api/study-plan');
    },

    schedule: (taskId, plannedDate, estimatedMinutes = 60, priority = null) => {
      return request('/api/study-plan/schedule', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          planned_date: plannedDate,
          estimated_minutes: estimatedMinutes,
          priority: priority
        }),
      });
    },

    scheduleTopic: (roadmapItemId, plannedDate, estimatedMinutes = 60, priority = 'Medium') => {
      return request('/api/study-plan/schedule-topic', {
        method: 'POST',
        body: JSON.stringify({
          roadmap_item_id: roadmapItemId,
          planned_date: plannedDate,
          estimated_minutes: estimatedMinutes,
          priority: priority
        }),
      });
    }
  },

  tasks: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status && params.status !== 'all') query.append('status', params.status);
      if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
      if (params.category && params.category !== 'all') query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.sort_by) query.append('sort_by', params.sort_by);
      if (params.order) query.append('order', params.order);

      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request(`/api/tasks${queryString}`);
    },

    getById: (id) => {
      return request(`/api/tasks/${id}`);
    },

    create: (taskData) => {
      return request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
    },

    update: (id, taskData) => {
      return request(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      });
    },

    delete: (id) => {
      return request(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },

    toggleComplete: (id) => {
      return request(`/api/tasks/${id}/complete`, {
        method: 'PATCH',
      });
    },

    getStats: () => {
      return request('/api/tasks/stats');
    }
  },

  analytics: {
    getDashboardOverview: () => {
      return request('/api/analytics/dashboard-overview');
    },

    getOverview: () => {
      return request('/api/analytics/overview');
    },

    getWeekly: () => {
      return request('/api/analytics/weekly');
    },

    logStudySession: (sessionData) => {
      return request('/api/analytics/study-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
    },

    deleteStudySession: (sessionId) => {
      return request(`/api/analytics/study-sessions/${sessionId}`, {
        method: 'DELETE',
      });
    }
  }
};

// Export to window
window.api = api;
