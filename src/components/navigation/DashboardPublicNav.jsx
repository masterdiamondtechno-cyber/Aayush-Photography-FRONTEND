import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BiGlobe, BiChevronDown } from 'react-icons/bi';

export const PUBLIC_NAV_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/courses', label: 'Courses' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

/**
 * DashboardPublicNav component
 * Displays public website navigation links (Home, About, Courses, Facilities, Gallery, FAQ, Contact)
 * directly within the dashboard top navbar.
 * Renders full horizontal pill bar on desktop, and a sleek dropdown button on smaller screens.
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
      {/* ── Desktop Horizontal Bar (Prominently visible on xl+ screens) ── */}
      <nav 
        className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#141414] border border-[#222222] shadow-inner"
        aria-label="Public website links"
      >
        {PUBLIC_NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#FFC629]/25 via-[#FFC629]/15 to-transparent text-[#FFC629] border border-[#FFC629]/40 shadow-sm shadow-[#FFC629]/20 font-extrabold'
                  : 'text-[#C0C0C0] hover:text-[#FFE066] hover:bg-[#FFC629]/10 border border-transparent'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Compact Dropdown for Tablet & Mobile (xl:hidden) ── */}
      <div className="relative xl:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#FFC629]/40 text-[#FFC629] text-xs font-bold transition shadow-sm"
          aria-expanded={dropdownOpen}
          aria-label="Toggle website pages menu"
        >
          <BiGlobe className="text-sm shrink-0" />
          <span className="hidden sm:inline">Website</span>
          <span className="sm:hidden">Pages</span>
          <BiChevronDown className={`text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#111111] border border-[#2A2A2A] shadow-2xl py-2 z-[999] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3.5 py-1 text-[10px] font-bold text-[#666666] uppercase tracking-wider border-b border-[#1E1E1E] mb-1">
              Website Pages
            </div>
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-between px-3.5 py-2 text-xs font-bold text-[#C0C0C0] hover:text-[#FFC629] hover:bg-[#FFC629]/10 transition"
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPublicNav;