import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const StudentSearchContext = createContext({ searchQuery: '', setSearchQuery: () => {} });

/**
 * Provider: wraps the student layout so every child page can read `searchQuery`.
 * The query resets automatically when the user navigates to a different page.
 */
export const StudentSearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Clear search when navigating to a different page
  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname]);

  return (
    <StudentSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </StudentSearchContext.Provider>
  );
};

/** Hook for child pages to read the current search query */
export const useStudentSearch = () => useContext(StudentSearchContext);
