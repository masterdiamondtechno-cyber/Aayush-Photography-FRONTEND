import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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

const PublicLayoutInner = () => {
  const location = useLocation();
  const authPages = ['/login', '/signup', '/forgot-password', '/student/change-password', '/change-first-password'];
  const isAuthPage = authPages.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <ScrollToTop />
      {isAuthPage ? (
        <div className="auth-viewport-wrapper">
          <Outlet />
        </div>
      ) : (
        <div className="site-app min-h-screen bg-[#090909] text-white flex flex-col">
          {/* Main Page Viewport — Full Width without navbar or sidebar */}
          <main className="main-viewport flex-1 w-full min-w-0">
            <Outlet />
          </main>

          {/* Footer */}
          <Footer />
        </div>
      )}
    </>
  );
};

/**
 * PublicLayout component for आयुष्याची फोटोग्राफी
 * Renders page content at full width without navbar or sidebar.
 */
const PublicLayout = () => {
  return (
    <LanguageProvider>
      <PublicLayoutInner />
    </LanguageProvider>
  );
};

export default PublicLayout;