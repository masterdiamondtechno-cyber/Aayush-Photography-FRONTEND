import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Camera, Menu, ArrowRight, UserCircle } from 'lucide-react';
import PublicSidebar from '../photography/PublicSidebar';
import BrandLogo from '../photography/BrandLogo';
import Footer from '../photography/Footer';
import { SocialMediaBar } from '../photography/SocialIcons';
import LanguageToggle from '../photography/LanguageToggle';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import { isAuthenticated, getDashboardURL } from '../../utils/auth';
import '../../styles/photography.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

/**
 * Top Navbar component matching the Dashboard header layout:
 * Features camera icon, "Ayushyachi Photography Platform" title,
 * Language Toggle, Social Icons, Enquire button, and Portal Login.
 */
const PublicNavbar = ({ onOpenSidebar }) => {
  const { language, t } = useLanguage();
  const isMr = language === 'mr';
  const loggedIn = isAuthenticated();
  const dashboardLink = loggedIn ? getDashboardURL() : '/login';
  const portalLabel = loggedIn 
    ? (isMr ? 'डॅशबोर्ड' : 'Dashboard') 
    : (isMr ? 'लॉगिन' : 'Login');

  return (
    <header className="sticky top-0 z-[800] h-20 flex items-center bg-[#111111]/95 backdrop-blur-md border-b border-[#1E1E1E] shadow-lg shadow-black/30 px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        
        {/* Left: Mobile Toggle + Mobile Brand Logo + Platform Icon & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="lg:hidden w-9 h-9 flex items-center justify-center text-[#A0A0A0] hover:text-[#FFC629] hover:bg-[#1E1E1E] rounded-lg transition shrink-0 border border-[#262626]"
            onClick={onOpenSidebar}
            title="Open Menu"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Brand Logo in Navbar */}
          <Link to="/home" className="lg:hidden flex items-center shrink-0">
            <BrandLogo size="navbar" className="h-9 w-auto max-w-[165px]" />
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#1E1E1E] text-[#FFC629] border border-[#2B2B2B] shadow-inner shrink-0">
              <Camera size={20} />
            </span>
            <div className="flex flex-col min-w-0">
              <h2 className="font-['Cinzel'] text-sm sm:text-base font-bold text-[#FFC629] truncate tracking-wide">
                {isMr ? 'आयुष्याची फोटोग्राफी • संस्था व्यासपीठ' : 'Ayushyachi Photography Platform'}
              </h2>
              <span className="hidden sm:inline-block text-[11px] text-[#8E8E93] truncate">
                Tushar Pulate Institute of Photography & Film Making
              </span>
            </div>
          </div>
        </div>

        {/* Right: Social Media, Language Switcher, Enquire, Login */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 border-r border-[#262626] pr-3">
            <SocialMediaBar size={22} />
          </div>

          <LanguageToggle />

          <Link
            to="/contact"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black font-extrabold text-xs shadow-md shadow-[#FFC629]/20 hover:brightness-110 transition"
          >
            <span>{t.nav.enquireNow}</span>
            <ArrowRight size={13} />
          </Link>

          <Link
            to={dashboardLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] text-[#E0E0E0] hover:text-[#FFC629] border border-[#2B2B2B] hover:border-[#FFC629]/40 font-semibold text-xs transition"
            title={portalLabel}
          >
            <UserCircle size={15} className="text-[#FFC629]" />
            <span className="hidden sm:inline">{portalLabel}</span>
          </Link>
        </div>

      </div>
    </header>
  );
};

const PublicLayoutInner = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authPages = ['/login', '/signup', '/forgot-password', '/student/change-password', '/change-first-password'];
  const isAuthPage = authPages.some((p) => location.pathname.startsWith(p));

  // Automatically close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      {isAuthPage ? (
        <div className="auth-viewport-wrapper">
          <Outlet />
        </div>
      ) : (
        <div className="site-app min-h-screen bg-[#090909] text-white">
          {/* ── Persistent Luxury Sidebar (Desktop: Fixed Left | Mobile: Overlay Drawer) ── */}
          <PublicSidebar
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />

          {/* ── Main Content Area (Offset on Desktop by lg:pl-72 to sit neatly beside sidebar) ── */}
          <div className="public-content-wrapper lg:pl-72 flex flex-col min-h-screen w-full min-w-0">
            {/* Top Navbar: matching Dashboard layout with camera icon, Institute Platform title, Language & Actions */}
            <PublicNavbar onOpenSidebar={() => setMobileMenuOpen(true)} />

            {/* Main Page Viewport */}
            <main className="main-viewport flex-1 w-full min-w-0">
              <Outlet />
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      )}
    </>
  );
};

/**
 * PublicLayout component for आयुष्याची फोटोग्राफी
 * Wraps content in LanguageProvider and renders the sidebar + top header ecosystem.
 */
const PublicLayout = () => {
  return (
    <LanguageProvider>
      <PublicLayoutInner />
    </LanguageProvider>
  );
};

export default PublicLayout;
