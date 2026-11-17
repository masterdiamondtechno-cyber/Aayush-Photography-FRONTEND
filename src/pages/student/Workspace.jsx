import React, { useState, useEffect, useRef } from 'react';
import { 
  BiLaptop, BiCloudUpload, BiHistory, BiGroup, 
  BiTimeFive, BiUser, BiFile, BiCheckCircle, 
  BiChevronRight, BiLoaderAlt, BiErrorCircle,
  BiLink, BiUpload, BiLockAlt
} from 'react-icons/bi';
import { 
  getAssignmentsByClassDivision, 
  getSubmissionHistory, 
  getMyStudyGroups,
  getActiveAssignments,
  submitAssignment,
  markAssignmentAsSeen
} from '../../api/api';
import { useStudentSearch } from '../../contexts/StudentSearchContext';


const getStoredValue = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

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

/** Returns true if the due date has passed */
const isPastDue = (dueDate) => {
  if (!dueDate) return false;
  const dDate = new Date(dueDate);
  dDate.setHours(23, 59, 59, 999);
  return dDate < new Date();
};

const Workspace = () => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const { searchQuery } = useStudentSearch();

  // Submission tracking: Map of assignmentId → submission record
  const [submissionsMap, setSubmissionsMap] = useState({});

  // PDF File Upload States
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Extract session info with robust fallbacks
  const jwt = parseJwtPayload(getStoredValue('token'));
  const schoolId = toNumber(getStoredValue('schoolId') || jwt?.sid);
  const academicYearId = toNumber(getStoredValue('academicYearId') || jwt?.ayi);
  const studentId = toNumber(getStoredValue('studentId') || getStoredValue('userId') || jwt?.uid);
  
  const profile = (() => {
    try {
      const stored = getStoredValue('profileData');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  })();

  const [standardId] = useState(toNumber(profile.standardId || getStoredValue('standardId')) || 24);
  const [divisionId] = useState(toNumber(profile.divisionId || getStoredValue('divisionId')) || 2);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  /** Load existing submissions once so we can derive "submitted" state per assignment */
  const loadSubmissionsMap = async () => {
    try {
      const res = await getSubmissionHistory({ studentId, schoolId, academicYearId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        const map = {};
        (res.data || []).forEach(sub => {
          if (sub.assignmentId) map[toNumber(sub.assignmentId)] = sub;
        });
        setSubmissionsMap(map);
      }
    } catch (e) {
      console.warn('[StudentWorkspace] Could not load submissions map:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (activeTab === 'assignments') {
        // Fetch student's own study groups to check for assignment memberships
        let myGroups = [];
        try {
          const groupRes = await getMyStudyGroups({ studentId, schoolId, academicYearId });
          if (groupRes?.status === 'SUCCESS' || groupRes?.code === 200) {
            myGroups = groupRes.data || [];
          }
        } catch (groupErr) {
          console.warn("[StudentWorkspace] Failed to fetch student study groups for filtering:", groupErr);
        }

        const groupIds = new Set(myGroups.map(g => toNumber(g.id)));

        response = await getAssignmentsByClassDivision({
          schoolId, academicYearId, standardId, divisionId
        });

        if (response?.status === 'SUCCESS' || response?.code === 200) {
          const rawAssignments = Array.isArray(response.data) ? response.data : [];
          const filtered = rawAssignments.filter(assignment => {
            const assignmentGroupId = toNumber(assignment.studyGroupId);
            return !assignmentGroupId || groupIds.has(assignmentGroupId);
          });
          setData(filtered);
          // Also refresh submission map so button states are up-to-date
          await loadSubmissionsMap();
        } else {
          setError(response?.message || 'Failed to fetch data');
        }
        return;
      } else if (activeTab === 'history') {
        response = await getSubmissionHistory({ studentId, schoolId, academicYearId });
      } else if (activeTab === 'groups') {
        response = await getMyStudyGroups({ studentId, schoolId, academicYearId });
      }

      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setData(response.data || []);
      } else {
        setError(response?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setFileUrl('');
    setSelectedFile(null);
    setUploadMode('url');
    setUploadError('');

    // Auto mark as seen in the background
    try {
      await markAssignmentAsSeen({ assignmentId: assignment.id, studentId, schoolId });
    } catch (seenErr) {
      console.warn("[StudentWorkspace] Failed to mark assignment as seen:", seenErr);
    }
  };

  /** Convert a local File to a base64 data URL */
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setUploadError('Only PDF, DOC, or DOCX files are allowed.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB limit
      setUploadError('File must be smaller than 10 MB.');
      setSelectedFile(null);
      return;
    }
    setUploadError('');
    setSelectedFile(file);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setUploadError('');

    let submissionUrl = fileUrl;

    if (uploadMode === 'upload') {
      if (!selectedFile) {
        setUploadError('Please select a file to upload.');
        return;
      }
      setIsUploading(true);
      try {
        submissionUrl = await fileToDataUrl(selectedFile);
      } catch (err) {
        setUploadError('Failed to read the file. Please try again.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      if (!fileUrl || !fileUrl.trim()) {
        setUploadError('Please provide a valid URL.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await submitAssignment({
        assignmentId: selectedAssignment.id,
        studentId,
        schoolId,
        fileUrl: submissionUrl
      });

      if (response?.status === 'SUCCESS' || response?.code === 200) {
        alert('Assignment submitted successfully!');
        setShowSubmitModal(false);
        // Refresh assignments tab to update button states
        if (activeTab === 'assignments') fetchData();
        else await loadSubmissionsMap();
      } else {
        alert(response?.message || 'Submission failed');
      }
    } catch (err) {
      alert(err.message || 'An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  const searchLower = (searchQuery || '').toLowerCase();
  const filteredData = data.filter(item => {
    if (!searchLower) return true;
    if (activeTab === 'assignments') {
      return (item.title || '').toLowerCase().includes(searchLower) || 
             (item.subjectName || '').toLowerCase().includes(searchLower) ||
             (item.description || '').toLowerCase().includes(searchLower);
    }
    if (activeTab === 'history') {
      return (item.assignmentTitle || '').toLowerCase().includes(searchLower) ||
             (item.status || '').toLowerCase().includes(searchLower);
    }
    if (activeTab === 'groups') {
      return (item.groupName || '').toLowerCase().includes(searchLower) ||
             (item.description || '').toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="student-page-container fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title">Learning Workspace</h1>
        <p className="page-subtitle">Your central hub for assignments, collaboration and history</p>
      </div>

      <div className="workspace-tabs">
        <button 
          className={`workspace-tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <BiCloudUpload /> Assignments
        </button>
        <button 
          className={`workspace-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <BiHistory /> My Submissions
        </button>
        <button 
          className={`workspace-tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <BiGroup /> Study Groups
        </button>
      </div>

      <div className="workspace-view-container">
        {loading ? (
          <div className="exam-loading">
            <div className="spinner"></div>
            <p>Loading {activeTab}...</p>
          </div>
        ) : error ? (
          <div className="exam-error">
            <BiErrorCircle size={40} />
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="exam-empty">
            <BiFile className="empty-icon" />
            <h3>No {activeTab} found</h3>
            <p>{searchQuery ? 'No results match your search.' : 'Check back later for updates.'}</p>
          </div>
        ) : (
          <div className="fade-in">
            {activeTab === 'assignments' && (
              <div className="assignment-grid">
                {filteredData.map((item) => {
                  const overdue = isPastDue(item.dueDate);
                  const submission = submissionsMap[toNumber(item.id)];
                  const isSubmitted = submission && submission.status === 'SUBMITTED';

                  return (
                    <div
                      key={item.id}
                      className={`assignment-card glass hover-effect${overdue ? ' assignment-overdue' : ''}`}
                    >
                      {/* Status ribbon */}
                      {overdue && (
                        <div className="overdue-ribbon">
                          <BiLockAlt size={12} /> Completed
                        </div>
                      )}
                      {isSubmitted && !overdue && (
                        <div className="submitted-ribbon">
                          <BiCheckCircle size={12} /> Submitted
                        </div>
                      )}

                      <span className="assignment-subject">{item.subjectName}</span>
                      <h3 className="assignment-title">{item.title}</h3>
                      <p className="line-clamp-2">{item.description}</p>
                      
                      <div className="assignment-meta">
                        <span className={overdue ? 'due-overdue' : ''}>
                          <BiTimeFive /> Due: {new Date(item.dueDate).toLocaleDateString()}
                          {overdue && ' • Expired'}
                        </span>
                      </div>

                      <div className="assignment-teacher">
                        <div className="teacher-avatar-mini">
                          {item.teacherName?.substring(0, 2).toUpperCase() || 'TR'}
                        </div>
                        <span className="text-sm font-semibold">{item.teacherName}</span>
                      </div>

                      <div className="assignment-actions">
                        {overdue ? (
                          /* Past due — locked */
                          <button className="btn-locked w-full" disabled>
                            <BiLockAlt /> Completed
                          </button>
                        ) : isSubmitted ? (
                          /* Already submitted — disabled */
                          <button className="btn-submitted w-full" disabled>
                            <BiCheckCircle /> Submitted
                          </button>
                        ) : (
                          /* Open and not yet submitted */
                          <button 
                            className="btn-primary-premium w-full"
                            onClick={() => handleOpenSubmit(item)}
                          >
                            Open Assignment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-list">
                {filteredData.map((item) => (
                  <div key={item.id} className="history-card glass hover-effect">
                    <div className="history-main">
                      <h4 className="history-title">{item.assignmentTitle}</h4>
                      <p className="history-date">Submitted on: {new Date(item.submittedAt).toLocaleString()}</p>
                      <div className="mt-2">
                        <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="history-score-box">
                      {item.marks !== null ? (
                        <div>
                          <p className="stat-lbl">Marks Obtained</p>
                          <span className="marks-display">{item.marks}</span>
                          <p className="text-xs italic text-gray-500 mt-1">"{item.remarks}"</p>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Grading Pending</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="group-grid">
                {filteredData.map((item) => (
                  <div key={item.id} className="group-card glass hover-effect">
                    <div className="workspace-icon">
                      <BiGroup />
                    </div>
                    <h3 className="group-name">{item.groupName}</h3>
                    <p className="group-desc">{item.description}</p>
                    <div className="group-stats">
                      <div className="stat-item">
                        <span className="stat-val">{item.memberCount}</span>
                        <span className="stat-lbl">Members</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-val">{item.standardName}</span>
                        <span className="stat-lbl">Class</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button className="btn-text">View Group Feed →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Submission Modal ──────────────────────────────────── */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h2 className="modal-title"><BiCloudUpload /> Submit Assignment</h2>
              <button className="btn-icon-action close" onClick={() => setShowSubmitModal(false)}>×</button>
            </div>
            <div className="p-8">
              {/* Assignment details */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{selectedAssignment?.title}</h3>
                <p className="text-gray-600 mb-4">{selectedAssignment?.description}</p>
                {selectedAssignment?.attachmentUrl && (
                  <a 
                    href={selectedAssignment.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary font-bold hover:underline"
                  >
                    <BiFile /> Download Tutorial/Resource
                  </a>
                )}
              </div>

              {/* Upload Mode Toggle */}
              <div className="upload-mode-toggle">
                <button
                  type="button"
                  className={`upload-mode-btn${uploadMode === 'url' ? ' active' : ''}`}
                  onClick={() => { setUploadMode('url'); setUploadError(''); }}
                >
                  <BiLink /> Paste URL Link
                </button>
                <button
                  type="button"
                  className={`upload-mode-btn${uploadMode === 'upload' ? ' active' : ''}`}
                  onClick={() => { setUploadMode('upload'); setUploadError(''); }}
                >
                  <BiUpload /> Upload PDF/Doc
                </button>
              </div>

              <form onSubmit={handleSubmitWork}>
                {uploadMode === 'url' ? (
                  <div className="form-group-premium">
                    <label>Work Submission URL (PDF/Doc/Drive Link)</label>
                    <input 
                      type="url" 
                      className="form-input-premium" 
                      placeholder="https://example.com/my-submission.pdf"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Provide a direct link to your document or Google Drive file.</p>
                  </div>
                ) : (
                  <div className="form-group-premium">
                    <label>Upload Your File (PDF, DOC, DOCX — max 10 MB)</label>
                    <div
                      className={`file-drop-zone${selectedFile ? ' has-file' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelect({ target: { files: [file] } });
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      {selectedFile ? (
                        <div className="file-selected-info">
                          <BiFile size={32} className="file-icon-big" />
                          <div>
                            <p className="file-name">{selectedFile.name}</p>
                            <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            className="btn-clear-file"
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="file-drop-prompt">
                          <BiUpload size={36} className="drop-icon" />
                          <p className="drop-text">Click to browse or drag & drop your file here</p>
                          <p className="drop-hint">PDF, DOC, DOCX — max 10 MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="upload-error-msg">
                    <BiErrorCircle /> {uploadError}
                  </p>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary-premium w-full mt-4"
                  disabled={submitting || isUploading}
                >
                  {submitting || isUploading
                    ? <><BiLoaderAlt className="spin-icon" /> Processing...</>
                    : <><BiCloudUpload /> Submit My Work</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
