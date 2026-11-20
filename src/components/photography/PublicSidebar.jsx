import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Home, 
  Info, 
  BookOpen, 
  Building, 
  Image, 
  HelpCircle, 
  PhoneCall, 
  ArrowRight, 
  UserCircle, 
  X,
  Phone
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isAuthenticated, getDashboardURL } from '../../utils/auth';
import BrandLogo from './BrandLogo';
import { SocialMediaBar } from './SocialIcons';
import LanguageToggle from './LanguageToggle';
import { instituteDetails } from '../../data/photographyData';

/**
 * PublicSidebar component for आयुष्याची फोटोग्राफी
 * Provides a persistent luxury left-hand sidebar on desktop,
 * and a smooth slide-out drawer on mobile screens.
 */
const PublicSidebar = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const isMr = language === 'mr';
  const loggedIn = isAuthenticated();
  const dashboardLink = loggedIn ? getDashboardURL() : '/login';

  const portalLabel = loggedIn 
    ? (isMr ? 'डॅशबोर्ड' : 'Dashboard') 
    : (isMr ? 'पोर्टल लॉगिन' : 'Portal Login');

  const navLinks = [
    { to: '/home', label: t.nav.home, icon: Home },
    { to: '/about', label: t.nav.about, icon: Info },
    { to: '/courses', label: t.nav.courses, icon: BookOpen },
    { to: '/facilities', label: t.nav.facilities, icon: Building },
    { to: '/gallery', label: t.nav.gallery, icon: Image },
    { to: '/faq', label: t.nav.faq, icon: HelpCircle },
    { to: '/contact', label: t.nav.contact, icon: PhoneCall },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* ── Top: Brand Identity (Aligned cleanly with top navbar h-20 / 80px) ── */}
      <div className="relative h-20 px-4 border-b border-[#1E1E1E] flex items-center justify-center bg-[#0E0E0E] shrink-0">
        <Link 
          to="/home" 
          className="flex items-center justify-center w-full min-w-0 transition-transform duration-200 group" 
          onClick={onClose}
          aria-label="आयुष्याची फोटोग्राफी"
        >
          <BrandLogo 
            size="navbar" 
            className="max-h-12 w-auto group-hover:scale-105 transition-all duration-200" 
            animated={false}
            hoverEffect={true}
          />
        </Link>

        {/* Close button for mobile drawer */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#888888] hover:text-[#FFC629] rounded-lg hover:bg-[#1E1E1E] transition shrink-0"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Middle: Navigation Links ("khula khula" space-y-3 matching Dashboard Sidebar) ── */}
      <nav className="flex-1 overflow-y-auto py-6 px-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A2A2A transparent' }} aria-label="Main Public Navigation">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#666666]">
          {isMr ? 'मुख्य मेनू' : 'Navigation'}
        </div>

        <ul className="space-y-3">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FFC629]/25 via-[#FFC629]/15 to-transparent text-[#FFC629] border border-[#FFC629]/50 shadow-md shadow-[#FFC629]/20 font-extrabold'
                        : 'text-[#C0C0C0] hover:bg-[#FFC629]/15 hover:text-[#FFE066] border border-transparent hover:border-[#FFC629]/30'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
                        isActive
                          ? 'bg-[#262626] text-white border border-[#3A3A3A] shadow-sm'
                          : 'bg-[#161616] text-[#A0A0A0] border border-[#222222] group-hover:text-white group-hover:bg-[#222222] group-hover:border-[#333333]'
                      }`}>
                        <Icon size={18} />
                      </span>
                      <span className={`text-[0.9rem] font-bold truncate tracking-wide flex-1 ${
                        isActive ? 'text-[#FFC629]' : 'text-[#C0C0C0] group-hover:text-[#FFE066]'
                      }`}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom Utilities & CTAs ── */}
      <div className="shrink-0 px-4 py-4 border-t border-[#1E1E1E] bg-[#0E0E0E] space-y-3">
        {/* Language Selection */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-[#777777] font-medium">
            {isMr ? 'भाषा निवडा:' : 'Language:'}
          </span>
          <LanguageToggle />
        </div>

        {/* Enquire Now Button */}
        <Link
          to="/contact"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#FFC629] hover:bg-[#E0AC1B] text-black shadow-md shadow-[#FFC629]/20 transition-all duration-200"
        >
          <span>{t.nav.enquireNow}</span>
          <ArrowRight size={15} />
        </Link>

        {/* Portal Login Button */}
        <Link
          to={dashboardLink}
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-[#E0E0E0] bg-[#141414] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#FFC629]/50 transition-all duration-200 group"
        >
          <UserCircle size={16} className="text-[#A0A0A0] group-hover:text-white transition" />
          <span>{portalLabel}</span>
        </Link>

        {/* Social Media Links */}
        <div className="pt-2 flex items-center justify-center border-t border-[#1A1A1A]">
          <SocialMediaBar size={24} className="justify-center" />
        </div>

        {/* Helpline chip */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#666666]">
          <Phone size={12} className="text-[#888888]" />
          <span>{instituteDetails.phone}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Persistent Sidebar (Fixed on the Left) ── */}
      <aside 
        className="hidden lg:flex flex-col fixed top-0 bottom-0 left-0 w-72 bg-[#0A0A0A] border-r border-[#1E1E1E] shadow-2xl shadow-black/50 z-[900]"
        aria-label="Desktop Sidebar Navigation"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Overlay & Slide-Out Drawer ── */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        >
          <aside
            className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-[#0A0A0A] border-r border-[#1E1E1E] shadow-2xl shadow-black/50 z-[1010] flex flex-col animate-in slide-in-from-left duration-250"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile Navigation Drawer"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default PublicSidebar;
