import React, { useEffect, useState } from 'react';
import { BiX, BiTrophy, BiCheck, BiXCircle } from 'react-icons/bi';
import { getStudentExamMarks } from '../../api/api';

const gradeColorMap = {
  'A+': '#10b981',
  'A': '#10b981',
  'B+': '#6C5CE7',
  'B': '#6C5CE7',
  'C+': '#f59e0b',
  'C': '#f59e0b',
  'D': '#ef4444',
  'F': '#ef4444',
};

const getGradeColor = (grade) => gradeColorMap[grade?.toUpperCase()] || '#6C5CE7';

const ExamAnalysisModal = ({ exam, schoolId, academicYearId, studentId, onClose }) => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchMarks = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getStudentExamMarks({ schoolId, academicYearId, studentId, examId: exam.examId });
        if (mounted) {
          if (res?.status === 'SUCCESS' || res?.code === 200) {
            setMarks(Array.isArray(res.data) ? res.data : [res.data]);
          } else {
            setError(res?.message || 'Failed to fetch exam analysis');
          }
        }
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'Failed to fetch exam analysis');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMarks();
    return () => { mounted = false; };
  }, [exam.examId, schoolId, academicYearId, studentId]);

  const getScorePercent = (obtained, max) => {
    if (!max || max === 0) return 0;
    return Math.min(100, Math.max(0, Math.round((obtained / max) * 100)));
  };

  return (
    <div className="modal-overlay space-y-8" onClick={onClose}>
      <div className="modal-container analysis-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-top-bar">
          <h2 className="modal-title"><BiTrophy /> Exam Analysis</h2>
          <button className="btn-icon-action close" onClick={onClose} title="Close">
            <BiX />
          </button>
        </div>

        <div className="analysis-exam-info">
          <h3>{exam.examName}</h3>
          <span className="analysis-subject">{exam.subjectName}</span>
          {exam.score && <span className="analysis-score-badge">{exam.score}</span>}
        </div>

        {loading && (
          <div className="modal-body-center">
            <div className="spinner"></div>
            <p>Loading analysis...</p>
          </div>
        )}

        {error && !loading && (
          <div className="modal-body-center error">
            <p>{error}</p>
            <button className="btn-retry" onClick={onClose}>Close</button>
          </div>
        )}

        {!loading && !error && marks.length > 0 && (
          <div className="analysis-results">
            {marks.map((m, idx) => {
              const pct = getScorePercent(m.marksObtained, m.maxMarks);
              const gradeColor = getGradeColor(m.grade);

              return (
                <div key={m.examMarksId || idx} className="analysis-card">
                  {/* Score Circle */}
                  <div className="score-visual">
                    <svg viewBox="0 0 120 120" className="score-ring">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke={gradeColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * 326.73} 326.73`}
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                      />
                    </svg>
                    <div className="score-center-text">
                      <span className="score-num">{m.marksObtained}</span>
                      <span className="score-den">/ {m.maxMarks}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="analysis-details">
                    <div className="analysis-detail-row">
                      <span className="detail-label">Grade</span>
                      <span className="grade-badge" style={{ background: `${gradeColor}18`, color: gradeColor }}>
                        {m.grade || 'N/A'}
                      </span>
                    </div>
                    <div className="analysis-detail-row">
                      <span className="detail-label">Percentage</span>
                      <span className="detail-value">{pct}%</span>
                    </div>
                    <div className="analysis-detail-row">
                      <span className="detail-label">Remark</span>
                      <span className="detail-value remark">{m.remark || '—'}</span>
                    </div>
                    <div className="analysis-detail-row">
                      <span className="detail-label">Attendance</span>
                      <span className={`attendance-chip ${m.isAbsent ? 'absent' : 'present'}`}>
                        {m.isAbsent ? <><BiXCircle /> Absent</> : <><BiCheck /> Present</>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && marks.length === 0 && (
          <div className="modal-body-center">
            <p>No marks data found for this exam.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamAnalysisModal;
