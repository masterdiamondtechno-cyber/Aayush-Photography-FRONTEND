import React, { useState, useEffect } from 'react';
import { 
  BiLaptop, BiCloudUpload, BiPlusCircle, BiBookOpen, 
  BiCheckCircle, BiXCircle, BiEdit, BiTrash, BiFile, 
  BiTimeFive, BiUser, BiCommentDetail, BiShow, BiFilterAlt
} from 'react-icons/bi';
import { 
  createAssignment, 
  updateAssignment, 
  deleteAssignment, 
  closeAssignment, 
  getAssignmentsByTeacher, 
  getSubmissionsByAssignment, 
  gradeSubmission,
  getAllStandards,
  getAllBatches,
  getAllSubjectsBySchool,
  getStudentsBySection,
  createStudyGroup,
  addStudentsToGroup
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';


// ─── Utility Helpers ─────────────────────────────────────────────────────────
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

const toNumber = (v) => {
  if (v === null || v === undefined || v === 'undefined' || v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const isPastDue = (dueDate) => {
  if (!dueDate) return false;
  const dDate = new Date(dueDate);
  dDate.setHours(23, 59, 59, 999);
  return dDate < new Date();
};

const TeacherWorkspace = () => {
  const [activeTab, setActiveTab] = useState('manage');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Workspace Context
  const [assignments, setAssignments] = useState([]);
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [filterStandard, setFilterStandard] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // File Upload State
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate premium upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          const simulatedUrl = `https://school-management-s3.s3.amazonaws.com/uploads/assignments/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          setCreateForm(prev => ({ ...prev, attachmentUrl: simulatedUrl }));
        }, 400);
      }
      setUploadProgress(progress);
    }, 100);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setCreateForm(prev => ({ ...prev, attachmentUrl: '' }));
  };

  // Default Tomorrow Date Helper
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Active Assignment and Submissions
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', remarks: '' });

  // Modals / Detail Card View
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, title: '', description: '', dueDate: '', attachmentUrl: '' });

  // Creation Form Fields
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    dueDate: getTomorrowDateString(),
    attachmentUrl: '',
    standardId: '',
    divisionId: '',
    subjectId: ''
  });

  // Study Group & Roster States
  const [studentsInSection, setStudentsInSection] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [assignToGroup, setAssignToGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Filtered assignments
  const filteredAssignments = assignments.filter(item => {
    const matchStd = !filterStandard || Number(item.standardId) === Number(filterStandard);
    const matchSub = !filterSubject || Number(item.subjectId) === Number(filterSubject);
    return matchStd && matchSub;
  });

  // State variables for robust session tracking
  const [schoolId, setSchoolId] = useState(null);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  // Extract Session Data on mount
  useEffect(() => {
    let sId = toNumber(getAuthValue('schoolId'));
    let ayId = toNumber(getAuthValue('academicYearId'));
    let tId = toNumber(getAuthValue('teacherId') || getAuthValue('userId'));

    if (!sId || !ayId || !tId) {
      const payload = parseJwtPayload(
        localStorage.getItem('token') || sessionStorage.getItem('token')
      );
      if (payload) {
        if (!sId) sId = toNumber(payload.schoolId || payload.sid);
        if (!ayId) ayId = toNumber(payload.academicYearId || payload.ayi);
        if (!tId) tId = toNumber(payload.teacherId || payload.uid);
      }
    }

    setSchoolId(sId);
    setAcademicYearId(ayId || 6); // Safety Fallback
    setTeacherId(tId);
    console.log("[TeacherWorkspace] Resolved mount session parameters:", { schoolId: sId, academicYearId: ayId || 6, teacherId: tId });
  }, []);

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchTeacherAssignments = async () => {
    if (!schoolId || !teacherId) {
      console.warn("[TeacherWorkspace] fetchTeacherAssignments skipped due to missing credentials:", { schoolId, teacherId });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAssignmentsByTeacher({ schoolId, teacherId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setAssignments(Array.isArray(res.data) ? res.data : []);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.warn("Failed to fetch teacher assignments", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    console.log("[TeacherWorkspace] fetchDropdowns started. Context:", { schoolId, academicYearId, teacherId });
    try {
      if (schoolId && academicYearId) {
        const stdRes = await getAllStandards(schoolId, academicYearId);
        console.log("[TeacherWorkspace] getAllStandards raw response:", stdRes);
        if (stdRes.data && Array.isArray(stdRes.data.data)) {
          setStandards(stdRes.data.data);
        } else if (Array.isArray(stdRes.data)) {
          setStandards(stdRes.data);
        } else if (stdRes.data) {
          setStandards(stdRes.data);
        } else if (Array.isArray(stdRes)) {
          setStandards(stdRes);
        }

        const divRes = await getAllBatches(schoolId, academicYearId);
        console.log("[TeacherWorkspace] getAllBatches raw response:", divRes);
        if (divRes.data && Array.isArray(divRes.data.data)) {
          setDivisions(divRes.data.data);
        } else if (Array.isArray(divRes.data)) {
          setDivisions(divRes.data);
        } else if (divRes.data) {
          setDivisions(divRes.data);
        } else if (Array.isArray(divRes)) {
          setDivisions(divRes);
        }

        const subRes = await getAllSubjectsBySchool({ schoolId, academicYearId });
        console.log("[TeacherWorkspace] getAllSubjectsBySchool raw response:", subRes);
        if (subRes.data && Array.isArray(subRes.data.data)) {
          setSubjects(subRes.data.data);
        } else if (Array.isArray(subRes.data)) {
          setSubjects(subRes.data);
        } else if (subRes.data) {
          setSubjects(subRes.data);
        } else if (Array.isArray(subRes)) {
          setSubjects(subRes);
        }
      } else {
        console.warn("[TeacherWorkspace] fetchDropdowns skipped due to missing parameters.");
      }
    } catch (e) {
      console.error("Error loading dropdown data:", e);
    }
  };

  // Fetch assignments and dropdowns whenever session data becomes active
  useEffect(() => {
    if (schoolId && academicYearId && teacherId) {
      console.log("[TeacherWorkspace] Triggering data fetch for workspace with resolved params.");
      fetchTeacherAssignments();
      fetchDropdowns();
    }
  }, [schoolId, academicYearId, teacherId]);

  // Handle active tab changes
  useEffect(() => {
    if (activeTab === 'manage' && schoolId && teacherId) {
      fetchTeacherAssignments();
    }
  }, [activeTab, schoolId, teacherId]);

  // Fetch class students when Grade and Division are selected
  useEffect(() => {
    const fetchStudents = async () => {
      const stdId = toNumber(createForm.standardId);
      const divId = toNumber(createForm.divisionId);
      if (!schoolId || !stdId || !divId) {
        setStudentsInSection([]);
        setSelectedStudentIds([]);
        return;
      }

      setStudentsLoading(true);
      try {
        const res = await getStudentsBySection({
          schoolId,
          standardId: stdId,
          divisionId: divId
        });
        if (res?.status === 'SUCCESS' || res?.code === 200) {
          setStudentsInSection(Array.isArray(res.data) ? res.data : []);
        } else {
          setStudentsInSection([]);
        }
      } catch (err) {
        console.error("Failed to fetch students by section:", err);
        setStudentsInSection([]);
      } finally {
        setStudentsLoading(false);
        setSelectedStudentIds([]);
      }
    };

    fetchStudents();
  }, [createForm.standardId, createForm.divisionId, schoolId]);

  // Pre-fill study group name with assignment title default
  useEffect(() => {
    if (createForm.title) {
      setGroupName(`${createForm.title} Group`);
    } else {
      setGroupName('');
    }
  }, [createForm.title]);

  const handleLoadSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    try {
      // 1. Fetch submission records
      const subRes = await getSubmissionsByAssignment({
        assignmentId: assignment.id,
        schoolId,
        academicYearId
      });
      const rawSubmissions = (subRes?.status === 'SUCCESS' || subRes?.code === 200) 
        ? (Array.isArray(subRes.data) ? subRes.data : []) 
        : [];

      // 2. Fetch full class roster to show seen/unseen/submitted for ALL students
      let fullRoster = [];
      try {
        const rosterRes = await getStudentsBySection({
          schoolId,
          standardId: Number(assignment.standardId),
          divisionId: Number(assignment.divisionId)
        });
        if (rosterRes?.status === 'SUCCESS' || rosterRes?.code === 200) {
          fullRoster = Array.isArray(rosterRes.data) ? rosterRes.data : [];
        }
      } catch (rosterErr) {
        console.warn("[TeacherWorkspace] Failed to fetch class roster for grading desk:", rosterErr);
      }

      // 3. Merge roster and submissions
      // Map submissions by studentId for fast lookup
      const subMap = new Map(rawSubmissions.map(s => [Number(s.studentId), s]));
      
      const mergedList = fullRoster.map(student => {
        const sub = subMap.get(Number(student.id));
        if (sub) {
          return {
            ...sub,
            studentName: `${student.firstName} ${student.lastName}`,
            rollNumber: student.studentId || student.rollNumber
          };
        } else {
          // If no submission row exists, status is "UNOPENED"
          return {
            id: `unopened-${student.id}`,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            rollNumber: student.studentId || student.rollNumber,
            submissionDate: null,
            fileUrl: null,
            marks: null,
            status: "UNOPENED"
          };
        }
      });

      // Sort mergedList: graded first, then submitted, then seen, then unopened
      const sortedList = mergedList.sort((a, b) => {
        const order = { "SUBMITTED": 1, "GRADED": 2, "SEEN": 3, "UNOPENED": 4 };
        return (order[a.status] || 5) - (order[b.status] || 5);
      });

      setSubmissions(sortedList);
      setActiveTab('grading');
    } catch (err) {
      alert(err.message || "Failed to load submissions.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Create Assignment ─────────────────────────────────────────────────────
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.dueDate || !createForm.standardId || !createForm.divisionId || !createForm.subjectId) {
      alert("Please fill in all required fields.");
      return;
    }

    if (assignToGroup && selectedStudentIds.length === 0) {
      alert("Please select at least one student to create a study group.");
      return;
    }

    setLoading(true);
    try {
      let activeGroupId = null;
      let activeGroupName = null;

      // Orchestrate Study Group creation first if toggle is active
      if (assignToGroup && selectedStudentIds.length > 0) {
        console.log("[TeacherWorkspace] Creating Study Group first...");
        const finalGroupName = groupName.trim() || `${createForm.title} Group`;
        
        const groupRes = await createStudyGroup({
          schoolId,
          academicYearId,
          createdByTeacherId: teacherId,
          groupName: finalGroupName,
          description: `Study group created dynamically for assignment "${createForm.title}"`,
          standardId: Number(createForm.standardId),
          divisionId: Number(createForm.divisionId)
        });

        // The endpoint returns build(200, "SUCCESS", "Study group created successfully", dto)
        const groupData = groupRes.data?.data || groupRes.data;
        const generatedGroupId = groupData?.id;

        if (!generatedGroupId) {
          throw new Error(groupRes.data?.message || "Failed to obtain created Study Group ID from server.");
        }

        console.log("[TeacherWorkspace] Study Group created with ID:", generatedGroupId, ". Adding student members...");

        const memberRes = await addStudentsToGroup({
          schoolId,
          academicYearId,
          studyGroupId: generatedGroupId,
          studentIds: selectedStudentIds
        });

        if (memberRes.data?.status !== 'SUCCESS' && memberRes.data?.code !== 200 && memberRes.status !== 'SUCCESS' && memberRes.code !== 200) {
          throw new Error("Failed to add selected students to the study group.");
        }

        activeGroupId = generatedGroupId;
        activeGroupName = finalGroupName;
        console.log("[TeacherWorkspace] Students successfully added to Study Group. Creating assignment...");
      }

      const payload = {
        schoolId,
        academicYearId,
        teacherId,
        title: createForm.title,
        description: createForm.description,
        dueDate: createForm.dueDate,
        attachmentUrl: createForm.attachmentUrl || null,
        standardId: Number(createForm.standardId),
        divisionId: Number(createForm.divisionId),
        subjectId: Number(createForm.subjectId),
        studyGroupId: activeGroupId,
        studyGroupName: activeGroupName,
        status: 'ACTIVE'
      };

      const res = await createAssignment(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        alert(assignToGroup ? `Assignment published successfully and assigned to Study Group "${activeGroupName}"!` : "Assignment published successfully!");
        
        // Reset states
        setCreateForm({
          title: '',
          description: '',
          dueDate: getTomorrowDateString(),
          attachmentUrl: '',
          standardId: '',
          divisionId: '',
          subjectId: ''
        });
        setAssignToGroup(false);
        setGroupName('');
        setSelectedStudentIds([]);
        setStudentSearchQuery('');
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        setActiveTab('manage');
      } else {
        alert(res?.message || "Failed to publish assignment.");
      }
    } catch (err) {
      alert(err.message || "Something went wrong during dynamic publishing.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Edit Assignment ───────────────────────────────────────────────────────
  const openEditModal = (assignment) => {
    setEditForm({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate,
      attachmentUrl: assignment.attachmentUrl || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: editForm.id,
        schoolId,
        title: editForm.title,
        description: editForm.description,
        dueDate: editForm.dueDate,
        attachmentUrl: editForm.attachmentUrl || null
      };

      const res = await updateAssignment(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        alert("Assignment updated successfully!");
        setShowEditModal(false);
        fetchTeacherAssignments();
      } else {
        alert(res?.message || "Failed to update assignment.");
      }
    } catch (err) {
      alert(err.message || "Something went wrong.");
    }
  };

  // ─── Close Assignment ──────────────────────────────────────────────────────
  const handleCloseAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to close this assignment? No more submissions will be accepted.")) return;
    try {
      const res = await closeAssignment({ id, schoolId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        alert("Assignment closed successfully.");
        fetchTeacherAssignments();
      } else {
        alert(res?.message || "Failed to close assignment.");
      }
    } catch (err) {
      alert(err.message || "Failed to close assignment.");
    }
  };

  // ─── Delete Assignment ─────────────────────────────────────────────────────
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this assignment? All submissions will also be deleted.")) return;
    try {
      const res = await deleteAssignment({ id, schoolId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        alert("Assignment deleted successfully.");
        fetchTeacherAssignments();
      } else {
        alert(res?.message || "Failed to delete assignment.");
      }
    } catch (err) {
      alert(err.message || "Failed to delete assignment.");
    }
  };

  // ─── Submit Grade ──────────────────────────────────────────────────────────
  const openGradingForm = (submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      marks: submission.marks !== null ? submission.marks.toString() : '',
      remarks: submission.remarks || ''
    });
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      const payload = {
        id: gradingSubmission.id,
        marks: Number(gradeForm.marks),
        remarks: gradeForm.remarks
      };

      const res = await gradeSubmission(payload);
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        alert("Submission graded successfully!");
        setGradingSubmission(null);
        // Refresh submissions
        if (selectedAssignment) handleLoadSubmissions(selectedAssignment);
      } else {
        alert(res?.message || "Failed to submit grades.");
      }
    } catch (err) {
      alert(err.message || "Failed to grade submission.");
    }
  };

  return (
    <div className="student-page-container fade-in space-y-8" style={{ padding: '30px', background: '#f4f7fb', minHeight: '100vh' }}>
      <style>{`
        .badge-active { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-closed { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .badge-completed { background: #ffedd5; color: #ea580c; border: 1px solid #fed7aa; }
        .grading-action-card {
          margin-top: 20px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
        }
      `}</style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '28px', color: '#1e293b', fontWeight: '700', margin: 0 }}>
          Assignments Workspace
        </h1>
        <p className="page-subtitle" style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          Create homework, manage active boards, and grade student submissions
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="workspace-tabs" style={{ display: 'flex', gap: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0', marginBottom: '24px' }}>
        <button 
          className={`workspace-tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => { setActiveTab('manage'); setSelectedAssignment(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: 'none', background: 'transparent',
            fontSize: '15px', fontWeight: '600', color: activeTab === 'manage' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'manage' ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer'
          }}
        >
          <BiLaptop /> Manage Assignments
        </button>
        <button 
          className={`workspace-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => { setActiveTab('create'); setSelectedAssignment(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: 'none', background: 'transparent',
            fontSize: '15px', fontWeight: '600', color: activeTab === 'create' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'create' ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer'
          }}
        >
          <BiPlusCircle /> Publish Assignment
        </button>
        <button 
          className={`workspace-tab ${activeTab === 'grading' ? 'active' : ''}`}
          disabled={!selectedAssignment}
          onClick={() => setActiveTab('grading')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: 'none', background: 'transparent',
            fontSize: '15px', fontWeight: '600', color: activeTab === 'grading' ? '#2563eb' : '#94a3b8',
            borderBottom: activeTab === 'grading' ? '3px solid #2563eb' : '3px solid transparent', 
            cursor: selectedAssignment ? 'pointer' : 'not-allowed', opacity: selectedAssignment ? 1 : 0.6
          }}
        >
          <BiBookOpen /> Grading Desk {selectedAssignment && `(${selectedAssignment.title})`}
        </button>
      </div>

      {/* Main Panel View */}
      <div className="workspace-view-container">
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '15px', color: '#64748b', fontWeight: '500' }}>Fetching academic workspace...</p>
          </div>
        ) : (
          <div className="fade-in">
            
            {/* TAB 1: MANAGE ASSIGNMENTS */}
            {activeTab === 'manage' && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                
                {/* Dynamic Stats Cards */}
                {assignments.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><BiFile /></div>
                      <div>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e3a8a', textTransform: 'uppercase' }}>Total Tasks</span>
                        <strong style={{ fontSize: '22px', color: '#1e293b' }}>{assignments.length}</strong>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><BiCheckCircle /></div>
                      <div>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase' }}>Active Tasks</span>
                        <strong style={{ fontSize: '22px', color: '#1e293b' }}>{assignments.filter(a => a.status === 'ACTIVE' && !isPastDue(a.dueDate)).length}</strong>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#475569', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}><BiXCircle /></div>
                      <div>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>Closed Tasks</span>
                        <strong style={{ fontSize: '22px', color: '#1e293b' }}>{assignments.filter(a => a.status !== 'ACTIVE' || isPastDue(a.dueDate)).length}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters Row */}
                {assignments.length > 0 && (
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '12px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}><BiFilterAlt /> Filters:</span>
                    <select
                      value={filterStandard}
                      onChange={(e) => setFilterStandard(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', background: 'white', minWidth: '150px' }}
                    >
                      <option value="">All Grades</option>
                      {standards.map(s => <option key={s.standardId} value={s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                    </select>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', background: 'white', minWidth: '150px' }}
                    >
                      <option value="">All Subjects</option>
                      {subjects.map(sub => <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>)}
                    </select>
                    {(filterStandard || filterSubject) && (
                      <button 
                        onClick={() => { setFilterStandard(''); setFilterSubject(''); }}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}

                {assignments.length === 0 ? (
                  <div style={{ padding: '50px', textAlign: 'center' }}>
                    <BiFile size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                    <h3 style={{ margin: 0, color: '#475569' }}>No assignments uploaded</h3>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Click 'Publish Assignment' to issue your first academic tasks.</p>
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div style={{ padding: '50px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                    <BiFilterAlt size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                    <h3 style={{ margin: 0, color: '#475569' }}>No matching tasks found</h3>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Try clearing your filters or select a different Grade / Subject.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                          <th style={{ padding: '12px 16px' }}>Assignment Title</th>
                          <th style={{ padding: '12px 16px' }}>Subject</th>
                          <th style={{ padding: '12px 16px' }}>Class / Section</th>
                          <th style={{ padding: '12px 16px' }}>Due Date</th>
                          <th style={{ padding: '12px 16px' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' }}>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: '#1e293b' }}>{item.title}</strong>
                                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.description || 'No description provided'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>{item.subjectName || 'General'}</td>
                            <td style={{ padding: '16px' }}>
                              {item.standardName} - {item.divisionName}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <BiTimeFive /> {new Date(item.dueDate).toLocaleDateString()}
                              </span>
                            </td>
                            <td style={{ padding: '16px' }}>
                              {(() => {
                                const overdue = isPastDue(item.dueDate);
                                const displayStatus = overdue ? 'COMPLETED' : item.status;
                                return (
                                  <span style={{ 
                                    padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                                    textTransform: 'uppercase'
                                  }} className={displayStatus === 'ACTIVE' ? 'badge-active' : displayStatus === 'COMPLETED' ? 'badge-completed' : 'badge-closed'}>
                                    {displayStatus}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button 
                                  onClick={() => handleLoadSubmissions(item)}
                                  style={{
                                    background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', 
                                    borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px'
                                  }}
                                  title="Assess student submissions"
                                >
                                  Assess Submissions
                                </button>
                                <button 
                                  onClick={() => openEditModal(item)}
                                  style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Edit Assignment"
                                >
                                  <BiEdit size={16} />
                                </button>
                                {item.status === 'ACTIVE' && !isPastDue(item.dueDate) && (
                                  <button 
                                    onClick={() => handleCloseAssignment(item.id)}
                                    style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                    title="Close Submissions"
                                  >
                                    <BiXCircle size={16} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteAssignment(item.id)}
                                  style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Delete Permanent"
                                >
                                  <BiTrash size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CREATE ASSIGNMENT */}
            {activeTab === 'create' && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', maxWidth: '680px', margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BiCloudUpload size={24} color="#2563eb" /> Broadcast Homework Task
                </h2>
                <form onSubmit={handleCreateAssignment}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Target Grade (Standard)*</label>
                      <select 
                        required
                        value={createForm.standardId}
                        onChange={(e) => setCreateForm({ ...createForm, standardId: e.target.value, divisionId: '', subjectId: '' })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                      >
                        <option value="">Select Grade</option>
                        {standards.map(s => <option key={s.standardId} value={s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Target Section (Division)*</label>
                      <select 
                        required
                        disabled={!createForm.standardId}
                        value={createForm.divisionId}
                        onChange={(e) => setCreateForm({ ...createForm, divisionId: e.target.value, subjectId: '' })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px', background: !createForm.standardId ? '#f1f5f9' : 'white', cursor: !createForm.standardId ? 'not-allowed' : 'default' }}
                      >
                        <option value="">{!createForm.standardId ? "Select Grade first" : "Select Section"}</option>
                        {createForm.standardId && divisions
                          .filter(d => Number(d.standardId) === Number(createForm.standardId))
                          .map(d => (
                            <option key={d.batchId || d.divisionId || d.id} value={d.batchId || d.divisionId || d.id}>
                              {d.batchName || d.divisionName || d.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Academic Subject*</label>
                      <select 
                        required
                        disabled={!createForm.standardId || !createForm.divisionId}
                        value={createForm.subjectId}
                        onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px', background: (!createForm.standardId || !createForm.divisionId) ? '#f1f5f9' : 'white', cursor: (!createForm.standardId || !createForm.divisionId) ? 'not-allowed' : 'default' }}
                      >
                        <option value="">{!createForm.standardId || !createForm.divisionId ? "Select Grade & Section first" : "Select Subject"}</option>
                        {subjects
                          .filter(sub => 
                            Number(sub.teacherId) === Number(teacherId) && 
                            Number(sub.standardId) === Number(createForm.standardId) && 
                            Number(sub.divisionId) === Number(createForm.divisionId)
                          )
                          .map(sub => <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>)
                        }
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Due Date*</label>
                      <input 
                        type="date"
                        required
                        value={createForm.dueDate}
                        onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                        style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Assignment Title*</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Calculus Practice Set 4"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Instructions & Description</label>
                    <textarea 
                      placeholder="Provide detailed instructions or homework text..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      rows="4"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }}
                    />
                  </div>

                {/* STUDY GROUP SELECTION BLOCK */}
                {createForm.standardId && createForm.divisionId && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox"
                          id="assign-to-group-toggle"
                          checked={assignToGroup}
                          onChange={(e) => {
                            setAssignToGroup(e.target.checked);
                            if (e.target.checked && !groupName) {
                              setGroupName(`${createForm.title || 'Assignment'} Group`);
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                        <label htmlFor="assign-to-group-toggle" style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                          Assign to a Study Group (Optional)
                        </label>
                      </div>
                      {assignToGroup && (
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '12px' }}>
                          {selectedStudentIds.length} Selected
                        </span>
                      )}
                    </div>

                    {assignToGroup && (
                      <div style={{ marginTop: '14px', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontWeight: '600', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Study Group Name*</label>
                          <input 
                            type="text"
                            required={assignToGroup}
                            placeholder="e.g. Science Project Group A"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px' }}
                          />
                        </div>

                        <label style={{ display: 'block', fontWeight: '600', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>Select Student Members*</label>
                        
                        {/* Search & Bulk Actions Bar */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <input 
                            type="text"
                            placeholder="Search student name..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedStudentIds(studentsInSection.map(s => s.id))}
                            style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentIds([])}
                            style={{ border: 'none', background: '#fef2f2', color: '#ef4444', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Clear
                          </button>
                        </div>

                        {studentsLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                            Loading student roster...
                          </div>
                        ) : studentsInSection.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                            No students found in this section.
                          </div>
                        ) : (
                          <div style={{
                            maxHeight: '160px',
                            overflowY: 'auto',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '8px',
                            background: 'white'
                          }}>
                            {studentsInSection
                              .filter(s => {
                                const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
                                return fullName.includes(studentSearchQuery.toLowerCase());
                              })
                              .map(student => {
                                const isChecked = selectedStudentIds.includes(student.id);
                                return (
                                  <div 
                                    key={student.id}
                                    onClick={() => {
                                      if (isChecked) {
                                        setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                      } else {
                                        setSelectedStudentIds(prev => [...prev, student.id]);
                                      }
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      background: isChecked ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                                      transition: 'background 0.2s',
                                      marginBottom: '2px',
                                      textAlign: 'left'
                                    }}
                                    className="hover-effect"
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: isChecked ? '600' : '500', color: isChecked ? '#2563eb' : '#334155' }}>
                                      {student.firstName} {student.lastName}
                                    </span>
                                    {(student.studentId || student.rollNumber) && (
                                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                                        ID: {student.studentId || student.rollNumber}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                  <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569', margin: 0 }}>Reference File / Attachment Link (PDF/Doc/Drive URL)*</label>
                      <div style={{ display: 'inline-flex', gap: '2px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                        <button
                          type="button"
                          onClick={() => { setUploadMode('url'); handleRemoveFile(); }}
                          style={{ border: 'none', background: uploadMode === 'url' ? 'white' : 'transparent', color: uploadMode === 'url' ? '#2563eb' : '#64748b', padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', cursor: 'pointer', transition: '0.2s' }}
                        >
                          Link URL
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadMode('upload'); handleRemoveFile(); }}
                          style={{ border: 'none', background: uploadMode === 'upload' ? 'white' : 'transparent', color: uploadMode === 'upload' ? '#2563eb' : '#64748b', padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', cursor: 'pointer', transition: '0.2s' }}
                        >
                          Upload File
                        </button>
                      </div>
                    </div>

                    {uploadMode === 'url' ? (
                      <div>
                        <input 
                          type="url"
                          placeholder="https://example.com/worksheet.pdf"
                          value={createForm.attachmentUrl}
                          onChange={(e) => setCreateForm({ ...createForm, attachmentUrl: e.target.value })}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                        />
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Include a direct link to any worksheets or reading materials students will need.</p>
                      </div>
                    ) : (
                      <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '15px', textAlign: 'center', background: '#f8fafc', position: 'relative' }}>
                        {selectedFile ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', maxWidth: '100%', overflow: 'hidden' }}>
                              <BiFile size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                              {!isUploading && (
                                <button
                                  type="button"
                                  onClick={handleRemoveFile}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 4px', fontWeight: 'bold' }}
                                >
                                  &times;
                                </button>
                              )}
                            </div>

                            {isUploading ? (
                              <div style={{ width: '100%', maxWidth: '240px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                                  <span>Uploading worksheet...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#2563eb', transition: 'width 0.1s linear' }} />
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <BiCheckCircle /> Upload complete! Reference link generated.
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id="homework-file-upload"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                            />
                            <label
                              htmlFor="homework-file-upload"
                              style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                              <BiCloudUpload size={32} color="#64748b" />
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>Click to select a file</span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>PDF, Docx, PPT, or Images up to 20MB</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    style={{
                      width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none',
                      borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
                      transition: '0.2s', boxShadow: '0 4px 10px rgba(37,99,235,0.2)'
                    }}
                  >
                    Publish Assignment
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: GRADING DESK */}
            {activeTab === 'grading' && selectedAssignment && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>{selectedAssignment.subjectName}</span>
                    <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{selectedAssignment.title} Submissions</h2>
                    <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>Class: {selectedAssignment.standardName} - {selectedAssignment.divisionName}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('manage')}
                    style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    ← Back to List
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div style={{ padding: '50px', textAlign: 'center' }}>
                    <BiCommentDetail size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                    <h3 style={{ margin: 0, color: '#475569' }}>No student submissions yet</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Submissions will populate here once completed by class students.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: gradingSubmission ? '1fr 320px' : '1fr', gap: '20px' }}>
                    
                    {/* Submissions Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                            <th style={{ padding: '12px 16px' }}>Student Name</th>
                            <th style={{ padding: '12px 16px' }}>Submitted On</th>
                            <th style={{ padding: '12px 16px' }}>Attachment</th>
                            <th style={{ padding: '12px 16px' }}>Marks</th>
                            <th style={{ padding: '12px 16px' }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((sub) => (
                            <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyValue: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>
                                    {sub.studentName?.substring(0,2).toUpperCase() || 'ST'}
                                  </div>
                                  <strong style={{ color: '#1e293b' }}>{sub.studentName}</strong>
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                {sub.submissionDate ? new Date(sub.submissionDate).toLocaleString() : '-'}
                              </td>
                              <td style={{ padding: '16px' }}>
                                {sub.fileUrl ? (
                                  <a 
                                    href={sub.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <BiFile /> View Submission
                                  </a>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '16px', fontWeight: '700' }}>
                                {sub.marks !== null ? `${sub.marks}` : '-'}
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{ 
                                  padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                                  textTransform: 'uppercase',
                                  background: sub.status === 'GRADED' ? '#dcfce7' 
                                            : sub.status === 'SUBMITTED' ? '#fef9c3'
                                            : sub.status === 'SEEN' ? '#dbeafe'
                                            : '#fee2e2',
                                  color: sub.status === 'GRADED' ? '#15803d' 
                                       : sub.status === 'SUBMITTED' ? '#854d0e'
                                       : sub.status === 'SEEN' ? '#1e40af'
                                       : '#b91c1c'
                                }}>
                                  {sub.status === 'UNOPENED' ? 'UNOPENED'
                                   : sub.status === 'SEEN' ? 'OPENED / SEEN'
                                   : sub.status || 'SUBMITTED'}
                                </span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                {(sub.status === 'SUBMITTED' || sub.status === 'GRADED') ? (
                                  <button 
                                    onClick={() => openGradingForm(sub)}
                                    style={{
                                      background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px',
                                      borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px'
                                    }}
                                  >
                                    {sub.status === 'GRADED' ? 'Edit Grade' : 'Assess'}
                                  </button>
                                ) : (
                                  <button 
                                    disabled
                                    style={{
                                      background: '#f1f5f9', color: '#94a3b8', border: 'none', padding: '6px 12px',
                                      borderRadius: '6px', cursor: 'not-allowed', fontWeight: '600', fontSize: '12px'
                                    }}
                                  >
                                    No Work
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Grading Entry Sidebar Panel */}
                    {gradingSubmission && (
                      <div className="grading-action-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Grade Work</h3>
                          <button onClick={() => setGradingSubmission(null)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>
                        <p style={{ margin: '0 0 15px', fontSize: '13px', color: '#64748b' }}>Assessing submission for <strong>{gradingSubmission.studentName}</strong></p>
                        
                        <form onSubmit={handleSaveGrade}>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Score/Marks*</label>
                            <input 
                              type="number"
                              required
                              min="0"
                              placeholder="e.g. 95"
                              value={gradeForm.marks}
                              onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                            />
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: '600', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Remarks / Feedback</label>
                            <textarea 
                              placeholder="Great effort! Fully complete."
                              value={gradeForm.remarks}
                              onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })}
                              rows="3"
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '13px', fontFamily: 'inherit' }}
                            />
                          </div>

                          <button 
                            type="submit"
                            style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Submit Assessment
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL DIALOG */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Edit Assignment</h2>
              <button onClick={() => setShowEditModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateAssignment}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Assignment Title*</label>
                <input 
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Instructions / Description</label>
                <textarea 
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Due Date*</label>
                <input 
                  type="date"
                  required
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>File Link / Attachment URL</label>
                <input 
                  type="url"
                  value={editForm.attachmentUrl}
                  onChange={(e) => setEditForm({ ...editForm, attachmentUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  style={{ background: 'transparent', border: '1.5px solid #cbd5e1', color: '#64748b', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWorkspace;
