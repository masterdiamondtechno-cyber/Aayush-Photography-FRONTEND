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
  BiBriefcase,
  BiChevronLeft,
  BiChevronRight,
  BiIdCard,
  BiCalendar,
  BiWallet,
  BiShieldQuarter,
  BiBuildings,
  BiKey
} from 'react-icons/bi';
import { 
  downloadExcelTemplate, 
  uploadExcel, 
  getAllStandards, 
  getAllDivisionsByStandardId,
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  updateStudentStatus,
  resetStudentPassword,
  resetPasswordBulk
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
 * Students Management Page (Admin) — Complete API Integrated
 */
const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [resetDropdownOpen, setResetDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  
  // Filter States
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [filterDivisions, setFilterDivisions] = useState([]);
  const [standards, setStandards] = useState([]);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formStep, setFormStep] = useState(1);

  // Form Divisions dropdown
  const [formDivisions, setFormDivisions] = useState([]);

  // Excel upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStandards, setUploadStandards] = useState([]);
  const [uploadDivisions, setUploadDivisions] = useState([]);
  const [uploadForm, setUploadForm] = useState({ standardId: '', divisionId: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const uploadFileRef = useRef(null);

  // Derive session variables safely
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

  // Form state structure matching AddStudentDTO.java
  const emptyForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    mobileNumber: '',
    emailId: '',
    guardianName: '',
    parentMobileNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    standardId: '',
    divisionId: '',
    feeType: 'REGULAR',
    totalFee: '',
    discount: '',
    finalFee: '',
    address: '',
    aadharNumber: '',
    status: 'ACTIVE'
  };
  const [formData, setFormData] = useState(emptyForm);

  // Fetch all students from API
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!schoolId || !academicYearId) throw new Error('Session context metadata is missing.');
      const res = await getAllStudents(schoolId, academicYearId);
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setStudents(res.data || []);
      } else {
        setError(res?.message || 'Failed to retrieve institutional student records.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Something went wrong while gathering student records.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId]);

  // Fetch standards list on mount
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
    fetchStudents();
    fetchStandards();
  }, [fetchStudents, fetchStandards]);

  // Handle cascading filter standard change
  const handleFilterStandardChange = async (stdId) => {
    setSelectedStandard(stdId);
    setSelectedDivision('All');
    setFilterDivisions([]);
    if (stdId === 'All') return;

    try {
      const res = await getAllDivisionsByStandardId({
        schoolId,
        standardId: Number(stdId),
        academicYearId
      });
      if (res && res.data) {
        setFilterDivisions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error loading filter divisions:', err);
    }
  };

  // Filter students based on UI selections
  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    const nameStr = s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase() : '';
    const emailStr = s.emailId ? s.emailId.toLowerCase() : '';
    const mobileStr = s.mobileNumber ? s.mobileNumber.toLowerCase() : '';
    const studentIdStr = s.studentId ? s.studentId.toLowerCase() : '';
    
    const matchesSearch = nameStr.includes(term) || emailStr.includes(term) || mobileStr.includes(term) || studentIdStr.includes(term);
    const matchesStd = selectedStandard === 'All' || String(s.standardId) === String(selectedStandard);
    const matchesDiv = selectedDivision === 'All' || String(s.divisionId) === String(selectedDivision);
    const matchesStatus = statusFilter === 'All' || String(s.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStd && matchesDiv && matchesStatus;
  });

  // --- CRUD Handlers ---
  const handleAdd = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setFormDivisions([]);
    setFormStep(1);
    setShowFormModal(true);
  };

  const handleEdit = async (student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth || '',
      mobileNumber: student.mobileNumber || '',
      emailId: student.emailId || '',
      guardianName: student.guardianName || '',
      parentMobileNumber: student.parentMobileNumber || '',
      admissionDate: student.admissionDate || '',
      standardId: student.standardId || '',
      divisionId: student.divisionId || '',
      feeType: student.feeType || 'REGULAR',
      totalFee: student.totalFee || '',
      discount: student.discount || '',
      finalFee: student.finalFee || '',
      address: student.address || '',
      aadharNumber: student.aadharNumber || '',
      status: student.status || 'ACTIVE'
    });

    // Load divisions dynamically for the selected standard
    if (student.standardId) {
      try {
        const res = await getAllDivisionsByStandardId({
          schoolId,
          standardId: Number(student.standardId),
          academicYearId
        });
        if (res && res.data) {
          setFormDivisions(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Error prefetching sections for editing student:', err);
        setFormDivisions([]);
      }
    } else {
      setFormDivisions([]);
    }

    setFormStep(1);
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate final fee if gross or discount changes
    if (name === 'totalFee') {
      const disc = formData.discount || 0;
      const final = value ? (Number(value) - Number(disc)).toString() : '';
      setFormData(prev => ({ ...prev, totalFee: value, finalFee: final }));
    } else if (name === 'discount') {
      const gross = formData.totalFee || 0;
      const final = gross ? (Number(gross) - Number(value)).toString() : '';
      setFormData(prev => ({ ...prev, discount: value, finalFee: final }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormStandardChange = async (e) => {
    const stdId = e.target.value;
    setFormData(prev => ({ ...prev, standardId: stdId, divisionId: '' }));
    if (!stdId) {
      setFormDivisions([]);
      return;
    }
    try {
      const res = await getAllDivisionsByStandardId({
        schoolId,
        standardId: Number(stdId),
        academicYearId
      });
      if (res && res.data) {
        setFormDivisions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error loading sections for onboarding:', err);
      setFormDivisions([]);
    }
  };

  const handleFormSubmit = async () => {
    // Validate compulsory fields
    if (!formData.firstName?.trim()) {
      alert("First name is compulsory");
      return;
    }
    if (!formData.lastName?.trim()) {
      alert("Last name is compulsory");
      return;
    }
    if (!formData.aadharNumber?.trim()) {
      alert("Aadhar Number is compulsory");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        schoolId: Number(schoolId),
        academicYearId: Number(academicYearId),
        standardId: Number(formData.standardId),
        divisionId: Number(formData.divisionId),
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        mobileNumber: formData.mobileNumber?.trim() || null,
        emailId: formData.emailId?.trim() || null,
        guardianName: formData.guardianName?.trim() || null,
        parentMobileNumber: formData.parentMobileNumber?.trim() || null,
        admissionDate: formData.admissionDate || null,
        feeType: formData.feeType || 'REGULAR',
        totalFee: formData.totalFee ? Number(formData.totalFee) : null,
        discount: formData.discount ? Number(formData.discount) : null,
        finalFee: formData.finalFee ? Number(formData.finalFee) : null,
        address: formData.address || null,
        aadharNumber: formData.aadharNumber.trim(),
        status: formData.status || 'ACTIVE'
      };

      let res;
      if (editingStudent) {
        payload.id = editingStudent.id;
        res = await updateStudent(payload);
      } else {
        res = await createStudent(payload);
      }

      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setShowFormModal(false);
        fetchStudents();
      } else {
        alert(res?.message || 'Operation unsuccessful');
      }
    } catch (err) {
      console.error('Error saving student profile:', err);
      alert(err.message || 'Operation failed. Please verify duplicates.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      const res = await deleteStudent({ id, schoolId });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setShowDeleteConfirm(null);
        fetchStudents();
      } else {
        alert(res?.message || 'Delete operation unsuccessful');
      }
    } catch (err) {
      console.error('Error deleting student record:', err);
      alert(err.message || 'Failed to delete student record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async (student) => {
    const nextStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await updateStudentStatus({
        id: student.id,
        schoolId,
        status: nextStatus
      });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        fetchStudents();
      } else {
        alert(res?.message || 'Failed to toggle account status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSingleResetPassword = async (student) => {
    if (!window.confirm(`Are you sure you want to reset the password to date of birth (ddMMyyyy) for ${student.firstName} ${student.lastName}?`)) return;

    setActionLoading(true);
    try {
      const res = await resetStudentPassword({
        schoolId: Number(schoolId),
        studentId: student.id
      });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        alert(res.message || `Successfully reset password for ${student.firstName} ${student.lastName}.`);
        fetchStudents();
      } else {
        alert(res?.message || 'Password reset failed.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert(err.message || 'Failed to reset student password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkResetPassword = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to reset passwords to date of birth (ddMMyyyy) for the ${selectedStudentIds.length} selected student(s)?`)) return;

    setActionLoading(true);
    try {
      const res = await resetPasswordBulk({
        schoolId: Number(schoolId),
        studentIds: selectedStudentIds
      });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        alert(res.message || `Successfully reset passwords for ${selectedStudentIds.length} student(s).`);
        setSelectedStudentIds([]);
        fetchStudents();
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
      const res = await downloadExcelTemplate('student');
      const blob = res.data || res;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Error downloading template:', err); }
  };

  const handleExcelUpload = async () => {
    if (!uploadFile || !uploadForm.standardId || !uploadForm.divisionId) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('schoolId', schoolId);
      fd.append('academicYearId', academicYearId);
      fd.append('standardId', uploadForm.standardId);
      fd.append('divisionId', uploadForm.divisionId);
      const res = await uploadExcel('student', fd);
      setUploadResult(res.data || res);
    } catch (err) {
      console.error('Error uploading Excel file:', err);
      setUploadResult({ error: err.message || 'Excel upload session terminated abnormally' });
    } finally { setUploading(false); }
  };

  return (
    <div className="students-page space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Students Registry
          </h1>
          <p className="text-sm text-slate-500">Management &gt; Students</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedStudentIds.length > 0 && (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              onClick={handleBulkResetPassword}
            >
              <BiKey size={16} /> Reset Passwords ({selectedStudentIds.length})
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={openUploadModal}
          >
            <BiUpload size={16} /> Upload Excel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-lg"
            onClick={handleAdd}
          >
            <BiPlus size={16} /> Onboard Student
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="p-5 sm:p-6">
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-600">Class Grade:</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  value={selectedStandard}
                  onChange={(e) => handleFilterStandardChange(e.target.value)}
                >
                  <option value="All">All Grades</option>
                  {standards.map(std => (
                    <option key={std.standardId || std.id} value={std.standardId || std.id}>{std.standard || std.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-600">Section:</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  disabled={selectedStandard === 'All'}
                >
                  <option value="All">All Sections</option>
                  {filterDivisions.map(d => (
                    <option key={d.divisionId || d.id} value={d.divisionId || d.id}>{d.divisionName || d.name}</option>
                  ))}
                </select>
              </div>

              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="relative">
              <BiSearchAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search student ID, name, or email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-72"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-wrapper py-3">
              <BiLoader className="spin" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
              <p className="mt-1 text-muted">Retrieving institutional student registry...</p>
            </div>
          ) : error ? (
            <div className="error-wrapper py-3 text-center">
              <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
              <button className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={fetchStudents}>Retry Connection</button>
            </div>
          ) : (
            <DataTable
              headers={[
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '40px' }}>S.No.</div>,
                'Student', 'Contact Info', 'Class & Section',
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minWidth: '100px' }}>Student ID</div>,
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
                            setSelectedStudentIds(filteredStudents.map(s => s.id));
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
                            setSelectedStudentIds([]);
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
              data={filteredStudents}
              renderRow={(student, index) => (
                <tr key={student.id}>
                  {/* S.No. */}
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

                  {/* Student name + avatar */}
                  <td style={{ textAlign: 'left', minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent((student.firstName||'') + '+' + (student.lastName||''))}&background=6366f1&color=fff&bold=true&size=80`}
                        alt=""
                        style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.25)', border: '2px solid #e0e7ff' }}
                      />
                      <div>
                        <div
                          style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.92rem', cursor: 'pointer', lineHeight: 1.3 }}
                          onClick={() => setViewingProfile(student)}
                          title="Click to view full profile"
                        >
                          {student.firstName} {student.middleName ? student.middleName[0] + '. ' : ''}{student.lastName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ background: student.gender === 'FEMALE' ? '#fce7f3' : student.gender === 'MALE' ? '#dbeafe' : '#f3f4f6', color: student.gender === 'FEMALE' ? '#be185d' : student.gender === 'MALE' ? '#1d4ed8' : '#6b7280', padding: '1px 7px', borderRadius: '20px', fontWeight: 600, fontSize: '0.68rem', textTransform: 'capitalize' }}>
                            {student.gender ? student.gender.toLowerCase() : 'N/A'}
                          </span>
                          <span style={{ color: '#d1d5db' }}>·</span>
                          <span style={{ color: '#a5b4fc', fontWeight: 600 }}>#{student.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact info */}
                  <td style={{ textAlign: 'left', minWidth: '180px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>
                      {student.mobileNumber || <span style={{ color: '#d1d5db' }}>No phone</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.emailId || <span style={{ color: '#d1d5db' }}>No email</span>}
                    </div>
                  </td>

                  {/* Class & Section */}
                  <td style={{ textAlign: 'left', minWidth: '130px' }}>
                    {student.standard ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#5b21b6', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <BiBuildings style={{ fontSize: '0.75rem' }} />
                          {student.standard}
                        </span>
                        {student.divisionName && (
                          <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 8px', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #bae6fd' }}>
                            {student.divisionName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '0.82rem', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>

                  {/* Student ID */}
                  <td style={{ textAlign: 'center', minWidth: '100px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
                      {student.studentId || `#${student.id}`}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ textAlign: 'center', minWidth: '100px' }}>
                    <button
                      onClick={() => handleStatusToggle(student)}
                      title="Click to toggle status"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
                        transition: 'all 0.2s ease',
                        ...(String(student.status).toLowerCase() === 'active'
                           ? { background: '#dcfce7', color: '#15803d', boxShadow: '0 0 0 1px #bbf7d0' }
                           : { background: '#fee2e2', color: '#b91c1c', boxShadow: '0 0 0 1px #fecaca' })
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: String(student.status).toLowerCase() === 'active' ? '#16a34a' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                      {String(student.status).toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Select Checkbox */}
                  <td style={{ textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <label className="custom-checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={selectedStudentIds.includes(student.id)} 
                          onChange={() => handleSelectStudent(student.id)} 
                        />
                        <span className="custom-checkbox-checkmark"></span>
                      </label>
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center', minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setViewingProfile(student)}
                        title="View Profile"
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e0e7ff', background: '#f5f3ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#6366f1'; e.currentTarget.style.color='white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.color='#6366f1'; }}
                      ><BiUser /></button>
                      <button
                        onClick={() => handleEdit(student)}
                        title="Edit Student"
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#059669'; e.currentTarget.style.color='white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.color='#059669'; }}
                      ><BiEdit /></button>
                      <button
                        onClick={() => setShowDeleteConfirm(student)}
                        title="Delete Student"
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff1f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#fff1f2'; e.currentTarget.style.color='#ef4444'; }}
                      ><BiTrash /></button>
                    </div>
                  </td>

                </tr>
              )}
            />
          )}
        </div>
      </div>

      {/* ===== ADD / EDIT MULTI-STEP MODAL ===== */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-700">
            <div className="modal-header border-bottom pb-05" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{editingStudent ? 'Update Student Record' : 'Onboard New Student'}</h2>
                <p className="text-muted text-xs">Complete core registry credentials for school integration.</p>
              </div>
              <div className="flex-center gap-2">
                <span className="badge badge-info text-xs" style={{ padding: '0.4rem 0.8rem', borderRadius: '10px' }}>Step {formStep} of 3</span>
                <button className="btn-icon" onClick={() => setShowFormModal(false)}><BiX style={{ fontSize: '1.4rem' }} /></button>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ flex: 1, height: '4px', borderRadius: '4px', background: step <= formStep ? 'var(--primary)' : '#e2e8f0', transition: '0.3s' }} />
              ))}
            </div>

            <form onSubmit={e => e.preventDefault()}>
              <div className="modal-form-scroll" style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                
                {/* STEP 1: Personal Details */}
                {formStep === 1 && (
                  <div className="form-step slide-in">
                    <h4 className="form-section-title"><BiUser /> Core Student Profile</h4>
                    <div className="grid grid-2 gap-1 mb-1">
                      <div className="form-group">
                        <label>First Name *</label>
                        <input type="text" name="firstName" className="form-control" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Middle Name</label>
                        <input type="text" name="middleName" className="form-control" placeholder="Middle Name" value={formData.middleName} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Last Name *</label>
                        <input type="text" name="lastName" className="form-control" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required />
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
                        <label>Aadhar Number *</label>
                        <input type="text" name="aadharNumber" className="form-control" placeholder="Aadhar Reference" value={formData.aadharNumber} onChange={handleInputChange} maxLength={12} required />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" name="emailId" className="form-control" placeholder="student@school.com" value={formData.emailId} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile Number</label>
                        <input type="tel" name="mobileNumber" className="form-control" placeholder="Primary Contact" value={formData.mobileNumber} onChange={handleInputChange} maxLength={10} />
                      </div>
                      <div className="form-group">
                        <label>Admission Date</label>
                        <input type="date" name="admissionDate" className="form-control" value={formData.admissionDate} onChange={handleInputChange} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Parents & Residential Info */}
                {formStep === 2 && (
                  <div className="form-step slide-in">
                    <h4 className="form-section-title"><BiIdCard /> Emergency & Guardian details</h4>
                    <div className="grid grid-2 gap-1 mb-1">
                      <div className="form-group">
                        <label>Guardian / Parent Name</label>
                        <input type="text" name="guardianName" className="form-control" placeholder="Guardian / Parent Name" value={formData.guardianName} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Parent Contact Number</label>
                        <input type="tel" name="parentMobileNumber" className="form-control" placeholder="Primary contact mobile" value={formData.parentMobileNumber} onChange={handleInputChange} maxLength={10} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Residential Address</label>
                        <input type="text" name="address" className="form-control" placeholder="Full residential details" value={formData.address} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Academic Placement & Fees */}
                {formStep === 3 && (
                  <div className="form-step slide-in">
                    <h4 className="form-section-title"><BiBuildings /> Grade Placement & Fees</h4>
                    <div className="grid grid-2 gap-1 mb-1">
                      <div className="form-group">
                        <label>Grade / Class Assignment *</label>
                        <select name="standardId" className="form-control" value={formData.standardId} onChange={handleFormStandardChange} required>
                          <option value="">Select standard grade...</option>
                          {standards.map(s => (
                            <option key={s.standardId || s.id} value={s.standardId || s.id}>{s.standard || s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Division / Section *</label>
                        <select name="divisionId" className="form-control" value={formData.divisionId} onChange={handleInputChange} required disabled={!formData.standardId}>
                          <option value="">Select division...</option>
                          {formDivisions.map(d => (
                            <option key={d.divisionId || d.id} value={d.divisionId || d.id}>{d.divisionName || d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fee Plan Type</label>
                        <select name="feeType" className="form-control" value={formData.feeType} onChange={handleInputChange}>
                          <option value="REGULAR">Regular Tuition Plan</option>
                          <option value="SCHOLARSHIP">Scholarship Plan</option>
                          <option value="STAFF_CONCESSION">Staff Concession</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Gross Course Fee (₹)</label>
                        <input type="number" name="totalFee" className="form-control" placeholder="Annual Tuition Package" value={formData.totalFee} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Scholarship / Discount (₹)</label>
                        <input type="number" name="discount" className="form-control" placeholder="Applied concessions" value={formData.discount} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Net Payout Fee (₹)</label>
                        <input type="number" name="finalFee" className="form-control" placeholder="Net tuition fee" value={formData.finalFee} readOnly style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                      </div>
                      <div className="form-group">
                        <label>Roster Status</label>
                        <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                          <option value="ACTIVE">Active Student</option>
                          <option value="INACTIVE">Inactive / Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="flex-between border-top pt-1" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline flex-center gap-1" onClick={() => formStep === 1 ? setShowFormModal(false) : setFormStep(formStep - 1)}>
                  <BiChevronLeft /> {formStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary flex-center gap-1" 
                  disabled={actionLoading}
                  onClick={() => {
                    if (formStep === 3) {
                      handleFormSubmit();
                    } else {
                      setFormStep(formStep + 1);
                    }
                  }}
                >
                  {actionLoading ? (
                    <><BiLoader className="spin" /> Processing...</>
                  ) : (
                    <>
                      {formStep === 3 ? <><BiCheck /> {editingStudent ? 'Update Roster' : 'Complete Onboarding'}</> : <><BiChevronRight /> Next Step</>}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW PROFILE MODAL ===== */}
      {viewingProfile && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-700 no-padding overflow-hidden" style={{ borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: 'none' }}>
            {/* Header Hero Section */}
            <div className="profile-hero" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)', padding: '2.5rem 2rem 2rem 2rem', position: 'relative' }}>
              <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent((viewingProfile.firstName||'') + '+' + (viewingProfile.lastName||''))}&size=128&background=fff&color=4f46e5&bold=true`} 
                    alt="" 
                    style={{ width: '90px', height: '90px', borderRadius: '24px', border: '4px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', objectFit: 'cover' }} 
                  />
                  <div>
                    <h2 className="mb-0 text-white" style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'white' }}>
                      {viewingProfile.firstName} {viewingProfile.middleName ? viewingProfile.middleName + ' ' : ''}{viewingProfile.lastName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ID: #{viewingProfile.id}
                      </span>
                      {viewingProfile.studentId && (
                        <span style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,0.9)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'monospace' }}>
                          ID: {viewingProfile.studentId}
                        </span>
                      )}
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
            <div className="modal-body-scroll" style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto', background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Group 1: Student Particulars */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiUser style={{ color: '#4f46e5', fontSize: '1.2rem' }} /> Personal Details
                </h4>
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Gender</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{viewingProfile.gender ? String(viewingProfile.gender).toLowerCase() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Date of Birth</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.dateOfBirth ? new Date(viewingProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Aadhar Ref</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.aadharNumber || 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Contact Phone</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.mobileNumber || 'Not registered'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Student Email</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={viewingProfile.emailId}>{viewingProfile.emailId || 'Not registered'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Residential Address</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, lineHeight: '1.4' }}>{viewingProfile.address || 'Not registered'}</span>
                  </div>
                </div>
              </div>

              {/* Group 2: Academic Placement */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiBuildings style={{ color: '#0ea5e9', fontSize: '1.2rem' }} /> Academic Placement
                </h4>
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Grade / Class</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.standard || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Section / Division</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.divisionName || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Student ID</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{viewingProfile.studentId || (`#${viewingProfile.id}`)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Admission Date</span>
                    <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.admissionDate ? new Date(viewingProfile.admissionDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Account Status</span>
                    <span className={`status-badge ${String(viewingProfile.status).toLowerCase() === 'active' ? 'active' : 'inactive'}`} style={{ margin: 0 }}>
                      {viewingProfile.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 3: Parent Details */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiIdCard style={{ color: '#f59e0b', fontSize: '1.2rem' }} /> Parent & Guardian Particulars
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Guardian Name</span>
                      <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.guardianName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Contact Number</span>
                      <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.parentMobileNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 4: Financial Setup */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                  <BiWallet style={{ color: '#10b981', fontSize: '1.2rem' }} /> Financial & Billing Setup
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FEE PLAN TYPE</div>
                    <div style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>{viewingProfile.feeType || 'REGULAR'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>GROSS COURSE FEE</div>
                    <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700, marginTop: '4px' }}>₹{Number(viewingProfile.totalFee || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CONCESSION</div>
                    <div style={{ fontSize: '1.1rem', color: '#e11d48', fontWeight: 700, marginTop: '4px' }}>- ₹{Number(viewingProfile.discount || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: 'inset 0 0 0 1px #a7f3d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>NET PAYABLE</div>
                    <div style={{ fontSize: '1.25rem', color: '#047857', fontWeight: 800, marginTop: '2px' }}>₹{Number(viewingProfile.finalFee || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-light padding-1 flex-end gap-1 border-top" style={{ padding: '1.25rem 2rem', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setViewingProfile(null)} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer', transition: '0.2s' }}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewingProfile(null); handleEdit(viewingProfile); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 600, background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>Edit Credentials</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content card" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '0.5rem' }}>⚠️</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Delete Student Record?</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete <strong>{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong> from the institutional roster? This action is irreversible.
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
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Standard / Class Placement</label>
                <select className="form-control" value={uploadForm.standardId} onChange={handleUploadStandardChange} required>
                  <option value="">Select Standard</option>
                  {uploadStandards.map(s => <option key={s.id || s.standardId} value={s.id || s.standardId}>{s.standard || s.standardName || s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Division / Section</label>
                <select className="form-control" value={uploadForm.divisionId} onChange={e => setUploadForm(p => ({ ...p, divisionId: e.target.value }))} required disabled={!uploadForm.standardId}>
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
                <button className="btn btn-primary flex-center gap-1" onClick={handleExcelUpload} disabled={uploading || !uploadFile || !uploadForm.standardId || !uploadForm.divisionId}>
                  {uploading ? <><BiLoader className="excel-spinner" /> Processing...</> : <><BiUpload /> Upload Excel</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
        FIX: Saari helper classes ab `.students-page` ke andar scoped hain.
        Pehle ye global thi (jaise .py-3, .gap-2, .block) aur Tailwind ki same
        naam wali classes ko override karke Sidebar bigaad rahi thi.
      */}
      <style>{`
        .students-page { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .students-page .badge-info { background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 700; }

        .students-page .status-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 700; display: inline-block; text-align: center; }
        .students-page .status-badge.active { background: #dcfce7; color: #15803d; }
        .students-page .status-badge.inactive { background: #fee2e2; color: #b91c1c; }

        /* Students table row hover: keep text readable, don't change colour on hover */
        .students-page .data-table tbody tr:hover td { background-color: #f5f7ff !important; }
        .students-page .data-table tbody tr:hover td * { color: inherit !important; }

        .students-page .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; }
        .students-page .max-w-700 { width: 100%; max-width: 700px; }
        .students-page .no-padding { padding: 0 !important; }
        .students-page .overflow-hidden { overflow: hidden; }
        .students-page .pb-05 { padding-bottom: 0.5rem; }
        .students-page .mb-1 { margin-bottom: 1rem; }
        .students-page .block { display: block; }
        .students-page .w-fit { width: fit-content; }
        .students-page .mt-1 { margin-top: 1rem; }

        .students-page .grid-2 { grid-template-columns: 1fr 1fr; }
        .students-page .gap-1 { gap: 1rem; }
        .students-page .gap-2 { gap: 2rem; }
        .students-page .flex-end { display: flex; justify-content: flex-end; }
        .students-page .padding-1 { padding: 1rem; }
        .students-page .padding-2 { padding: 2rem; }
        .students-page .bg-light { background: #f8fafc; }
        .students-page .text-white { color: white; }
        .students-page .mb-0 { margin-bottom: 0; }
        .students-page .border-bottom { border-bottom: 1px solid #e2e8f0; }
        .students-page .border-top { border-top: 1px solid #e2e8f0; }
        .students-page .pt-1 { padding-top: 1rem; }
        .students-page .py-3 { padding-top: 3rem; padding-bottom: 3rem; }

        .students-page .form-section-title {
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

        .students-page .btn-outline { background: white; border: 1px solid #cbd5e1; color: #334155; padding: 0.65rem 1.3rem; border-radius: 10px; cursor: pointer; font-weight: 600; transition: 0.2s; }
        .students-page .btn-outline:hover { background: #f1f5f9; border-color: #94a3b8; }

        .students-page .info-group p { margin-bottom: 0.75rem; font-size: 0.9rem; color: #334155; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }
        .students-page .info-group p strong { color: #0f172a; font-weight: 600; display: inline-block; width: 140px; }

        .students-page .slide-in { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideInRight {
          from { transform: translateX(15px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .students-page .excel-spinner { animation: spin 1s linear infinite; }
        .students-page .spin { animation: spin 1.2s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .students-page .w-100 { width: 100%; }

        .students-page .modal-form-scroll::-webkit-scrollbar { width: 6px; }
        .students-page .modal-form-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .students-page .modal-form-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }

        /* Student stats bar */
        .students-page .student-count-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: white; padding: 4px 14px; border-radius: 20px;
          font-size: 0.8rem; font-weight: 700; box-shadow: 0 2px 8px rgba(99,102,241,0.3);
        }

        /* Custom Checkbox styles for premium look */
        .students-page .custom-checkbox-container {
          display: inline-block;
          position: relative;
          cursor: pointer;
          user-select: none;
          width: 18px;
          height: 18px;
        }

        .students-page .custom-checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .students-page .custom-checkbox-checkmark {
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

        .students-page .custom-checkbox-container:hover input ~ .custom-checkbox-checkmark {
          border-color: #6366f1;
          background-color: #f8fafc;
        }

        .students-page .custom-checkbox-container input:checked ~ .custom-checkbox-checkmark {
          background-color: #6366f1;
          border-color: #6366f1;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
        }

        .students-page .custom-checkbox-checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .students-page .custom-checkbox-container input:checked ~ .custom-checkbox-checkmark:after {
          display: block;
        }

        .students-page .custom-checkbox-container .custom-checkbox-checkmark:after {
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

export default Students;