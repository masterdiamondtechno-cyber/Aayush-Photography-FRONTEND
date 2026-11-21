import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { logout } from '../../api/api';
import BrandLogo from '../photography/BrandLogo';
import GlobalYearSelector from './GlobalYearSelector';
import { clearAuthStorage, isAuthenticated, getDashboardURL } from '../../utils/auth';

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

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = localStorage.getItem('userRole') || 'teacher';
  const userEmail = storedUser.email || localStorage.getItem('userEmail') || 'teacher@school.com';
  const userName = storedUser.name || userEmail.split('@')[0].toUpperCase();
  const displayName = userName;
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  const getInitials = (name) => {
    if (!name) return 'TR';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(userName);

  const teacherLinks = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: BiGridAlt },
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
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      {/* ── 1. Full-Width Top Navbar: Spans ACROSS Sidebar & Content ── */}
      <header className="sticky top-0 z-[1000] h-16 sm:h-20 w-full flex items-center bg-[#111111]/95 backdrop-blur-md border-b border-[#262626] shadow-lg shadow-black/40 min-w-0 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
          {/* Left: Mobile Menu Toggle + Official Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 shrink">
            <button 
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#FFC629] hover:bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] transition shrink-0" 
              onClick={() => setSidebarOpen(true)} 
              title="Open Menu"
            >
              <BiMenu size={20} />
            </button>

            {/* Official Brand Logo in Navbar */}
            <Link to="/teacher/dashboard" className="flex items-center shrink-0 group" aria-label="आयुष्याची फोटोग्राफी">
              <BrandLogo
                size="navbar"
                className="h-8 sm:h-11 w-auto max-w-[150px] sm:max-w-[220px] xl:max-w-[260px] transition-transform duration-200 group-hover:scale-105"
                animated={false}
                hoverEffect={true}
              />
            </Link>

            {/* Faculty Portal Tag */}
            <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30 tracking-wider uppercase shrink-0">
              Faculty Portal
            </span>
          </div>

          {/* Right: Academic Year Selector + User Profile */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <GlobalYearSelector />
            <div className="flex items-center gap-2 pl-1 sm:pl-3 border-l border-[#262626]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC629] to-[#E0AC1B] text-black font-extrabold text-xs flex items-center justify-center shadow-sm shadow-[#FFC629]/20 shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-[#FFFFFF] leading-tight truncate max-w-[90px] xl:max-w-[130px]">
                  {userName}
                </span>
                <span className="text-[10px] text-[#FFC629] uppercase tracking-wider font-semibold">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Workspace: Sidebar (starts below navbar) + Content Area ── */}
      <div className="flex-1 flex min-w-0 relative">
        <Sidebar 
          links={teacherLinks} 
          onLogout={handleLogout} 
          userName={displayName} 
          userEmail={userEmail} 
          initials={initials} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="app-layout-content flex min-h-[calc(100vh-5rem)] min-w-0 flex-1 flex-col overflow-x-hidden">
          <main className="mx-auto w-full max-w-[1400px] flex-1 min-w-0 overflow-x-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default TeacherLayout;
