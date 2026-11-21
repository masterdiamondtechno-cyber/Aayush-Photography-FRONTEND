import { useEffect, useState } from 'react';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { getAllAcademicYears } from '../../api/api';
import { getAuthValue } from '../../utils/auth';
import { BiCalendar } from 'react-icons/bi';

const GlobalYearSelector = () => {
  const { 
    selectedAcademicYear, 
    setSelectedAcademicYear, 
    availableYears, 
    setAvailableYears,
    setActiveAcademicYear
  } = useAcademicYearStore();

  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      const schoolId = getAuthValue('schoolId');
      if (!schoolId) return;

      setLoading(true);
      try {
        const response = await getAllAcademicYears({ schoolId: parseInt(schoolId) });
        if (response && response.status === 'SUCCESS' && Array.isArray(response.data)) {
          setAvailableYears(response.data);
          
          // Find if there is a current year and set it as active if store is empty
          const currentYear = response.data.find(y => y.isCurrent);
          if (currentYear) {
            setActiveAcademicYear(currentYear);
          }
        }
      } catch (error) {
        console.error('Failed to fetch academic years for global selector:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, [setAvailableYears, setActiveAcademicYear]);

  const handleChange = (e) => {
    const yearId = parseInt(e.target.value);
    const selected = availableYears.find(y => y.academicYearId === yearId);
    if (selected) {
      setSelectedAcademicYear(selected);
      
      // Auto-refresh the page to cleanly reload all modules with the new year context
      console.log('🔄 Academic Year changed to:', selected.yearName, '- Reloading...');
      window.location.reload();
    }
  };

  if (availableYears.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FFC629]/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-md transition shrink-0 max-w-[155px] sm:max-w-none">
      <BiCalendar className="text-[#FFC629] text-base sm:text-lg shrink-0" />
      <span className="hidden md:inline text-xs font-extrabold text-[#FFC629] uppercase tracking-wider whitespace-nowrap">Academic Year:</span>
      <select 
        value={selectedAcademicYear?.academicYearId || ''} 
        onChange={handleChange}
        disabled={loading}
        className="bg-transparent border-none outline-none font-extrabold text-xs text-white cursor-pointer truncate max-w-[105px] sm:max-w-none"
        aria-label="Select Academic Year"
      >
        {availableYears.map(year => (
          <option key={year.academicYearId} value={year.academicYearId} className="bg-[#141414] text-[#FFC629] font-bold">
            {year.yearName} {year.isCurrent ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GlobalYearSelector;
