import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  BiGridAlt, BiHomeAlt, BiCalendar, BiBookOpen, BiVideo, BiPlayCircle, BiBus,
  BiLogOut, BiSearch, BiUser, BiCalendarCheck, BiMenu, BiX,
} from 'react-icons/bi';
import { logout } from '../../api/api';
import { clearAuthStorage, isAuthenticated, getDashboardURL } from '../../utils/auth';
import { StudentSearchProvider, useStudentSearch } from '../../contexts/StudentSearchContext';
import GlobalYearSelector from './GlobalYearSelector';

const getInitials = (name) => {
  if (!name) return 'ST';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getStoredValue = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

// Sidebar menu: feature = subscription feature (optional)
const NAV_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: BiGridAlt },
  { to: '/student/timetable', label: 'Timetable', icon: BiCalendar },
  { to: '/student/examination', label: 'Exams', icon: BiBookOpen },
  { to: '/student/live-lecture', label: 'Live Lecture', icon: BiVideo, feature: 'live-lectures' },
  { to: '/student/recorded-lecture', label: 'Recorded Lectures', icon: BiPlayCircle, feature: 'recorded-lectures' },
  { to: '/student/workspace', label: 'Workspace', icon: BiVideo },
  { to: '/student/leave', label: 'Leave', icon: BiCalendarCheck },
  { to: '/student/profile', label: 'Profile', icon: BiUser },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition ${
    isActive
      ? 'bg-[#FFC629]/15 text-[#FFC629] font-semibold'
      : 'text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#E0E0E0]'
  }`;

const StudentLayoutInner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useStudentSearch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
  const authenticated = isAuthenticated();

  // â”€â”€ All hooks live above any early return â”€â”€

  // Route Protection: Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!authenticated) {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'session_expired');
      window.location.href = '/login';
      return;
    }
    if (role !== 'student') {
      navigate(getDashboardURL());
    }
  }, [authenticated, role, navigate]);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Early return is safe now (after all hooks)
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ msg: 'session_expired' }} />;
  }
  if (role !== 'student') {
    return <Navigate to={getDashboardURL()} replace />;
  }

  const userEmail = getStoredValue('userEmail') || 'PANKAJ142221@gmail.com';

  // Dynamically load the student's real name from profileData if available
  let displayName = '';
  try {
    const storedProfile = getStoredValue('profileData');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      if (profile && profile.fullName) {
        displayName = profile.fullName;
      }
    }
  } catch (e) {
    console.error('Failed to parse profileData in StudentLayout', e);
  }

  if (!displayName) {
    displayName = getStoredValue('userName') || userEmail.split('@')[0].toUpperCase();
  }

  const initials = getInitials(displayName);

  const handleLogout = async () => {
    console.log('[StudentLayout] Logging out...');
    try {
      await logout();
    } catch (error) {
      console.warn('[StudentLayout] Backend logout failed, clearing local state anyway.', error);
    } finally {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'logged_out');
      window.location.href = '/login';
    }
  };

  const hideSearchBar =
    location.pathname.includes('/live-lecture') || location.pathname.includes('/recorded-lecture');

  const visibleNav = NAV_ITEMS.filter((item) => !item.feature || hasSubscriptionFeature(item.feature));

  return (
    <div className="min-h-dvh bg-[#0D0D0D] font-sans">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[950] bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Modern Floating Island with Visibly Curved Borders */}
      <aside
        className={`fixed left-2.5 top-2.5 bottom-2.5 z-[1000] flex flex-col h-[calc(100dvh-1.25rem)] w-[270px] max-w-[85vw] bg-[#0A0A0A] border border-[#2E2E2E] rounded-3xl overflow-hidden shadow-2xl shadow-black/60 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E1E1E] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFC629] to-[#E0AC1B] text-black rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-[#FFC629]/20 shrink-0">
              S
            </div>
            <div className="min-w-0">
              <span className="font-['Lexend'] font-bold text-white text-base block truncate">Student Portal</span>
              <span className="text-[11px] font-medium text-[#888888] block">Learning Hub</span>
            </div>
          </div>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center text-[#808080] hover:text-white rounded-lg hover:bg-[#1E1E1E] transition shrink-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <BiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 [scrollbar-width:thin] [scrollbar-color:#2A2A2A_transparent]">
          <ul className="space-y-2">
            {visibleNav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={navLinkClass} onClick={() => setSidebarOpen(false)}>
                  <Icon className="text-xl shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-[#1E1E1E] shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC629] to-[#E0AC1B] text-black flex items-center justify-center font-semibold text-sm shadow-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{displayName}</div>
              <div className="text-xs text-[#888888] truncate">{userEmail.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-red-950/60 text-[#888888] hover:text-red-400 border border-[#222222] hover:border-red-900/50 rounded-lg font-medium text-sm transition"
          >
            <BiLogOut className="text-lg" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Content area: md+ pe sidebar ke RIGHT me shuru hota hai */}
      <div className="app-layout-content flex min-h-dvh min-w-0 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-[900] flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-3 border-b border-[#262626] rounded-b-2xl sm:rounded-b-3xl bg-[#111111]/95 backdrop-blur-md px-2.5 sm:px-4 lg:px-6 max-w-full overflow-hidden">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#E0E0E0] rounded-lg transition shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <BiMenu size={22} />
            </button>
            {!hideSearchBar && (
              <div className="relative flex items-center flex-1 max-w-xs sm:max-w-md">
                <BiSearch className="absolute left-3 text-[#606060] text-lg" />
                <input
                  type="text"
                  className="w-full pl-9 pr-9 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder:text-[#666] outline-none focus:bg-[#222] focus:border-[#FFC629] focus:ring-2 focus:ring-[#FFC629]/10 transition"
                  placeholder="Search portal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <BiX size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <GlobalYearSelector />
            <div className="hidden sm:block text-xs font-bold text-[#FFC629] shrink-0 border-l border-[#262626] pl-3 uppercase tracking-wider">Student Panel</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 min-w-0 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const StudentLayout = () => (
  <StudentSearchProvider>
    <StudentLayoutInner />
  </StudentSearchProvider>
);

export default StudentLayout;