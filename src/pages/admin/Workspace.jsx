import React, { useState, useEffect } from 'react';
import { 
  BiBookOpen, BiCheckCircle, BiUser, 
  BiTimeFive, BiFile, BiFilterAlt, BiInfoCircle 
} from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import { getActiveAssignments, getSubmissionsByAssignment, getStudentsBySection } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

const AdminWorkspace = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');

  // Engagement tracking states
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementRoster, setEngagementRoster] = useState([]);

  const handleViewEngagement = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowEngagementModal(true);
    setEngagementLoading(true);
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

      // 2. Fetch class roster
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
        console.warn("[AdminWorkspace] Failed to fetch class roster:", rosterErr);
      }

      // 3. Merge Roster & Submissions
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

      // Sort
      const sortedList = mergedList.sort((a, b) => {
        const order = { "SUBMITTED": 1, "GRADED": 2, "SEEN": 3, "UNOPENED": 4 };
        return (order[a.status] || 5) - (order[b.status] || 5);
      });

      setEngagementRoster(sortedList);
    } catch (err) {
      console.error(err);
    } finally {
      setEngagementLoading(false);
    }
  };

  // Extract Session Data with fallbacks
  let schoolId = toNumber(getAuthValue('schoolId'));
  let academicYearId = toNumber(getAuthValue('academicYearId'));

  if (!schoolId || !academicYearId) {
    const payload = parseJwtPayload(
      localStorage.getItem('token') || sessionStorage.getItem('token')
    );
    if (payload) {
      if (!schoolId) schoolId = toNumber(payload.schoolId || payload.sid);
      if (!academicYearId) academicYearId = toNumber(payload.academicYearId || payload.ayi);
    }
  }

  // Safety fallback
  if (!academicYearId) academicYearId = 6;

  const fetchActiveAssignments = async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getActiveAssignments({ schoolId, academicYearId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setAssignments(Array.isArray(res.data) ? res.data : []);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.warn("Failed to fetch active assignments for school", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAssignments();
  }, [schoolId, academicYearId]);

  // Filters calculation
  const subjectsList = ['ALL', ...new Set(assignments.map(a => a.subjectName).filter(Boolean))];

  const filteredAssignments = assignments.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.teacherName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'ALL' || item.subjectName === filterSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="workspace-page space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Assignments Registry
          </h1>
          <p className="text-sm text-slate-500">
            Academic Monitoring &gt; Homework Broadcasts
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BiBookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Homework tasks</p>
            <h3 className="mt-1 font-['Lexend'] text-2xl font-extrabold text-slate-900">{assignments.length}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BiCheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Subjects</p>
            <h3 className="mt-1 font-['Lexend'] text-2xl font-extrabold text-slate-900">{subjectsList.length - 1}</h3>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Search assignments or teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <BiFilterAlt className="text-slate-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {subjectsList.map(sub => (
                <option key={sub} value={sub}>{sub === 'ALL' ? 'All Subjects' : sub}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '15px', color: '#64748b', fontWeight: '500' }}>Fetching academic registry...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
            <BiInfoCircle size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: 0, color: '#475569' }}>No active assignments</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>There are currently no active assignments broadcasted by teachers.</p>
          </div>
        ) : (
          <DataTable 
            headers={['Assignment/Title', 'Class & Division', 'Subject', 'Due Date', 'Published By', 'Resource Link', 'Engagement']}
            data={filteredAssignments}
            renderRow={(item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: '#1e293b', fontSize: '14px' }}>{item.title}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.description || 'No description'}</span>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  {item.standardName} - {item.divisionName}
                </td>
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  {item.subjectName || 'General'}
                </td>
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <BiTimeFive /> {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <BiUser /> {item.teacherName || 'Faculty Teacher'}
                  </span>
                </td>
                <td>
                  {item.attachmentUrl ? (
                    <a 
                      href={item.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                    >
                      <BiFile /> View Attachment
                    </a>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>None</span>
                  )}
                </td>
                <td>
                  <button 
                    onClick={() => handleViewEngagement(item)}
                    style={{
                      background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', 
                      borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                    className="hover-effect"
                  >
                    Track View
                  </button>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Dynamic Engagement / Seen Tracking Modal */}
      {showEngagementModal && selectedAssignment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px', flexShrink: 0 }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>{selectedAssignment.subjectName}</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Engagement: {selectedAssignment.title}</h2>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>Class: {selectedAssignment.standardName} - {selectedAssignment.divisionName} • Published by: {selectedAssignment.teacherName || 'Faculty'}</p>
              </div>
              <button onClick={() => { setShowEngagementModal(false); setSelectedAssignment(null); }} style={{ border: 'none', background: 'transparent', fontSize: '28px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
            </div>

            {engagementLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', flex: 1 }}>
                <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ marginTop: '12px', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Fetching roster seen status...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Stats Summary Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '16px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Roster</span>
                    <strong style={{ fontSize: '16px', color: '#1e293b' }}>{engagementRoster.length}</strong>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }}>Graded</span>
                    <strong style={{ fontSize: '16px', color: '#15803d' }}>{engagementRoster.filter(r => r.status === 'GRADED').length}</strong>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>Subm.</span>
                    <strong style={{ fontSize: '16px', color: '#b45309' }}>{engagementRoster.filter(r => r.status === 'SUBMITTED').length}</strong>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>Seen</span>
                    <strong style={{ fontSize: '16px', color: '#1e40af' }}>{engagementRoster.filter(r => r.status === 'SEEN').length}</strong>
                  </div>
                </div>

                {/* Roster List Scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px' }}>
                  {engagementRoster.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No student roster found.</div>
                  ) : (
                    engagementRoster.map(student => (
                      <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '11px' }}>
                            {student.studentName?.substring(0,2).toUpperCase()}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ color: '#334155' }}>{student.studentName}</strong>
                            {student.rollNumber && <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>(ID: {student.rollNumber})</span>}
                          </div>
                        </div>

                        <span style={{ 
                          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                          textTransform: 'uppercase',
                          background: student.status === 'GRADED' ? '#dcfce7' 
                                    : student.status === 'SUBMITTED' ? '#fef9c3'
                                    : student.status === 'SEEN' ? '#dbeafe'
                                    : '#fee2e2',
                          color: student.status === 'GRADED' ? '#15803d' 
                               : student.status === 'SUBMITTED' ? '#854d0e'
                               : student.status === 'SEEN' ? '#1e40af'
                               : '#b91c1c'
                        }}>
                          {student.status === 'UNOPENED' ? 'UNOPENED'
                           : student.status === 'SEEN' ? 'OPENED / SEEN'
                           : student.status || 'SUBMITTED'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkspace;
