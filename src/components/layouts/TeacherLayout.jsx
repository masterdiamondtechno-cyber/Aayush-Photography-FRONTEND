import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { logout } from '../../api/api';
import BrandLogo from '../photography/BrandLogo';
import DashboardPublicNav from '../navigation/DashboardPublicNav';
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
        <header className="sticky top-0 z-[900] h-20 flex items-center bg-[#111111]/95 backdrop-blur-md border-b border-[#1E1E1E] shadow-lg shadow-black/40 min-w-0 px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between gap-4 w-full min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                className="md:hidden w-9 h-9 flex items-center justify-center text-[#FFC629] hover:bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] transition shrink-0" 
                onClick={() => setSidebarOpen(true)} 
                title="Open Menu"
              >
                <BiMenu size={20} />
              </button>

              {/* Mobile Brand Logo in Navbar */}
              <Link to="/teacher/dashboard" className="md:hidden flex items-center shrink-0">
                <BrandLogo size="navbar" className="h-9 w-auto max-w-[165px]" />
              </Link>

              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#FFC629]/30 text-[#FFC629] text-xl shadow-inner shrink-0">
                  <BiCamera />
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-['Cinzel'] text-sm sm:text-base font-bold text-[#FFC629] truncate tracking-wide">
                      {displayRole} Platform
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30 tracking-wider uppercase">
                      Faculty Portal
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8E8E93] truncate hidden sm:block">
                    Ayushyachi Photography • Instructor Panel
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Public Website Nav Links */}
            <DashboardPublicNav />

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-[#262626]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC629] to-[#E0AC1B] text-black font-extrabold text-xs flex items-center justify-center shadow-sm shadow-[#FFC629]/20">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#FFFFFF] leading-tight truncate max-w-[120px]">
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
        <main className="mx-auto w-full max-w-[1400px] flex-1 min-w-0 overflow-x-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
