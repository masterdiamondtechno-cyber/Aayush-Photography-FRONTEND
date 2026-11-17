import { useState, useEffect, useCallback } from 'react';
import { 
  getAllStandards, 
  getAllDivisionsByStandardId, 
  getAllSubjects, 
  getStudentsBySection, 
  markBulkAttendance, 
  getAttendanceByDateAndSubject,
  getTodayAttendanceSummary
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';
import { 
  BiCheck, 
  BiX, 
  BiSearchAlt, 
  BiFilterAlt, 
  BiLoaderCircle, 
  BiInfoCircle, 
  BiCheckCircle, 
  BiCalendar, 
  BiBookOpen,
  BiUser,
  BiTrendingUp,
  BiSmile,
  BiChevronRight
} from 'react-icons/bi';

// Helper to safely parse numbers
const toNumber = (v) => {
  if (v === null || v === undefined || v === 'undefined' || v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Helper to extract JWT claims
const parseJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch { return null; }
};

const Attendance = () => {
  // Session details
  let schoolId = toNumber(sessionStorage.getItem('schoolId') || localStorage.getItem('schoolId'));
  let academicYearId = toNumber(getAuthValue('academicYearId'));

  if (!schoolId || !academicYearId) {
    const payload = parseJwtPayload(localStorage.getItem('token') || sessionStorage.getItem('token'));
    if (payload) {
      if (!schoolId) schoolId = toNumber(payload.schoolId || payload.sid);
      if (!academicYearId) academicYearId = toNumber(payload.academicYearId || payload.ayi);
    }
  }

  // Views & Controls
  const [view, setView] = useState('take'); // take, show
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Selection States
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Roster States
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId -> { status, remark, attendanceId }
  const [searchTerm, setSearchTerm] = useState('');
  
  // Historical search states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Success Confirmation Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionStats, setSubmissionStats] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Global UI States
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({ present: 0, total: 0 });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial setup drop downs (Standards / Classes)
  const fetchSetup = useCallback(async () => {
    if (!schoolId || !academicYearId) return;
    try {
      const res = await getAllStandards(schoolId, academicYearId);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setClasses(res.data || []);
      }
      
      // Load general school stats for today
      try {
        const sumRes = await getTodayAttendanceSummary({ schoolId, academicYearId });
        if (sumRes?.status === 'SUCCESS' || sumRes?.code === 200) {
          setSummaryData(sumRes.data || { present: 0, total: 0 });
        }
      } catch (sumErr) {
        console.warn("Could not fetch today's stats:", sumErr);
      }
    } catch (err) {
      console.error('Failed to load setup standard classes:', err);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    fetchSetup();
  }, [fetchSetup]);

  // Cascading dropdowns: Standard -> Division
  const handleClassChange = async (stdId) => {
    setSelectedClass(stdId);
    setSelectedDivision('');
    setSelectedSubject('');
    setDivisions([]);
    setSubjects([]);
    setStudents([]);
    setAttendanceRecords({});
    
    if (!stdId) return;

    try {
      const res = await getAllDivisionsByStandardId({
        schoolId,
        standardId: parseInt(stdId),
        academicYearId
      });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setDivisions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  };

  // Cascading dropdowns: Division -> Subjects
  const handleDivisionChange = async (divId) => {
    setSelectedDivision(divId);
    setSelectedSubject('');
    setSubjects([]);
    setStudents([]);
    setAttendanceRecords({});
    
    if (!divId || !selectedClass) return;

    try {
      const res = await getAllSubjects({
        schoolId,
        standardId: parseInt(selectedClass),
        divisionId: parseInt(divId),
        academicYearId
      });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setSubjects(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  // Fetch Student Roster and align existing attendance from database
  const fetchRosterAndAttendance = async () => {
    if (!selectedClass || !selectedDivision || !selectedSubject) {
      setErrorMsg('Please select Class, Section, and Subject first.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStudents([]);
    setAttendanceRecords({});

    try {
      // 1. Fetch Students registered in this division
      const studentRes = await getStudentsBySection({
        schoolId,
        standardId: parseInt(selectedClass),
        divisionId: parseInt(selectedDivision)
      });

      let rosterList = [];
      if (studentRes?.status === 'SUCCESS' || studentRes?.code === 200) {
        rosterList = studentRes.data || [];
      } else {
        throw new Error(studentRes?.message || 'No students found in this division.');
      }
      setStudents(rosterList);

      // 2. Query backend to see if attendance has already been marked
      let existingAttendance = [];
      try {
        const attRes = await getAttendanceByDateAndSubject({
          schoolId,
          standardId: parseInt(selectedClass),
          divisionId: parseInt(selectedDivision),
          subjectId: parseInt(selectedSubject),
          attendanceDate,
          academicYearId
        });

        if (attRes?.status === 'SUCCESS' || attRes?.code === 200) {
          existingAttendance = attRes.data || [];
        }
      } catch (attErr) {
        // If 404 is returned, it means attendance is not marked yet. This is clean.
        console.log("No existing attendance found, ready to mark new roster.");
      }

      // 3. Map status values
      const initialRecords = {};
      rosterList.forEach(student => {
        const match = existingAttendance.find(att => att.studentId === student.id);
        if (match) {
          initialRecords[student.id] = {
            status: match.status.toLowerCase(),
            remark: match.remark || '',
            attendanceId: match.attendanceId || null
          };
        } else {
          // Clean default: all students present initially
          initialRecords[student.id] = {
            status: 'present',
            remark: '',
            attendanceId: null
          };
        }
      });

      setAttendanceRecords(initialRecords);
      if (existingAttendance.length > 0) {
        setIsReadOnly(true);
        setSuccessMsg('Loaded already marked attendance records. Roster is locked.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setIsReadOnly(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch student roster.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Toggle student status
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Edit student remark
  const handleRemarkChange = (studentId, remark) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark
      }
    }));
  };

  // Quick action shortcuts
  const markAllAs = (status) => {
    const updated = { ...attendanceRecords };
    Object.keys(updated).forEach(id => {
      updated[id].status = status;
    });
    setAttendanceRecords(updated);
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      alert('Roster is empty. Fetch students first before saving.');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Build bulk entries
      const entries = Object.keys(attendanceRecords).map(studentId => ({
        studentId: parseInt(studentId),
        status: attendanceRecords[studentId].status.toUpperCase(),
        remark: attendanceRecords[studentId].remark || ''
      }));

      const payload = {
        schoolId,
        academicYearId,
        standardId: parseInt(selectedClass),
        divisionId: parseInt(selectedDivision),
        subjectId: parseInt(selectedSubject),
        attendanceDate,
        entries
      };

      const res = await markBulkAttendance(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setSuccessMsg('Attendance marked successfully!');
        setIsReadOnly(true);
        
        // Populate stats for the premium success confirmation modal
        setSubmissionStats({
          date: attendanceDate,
          present: liveStats.present,
          absent: liveStats.absent,
          late: liveStats.late,
          total: students.length,
          rate: liveStats.rate,
          className: classes.find(c => c.standardId === parseInt(selectedClass))?.standard || '',
          sectionName: divisions.find(d => (d.divisionId || d.id) === parseInt(selectedDivision))?.divisionName || '',
          subjectName: subjects.find(s => (s.subjectId || s.id) === parseInt(selectedSubject))?.subjectName || ''
        });
        setShowSuccessModal(true);
        
        // Refresh summary stats
        try {
          const sumRes = await getTodayAttendanceSummary({ schoolId, academicYearId });
          if (sumRes?.status === 'SUCCESS' || sumRes?.code === 200) {
            setSummaryData(sumRes.data || { present: 0, total: 0 });
          }
        } catch (sumErr) {
          console.warn("Could not reload stats:", sumErr);
        }

        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        throw new Error(res?.message || 'Failed to save attendance.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Renders the stats rate for the loaded roster
  const getLiveStats = () => {
    const list = Object.values(attendanceRecords);
    if (list.length === 0) return { present: 0, absent: 0, late: 0, rate: 0 };
    
    let present = 0, absent = 0, late = 0;
    list.forEach(r => {
      if (r.status === 'present') present++;
      if (r.status === 'absent') absent++;
      if (r.status === 'late') late++;
    });

    const rate = Math.round(((present + late) / list.length) * 100);
    return { present, absent, late, rate };
  };

  const liveStats = getLiveStats();

  // Search filter logic
  const filteredStudents = students.filter(std => {
    const fullName = `${std.firstName} ${std.lastName || ''}`.toLowerCase();
    const studentIdStr = std.id.toString();
    return fullName.includes(searchTerm.toLowerCase()) || studentIdStr.includes(searchTerm);
  });

  // HISTORICAL SEARCH ENGINE
  const fetchHistoricalReports = async () => {
    if (!selectedClass || !selectedDivision || !selectedSubject) {
      setHistoryError('Please select standard class, division, and subject filter.');
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryRecords([]);

    try {
      const res = await getAttendanceByDateAndSubject({
        schoolId,
        standardId: parseInt(selectedClass),
        divisionId: parseInt(selectedDivision),
        subjectId: parseInt(selectedSubject),
        attendanceDate,
        academicYearId
      });

      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setHistoryRecords(res.data || []);
      } else {
        setHistoryRecords([]);
      }
    } catch (err) {
      // 404 is a clean empty state
      setHistoryRecords([]);
      setHistoryError("No attendance records found for the selected date and lecture slot.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Convert status to badge classes
  const getBadgeClass = (status) => {
    const s = status.toLowerCase();
    if (s === 'present') return 'badge-present';
    if (s === 'absent') return 'badge-absent';
    return 'badge-late';
  };

  return (
    <div className="attendance-page space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Attendance Console
          </h1>
          <p className="text-sm text-slate-500">Academic Configuration • Track Student Presence</p>
        </div>
        <div className="relative">
          <BiCalendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={attendanceDate}
            onChange={(e) => {
              setAttendanceDate(e.target.value);
              setStudents([]);
              setAttendanceRecords({});
              setHistoryRecords([]);
            }}
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
            <BiTrendingUp />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today&apos;s Total Presence</span>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">
              {summaryData.present}{' '}
              <span className="text-sm font-medium text-slate-500">/ {summaryData.total} Students</span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
            <BiCheck />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Present (Active Slot)</span>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">
              {students.length > 0 ? liveStats.present : '—'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-red-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
            <BiX />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Absent (Active Slot)</span>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">
              {students.length > 0 ? liveStats.absent : '—'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
            <BiSmile />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attendance Rate</span>
            <h3 className="mt-1 font-['Lexend'] text-xl font-extrabold text-slate-900">
              {students.length > 0 ? `${liveStats.rate}%` : '—'}
            </h3>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <BiCheckCircle className="text-xl shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="error-toast flex-center" style={{ gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', justifyContent: 'flex-start', fontWeight: 600 }}>
          <BiInfoCircle style={{ fontSize: '1.4rem' }} />
          {errorMsg}
        </div>
      )}

      {/* CORE WORKSPACE CARD */}
      <div className="card main-workspace-card" style={{ borderRadius: '20px', background: 'white', border: '1px solid var(--border-light)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        
        {/* Nav Tabs */}
        <div className="tabs flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', background: '#fafafa' }}>
          <button 
            className={`tab-btn flex-center ${view === 'take' ? 'active' : ''}`}
            onClick={() => setView('take')}
            style={{ padding: '1.25rem 2rem', fontWeight: 700, gap: '0.5rem', fontSize: '0.95rem', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.3s ease' }}
          >
            Take / Edit Attendance
          </button>
          <button 
            className={`tab-btn flex-center ${view === 'show' ? 'active' : ''}`}
            onClick={() => setView('show')}
            style={{ padding: '1.25rem 2rem', fontWeight: 700, gap: '0.5rem', fontSize: '0.95rem', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.3s ease' }}
          >
            History & Records
          </button>
        </div>

        {/* Tab Content Panel */}
        <div style={{ padding: '2rem' }}>

          {/* CASCADING FILTER DROPDOWN BAR */}
          <div className="card filter-bar-panel" style={{ padding: '1rem', background: '#fafafa', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '2rem' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              
              <div className="flex-center" style={{ gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                
                {/* Standard / Class Selection */}
                <select 
                  className="form-control styled-select"
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                >
                  <option value="">Select Standard Class</option>
                  {classes.map(c => (
                    <option key={c.standardId} value={c.standardId}>{c.standard}</option>
                  ))}
                </select>

                {/* Section / Division Selection */}
                <select 
                  className="form-control styled-select"
                  disabled={!selectedClass}
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                >
                  <option value="">Select Section Division</option>
                  {divisions.map(d => (
                    <option key={d.divisionId || d.id} value={d.divisionId || d.id}>{d.divisionName || d.name}</option>
                  ))}
                </select>

                {/* Subject Selection */}
                <select 
                  className="form-control styled-select"
                  disabled={!selectedDivision}
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setStudents([]);
                    setAttendanceRecords({});
                    setHistoryRecords([]);
                  }}
                  style={{ minWidth: '180px' }}
                >
                  <option value="">Select Subject Lecture</option>
                  {subjects.map(s => (
                    <option key={s.subjectId || s.id} value={s.subjectId || s.id}>{s.subjectName}</option>
                  ))}
                </select>

                {/* Fetch / Rerun button */}
                <button 
                  className="btn btn-primary btn-sm flex-center"
                  onClick={view === 'take' ? fetchRosterAndAttendance : fetchHistoricalReports}
                  disabled={!selectedSubject || loading || historyLoading}
                  style={{ gap: '0.4rem', padding: '0.65rem 1.25rem', height: '40px', borderRadius: '10px' }}
                >
                  {view === 'take' ? 'Fetch Student Roster' : 'Query Records'}
                </button>
              </div>

              {/* Roster-only search input */}
              {view === 'take' && students.length > 0 && (
                <div className="search-box-styled flex-center">
                  <BiSearchAlt style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }} />
                  <input 
                    type="text" 
                    placeholder="Search by name or id..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', paddingLeft: '0.5rem' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* VIEW: TAKE ATTENDANCE */}
          {view === 'take' && (
            <>
              {loading ? (
                <div className="flex-center" style={{ padding: '6rem 0', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
                  <BiLoaderCircle className="spin" style={{ fontSize: '3.5rem', color: 'var(--primary)' }} />
                  <p style={{ fontWeight: 700 }}>Pulling division roster & mapping database state...</p>
                </div>
              ) : students.length === 0 ? (
                
                /* EMPTY STATE PANEL */
                <div className="empty-panel text-center flex-center" style={{ flexDirection: 'column', padding: '5rem 2rem', background: '#fafafa', border: '1px dashed var(--border-light)', borderRadius: '16px', gap: '1rem' }}>
                  <div className="icon-circle bg-primary-light flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', color: 'var(--primary)', fontSize: '2.5rem' }}>
                    <BiBookOpen />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>Roster is Unloaded</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.85rem', margin: 0 }}>
                    Please select a Class Standard, Section Division, and Subject lecture from the drop-downs above, and click "Fetch Student Roster" to initiate attendance.
                  </p>
                </div>
              ) : (
                
                /* ROSTER WORKSPACE */
                <div className="roster-panel">
                  
                  {/* ALREADY SUBMITTED LOCK INDICATOR & UNLOCK BUTTON */}
                  {isReadOnly && (
                    <div className="submitted-lock-banner flex-between scale-in" style={{ padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '14px', marginBottom: '1.5rem', gap: '1rem' }}>
                      <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem', textAlign: 'left' }}>
                        <div className="success-pulse-ring flex-center" style={{ width: '42px', height: '42px', minWidth: '42px', fontSize: '1.8rem', margin: 0, background: 'rgba(16, 185, 129, 0.15)' }}>
                          <BiCheck />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>Attendance Submitted & Logged</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857', fontWeight: 500 }}>
                            Today's register has been securely saved in the database. Grid is currently locked.
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        className="btn flex-center"
                        onClick={() => setIsReadOnly(false)}
                        style={{ background: 'white', color: '#10b981', border: '1px solid #10b981', gap: '0.4rem', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '10px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                      >
                        <BiFilterAlt style={{ transform: 'rotate(90deg)' }} /> Modify Attendance
                      </button>
                    </div>
                  )}

                  {/* BULK SHORTCUT ACTIONS BAR */}
                  <div className="flex-between" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', background: 'var(--primary-light)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Roster: {students.length} Allocated Students {isReadOnly && "(View-Only)"}
                    </span>
                    
                    {!isReadOnly && (
                      <div className="flex-center" style={{ gap: '0.75rem' }}>
                        <button className="btn-shortcut flex-center" onClick={() => markAllAs('present')} style={{ borderLeftColor: '#10b981', color: '#10b981' }}>
                          Mark All Present
                        </button>
                        <button className="btn-shortcut flex-center" onClick={() => markAllAs('absent')} style={{ borderLeftColor: '#ef4444', color: '#ef4444' }}>
                          Mark All Absent
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DATA TABLE */}
                  <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: '12px', marginBottom: '2rem' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                          <th style={{ padding: '1rem', width: '100px' }}>Roll No</th>
                          <th style={{ padding: '1rem' }}>Student Details</th>
                          <th style={{ padding: '1rem', width: '300px' }}>Attendance Status Toggle</th>
                          <th style={{ padding: '1rem' }}>Internal Remark / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, idx) => {
                          const record = attendanceRecords[student.id] || { status: 'present', remark: '' };
                          return (
                            <tr key={student.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              
                              {/* Roll Index */}
                              <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                #{idx + 1}
                              </td>

                              {/* Student Profile Info */}
                              <td style={{ padding: '1rem' }}>
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
                                  <img 
                                    src={`https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName || ''}&background=random&size=36`} 
                                    alt="" 
                                    style={{ width: '36px', height: '36px', borderRadius: '50%' }} 
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 750, color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                                      {student.firstName} {student.lastName || ''}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                      Reg No: {student.id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Status Toggles */}
                              <td style={{ padding: '1rem' }}>
                                <div className="status-toggle-box flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                  <button 
                                    className={`btn-toggle-option present ${record.status === 'present' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id, 'present')}
                                    disabled={isReadOnly}
                                    style={isReadOnly ? { cursor: 'not-allowed', opacity: record.status === 'present' ? 1 : 0.4 } : {}}
                                  >
                                    Present
                                  </button>
                                  
                                  <button 
                                    className={`btn-toggle-option absent ${record.status === 'absent' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                    disabled={isReadOnly}
                                    style={isReadOnly ? { cursor: 'not-allowed', opacity: record.status === 'absent' ? 1 : 0.4 } : {}}
                                  >
                                    Absent
                                  </button>

                                  <button 
                                    className={`btn-toggle-option late ${record.status === 'late' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id, 'late')}
                                    disabled={isReadOnly}
                                    style={isReadOnly ? { cursor: 'not-allowed', opacity: record.status === 'late' ? 1 : 0.4 } : {}}
                                  >
                                    Late
                                  </button>
                                </div>
                              </td>

                              {/* Remark Field */}
                              <td style={{ padding: '1rem' }}>
                                <input 
                                  type="text"
                                  className="form-control table-input"
                                  placeholder={isReadOnly ? "—" : "e.g. medical excuse, late entry note"}
                                  value={record.remark}
                                  onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                  disabled={isReadOnly}
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-light)', width: '100%', outline: 'none', cursor: isReadOnly ? 'not-allowed' : 'text', background: isReadOnly ? '#f8fafc' : 'white' }}
                                />
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* SAVE ACTION BOX */}
                  <div className="flex-end" style={{ gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                      {isReadOnly 
                        ? "Register is currently locked. Click 'Modify Attendance' at the top to make changes."
                        : `Double check all values. Attendance will be bound to date: ${attendanceDate}.`
                      }
                    </p>
                    {isReadOnly ? (
                      <button 
                        className="btn flex-center"
                        onClick={() => setIsReadOnly(false)}
                        style={{ gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '12px', background: '#10b981', color: 'white', fontWeight: 700, cursor: 'pointer', border: 'none' }}
                      >
                        Modify Attendance
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary flex-center"
                        disabled={submitLoading}
                        onClick={handleSaveAttendance}
                        style={{ gap: '0.5rem', padding: '0.75rem 2rem', borderRadius: '12px' }}
                      >
                        {submitLoading && <BiLoaderCircle className="spin" />}
                        {Object.values(attendanceRecords).some(r => r.attendanceId !== null) ? "Update Attendance" : "Commit Attendance"}
                      </button>
                    )}
                  </div>

                </div>
              )}
            </>
          )}

          {/* VIEW: HISTORICAL RECORDS */}
          {view === 'show' && (
            <>
              {historyLoading ? (
                <div className="flex-center" style={{ padding: '6rem 0', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
                  <BiLoaderCircle className="spin" style={{ fontSize: '3.5rem', color: 'var(--primary)' }} />
                  <p style={{ fontWeight: 700 }}>Querying database history archives...</p>
                </div>
              ) : historyRecords.length === 0 ? (
                
                /* HISTORICAL EMPTY STATE */
                <div className="empty-panel text-center flex-center" style={{ flexDirection: 'column', padding: '5rem 2rem', background: '#fafafa', border: '1px dashed var(--border-light)', borderRadius: '16px', gap: '1rem' }}>
                  <div className="icon-circle bg-primary-light flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', color: 'var(--primary)', fontSize: '2.5rem' }}>
                    <BiCalendar />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>No Search Records Loaded</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.85rem', margin: 0 }}>
                    {historyError || "Select a standard class, division section, and subject above, and click 'Query Records' to fetch historical attendance reports."}
                  </p>
                </div>
              ) : (
                
                /* REPORTS RENDER */
                <div className="reports-panel">
                  
                  {/* Stats Sub-Summary bar */}
                  <div className="flex-between mb-15" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                      Search Results for Date: {attendanceDate}
                    </span>
                    <span className="badge-class flex-center" style={{ gap: '0.25rem', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700 }}>
                      Class {classes.find(c => c.standardId === parseInt(selectedClass))?.standard} • Sec {divisions.find(d => (d.divisionId || d.id) === parseInt(selectedDivision))?.divisionName}
                    </span>
                  </div>

                  {/* REPORT TABLE */}
                  <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                          <th style={{ padding: '1rem', width: '100px' }}>Entry ID</th>
                          <th style={{ padding: '1rem' }}>Student Profile</th>
                          <th style={{ padding: '1rem', width: '180px' }}>Recorded Presence</th>
                          <th style={{ padding: '1rem' }}>Auditor Remark / Note</th>
                          <th style={{ padding: '1rem', width: '220px' }}>Marked Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRecords.map(item => (
                          <tr key={item.attendanceId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              #{item.attendanceId}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 750, color: 'var(--text-dark)' }}>
                                  Student #{item.studentId}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  Subject ID: {item.subjectId}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`status-badge-styled ${getBadgeClass(item.status)}`}>
                                {item.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {item.remark || '—'}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {item.markedAt ? new Date(item.markedAt).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL POPUP */}
      {showSuccessModal && submissionStats && (
        <div className="attendance-modal-backdrop flex-center">
          <div className="attendance-modal-card scale-in">
            <div className="success-pulse-ring flex-center">
              <BiCheck className="modal-success-check-icon" />
            </div>
            
            <h2 className="modal-title">Attendance Submitted!</h2>
            <p className="modal-description">
              The student attendance register has been securely submitted and logged in the database.
            </p>

            <div className="modal-stats-grid">
              <div className="modal-stat-item">
                <span className="stat-label">Date</span>
                <span className="stat-val">{submissionStats.date}</span>
              </div>
              <div className="modal-stat-item">
                <span className="stat-label">Class & Sec</span>
                <span className="stat-val">Class {submissionStats.className} - {submissionStats.sectionName}</span>
              </div>
              <div className="modal-stat-item">
                <span className="stat-label">Subject</span>
                <span className="stat-val">{submissionStats.subjectName}</span>
              </div>
              <div className="modal-stat-item">
                <span className="stat-label">Total Roster</span>
                <span className="stat-val">{submissionStats.total} Students</span>
              </div>
              <div className="modal-stat-item green-accent">
                <span className="stat-label">Present</span>
                <span className="stat-val">{submissionStats.present}</span>
              </div>
              <div className="modal-stat-item red-accent">
                <span className="stat-label">Absent</span>
                <span className="stat-val">{submissionStats.absent}</span>
              </div>
              <div className="modal-stat-item gold-accent">
                <span className="stat-label">Late</span>
                <span className="stat-val">{submissionStats.late}</span>
              </div>
              <div className="modal-stat-item purple-accent">
                <span className="stat-label">Presence Rate</span>
                <span className="stat-val">{submissionStats.rate}%</span>
              </div>
            </div>

            <button 
              className="btn btn-primary modal-close-btn"
              onClick={() => {
                setShowSuccessModal(false);
                setSubmissionStats(null);
              }}
            >
              Done, Return to Roster
            </button>
          </div>
        </div>
      )}

      {/* ADDITIONAL EMBEDDED STYLES FOR PREMIUM RENDER */}
      <style>{`
        .styled-select {
          padding: 0.6rem 1rem;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          background: white;
          outline: none;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          min-width: 160px;
          height: 40px;
          transition: all 0.2s ease;
        }
        .styled-select:hover {
          border-color: var(--primary);
        }
        .date-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .date-icon {
          position: absolute;
          left: 12px;
          color: var(--primary);
          font-size: 1.2rem;
          pointer-events: none;
        }
        .date-picker {
          padding: 0.65rem 1rem 0.65rem 2.25rem;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          background: white;
          outline: none;
          font-weight: 700;
          color: var(--text-dark);
          cursor: pointer;
          box-shadow: 0 4px 20px -2px rgba(0,0,0,0.04);
          transition: all 0.2s ease;
        }
        .date-picker:hover {
          border-color: var(--primary);
        }
        .bg-late-light {
          background: rgba(245, 158, 11, 0.1);
        }
        .tab-btn.active {
          color: var(--primary) !important;
          border-bottom: 3px solid var(--primary) !important;
          background: white !important;
        }
        .search-box-styled {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 0.4rem 0.8rem;
          width: 240px;
          height: 40px;
        }
        .btn-shortcut {
          background: white;
          border: 1px solid var(--border-light);
          border-left: 4px solid transparent;
          border-radius: 8px;
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
          fontWeight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-shortcut:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .btn-toggle-option {
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid var(--border-light);
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-muted);
        }
        .btn-toggle-option:hover:not(.active) {
          background: #f5f5f5;
        }
        .btn-toggle-option.present.active {
          background: #10b981;
          color: white;
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-toggle-option.absent.active {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }
        .btn-toggle-option.late.active {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }
        .status-badge-styled {
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-block;
        }
        .status-badge-styled.badge-present {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-badge-styled.badge-absent {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .status-badge-styled.badge-late {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .stat-card {
          box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -4px rgba(0,0,0,0.05);
        }
        .table-input:focus {
          border-color: var(--primary) !important;
          background: white;
        }

        /* Success Modal Styles */
        .attendance-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: modalBgFadeIn 0.3s ease forwards;
        }
        .attendance-modal-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          width: 90%;
          max-width: 520px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .success-pulse-ring {
          width: 80px;
          height: 80px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50%;
          color: #10b981;
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          animation: successPulse 2s infinite;
        }
        .modal-success-check-icon {
          animation: checkPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .modal-title {
          font-size: 1.6rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        .modal-description {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 2rem 0;
          max-width: 380px;
        }
        .modal-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          width: 100%;
          margin-bottom: 2rem;
        }
        .modal-stat-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .modal-stat-item.green-accent {
          border-left: 3px solid #10b981;
          background: rgba(16, 185, 129, 0.02);
        }
        .modal-stat-item.red-accent {
          border-left: 3px solid #ef4444;
          background: rgba(239, 68, 68, 0.02);
        }
        .modal-stat-item.gold-accent {
          border-left: 3px solid #f59e0b;
          background: rgba(245, 158, 11, 0.02);
        }
        .modal-stat-item.purple-accent {
          border-left: 3px solid #8b5cf6;
          background: rgba(139, 92, 246, 0.02);
        }
        .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 700;
        }
        .stat-val {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
        }
        .modal-close-btn {
          width: 100%;
          padding: 0.85rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.2);
          border: none;
          cursor: pointer;
        }
        
        /* Keyframe Animations */
        @keyframes modalBgFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes successPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes checkPopIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;
