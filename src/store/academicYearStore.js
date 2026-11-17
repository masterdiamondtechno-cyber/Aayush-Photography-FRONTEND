import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthValue } from '../utils/auth';

export const useAcademicYearStore = create(
  persist(
    (set, get) => ({
      activeAcademicYear: null, // The DB's actual active year for the school
      selectedAcademicYear: null, // The year the user is currently viewing
      availableYears: [], // List of all years for the dropdown

      setActiveAcademicYear: (year) => {
        if (year && year.academicYearId) {
          setAuthValue('academicYearId', year.academicYearId);
        }
        return set({ activeAcademicYear: year, selectedAcademicYear: year });
      },
        
      setSelectedAcademicYear: (year) => {
        if (year && year.academicYearId) {
          setAuthValue('academicYearId', year.academicYearId);
        }
        return set({ selectedAcademicYear: year });
      },
        
      setAvailableYears: (years) => 
        set({ availableYears: years }),
      
      // Resets the user's view back to the actual current year
      resetToActive: () => {
        const active = get().activeAcademicYear;
        if (active && active.academicYearId) {
          setAuthValue('academicYearId', active.academicYearId);
        }
        return set({ selectedAcademicYear: active });
      },
        
      // Useful for clearing state on logout
      clearAcademicYearState: () => {
        localStorage.removeItem('academicYearId');
        sessionStorage.removeItem('academicYearId');
        return set({ activeAcademicYear: null, selectedAcademicYear: null, availableYears: [] });
      }
    }),
    {
      name: 'academic-year-storage', // unique name for localStorage/sessionStorage
    }
  )
);
