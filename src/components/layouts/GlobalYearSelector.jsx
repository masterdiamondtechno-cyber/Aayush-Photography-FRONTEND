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
    <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl transition">
      <BiCalendar className="text-indigo-600 text-base sm:text-lg shrink-0" />
      <span className="hidden md:inline text-xs font-semibold text-slate-500 whitespace-nowrap">Academic Year:</span>
      <select 
        value={selectedAcademicYear?.academicYearId || ''} 
        onChange={handleChange}
        disabled={loading}
        className="bg-transparent border-none outline-none font-bold text-xs sm:text-sm text-indigo-600 cursor-pointer pr-1"
      >
        {availableYears.map(year => (
          <option key={year.academicYearId} value={year.academicYearId} className="text-slate-800 font-medium">
            {year.yearName} {year.isCurrent ? (isMobile ? '•' : '(Active)') : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GlobalYearSelector;
