import React, { useState, useEffect } from 'react';
import { useStudentSearch } from '../../contexts/StudentSearchContext';
import { BiCalendarStar, BiTimeFive, BiBadgeCheck, BiBookOpen, BiLoader } from 'react-icons/bi';
import { getStudentExams } from '../../api/api';
import HallTicketModal from './HallTicketModal';
import ExamAnalysisModal from './ExamAnalysisModal';
import Portal from '../../components/common/Portal';


const getStoredValue = (key) =>
  sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

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

const toNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const Examination = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const { searchQuery } = useStudentSearch();

  // Modal states
  const [hallTicketExam, setHallTicketExam] = useState(null);
  const [analysisExam, setAnalysisExam] = useState(null);

  // Extract session info
  const jwt = parseJwtPayload(getStoredValue('token'));
  const schoolId = toNumber(getStoredValue('schoolId') || jwt?.sid);
  const academicYearId = toNumber(getStoredValue('academicYearId') || jwt?.ayi);
  const studentId = toNumber(getStoredValue('studentId') || getStoredValue('userId') || jwt?.uid);

  // Handle body scroll locking when a modal is open
  useEffect(() => {
    if (hallTicketExam || analysisExam) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [hallTicketExam, analysisExam]);

  useEffect(() => {
    let mounted = true;

    const fetchExams = async () => {
      setLoading(true);
      setError('');

      if (!schoolId || !academicYearId || !studentId) {
        setError('Session data missing. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const res = await getStudentExams({ schoolId, academicYearId, studentId });
        if (mounted) {
          if (res?.status === 'SUCCESS' || res?.code === 200) {
            setExams(Array.isArray(res.data) ? res.data : []);
          } else {
            setError(res?.message || 'Failed to load exams.');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || err?.message || 'Failed to load exams.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchExams();
    return () => { mounted = false; };
  }, [schoolId, academicYearId, studentId]);

  const searchLower = (searchQuery || '').toLowerCase();
  const filteredExams = exams.filter(e => {
    const matchesFilter = filter === 'ALL' || e.status?.toUpperCase() === filter;
    const matchesSearch = !searchLower ||
      (e.examName || '').toLowerCase().includes(searchLower) ||
      (e.subjectName || '').toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const upcomingCount = exams.filter(e => e.status?.toUpperCase() === 'UPCOMING').length;
  const completedCount = exams.filter(e => e.status?.toUpperCase() === 'COMPLETED').length;

  return (
    <>
      <div className="student-page-container fade-in space-y-8">
        <div className="page-header space-y-1.5">
          <h1 className="page-title font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Exams & Results</h1>
          <p className="page-subtitle text-sm text-slate-500">Track your upcoming tests and past performances</p>
        </div>

        {/* Stats Summary */}
        <div className="exam-stats-bar flex flex-wrap gap-4">
          <div className="exam-stat-chip total">
            <span className="stat-count">{exams.length}</span>
            <span className="stat-label">Total Exams</span>
          </div>
          <div className="exam-stat-chip upcoming">
            <span className="stat-count">{upcomingCount}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="exam-stat-chip completed">
            <span className="stat-count">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="exam-filter-tabs">
          {['ALL', 'UPCOMING', 'HISTORY'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Exams' : f === 'HISTORY' ? 'Exam History' : 'Upcoming'}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="exam-loading">
            <div className="spinner"></div>
            <p>Loading exams...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="exam-error">
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredExams.length === 0 && (
          <div className="exam-empty">
            <BiBookOpen className="empty-icon" />
            <h3>No exams found</h3>
            <p>{filter === 'ALL' ? 'No exams have been scheduled yet.' : `No ${filter.toLowerCase()} exams.`}</p>
          </div>
        )}

        {/* Exam Cards Grid for Upcoming/All */}
        {!loading && !error && filteredExams.length > 0 && filter !== 'HISTORY' && (
          <div className="exam-grid">
            {filteredExams.map((exam) => {
              const isUpcoming = exam.status?.toUpperCase() === 'UPCOMING';
              const isCompleted = exam.status?.toUpperCase() === 'COMPLETED';

              return (
                <div key={exam.examId} className={`exam-card glass ${isUpcoming ? 'upcoming' : 'completed'}`}>
                  <div className="exam-header flex-between">
                    <span className={`status-tag ${isUpcoming ? 'upcoming' : 'completed'}`}>
                      {exam.status}
                    </span>
                    {exam.examMode && <span className="type-tag">{exam.examMode}</span>}
                  </div>
                  <h3 className="exam-card-title">{exam.examName}</h3>
                  <span className="exam-subject-name">{exam.subjectName}</span>
                  <div className="exam-details">
                    <div className="detail-row">
                      <BiCalendarStar /> <span>{formatDate(exam.examDate)}</span>
                    </div>
                    {isUpcoming && exam.duration && (
                      <div className="detail-row">
                        <BiTimeFive /> <span>{exam.duration}</span>
                      </div>
                    )}
                    {isCompleted && exam.score && (
                      <div className="detail-row score">
                        <BiBadgeCheck /> <span>Score: <strong>{exam.score}</strong></span>
                      </div>
                    )}
                    {exam.totalMarks && (
                      <div className="detail-row">
                        <BiBookOpen /> <span>Total Marks: {exam.totalMarks}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className={`btn-exam-action ${isCompleted ? 'completed' : 'upcoming'}`}
                    onClick={() => isCompleted ? setAnalysisExam(exam) : setHallTicketExam(exam)}
                  >
                    {isCompleted ? '📊 View Analysis' : '🎟️ Get Hall Ticket'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Professional Table View for History */}
        {!loading && !error && filteredExams.length > 0 && filter === 'HISTORY' && (
          <div className="history-table-container fade-in">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Exam Date</th>
                  <th>Exam Details</th>
                  <th>Subject</th>
                  <th>Result</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.examId}>
                    <td data-label="Date">
                      <div className="flex items-center gap-2 font-semibold">
                        <BiCalendarStar className="text-primary" />
                        {formatDate(exam.examDate)}
                      </div>
                    </td>
                    <td data-label="Exam">
                      <div className="exam-main-info">
                        <span className="exam-main-name">{exam.examName}</span>
                        <span className="exam-main-mode">{exam.examMode || 'Regular'}</span>
                      </div>
                    </td>
                    <td data-label="Subject">
                      <span className="font-semibold text-primary">{exam.subjectName}</span>
                    </td>
                    <td data-label="Result">
                      <div className="result-display">
                        <span className="result-marks">
                          {exam.score || 'N/A'} {exam.totalMarks ? `/ ${exam.totalMarks}` : ''}
                        </span>
                        {exam.grade && <span className="result-grade">Grade: {exam.grade}</span>}
                      </div>
                    </td>
                    <td data-label="Action">
                      <button 
                        className="btn-table-action"
                        onClick={() => setAnalysisExam(exam)}
                      >
                        📊 View Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals rendered via Portal to ensure full-viewport overlay coverage */}
      {hallTicketExam && (
        <Portal>
          <HallTicketModal
            exam={hallTicketExam}
            schoolId={schoolId}
            academicYearId={academicYearId}
            studentId={studentId}
            onClose={() => setHallTicketExam(null)}
          />
        </Portal>
      )}

      {analysisExam && (
        <Portal>
          <ExamAnalysisModal
            exam={analysisExam}
            schoolId={schoolId}
            academicYearId={academicYearId}
            studentId={studentId}
            onClose={() => setAnalysisExam(null)}
          />
        </Portal>
      )}
    </>
  );
};

export default Examination;
