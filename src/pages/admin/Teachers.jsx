import { useState, useEffect, useRef, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import { getAuthValue } from '../../utils/auth';
import { 
  BiPlus, 
  BiSearchAlt, 
  BiEdit, 
  BiTrash, 
  BiUser, 
  BiX, 
  BiCheck, 
  BiUpload, 
  BiDownload, 
  BiSpreadsheet, 
  BiLoader, 
  BiBuildings, 
  BiCalendar, 
  BiWallet, 
  BiCreditCard, 
  BiIdCard, 
  BiShieldQuarter,
  BiKey
} from 'react-icons/bi';
import { 
  downloadExcelTemplate, 
  uploadExcel, 
  getAllStandards, 
  getAllDivisionsByStandardId,
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  changeTeacherStatus,
  resetTeacherPasswordBulk
} from '../../api/api';

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

/**
 * Teachers Management Page (Admin) — Complete API Integrated
 */
const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [resetDropdownOpen, setResetDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Standards and Divisions
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Excel upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStandards, setUploadStandards] = useState([]);
  const [uploadDivisions, setUploadDivisions] = useState([]);
  const [uploadForm, setUploadForm] = useState({ standardId: '', divisionId: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const uploadFileRef = useRef(null);

  // Derive session variables synchronously
  let schoolId = toNumber(getAuthValue('schoolId'));
  let academicYearId = toNumber(getAuthValue('academicYearId'));

  if (!schoolId || !academicYearId) {
    const payload = parseJwtPayload(localStorage.getItem('token') || sessionStorage.getItem('token'));
    if (payload) {
      if (!schoolId) schoolId = toNumber(payload.schoolId || payload.sid);
      if (!academicYearId) academicYearId = toNumber(payload.academicYearId || payload.ayi);
    }
  }
  if (!academicYearId) academicYearId = 6; // Safety Fallback

  // Form state structure matching AddTeacherDTO.java
  const emptyForm = {
    teacherName: '',
    gender: '',
    dateOfBirth: '',
    mobileNumber: '',
    emailId: '',
    salaryType: 'FIXED',
    joiningDate: new Date().toISOString().split('T')[0],
    annualSalary: '',
    monthlySalary: '',
    paidInHandSalary: '',
    address: '',
    aadharCardNumber: '',
    status: 'ACTIVE',
    standardId: '',
    divisionId: ''
  };
  const [formData, setFormData] = useState(emptyForm);

  // Fetch all teachers from API
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!schoolId || !academicYearId) throw new Error('Session context metadata is missing.');
      const res = await getAllTeachers(schoolId, academicYearId);
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setTeachers(res.data || []);
      } else {
        setError(res?.message || 'Failed to retrieve institutional faculty records.');
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError(err.message || 'Something went wrong while gathering teacher records.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId]);

  // Fetch standards on mount
  const fetchStandards = useCallback(async () => {
    try {
      if (!schoolId || !academicYearId) return;
      const res = await getAllStandards(schoolId, academicYearId);
      if (res && res.data) {
        setStandards(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error loading standards list:', err);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    fetchTeachers();
    fetchStandards();
  }, [fetchTeachers, fetchStandards]);

  // Filter teachers list by search bar input and status dropdown
  const filteredTeachers = teachers.filter(t => {
    const term = searchTerm.toLowerCase();
    const nameStr = t.teacherName ? t.teacherName.toLowerCase() : '';
    const emailStr = t.emailId ? t.emailId.toLowerCase() : '';
    const mobileStr = t.mobileNumber ? t.mobileNumber.toLowerCase() : '';
    
    const matchesSearch = nameStr.includes(term) || emailStr.includes(term) || mobileStr.includes(term);
    const matchesStatus = statusFilter === 'All' || String(t.status || '').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // --- CRUD Handlers ---
  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
    setDivisions([]);
    setShowFormModal(true);
  };

  const handleEdit = async (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      teacherName: teacher.teacherName || '',
      gender: teacher.gender || '',
      dateOfBirth: teacher.dateOfBirth || '',
      mobileNumber: teacher.mobileNumber || '',
      emailId: teacher.emailId || '',
      salaryType: teacher.salaryType || 'FIXED',
      joiningDate: teacher.joiningDate || '',
      annualSalary: teacher.annualSalary || '',
      monthlySalary: teacher.monthlySalary || '',
      paidInHandSalary: teacher.paidInHandSalary || '',
      address: teacher.address || '',
      aadharCardNumber: teacher.aadharCardNumber || '',
      status: teacher.status || 'ACTIVE',
      standardId: teacher.standardId || '',
      divisionId: teacher.divisionId || ''
    });

    // Populate divisions dynamically based on standardId if present
    if (teacher.standardId) {
      try {
        const res = await getAllDivisionsByStandardId({
          schoolId,
          standardId: Number(teacher.standardId),
          academicYearId
        });
        if (res && res.data) {
          setDivisions(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Error fetching standard sections for editing:', err);
        setDivisions([]);
      }
    } else {
      setDivisions([]);
    }

    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate monthly salary or annual salary if applicable
    if (name === 'monthlySalary') {
      const annual = value ? (Number(value) * 12).toString() : '';
      setFormData(prev => ({
        ...prev,
        monthlySalary: value,
        annualSalary: annual,
        paidInHandSalary: prev.paidInHandSalary || value
      }));
    } else if (name === 'annualSalary') {
      const monthly = value ? Math.round(Number(value) / 12).toString() : '';
      setFormData(prev => ({
        ...prev,
        annualSalary: value,
        monthlySalary: monthly,
        paidInHandSalary: prev.paidInHandSalary || monthly
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStandardChange = async (e) => {
    const stdId = e.target.value;
    setFormData(prev => ({ ...prev, standardId: stdId, divisionId: '' }));
    if (!stdId) {
      setDivisions([]);
      return;
    }
    try {
      const res = await getAllDivisionsByStandardId({
        schoolId,
        standardId: Number(stdId),
        academicYearId
      });
      if (res && res.data) {
        setDivisions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error loading standard divisions:', err);
      setDivisions([]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        schoolId: Number(schoolId),
        academicYearId: Number(academicYearId),
        teacherName: formData.teacherName,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        mobileNumber: formData.mobileNumber,
        emailId: formData.emailId,
        salaryType: formData.salaryType || null,
        joiningDate: formData.joiningDate || null,
        annualSalary: formData.annualSalary || null,
        monthlySalary: formData.monthlySalary || null,
        paidInHandSalary: formData.paidInHandSalary || null,
        address: formData.address || null,
        aadharCardNumber: formData.aadharCardNumber || null,
        status: formData.status || 'ACTIVE',
        standardId: formData.standardId ? Number(formData.standardId) : null,
        divisionId: formData.divisionId ? Number(formData.divisionId) : null
      };

      let res;
      if (editingTeacher) {
        payload.id = editingTeacher.id;
        res = await updateTeacher(payload);
      } else {
        res = await createTeacher(payload);
      }

      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setShowFormModal(false);
        fetchTeachers();
      } else {
        alert(res?.message || 'Action unsuccessful');
      }
    } catch (err) {
      console.error('Error saving teacher:', err);
      alert(err.message || 'Operation failed. Please verify duplicates.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      const res = await deleteTeacher({ id, schoolId });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setShowDeleteConfirm(null);
        fetchTeachers();
      } else {
        alert(res?.message || 'Delete operation unsuccessful');
      }
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert(err.message || 'Failed to delete teacher record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkResetPassword = async () => {
    if (selectedTeacherIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to reset passwords to date of birth (ddMMyyyy) for the ${selectedTeacherIds.length} selected teacher(s)?`)) return;

    setActionLoading(true);
    try {
      const res = await resetTeacherPasswordBulk({
        schoolId: Number(schoolId),
        teacherIds: selectedTeacherIds
      });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        alert(res.message || `Successfully reset passwords for ${selectedTeacherIds.length} teacher(s).`);
        setSelectedTeacherIds([]);
        fetchTeachers();
      } else {
        alert(res?.message || 'Bulk password reset failed.');
      }
    } catch (err) {
      console.error('Error resetting passwords bulk:', err);
      alert(err.message || 'Failed to complete bulk password reset.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Excel Upload Handlers ---
  const openUploadModal = async () => {
    setShowUploadModal(true);
    setUploadResult(null);
    setUploadFile(null);
    setUploadForm({ standardId: '', divisionId: '' });
    setUploadDivisions([]);
    try {
      const res = await getAllStandards(schoolId, academicYearId);
      if (res.data) setUploadStandards(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Error loading standards for Excel upload:', err); }
  };

  const handleUploadStandardChange = async (e) => {
    const stdId = e.target.value;
    setUploadForm(p => ({ ...p, standardId: stdId, divisionId: '' }));
    if (!stdId) { setUploadDivisions([]); return; }
    try {
      const res = await getAllDivisionsByStandardId({ schoolId, standardId: Number(stdId), academicYearId });
      if (res.data) setUploadDivisions(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Error loading divisions for Excel upload:', err); setUploadDivisions([]); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadExcelTemplate('teacher');
      const blob = res.data || res;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'teacher_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Error downloading template:', err); }
  };

  const handleExcelUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('schoolId', schoolId);
      fd.append('academicYearId', academicYearId);
      if (uploadForm.standardId) {
        fd.append('standardId', uploadForm.standardId);
      }
      if (uploadForm.divisionId) {
        fd.append('divisionId', uploadForm.divisionId);
      }
      const res = await uploadExcel('teacher', fd);
      setUploadResult(res.data || res);
    } catch (err) {
      console.error('Error uploading Excel file:', err);
      setUploadResult({ error: err.message || 'Excel upload session terminated abnormally' });
    } finally { setUploading(false); }
  };

  return (
    <div className="teachers-page space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Teachers Faculty
          </h1>
          <p className="text-sm text-slate-500">Management &gt; Teachers</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          {selectedTeacherIds.length > 0 && (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              onClick={handleBulkResetPassword}
            >
              <BiKey className="text-lg" /> Reset Passwords ({selectedTeacherIds.length})
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={openUploadModal}
          >
            <BiUpload className="text-lg" /> Upload Excel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            onClick={handleAdd}
          >
            <BiPlus className="text-lg" /> Onboard Teacher
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            className={`px-6 py-4 text-sm font-bold transition ${
              activeTab === 'list'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('list')}
          >
            Institutional Roster
          </button>
          <button
            className={`px-6 py-4 text-sm font-bold transition ${
              activeTab === 'salary'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('salary')}
          >
            Salary Payments
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'list' && (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <BiSearchAlt className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or mobile..."
                      className="w-full min-w-[280px] rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-80"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
                    {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                  <BiLoader className="animate-spin text-3xl text-indigo-600" />
                  <p className="text-sm font-medium">Retrieving institutional faculty roster...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="font-semibold text-red-600">{error}</p>
                  <button
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    onClick={fetchTeachers}
                  >
                    Retry Connection
                  </button>
                </div>
              ) : (
                <DataTable
                  headers={[
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '40px' }}>S.No.</div>,
                    'Faculty Member', 'Contact Details', 'Salary Plan', 'Institutional Group',
                    /* Status Column Header with Dropdown Filter */
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>
                      <button 
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          fontWeight: 'inherit',
                          fontSize: 'inherit',
                          textTransform: 'inherit',
                          letterSpacing: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                          fontFamily: 'inherit',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        Status {statusFilter !== 'All' ? `(${statusFilter})` : ''} ▾
                      </button>
                      {statusDropdownOpen && (
                        <>
                          <div 
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                            onClick={() => setStatusDropdownOpen(false)}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            padding: '4px 0',
                            zIndex: 1000,
                            minWidth: '110px',
                            textAlign: 'left',
                            marginTop: '4px'
                          }}>
                            <button
                              onClick={() => {
                                setStatusFilter('All');
                                setStatusDropdownOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                background: statusFilter === 'All' ? '#f1f5f9' : 'none',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '0.8rem',
                                color: '#374151',
                                cursor: 'pointer',
                                fontWeight: statusFilter === 'All' ? 700 : 600
                              }}
                              onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                              onMouseLeave={e => e.target.style.background = statusFilter === 'All' ? '#f1f5f9' : 'none'}
                            >
                              All
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter('Active');
                                setStatusDropdownOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                background: statusFilter === 'Active' ? '#f1f5f9' : 'none',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '0.8rem',
                                color: '#374151',
                                cursor: 'pointer',
                                fontWeight: statusFilter === 'Active' ? 700 : 600
                              }}
                              onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                              onMouseLeave={e => e.target.style.background = statusFilter === 'Active' ? '#f1f5f9' : 'none'}
                            >
                              Active
                            </button>
                            <button
                              onClick={() => {
                                setStatusFilter('Inactive');
                                setStatusDropdownOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                background: statusFilter === 'Inactive' ? '#f1f5f9' : 'none',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '0.8rem',
                                color: '#374151',
                                cursor: 'pointer',
                                fontWeight: statusFilter === 'Inactive' ? 700 : 600
                              }}
                              onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                              onMouseLeave={e => e.target.style.background = statusFilter === 'Inactive' ? '#f1f5f9' : 'none'}
                            >
                              Inactive
                            </button>
                          </div>
                        </>
                      )}
                    </div>,
                    /* Reset Column Header with Dropdown Action */
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '80px' }}>
                      <button 
                        onClick={() => setResetDropdownOpen(!resetDropdownOpen)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          fontWeight: 'inherit',
                          fontSize: 'inherit',
                          textTransform: 'inherit',
                          letterSpacing: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                          fontFamily: 'inherit',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        Reset ▾
                      </button>
                      {resetDropdownOpen && (
                        <>
                          <div 
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                            onClick={() => setResetDropdownOpen(false)}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            padding: '4px 0',
                            zIndex: 1000,
                            minWidth: '110px',
                            textAlign: 'left',
                            marginTop: '4px'
                          }}>
                            <button
                              onClick={() => {
                                setSelectedTeacherIds(filteredTeachers.map(t => t.id));
                                setResetDropdownOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '0.8rem',
                                color: '#374151',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                              onMouseLeave={e => e.target.style.background = 'none'}
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeacherIds([]);
                                setResetDropdownOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '0.8rem',
                                color: '#374151',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                              onMouseLeave={e => e.target.style.background = 'none'}
                            >
                              Deselect All
                            </button>
                          </div>
                        </>
                      )}
                    </div>,
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '120px' }}>Actions</div>
                  ]}
                  data={filteredTeachers}
                  renderRow={(teacher, index) => (
                    <tr key={teacher.id}>
                      <td style={{ textAlign: 'center', minWidth: '40px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          color: '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          {index + 1}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.teacherName)}&background=0d9488&color=fff&bold=true`} 
                            alt="" 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 8px rgba(13,148,136,0.25)', border: '2px solid #ccfbf1', objectFit: 'cover' }} 
                          />
                          <div>
                            <div 
                              style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.92rem', cursor: 'pointer', lineHeight: 1.3 }}
                              onClick={() => setViewingProfile(teacher)}
                              title="Click to view full profile"
                            >
                              {teacher.teacherName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ background: teacher.gender === 'FEMALE' ? '#fce7f3' : teacher.gender === 'MALE' ? '#dbeafe' : '#f3f4f6', color: teacher.gender === 'FEMALE' ? '#be185d' : teacher.gender === 'MALE' ? '#1d4ed8' : '#6b7280', padding: '1px 7px', borderRadius: '20px', fontWeight: 600, fontSize: '0.68rem', textTransform: 'capitalize' }}>
                                {teacher.gender ? teacher.gender.toLowerCase() : 'Not Specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: '180px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>
                          {teacher.mobileNumber}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                          {teacher.emailId}
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: '150px' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="badge badge-info" style={{ fontWeight: 700, fontSize: '0.7rem', width: 'fit-content', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px' }}>
                            {teacher.salaryType || 'FIXED'}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0d9488', fontSize: '0.88rem' }}>
                            ₹{Number(teacher.monthlySalary || 0).toLocaleString()} / mo
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', minWidth: '130px' }}>
                        {teacher.standardName ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '4px 10px', borderRadius: '8px' }}>
                            <BiBuildings style={{ color: '#0d9488', fontSize: '0.95rem' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f766e' }}>
                              {teacher.standardName} {teacher.divisionName ? `(${teacher.divisionName})` : ''}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '100px' }}>
                        <button
                          onClick={async () => {
                            const nextStatus = String(teacher.status).toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                            try {
                              setActionLoading(true);
                              const res = await changeTeacherStatus({
                                id: String(teacher.id),
                                schoolId: String(schoolId),
                                status: nextStatus
                              });
                              if (res && (res.status === 'SUCCESS' || res.code === 200)) {
                                fetchTeachers();
                              } else {
                                alert(res?.message || 'Failed to update teacher status.');
                              }
                            } catch (err) {
                              console.error('Error toggling teacher status:', err);
                              alert('Error occurred while updating status.');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          title="Click to toggle status"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
                            transition: 'all 0.2s ease',
                            ...(String(teacher.status).toUpperCase() === 'ACTIVE'
                              ? { background: '#dcfce7', color: '#15803d', boxShadow: '0 0 0 1px #bbf7d0' }
                              : { background: '#fee2e2', color: '#b91c1c', boxShadow: '0 0 0 1px #fecaca' })
                          }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: String(teacher.status).toUpperCase() === 'ACTIVE' ? '#16a34a' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                          {String(teacher.status).toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      {/* Select Checkbox */}
                      <td style={{ textAlign: 'center', minWidth: '80px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <label className="custom-checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={selectedTeacherIds.includes(teacher.id)} 
                              onChange={() => {
                                setSelectedTeacherIds(prev => 
                                  prev.includes(teacher.id) ? prev.filter(item => item !== teacher.id) : [...prev, teacher.id]
                                );
                              }} 
                            />
                            <span className="custom-checkbox-checkmark"></span>
                          </label>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setViewingProfile(teacher)}
                            title="View Profile"
                            style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: '#f5f3ff', border: 'none', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#6366f1',
                              cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(99,102,241,0.1)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <BiUser size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(teacher)}
                            title="Edit Credentials"
                            style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: '#ecfdf5', border: 'none', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#10b981',
                              cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(16,185,129,0.1)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <BiEdit size={16} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(teacher)}
                            title="Delete Record"
                            style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: '#fef2f2', border: 'none', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#ef4444',
                              cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(239,68,68,0.1)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <BiTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                />
              )}
            </>
          )}

          {activeTab === 'salary' && (
            <div className="text-center padding-2 text-muted" style={{ fontWeight: '600' }}>
              <BiCreditCard style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }} />
              <p>Salary disbursements module loading. Integrated with institute financial gateway.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== ADD / EDIT MODAL ===== */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-700">
            <div className="flex-between border-bottom pb-05" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>{editingTeacher ? 'Update Teacher Record' : 'Onboard New Faculty'}</h2>
                <p className="text-muted text-xs">Complete core registry credentials for school integration.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowFormModal(false)}><BiX style={{ fontSize: '1.4rem' }} /></button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-form-scroll" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                
                {/* 1. Core Profile Details */}
                <h4 className="form-section-title"><BiUser /> Core Faculty Profile</h4>
                <div className="grid grid-2 gap-1 mb-2">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="teacherName" className="form-control" placeholder="Enter full name" value={formData.teacherName} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" className="form-control" value={formData.gender} onChange={handleInputChange}>
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dateOfBirth" className="form-control" value={formData.dateOfBirth} onChange={handleInputChange} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} />
                  </div>
                  <div className="form-group">
                    <label>Aadhar Card Number</label>
                    <input type="text" name="aadharCardNumber" className="form-control" placeholder="XXXX-XXXX-XXXX" value={formData.aadharCardNumber} onChange={handleInputChange} maxLength={14} />
                  </div>
                </div>

                {/* 2. Contact Credentials */}
                <h4 className="form-section-title"><BiIdCard /> Institutional Contacts</h4>
                <div className="grid grid-2 gap-1 mb-2">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="emailId" className="form-control" placeholder="faculty@school.com" value={formData.emailId} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" name="mobileNumber" className="form-control" placeholder="10 digit number" value={formData.mobileNumber} onChange={handleInputChange} required maxLength={10} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Residential Address</label>
                    <input type="text" name="address" className="form-control" placeholder="Full residential details" value={formData.address} onChange={handleInputChange} />
                  </div>
                </div>

                {/* 3. Class & Section Assignment */}
                <h4 className="form-section-title"><BiBuildings /> Structural Placement</h4>
                <div className="grid grid-2 gap-1 mb-2">
                  <div className="form-group">
                    <label>Grade / Class Assignment</label>
                    <select name="standardId" className="form-control" value={formData.standardId} onChange={handleStandardChange}>
                      <option value="">-- No Class Assigned --</option>
                      {standards.map(s => (
                        <option key={s.standardId || s.id} value={s.standardId || s.id}>{s.standard || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Division / Section</label>
                    <select name="divisionId" className="form-control" value={formData.divisionId} onChange={handleInputChange} disabled={!formData.standardId}>
                      <option value="">-- Select Section --</option>
                      {divisions.map(d => (
                        <option key={d.divisionId || d.id} value={d.divisionId || d.id}>{d.divisionName || d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Financial Structure */}
                <h4 className="form-section-title"><BiWallet /> Financial Setup</h4>
                <div className="grid grid-2 gap-1 mb-2">
                  <div className="form-group">
                    <label>Salary Schedule</label>
                    <select name="salaryType" className="form-control" value={formData.salaryType} onChange={handleInputChange}>
                      <option value="FIXED">Fixed Monthly</option>
                      <option value="CONTRACT">Contractual</option>
                      <option value="HOURLY">Hourly Billing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Joining Date</label>
                    <input type="date" name="joiningDate" className="form-control" value={formData.joiningDate} onChange={handleInputChange} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} />
                  </div>
                  <div className="form-group">
                    <label>Monthly Gross Salary (₹)</label>
                    <input type="number" name="monthlySalary" className="form-control" placeholder="Gross Monthly Salary" value={formData.monthlySalary} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Annual Package (₹)</label>
                    <input type="number" name="annualSalary" className="form-control" placeholder="Annual CTC" value={formData.annualSalary} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Paid In-Hand Salary (₹)</label>
                    <input type="number" name="paidInHandSalary" className="form-control" placeholder="Net payout" value={formData.paidInHandSalary} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Roster Status</label>
                    <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                      <option value="ACTIVE">Active Faculty</option>
                      <option value="INACTIVE">Inactive / On Leave</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="flex-end gap-1 border-top pt-1" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowFormModal(false)} disabled={actionLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <><BiLoader className="spin" /> Saving...</> : <><BiCheck /> {editingTeacher ? 'Update Records' : 'Onboard Teacher'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW PROFILE MODAL ===== */}
      {viewingProfile && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-700 no-padding overflow-hidden" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            {/* Header Hero Section */}
            <div className="profile-hero" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)', padding: '2.5rem 2rem 2rem 2rem', position: 'relative' }}>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewingProfile.teacherName)}&size=128&background=fff&color=0d9488&bold=true`} 
                    alt="" 
                    style={{ width: '90px', height: '90px', borderRadius: '24px', border: '4px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', objectFit: 'cover' }} 
                  />
                  <div>
                    <h2 className="mb-0 text-white" style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'white' }}>
                      {viewingProfile.teacherName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ background: 'white', color: '#0d9488', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Faculty Member
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ID: #{viewingProfile.id}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="btn-icon" 
                  onClick={() => setViewingProfile(null)} 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', cursor: 'pointer', transition: '0.2s', fontSize: '1.2rem' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                >
                  <BiX />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body-scroll" style={{ padding: '2rem', maxHeight: '55vh', overflowY: 'auto', background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Group 1: Personal Particulars */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiUser style={{ color: '#0d9488', fontSize: '1.2rem' }} /> Personal Details
                </h4>
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Gender</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{viewingProfile.gender ? String(viewingProfile.gender).toLowerCase() : 'Not Specified'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Date of Birth</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.dateOfBirth ? new Date(viewingProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Registered'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Email Address</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={viewingProfile.emailId}>{viewingProfile.emailId || 'Not Provided'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Mobile Number</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.mobileNumber || 'Not Provided'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Residential Address</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, lineHeight: '1.4' }}>{viewingProfile.address || 'Not Registered'}</span>
                  </div>
                </div>
              </div>

              {/* Group 2: Employment Setup */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiBuildings style={{ color: '#0ea5e9', fontSize: '1.2rem' }} /> Employment Setup
                </h4>
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Roster Status</span>
                    <span className={`status-badge ${String(viewingProfile.status).toLowerCase() === 'active' ? 'active' : 'inactive'}`} style={{ margin: 0, padding: '2px 8px', fontSize: '0.7rem' }}>
                      {viewingProfile.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Placement Class</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.standardName ? `${viewingProfile.standardName} ${viewingProfile.divisionName ? `(${viewingProfile.divisionName})` : ''}` : 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Grade/Salary Type</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.salaryType || 'FIXED'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Joining Date</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.joiningDate ? new Date(viewingProfile.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Provided'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Aadhar Ref</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.aadharCardNumber || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* Group 3: Financial Compensation (Full Width) */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiWallet style={{ color: '#10b981', fontSize: '1.2rem' }} /> Compensation & Salary Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>MONTHLY GROSS SALARY</div>
                    <div style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginTop: '4px' }}>₹{Number(viewingProfile.monthlySalary || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ANNUAL COST TO COMPANY</div>
                    <div style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginTop: '4px' }}>₹{Number(viewingProfile.annualSalary || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: 'inset 0 0 0 1px #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#14532d', fontWeight: 600 }}>NET TAKE HOME</div>
                    <div style={{ fontSize: '1.25rem', color: '#16a34a', fontWeight: 800, marginTop: '2px' }}>₹{Number(viewingProfile.paidInHandSalary || viewingProfile.monthlySalary || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-light padding-1 flex-end gap-1 border-top" style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#f8fafc' }}>
              <button className="btn btn-outline" onClick={() => setViewingProfile(null)} style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', fontWeight: 600 }}>Close Profile</button>
              <button className="btn btn-primary" onClick={() => { setViewingProfile(null); handleEdit(viewingProfile); }} style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', fontWeight: 600, background: '#0d9488', borderColor: '#0d9488' }}>Edit Credentials</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content card" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '0.5rem' }}>⚠️</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Delete Teacher Record?</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete <strong>{showDeleteConfirm.teacherName}</strong> from the institutional registry? This action is irreversible.
            </p>
            <div className="flex-center gap-1">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)} disabled={actionLoading} style={{ flex: 1 }}>Cancel</button>
              <button className="btn" disabled={actionLoading} style={{ background: '#ef4444', color: 'white', flex: 1 }} onClick={() => handleDelete(showDeleteConfirm.id)}>
                {actionLoading ? <BiLoader className="spin" /> : <><BiTrash /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EXCEL UPLOAD MODAL ===== */}
      {showUploadModal && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div className="flex-between border-bottom pb-05" style={{ marginBottom: '1.5rem' }}>
              <h2><BiSpreadsheet style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--primary)' }} />Bulk Import Roster</h2>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}><BiX style={{ fontSize: '1.2rem' }} /></button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <button className="btn btn-outline flex-center gap-1 w-100" onClick={handleDownloadTemplate} style={{ justifyContent: 'center' }}>
                <BiDownload /> Download Template (.xlsx)
              </button>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Standard / Class Placement (Optional)</label>
                <select className="form-control" value={uploadForm.standardId} onChange={handleUploadStandardChange}>
                  <option value="">Select Standard</option>
                  {uploadStandards.map(s => <option key={s.id || s.standardId} value={s.id || s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Division / Section (Optional)</label>
                <select className="form-control" value={uploadForm.divisionId} onChange={e => setUploadForm(p => ({ ...p, divisionId: e.target.value }))} disabled={!uploadForm.standardId}>
                  <option value="">Select Division</option>
                  {uploadDivisions.map(d => <option key={d.id || d.divisionId} value={d.id || d.divisionId}>{d.divisionName || d.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Roster Spreadsheet</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }} onClick={() => uploadFileRef.current?.click()}>
                  <input type="file" ref={uploadFileRef} accept=".xlsx,.xls" style={{ display: 'none'}} onChange={e => setUploadFile(e.target.files[0])} />
                  {uploadFile ? (
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary)' }}>{uploadFile.name}</p>
                  ) : (
                    <p style={{ margin: 0, color: '#64748b' }}>Click to select standard .xlsx template</p>
                  )}
                </div>
              </div>

              {uploadResult && !uploadResult.error && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#16a34a' }}>Upload Session Completed</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Total: {uploadResult.totalRows} | Successfully Onboarded: {uploadResult.successCount} | Failed: {uploadResult.failedCount || 0}</p>
                  {uploadResult.failedRows && uploadResult.failedRows.length > 0 && (
                    <div style={{ marginTop: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                      {uploadResult.failedRows.map((f, i) => (
                        <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#dc2626' }}>Row {f.row}: {f.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {uploadResult && uploadResult.error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', color: '#dc2626', fontSize: '0.85rem' }}>{uploadResult.error}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setShowUploadModal(false)}>Close</button>
                <button className="btn btn-primary flex-center gap-1" onClick={handleExcelUpload} disabled={uploading || !uploadFile}>
                  {uploading ? <><BiLoader className="excel-spinner" /> Processing...</> : <><BiUpload /> Upload Excel</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
        FIX: Saari helper classes ab `.teachers-page` ke andar scoped hain.
        Pehle ye global thi (jaise .mb-2, .gap-2, .py-3, .block) aur Tailwind ki
        same naam wali classes ko override karke Sidebar bigaad rahi thi.
      */}
      <style>{`
        .teachers-page { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .teachers-page .tab-btn { color: #64748b; border-bottom: 2px solid transparent; cursor: pointer; transition: 0.3s; background: none; border: none; }
        .teachers-page .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background-color: rgba(79, 70, 229, 0.04); }
        
        .teachers-page .badge-info { background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 700; }

        .teachers-page .status-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 700; display: inline-block; text-align: center; }
        .teachers-page .status-badge.active { background: #dcfce7; color: #15803d; }
        .teachers-page .status-badge.inactive { background: #fee2e2; color: #b91c1c; }
        
        .teachers-page .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; }
        .teachers-page .max-w-700 { width: 100%; max-width: 700px; }
        .teachers-page .max-w-600 { width: 100%; max-width: 600px; }
        .teachers-page .no-padding { padding: 0 !important; }
        .teachers-page .overflow-hidden { overflow: hidden; }
        .teachers-page .pb-05 { padding-bottom: 0.5rem; }
        .teachers-page .mb-1 { margin-bottom: 1rem; }
        .teachers-page .mb-2 { margin-bottom: 2rem; }
        .teachers-page .block { display: block; }
        .teachers-page .w-fit { width: fit-content; }
        .teachers-page .mt-1 { margin-top: 1rem; }
        
        .teachers-page .grid-2 { grid-template-columns: 1fr 1fr; }
        .teachers-page .gap-1 { gap: 1rem; }
        .teachers-page .gap-2 { gap: 2rem; }
        .teachers-page .flex-end { display: flex; justify-content: flex-end; }
        .teachers-page .padding-1 { padding: 1rem; }
        .teachers-page .padding-2 { padding: 2rem; }
        .teachers-page .bg-light { background: #f8fafc; }
        .teachers-page .text-white { color: white; }
        .teachers-page .mb-0 { margin-bottom: 0; }
        .teachers-page .border-bottom { border-bottom: 1px solid #e2e8f0; }
        .teachers-page .border-top { border-top: 1px solid #e2e8f0; }
        .teachers-page .pt-1 { padding-top: 1rem; }
        .teachers-page .py-3 { padding-top: 3rem; padding-bottom: 3rem; }
        
        .teachers-page .form-section-title { 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          font-size: 0.95rem; 
          font-weight: 700; 
          color: var(--primary); 
          margin: 1.5rem 0 1rem 0; 
          border-bottom: 1px dashed #cbd5e1; 
          padding-bottom: 0.25rem;
        }

        .teachers-page .btn-outline { background: white; border: 1px solid #cbd5e1; color: #334155; padding: 0.65rem 1.3rem; border-radius: 10px; cursor: pointer; font-weight: 600; transition: 0.2s; }
        .teachers-page .btn-outline:hover { background: #f1f5f9; border-color: #94a3b8; }
        
        .teachers-page .info-group p { margin-bottom: 0.75rem; font-size: 0.9rem; color: #334155; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }
        .teachers-page .info-group p strong { color: #0f172a; font-weight: 600; display: inline-block; width: 140px; }
        .teachers-page .excel-spinner { animation: spin 1s linear infinite; }
        .teachers-page .spin { animation: spin 1.2s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .teachers-page .w-100 { width: 100%; }
        
        .teachers-page .modal-form-scroll::-webkit-scrollbar { width: 6px; }
        .teachers-page .modal-form-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .teachers-page .modal-form-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }

        /* Teacher count pill */
        .teachers-page .teacher-count-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #0d9488, #0ea5e9);
          color: white; padding: 4px 14px; border-radius: 20px;
          font-size: 0.8rem; font-weight: 700; box-shadow: 0 2px 8px rgba(13,148,136,0.3);
        }

        /* Custom Checkbox styles for premium look */
        .teachers-page .custom-checkbox-container {
          display: inline-block;
          position: relative;
          cursor: pointer;
          user-select: none;
          width: 18px;
          height: 18px;
        }

        .teachers-page .custom-checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .teachers-page .custom-checkbox-checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 18px;
          width: 18px;
          background-color: #fff;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          transition: all 0.2s ease-in-out;
        }

        .teachers-page .custom-checkbox-container:hover input ~ .custom-checkbox-checkmark {
          border-color: #0d9488;
          background-color: #f8fafc;
        }

        .teachers-page .custom-checkbox-container input:checked ~ .custom-checkbox-checkmark {
          background-color: #0d9488;
          border-color: #0d9488;
          box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
        }

        .teachers-page .custom-checkbox-checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .teachers-page .custom-checkbox-container input:checked ~ .custom-checkbox-checkmark:after {
          display: block;
        }

        .teachers-page .custom-checkbox-container .custom-checkbox-checkmark:after {
          left: 5px;
          top: 1.5px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      `}</style>
    </div>
  );
};

export default Teachers;