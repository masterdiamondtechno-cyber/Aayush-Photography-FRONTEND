import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { logout } from '../../api/api';
import { clearAuthStorage, isAuthenticated, getDashboardURL } from '../../utils/auth';
import { isSubscriptionExpired } from '../../utils/subscription';
import SubscriptionGuard from '../common/SubscriptionGuard';

import { 
  BiGridAlt, BiSolidUserDetail, BiBookBookmark, 
  BiListCheck, BiBookmark, BiTable, 
  BiCog, BiSearch, 
  BiCalendarCheck,
  BiCamera,
  BiLaptop,
  BiMenu,
  BiHomeAlt
} from 'react-icons/bi';

/**
 * TeacherLayout component
 * Reuses Sidebar with teacher-specific links
 */
const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
  const authenticated = isAuthenticated();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Route Protection: Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!authenticated) {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'session_expired');
      window.location.href = '/login';
      return;
    }
    if (role !== 'teacher') {
      navigate(getDashboardURL());
    }
  }, [authenticated, role, navigate]);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ msg: 'session_expired' }} />;
  }
  if (role !== 'teacher') {
    return <Navigate to={getDashboardURL()} replace />;
  }

  const userRole = localStorage.getItem('userRole') || 'teacher';
  const userEmail = localStorage.getItem('userEmail') || 'teacher@school.com';
  const displayName = userEmail.split('@')[0].toUpperCase();
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  const getInitials = (name) => {
    if (!name) return 'TR';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  const teacherLinks = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: BiGridAlt },
    { path: '/home', label: 'Home', icon: BiHomeAlt },
    { path: '/teacher/students', label: 'My Students', icon: BiSolidUserDetail },
    { path: '/teacher/live-lecture', label: 'Live Lecture', icon: BiBookBookmark },
    { path: '/teacher/recorded-lecture', label: 'Recorded Lecture', icon: BiCamera },
    { path: '/teacher/subjects', label: 'My Subjects', icon: BiBookBookmark },
    { path: '/teacher/attendance', label: 'Attendance', icon: BiListCheck },
    { path: '/teacher/noticeboard', label: 'Notice Board', icon: BiBookmark },
    { path: '/teacher/leave', label: 'Leave', icon: BiCalendarCheck },
    { path: '/teacher/timetable', label: 'Timetable', icon: BiTable },
    { path: '/teacher/study-material', label: 'Study Material', icon: BiBookBookmark },
    { path: '/teacher/workspace', label: 'Assignments Workspace', icon: BiLaptop },
    { path: '/teacher/settings', label: 'Settings', icon: BiCog },
  ];

  const handleLogout = async () => {
    console.log('[TeacherLayout] Logging out...');
    try {
      await logout();
    } catch (error) {
      console.warn('[TeacherLayout] Backend logout failed, clearing local state anyway.', error);
    } finally {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'logged_out');
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <Sidebar 
        links={teacherLinks} 
        onLogout={handleLogout} 
        userName={displayName} 
        userEmail={userEmail} 
        initials={initials} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-layout-content flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-[900] h-16 flex items-center bg-[#111111] border-b border-[#1E1E1E] min-w-0 px-4 lg:px-6 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden w-10 h-10 flex items-center justify-center text-[#A0A0A0] hover:bg-[#1E1E1E] rounded-lg transition" 
                onClick={() => setSidebarOpen(true)} 
                title="Open Menu"
              >
                <BiMenu />
              </button>
              <h2 className="font-['Lexend'] text-lg font-semibold text-[#E0E0E0]">
                {displayRole} Panel
              </h2>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 min-w-0 overflow-x-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          {isSubscriptionExpired() ? (
            <SubscriptionGuard feature="trial-expired-gate" />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
