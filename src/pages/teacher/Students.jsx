import React, { useState, useEffect, useMemo } from "react";
import { BiSearch, BiChevronDown, BiGroup, BiLoader } from "react-icons/bi";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import { getTeacherById, getStudentsBySection, getCurrentAcademicYear, getAllStandards } from "../../api/api";
import { getAuthValue, setAuthValue } from "../../utils/auth";


const Students = () => {
  // ── Auth values ──
  const schoolId = getAuthValue("schoolId");
  const teacherId = getAuthValue("teacherId") || getAuthValue("userId");

  // ── State ──
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classTeacherClasses, setClassTeacherClasses] = useState([]);
  const [selectedClassIndex, setSelectedClassIndex] = useState(-1);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── Derive class teacher status ──
  const isClassTeacher = classTeacherClasses.length > 0;

  const classTeacherInfo = useMemo(() => {
    if (selectedClassIndex === -1 || classTeacherClasses.length === 0) return null;
    return classTeacherClasses[selectedClassIndex];
  }, [classTeacherClasses, selectedClassIndex]);

  // ── Step 1: Fetch teacher profile and all standards on mount ──
  useEffect(() => {
    const fetchProfileAndClasses = async () => {
      setLoading(true);
      setError(null);

      let academicYearId = getAuthValue("academicYearId");

      // Recover academicYearId if missing
      if (!academicYearId && schoolId) {
        try {
          const yearRes = await getCurrentAcademicYear(schoolId);
          if (yearRes.status === "SUCCESS" && (yearRes.data?.academicYearId || yearRes.data?.id)) {
            academicYearId = yearRes.data.academicYearId || yearRes.data.id;
            setAuthValue("academicYearId", academicYearId);
          }
        } catch (e) {
          console.error("[Students] Failed to recover academic year:", e);
        }
      }

      if (!schoolId || !teacherId) {
        setError("Missing session data. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const payload = {
          schoolId,
          id: teacherId,
          academicYearId,
        };

        const res = await getTeacherById(payload);

        if (res.status === "SUCCESS" && res.data) {
          const profile = res.data;
          setTeacherProfile(profile);

          const list = [];
          // 1. Add direct profile standard & division if mapped
          if (profile.standardId && profile.divisionId) {
            list.push({
              standardId: profile.standardId,
              divisionId: profile.divisionId,
              standardName: profile.standardName || `Grade ${profile.standardId}`,
              divisionName: profile.divisionName || `Section ${profile.divisionId}`
            });
          }

          // 2. Fetch all standards to see if teacher is assigned as division class teacher
          try {
            const stdRes = await getAllStandards(schoolId, academicYearId);
            if (stdRes.status === "SUCCESS" && stdRes.data) {
              const standardsList = stdRes.data;
              standardsList.forEach(std => {
                if (std.sections && std.sections.length > 0) {
                  std.sections.forEach(sec => {
                    if (sec.classTeacherId && Number(sec.classTeacherId) === Number(teacherId)) {
                      const alreadyAdded = list.some(item => 
                        Number(item.standardId) === Number(std.standardId) && 
                        Number(item.divisionId) === Number(sec.divisionId)
                      );
                      if (!alreadyAdded) {
                        list.push({
                          standardId: std.standardId,
                          divisionId: sec.divisionId,
                          standardName: std.standard,
                          divisionName: sec.divisionName
                        });
                      }
                    }
                  });
                }
              });
            }
          } catch (stdErr) {
            console.error("[Students] Error loading standards list:", stdErr);
          }

          setClassTeacherClasses(list);
          setSelectedClassIndex(list.length > 0 ? 0 : -1);
        } else {
          setError("Could not load teacher profile.");
        }
      } catch (err) {
        console.error("[Students] Profile fetch ERROR:", err);
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          setError(`Failed to load teacher profile: ${err.response?.data?.message || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndClasses();
  }, [schoolId, teacherId]);

  // ── Step 2: Fetch students based on active class teacher class ──
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedClassIndex === -1 || classTeacherClasses.length === 0 || !classTeacherClasses[selectedClassIndex]) {
        setStudents([]);
        return;
      }

      const activeClass = classTeacherClasses[selectedClassIndex];
      const standardId = activeClass.standardId;
      const divisionId = activeClass.divisionId;

      setStudentsLoading(true);

      try {
        const academicYearId = getAuthValue("academicYearId");
        const res = await getStudentsBySection({
          schoolId,
          academicYearId,
          standardId,
          divisionId,
        });

        if (res.status === "SUCCESS") {
          setStudents(res.data || []);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error("[Students] Fetch students error:", err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [classTeacherClasses, selectedClassIndex, schoolId]);

  // ── Filtered students by search ──
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        (s.name || s.studentName || "").toLowerCase().includes(q) ||
        (s.studentId || s.id || "").toString().toLowerCase().includes(q) ||
        (s.rollNumber || "").toString().toLowerCase().includes(q) ||
        (s.aadharNumber || "").toString().toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="teacher-page-container fade-in space-y-8">
        <div className="students-loading-state">
          <div className="spinner"></div>
          <p>Loading your student data...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="teacher-page-container fade-in">
        <div className="students-error-state">
          <div className="error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render single student detail view ──
  if (selectedStudent) {
    return (
      <div className="teacher-page-container fade-in">
        <button className="btn-back-student" onClick={() => setSelectedStudent(null)}>
          <BsFillArrowLeftSquareFill />
          Back to Students
        </button>

        <div className="student-detail-card glass">
          <div className="student-detail-header">
            <div className="student-avatar-large">
              {(selectedStudent.firstName || selectedStudent.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="student-detail-info">
              <h2>{[selectedStudent.firstName, selectedStudent.middleName, selectedStudent.lastName].filter(Boolean).join(' ') || selectedStudent.name || selectedStudent.studentName}</h2>
              <p className="student-detail-id">
                ID: {selectedStudent.studentId || selectedStudent.id}
                {selectedStudent.rollNumber && ` • Roll: ${selectedStudent.rollNumber}`}
              </p>
            </div>
          </div>

          <div className="student-detail-grid">
            <div className="detail-item">
              <span className="detail-label">Class</span>
              <span className="detail-value">
                {selectedStudent.standardName || selectedStudent.standard || "-"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Section</span>
              <span className="detail-value">
                {selectedStudent.divisionName || selectedStudent.section || "-"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Gender</span>
              <span className="detail-value">
                {selectedStudent.gender || "-"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Contact</span>
              <span className="detail-value">
                {selectedStudent.contactNumber || selectedStudent.phone || selectedStudent.parentContact || selectedStudent.mobileNumber || "-"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">
                {selectedStudent.email || selectedStudent.emailId || "-"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className={`status-pill-sm ${(selectedStudent.status || "active").toLowerCase()}`}>
                {selectedStudent.status || "Active"}
              </span>
            </div>
            {selectedStudent.guardianName && (
              <div className="detail-item">
                <span className="detail-label">Guardian</span>
                <span className="detail-value">{selectedStudent.guardianName}</span>
              </div>
            )}
            {selectedStudent.address && (
              <div className="detail-item full-width">
                <span className="detail-label">Address</span>
                <span className="detail-value">{selectedStudent.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main list view ──
  return (
    <div className="teacher-page-container fade-in">
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">My Students</h1>
            
            {classTeacherClasses.length > 0 && (
              <div className="class-selector-premium" style={{ margin: 0, height: '38px', display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                <select 
                  value={selectedClassIndex} 
                  onChange={(e) => {
                    setSelectedClassIndex(Number(e.target.value));
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '0.2rem 2.2rem 0.2rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: '8px',
                    background: 'white',
                    height: '100%',
                    cursor: 'pointer',
                    outline: 'none',
                    webkitAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  {classTeacherClasses.map((item, idx) => (
                    <option key={`${item.standardId}-${item.divisionId}`} value={idx}>
                      {item.standardName} - {item.divisionName}
                    </option>
                  ))}
                </select>
                <BiChevronDown className="select-arrow" style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }} />
              </div>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.25rem' }}>
            {isClassTeacher && classTeacherInfo
              ? `Class list for ${classTeacherInfo.standardName} - ${classTeacherInfo.divisionName}`
              : "View and track your class students' information"}
          </p>
        </div>
        <div className="students-count-badge">
          <BiGroup size={18} />
          <span>{filteredStudents.length} Student{filteredStudents.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="table-controls glass">
        <div className="search-bar">
          <BiSearch />
          <input
            type="text"
            placeholder="Search students by name, ID, or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Students Table */}
      {studentsLoading ? (
        <div className="students-loading-inline">
          <div className="spinner-small"></div>
          <span>Loading students...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="students-empty-state glass">
          <div className="empty-icon">
            <BiGroup size={48} />
          </div>
          <h3>{!isClassTeacher ? "No Class Assigned" : "No Students Found"}</h3>
          <p>
            {searchQuery
              ? "No students match your search query."
              : !isClassTeacher
              ? "You are not assigned as a class teacher to any standard/division."
              : "No students registered in this section yet."}
          </p>
        </div>
      ) : (
        <div className="data-table-container glass">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || student.name || student.studentName || "Unknown Student";
                const displayClass = `${student.standardName || student.standard || "-"} ${student.divisionName || student.section || ""}`;
                const contact = student.contactNumber || student.phone || student.parentContact || student.mobileNumber || "-";
                
                return (
                  <tr key={student.studentId || student.id || index} className="student-row">
                    <td>
                      <span className="badge badge-outline">
                        {student.rollNumber || student.studentId || student.id || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="student-name-cell">
                        <div className="student-avatar-mini">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold">{fullName}</span>
                      </div>
                    </td>
                    <td>{displayClass}</td>
                    <td>{student.gender || "-"}</td>
                    <td className="text-muted">{contact}</td>
                    <td>
                      <span className={`status-pill-sm ${(student.status || "active").toLowerCase()}`}>
                        {student.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => setSelectedStudent(student)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Students;
