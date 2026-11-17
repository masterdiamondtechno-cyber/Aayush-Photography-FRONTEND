import { useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { isAuthenticated } from '../../utils/auth';

const ActiveInstituteChecker = () => {
  useEffect(() => {
    let intervalId;

    const checkStatus = async () => {
      if (!isAuthenticated()) return;

      const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '';
      // Exclude App Admin/Super Admin since they don't belong to a single school status check
      if (
        role.toLowerCase() === 'superadmin' || 
        role.toLowerCase() === 'app_admin' || 
        localStorage.getItem('userEmail') === 'superadmin@system.com' ||
        sessionStorage.getItem('userEmail') === 'superadmin@system.com'
      ) {
        return;
      }

      try {
        await axiosInstance.post('/api/auth/check-status', null, {
          skipEnvelopeValidation: true
        });
      } catch (err) {
        // Errors (like 403 Forbidden with School is Inactive) are automatically caught
        // by the axiosInstance interceptor which clears storage and redirects to /login.
        console.error('School status check failed:', err);
      }
    };

    // Run immediately on mount
    checkStatus();

    // Poll every 60 seconds (reduced from aggressive 1.5s) to avoid network spam
    intervalId = setInterval(checkStatus, 60000);

    // Also check immediately when the tab gets focused
    const handleFocus = () => {
      checkStatus();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
};

export default ActiveInstituteChecker;
