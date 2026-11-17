import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { isAuthenticated, getDashboardURL } from '../../utils/auth';
import BrandLogo from './BrandLogo';
import { SocialMediaBar } from './SocialIcons';
import LanguageToggle from './LanguageToggle';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const location = useLocation();
  const loggedIn = isAuthenticated();
  const dashboardLink = loggedIn ? getDashboardURL() : '/login';
  const portalLabel = loggedIn 
    ? (language === 'mr' ? 'डॅशबोर्ड' : 'Dashboard') 
    : (language === 'mr' ? 'लॉगिन' : 'Login');
  const mobilePortalLabel = loggedIn 
    ? (language === 'mr' ? 'डॅशबोर्डवर जा' : 'Back to Dashboard') 
    : (language === 'mr' ? 'इन्स्टिट्यूट पोर्टल लॉगिन' : 'Institute Portal Login');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/home', label: t.nav.home },
    { to: '/about', label: t.nav.about },
    { to: '/courses', label: t.nav.courses },
    { to: '/facilities', label: t.nav.facilities },
    { to: '/gallery', label: t.nav.gallery },
    { to: '/faq', label: t.nav.faq },
    { to: '/contact', label: t.nav.contact }
  ];

  return (
    <>
      <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <Link
            to="/home"
            className="navbar-brand"
            aria-label="आयुष्याची फोटोग्राफी - Journey From Nothing To Everything"
          >
            <BrandLogo size="navbar" />
          </Link>

          <nav className="desktop-nav" aria-label="Main Navigation">
            <ul className="nav-list">
              {navLinks.map((link) => (
                <li key={link.to} className="nav-item">
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link nav-link-animated ${isActive ? 'active' : ''}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="navbar-actions">
            <SocialMediaBar size={25} className="nav-social-bar" />
            <LanguageToggle />
            <Link to="/contact" className="btn btn-primary btn-sm nav-enquire-btn">
              <span>{t.nav.enquireNow}</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to={dashboardLink}
              className="btn btn-secondary btn-sm nav-login-btn"
              title={portalLabel}
            >
              <UserCircle size={17} />
              <span className="hidden xl:inline">{portalLabel}</span>
            </Link>

            <button
              type="button"
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={26} color="#FFC629" />
              ) : (
                <Menu size={26} color="#FFFFFF" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="container mobile-menu-content">
              <div className="mobile-menu-top">
                <span className="mobile-menu-label">Menu</span>
                <LanguageToggle />
              </div>

              <div className="mobile-social-connect">
                <span className="mobile-social-heading">
                  {language === 'mr'
                    ? 'सोशल मीडिया व थेट संपर्क:'
                    : 'Direct Social Contact:'}
                </span>
                <SocialMediaBar size={28} showLabels={true} className="mobile-social-bar" />
              </div>

              <ul className="mobile-nav-list">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `mobile-nav-link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="mobile-menu-footer">
                <Link
                  to="/contact"
                  className="btn btn-primary btn-block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t.nav.enquireNow}</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to={dashboardLink}
                  className="btn btn-secondary btn-block mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserCircle size={18} />
                  <span>{mobilePortalLabel}</span>
                </Link>
                <p className="mobile-phone-hint">Direct helpline: +91 84599 12189</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
