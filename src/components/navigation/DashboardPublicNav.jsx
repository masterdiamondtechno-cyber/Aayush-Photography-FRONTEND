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
 * Prominent, high-contrast gold navigation tabs in the dashboard navbar
 * ensuring complete visibility across all screens.
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
    <div className="flex items-center">
      {/* ── Desktop Horizontal Bar (Clearly visible on lg+ screens) ── */}
      <nav 
        className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#141414] border-2 border-[#2E2E2E] shadow-xl shadow-black/80"
        aria-label="Public website links"
      >
        {PUBLIC_NAV_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-extrabold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black shadow-md shadow-[#FFC629]/40 border border-[#FFC629]'
                    : 'text-[#FFFFFF] bg-[#1E1E1E] hover:text-[#000000] hover:bg-[#FFC629] border border-[#333333] hover:border-[#FFC629] hover:shadow-md hover:shadow-[#FFC629]/30'
                }`
              }
            >
              <Icon className="text-sm shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Compact Dropdown for Tablet & Mobile (lg:hidden) ── */}
      <div className="relative lg:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black font-extrabold text-xs shadow-md shadow-[#FFC629]/30 hover:brightness-110 transition cursor-pointer"
          aria-expanded={dropdownOpen}
          aria-label="Toggle website pages menu"
        >
          <BiGlobe className="text-base shrink-0" />
          <span>Website Pages</span>
          <BiChevronDown className={`text-sm transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#141414] border-2 border-[#FFC629]/50 shadow-2xl py-2 z-[999] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-1.5 text-[11px] font-extrabold text-[#FFC629] uppercase tracking-wider border-b border-[#2A2A2A] mb-1">
              Explore Website
            </div>
            {PUBLIC_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:text-black hover:bg-[#FFC629] transition"
                >
                  <Icon className="text-base text-[#FFC629] group-hover:text-black" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPublicNav;