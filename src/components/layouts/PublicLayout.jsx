import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../photography/Navbar';
import Footer from '../photography/Footer';
import { LanguageProvider } from '../../context/LanguageContext';
import '../../styles/photography.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

/**
 * PublicLayout component for आयुष्याची फोटोग्राफी
 * Wraps all public marketing pages with photography theme, navigation and footer.
 */
const PublicLayout = () => {
  const location = useLocation();
  const authPages = ['/login', '/signup', '/forgot-password', '/student/change-password', '/change-first-password'];
  const isAuthPage = authPages.some((p) => location.pathname.startsWith(p));

  return (
    <LanguageProvider>
      <ScrollToTop />
      {isAuthPage ? (
        <div className="auth-viewport-wrapper">
          <Outlet />
        </div>
      ) : (
        <div className="site-app">
          <Navbar />
          <main className="main-viewport">
            <Outlet />
          </main>
          <Footer />
        </div>
      )}
    </LanguageProvider>
  );
};

export default PublicLayout;
