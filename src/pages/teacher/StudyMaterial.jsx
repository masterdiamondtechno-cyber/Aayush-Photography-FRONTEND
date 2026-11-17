import { useState, useEffect, useCallback } from 'react';
import { BiBookOpen, BiPlus, BiEditAlt, BiTrash, BiDownload, BiSearch, BiFile, BiFolder, BiCloudDownload, BiLoader } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import {
  getAllStudyMaterials, getStudyMaterialStats, createStudyMaterial,
  updateStudyMaterial, deleteStudyMaterial, downloadStudyMaterial,
  getStudyMaterialById, getAllStandards, getAllDivisionsByStandardId,
  getSubjectsForTimetable
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const TYPE_COLORS = { Notes: '#5d5fef', Worksheet: '#3b82f6', 'Practice Sheet': '#10b981', Reference: '#f59e0b', Assignment: '#ef4444', Revision: '#8b5cf6' };
const MATERIAL_TYPES = ['Notes', 'Worksheet', 'Practice Sheet', 'Reference', 'Assignment', 'Revision'];

const StudyMaterial = () => {
  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');
  const teacherId = getAuthValue('teacherId') || getAuthValue('userId');

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
    subjectId: '', standardId: '', divisionId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Dropdown data
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]);

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
      const [stdRes, subRes] = await Promise.allSettled([
        getAllStandards(schoolId, academicYearId),
        getSubjectsForTimetable({ schoolId, academicYearId }),
      ]);
      
      setStandards(stdRes.status === 'fulfilled' ? (stdRes.value?.data || []) : []);
      setSubjects(subRes.status === 'fulfilled' ? (subRes.value?.data || []) : []);
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
    setFormData({ title: '', materialType: '', status: 'Published', subjectId: '', standardId: '', divisionId: '' });
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
          subjectId: d.subjectId || '', standardId: d.standardId || '', divisionId: d.divisionId || ''
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
      fd.append('teacherId', teacherId);
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
        <div className="header-section flex-between">
          <div><h1>Study Material</h1><p className="sm-breadcrumb">Academic &gt; Study Material</p></div>
          <button className="btn btn-primary flex-center sm-gap-1" onClick={handleAdd}><BiPlus /> Upload Material</button>
        </div>

        <div className="grid sm-grid-3 sm-gap-1 sm-mt-2 sm-mb-2">
          <StatCard icon={BiBookOpen} color="var(--primary)" label="Total Materials" value={stats.totalMaterials} bg="rgba(93,95,239,0.1)" />
          <StatCard icon={BiFolder} color="#10b981" label="Published" value={stats.published} bg="rgba(16,185,129,0.1)" />
          <StatCard icon={BiCloudDownload} color="#f59e0b" label="Total Downloads" value={(stats.totalDownloads || 0).toLocaleString()} bg="rgba(245,158,11,0.1)" />
        </div>

        <div className="card sm-shadow-sm" style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex-center sm-gap-1">
              <div style={{ position: 'relative' }}>
                <BiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="sm-form-control sm-text-sm" placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.25rem', width: '260px' }} />
              </div>
              <select className="sm-form-control sm-text-sm" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '160px' }}>
                <option value="All">All Types</option>
                {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm-text-muted sm-text-sm">
              {loading ? 'Loading...' : <>Showing <strong>{filtered.length}</strong> materials</>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card sm-shadow-sm" style={{ padding: '3rem', textAlign: 'center' }}>
            <BiLoader size={32} className="spin" style={{ color: 'var(--primary)' }} />
            <p className="sm-text-muted sm-mt-1">Loading study materials...</p>
          </div>
        ) : (
          <DataTable
            headers={['ID', 'Material Title', 'Subject', 'Type', 'Class', 'Teacher', 'Uploaded', 'File', 'Downloads', 'Status', 'Actions']}
            data={filtered}
            renderRow={(mat) => (
              <tr key={mat.id}>
                <td className="sm-font-bold sm-text-sm">#{mat.materialId || mat.id}</td>
                <td><div className="flex-center sm-gap-1" style={{ justifyContent: 'flex-start' }}><div className="sm-material-icon"><BiBookOpen size={16} /></div><span className="sm-font-bold">{mat.title}</span></div></td>
                <td><span className="sm-badge-light">{mat.subjectName || '-'}</span></td>
                <td><span className="sm-type-badge" style={{ background: `${TYPE_COLORS[mat.materialType] || '#64748b'}15`, color: TYPE_COLORS[mat.materialType] || '#64748b', border: `1px solid ${TYPE_COLORS[mat.materialType] || '#64748b'}40` }}>{mat.materialType}</span></td>
                <td><span className="sm-badge-light">{mat.classDisplay || `${mat.standardName || ''}-${mat.divisionName || ''}`}</span></td>
                <td><div className="flex-center sm-gap-1" style={{ justifyContent: 'flex-start' }}><img src={`https://ui-avatars.com/api/?name=${mat.teacherName || 'T'}&size=28&background=5d5fef&color=fff`} alt="" style={{ borderRadius: '50%', width: 28, height: 28 }} /><span className="sm-text-sm">{mat.teacherName || '-'}</span></div></td>
                <td className="sm-text-sm">{mat.uploadDate || '-'}</td>
                <td><span className="sm-file-badge">{mat.fileType || '-'} · {mat.fileSize || '-'}</span></td>
                <td className="sm-text-sm sm-font-bold">{mat.downloadCount || 0}</td>
                <td><span className={`sm-status-pill sm-status-${(mat.status || 'draft').toLowerCase()}`}>{mat.status}</span></td>
                <td>
                  <div className="flex-center sm-gap-1" style={{ justifyContent: 'flex-start' }}>
                    <button className="sm-btn-icon" title="Download" onClick={() => handleDownload(mat)}><BiDownload /></button>
                    <button className="sm-btn-icon" title="Edit" onClick={() => handleEdit(mat)}><BiEditAlt /></button>
                    <button className="sm-btn-icon sm-text-danger" title="Delete" onClick={() => handleDelete(mat)}><BiTrash /></button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}

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
                <div className="sm-form-group"><label>Subject *</label>
                  <select className="sm-form-control" value={formData.subjectId} onChange={e => setFormData(p => ({ ...p, subjectId: e.target.value }))} required>
                    <option value="">Select</option>
                    {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.subjectName || s.name}</option>)}
                  </select>
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
          .sm-icon-box{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
          .sm-material-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .sm-type-badge{padding:.2rem .6rem;border-radius:.3rem;font-size:.75rem;font-weight:600}
          .sm-file-badge{background:#f8fafc;color:#64748b;padding:.2rem .6rem;border-radius:.3rem;font-size:.75rem;font-weight:500;border:1px solid #e2e8f0}
          .sm-status-pill{padding:.25rem .75rem;border-radius:2rem;font-size:.75rem;font-weight:600;text-transform:uppercase;display:inline-flex;align-items:center;letter-spacing:.02em}
          .sm-status-published{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
          .sm-status-draft{background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1}
          .sm-upload-zone{border:2px dashed var(--border-light);border-radius:12px;padding:2rem;text-align:center;cursor:pointer;transition:.2s}
          .sm-upload-zone:hover{border-color:var(--primary);background:rgba(93,95,239,.03)}
          .sm-upload-link{color:var(--primary);font-weight:600}
          .sm-btn-icon{font-size:1.2rem;color:var(--text-muted);padding:.3rem;border-radius:6px;transition:.2s;cursor:pointer;background:none;border:none}
          .sm-btn-icon:hover{background:var(--bg-light);color:var(--primary)}
          .sm-text-danger{color:var(--danger)!important}
          .sm-badge-light{background:#f1f5f9;color:#475569;padding:.2rem .6rem;border-radius:.3rem;font-size:.8rem;font-weight:500}
          .sm-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn .2s ease}
          .sm-max-w-600{width:100%;max-width:640px}
          .sm-modal-content{max-height:90vh;overflow-y:auto}
          .sm-form-group{display:flex;flex-direction:column;gap:.35rem}
          .sm-form-group label{font-weight:600;font-size:.85rem;color:var(--text-main)}
          .sm-form-control{padding:.65rem .75rem;border-radius:8px;border:1.5px solid var(--border-light);font-size:.9rem;transition:.2s}
          .sm-form-control:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(93,95,239,.12);outline:none}
          .sm-grid-2{grid-template-columns:1fr 1fr}.sm-grid-3{grid-template-columns:repeat(3,1fr)}
          .sm-gap-1{gap:.75rem}.sm-mt-2{margin-top:1.5rem}.sm-mb-2{margin-bottom:1.5rem}.sm-mb-1{margin-bottom:.75rem}.sm-mb-0{margin-bottom:0}.sm-mt-1{margin-top:.75rem}.sm-padding-1{padding:1.25rem}
          .sm-text-xs{font-size:.75rem}.sm-text-sm{font-size:.85rem}.sm-text-muted{color:var(--text-muted)}.sm-font-bold{font-weight:600}
          .sm-flex-end{display:flex;justify-content:flex-end;align-items:center}
          .sm-btn-outline{background:transparent;border:1.5px solid var(--border-light);color:var(--text-main)}
          .sm-btn-outline:hover{border-color:var(--primary);color:var(--primary)}
          .sm-shadow-sm{box-shadow:var(--shadow-sm)}
          .sm-breadcrumb{font-size:.85rem;color:var(--text-muted);margin-top:.25rem}
          .spin{animation:spin 1s linear infinite}
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          @media(max-width:768px){.sm-grid-2,.sm-grid-3{grid-template-columns:1fr}}
        `}</style>
    </div>
  );
};

export default StudyMaterial;
