import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { clearAuthStorage, getAuthValue, isAuthenticated, getDashboardURL } from '../../utils/auth';
import { logout, getSchoolById } from '../../api/api';
import GlobalYearSelector from './GlobalYearSelector';
import BrandLogo from '../photography/BrandLogo';
import { BiWrench, BiX, BiChevronRight, BiMenu, BiCamera, BiHomeAlt } from 'react-icons/bi';

/**
 * AdminLayout component
 * Sidebar (fixed, left) + content area (right of sidebar on md+).
 * On first login (no academicYearId), shows a setup banner and redirects
 * school users to the Master Menu setup wizard automatically.
 */

const WIZARD_STEPS = [
  { stepNumber: 1, name: 'Academic Year', route: '/settings?tab=academic' },
  { stepNumber: 2, name: 'Classes & Sections', route: '/classes' },
  { stepNumber: 3, name: 'Subjects & Mappings', route: '/subjects' },
  { stepNumber: 4, name: 'Teachers Onboarding', route: '/teachers' },
  { stepNumber: 5, name: 'Students Admission', route: '/students' },
  { stepNumber: 6, name: 'Class Timetable', route: '/timetable' },
  { stepNumber: 7, name: 'Daily Attendance', route: '/attendance' },
  { stepNumber: 8, name: 'Exam Schedules', route: '/exam-center' },
  { stepNumber: 9, name: 'Tuition Fees', route: '/fee-collection' },
];

const getActiveStep = (pathname) => {
  if (pathname.includes('/settings')) return WIZARD_STEPS[0];
  if (pathname.includes('/classes')) return WIZARD_STEPS[1];
  if (pathname.includes('/subjects')) return WIZARD_STEPS[2];
  if (pathname.includes('/teachers')) return WIZARD_STEPS[3];
  if (pathname.includes('/students')) return WIZARD_STEPS[4];
  if (pathname.includes('/timetable')) return WIZARD_STEPS[5];
  if (pathname.includes('/attendance')) return WIZARD_STEPS[6];
  if (pathname.includes('/exam-center')) return WIZARD_STEPS[7];
  if (pathname.includes('/fee-collection')) return WIZARD_STEPS[8];
  return null;
};

