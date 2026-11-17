/**
 * Authentication & Session Management Utilities
 * Shared logic for role-based portal access
 */

export const AUTH_STORAGE_KEYS = [
  'token',
  'refreshToken',
  'user',
  'userRole',
  'userEmail',
  'schoolId',
  'userId',
  'studentId',
  'teacherId',
  'academicYearId',
  'profileData',
  'ownerId',
  'subscriptionStatus',
  'isSubscriptionExpired',
];

/**
 * Standardized function to clear all institutional session data
 */
export const clearAuthStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  
  // Extra safety: manually remove mapped keys if clear() was blocked
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear any redirect markers
  sessionStorage.removeItem('lastLoginResponse');
};

/**
 * Helper to check for the existence of a valid token
 */
export const isAuthenticated = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return !!token && token !== 'undefined' && token !== 'null' && token.trim() !== '';
};

/**
 * Helper to determine the dashboard path based on user role
 */
export const getDashboardURL = () => {
  let role = (sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '').toLowerCase().trim();
  const validRoles = ['school', 'admin', 'teacher', 'student'];
  if (!role || role === 'undefined' || role === 'null' || !validRoles.includes(role)) {
    role = 'school';
  }
  return `/${role}/dashboard`;
};

/**
 * Helper to update storage values across both localStorage and sessionStorage
 */
export const setAuthValue = (key, value) => {
  if (value === undefined || value === null || value === 'undefined' || value === 'null') return;
  const val = typeof value === 'string' ? value : JSON.stringify(value);
  localStorage.setItem(key, val);
  sessionStorage.setItem(key, val);
};

/**
 * Helper to retrieve values from storage
 */
export const getAuthValue = (key) => {
  if (key === 'academicYearId') {
    try {
      const storeStr = localStorage.getItem('academic-year-storage');
      if (storeStr) {
        const store = JSON.parse(storeStr);
        const selectedId = store?.state?.selectedAcademicYear?.academicYearId;
        if (selectedId) return selectedId;
      }
    } catch (e) {
      console.warn('Failed to parse academic-year-storage:', e);
    }
  }

  const val = localStorage.getItem(key) || sessionStorage.getItem(key);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
};
