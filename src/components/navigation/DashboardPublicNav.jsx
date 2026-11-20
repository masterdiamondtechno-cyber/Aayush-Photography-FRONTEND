import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  BiGlobe, 
  BiChevronDown, 
  BiHomeAlt, 
  BiInfoCircle, 
  BiBookOpen, 
  BiBuilding, 
  BiImage, 
  BiHelpCircle, 
  BiPhone 
} from 'react-icons/bi';

export const PUBLIC_NAV_LINKS = [
  { to: '/home', label: 'Home', icon: BiHomeAlt },
  { to: '/about', label: 'About', icon: BiInfoCircle },
  { to: '/courses', label: 'Courses', icon: BiBookOpen },
  { to: '/facilities', label: 'Facilities', icon: BiBuilding },
  { to: '/gallery', label: 'Gallery', icon: BiImage },
  { to: '/faq', label: 'FAQ', icon: BiHelpCircle },
  { to: '/contact', label: 'Contact', icon: BiPhone },
];

/**
 * DashboardPublicNav component
 * 100% Sidebar-Themed Navigation in Dashboard Navbar
 * Compact layout guaranteeing zero cutoff of FAQ and Contact on all screens.
 */
const DashboardPublicNav = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-center max-w-full">
      {/* ── Horizontal Bar (Sidebar Theme: Gold text + Dark square icon) ── */}
      <nav 
        className="hidden md:flex items-center gap-0.5 lg:gap-1 p-1 rounded-2xl bg-[#0A0A0A] border border-[#1E1E1E] shadow-lg shadow-black/50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0"
        aria-label="Public website links"
      >
        {PUBLIC_NAV_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-xl text-xs font-bold tracking-tight xl:tracking-wide transition-all duration-200 group shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FFC629]/25 via-[#FFC629]/15 to-transparent text-[#FFC629] border border-[#FFC629]/50 shadow-sm shadow-[#FFC629]/20 font-extrabold'
                    : 'text-[#FFC629] hover:bg-[#FFC629]/15 hover:text-[#FFE066] border border-transparent hover:border-[#FFC629]/30'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-6 w-6 lg:h-7 lg:w-7 items-center justify-center rounded-lg transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#262626] text-white border border-[#3A3A3A] shadow-sm'
                        : 'bg-[#161616] text-[#A0A0A0] border border-[#222222] group-hover:text-white group-hover:bg-[#222222] group-hover:border-[#333333]'
                    }`}
                  >
                    <Icon className="text-xs lg:text-sm transition" />
                  </span>
                  <span className={`whitespace-nowrap ${isActive ? 'text-[#FFC629]' : 'text-[#FFC629] group-hover:text-[#FFE066]'}`}>
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Compact Dropdown for Mobile Phones (< 768px) ── */}
      <div className="relative md:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] text-[#FFC629] hover:bg-[#FFC629]/15 hover:border-[#FFC629]/40 font-bold text-xs shadow-md transition cursor-pointer"
          aria-expanded={dropdownOpen}
          aria-label="Toggle website pages menu"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#161616] text-[#A0A0A0] border border-[#222222]">
            <BiGlobe className="text-xs" />
          </span>
          <span>Website Pages</span>
          <BiChevronDown className={`text-sm text-[#A0A0A0] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0A0A0A] border border-[#1E1E1E] shadow-2xl p-1.5 z-[999] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#FFC629] uppercase tracking-wider border-b border-[#1E1E1E] mb-1">
              Website Pages
            </div>
            <div className="space-y-1">
              {PUBLIC_NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#FFC629] hover:bg-[#FFC629]/15 hover:text-[#FFE066] border border-transparent hover:border-[#FFC629]/30 transition group"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#161616] text-[#A0A0A0] border border-[#222222] group-hover:text-white group-hover:bg-[#222222] transition">
                      <Icon className="text-xs" />
                    </span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPublicNav;