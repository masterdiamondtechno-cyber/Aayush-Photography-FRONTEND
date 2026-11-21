import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  addSubject, 
  getAllSubjects, 
  getAllSubjectsBySchool, 
  updateSubject, 
  deleteSubject,
  getAllClassesBySchoolId,
  getAllDivisionsByStandardId,
  getTeacherIdNameBySchool
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';
import { 
  BiPlus, 
  BiBookOpen, 
  BiTrash, 
  BiEditAlt, 
  BiLoaderCircle, 
  BiSearch, 
  BiFilterAlt,
  BiUser,
  BiChevronRight,
  BiInfoCircle,
  BiCheckCircle,
  BiGridAlt,
  BiListUl,
  BiFile
} from 'react-icons/bi';

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
  return Number.isFinite(n) ? n : null;
};

const Subjects = () => {
  const navigate = useNavigate();

  const handleAssignSyllabus = (sub) => {
    const userRole = localStorage.getItem('userRole') || 'admin';
    navigate(`/${userRole}/syllabus`, {
      state: {
        preSelectClassId: sub.standardId,
        preSelectSubjectId: sub.subjectId || sub.id,
        preSelectTeacherId: sub.teacherId || ''
      }
    });
  };

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

  // Lists & State
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Filter States
  const [filterClass, setFilterClass] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [modalDivisions, setModalDivisions] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    subjectName: '',
    description: '',
    standardId: '',
    divisionId: '',
    teacherId: ''
  });

  // Fetch all basic setups
  const fetchInitialData = useCallback(async () => {
    if (!schoolId || !academicYearId) return;
    try {
      // 1. Fetch Class Standards
      const classRes = await getAllClassesBySchoolId({ schoolId, academicYearId });
      if (classRes?.status === 'SUCCESS' || classRes?.code === 200) {
        setClasses(classRes.data || []);
      }
      
      // 2. Fetch Lightweight Teachers Lookup List
      const teacherRes = await getTeacherIdNameBySchool({
        schoolId: schoolId.toString(),
        academicYearId: academicYearId.toString()
      });
      if (teacherRes?.status === 'SUCCESS' || teacherRes?.code === 200) {
        setTeachers(teacherRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load initial setup dropdowns:', err);
    }
  }, [schoolId, academicYearId]);

  // Fetch Subjects list dynamically
  const fetchSubjects = useCallback(async () => {
    if (!schoolId || !academicYearId) return;
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filterClass && filterDivision) {
        // Load class & section specific subjects
        response = await getAllSubjects({
          schoolId,
          standardId: parseInt(filterClass),
          divisionId: parseInt(filterDivision),
          academicYearId
        });
      } else {
        // Load all school subjects
        response = await getAllSubjectsBySchool({ schoolId, academicYearId });
      }

      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setSubjects(response.data || []);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      // Fallback empty roster on list-empty 404 block
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId, filterClass, filterDivision]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Handle cascading filter standard change
  const handleFilterClassChange = async (stdId) => {
    setFilterClass(stdId);
    setFilterDivision('');
    setDivisions([]);
    if (!stdId) return;

    try {
      const response = await getAllDivisionsByStandardId({
        schoolId,
        standardId: parseInt(stdId),
        academicYearId
      });
      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setDivisions(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load filter sections:', err);
    }
  };

  // Handle cascading modal standard change
  const handleModalClassChange = async (stdId) => {
    setFormData(prev => ({ ...prev, standardId: stdId, divisionId: '' }));
    setModalDivisions([]);
    if (!stdId) return;

    try {
      const response = await getAllDivisionsByStandardId({
        schoolId,
        standardId: parseInt(stdId),
        academicYearId
      });
      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setModalDivisions(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load modal sections:', err);
    }
  };

  // Open creation modal
  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setFormData({
      subjectName: '',
      description: '',
      standardId: '',
      divisionId: '',
      teacherId: ''
    });
    setModalDivisions([]);
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = async (subject) => {
    setEditingSubject(subject);
    setFormData({
      subjectName: subject.subjectName,
      description: subject.description || '',
      standardId: subject.standardId.toString(),
      divisionId: subject.divisionId.toString(),
      teacherId: subject.teacherId ? subject.teacherId.toString() : ''
    });

    // Prefetch divisions for this class
    try {
      const response = await getAllDivisionsByStandardId({
        schoolId,
        standardId: subject.standardId,
        academicYearId
      });
      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setModalDivisions(response.data || []);
      }
    } catch (err) {
      console.error('Failed to pre-populate sections:', err);
    }

    setShowModal(true);
  };

  // Submit Save Subject Form
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subjectName || !formData.standardId || !formData.divisionId) {
      alert('Subject Name, Standard, and Section are mandatory fields.');
      return;
    }

    setModalLoading(true);
    try {
      // Find selected standard name & division name for payload enrichment
      const stdName = classes.find(c => c.standardId === parseInt(formData.standardId))?.standard || '';
      const divName = modalDivisions.find(d => d.divisionId === parseInt(formData.divisionId) || d.id === parseInt(formData.divisionId))?.divisionName || '';

      const payload = {
        schoolId,
        academicYearId,
        standardId: parseInt(formData.standardId),
        standard: stdName,
        divisionId: parseInt(formData.divisionId),
        divisionName: divName,
        subjectName: formData.subjectName.trim(),
        description: formData.description.trim(),
        teacherId: formData.teacherId ? parseInt(formData.teacherId) : null
      };

      let response;
      if (editingSubject) {
        payload.subjectId = editingSubject.subjectId;
        response = await updateSubject(payload);
      } else {
        response = await addSubject(payload);
      }

      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setSuccessMsg(editingSubject ? 'Subject updated successfully!' : 'Subject added successfully!');
        setShowModal(false);
        fetchSubjects();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(response?.message || 'Operation failed');
      }
    } catch (err) {
      alert(err.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Subject Handler
  const handleDeleteClick = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? All academic scheduling associated with this subject will be impacted.')) return;
    
    try {
      const response = await deleteSubject({ schoolId, subjectId });
      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setSuccessMsg('Subject deleted successfully!');
        fetchSubjects();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(response?.message || 'Delete operation failed');
      }
    } catch (err) {
      alert(err.message || 'Delete operation failed');
    }
  };

  // Filter & Search Logic
  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sub.description && sub.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (sub.teacherName && sub.teacherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          sub.standard.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="subjects-page space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Subjects
          </h1>
          <p className="text-sm text-slate-500">Academic Configuration • Subjects Directory</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
          onClick={handleOpenAddModal}
        >
          <BiPlus className="text-lg" /> Add Subject
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <BiCheckCircle className="text-xl shrink-0" />
          {successMsg}
        </div>
      )}

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <BiFilterAlt className="text-lg text-indigo-600" />
              Filter By:
            </div>
            <select
              value={filterClass}
              onChange={(e) => handleFilterClassChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.standardId} value={c.standardId}>{c.standard}</option>
              ))}
            </select>
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              disabled={!filterClass}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            >
              <option value="">Select Section</option>
              {divisions.map(d => (
                <option key={d.divisionId || d.id} value={d.divisionId || d.id}>{d.divisionName || d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <BiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex overflow-hidden rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center p-2.5 transition ${
                  viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 hover:text-slate-600'
                }`}
              >
                <BiGridAlt className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center p-2.5 transition ${
                  viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 hover:text-slate-600'
                }`}
              >
                <BiListUl className="text-lg" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* CORE CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
          <BiLoaderCircle className="animate-spin text-4xl text-indigo-600" />
          <p className="text-sm font-semibold">Loading subjects from standard roster...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <BiBookOpen className="text-4xl" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">No Subjects Registered</h3>
          <p className="max-w-md text-sm text-slate-500">
            {filterClass && filterDivision
              ? 'No subjects are currently configured for this class section. Click below to add a subject to this specific division.'
              : 'Configure subjects for your class standards. Enforcing a proper master dependency ensures subjects can be mapped to timetables, exams, and syllabi.'}
          </p>
          <button
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            onClick={handleOpenAddModal}
          >
            <BiPlus className="text-lg" /> Add Your First Subject
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map(sub => (
            <div
              key={sub.subjectId}
              className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm transition hover:border-[#FFC629]/40 hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    Class {sub.standard} — {sub.divisionName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600 transition hover:bg-indigo-50"
                      title="Assign / View Syllabus"
                      onClick={() => handleAssignSyllabus(sub)}
                    >
                      <BiFile />
                    </button>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
                      title="Edit Subject"
                      onClick={() => handleOpenEditModal(sub)}
                    >
                      <BiEditAlt />
                    </button>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete Subject"
                      onClick={() => handleDeleteClick(sub.subjectId)}
                    >
                      <BiTrash />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900">{sub.subjectName}</h3>
                <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-slate-500">
                  {sub.description || 'No syllabus description provided for this subject.'}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                      sub.teacherName ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <BiUser />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-slate-500">Assigned Teacher</span>
                    <span className={`block text-sm font-bold ${sub.teacherName ? 'text-slate-800' : 'text-slate-400'}`}>
                      {sub.teacherName || 'Assign Teacher Later'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Subject Name</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Class Standard</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Section/Division</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Teacher</th>
                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(sub => (
                  <tr key={sub.subjectId} className="border-b border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <BiBookOpen className="text-lg text-indigo-600" />
                        {sub.subjectName}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">Class {sub.standard}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{sub.divisionName}</td>
                    <td className="max-w-[250px] truncate px-5 py-4 text-sm text-slate-500">
                      {sub.description || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${sub.teacherName ? 'text-slate-800' : 'text-slate-400'}`}>
                        {sub.teacherName || 'Assign Teacher Later'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600 transition hover:bg-indigo-50"
                          title="Assign / View Syllabus"
                          onClick={() => handleAssignSyllabus(sub)}
                        >
                          <BiFile />
                        </button>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
                          title="Edit Subject"
                          onClick={() => handleOpenEditModal(sub)}
                        >
                          <BiEditAlt />
                        </button>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete Subject"
                          onClick={() => handleDeleteClick(sub.subjectId)}
                        >
                          <BiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / CREATE GLASSMORPHIC MODAL */}
      {showModal && (
        <div className="modal-backdrop flex-center subject-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="card modal-card scale-up subject-modal-card" style={{ width: '90%', maxWidth: '500px', background: '#141414', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid #262626' }}>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#FFC629' }}>
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="flex subject-modal-form" style={{ flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Subject Name */}
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>Subject Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Mathematics" 
                  required
                  value={formData.subjectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border-light)', borderRadius: '10px', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>

              {/* Class Selection */}
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>Class Standard *</label>
                <select 
                  className="form-control" 
                  required
                  value={formData.standardId}
                  onChange={(e) => handleModalClassChange(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border-light)', borderRadius: '10px', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="">Select standard class...</option>
                  {classes.map(c => (
                    <option key={c.standardId} value={c.standardId}>{c.standard}</option>
                  ))}
                </select>
              </div>

              {/* Section/Division Selection */}
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>Section / Division *</label>
                <select 
                  className="form-control" 
                  required
                  disabled={!formData.standardId}
                  value={formData.divisionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, divisionId: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border-light)', borderRadius: '10px', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="">Select section division...</option>
                  {modalDivisions.map(d => (
                    <option key={d.divisionId || d.id} value={d.divisionId || d.id}>{d.divisionName || d.name}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div className="form-group">
                <div className="flex-between">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>Assigned Teacher</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Optional</span>
                </div>
                <select 
                  className="form-control" 
                  value={formData.teacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border-light)', borderRadius: '10px', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="">Assign Teacher Later</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.teacherName}</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BiInfoCircle style={{ color: 'var(--primary)' }} /> Teachers can be registered and assigned subsequently.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>Description</label>
                <textarea 
                  className="form-control" 
                  placeholder="e.g. Fundamental syllabus including algebra, calculus, and geometry basics." 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 1rem', border: '1px solid var(--border-light)', borderRadius: '10px', outline: 'none', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex-center subject-modal-actions" style={{ gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ padding: '0.65rem 1.25rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn btn-primary flex-center" style={{ gap: '0.5rem', padding: '0.65rem 1.5rem' }}>
                  {modalLoading && <BiLoaderCircle className="spin" />}
                  {editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* INJECTED PAGE STYLE TOKENS */}
      <style>{`
        .btn-icon-styled {
          background: transparent;
          border: none;
          font-size: 1.15rem;
          color: var(--text-muted);
          padding: 0.35rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-icon-styled:hover {
          background: #f5f5f5;
          color: var(--primary);
        }
        .btn-icon-styled.text-danger:hover {
          background: #ffeeb2;
          color: var(--danger);
        }
        .subject-card {
          background: white;
          box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
        }
        .subject-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px -4px rgba(0,0,0,0.08);
          border-color: var(--primary-light) !important;
        }
        .view-btn {
          transition: all 0.2s ease;
        }
        .view-btn:hover {
          background: #f5f5f5;
        }
        .scale-up {
          animation: scaleUpAnim 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .subject-modal-backdrop {
          box-sizing: border-box;
          min-height: 0;
          overflow-y: auto;
          padding: 1rem;
        }

        .subject-modal-card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          min-width: 0;
          max-height: calc(100dvh - 2rem);
          overflow: hidden;
        }

        .subject-modal-card h3 {
          flex: 0 0 auto;
          overflow-wrap: anywhere;
        }

        .subject-modal-form {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 0.25rem;
        }

        .subject-modal-form .form-group {
          min-width: 0;
        }

        .subject-modal-form .form-control {
          box-sizing: border-box;
          max-width: 100%;
        }

        .subject-modal-actions {
          flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .subject-modal-backdrop {
            align-items: flex-start;
            padding: max(0.75rem, env(safe-area-inset-top)) 0.75rem max(0.75rem, env(safe-area-inset-bottom));
          }

          .subject-modal-card {
            width: 100% !important;
            max-height: calc(100dvh - 1.5rem);
            border-radius: 1rem !important;
            padding: 1.25rem !important;
          }

          .subject-modal-card h3 {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }

          .subject-modal-form {
            gap: 1rem !important;
          }
        }

        @media (max-width: 360px) {
          .subject-modal-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .subject-modal-actions button {
            width: 100%;
            justify-content: center;
          }
        }

        @keyframes scaleUpAnim {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Subjects;
