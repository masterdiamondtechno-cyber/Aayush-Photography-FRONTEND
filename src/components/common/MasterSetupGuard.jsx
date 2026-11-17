import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Verifying configuration status and dependencies...</p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.03),transparent_40%)] p-4 sm:p-8">
        <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-slate-200/80 bg-white/85 p-8 text-center shadow-xl backdrop-blur-xl sm:p-12">
          <div className="flex h-18 w-18 items-center justify-center rounded-full border border-red-200 bg-red-50 shadow-[0_0_0_8px_rgba(254,226,226,0.4)]">
            <BiLockAlt className="text-4xl text-red-500" />
          </div>
          <h2 className="font-['Lexend'] text-3xl font-extrabold text-slate-900">Step Locked</h2>
          <p className="text-sm leading-6 text-slate-500">
            This module is currently locked because your school data is not configured sequentially.
          </p>
          
          <div className="flex w-full flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Missing Prerequisite:</span>
            <span className="text-lg font-bold text-indigo-600">{prereqName}</span>
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Please configure and save active records for <strong>{prereqName}</strong> first to unlock this screen.
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-white px-5 py-3.5 font-semibold text-indigo-600 transition hover:bg-indigo-50" onClick={() => navigate(location.pathname.startsWith("/school") ? "/school/master-menu" : "/admin/master-menu")}>
              <BiArrowBack /> Setup Orchestrator
            </button>
            <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700" onClick={() => verifyDependency(true)}>
              <BiRefresh /> Retry Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default MasterSetupGuard;
