import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { clearAuthStorage, isAuthenticated, getDashboardURL } from '../../utils/auth';
import { logout } from '../../api/api';
import { BiSearch, BiBell, BiGlobe, BiMenu } from 'react-icons/bi';
import { SUPERADMIN_SIDEBAR_LINKS } from '../../data/mockData';


/**
 * SuperAdminLayout component
 * Specialized layout for the platform's super administrator
 */
const SuperAdminLayout = () => {
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
    if (role !== 'superadmin') {
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
  if (role !== 'superadmin') {
    return <Navigate to={getDashboardURL()} replace />;
  }

  const userRole = localStorage.getItem('userRole') || 'SUPERADMIN';
  const userEmail = localStorage.getItem('userEmail') || 'superadmin@school.com';
  const displayRole = "Super Admin";
  const displayName = "SUPER ADMIN";
  
  const initials = "SA";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn('[SuperAdminLayout] Logout failed', error);
    } finally {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'logged_out');
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <Sidebar 
        links={SUPERADMIN_SIDEBAR_LINKS}
        onLogout={handleLogout} 
        userName={displayName} 
        userEmail={userEmail} 
        initials={initials} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-layout-content flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-[900] h-20 flex items-center bg-[#111111] border-b border-[#1E1E1E] min-w-0 px-4 lg:px-6 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button className="md:hidden w-10 h-10 flex items-center justify-center text-[#A0A0A0] hover:bg-[#1E1E1E] rounded-lg transition shrink-0" onClick={() => setSidebarOpen(true)} title="Open Menu">
                <BiMenu size={22} />
              </button>
              <h2 className="truncate font-['Cinzel'] text-lg sm:text-xl font-extrabold text-[#FFC629] tracking-wide">{displayRole} Panel</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A1A] hover:bg-[#222222] text-[#A0A0A0] transition">
                <BiBell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-white bg-red-500"></span>
              </button>
              <div className="hidden h-6 w-px bg-[#2A2A2A] sm:block"></div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">System Live</span>
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

export default SuperAdminLayout;
