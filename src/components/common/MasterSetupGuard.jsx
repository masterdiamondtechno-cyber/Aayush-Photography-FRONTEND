import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthValue } from "../../utils/auth";
import { getMasterSetupStatus } from "../../api/api";
import { BiLockAlt, BiArrowBack, BiRefresh } from "react-icons/bi";

// Global cache to avoid double calling on page transitions
let cachedStatus = null;
let lastFetchedTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export const getCachedMasterStatus = async (schoolId, academicYearId, force = false) => {
  const now = Date.now();
  if (cachedStatus && (now - lastFetchedTime < CACHE_TTL) && !force) {
    return cachedStatus;
  }
  try {
    const res = await getMasterSetupStatus({ schoolId, academicYearId });
    if (res && res.code === 200 && res.data) {
      cachedStatus = res.data;
      lastFetchedTime = now;
      return cachedStatus;
    }
  } catch (err) {
    console.error("Error fetching master setup status in guard:", err);
  }
  return cachedStatus;
};

const MasterSetupGuard = ({ step, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(cachedStatus === null);
  const [isLocked, setIsLocked] = useState(false);
  const [prereqName, setPrereqName] = useState("");
  const [error, setError] = useState(null);

  const schoolId = parseInt(getAuthValue("schoolId")) || null;
  const academicYearId = parseInt(getAuthValue("academicYearId")) || null;

  const verifyDependency = async (force = false) => {
    if (!schoolId) {
      setError("No active school context found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const data = await getCachedMasterStatus(schoolId, academicYearId, force);
      if (!data) {
        // If API fails, allow entry as a fail-safe so admin is never locked out of ERP
        setIsLocked(false);
        setLoading(false);
        return;
      }

      // Check step status
      let locked = false;
      let prereq = "";

      const step1_comp = data.step1_academicYear?.completed;
      const step2_comp = data.step2_classes?.completed;
      const step3_comp = data.step3_sections?.completed;
      const step4_comp = data.step4_subjects?.completed;
      const step5_comp = data.step5_teachers?.completed;
      const step6_comp = data.step6_teacherMappings?.completed;
      const step7_comp = data.step7_students?.completed;
      const step8_comp = data.step8_studentAllocations?.completed;

      switch (step) {
        case 2: // Classes
          locked = !step1_comp;
          prereq = "Academic Year";
          break;
        case 3: // Sections
          locked = !step2_comp;
          prereq = "Classes / Standards";
          break;
        case 4: // Subjects
          locked = !step3_comp;
          prereq = "Sections / Divisions";
          break;
        case 5: // Teachers
          locked = !step4_comp;
          prereq = "Subjects";
          break;
        case 6: // Mappings
          locked = !step5_comp;
          prereq = "Teachers";
          break;
        case 7: // Students
          locked = !step3_comp;
          prereq = "Sections / Divisions";
          break;
        case 8: // Student allocations
          locked = !step7_comp;
          prereq = "Students";
          break;
        case 9: // Timetable
          locked = !step6_comp;
          prereq = "Teacher-Class-Subject Mapping";
          break;
        case 10: // Attendance
          locked = !step8_comp;
          prereq = "Student Academic Mapping";
          break;
        case 11: // Exams
          locked = !step4_comp;
          prereq = "Subjects";
          break;
        case 12: // Fees
          locked = !step8_comp;
          prereq = "Student Academic Mapping";
          break;
        default:
          locked = false;
      }

      setIsLocked(locked);
      setPrereqName(prereq);
    } catch (err) {
      console.error("Guard validation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyDependency();
  }, [step, schoolId, academicYearId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2A2A2A] border-t-[#FFC629]" />
        <p className="text-sm font-medium text-[#FFC629]">Verifying setup status...</p>
      </div>
    );
  }

  if (isLocked) {
    const isSchool = location.pathname.startsWith("/school");
    const baseRoute = isSchool ? "/school" : "/admin";
    const setupTarget = prereqName === "Academic Year" 
      ? `${baseRoute}/settings?tab=academic&action=add` 
      : `${baseRoute}/master-menu`;

    return (
      <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center p-4 sm:p-8">
        <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-[#2A2A2A] bg-[#141414] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="flex h-18 w-18 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 shadow-[0_0_0_8px_rgba(255,198,41,0.1)]">
            <BiLockAlt className="text-4xl text-[#FFC629]" />
          </div>
          <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-[#FFC629]">Step Locked</h2>
          <p className="text-sm leading-6 text-[#A0A0A0]">
            This module requires sequential configuration before it can be used.
          </p>
          
          <div className="flex w-full flex-col gap-1 rounded-2xl border border-[#2A2A2A] bg-[#1C1C1C] p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">Missing Prerequisite:</span>
            <span className="text-lg font-bold text-[#FFC629]">{prereqName}</span>
          </div>

          <p className="text-sm leading-6 text-[#C0C0C0]">
            Please configure and activate <strong className="text-white">{prereqName}</strong> first to unlock this section.
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button 
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] px-5 py-3.5 font-extrabold text-black transition hover:brightness-110 shadow-lg shadow-[#FFC629]/20" 
              onClick={() => navigate(setupTarget)}
            >
              <BiArrowBack /> Configure {prereqName}
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] px-4 py-3.5 font-semibold text-[#CCCCCC] transition hover:text-white hover:bg-[#252525]" 
              onClick={() => verifyDependency(true)}
            >
              <BiRefresh /> Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default MasterSetupGuard;
