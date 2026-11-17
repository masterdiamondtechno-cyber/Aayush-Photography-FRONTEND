import { useState, useEffect } from 'react';
import { 
  BiPlus, 
  BiSearch, 
  BiEditAlt, 
  BiTrash, 
  BiBarChartAlt, 
  BiBookOpen, 
  BiCalendar, 
  BiCheck, 
  BiX, 
  BiFilterAlt, 
  BiLoaderAlt, 
  BiTrendingUp,
  BiUser,
  BiTimeFive,
  BiPieChartAlt2,
  BiChevronRight
} from 'react-icons/bi';
import { 
  getAllStandards, 
  getAllDivisionsByStandardId, 
  getAllSubjectsBySchool, 
  getStudentsBySection,
  createExam,
  getExamsBySchool,
  updateExam,
  deleteExam,
  saveMarksBulk,
  getMarksByExam
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';
import DataTable from '../../components/common/DataTable';

const Exams = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [exams, setExams] = useState([]);
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Creation/Edit States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  
  // Marks Entry States
  const [markingExam, setMarkingExam] = useState(null);
  const [marksEntries, setMarksEntries] = useState({}); // { studentId: { marksObtained: '', isAbsent: false, remark: '' } }
  
  // Filtering & Selection for schedule creation
  const [formDivisions, setFormDivisions] = useState([]);
  
  // Main page search and filter
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  
  // Search & Loading
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [marksLoading, setMarksLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');

  useEffect(() => {
    if (schoolId && academicYearId) {
      fetchInitialData();
    } else {
      setError("Configuration missing: School ID or Academic Year not found.");
    }
  }, [schoolId, academicYearId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch standards
      const stdRes = await getAllStandards(schoolId, academicYearId);
      setStandards(stdRes?.data || []);

      // Fetch subjects
      const subRes = await getAllSubjectsBySchool({ schoolId, academicYearId });
      setSubjects(subRes?.data || []);

      // Fetch exams list
      await fetchExams();
    } catch (err) {
      console.error("Error loading initial exam data:", err);
      setError("Failed to load standard or subject directories.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const examRes = await getExamsBySchool({ schoolId, academicYearId });
      setExams(examRes?.data || []);
    } catch (err) {
      console.error("Error loading exams:", err);
      setExams([]);
    }
  };

  // Fetch divisions dynamically when standard changes in forms/filters
  const handleStandardChange = async (stdId, isForm = false) => {
    if (!stdId) {
      if (isForm) setFormDivisions([]);
      else setDivisions([]);
      return;
    }
    try {
      const divRes = await getAllDivisionsByStandardId({
        schoolId,
        standardId: stdId,
        academicYearId
      });
      if (isForm) {
        setFormDivisions(divRes?.data || []);
      } else {
        setDivisions(divRes?.data || []);
        setSelectedDivision('');
      }
    } catch (err) {
      console.error("Error fetching divisions:", err);
    }
  };

  // Create or Update Exam
  const handleSaveExam = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const payload = {
      schoolId: parseInt(schoolId),
      academicYearId: parseInt(academicYearId),
      standardId: parseInt(formData.get('standardId')),
      divisionId: parseInt(formData.get('divisionId')),
      subjectId: parseInt(formData.get('subjectId')),
      examName: formData.get('examName'),
      examMode: formData.get('examMode') || 'THEORY',
      examDate: formData.get('examDate'),
      duration: formData.get('duration') || '3 Hours',
      totalMarks: parseFloat(formData.get('totalMarks') || '100'),
      status: formData.get('status') || 'UPCOMING'
    };

    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');

      if (editingExam) {
        await updateExam({
          ...payload,
          examId: editingExam.examId
        });
        setSuccessMsg("Examination schedule updated successfully!");
      } else {
        await createExam(payload);
        setSuccessMsg("New examination schedule created successfully!");
      }

      setShowAddModal(false);
      setEditingExam(null);
      await fetchExams();
    } catch (err) {
      console.error("Error saving exam:", err);
      setError(err.response?.data?.message || err.message || "Failed to save examination slot");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = async (exam) => {
    setEditingExam(exam);
    await handleStandardChange(exam.standardId, true);
    setShowAddModal(true);
  };

  // Delete Exam
  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam schedule? All entered student marks for this exam will also be permanently deleted.")) return;
    
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');
      await deleteExam({ examId, schoolId });
      setSuccessMsg("Exam schedule and corresponding student marks deleted successfully.");
      await fetchExams();
    } catch (err) {
      console.error("Error deleting exam:", err);
      setError(err.response?.data?.message || err.message || "Failed to delete exam schedule.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Enter Marks Section
  const handleEnterMarks = async (exam) => {
    try {
      setMarksLoading(true);
      setError('');
      setSuccessMsg('');
      setMarkingExam(exam);

      // 1. Fetch Students of this class/division
      const studentRes = await getStudentsBySection({
        schoolId,
        standardId: exam.standardId,
        divisionId: exam.divisionId,
        academicYearId
      });
      const studentList = studentRes?.data || [];
      setStudents(studentList);

      // 2. Fetch existing marks for this exam to pre-populate
      let existingMarks = [];
      try {
        const marksRes = await getMarksByExam({
          examId: exam.examId,
          schoolId,
          academicYearId
        });
        existingMarks = marksRes?.data || [];
      } catch (marksErr) {
        console.log("No existing marks or failed fetching marks:", marksErr);
      }

      // Map existing marks to state
      const mappedMarks = {};
      studentList.forEach(student => {
        const found = existingMarks.find(m => m.studentId === student.id);
        mappedMarks[student.id] = {
          marksObtained: found ? found.marksObtained ?? '' : '',
          isAbsent: found ? found.isAbsent ?? false : false,
          remark: found ? found.remark ?? '' : ''
        };
      });

      setMarksEntries(mappedMarks);
      setActiveTab('marking');
    } catch (err) {
      console.error("Failed to load marks entry workspace:", err);
      setError("Failed to open marks entry dashboard. Verify if section contains students.");
    } finally {
      setMarksLoading(false);
    }
  };

  // Update specific student's mark in local state
  const handleLocalMarkChange = (studentId, field, value) => {
    setMarksEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Save Bulk Marks to backend
  const handleSaveMarks = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMsg('');

      const entriesPayload = Object.keys(marksEntries).map(studentId => {
        const entry = marksEntries[studentId];
        return {
          studentId: parseInt(studentId),
          marksObtained: entry.isAbsent ? 0 : parseFloat(entry.marksObtained || '0'),
          isAbsent: entry.isAbsent,
          remark: entry.remark || ''
        };
      });

      await saveMarksBulk({
        schoolId: parseInt(schoolId),
        academicYearId: parseInt(academicYearId),
        examId: markingExam.examId,
        subjectId: markingExam.subjectId,
        entries: entriesPayload
      });

      setSuccessMsg(`Marks for ${markingExam.examName} saved successfully! Grade calculations finalized.`);
      setActiveTab('list');
      setMarkingExam(null);
      await fetchExams();
    } catch (err) {
      console.error("Error saving bulk marks:", err);
      setError(err.response?.data?.message || err.message || "Failed to save student marks.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter exams based on Search or Select Dropdowns
  const filteredExams = exams.filter(exam => {
    const matchSearch = exam.examName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (exam.subjectName && exam.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStandard = selectedStandard ? String(exam.standardId) === String(selectedStandard) : true;
    const matchDivision = selectedDivision ? String(exam.divisionId) === String(selectedDivision) : true;
    return matchSearch && matchStandard && matchDivision;
  });

  // Calculate high-level stats
  const totalScheduled = exams.length;
  const completedExams = exams.filter(e => e.status === 'COMPLETED').length;
  const upcomingExams = exams.filter(e => e.status === 'UPCOMING').length;

  return (
    <div className="exams-page space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="flex items-center gap-3 font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BiBookOpen className="text-xl" />
            </span>
            Examination Center
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Academic &gt; Exams</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs">Real-time Backend Synchronized</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          {activeTab === 'list' && (
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
              onClick={() => { setEditingExam(null); setShowAddModal(true); }}
            >
              <BiPlus className="text-lg" /> Schedule New Exam
            </button>
          )}
          {activeTab === 'marking' && (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              onClick={() => { setActiveTab('list'); setMarkingExam(null); }}
            >
              Cancel & Back
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Metrics */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Scheduled Exams</p>
              <h2 className="mt-2 font-['Lexend'] text-3xl font-bold text-slate-900">{totalScheduled}</h2>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <BiCalendar /> Across All Sections
              </p>
            </div>
            <BiCalendar className="absolute -bottom-2 -right-2 text-6xl text-indigo-100" />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming Exams</p>
              <h2 className="mt-2 font-['Lexend'] text-3xl font-bold text-slate-900">{upcomingExams}</h2>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <BiTimeFive /> Awaiting Scheduling
              </p>
            </div>
            <BiTimeFive className="absolute -bottom-2 -right-2 text-6xl text-amber-100" />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed & Evaluated</p>
              <h2 className="mt-2 font-['Lexend'] text-3xl font-bold text-slate-900">{completedExams}</h2>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <BiCheck /> Grades Auto-Compiled
              </p>
            </div>
            <BiCheck className="absolute -bottom-2 -right-2 text-6xl text-emerald-100" />
          </div>
        </div>
      )}

      {/* Main Board */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {activeTab === 'list' && (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Standard Class</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={selectedStandard}
                    onChange={(e) => {
                      setSelectedStandard(e.target.value);
                      handleStandardChange(e.target.value);
                    }}
                  >
                    <option value="">All Standards</option>
                    {standards.map(s => <option key={s.standardId} value={s.standardId}>{s.standard || s.standardName}</option>)}
                  </select>
                </div>
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Division Section</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    disabled={!selectedStandard}
                  >
                    <option value="">All Sections</option>
                    {divisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
                  </select>
                </div>
              </div>
              <div className="min-w-[240px]">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Search Exam</label>
                <div className="relative">
                  <BiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search exam..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Exams Schedule Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <BiLoaderAlt className="animate-spin text-3xl text-indigo-600" />
                <p className="text-sm font-medium">Fetching active examination directories...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                <BiCalendar className="text-4xl text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700">No Exams Scheduled</h3>
                <p className="max-w-md text-sm">There are no active exam schedules matching the selected class filters. Create one above to begin.</p>
              </div>
            ) : (
              <div className="table-responsive-premium">
                <DataTable 
                  headers={['Exam Details', 'Schedule & Type', 'Total Marks', 'Status', 'Actions']}
                  data={filteredExams}
                  renderRow={(exam) => (
                    <tr key={exam.examId}>
                      <td>
                        <div className="exam-info-cell">
                          <span className="exam-title-bold">{exam.examName}</span>
                          <span className="exam-subject-sub"><BiBookOpen /> {exam.subjectName || "General Subject"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="exam-date-duration">
                          <div className="exam-date-val"><BiCalendar /> {exam.examDate ? new Date(exam.examDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}</div>
                          <span className="exam-mode-badge">{exam.examMode || 'THEORY'}</span>
                          <span className="exam-duration-text"><BiTimeFive /> {exam.duration || '3 Hours'}</span>
                        </div>
                      </td>
                      <td className="marks-column font-bold">
                        {exam.totalMarks} Marks
                      </td>
                      <td>
                        <span className={`status-pill ${exam.status?.toLowerCase() || 'upcoming'}`}>
                          {exam.status || 'UPCOMING'}
                        </span>
                      </td>
                      <td>
                        <div className="flex-center gap-1 row-actions">
                          <button className="btn btn-enter-marks" onClick={() => handleEnterMarks(exam)}>
                            <BiTrendingUp /> {exam.status === 'COMPLETED' ? 'Edit Marks' : 'Enter Marks'}
                          </button>
                          <button className="btn-icon-premium edit" onClick={() => openEditModal(exam)}>
                            <BiEditAlt />
                          </button>
                          <button className="btn-icon-premium delete" onClick={() => handleDeleteExam(exam.examId)}>
                            <BiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                />
              </div>
            )}
          </>
        )}

        {/* Enter Marks Tab */}
        {activeTab === 'marking' && markingExam && (
          <div className="marking-section">
            <div className="marking-header flex-between mb-2">
              <div>
                <h2>Evaluation Sheet: {markingExam.examName}</h2>
                <div className="flex-center gap-1 text-sm text-muted mt-02">
                  <span>Subject: <strong>{markingExam.subjectName}</strong></span>
                  <span>&bull;</span>
                  <span>Maximum Score: <strong>{markingExam.totalMarks} Marks</strong></span>
                </div>
              </div>
              <div className="flex-center gap-1">
                <button className="btn btn-outline-premium" onClick={() => { setActiveTab('list'); setMarkingExam(null); }}>Cancel</button>
                <button className="btn btn-submit-modal" onClick={handleSaveMarks} disabled={actionLoading}>
                  {actionLoading ? <BiLoaderAlt className="spinner-premium" /> : <><BiCheck /> Save & Finalize</>}
                </button>
              </div>
            </div>

            {marksLoading ? (
              <div className="loading-placeholder">
                <BiLoaderAlt className="spinner-premium" />
                <p>Loading student class registration data...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="empty-placeholder">
                <BiUser className="placeholder-icon" />
                <h3>No Students Registered</h3>
                <p>This standard/division section does not contain any onboarded students. Add students to record grades.</p>
              </div>
            ) : (
              <div className="table-responsive-premium mt-1">
                <table className="marking-grid-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Roll / Student ID</th>
                      <th>Student Name</th>
                      <th style={{ width: '180px', textAlign: 'center' }}>Marks Obtained</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Attendance</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const entry = marksEntries[student.id] || { marksObtained: '', isAbsent: false, remark: '' };
                      return (
                        <tr key={student.id}>
                          <td className="font-bold text-muted">#{student.studentId || `2026${idx+1}`}</td>
                          <td>
                            <div className="student-profile-cell">
                              <img src={`https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=4f46e5&color=fff&size=36`} alt="" />
                              <span className="font-bold">{student.firstName} {student.lastName}</span>
                            </div>
                          </td>
                          <td>
                            <input 
                              type="number"
                              className="input-premium w-100 text-center"
                              placeholder={`0 - ${markingExam.totalMarks}`}
                              min="0"
                              max={markingExam.totalMarks}
                              value={entry.isAbsent ? '' : entry.marksObtained}
                              disabled={entry.isAbsent}
                              onChange={(e) => handleLocalMarkChange(student.id, 'marksObtained', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <label className="absent-checkbox-label">
                              <input 
                                type="checkbox"
                                checked={entry.isAbsent}
                                onChange={(e) => handleLocalMarkChange(student.id, 'isAbsent', e.target.checked)}
                              />
                              <span>Absent</span>
                            </label>
                          </td>
                          <td>
                            <input 
                              type="text"
                              className="input-premium w-100"
                              placeholder="e.g. Excellent, Scope for Improvement"
                              value={entry.remark}
                              onChange={(e) => handleLocalMarkChange(student.id, 'remark', e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Exam Modal */}
      {showAddModal && (
        <div className="modal-overlay-premium" onClick={() => setShowAddModal(false)}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h3>{editingExam ? 'Modify Schedule' : 'Schedule New Examination'}</h3>
              <button className="btn-close-premium" onClick={() => setShowAddModal(false)}><BiX /></button>
            </div>
            
            <form className="grid gap-15 mt-1" onSubmit={handleSaveExam}>
              <div className="form-group-premium">
                <label>Exam Name / Title</label>
                <input
                  type="text"
                  name="examName"
                  className="input-premium w-100"
                  defaultValue={editingExam?.examName || ''}
                  placeholder="e.g. Unit Test 1, First Term Final"
                  required
                />
              </div>

              <div className="grid grid-2 gap-1">
                <div className="form-group-premium">
                  <label>Standard Class</label>
                  <select 
                    className="select-premium"
                    name="standardId" 
                    defaultValue={editingExam?.standardId || ''}
                    onChange={(e) => handleStandardChange(e.target.value, true)}
                    required
                  >
                    <option value="">Select Standard</option>
                    {standards.map(s => <option key={s.standardId} value={s.standardId}>{s.standard || s.standardName}</option>)}
                  </select>
                </div>
                <div className="form-group-premium">
                  <label>Division Section</label>
                  <select 
                    className="select-premium" 
                    name="divisionId" 
                    defaultValue={editingExam?.divisionId || ''}
                    required
                  >
                    <option value="">Select Section</option>
                    {formDivisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-2 gap-1">
                <div className="form-group-premium">
                  <label>Assigned Subject</label>
                  <select 
                    className="select-premium" 
                    name="subjectId" 
                    defaultValue={editingExam?.subjectId || ''}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
                  </select>
                </div>
                <div className="form-group-premium">
                  <label>Exam Mode</label>
                  <select 
                    className="select-premium" 
                    name="examMode" 
                    defaultValue={editingExam?.examMode || 'THEORY'}
                  >
                    <option value="THEORY">Theory Paper</option>
                    <option value="PRACTICAL">Practical / Viva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-3 gap-1">
                <div className="form-group-premium">
                  <label>Exam Date</label>
                  <input
                    type="date"
                    name="examDate"
                    className="input-premium w-100"
                    defaultValue={editingExam?.examDate || ''}
                    required
                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  />
                </div>
                <div className="form-group-premium">
                  <label>Duration</label>
                  <input
                    type="text"
                    name="duration"
                    className="input-premium w-100"
                    defaultValue={editingExam?.duration || '3 Hours'}
                    placeholder="e.g. 2 Hours, 90 Mins"
                    required
                  />
                </div>
                <div className="form-group-premium">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    name="totalMarks"
                    className="input-premium w-100"
                    defaultValue={editingExam?.totalMarks || 100}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group-premium">
                <label>Status</label>
                <select 
                  className="select-premium" 
                  name="status" 
                  defaultValue={editingExam?.status || 'UPCOMING'}
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex-end gap-1 mt-2 modal-footer-actions">
                <button type="button" className="btn-cancel-modal" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-modal" disabled={actionLoading}>
                  {actionLoading ? <BiLoaderAlt className="spinner-premium" /> : (editingExam ? "Save Changes" : "Post Schedule")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Styling */}
      <style>{`
        .exams-page {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Grid Utilities & Responsive Layouts */
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        
        @media (max-width: 1024px) {
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
          .header-section {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          .header-section button {
            width: 100%;
            justify-content: center;
          }
          .filter-dashboard-panel {
            flex-direction: column;
            align-items: stretch !important;
            gap: 1rem;
          }
          .filters-wrapper {
            flex-direction: column;
            align-items: stretch !important;
            width: 100%;
          }
          .form-group-premium {
            width: 100%;
          }
          .select-premium {
            width: 100%;
          }
          .search-box-premium {
            width: 100%;
            min-width: 100%;
          }
          .search-input-wrapper input {
            width: 100%;
          }
          .metrics-row {
            gap: 1rem;
          }
          .exams-board-card {
            padding: 1.25rem !important;
          }
        }

        .main-title-exams {
          font-weight: 850;
          color: var(--text-main);
          font-size: 2.1rem;
          letter-spacing: -0.03em;
        }

        .icon-badge {
          background: var(--primary-glow);
          color: var(--primary);
          padding: 0.6rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          margin-right: 0.25rem;
        }

        .subtitle-container {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .live-dot-indicator {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #10b981;
        }

        .btn-add-exam {
          background: var(--primary);
          color: #ffffff;
          font-weight: 700;
          border-radius: 12px;
          padding: 0.65rem 1.4rem;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px var(--primary-glow);
        }

        .btn-add-exam:hover {
          background: var(--primary-dark);
          box-shadow: 0 6px 20px rgba(93, 95, 239, 0.3);
          transform: translateY(-1px);
        }

        /* Metric Cards */
        .premium-metric-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 1.5rem;
          border: 1px solid var(--border-light);
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.01);
          transition: transform 0.3s ease;
        }

        .premium-metric-card:hover {
          transform: translateY(-3px);
        }

        .metric-content {
          position: relative;
          z-index: 2;
        }

        .metric-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .metric-val {
          font-size: 2.2rem;
          font-weight: 900;
          margin: 0.25rem 0;
          color: var(--text-main);
          font-family: 'Lexend', sans-serif;
        }

        .metric-footer {
          color: var(--text-muted);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .metric-glow-bg {
          position: absolute;
          right: -10px;
          bottom: -15px;
          opacity: 0.06;
          z-index: 1;
          transform: rotate(-15deg);
        }

        .icon-blue { color: var(--primary); }
        .icon-amber { color: #f59e0b; }
        .icon-green { color: #10b981; }

        /* Board Styling */
        .exams-board-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid var(--border-light);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }

        .filter-dashboard-panel {
          background: var(--bg-light);
          padding: 1.25rem 1.5rem;
          border-radius: 20px;
          border: 1px solid var(--border-light);
          gap: 1.5rem;
        }

        .form-group-premium {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-group-premium label {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .select-premium {
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          padding: 0.6rem 1.25rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-main);
          min-width: 160px;
          outline: none;
          transition: all 0.25s ease;
        }

        .select-premium:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .input-premium {
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          padding: 0.65rem 1.25rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-main);
          outline: none;
          transition: all 0.25s ease;
        }

        .input-premium:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .search-box-premium {
          width: 240px;
        }

        .search-input-wrapper {
          display: flex;
          flex-direction: row;
          align-items: center;
          height: 38px;
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          padding: 0 0.85rem;
          gap: 0.5rem;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          overflow: hidden;
        }

        .search-input-wrapper:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .search-icon {
          display: block;
          color: var(--text-muted);
          font-size: 1rem;
          flex-shrink: 0;
          line-height: 0;
        }

        .search-input-wrapper input {
          flex: 1;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          padding: 0;
          margin: 0;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-main);
          min-width: 0;
        }

        .search-input-wrapper input::placeholder {
          color: var(--text-muted);
          font-weight: 400;
        }

        /* Exams List Table Details */
        .exam-info-cell {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .exam-title-bold {
          font-weight: 800;
          color: var(--text-main);
          font-size: 0.95rem;
          font-family: 'Lexend', sans-serif;
        }

        .exam-subject-sub {
          font-size: 0.78rem;
          color: var(--primary);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.15rem;
        }

        .exam-date-duration {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
        }

        .exam-date-val {
          font-weight: 700;
          color: var(--text-main);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .exam-mode-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          width: fit-content;
        }

        .exam-duration-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 650;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-pill {
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          display: inline-block;
        }

        .status-pill.upcoming {
          background: #fff7ed;
          color: #d97706;
          border: 1px solid #ffedd5;
        }

        .status-pill.completed {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #d1fae5;
        }

        .status-pill.cancelled {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .btn-enter-marks {
          background: var(--primary-glow);
          color: var(--primary);
          border: none;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .btn-enter-marks:hover {
          background: var(--primary);
          color: #ffffff;
        }

        .btn-icon-premium {
          background: var(--bg-light);
          border: 1.5px solid var(--border-light);
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .btn-icon-premium:hover {
          background: #ffffff;
          transform: scale(1.05);
        }

        .btn-icon-premium.edit:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .btn-icon-premium.delete:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.02);
        }

        /* Table responsive */
        .table-responsive-premium {
          overflow-x: auto;
          width: 100%;
          border-radius: 20px;
          border: 1px solid var(--border-light);
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }

        /* Placeholder styles */
        .loading-placeholder, .empty-placeholder {
          text-align: center;
          padding: 4.5rem 2rem;
          color: var(--text-muted);
        }

        .spinner-premium {
          font-size: 2.5rem;
          color: var(--primary);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .placeholder-icon {
          font-size: 4.5rem;
          color: var(--border-light);
          margin-bottom: 1rem;
        }

        .empty-placeholder h3 {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.35rem;
        }

        /* Glassmorphic Modal styling */
        .modal-overlay-premium {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modalFadeIn 0.2s ease;
          padding: 1.5rem;
          box-sizing: border-box;
        }

        .modal-content-premium {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: var(--shadow-lg);
          border-radius: 24px;
          padding: 2rem;
          width: 90%;
          max-width: 620px;
          animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-content-premium form,
        .modal-content-premium .padding-1-5 {
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .modal-content-premium form::-webkit-scrollbar,
        .modal-content-premium .padding-1-5::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content-premium form::-webkit-scrollbar-track,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-content-premium form::-webkit-scrollbar-thumb,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .modal-content-premium form::-webkit-scrollbar-thumb:hover,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .modal-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid var(--border-light);
          padding-bottom: 1rem;
          margin-bottom: 1.25rem;
        }

        .modal-header-premium h3 {
          font-family: 'Lexend', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }

        .btn-close-premium {
          background: var(--bg-light);
          border: none;
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-close-premium:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: rotate(90deg);
        }

        .modal-footer-actions {
          border-top: 1.5px solid var(--border-light);
          padding-top: 1.25rem;
        }

        .btn-submit-modal {
          background: var(--primary);
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.65rem 1.4rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px var(--primary-glow);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-submit-modal:hover {
          background: var(--primary-dark);
          box-shadow: 0 6px 16px rgba(93, 95, 239, 0.35);
        }

        .btn-submit-modal:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-cancel-modal {
          background: transparent;
          border: 1.5px solid var(--border-light);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.88rem;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel-modal:hover {
          background: var(--bg-light);
        }

        .btn-outline-premium {
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          color: var(--text-main);
          font-weight: 750;
          border-radius: 12px;
          padding: 0.6rem 1.25rem;
          font-size: 0.88rem;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }

        .btn-outline-premium:hover {
          background: var(--bg-light);
          transform: translateY(-1px);
        }

        /* Alert styling */
        .alert-premium {
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .alert-danger-premium {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .alert-success-premium {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
        }

        /* Marking grid */
        .marking-grid-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .marking-grid-table th {
          background: var(--bg-light);
          color: var(--text-muted);
          font-weight: 800;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 1rem 1.25rem;
          border-bottom: 1.5px solid var(--border-light);
        }

        .marking-grid-table td {
          padding: 1.1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
        }

        .student-profile-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
        }

        .student-profile-cell img {
          border-radius: 50%;
          border: 2px solid var(--border-light);
        }

        .absent-checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          font-weight: 700;
          color: #ef4444;
          font-size: 0.85rem;
          background: rgba(239, 68, 68, 0.05);
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .absent-checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: #ef4444;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Exams;
