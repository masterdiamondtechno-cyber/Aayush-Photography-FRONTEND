import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthValue } from "../../utils/auth";
import { getMasterSetupStatus, createAcademicYear, activateAcademicYear } from "../../api/api";
import { useAcademicYearStore } from "../../store/academicYearStore";
import { 
  BiCalendar, 
  BiBuilding, 
  BiGridAlt, 
  BiBookOpen, 
  BiUser, 
  BiLink, 
  BiGroup, 
  BiUserCheck, 
  BiTable, 
  BiCalendarCheck, 
  BiAward, 
  BiWallet,
  BiLockAlt,
  BiCheckCircle,
  BiPlayCircle,
  BiRefresh
} from "react-icons/bi";


const MasterMenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { setActiveAcademicYear, setSelectedAcademicYear } = useAcademicYearStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState({
    steps: [],
    completedSteps: 0,
    totalSteps: 12,
    progressPercent: 0
  });

  // Modal States for inline Academic Year creation
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearFormData, setYearFormData] = useState({
    startDate: "",
    endDate: "",
    status: "ACTIVE"
  });
  const [savingYear, setSavingYear] = useState(false);
  const [yearSuccessMsg, setYearSuccessMsg] = useState("");

  // Dynamically resolve base route (admin vs school)
  const isSchoolRoute = location.pathname.startsWith("/school");
  const baseRoute = isSchoolRoute ? "/school" : "/admin";

  const schoolId = parseInt(getAuthValue("schoolId")) || null;
  const academicYearId = parseInt(getAuthValue("academicYearId")) || null;

  // Detect first-time setup: no academic year has been configured yet
  const isNewSetup = !academicYearId;

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!schoolId) {
        throw new Error("No school context found. Please log in as a School Admin.");
      }

      const res = await getMasterSetupStatus({ schoolId, academicYearId });
      if (res && res.code === 200 && res.data) {
        const raw = res.data;
        
        const step1_comp = raw.step1_academicYear?.completed;
        const step2_comp = raw.step2_classes?.completed;
        const step3_comp = raw.step3_sections?.completed;
        const step4_comp = raw.step4_subjects?.completed;
        const step5_comp = raw.step5_teachers?.completed;
        const step6_comp = raw.step6_teacherMappings?.completed;
        const step7_comp = raw.step7_students?.completed;
        const step8_comp = raw.step8_studentAllocations?.completed;

        const steps = [
          {
            stepNumber: 1,
            name: "Academic Year",
            count: raw.step1_academicYear?.count || 0,
            prerequisite: null,
            description: "Create active academic years for school calendars.",
            status: step1_comp ? "COMPLETED" : "READY",
            route: "/settings?tab=academic&action=add"
          },
          {
            stepNumber: 2,
            name: "Classes / Standards",
            count: raw.step2_classes?.count || 0,
            prerequisite: "Academic Year",
            description: "Configure the distinct grade standards (e.g. Class 1 - 10).",
            status: step1_comp ? (step2_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/classes"
          },
          {
            stepNumber: 3,
            name: "Sections / Divisions",
            count: raw.step3_sections?.count || 0,
            prerequisite: "Classes / Standards",
            description: "Add standard divisions (e.g. Section A, B, C) for your classes.",
            status: step2_comp ? (step3_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/classes"
          },
          {
            stepNumber: 4,
            name: "Subjects",
            count: raw.step4_subjects?.count || 0,
            prerequisite: "Sections / Divisions",
            description: "Establish the standard curriculum and subjects for standard divisions.",
            status: step3_comp ? (step4_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/subjects"
          },
          {
            stepNumber: 5,
            name: "Teachers",
            count: raw.step5_teachers?.count || 0,
            prerequisite: "Subjects",
            description: "Onboard and register the teaching faculty profiles.",
            status: step4_comp ? (step5_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/teachers"
          },
          {
            stepNumber: 6,
            name: "Teacher-Class-Subject Mapping",
            count: raw.step6_teacherMappings?.mappedTeachersCount || raw.step6_teacherMappings?.timetableSlotsCount || 0,
            prerequisite: "Teachers",
            description: "Map specialized teachers to their respective classes and subjects.",
            status: step5_comp ? (step6_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/subjects"
          },
          {
            stepNumber: 7,
            name: "Students",
            count: raw.step7_students?.count || 0,
            prerequisite: "Sections / Divisions",
            description: "Admit and register student details inside the global roster.",
            status: step3_comp ? (step7_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/students"
          },
          {
            stepNumber: 8,
            name: "Student Academic Mapping",
            count: raw.step8_studentAllocations?.count || 0,
            prerequisite: "Students",
            description: "Promote or enroll students into standard divisions for the active year.",
            status: step7_comp ? (step8_comp ? "COMPLETED" : "READY") : "LOCKED",
            route: "/students"
          },
          {
            stepNumber: 9,
            name: "Timetable",
            count: raw.step6_teacherMappings?.timetableSlotsCount || 0,
            prerequisite: "Teacher-Class-Subject Mapping",
            description: "Build and configure dynamic class timetables.",
            status: step6_comp ? "READY" : "LOCKED",
            route: "/timetable"
          },
          {
            stepNumber: 10,
            name: "Attendance",
            count: 0,
            prerequisite: "Student Academic Mapping",
            description: "Record and track daily or lecture-wise student attendance.",
            status: step8_comp ? "READY" : "LOCKED",
            route: "/attendance"
          },
          {
            stepNumber: 11,
            name: "Exams",
            count: 0,
            prerequisite: "Subjects",
            description: "Schedule exam terms and grading structures.",
            status: step4_comp ? "READY" : "LOCKED",
            route: "/exam-center"
          },
          {
            stepNumber: 12,
            name: "Fees",
            count: 0,
            prerequisite: "Student Academic Mapping",
            description: "Establish structured tuition fee and collection plans.",
            status: step8_comp ? "READY" : "LOCKED",
            route: "/fee-collection"
          }
        ];

        const completedSteps = steps.filter(s => s.status === "COMPLETED").length;
        const totalSteps = 12;
        const progressPercent = Math.round((completedSteps / totalSteps) * 100);

        setSetupData({
          steps,
          completedSteps,
          totalSteps,
          progressPercent
        });
      } else {
        throw new Error(res?.message || "Failed to fetch master data setup status.");
      }
    } catch (err) {
      console.error("Error fetching master setup status:", err);
      setError(err.message || "Something went wrong.");
      generateFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => {
    // Elegant client-side fallback list in case backend is offline
    const fallbackSteps = [
      { stepNumber: 1, name: "Academic Year", count: academicYearId ? 1 : 0, prerequisite: null, description: "Create active academic years for school calendars.", status: academicYearId ? "COMPLETED" : "READY", route: "/settings?tab=academic&action=add" },
      { stepNumber: 2, name: "Classes / Standards", count: 0, prerequisite: "Academic Year", description: "Configure the distinct grade standards (e.g. Class 1 - 10).", status: academicYearId ? "READY" : "LOCKED", route: "/classes" },
      { stepNumber: 3, name: "Sections / Divisions", count: 0, prerequisite: "Classes / Standards", description: "Add standard divisions (e.g. Section A, B, C) for your classes.", status: "LOCKED", route: "/classes" },
      { stepNumber: 4, name: "Subjects", count: 0, prerequisite: "Sections / Divisions", description: "Establish the standard curriculum and subjects for standard divisions.", status: "LOCKED", route: "/subjects" },
      { stepNumber: 5, name: "Teachers", count: 0, prerequisite: "Subjects", description: "Onboard and register the teaching faculty profiles.", status: "LOCKED", route: "/teachers" },
      { stepNumber: 6, name: "Teacher-Class-Subject Mapping", count: 0, prerequisite: "Teachers", description: "Map specialized teachers to their respective classes and subjects.", status: "LOCKED", route: "/subjects" },
      { stepNumber: 7, name: "Students", count: 0, prerequisite: "Sections / Divisions", description: "Admit and register student details inside the global roster.", status: "LOCKED", route: "/students" },
      { stepNumber: 8, name: "Student Academic Mapping", count: 0, prerequisite: "Students", description: "Promote or enroll students into standard divisions for the active year.", status: "LOCKED", route: "/students" },
      { stepNumber: 9, name: "Timetable", count: 0, prerequisite: "Teacher-Class-Subject Mapping", description: "Build and configure dynamic class timetables.", status: "LOCKED", route: "/timetable" },
      { stepNumber: 10, name: "Attendance", count: 0, prerequisite: "Student Academic Mapping", description: "Record and track daily or lecture-wise student attendance.", status: "LOCKED", route: "/attendance" },
      { stepNumber: 11, name: "Exams", count: 0, prerequisite: "Subjects", description: "Schedule exam terms and grading structures.", status: "LOCKED", route: "/exam-center" },
      { stepNumber: 12, name: "Fees", count: 0, prerequisite: "Student Academic Mapping", description: "Establish structured tuition fee and collection plans.", status: "LOCKED", route: "/fee-collection" }
    ];

    setSetupData({
      steps: fallbackSteps,
      completedSteps: academicYearId ? 1 : 0,
      totalSteps: 12,
      progressPercent: academicYearId ? 8 : 0
    });
  };

  useEffect(() => {
    fetchStatus();
  }, [schoolId, academicYearId]);

  // Icon selector helper
  const getStepIcon = (stepNumber) => {
    switch (stepNumber) {
      case 1: return <BiCalendar className="step-card-icon" />;
      case 2: return <BiBuilding className="step-card-icon" />;
      case 3: return <BiGridAlt className="step-card-icon" />;
      case 4: return <BiBookOpen className="step-card-icon" />;
      case 5: return <BiUser className="step-card-icon" />;
      case 6: return <BiLink className="step-card-icon" />;
      case 7: return <BiGroup className="step-card-icon" />;
      case 8: return <BiUserCheck className="step-card-icon" />;
      case 9: return <BiTable className="step-card-icon" />;
      case 10: return <BiCalendarCheck className="step-card-icon" />;
      case 11: return <BiAward className="step-card-icon" />;
      case 12: return <BiWallet className="step-card-icon" />;
      default: return <BiGridAlt className="step-card-icon" />;
    }
  };

  // Route resolver helper
  const getStepRoute = (stepNumber) => {
    switch (stepNumber) {
      case 1: return `${baseRoute}/settings?tab=academic&action=add`;
      case 2: return `${baseRoute}/classes`;
      case 3: return `${baseRoute}/classes`;
      case 4: return `${baseRoute}/subjects`;
      case 5: return `${baseRoute}/teachers`;
      case 6: return `${baseRoute}/subjects`;
      case 7: return `${baseRoute}/students`;
      case 8: return `${baseRoute}/students`;
      case 9: return `${baseRoute}/timetable`;
      case 10: return `${baseRoute}/attendance`;
      case 11: return `${baseRoute}/exam-center`;
      case 12: return `${baseRoute}/fee-collection`;
      default: return `${baseRoute}/dashboard`;
    }
  };

  const handleNavigate = (step) => {
    if (step.status === "LOCKED") return;
    if (step.stepNumber === 1 && step.status === "READY") {
      setYearFormData({
        startDate: "",
        endDate: "",
        status: "ACTIVE"
      });
      setYearSuccessMsg("");
      setShowYearModal(true);
      return;
    }
    navigate(getStepRoute(step.stepNumber));
  };

  const handleSaveYear = async (e) => {
    e.preventDefault();
    if (!yearFormData.startDate || !yearFormData.endDate) {
      alert("All fields are required");
      return;
    }
    setSavingYear(true);
    setYearSuccessMsg("");
    try {
      const payload = {
        schoolId,
        ...yearFormData,
        yearName: `${yearFormData.startDate.slice(0, 4)}-${yearFormData.endDate.slice(0, 4)}`
      };
      const response = await createAcademicYear(payload);
      if (response && response.status === "SUCCESS") {
        const newYear = response.data;
        const newYearId = newYear.academicYearId;

        // Auto-activate the newly created academic year only if set to ACTIVE
        if (yearFormData.status === "ACTIVE") {
          const actResponse = await activateAcademicYear({ schoolId, academicYearId: newYearId });
          if (actResponse && actResponse.status === "SUCCESS") {
            // Update Zustand store
            setActiveAcademicYear(newYear);
            setSelectedAcademicYear(newYear);

            // Update localStorage session values
            localStorage.setItem("academicYearId", JSON.stringify(newYearId));
            sessionStorage.setItem("academicYearId", JSON.stringify(newYearId));
          }
          setYearSuccessMsg("Academic Year created and activated successfully! Updating setup flow...");
        } else {
          setYearSuccessMsg("Academic Year created successfully! Updating setup flow...");
        }

        setTimeout(() => {
          setShowYearModal(false);
          fetchStatus();
          // Reload the page to refresh context for all routes
          window.location.reload();
        }, 1500);
      } else {
        alert(response.message || "Failed to create Academic Year");
      }
    } catch (error) {
      console.error("Failed to create academic year inline:", error);
      alert(error.message || "Operation failed");
    } finally {
      setSavingYear(false);
    }
  };

  return (
    <div className="master-setup-container space-y-8">
      {isNewSetup && (
        <div className="mm-welcome-hero">
          <div className="mm-welcome-hero-bg" />
          <div className="mm-welcome-content">
            <div className="mm-welcome-badge">🎉 Welcome to Master Diamond!</div>
            <h2 className="mm-welcome-title">
              Let's set up your school in <span className="mm-welcome-highlight">12 easy steps</span>
            </h2>
            <p className="mm-welcome-sub">
              This wizard walks you through creating your academic year, classes, teachers, students and more.
              Each step unlocks the next — follow the sequence to configure your institution completely.
            </p>
            <div className="mm-welcome-chips">
              <span className="mm-chip mm-chip-blue">📅 Academic Year</span>
              <span className="mm-chip mm-chip-green">🏫 Classes &amp; Sections</span>
              <span className="mm-chip mm-chip-purple">👨‍🏫 Teachers</span>
              <span className="mm-chip mm-chip-orange">👨‍🎓 Students</span>
              <span className="mm-chip mm-chip-pink">📝 Exams &amp; Fees</span>
            </div>
          </div>
        </div>
      )}

      <div className="master-setup-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="header-text min-w-0 space-y-2">
          <h1 className="font-['Cinzel'] text-2xl font-extrabold tracking-tight text-[#FFC629] sm:text-3xl">Master Data Setup & Entity Flow</h1>
          <p className="max-w-2xl text-sm text-[#F5E6BE] font-medium">
            Configure your institute's master databases sequentially. To protect data integrity and 
            prevent orphan records, each configuration step is unlocked only when its prerequisites 
            are fully set up.
          </p>
        </div>
        <button
          className="refresh-btn"
          onClick={fetchStatus}
          disabled={loading}
        >
          <BiRefresh className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Progress & Summary Bar */}
      <div className="master-setup-progress-card">
        <div className="progress-info">
          <div className="stat-item">
            <span className="stat-label">Setup Status</span>
            <span className="stat-val">{setupData.completedSteps} / {setupData.totalSteps} Completed</span>
          </div>
          <div className="stat-item percent-item">
            <span className="stat-label">Progress</span>
            <span className="stat-val percent-val">{setupData.progressPercent}%</span>
          </div>
        </div>
        <div className="progress-bar-wrapper">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${setupData.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid of Steps */}
      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
          <p>Analyzing database entity dependency hierarchy...</p>
        </div>
      ) : error && setupData.steps.length === 0 ? (
        <div className="error-wrapper">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStatus}>Retry Connection</button>
        </div>
      ) : (
        <div className="steps-grid">
          {setupData.steps.map((step) => {
            const isLocked = step.status === "LOCKED";
            const isCompleted = step.status === "COMPLETED";
            const isReady = step.status === "READY";

            let statusClass = "locked";
            let statusIcon = <BiLockAlt />;
            let statusText = "Locked";

            if (isCompleted) {
              statusClass = "completed";
              statusIcon = <BiCheckCircle />;
              statusText = "Completed";
            } else if (isReady) {
              statusClass = "ready";
              statusIcon = <BiPlayCircle />;
              statusText = "Ready to Setup";
            }

            return (
              <div 
                key={step.stepNumber} 
                className={`step-card border-status-${statusClass} ${isLocked ? "card-locked" : "card-active"}`}
                onClick={() => handleNavigate(step)}
              >
                <div className="step-card-header">
                  <span className="step-badge">Step {step.stepNumber}</span>
                  <span className={`status-badge badge-${statusClass}`}>
                    {statusIcon} {statusText}
                  </span>
                </div>

                <div className="step-card-body">
                  <div className="step-icon-wrapper">
                    {getStepIcon(step.stepNumber)}
                  </div>
                  <h3 className="step-title">{step.name}</h3>
                  <p className="step-desc">{step.description}</p>
                  
                  {step.count > 0 && (
                    <div className="count-badge">
                      Active Records: <strong>{step.count}</strong>
                    </div>
                  )}

                  {isLocked && step.prerequisite && (
                    <div className="prereq-warning">
                      <span>Prerequisite:</span> {step.prerequisite}
                    </div>
                  )}
                </div>

                <div className="step-card-footer">
                  {isLocked ? (
                    <button className="action-btn btn-locked" disabled>
                      <BiLockAlt /> Locked
                    </button>
                  ) : isCompleted ? (
                    <button className="action-btn btn-completed">
                      Manage Module &rarr;
                    </button>
                  ) : (
                    <button className="action-btn btn-ready w-full bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black font-extrabold border border-[#FFC629] shadow-lg shadow-[#FFC629]/25 hover:brightness-110">
                      Configure &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Premium Inline Academic Year Setup Modal */}
      {showYearModal && createPortal(
        <div className="premium-modal-overlay">
          <div className="premium-modal-card fade-in">
            <div className="modal-header-gradient">
              <h3 className="modal-header-title">
                <BiCalendar className="modal-header-icon" />
                Initiate Academic Year
              </h3>
              <p className="modal-header-subtitle">
                Set up a new active year calendar for your institution to begin data configurations.
              </p>
            </div>
            
            {yearSuccessMsg && (
              <div className="toast-success-banner" >
                <BiCheckCircle className="toast-icon" />
                <span>{yearSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveYear} className="premium-styled-form" >
              <div className="modal-form-body">
                <div className="modal-grid">
                  <div className="form-item-wrapper">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      value={yearFormData.startDate}
                      onChange={(e) => setYearFormData({ ...yearFormData, startDate: e.target.value })}
                      required 
                      disabled={savingYear}
                    />
                  </div>
                  <div className="form-item-wrapper">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      value={yearFormData.endDate}
                      onChange={(e) => setYearFormData({ ...yearFormData, endDate: e.target.value })}
                      required 
                      disabled={savingYear}
                    />
                  </div>
                </div>
                <div className="form-item-wrapper" style={{ marginTop: "1rem" }}>
                  <label>Status</label>
                  <select 
                    value={yearFormData.status}
                    onChange={(e) => setYearFormData({ ...yearFormData, status: e.target.value })}
                    required
                    disabled={savingYear}
                    className="premium-select"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-action-row" style={{ marginTop: "2rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowYearModal(false)} 
                  className="premium-btn btn-outline"
                  disabled={savingYear}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="premium-btn btn-glowing-primary"
                  disabled={savingYear}
                >
                  {savingYear ? "Launching..." : "Launch Term"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MasterMenuPage;
