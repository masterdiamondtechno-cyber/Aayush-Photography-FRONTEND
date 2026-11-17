import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BiFile, 
  BiPlus, 
  BiEditAlt, 
  BiTrash, 
  BiDownload, 
  BiSearch, 
  BiBookOpen, 
  BiCalendar, 
  BiCheckCircle, 
  BiX, 
  BiCheck, 
  BiLoader,
  BiUser,
  BiBuildings,
  BiFilterAlt,
  BiUpload
} from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import {
  getSyllabusStats, 
  getAllSyllabus, 
  createSyllabus, 
  updateSyllabus,
  deleteSyllabus, 
  downloadSyllabus, 
  getAllStandards, 
  getAllTeachers,
  getSubjectsForTimetable,
  updateSyllabusProgress
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';

/**
 * Parses JWT token payloads safely
 */
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

/**
 * Sanitizes and parses number formats
 */
const toNumber = (v) => {
  if (v === null || v === undefined || v === 'undefined' || v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const Syllabus = () => {
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dashboard & Listing States
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Data from API
  const [stats, setStats] = useState({ totalSyllabus: 0, active: 0, completed: 0, draft: 0, overallProgress: 0 });
  const [syllabusData, setSyllabusData] = useState([]);

  // Roster Dropdowns Lookup
  const [standards, setStandards] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form states
  const emptyForm = { 
    title: '', 
    standardId: '', 
    subjectId: '', 
    teacherId: '', 
    totalChapters: '', 
    completedChapters: 0,
    status: 'ACTIVE' 
  };
  const [formData, setFormData] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Parse session properties safely using getAuthValue
  const schoolId = toNumber(getAuthValue('schoolId'));
  const academicYearId = toNumber(getAuthValue('academicYearId')) || 6;

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ message: msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Fetch full list of syllabus cards & metrics
  const fetchAll = useCallback(async () => {
    if (!schoolId || !academicYearId) return;
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        getSyllabusStats({ schoolId, academicYearId }),
        getAllSyllabus({ 
          schoolId, 
          academicYearId, 
          status: filterStatus === 'All' ? null : filterStatus.toUpperCase() 
        })
      ]);
      if (statsRes && statsRes.data) setStats(statsRes.data);
      if (listRes && listRes.data && Array.isArray(listRes.data)) {
        setSyllabusData(listRes.data);
      } else {
        setSyllabusData([]);
      }
    } catch (err) {
      console.error('Error fetching syllabus dataset:', err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId, filterStatus]);

  // Load all lightweight master relational arrays (standards, teachers, subjects)
  const loadDropdowns = useCallback(async () => {
    if (!schoolId || !academicYearId) return;
    try {
      const [stdRes, tchRes, subRes] = await Promise.all([
        getAllStandards(schoolId, academicYearId),
        getAllTeachers(schoolId, academicYearId),
        getSubjectsForTimetable({ schoolId, academicYearId })
      ]);
      if (stdRes && stdRes.data) setStandards(Array.isArray(stdRes.data) ? stdRes.data : []);
      if (tchRes && tchRes.data) setTeachers(Array.isArray(tchRes.data) ? tchRes.data : []);
      if (subRes && subRes.data) setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
    } catch (err) {
      console.error('Error loading master relational dropdowns:', err);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    fetchAll();
    loadDropdowns();
  }, [fetchAll, loadDropdowns]);

  // Trigger modal when router preSelect state is passed
  useEffect(() => {
    if (location.state?.preSelectClassId || location.state?.preSelectSubjectId) {
      setEditingSyllabus(null);
      setFormData({
        title: '',
        standardId: String(location.state.preSelectClassId || ''),
        subjectId: String(location.state.preSelectSubjectId || ''),
        teacherId: String(location.state.preSelectTeacherId || ''),
        totalChapters: '',
        status: 'ACTIVE'
      });
      setSelectedFile(null);
      setShowModal(true);
    }
  }, [location, standards, subjects]);

  // Handle onboarding modal edits & new creation setups
  const handleAdd = () => {
    setEditingSyllabus(null);
    setFormData(emptyForm);
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleEdit = (syl) => {
    setEditingSyllabus(syl);
    setFormData({
      title: syl.title || '',
      standardId: syl.standardId || '',
      subjectId: syl.subjectId || '',
      teacherId: syl.teacherId || '',
      totalChapters: syl.totalChapters || '',
      completedChapters: syl.completedChapters || 0,
      status: syl.status || 'ACTIVE'
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  // Enforces cascading filters and subject-teacher relationship auto-fills
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'standardId') {
      // 1. Grade standard changes -> Reset subject & teacher choices to prevent invalid placement
      setFormData(prev => ({
        ...prev,
        standardId: value,
        subjectId: '',
        teacherId: ''
      }));
    } else if (name === 'subjectId') {
      // 2. Subject changes -> Automatically extract the pre-assigned teacher for this subject
      const selectedSub = subjects.find(sub => String(sub.id || sub.subjectId) === String(value));
      const autoTeacherId = selectedSub?.teacherId || '';
      
      setFormData(prev => ({
        ...prev,
        subjectId: value,
        teacherId: autoTeacherId
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.standardId || !formData.subjectId || !formData.teacherId || !formData.totalChapters) {
      showFeedback('Please complete all relational dropdown assignments.', 'error');
      return;
    }

    setProcessing(true);
    try {
      const fd = new FormData();
      if (editingSyllabus) {
        fd.append('id', editingSyllabus.id);
      }
      fd.append('schoolId', schoolId);
      fd.append('academicYearId', academicYearId);
      fd.append('title', formData.title || `${standards.find(s=>String(s.standardId || s.id)===String(formData.standardId))?.standard || 'Class'} - ${subjects.find(sub=>String(sub.id || sub.subjectId)===String(formData.subjectId))?.subjectName || 'Subject'} Roster`);
      fd.append('subjectId', formData.subjectId);
      fd.append('standardId', formData.standardId);
      fd.append('teacherId', formData.teacherId);
      fd.append('totalChapters', formData.totalChapters);
      fd.append('status', formData.status);

      // Verify file requirement on new creation
      if (selectedFile) {
        if (selectedFile.size > 100 * 1024 * 1024) {
          showFeedback('File size exceeds the 100MB administrative limit.', 'error');
          setProcessing(false);
          return;
        }
        fd.append('file', selectedFile);
      } else if (!editingSyllabus) {
        showFeedback('A syllabus curriculum file is required.', 'error');
        setProcessing(false);
        return;
      }

      let res;
      if (editingSyllabus) {
        res = await updateSyllabus(fd);
        if (res && (res.status === 'SUCCESS' || res.code === 200)) {
          if (formData.completedChapters !== undefined && formData.completedChapters !== '') {
            await updateSyllabusProgress({
              id: Number(editingSyllabus.id),
              schoolId: Number(schoolId),
              completedChapters: Number(formData.completedChapters)
            });
          }
        }
      } else {
        res = await createSyllabus(fd);
      }

      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        showFeedback(editingSyllabus ? 'Syllabus updated successfully!' : 'Syllabus assigned successfully!');
        setShowModal(false);
        fetchAll();
      } else {
        showFeedback(res?.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Error assigning syllabus:', err);
      console.log('--- SYLLABUS ERROR DETAILS ---');
      console.log('Status:', err.response?.status);
      console.log('Response Data:', err.response?.data);
      console.log('Error Message:', err.message);
      
      // Extract structured Spring Boot exception messages
      const serverMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Syllabus assignment transaction failed.';
      showFeedback(serverMessage, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (syl) => {
    if (!window.confirm(`Are you sure you want to delete the syllabus assignment for "${syl.title}"?`)) return;
    try {
      const res = await deleteSyllabus({ id: syl.id, schoolId });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        showFeedback('Syllabus assignment revoked.');
        fetchAll();
      } else {
        showFeedback(res?.message || 'Revoke failed', 'error');
      }
    } catch (err) {
      console.error('Error revoking syllabus:', err);
      showFeedback('Failed to revoke syllabus assignment.', 'error');
    }
  };

  const handleDownload = async (syl) => {
    try {
      const res = await downloadSyllabus({ id: syl.id, schoolId });
      const dlUrl = res.data?.downloadUrl || res.downloadUrl;
      if (dlUrl) {
        window.open(dlUrl, '_blank');
      } else {
        showFeedback('Download URL unavailable for this file.', 'error');
      }
    } catch (err) {
      console.error('Error generating presigned download link:', err);
      showFeedback('Failed to retrieve presigned file link.', 'error');
    }
  };

  // Filter local listings based on search term and dropdown selections
  const filtered = syllabusData.filter(s => {
    const matchesSearch = ((s.title || '') + (s.teacherName || '') + (s.subjectName || '')).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'All' || String(s.standardId) === String(filterClass);
    const matchesSubject = filterSubject === 'All' || String(s.subjectId) === String(filterSubject);
    return matchesSearch && matchesClass && matchesSubject;
  });

  // Calculate filtered subjects matching selected standard for onboarding modal
  const filteredSubjectsForForm = subjects.filter(sub => 
    String(sub.standardId || sub.id) === String(formData.standardId)
  );

  const StatCard = ({ icon: Icon, color, label, value, bg }) => (
    <div className="card syl-shadow-sm" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1.25rem', 
      padding: '1.5rem', 
      borderRadius: '20px', 
      border: 'none', 
      borderLeft: `5px solid ${color}`,
      background: 'white', 
      boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; }}
    >
      <div style={{ 
        width: '52px', 
        height: '52px', 
        borderRadius: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: bg,
        flexShrink: 0
      }}>
        <Icon size={26} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ color: '#0f172a', fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="syllabus-page space-y-8">
      {feedback && (
        <div className={`syl-toast ${feedback.type}`}>{feedback.type === 'success' ? <BiCheck /> : <BiX />} {feedback.message}</div>
      )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Syllabus Registry</h1>
            <p className="text-sm text-slate-500">Academic &gt; Syllabus Management</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            onClick={handleAdd}
          >
            <BiPlus className="text-lg" /> Assign Syllabus
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BiFile} color="var(--primary)" label="Total Assigned" value={stats.totalSyllabus || 0} bg="rgba(93,95,239,0.1)" />
          <StatCard icon={BiBookOpen} color="#3b82f6" label="Active" value={stats.active || 0} bg="rgba(59,130,246,0.1)" />
          <StatCard icon={BiCheckCircle} color="#10b981" label="Completed" value={stats.completed || 0} bg="rgba(16,185,129,0.1)" />
          <StatCard icon={BiCalendar} color="#f59e0b" label="Overall Progress" value={`${stats.overallProgress || 0}%`} bg="rgba(245,158,11,0.1)" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[150px]">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <BiBuildings className="text-indigo-600" /> Class Grade
                  </label>
                  <select
                    value={filterClass}
                    onChange={e => { setFilterClass(e.target.value); setFilterSubject('All'); }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="All">All Classes</option>
                    {standards.map(c => (
                      <option key={c.standardId || c.id} value={c.standardId || c.id}>{c.standard || c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px', flex: '1 1 auto' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BiBookOpen style={{ color: '#3b82f6', fontSize: '0.9rem' }} /> Subject Assignment
                  </label>
                  <select 
                    className="syl-form-control" 
                    value={filterSubject} 
                    onChange={e => setFilterSubject(e.target.value)} 
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 1rem', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}
                  >
                    <option value="All">All Subjects</option>
                    {subjects
                      .filter(sub => filterClass === 'All' || String(sub.standardId || sub.id) === String(filterClass))
                      .map(sub => (
                        <option key={sub.id || sub.subjectId} value={sub.id || sub.subjectId}>{sub.subjectName || sub.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: '1 1 auto' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BiFilterAlt style={{ color: '#f59e0b', fontSize: '0.9rem' }} /> Curriculum Status
                  </label>
                  <select 
                    className="syl-form-control" 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)} 
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 1rem', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

              </div>

              {/* Right: search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '260px', flex: '0 1 auto' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BiSearch style={{ color: '#64748b', fontSize: '0.9rem' }} /> Search Keyword
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <BiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }} />
                  <input 
                    type="text" 
                    placeholder="Search teacher or title..." 
                    className="syl-form-control" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={{ paddingLeft: '2.6rem', width: '100%', borderRadius: '12px', border: '1.5px solid #e2e8f0', paddingRight: '1rem', height: '42px', boxSizing: 'border-box', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>
            </div>

            {/* DataTable Grid */}
            <div className="syl-table-container">
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'4rem', color:'#64748b' }}>
                <BiLoader className="syl-spinner" style={{ fontSize: '2.5rem', color:'var(--primary)' }} />
                <p className="mt-1 font-semibold" style={{ marginTop: '1rem', fontWeight: 600 }}>Gathering curriculum roster...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center" style={{ padding: '5rem 2rem', background: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: '24px', margin: '2rem' }}>
                <BiFile style={{ fontSize: '3.5rem', color: '#94a3b8', marginBottom: '1.25rem', opacity: 0.5 }} />
                <h3 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Syllabus Materials Assigned</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0', fontWeight: 500 }}>There are no active course curriculum assignments matching your filters.</p>
                <button className="btn btn-primary" onClick={handleAdd} style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', fontWeight: 600 }}><BiPlus /> Assign Your First Syllabus</button>
              </div>
            ) : (
              <DataTable
                headers={[
                  'Syllabus Title', 'Subject & Class', 'Assigned Teacher',
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '120px' }}>Progress Tracker</div>,
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '130px' }}>File Attachment</div>,
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Status</div>,
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '120px' }}>Actions</div>
                ]}
                data={filtered}
                renderRow={(syl) => {
                  const pct = syl.progress || (syl.totalChapters > 0 ? Math.round((syl.completedChapters / syl.totalChapters) * 100) : 0);
                  return (
                    <tr key={syl.id}>
                      <td style={{ textAlign: 'left', minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.15)', flexShrink: 0
                          }}>
                            <BiFile size={14} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.85rem' }}>{syl.title}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: '150px' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{syl.subjectName || '-'}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Grade: {syl.standardName || '-'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(syl.teacherName || 'T')}&size=64&background=e0e7ff&color=4f46e5&bold=true`} 
                            alt="" 
                            style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #c7d2fe' }} 
                          />
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{syl.teacherName || '-'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ minWidth: 100, display: 'flex', flexDirection: 'column', gap: '2px', margin: '0 auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>{syl.completedChapters || 0}/{syl.totalChapters || 0} Ch.</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: pct === 100 ? '#10b981' : '#3b82f6' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '130px' }}>
                        {syl.fileType ? (
                          <span style={{ 
                            background: '#f8fafc', color: '#475569', padding: '2px 6px', border: '1px solid #cbd5e1', 
                            borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', 
                            display: 'inline-flex', alignItems: 'center', gap: '3px' 
                          }}>
                            <BiFile style={{ color: '#64748b' }} /> {syl.fileType} {syl.fileSize ? `(${syl.fileSize})` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.72rem' }}>No Attachment</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '100px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 8px', borderRadius: '20px', fontWeight: 700, fontSize: '0.68rem',
                          letterSpacing: '0.02em', textTransform: 'uppercase',
                          ...(syl.status === 'COMPLETED'
                            ? { background: '#dcfce7', color: '#15803d', boxShadow: '0 0 0 1px #bbf7d0' }
                            : syl.status === 'DRAFT'
                            ? { background: '#f1f5f9', color: '#475569', boxShadow: '0 0 0 1px #cbd5e1' }
                            : { background: '#e0f2fe', color: '#0369a1', boxShadow: '0 0 0 1px #bae6fd' })
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: syl.status === 'COMPLETED' ? '#16a34a' : syl.status === 'DRAFT' ? '#64748b' : '#0ea5e9' }} />
                          {syl.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleDownload(syl)}
                            title="Download Curriculum"
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: '#f0f9ff', border: 'none', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#0284c7',
                              cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(2,132,199,0.08)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <BiDownload size={13} />
                          </button>
                          <button
                            onClick={() => handleEdit(syl)}
                            title="Edit Assignment"
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: '#ecfdf5', border: 'none', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#10b981',
                              cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(16,185,129,0.08)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <BiEditAlt size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(syl)}
                            title="Revoke Assignment"
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: '#fef2f2', border: 'none', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#ef4444',
                              cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(239,68,68,0.08)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <BiTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>

        {/* ===== CREATION & ASSIGNMENT MODAL ===== */}
        {showModal && (
          <div className="syl-modal-overlay">
            <div className="syl-modal-content card" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', background: 'white', boxSizing: 'border-box' }}>
              <div className="flex-between border-bottom pb-05" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: '#1e1b4b', letterSpacing: '-0.02em' }}>{editingSyllabus ? 'Update Syllabus Assignment' : 'Assign Syllabus to Subject'}</h2>
                  <p className="syl-text-muted syl-text-xs" style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>Map curriculum templates and files to grade standards.</p>
                </div>
                <button 
                  className="syl-btn-icon" 
                  onClick={() => setShowModal(false)} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: 'none', cursor: 'pointer', transition: '0.2s', fontSize: '1.1rem' }}
                  onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background='#f1f5f9'}
                >
                  <BiX />
                </button>
              </div>

              <form className="grid syl-gap-1 syl-mt-1" onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}>
                
                {/* 1. Class Grade (Standard) Selector */}
                <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Class Grade / Standard *</label>
                  <select 
                    name="standardId" 
                    className="syl-form-control" 
                    value={formData.standardId} 
                    onChange={handleInputChange} 
                    required
                    style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="">Select Class Standard Grade...</option>
                    {standards.map(s => (
                      <option key={s.standardId || s.id} value={s.standardId || s.id}>{s.standard || s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Cascading Subject Selector (Filtered by chosen standard) */}
                <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Subject Assignment *</label>
                  <select 
                    name="subjectId" 
                    className="syl-form-control" 
                    value={formData.subjectId} 
                    onChange={handleInputChange} 
                    required 
                    disabled={!formData.standardId}
                    style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="">{formData.standardId ? 'Select Subject...' : 'Please select Class Grade first'}</option>
                    {filteredSubjectsForForm.map(sub => (
                      <option key={sub.id || sub.subjectId} value={sub.id || sub.subjectId}>{sub.subjectName || sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid syl-grid-2 syl-gap-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  {/* 3. Auto-Filled Teacher Display Dropdown */}
                  <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Assigned Teacher</label>
                    <select 
                      name="teacherId" 
                      className="syl-form-control" 
                      value={formData.teacherId} 
                      onChange={handleInputChange} 
                      required
                      style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                    >
                      <option value="">{formData.subjectId ? 'Unassigned' : 'Pending Subject selection'}</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.teacherName || t.name}</option>
                      ))}
                    </select>
                    {formData.subjectId && !formData.teacherId && (
                      <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>⚠️ No teacher currently assigned to this subject.</span>
                    )}
                  </div>

                  {/* 4. Total Core Chapters */}
                  <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Total Chapters *</label>
                    <input 
                      type="number" 
                      name="totalChapters" 
                      className="syl-form-control" 
                      placeholder="e.g. 15" 
                      min="1" 
                      value={formData.totalChapters} 
                      onChange={handleInputChange} 
                      required 
                      style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* 4.5. Completed Chapters (only when editing) */}
                {editingSyllabus && (
                  <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Completed Chapters *</label>
                    <input 
                      type="number" 
                      name="completedChapters" 
                      className="syl-form-control" 
                      placeholder="e.g. 5" 
                      min="0" 
                      max={formData.totalChapters} 
                      value={formData.completedChapters} 
                      onChange={handleInputChange} 
                      required 
                      style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                )}

                {/* 5. Custom Title Tag */}
                <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Syllabus Roster Title</label>
                  <input 
                    name="title" 
                    className="syl-form-control" 
                    placeholder="e.g. Grade 10 Algebra Syllabus (Auto-generated if empty)" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Onboarding Status</label>
                  <select 
                    name="status" 
                    className="syl-form-control" 
                    value={formData.status} 
                    onChange={handleInputChange}
                    style={{ width: '100%', borderRadius: '12px', padding: '0.75rem 1rem', border: '1.5px solid #cbd5e1', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none' }}
                  >
                    <option value="ACTIVE">Active Curriculum</option>
                    <option value="DRAFT">Draft Mode</option>
                    <option value="COMPLETED">Fully Completed</option>
                  </select>
                </div>

                {/* 6. Document Upload zone */}
                <div className="syl-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Curriculum Document Upload {!editingSyllabus && '*'}</label>
                  <div 
                    className="syl-upload-zone" 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '2rem 1.5rem', 
                      textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', 
                      background: '#f8fafc', display: 'flex', flexDirection: 'column', 
                      alignItems: 'center', gap: '8px' 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(79,70,229,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0])} />
                    {selectedFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <BiFile size={40} color="var(--primary)" />
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{selectedFile.name}</p>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <>
                        <BiUpload size={38} color="var(--primary)" />
                        <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '0.88rem', fontWeight: 600 }}>
                          Drag & drop or <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Browse files</span>
                        </p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.74rem', fontWeight: 500 }}>
                          PDF, DOC or DOCX format accepted (max 25MB)
                        </p>
                      </>
                    )}
                  </div>
                  {editingSyllabus && (
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>Leave empty to retain existing curriculum document.</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #cbd5e1', paddingTop: '1.25rem', marginTop: '0.75rem' }}>
                  <button type="button" className="btn syl-btn-outline" onClick={() => setShowModal(false)} style={{ borderRadius: '12px', padding: '0.6rem 1.4rem', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary flex-center gap-1" disabled={processing} style={{ borderRadius: '12px', padding: '0.6rem 1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {processing ? (
                      <><BiLoader className="syl-spinner" /> Processing...</>
                    ) : (
                      <><BiCheck /> {editingSyllabus ? 'Update Assignment' : 'Assign Syllabus'}</>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      <style>{`
        .syllabus-page { animation: fadeIn .5s ease; }
        .syl-icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .syl-file-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #818cf8); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .syl-progress-bar { height: 6px; background: #cbd5e1; border-radius: 3px; overflow: hidden; }
        .syl-progress-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }
        .syl-file-badge { background: #f8fafc; color: #475569; padding: .2rem .6rem; border-radius: .3rem; font-size: .75rem; font-weight: 700; border: 1px solid #cbd5e1; }
        
        /* Premium style overrides to fit table 100% horizontally on desktop without scrolling */
        .syl-table-container {
          width: 100%;
          overflow-x: hidden;
        }
        .syl-table-container .table-responsive {
          overflow-x: visible !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .syl-table-container .data-table {
          width: 100% !important;
          min-width: 100% !important;
          table-layout: auto !important;
        }
        .syl-table-container .data-table th,
        .syl-table-container .data-table td {
          padding: 0.75rem 0.5rem !important;
          white-space: normal !important;
          word-break: break-word !important;
        }
        .syl-table-container .data-table th {
          font-size: 0.68rem !important;
          letter-spacing: 0.05em !important;
        }
        
        /* Mobile horizontal scroll fallback */
        @media(max-width: 1024px) {
          .syl-table-container {
            overflow-x: auto !important;
          }
          .syl-table-container .table-responsive {
            overflow-x: auto !important;
          }
          .syl-table-container .data-table {
            min-width: 860px !important;
          }
        }
        
        .syl-status-pill { padding: .25rem .75rem; border-radius: 2rem; font-size: .75rem; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; }
        .syl-status-active { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .syl-status-completed { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .syl-status-draft { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        
        .syl-upload-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 1.5rem; text-align: center; cursor: pointer; transition: .2s; background: #f8fafc; }
        .syl-upload-zone:hover { border-color: var(--primary); background: rgba(79, 70, 229, 0.04); }
        .syl-upload-link { color: var(--primary); font-weight: 700; }
        .syl-btn-icon { font-size: 1.25rem; color: var(--text-muted); padding: .35rem; border-radius: 8px; transition: .2s; cursor: pointer; background: none; border: none; }
        .syl-btn-icon:hover { background: #f1f5f9; color: var(--primary); }
        .syl-text-danger { color: #ef4444!important; }
        .syl-badge-light { background: #f1f5f9; color: #475569; padding: .2rem .6rem; border-radius: .3rem; font-size: .8rem; font-weight: 600; }
        
        .syl-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn .2s ease; }
        .syl-max-w-600 { width: 100%; max-width: 640px; }
        .syl-modal-content { max-height: 90vh; overflow-y: auto; }
        .syl-form-group { display: flex; flex-direction: column; gap: .35rem; }
        .syl-form-group label { font-weight: 700; font-size: .85rem; color: #334155; }
        .syl-form-control { padding: .65rem .75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: .9rem; transition: .2s; }
        .syl-form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); outline: none; }
        
        .syl-grid-2 { grid-template-columns: 1fr 1fr; }
        .syl-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        .syl-gap-1 { gap: .75rem; }
        .syl-mt-2 { margin-top: 1.5rem; }
        .syl-mb-2 { margin-bottom: 1.5rem; }
        .syl-mb-1 { margin-bottom: .75rem; }
        .syl-mb-0 { margin-bottom: 0; }
        .syl-mt-1 { margin-top: .75rem; }
        .syl-padding-1 { padding: 1.25rem; }
        
        .syl-text-xs { font-size: .75rem; }
        .syl-text-sm { font-size: .85rem; }
        .syl-text-muted { color: #64748b; }
        .syl-font-bold { font-weight: 700; }
        .text-warning { color: #b45309; }
        
        .syl-flex-end { display: flex; justify-content: flex-end; align-items: center; }
        .syl-btn-outline { background: transparent; border: 1.5px solid #cbd5e1; color: #334155; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .syl-btn-outline:hover { border-color: var(--primary); color: var(--primary); background: #f8fafc; }
        .syl-shadow-sm { box-shadow: var(--shadow-sm); }
        .syl-breadcrumb { font-size: .85rem; color: var(--text-muted); margin-top: .25rem; }
        .syl-spinner { animation: spin 1s linear infinite; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        .syl-toast { position: fixed; top: 20px; right: 20px; padding: .75rem 1.25rem; border-radius: 8px; font-size: .9rem; font-weight: 600; z-index: 2000; display: flex; align-items: center; gap: .5rem; animation: slideInRight .3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .syl-toast.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .syl-toast.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @media(max-width: 992px) { 
          .syl-grid-4 { grid-template-columns: 1fr 1fr; } 
        }
        @media(max-width: 768px) { 
          .syl-grid-2, .syl-grid-4 { grid-template-columns: 1fr; }
          .header-section { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
          .header-section button { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default Syllabus;
