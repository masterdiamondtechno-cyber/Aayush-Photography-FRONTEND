import React, { useState, useEffect, useMemo } from 'react';
import { 
  BiCalendarCheck, 
  BiCheckDouble, 
  BiSearch, 
  BiChevronDown, 
  BiSave, 
  BiCheckCircle, 
  BiXCircle, 
  BiTimeFive, 
  BiListUl,
  BiLoaderCircle,
  BiRefresh
} from 'react-icons/bi';
import { 
  getTeacherClasses, 
  getStudentsBySection, 
  getAttendanceByDateAndSubject, 
  markBulkAttendance 
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';


const Attendance = () => {
  // --- State ---
  const [classesList, setClassesList] = useState([]);
  const [selectedClassIndex, setSelectedClassIndex] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarking, setIsMarking] = useState(false);
  
  const [loading, setLoading] = useState(true); // fetching teacher classes
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- Fetch initial teacher classes list ---
  const fetchClasses = async () => {
    const schoolId = getAuthValue("schoolId");
    const teacherId = getAuthValue("teacherId") || getAuthValue("userId");
    const academicYearId = getAuthValue("academicYearId");

    if (!schoolId || !teacherId || !academicYearId) {
      setError("Missing credentials. Please check your session and log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getTeacherClasses({ schoolId, teacherId, academicYearId });
      
      if (res.status === "SUCCESS" && res.data && res.data.classes) {
        setClassesList(res.data.classes);
        if (res.data.classes.length > 0) {
          setSelectedClassIndex(0);
          const firstClass = res.data.classes[0];
          if (firstClass.subjects && firstClass.subjects.length > 0) {
            setSelectedSubjectId(firstClass.subjects[0].subjectId);
          }
        }
      } else {
        setError(res.message || "Failed to load assigned classes.");
      }
    } catch (err) {
      console.error("Error fetching teacher classes:", err);
      setError("Error loading classes data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // --- Derive available subjects for selected class index ---
  const availableSubjects = useMemo(() => {
    if (selectedClassIndex === '' || !classesList[selectedClassIndex]) return [];
    return classesList[selectedClassIndex].subjects || [];
  }, [selectedClassIndex, classesList]);

  // --- Keep selectedSubjectId valid when class index changes ---
  useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.find(s => s.subjectId.toString() === selectedSubjectId?.toString());
      if (!exists) {
        setSelectedSubjectId(availableSubjects[0].subjectId);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [availableSubjects]);

  // --- Fetch student records and attendance sheets ---
  const fetchStudentsAndAttendance = async () => {
    if (selectedClassIndex === '' || !classesList[selectedClassIndex] || !selectedSubjectId || !selectedDate) {
      setStudents([]);
      return;
    }

    const schoolId = getAuthValue("schoolId");
    const academicYearId = getAuthValue("academicYearId");
    const currentClass = classesList[selectedClassIndex];
    const standardId = currentClass.standardId;
    const divisionId = currentClass.divisionId;

    setStudentsLoading(true);
    setError(null);
    setIsMarking(false);

    try {
      // 1. Get class student list
      const studentsRes = await getStudentsBySection({
        schoolId,
        academicYearId,
        standardId,
        divisionId
      });

      if (studentsRes.status === "SUCCESS") {
        const rawStudents = studentsRes.data || [];
        
        // 2. Get attendance data for date and subject
        let attendanceList = [];
        try {
          const attRes = await getAttendanceByDateAndSubject({
            schoolId,
            standardId,
            divisionId,
            subjectId: selectedSubjectId,
            academicYearId,
            attendanceDate: selectedDate
          });
          if (attRes.status === "SUCCESS" && attRes.data) {
            attendanceList = attRes.data;
          }
        } catch (attErr) {
          // 404 is a standard response when attendance is not yet marked
          if (attErr.response?.status !== 404) {
            console.error("Error fetching attendance list:", attErr);
          }
        }

        // 3. Map students and correlate their attendance status
        const mappedStudents = rawStudents.map(s => {
          const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || 'Unknown Student';
          
          // Generate initials for avatar
          const parts = fullName.trim().split(/\s+/);
          const initials = parts.length >= 2 
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();

          const attRecord = attendanceList.find(a => Number(a.studentId) === Number(s.id));
          
          return {
            id: s.id,
            studentIdString: s.studentId || `ST-${s.id}`,
            name: fullName,
            roll: s.rollNumber || 'N/A',
            avatar: initials || 'ST',
            status: attRecord ? attRecord.status : null, // 'PRESENT', 'ABSENT', 'LATE'
            attendanceId: attRecord ? attRecord.attendanceId : null
          };
        });

        setStudents(mappedStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Error fetching class students and attendance:", err);
      setError("Could not load class students or attendance sheet data.");
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [selectedClassIndex, selectedSubjectId, selectedDate]);

  // --- Stats and Formatting ---
  const selectedClassInfo = useMemo(() => {
    if (selectedClassIndex === '' || !classesList[selectedClassIndex]) return 'No Class Selected';
    const cls = classesList[selectedClassIndex];
    const subjectName = availableSubjects.find(s => s.subjectId.toString() === selectedSubjectId?.toString())?.subjectName || '';
    return `${cls.standard} - ${cls.divisionName} ${subjectName ? `(${subjectName})` : ''}`;
  }, [selectedClassIndex, classesList, selectedSubjectId, availableSubjects]);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const summary = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === 'PRESENT').length;
    const absent = students.filter(s => s.status === 'ABSENT').length;
    const late = students.filter(s => s.status === 'LATE').length;
    return { total, present, absent, late };
  }, [students]);

  // --- Handlers ---
  const toggleStatus = (id, newStatus) => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === newStatus ? null : newStatus } : s
    ));
    if (!isMarking) setIsMarking(true);
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    setIsMarking(true);
  };

  const handleSubmitSheet = async () => {
    const schoolId = getAuthValue("schoolId");
    const teacherId = getAuthValue("teacherId") || getAuthValue("userId");
    const academicYearId = getAuthValue("academicYearId");
    const currentClass = classesList[selectedClassIndex];
    const standardId = currentClass.standardId;
    const divisionId = currentClass.divisionId;

    const unmarked = students.filter(s => s.status === null);
    if (unmarked.length > 0) {
      if (!window.confirm(`There are ${unmarked.length} unmarked students. Unmarked students will not be submitted. Do you wish to continue?`)) {
        return;
      }
    }

    const payload = {
      schoolId: Number(schoolId),
      academicYearId: Number(academicYearId),
      standardId: Number(standardId),
      divisionId: Number(divisionId),
      subjectId: Number(selectedSubjectId),
      attendanceDate: selectedDate,
      markedBy: Number(teacherId),
      entries: students
        .filter(s => s.status !== null)
        .map(s => ({
          studentId: s.id,
          status: s.status,
          remark: ''
        }))
    };

    if (payload.entries.length === 0) {
      alert("Please mark attendance for at least one student before submitting.");
      return;
    }

    try {
      setStudentsLoading(true);
      const res = await markBulkAttendance(payload);
      if (res.status === "SUCCESS") {
        setSuccessMsg("Attendance sheet submitted successfully!");
        setIsMarking(false);
        setTimeout(() => setSuccessMsg(null), 5000);
        // Refresh the student statuses
        await fetchStudentsAndAttendance();
      } else {
        alert(res.message || "Failed to submit attendance sheet.");
      }
    } catch (err) {
      console.error("Submit attendance error:", err);
      alert("An error occurred while submitting the attendance sheet.");
    } finally {
      setStudentsLoading(false);
    }
  };

  // --- Filtered Student List ---
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.roll.toString().toLowerCase().includes(q) ||
      s.studentIdString.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="teacher-page-container fade-in space-y-8">
      {/* Page Header */}
      <div className="page-header flex-between">
        <div className="header-content">
          <h1 className="page-title gradient-text">Student Attendance</h1>
          <p className="page-subtitle">
            <span className="class-badge">{selectedClassInfo}</span> 
            <span className="date-dot">•</span> 
            <span>{formattedDate}</span>
          </p>
        </div>
        <div className="header-actions">
          {successMsg && (
            <div 
              className="success-badge-toast"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginRight: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <BiCheckCircle /> {successMsg}
            </div>
          )}
          <button className="btn-premium-outline flex-center gap-2" onClick={fetchStudentsAndAttendance} disabled={studentsLoading}>
            <BiRefresh /> Sync
          </button>
          <button 
            className="btn-premium-primary" 
            disabled={!isMarking || studentsLoading || students.length === 0} 
            onClick={handleSubmitSheet}
          >
            <BiSave /> Submit Sheet
          </button>
        </div>
      </div>

      {/* Stats & Controls */}
      <div className="attendance-controls glass-panel">
        <div className="attendance-stats">
          <div className="stat-card total">
            <div className="stat-icon"><BiListUl /></div>
            <div className="stat-details">
              <span className="value">{summary.total}</span>
              <span className="label">Total Students</span>
            </div>
          </div>
          <div className="stat-card present">
            <div className="stat-icon"><BiCheckCircle /></div>
            <div className="stat-details">
              <span className="value">{summary.present}</span>
              <span className="label">Present</span>
            </div>
          </div>
          <div className="stat-card absent">
            <div className="stat-icon"><BiXCircle /></div>
            <div className="stat-details">
              <span className="value">{summary.absent}</span>
              <span className="label">Absent</span>
            </div>
          </div>
          <div className="stat-card late">
            <div className="stat-icon"><BiTimeFive /></div>
            <div className="stat-details">
              <span className="value">{summary.late}</span>
              <span className="label">Late</span>
            </div>
          </div>
        </div>

        <div className="control-divider"></div>

        {/* Filters */}
        <div className="attendance-filters">
          <div className="search-box-premium">
            <BiSearch />
            <input 
              type="text" 
              placeholder="Search student name or roll..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Class Selector */}
          <div className="class-selector-premium">
            <select 
              value={selectedClassIndex}
              onChange={(e) => {
                setSelectedClassIndex(e.target.value);
                setSearchQuery('');
              }}
              disabled={loading}
            >
              {loading ? (
                <option value="">Loading...</option>
              ) : classesList.length === 0 ? (
                <option value="">No Classes Assigned</option>
              ) : (
                classesList.map((cls, idx) => (
                  <option key={`${cls.standardId}-${cls.divisionId}`} value={idx}>
                    {cls.standard} - {cls.divisionName}
                  </option>
                ))
              )}
            </select>
            <BiChevronDown className="select-arrow" />
          </div>

          {/* Subject Selector */}
          <div className="class-selector-premium">
            <select 
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSearchQuery('');
              }}
              disabled={loading || availableSubjects.length === 0}
            >
              {availableSubjects.length === 0 ? (
                <option value="">No Subjects</option>
              ) : (
                availableSubjects.map(sub => (
                  <option key={sub.subjectId} value={sub.subjectId}>
                    {sub.subjectName}
                  </option>
                ))
              )}
            </select>
            <BiChevronDown className="select-arrow" />
          </div>

          {/* Date Picker Selector */}
          <div className="class-selector-premium" style={{ width: '150px' }}>
            <input 
              type="date" 
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                width: '100%',
                cursor: 'pointer'
              }}
            />
          </div>

          <button 
            className="btn-quick-present" 
            onClick={() => markAll('PRESENT')}
            disabled={studentsLoading || students.length === 0}
          >
            <BiCheckDouble /> Mark All Present
          </button>
        </div>
      </div>

      {/* Attendance Grid */}
      {loading || studentsLoading ? (
        <div className="flex-center flex-column py-10 gap-3">
          <BiLoaderCircle className="animate-spin text-4xl text-primary" />
          <p className="text-muted">Loading students roster & attendance history...</p>
        </div>
      ) : error ? (
        <div className="no-results glass-panel py-8">
          <p className="text-danger">{error}</p>
          <button className="btn-premium-primary mt-4" onClick={fetchStudentsAndAttendance}>Retry</button>
        </div>
      ) : students.length === 0 ? (
        <div className="no-results glass-panel py-8">
          <BiCalendarCheck size={40} className="text-muted mb-3" />
          <p>No student roster available for this class division section.</p>
        </div>
      ) : (
        <div className="attendance-grid">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <div 
                key={student.id} 
                className={`student-attendance-card hover-lift ${student.status ? student.status.toLowerCase() : 'neutral'}`}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="card-inner">
                  <div className="student-profile">
                    <div className={`avatar-box ${student.status ? student.status.toLowerCase() : 'neutral'}`}>
                      {student.avatar}
                    </div>
                    <div className="student-meta">
                      <h4>{student.name}</h4>
                      <span className="roll-no">Roll: {student.roll} • {student.studentIdString}</span>
                    </div>
                  </div>
                  
                  <div className="status-toggles">
                    <button 
                      className={`toggle-btn present ${student.status === 'PRESENT' ? 'active' : ''}`}
                      onClick={() => toggleStatus(student.id, 'PRESENT')}
                      title="Present"
                    >
                      <BiCheckCircle />
                      <span>P</span>
                    </button>
                    <button 
                      className={`toggle-btn late ${student.status === 'LATE' ? 'active' : ''}`}
                      onClick={() => toggleStatus(student.id, 'LATE')}
                      title="Late"
                    >
                      <BiTimeFive />
                      <span>L</span>
                    </button>
                    <button 
                      className={`toggle-btn absent ${student.status === 'ABSENT' ? 'active' : ''}`}
                      onClick={() => toggleStatus(student.id, 'ABSENT')}
                      title="Absent"
                    >
                      <BiXCircle />
                      <span>A</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results glass-panel py-8">
              <BiSearch size={30} className="text-muted mb-2" />
              <p>No students found matching your search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