const getInitials = (name) => {
  if (!name) return 'AD';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
  const authenticated = isAuthenticated();

  const userRole = localStorage.getItem('userRole') || 'admin';
  const userEmail = localStorage.getItem('userEmail') || 'admin@school.com';
  const displayRole = userRole.toLowerCase() === 'school' ? 'Institute' : (userRole.charAt(0).toUpperCase() + userRole.slice(1));
  const displayName = userEmail.split('@')[0].toUpperCase();

  // ── All hooks live above any early return ──
  const [schoolName, setSchoolName] = useState(`${displayRole} Platform`);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return sessionStorage.getItem('masterSetupBannerDismissed') === 'true';
  });

  // Route Protection: Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!authenticated) {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'session_expired');
      window.location.href = '/login';
      return;
    }
    if (role !== 'admin' && role !== 'school') {
      navigate(getDashboardURL());
    }
  }, [authenticated, role, navigate]);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchSchoolName = async () => {
      const schoolId = parseInt(getAuthValue('schoolId')) || null;
      if (!schoolId) return;
      try {
        const response = await getSchoolById(schoolId);
        if (response && response.status === 'SUCCESS' && response.data?.schoolName) {
          setSchoolName(response.data.schoolName);
        }
      } catch (err) {
        console.warn('Failed to fetch school name for navbar:', err);
      }
    };
    fetchSchoolName();
  }, [userRole]);

  // Early return using Navigate to prevent blank black screen
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ msg: 'session_expired' }} />;
  }
  if (role !== 'admin' && role !== 'school') {
    return <Navigate to={getDashboardURL()} replace />;
  }

  // Determine if school hasn't completed master setup (no academic year yet)
  const academicYearId = getAuthValue('academicYearId');
  const isSchoolRole = ['school', 'admin'].includes(userRole.toLowerCase());
  const needsMasterSetup = isSchoolRole && !academicYearId;

  // Only show banner when not already on the master-menu page
  const isOnMasterMenu = location.pathname.includes('/master-menu');

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('masterSetupBannerDismissed', 'true');
  };

  const baseRoute = location.pathname.startsWith('/school') ? '/school' : '/admin';
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    console.log('[AdminLayout] Logging out...');
    try {
      await logout();
    } catch (error) {
      console.warn('[AdminLayout] Backend logout failed, clearing local state anyway.', error);
    } finally {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'logged_out');
      window.location.href = '/login';
    }
  };

  const showSetupBanner = needsMasterSetup && !isOnMasterMenu && !bannerDismissed;

  const activeStep = getActiveStep(location.pathname);
  const showWizardNav = activeStep && (userRole.toLowerCase() === 'school' || userRole.toLowerCase() === 'admin');

  const activeIndex = activeStep ? WIZARD_STEPS.indexOf(activeStep) : -1;
  const prevStep = activeIndex > 0 ? WIZARD_STEPS[activeIndex - 1] : null;
  const nextStep = activeIndex !== -1 && activeIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[activeIndex + 1] : null;

  return (
    <div className="min-h-dvh bg-[#0D0D0D]">
      {/* Sidebar: fixed on the left (w-72 = 288px) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        userName={displayName}
        userEmail={userEmail}
        initials={initials}
      />

      {/* Content area: md+ pe sidebar ke RIGHT me shuru hota hai */}
      <div className="app-layout-content flex min-h-dvh min-w-0 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-[900] h-16 sm:h-20 flex items-center bg-[#111111]/95 backdrop-blur-md border-b border-[#1E1E1E] shadow-lg shadow-black/40 min-w-0 px-2.5 sm:px-5 lg:px-6 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0">
            {/* Left: Hamburger (mobile) + Branding */}
            <div className="flex items-center gap-2 min-w-0 shrink">
              <button
                className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#FFC629] hover:bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] transition shrink-0"
                onClick={() => setSidebarOpen(true)}
                title="Open Menu"
                aria-label="Open menu"
              >
                <BiMenu size={18} />
              </button>

              {/* Mobile: Brand Logo */}
              <Link to={baseRoute + '/dashboard'} className="md:hidden flex items-center shrink-0">
                <BrandLogo size="navbar" className="h-7 w-auto max-w-[110px] xs:max-w-[130px]" />
              </Link>

              {/* Desktop: Camera Icon + School Name */}
              <div className="hidden md:flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#FFC629]/30 text-[#FFC629] text-lg sm:text-xl shadow-inner shrink-0">
                  <BiCamera />
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-['Cinzel'] text-sm lg:text-base font-bold text-[#FFC629] truncate tracking-wide max-w-[190px] xl:max-w-none">
                      {schoolName}
                    </h2>
                    <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30 tracking-wider uppercase shrink-0">
                      Official
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8E8E93] truncate hidden 2xl:block">
                    Ayushyachi Photography
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Academic Year Selector + User Profile (Never overflowing) */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Academic Year in Navbar */}
              <GlobalYearSelector />

              {/* User Info (compact on mobile) */}
              <div className="flex items-center gap-2 pl-1 sm:pl-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#FFC629] to-[#E0AC1B] text-black font-extrabold text-[11px] sm:text-xs flex items-center justify-center shadow-sm shadow-[#FFC629]/20 shrink-0" title={displayName}>
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col text-left min-w-0">
                  <span className="text-xs font-bold text-[#FFFFFF] leading-tight truncate max-w-[90px] xl:max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#FFC629] uppercase tracking-wider font-semibold">
                    {displayRole}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Master Setup Banner ── */}
        {showSetupBanner && (
          <div className="sticky top-20 z-[850] bg-[#161616] border-b border-[#2A2A2A]">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 sm:px-5 py-2">
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center shrink-0">
                <BiWrench className="text-white text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="text-white text-xs font-medium block truncate">
                  Complete your school setup to unlock all features
                </strong>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black rounded-lg font-extrabold text-xs hover:brightness-110 transition shadow-sm"
                  onClick={() => navigate(`${baseRoute}/master-menu`)}
                >
                  Setup Wizard <BiChevronRight className="text-xs" />
                </button>
                <button
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded-md flex items-center justify-center transition"
                  onClick={handleDismissBanner}
                  title="Dismiss"
                >
                  <BiX size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 pb-28 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Sticky Wizard Navigation Bar */}
        {showWizardNav && (
          <div className="fixed bottom-3 sm:bottom-6 left-3 right-3 md:left-[19.5rem] md:right-6 z-[800] bg-[#141414]/95 backdrop-blur-md border border-[#262626] rounded-2xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 shadow-xl">
            <button
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm bg-[#1A1A1A] text-[#CCCCCC] hover:text-white hover:bg-[#222222] border border-[#2A2A2A] transition shrink-0"
              onClick={() => navigate(`${baseRoute}/master-menu`)}
            >
              Master Menu
            </button>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold text-[#FFC629] bg-[#FFC629]/15 border border-[#FFC629]/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                Step {activeStep.stepNumber} of {WIZARD_STEPS.length}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate">{activeStep.name}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              {prevStep ? (
                <button
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm bg-[#1A1A1A] text-[#CCCCCC] border border-[#2A2A2A] hover:bg-[#222222] hover:text-white transition"
                  onClick={() => navigate(`${baseRoute}${prevStep.route}`)}
                >
                  ← Prev
                </button>
              ) : (
                <button
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm bg-[#141414] text-[#555555] border border-[#222222] cursor-not-allowed"
                  disabled
                >
                  ← Prev
                </button>
              )}
              {nextStep ? (
                <button
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black shadow-md shadow-[#FFC629]/25 hover:brightness-110 transition cursor-pointer"
                  onClick={() => navigate(`${baseRoute}${nextStep.route}`)}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black shadow-md shadow-[#FFC629]/25 hover:brightness-110 transition cursor-pointer"
                  onClick={() => navigate(`${baseRoute}/dashboard`)}
                >
                  Complete Setup ✓
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLayout;