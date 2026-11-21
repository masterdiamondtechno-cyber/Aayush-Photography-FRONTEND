import BrandLogo from './photography/BrandLogo';
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ADMIN_SIDEBAR_LINKS } from '../data/mockData';
import { BiLogOutCircle, BiChevronDown, BiChevronRight, BiX } from 'react-icons/bi';
import { hasSubscriptionFeature } from '../utils/subscription';

/**
 * Sidebar component supporting nested dropdowns
 * Luxury Dark Gold Photography Theme
 * Bright Yellow Typography, Prominent Logo, and Spacious ("khula khula") Layout
 */
const Sidebar = ({ links = ADMIN_SIDEBAR_LINKS, onLogout, userName, userEmail, initials, isOpen, onClose }) => {
  const [openSubMenus, setOpenSubMenus] = useState({});
  const userRole = localStorage.getItem('userRole') || 'admin';

  const filteredLinks = links.map(link => {
    if (link.isSubmenu && link.children) {
      return {
        ...link,
        children: link.children.filter(child => {
          const path = (child.path || '').toLowerCase();
          const label = (child.label || '').toLowerCase();
          if (path.includes('live-lecture') || label.includes('live lecture')) return hasSubscriptionFeature('live-lectures');
          if (path.includes('recorded-lecture') || label.includes('recorded lecture')) return hasSubscriptionFeature('recorded-lectures');
          if (path.includes('bus-tracking') || label.includes('bus tracking') || path.includes('bus-tracker') || label.includes('track bus')) return hasSubscriptionFeature('bus-tracking');
          return true;
        })
      };
    }
    return link;
  }).filter(link => {
    const path = (link.path || '').toLowerCase();
    const label = (link.label || '').toLowerCase();
    if (path.includes('live-lecture') || label.includes('live lecture')) return hasSubscriptionFeature('live-lectures');
    if (path.includes('recorded-lecture') || label.includes('recorded lecture')) return hasSubscriptionFeature('recorded-lectures');
    if (path.includes('bus-tracking') || label.includes('bus tracking') || path.includes('bus-tracker') || label.includes('track bus')) return hasSubscriptionFeature('bus-tracking');
    if (link.isSubmenu && (!link.children || link.children.length === 0)) return false;
    return true;
  });

  const visibleLinks = filteredLinks.filter(l => {
    const p = (l.path || '').toLowerCase();
    return p !== '/logout' && p !== '/home';
  });

  const adjustPath = (path) => {
    if (!path) return '';
    return path.replace('/admin', `/${userRole}`);
  };

  const toggleSubMenu = (label) => {
    setOpenSubMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const renderLink = (link) => {
    if (link.isSubmenu) {
      const isOpenSub = openSubMenus[link.label];
      const adjustedChildren = link.children.map(child => ({ ...child, path: adjustPath(child.path) }));

      return (
        <li key={link.label} className="space-y-1">
          <button
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left font-bold text-[#C0C0C0] hover:text-white transition-all hover:bg-[#FFC629]/15 group cursor-pointer border border-transparent hover:border-[#FFC629]/30"
            onClick={() => toggleSubMenu(link.label)}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#161616] text-[#A0A0A0] border border-[#222222] group-hover:text-white group-hover:bg-[#222222] group-hover:border-[#333333] transition shrink-0">
                <link.icon className="text-lg transition" />
              </span>
              <span className="text-[0.9rem] font-bold truncate tracking-wide text-[#C0C0C0] group-hover:text-white">{link.label}</span>
            </div>
            <span className="shrink-0 ml-2 text-[#A0A0A0] group-hover:text-[#FFC629]">
              {isOpenSub ? <BiChevronDown className="text-lg" /> : <BiChevronRight className="text-lg" />}
            </span>
          </button>

          <ul className={`overflow-hidden transition-all duration-200 pl-4 space-y-1.5 ${isOpenSub ? 'max-h-[1000px] opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
            {adjustedChildren.map((child) => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-[#FFC629]/25 text-[#FFC629] font-extrabold border border-[#FFC629]/50 shadow-sm shadow-[#FFC629]/20'
                        : 'text-[#FFD358] hover:bg-[#FFC629]/15 hover:text-[#FFE066]'
                    }`
                  }
                  onClick={handleLinkClick}
                >
                  <span className="truncate">{child.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
      );
    }

    const path = adjustPath(link.path);
    return (
      <li key={path}>
        <NavLink
          to={path}
          className={({ isActive }) =>
            `flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-200 group ${
              isActive
                ? 'bg-gradient-to-r from-[#FFC629]/25 via-[#FFC629]/15 to-transparent text-[#FFC629] border border-[#FFC629]/50 shadow-md shadow-[#FFC629]/20 font-extrabold'
                : 'text-[#C0C0C0] hover:bg-[#FFC629]/15 hover:text-[#FFE066] border border-transparent hover:border-[#FFC629]/30'
            }`
          }
          onClick={handleLinkClick}
        >
          {({ isActive }) => (
            <>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
                isActive
                  ? 'bg-[#262626] text-white border border-[#3A3A3A] shadow-sm'
                  : 'bg-[#161616] text-[#A0A0A0] border border-[#222222] group-hover:text-white group-hover:bg-[#222222] group-hover:border-[#333333]'
              }`}>
                <link.icon className="text-lg transition" />
              </span>
              <span className={`text-[0.9rem] font-bold truncate tracking-wide ${isActive ? 'text-[#FFC629]' : 'text-[#C0C0C0] group-hover:text-[#FFE066]'}`}>{link.label}</span>
            </>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[950] bg-black/70 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel — Modern Floating Island with Visibly Curved Borders */}
      <aside
        className={`fixed left-2.5 top-2.5 bottom-2.5 z-[1000] flex flex-col h-[calc(100dvh-1.25rem)] w-[270px] max-w-[85vw] bg-[#0A0A0A] border border-[#2E2E2E] rounded-3xl overflow-hidden shadow-2xl shadow-black/60 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── Brand Header (Aligned cleanly with top navbar h-20 / 80px) ── */}
        <div className="relative h-20 flex items-center justify-between px-4 border-b border-[#1E1E1E] shrink-0 bg-[#0E0E0E]">
          <Link
            to={adjustPath('/admin/dashboard')}
            className="flex items-center justify-center w-full min-w-0 transition-transform duration-200 group"
            aria-label="आयुष्याची फोटोग्राफी"
          >
            <BrandLogo
              size="navbar"
              className="max-h-12 w-auto group-hover:scale-105 transition-all duration-200"
              animated={false}
              hoverEffect={true}
            />
          </Link>
          <button
            className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#FFC629] hover:text-white rounded-lg hover:bg-[#1E1E1E] transition shrink-0"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <BiX size={20} />
          </button>
        </div>

        {/* ── Navigation (Solid Space between menu items: "khula khula") ── */}
        <nav className="flex-1 overflow-y-auto py-6 px-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A2A2A transparent' }}>
          <ul className="space-y-3">
            {visibleLinks.map(renderLink)}
          </ul>
        </nav>

        {/* ── User Footer ── */}
        <div className="shrink-0 px-4 py-4 border-t border-[#1E1E1E] bg-[#0E0E0E]">
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#141414] border border-[#2A2A2A] mb-3 shadow-inner">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FFC629] to-[#E0AC1B] rounded-full flex items-center justify-center text-black font-extrabold text-sm shrink-0 shadow-md shadow-[#FFC629]/25">
              {initials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-[#FFC629] truncate">{userName || 'User'}</div>
              <div className="text-xs text-[#F5E6BE] truncate font-medium">{(userEmail || 'user@example.com').toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#141414] hover:bg-red-950/60 text-[#FFC629] hover:text-red-400 border border-[#2A2A2A] hover:border-red-900/50 rounded-2xl font-extrabold text-xs transition cursor-pointer"
          >
            <BiLogOutCircle className="text-base" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
