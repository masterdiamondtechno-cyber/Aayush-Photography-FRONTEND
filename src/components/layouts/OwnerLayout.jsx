import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { clearAuthStorage, isAuthenticated, getDashboardURL } from '../../utils/auth';
import { OWNER_SIDEBAR_LINKS } from "../../data/mockData";
import { BiSearch, BiMenu } from 'react-icons/bi';


const OwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = (localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || '').toLowerCase();
  const authenticated = isAuthenticated();

  // Route Protection: Redirect if not authenticated or not authorized
  useEffect(() => {
    if (!authenticated) {
      clearAuthStorage();
      sessionStorage.setItem('logout_msg', 'session_expired');
      window.location.href = '/login';
      return;
    }
    if (role !== 'owner') {
      navigate(getDashboardURL());
    }
  }, [authenticated, role, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ msg: 'session_expired' }} />;
  }
  if (role !== 'owner') {
    return <Navigate to={getDashboardURL()} replace />;
  }

  const userRole = localStorage.getItem('userRole') || 'owner';
  const userEmail = localStorage.getItem('userEmail') || 'owner@school.com';
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const displayName = userEmail.split('@')[0].toUpperCase();

  const getInitials = (name) => {
    if (!name) return 'OW';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  const handleLogout = () => {
    clearAuthStorage();
    sessionStorage.setItem('logout_msg', 'logged_out');
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <Sidebar 
        links={OWNER_SIDEBAR_LINKS}
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
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden w-10 h-10 flex items-center justify-center text-[#A0A0A0] hover:bg-[#1E1E1E] rounded-lg transition" 
                onClick={() => setSidebarOpen(true)} 
                title="Open Menu"
              >
                <BiMenu size={22} />
              </button>
              <h2 className="font-['Lexend'] text-lg font-semibold text-[#E0E0E0] truncate">
                Owner Module
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFC629]/15 text-[#FFC629] text-xs font-bold rounded-full border border-[#FFC629]/30">
                Institutional Owner
              </span>
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

export default OwnerLayout;
