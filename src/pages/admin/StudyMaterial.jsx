import { useState, useEffect, useCallback } from 'react';
import { BiBookOpen, BiPlus, BiEditAlt, BiTrash, BiDownload, BiSearch, BiFile, BiFolder, BiCloudDownload, BiLoader } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import {
  getAllStudyMaterials, getStudyMaterialStats, createStudyMaterial,
  updateStudyMaterial, deleteStudyMaterial, downloadStudyMaterial,
  getStudyMaterialById, getAllStandards, getAllDivisionsByStandardId,
  getSubjectsForTimetable, getAllTeachersBySchoolId
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';


const TYPE_COLORS = { Notes: '#5d5fef', Worksheet: '#3b82f6', 'Practice Sheet': '#10b981', Reference: '#f59e0b', Assignment: '#ef4444', Revision: '#8b5cf6' };
const MATERIAL_TYPES = ['Notes', 'Worksheet', 'Practice Sheet', 'Reference', 'Assignment', 'Revision'];

const StudyMaterial = () => {
  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');

  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState({ totalMaterials: 0, published: 0, totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '', materialType: '', status: 'Published',
    subjectId: '', standardId: '', divisionId: '', teacherId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Dropdown data
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Fetch materials
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const payload = { schoolId };
      if (academicYearId) payload.academicYearId = academicYearId;
      if (filterType !== 'All') payload.materialType = filterType;

      const res = await getAllStudyMaterials(payload);
      setMaterials(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch study materials:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId, filterType]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await getStudyMaterialStats({ schoolId, academicYearId });
      setStats(res?.data || { totalMaterials: 0, published: 0, totalDownloads: 0 });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [schoolId, academicYearId]);

  // Fetch dropdown data
  const fetchDropdowns = useCallback(async () => {
    try {
      const [stdRes, subRes, teachRes] = await Promise.allSettled([
        getAllStandards(schoolId, academicYearId),
        getSubjectsForTimetable({ schoolId, academicYearId }),
        getAllTeachersBySchoolId({ schoolId, academicYearId }),
      ]);
      
      setStandards(stdRes.status === 'fulfilled' ? (stdRes.value?.data || []) : []);
      setSubjects(subRes.status === 'fulfilled' ? (subRes.value?.data || []) : []);
      setTeachers(teachRes.status === 'fulfilled' ? (teachRes.value?.data || []) : []);
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => { fetchMaterials(); fetchStats(); }, [fetchMaterials, fetchStats]);
  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  // Fetch divisions when standard changes
  useEffect(() => {
    if (formData.standardId) {
      getAllDivisionsByStandardId({ schoolId, standardId: formData.standardId })
        .then(res => setDivisions(res?.data || []))
        .catch(() => setDivisions([]));
    } else {
      setDivisions([]);
    }
  }, [formData.standardId, schoolId]);

  // Filtered materials (client-side search)
  const filtered = materials.filter(m => {
    const matchesSearch = (m.title + (m.teacherName || '') + (m.subjectName || '')).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Open modal for add
  const handleAdd = () => {
    setEditingId(null);
    setFormData({ title: '', materialType: '', status: 'Published', subjectId: '', standardId: '', divisionId: '', teacherId: '' });
    setSelectedFile(null);
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = async (mat) => {
    try {
      const res = await getStudyMaterialById({ id: mat.id });
      const d = res?.data;
      if (d) {
        setEditingId(d.id);
        setFormData({
          title: d.title || '', materialType: d.materialType || '', status: d.status || 'Published',
          subjectId: d.subjectId || '', standardId: d.standardId || '', divisionId: d.divisionId || '', teacherId: d.teacherId || ''
        });
        setSelectedFile(null);
        setShowModal(true);
      }
    } catch (err) {
      alert('Failed to load material details: ' + (err.message || 'Unknown error'));
    }
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingId) {
        fd.append('id', editingId);
      }
      fd.append('title', formData.title);
      fd.append('materialType', formData.materialType);
      fd.append('status', formData.status);
      fd.append('schoolId', schoolId);
      if (academicYearId) fd.append('academicYearId', academicYearId);
      fd.append('subjectId', formData.subjectId);
      fd.append('standardId', formData.standardId);
      fd.append('divisionId', formData.divisionId);
      fd.append('teacherId', formData.teacherId);
      if (selectedFile) fd.append('file', selectedFile);

      if (editingId) {
        await updateStudyMaterial(fd);
      } else {
        await createStudyMaterial(fd);
      }

      setShowModal(false);
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert('Error: ' + (err.message || 'Operation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete material
  const handleDelete = async (mat) => {
    if (!window.confirm(`Delete "${mat.title}"? This will also remove the file from storage.`)) return;
    try {
      await deleteStudyMaterial({ id: mat.id });
      fetchMaterials();
      fetchStats();
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Download material
  const handleDownload = async (mat) => {
    try {
      const res = await downloadStudyMaterial({ id: mat.id });
      const url = res?.data?.downloadUrl;
      if (url) window.open(url, '_blank');
      else alert('Download URL not available.');
      fetchMaterials(); // refresh to update download count
    } catch (err) {
      alert('Download failed: ' + (err.message || 'Access denied'));
    }
  };

  const StatCard = ({ icon: Icon, color, label, value, bg }) => (
    <div className="card sm-shadow-sm sm-padding-1 flex-center sm-gap-1" style={{ justifyContent: 'flex-start', borderLeft: `4px solid ${color}` }}>
      <div className="sm-icon-box" style={{ background: bg }}><Icon size={24} color={color} /></div>
      <div><p className="sm-text-muted sm-text-xs sm-mb-0">{label}</p><h3 className="sm-mb-0" style={{ color }}>{value}</h3></div>
    </div>
  );

  return (
    <div className="study-material-page space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Study Material</h1>
            <p className="text-sm text-slate-500">Academic &gt; Study Material Management</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            onClick={handleAdd}
          >
            <BiPlus className="text-lg" /> Upload Material
          </button>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard icon={BiBookOpen} color="var(--primary)" label="Total Materials" value={stats.totalMaterials || 0} bg="rgba(93,95,239,0.1)" />
          <StatCard icon={BiFolder} color="#10b981" label="Published" value={stats.published || 0} bg="rgba(16,185,129,0.1)" />
          <StatCard icon={BiCloudDownload} color="#f59e0b" label="Total Downloads" value={(stats.totalDownloads || 0).toLocaleString()} bg="rgba(245,158,11,0.1)" />
        </div>

        {/* List Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[160px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Filter Material Type
                  </label>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="All">All Types</option>
                    {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="min-w-[240px]">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <BiSearch className="text-sm" /> Search Keyword
                </label>
                <div className="relative w-full">
                  <BiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search materials or teacher..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <BiLoader size={32} className="animate-spin text-indigo-600" />
                <p className="text-sm font-medium">Loading study materials...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center" style={{ padding: '5rem 2rem', background: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: '24px', margin: '2rem' }}>
                <BiBookOpen style={{ fontSize: '3.5rem', color: '#94a3b8', marginBottom: '1.25rem', opacity: 0.5 }} />
                <h3 style={{ margin: 0, color: '#334155', fontWeight: 700 }}>No Study Materials Uploaded</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0', fontWeight: 500 }}>There are no active course study materials matching your filters.</p>
                <button className="btn btn-primary" onClick={handleAdd} style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', fontWeight: 600 }}><BiPlus /> Upload Your First Material</button>
              </div>
            ) : (
              <div className="sm-table-container">
                <DataTable
                  headers={[
                    'Material Title',
                    'Subject',
                    <div key="type" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>Type</div>,
                    <div key="class" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Class</div>,
                    'Teacher',
                    'Uploaded',
                    <div key="file" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>File</div>,
                    <div key="downloads" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Downloads</div>,
                    <div key="status" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '90px' }}>Status</div>,
                    <div key="actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '120px' }}>Actions</div>
                  ]}
                  data={filtered}
                  renderRow={(mat) => (
                    <tr key={mat.id}>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(16,185,129,0.15)', flexShrink: 0
                          }}>
                            <BiBookOpen size={14} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.85rem' }}>{mat.title}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left' }}><span className="sm-badge-light">{mat.subjectName || '-'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                          background: `${TYPE_COLORS[mat.materialType] || '#64748b'}15`, 
                          color: TYPE_COLORS[mat.materialType] || '#64748b', 
                          border: `1px solid ${TYPE_COLORS[mat.materialType] || '#64748b'}30` 
                        }}>
                          {mat.materialType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}><span className="sm-badge-light">{mat.classDisplay || `${mat.standardName || ''}-${mat.divisionName || ''}`}</span></td>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mat.teacherName || 'T')}&size=64&background=e0e7ff&color=4f46e5&bold=true`} 
                            alt="" 
                            style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #c7d2fe' }} 
                          />
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{mat.teacherName || '-'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', fontSize: '0.82rem', color: '#475569' }}>{mat.uploadDate || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: '#f8fafc', color: '#475569', padding: '2px 6px', border: '1px solid #cbd5e1', 
                          borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', 
                          display: 'inline-flex', alignItems: 'center', gap: '3px' 
                        }}>
                          <BiFile style={{ color: '#64748b' }} /> {mat.fileType || 'Doc'} {mat.fileSize ? `(${mat.fileSize})` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>{mat.downloadCount || 0}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 8px', borderRadius: '20px', fontWeight: 700, fontSize: '0.68rem',
                          letterSpacing: '0.02em', textTransform: 'uppercase',
                          ...(mat.status === 'Published'
                            ? { background: '#dcfce7', color: '#15803d', boxShadow: '0 0 0 1px #bbf7d0' }
                            : { background: '#f1f5f9', color: '#475569', boxShadow: '0 0 0 1px #cbd5e1' })
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: mat.status === 'Published' ? '#16a34a' : '#64748b' }} />
                          {mat.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleDownload(mat)}
                            title="Download File"
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
                            onClick={() => handleEdit(mat)}
                            title="Edit Material"
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
                            onClick={() => handleDelete(mat)}
                            title="Delete Material"
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
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Upload / Edit Modal */}
        {showModal && (
          <div className="sm-modal-overlay">
            <div className="sm-modal-content card sm-max-w-600">
              <div className="flex-between sm-mb-1"><h2>{editingId ? 'Edit Study Material' : 'Upload Study Material'}</h2><button className="sm-btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: '1.5rem' }}>&times;</button></div>
              <form className="grid sm-gap-1 sm-mt-1" onSubmit={handleSubmit}>
                <div className="sm-form-group"><label>Material Title *</label><input className="sm-form-control" placeholder="e.g. Quadratic Equations – Notes" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required /></div>
                <div className="sm-form-group"><label>Type *</label>
                  <select className="sm-form-control" value={formData.materialType} onChange={e => setFormData(p => ({ ...p, materialType: e.target.value }))} required>
                    <option value="">Select</option>
                    {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid sm-grid-2 sm-gap-1">
                  <div className="sm-form-group"><label>Standard *</label>
                    <select className="sm-form-control" value={formData.standardId} onChange={e => setFormData(p => ({ ...p, standardId: e.target.value, divisionId: '' }))} required>
                      <option value="">Select</option>
                      {standards.map(s => <option key={s.id || s.standardId} value={s.id || s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                    </select>
                  </div>
                  <div className="sm-form-group"><label>Division *</label>
                    <select className="sm-form-control" value={formData.divisionId} onChange={e => setFormData(p => ({ ...p, divisionId: e.target.value }))} required>
                      <option value="">Select</option>
                      {divisions.map(d => <option key={d.id || d.divisionId} value={d.id || d.divisionId}>{d.divisionName || d.division || d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid sm-grid-2 sm-gap-1">
                  <div className="sm-form-group"><label>Subject *</label>
                    <select className="sm-form-control" value={formData.subjectId} onChange={e => setFormData(p => ({ ...p, subjectId: e.target.value }))} required>
                      <option value="">Select</option>
                      {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.subjectName || s.name}</option>)}
                    </select>
                  </div>
                  <div className="sm-form-group"><label>Teacher *</label>
                    <select className="sm-form-control" value={formData.teacherId} onChange={e => setFormData(p => ({ ...p, teacherId: e.target.value }))} required>
                      <option value="">Select</option>
                      {teachers.map(t => <option key={t.id || t.teacherId} value={t.id || t.teacherId}>{t.teacherName || t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="sm-form-group">
                  <label>Upload File {editingId ? '(optional — leave empty to keep existing)' : '*'}</label>
                  <div className="sm-upload-zone" onClick={() => document.getElementById('sm-file-input').click()}>
                    {selectedFile ? (
                      <p className="sm-font-bold" style={{ color: 'var(--primary)' }}>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                    ) : (
                      <>
                        <BiFile size={36} color="#94a3b8" />
                        <p className="sm-text-muted sm-text-sm" style={{ margin: '.5rem 0 0' }}>Click to <span className="sm-upload-link">Browse</span></p>
                        <p className="sm-text-muted sm-text-xs">PDF, DOC, ZIP, PPT (max 50MB)</p>
                      </>
                    )}
                    <input id="sm-file-input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0] || null)} />
                  </div>
                </div>
                <div className="sm-flex-end sm-gap-1 sm-mt-1">
                  <button type="button" className="btn sm-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Uploading...' : <><BiPlus /> {editingId ? 'Update' : 'Upload'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .study-material-page{animation:fadeIn .5s ease}
          
          /* Upgraded Stat Cards with Left Accent Borders */
          .sm-shadow-sm {
            box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          
          .sm-icon-box{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
          .sm-material-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .sm-type-badge{padding:.2rem .6rem;border-radius:.3rem;font-size:.75rem;font-weight:600}
          .sm-file-badge{background:#f8fafc;color:#64748b;padding:.2rem .6rem;border-radius:.3rem;font-size:.75rem;font-weight:500;border:1px solid #e2e8f0}
          .sm-status-pill{padding:.25rem .75rem;border-radius:2rem;font-size:.75rem;font-weight:600;text-transform:uppercase;display:inline-flex;align-items:center;letter-spacing:.02em}
          .sm-status-published{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
          .sm-status-draft{background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1}
          
          /* Prevent horizontal scroll on desktop inside DataTable container */
          .sm-table-container {
            width: 100%;
            overflow-x: hidden;
          }
          .sm-table-container .table-responsive {
            overflow-x: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .sm-table-container .data-table {
            width: 100% !important;
            min-width: 100% !important;
            table-layout: auto !important;
          }
          .sm-table-container .data-table th,
          .sm-table-container .data-table td {
            padding: 0.75rem 0.5rem !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .sm-table-container .data-table th {
            font-size: 0.68rem !important;
            letter-spacing: 0.05em !important;
          }
          
          /* Mobile horizontal scroll fallback */
          @media(max-width: 1024px) {
            .sm-table-container {
              overflow-x: auto !important;
            }
            .sm-table-container .table-responsive {
              overflow-x: auto !important;
            }
            .sm-table-container .data-table {
              min-width: 960px !important;
            }
          }
          
          /* Premium Modal Styling */
          .sm-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn .2s ease;
          }
          .sm-modal-content {
            background: #ffffff;
            border: none;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-radius: 24px;
            padding: 2.5rem;
            max-height: 90vh;
            overflow-y: auto;
            box-sizing: border-box;
          }
          
          .sm-upload-zone{border:2px dashed #cbd5e1;border-radius:16px;padding:2rem;text-align:center;cursor:pointer;transition:.2s;background:#f8fafc}
          .sm-upload-zone:hover{border-color:var(--primary);background:rgba(93,95,239,.03)}
          .sm-upload-link{color:var(--primary);font-weight:700}
          .sm-btn-icon{font-size:1.2rem;color:var(--text-muted);padding:.3rem;border-radius:6px;transition:.2s;cursor:pointer;background:none;border:none}
          .sm-btn-icon:hover{background:var(--bg-light);color:var(--primary)}
          .sm-text-danger{color:var(--danger)!important}
          .sm-badge-light{background:#f1f5f9;color:#475569;padding:.2rem .6rem;border-radius:.3rem;font-size:.8rem;font-weight:500}
          .sm-max-w-600{width:100%;max-width:640px}
          .sm-form-group{display:flex;flex-direction:column;gap:.35rem}
          .sm-form-group label{font-weight:700;font-size:.85rem;color:#334155}
          .sm-form-control{padding:.75rem 1rem;border-radius:12px;border:1.5px solid #cbd5e1;font-size:.9rem;transition:.2s;outline:none}
          .sm-form-control:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(93,95,239,.15)}
          .sm-grid-2{display:grid;grid-template-columns:1fr 1fr}.sm-grid-3{display:grid;grid-template-columns:repeat(3,1fr)}
          .sm-gap-1{gap:1.25rem}.sm-mt-2{margin-top:1.5rem}.sm-mb-2{margin-bottom:1.5rem}.sm-mb-1{margin-bottom:.75rem}.sm-mb-0{margin-bottom:0}.sm-mt-1{margin-top:.75rem}.sm-padding-1{padding:1.25rem}
          .sm-text-xs{font-size:.75rem}.sm-text-sm{font-size:.85rem}.sm-text-muted{color:#64748b}.sm-font-bold{font-weight:700}
          .sm-flex-end{display:flex;justify-content:flex-end;align-items:center}
          
          .sm-btn-outline {
            background: transparent;
            border: 1.5px solid #cbd5e1;
            color: #334155;
            padding: 0.6rem 1.2rem;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
          }
          .sm-btn-outline:hover{border-color:var(--primary);color:var(--primary);background:#f8fafc}
          .sm-breadcrumb{font-size:.85rem;color:#64748b;margin-top:.25rem}
          .spin{animation:spin 1s linear infinite}
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          @media(max-width:768px){.sm-grid-2,.sm-grid-3{grid-template-columns:1fr}}
        `}</style>
    </div>
  );
};

export default StudyMaterial;
