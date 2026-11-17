import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BiPlus, 
  BiSearchAlt, 
  BiEdit, 
  BiTrash, 
  BiUser, 
  BiX, 
  BiCheck, 
  BiDownload, 
  BiLoader, 
  BiCalendar, 
  BiWallet, 
  BiBuildings, 
  BiIdCard, 
  BiMapPin, 
  BiCopy, 
  BiCheckCircle,
  BiGridAlt, 
  BiListUl,
  BiEnvelope,
  BiPhone,
  BiTimeFive,
  BiTrendingUp
} from 'react-icons/bi';
import { getAuthValue } from '../../utils/auth';
import { 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  getAllEmployees, 
  changeEmployeeStatus, 
  checkEmployeeEmail, 
  checkEmployeeMobile 
} from '../../api/api';


// Predefined Harmonic Badge Color Palettes for each standard role (using HSL)
const ROLE_PALETTES = {
  ACCOUNTANT: { bg: 'hsl(270, 80%, 95%)', color: 'hsl(270, 80%, 40%)', border: 'hsl(270, 80%, 85%)' },
  LIBRARIAN: { bg: 'hsl(340, 80%, 95%)', color: 'hsl(340, 80%, 40%)', border: 'hsl(340, 80%, 85%)' },
  SECURITY: { bg: 'hsl(30, 80%, 95%)', color: 'hsl(30, 80%, 40%)', border: 'hsl(30, 80%, 85%)' },
  DRIVER: { bg: 'hsl(150, 80%, 95%)', color: 'hsl(150, 80%, 38%)', border: 'hsl(150, 80%, 85%)' },
  CLEANER: { bg: 'hsl(45, 80%, 95%)', color: 'hsl(45, 80%, 42%)', border: 'hsl(45, 80%, 85%)' },
  PEON: { bg: 'hsl(190, 80%, 95%)', color: 'hsl(190, 80%, 38%)', border: 'hsl(190, 80%, 85%)' },
  COOK: { bg: 'hsl(210, 20%, 90%)', color: 'hsl(210, 20%, 35%)', border: 'hsl(210, 20%, 80%)' },
  NON_TEACHING: { bg: 'hsl(230, 80%, 95%)', color: 'hsl(230, 80%, 40%)', border: 'hsl(230, 80%, 85%)' },
  OTHER: { bg: 'hsl(200, 15%, 90%)', color: 'hsl(200, 15%, 35%)', border: 'hsl(200, 15%, 80%)' }
};

const getRolePalette = (roleType) => {
  const normalized = String(roleType).toUpperCase();
  return ROLE_PALETTES[normalized] || ROLE_PALETTES.OTHER;
};

// Formatted Label for Role Types
const getRoleLabel = (roleType) => {
  const mapping = {
    ACCOUNTANT: 'Accountant',
    LIBRARIAN: 'Librarian',
    SECURITY: 'Security Guard',
    DRIVER: 'Driver / Transport',
    CLEANER: 'Clerical Cleaner',
    PEON: 'Peon / Attendant',
    COOK: 'Kitchen Head / Cook',
    NON_TEACHING: 'Administrative Clerk',
    OTHER: 'Other Assistant'
  };
  return mapping[String(roleType).toUpperCase()] || roleType;
};

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Modals & Drawers
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Real-time unique validation checks
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');

  // Form State
  const emptyForm = {
    employeeName: '',
    emailId: '',
    mobileNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    education: '',
    gender: 'MALE',
    employeeType: 'NON_TEACHING',
    address: '',
    aadharCardNumber: '',
    profilePhoto: '',
    status: 'ACTIVE'
  };
  const [formData, setFormData] = useState(emptyForm);

  // Retrieve School & Academic Context
  let schoolId = getAuthValue('schoolId');
  let academicYearId = getAuthValue('academicYearId');
  schoolId = schoolId ? Number(schoolId) : null;
  academicYearId = academicYearId ? Number(academicYearId) : null;

  // Fetch employees list from backend
  const fetchEmployees = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAllEmployees({ schoolId, academicYearId });
      // If result is empty list or error code indicates not found, handle gracefully
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setEmployees(res.data?.employees || []);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.warn('Employees fetch warning:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced Async validation check for Email
  useEffect(() => {
    if (!formData.emailId || !schoolId) {
      setEmailError('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailId)) {
      setEmailError('Invalid email ID format');
      return;
    }
    if (editingEmployee && editingEmployee.emailId === formData.emailId) {
      setEmailError('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkEmployeeEmail({
          schoolId,
          emailId: formData.emailId
        });
        const exists = res?.exists || (res?.data && res.data.exists);
        if (exists) {
          setEmailError('This email is already registered to another employee');
        } else {
          setEmailError('');
        }
      } catch (err) {
        console.error('Error checking email duplicates:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.emailId, schoolId, editingEmployee]);

  // Debounced Async validation check for Mobile
  useEffect(() => {
    if (!formData.mobileNumber || !schoolId) {
      setMobileError('');
      return;
    }
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobileNumber)) {
      setMobileError('Mobile number must be exactly 10 digits');
      return;
    }
    if (editingEmployee && editingEmployee.mobileNumber === formData.mobileNumber) {
      setMobileError('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkEmployeeMobile({
          schoolId,
          mobileNumber: formData.mobileNumber
        });
        const exists = res?.exists || (res?.data && res.data.exists);
        if (exists) {
          setMobileError('This mobile number is already registered to another employee');
        } else {
          setMobileError('');
        }
      } catch (err) {
        console.error('Error checking mobile duplicates:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.mobileNumber, schoolId, editingEmployee]);

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Local Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        String(emp.employeeName || '').toLowerCase().includes(term) ||
        String(emp.emailId || '').toLowerCase().includes(term) ||
        String(emp.mobileNumber || '').includes(term) ||
        String(emp.education || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
      const matchesType = typeFilter === 'All' || emp.employeeType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [employees, searchTerm, statusFilter, typeFilter]);

  // Dynamic Metrics Calculations
  const metrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'ACTIVE').length;
    const payroll = employees
      .filter(e => e.status === 'ACTIVE')
      .reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

    // Calculate Role Diversity percentages
    const rolesMap = {};
    employees.forEach(e => {
      const type = e.employeeType || 'OTHER';
      rolesMap[type] = (rolesMap[type] || 0) + 1;
    });

    const diversity = Object.keys(rolesMap).map(role => ({
      name: role,
      count: rolesMap[role],
      pct: total > 0 ? Math.round((rolesMap[role] / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    return { total, active, payroll, diversity };
  }, [employees]);

  // Add / Edit Handlers
  const handleAddClick = () => {
    setEditingEmployee(null);
    setFormData(emptyForm);
    setEmailError('');
    setMobileError('');
    setShowFormModal(true);
  };

  const handleEditClick = (e, emp) => {
    e.stopPropagation(); // Avoid triggering details drawer
    setEditingEmployee(emp);
    setFormData({
      employeeName: emp.employeeName || '',
      emailId: emp.emailId || '',
      mobileNumber: emp.mobileNumber || '',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      salary: emp.salary || '',
      education: emp.education || '',
      gender: emp.gender || 'MALE',
      employeeType: emp.employeeType || 'NON_TEACHING',
      address: emp.address || '',
      aadharCardNumber: emp.aadharCardNumber || '',
      profilePhoto: emp.profilePhoto || '',
      status: emp.status || 'ACTIVE'
    });
    setEmailError('');
    setMobileError('');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (emailError || mobileError) return; // Prevent saving duplicate data

    setActionLoading(true);
    try {
      const payload = {
        schoolId,
        academicYearId,
        employeeName: formData.employeeName,
        emailId: formData.emailId,
        mobileNumber: formData.mobileNumber,
        joiningDate: formData.joiningDate || null,
        salary: formData.salary ? Number(formData.salary) : null,
        education: formData.education || null,
        gender: formData.gender,
        employeeType: formData.employeeType,
        address: formData.address || null,
        aadharCardNumber: formData.aadharCardNumber || null,
        profilePhoto: formData.profilePhoto || null,
        status: formData.status
      };

      let res;
      if (editingEmployee) {
        payload.id = editingEmployee.id;
        res = await updateEmployee(payload);
      } else {
        res = await createEmployee(payload);
      }

      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setShowFormModal(false);
        fetchEmployees();
        if (selectedEmployee && selectedEmployee.id === payload.id) {
          // If drawer is open with this employee, refresh its data
          setSelectedEmployee({ ...selectedEmployee, ...payload });
        }
      } else {
        alert(res?.message || 'Operation failed. Please verify employee parameters.');
      }
    } catch (err) {
      console.error('Save employee error:', err);
      alert(err.message || 'Server encountered an error compiling employee record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Switch status instantly via toggle
  const handleStatusToggle = async (e, emp) => {
    e.stopPropagation();
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await changeEmployeeStatus({
        id: emp.id,
        schoolId,
        status: nextStatus
      });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        fetchEmployees();
        if (selectedEmployee && selectedEmployee.id === emp.id) {
          setSelectedEmployee(prev => ({ ...prev, status: nextStatus }));
        }
      } else {
        alert(res?.message || 'Unable to modify status.');
      }
    } catch (err) {
      console.error('Status swap error:', err);
      alert('Error communicating status update with database.');
    }
  };

  // Delete Handlers
  const handleDeleteClick = (e, emp) => {
    e.stopPropagation();
    setShowDeleteConfirm(emp);
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    setActionLoading(true);
    try {
      const res = await deleteEmployee({
        id: showDeleteConfirm.id,
        schoolId
      });
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        setShowDeleteConfirm(null);
        setDrawerOpen(false);
        fetchEmployees();
      } else {
        alert(res?.message || 'Failed to purge employee.');
      }
    } catch (err) {
      console.error('Delete employee error:', err);
      alert('Database error during delete request execution.');
    } finally {
      setActionLoading(false);
    }
  };

  // Slide-out Drawer Detail Handlers
  const handleCardClick = (emp) => {
    setSelectedEmployee(emp);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Copy Aadhar Card Helper
  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(fieldName);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Computed active years of service
  const computedYearsOfService = (joiningStr) => {
    if (!joiningStr) return 'N/A';
    const jDate = new Date(joiningStr);
    if (isNaN(jDate.getTime())) return 'N/A';
    const diffMs = Date.now() - jDate.getTime();
    const serviceYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return serviceYears < 1 
      ? 'Under 1 year' 
      : `${serviceYears.toFixed(1)} Active Years`;
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      alert('No employee records in current filter criteria to export.');
      return;
    }

    const headers = [
      'Employee ID',
      'Name',
      'Email ID',
      'Mobile Number',
      'Gender',
      'Education',
      'Role Type',
      'Status',
      'Joining Date',
      'Monthly Salary (INR)',
      'Aadhar Card Number',
      'Residential Address'
    ];

    const csvRows = [headers.join(',')];

    filteredEmployees.forEach(emp => {
      const values = [
        emp.id || '',
        `"${String(emp.employeeName || '').replace(/"/g, '""')}"`,
        emp.emailId || '',
        emp.mobileNumber || '',
        emp.gender || '',
        `"${String(emp.education || '').replace(/"/g, '""')}"`,
        emp.employeeType || '',
        emp.status || '',
        emp.joiningDate || '',
        emp.salary || '0',
        emp.aadharCardNumber || '',
        `"${String(emp.address || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="employees-page space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-slate-500">Administrative &gt; Employee Roster</p>
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Employees Management</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={handleExportCSV}
          >
            <BiDownload className="text-lg" /> Export filtered CSV
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            onClick={handleAddClick}
          >
            <BiPlus className="text-lg" /> Onboard Staff Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Staff Roster</h4>
            <p className="mt-1 font-['Lexend'] text-2xl font-extrabold text-slate-900">{metrics.total}</p>
            <span className="text-sm text-slate-500">Registered employees</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
            <BiUser />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Personnel</h4>
            <p className="mt-1 font-['Lexend'] text-2xl font-extrabold text-emerald-600">{metrics.active}</p>
            <span className="text-sm text-slate-500">Currently serving</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
            <BiCheckCircle />
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-metrics">
            <h4>Administrative Payroll</h4>
            <p className="metric-val">₹{metrics.payroll.toLocaleString('en-IN')}</p>
            <span className="sub-text">Monthly sum (Active)</span>
          </div>
          <div className="card-icon-wrapper warning-icon">
            <BiWallet />
          </div>
        </div>

        {/* ROLE DIVERSITY PROGRESS STACK */}
        <div className="analytics-card diversity-card">
          <div style={{ width: '100%' }}>
            <div className="diversity-title-row">
              <h4>Role Diversity Stack</h4>
              <span className="diversity-total">{metrics.diversity.length} Roles</span>
            </div>
            <div className="stack-bars-container">
              {metrics.diversity.slice(0, 3).map((item, index) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b'];
                return (
                  <div className="stack-bar-row" key={item.name}>
                    <div className="stack-bar-label">
                      <span>{getRoleLabel(item.name)}</span>
                      <span>{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${item.pct}%`, 
                          background: colors[index % colors.length] 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {metrics.diversity.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', paddingTop: '10px' }}>
                  No role diversity tracked yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="filter-panel">
        <div className="filter-left">
          <div className="filter-group">
            <label>Roster Status:</label>
            <select 
              className="select-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Role Assignment:</label>
            <select 
              className="select-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="NON_TEACHING">Administrative Clerk</option>
              <option value="SECURITY">Security Guard</option>
              <option value="DRIVER">Driver / Transport</option>
              <option value="CLEANER">Clerical Cleaner</option>
              <option value="PEON">Peon / Attendant</option>
              <option value="COOK">Kitchen Head / Cook</option>
              <option value="OTHER">Other Assistant</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box-wrapper">
            <BiSearchAlt className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, education, contact..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="view-toggle-wrapper">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid Layout"
            >
              <BiGridAlt size={18} />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table Layout"
            >
              <BiListUl size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CORE EMPLOYEES DATA AREA */}
      {loading ? (
        <div className="loading-wrapper py-3">
          <BiLoader className="spin" style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
          <p style={{ marginTop: '12px', fontWeight: 600, color: '#64748b' }}>
            Retrieving employee directory and roster registers...
          </p>
        </div>
      ) : error ? (
        <div className="empty-wrapper">
          <h3>Connection Terminated Unexpectedly</h3>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchEmployees}>Reconnect Database</button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="empty-wrapper">
          <BiUser />
          <h3>No Employee Records Found</h3>
          <p>We couldn't find any employees matching your current search or filter query.</p>
          <button className="btn btn-primary" onClick={handleAddClick}>Register New Staff Member</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW LAYOUT */
        <div className="employee-grid">
          {filteredEmployees.map(emp => {
            const p = getRolePalette(emp.employeeType);
            return (
              <div 
                className="employee-card fade-in" 
                key={emp.id}
                onClick={() => handleCardClick(emp)}
              >
                <div className="card-top-row">
                  <div className="employee-avatar-wrapper">
                    <div 
                      className="employee-avatar"
                      style={{ 
                        background: `linear-gradient(135deg, ${p.color}, #a5b4fc)`,
                        color: 'white' 
                      }}
                    >
                      {String(emp.employeeName).charAt(0).toUpperCase()}
                    </div>
                    <div className={`status-badge-dot ${emp.status === 'ACTIVE' ? 'active' : 'inactive'}`} />
                  </div>
                  
                  <span 
                    className="role-badge"
                    style={{ background: p.bg, color: p.color, borderColor: p.border }}
                  >
                    {getRoleLabel(emp.employeeType)}
                  </span>
                </div>

                <h3>{emp.employeeName}</h3>
                <p className="edu-text">{emp.education || 'High School / Other'}</p>

                <div className="contact-info-list">
                  <div className="contact-row">
                    <BiEnvelope />
                    <span>{emp.emailId}</span>
                  </div>
                  <div className="contact-row">
                    <BiPhone />
                    <span>{emp.mobileNumber}</span>
                  </div>
                  {emp.joiningDate && (
                    <div className="contact-row">
                      <BiCalendar />
                      <span>Joined {new Date(emp.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions (switch toggle + edit/trash) */}
                <div className="card-bottom-actions" onClick={e => e.stopPropagation()}>
                  <label className="status-switch-label">
                    <div 
                      className={`switch-track ${emp.status === 'ACTIVE' ? 'active' : ''}`}
                      onClick={(e) => handleStatusToggle(e, emp)}
                    >
                      <div className="switch-thumb" />
                    </div>
                    <span>{emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                  </label>

                  <div className="card-action-btns">
                    <button 
                      className="btn-icon" 
                      onClick={(e) => handleEditClick(e, emp)}
                      title="Edit details"
                    >
                      <BiEdit size={16} />
                    </button>
                    <button 
                      className="btn-icon text-danger" 
                      onClick={(e) => handleDeleteClick(e, emp)}
                      title="Purge record"
                    >
                      <BiTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW LAYOUT */
        <div className="table-card fade-in">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Personnel ID</th>
                <th>Employee Name</th>
                <th>Category / Role</th>
                <th>Credentials</th>
                <th>Salary (Monthly)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const p = getRolePalette(emp.employeeType);
                return (
                  <tr 
                    key={emp.id} 
                    onClick={() => handleCardClick(emp)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontWeight: 800 }}>#EMP-{emp.id}</span>
                    </td>
                    <td>
                      <div className="table-avatar-wrapper">
                        <div 
                          className="table-avatar"
                          style={{ 
                            background: `linear-gradient(135deg, ${p.color}, #cbd5e1)`,
                            color: 'white' 
                          }}
                        >
                          {String(emp.employeeName).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{emp.employeeName}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{emp.education || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{ background: p.bg, color: p.color, borderColor: p.border }}
                      >
                        {getRoleLabel(emp.employeeType)}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'block', fontWeight: 600 }}>{emp.mobileNumber}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{emp.emailId}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>₹{(emp.salary || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span 
                        className={`table-status-pill ${emp.status === 'ACTIVE' ? 'active' : 'inactive'}`}
                        onClick={(e) => handleStatusToggle(e, emp)}
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle status"
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="card-action-btns" onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" onClick={(e) => handleEditClick(e, emp)}><BiEdit size={16} /></button>
                        <button className="btn-icon text-danger" onClick={(e) => handleDeleteClick(e, emp)}><BiTrash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>{editingEmployee ? 'Edit Employee Details' : 'Onboard New Employee'}</h2>
                <p>Register essential parameters for non-teaching personnel.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowFormModal(false)}><BiX size={24} /></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-form-scroll">
                <div className="form-grid">
                  
                  <div className="form-group full-width">
                    <label>Employee Name *</label>
                    <input 
                      type="text" 
                      name="employeeName" 
                      required 
                      placeholder="Full Name (e.g. Ramesh Patil)"
                      className="form-input"
                      value={formData.employeeName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      name="emailId" 
                      required 
                      placeholder="ramesh@gmail.com"
                      className="form-input"
                      value={formData.emailId}
                      onChange={handleInputChange}
                    />
                    {emailError && <span className="field-error-msg">{emailError}</span>}
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input 
                      type="tel" 
                      name="mobileNumber" 
                      required 
                      maxLength={10}
                      placeholder="10 digit phone number"
                      className="form-input"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                    />
                    {mobileError && <span className="field-error-msg">{mobileError}</span>}
                  </div>

                  <div className="form-group">
                    <label>Role Assignment *</label>
                    <select 
                      name="employeeType" 
                      className="form-input text-sm"
                      value={formData.employeeType}
                      onChange={handleInputChange}
                    >
                      <option value="NON_TEACHING">Administrative Clerk</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="LIBRARIAN">Librarian</option>
                      <option value="SECURITY">Security Guard</option>
                      <option value="DRIVER">Driver / Transport</option>
                      <option value="CLEANER">Clerical Cleaner</option>
                      <option value="PEON">Peon / Attendant</option>
                      <option value="COOK">Kitchen Head / Cook</option>
                      <option value="OTHER">Other Assistant</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select 
                      name="gender" 
                      className="form-input text-sm"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Joining Date *</label>
                    <input 
                      type="date" 
                      name="joiningDate" 
                      required
                      className="form-input"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                      onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Monthly Salary (INR) *</label>
                    <input 
                      type="number" 
                      name="salary" 
                      required 
                      placeholder="Gross salary amount"
                      className="form-input"
                      value={formData.salary}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Educational Background</label>
                    <input 
                      type="text" 
                      name="education" 
                      placeholder="e.g. B.Com, MBA, High School"
                      className="form-input"
                      value={formData.education}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Aadhar Card Number</label>
                    <input 
                      type="text" 
                      name="aadharCardNumber" 
                      maxLength={12}
                      placeholder="12 digit Unique Identification ID"
                      className="form-input"
                      value={formData.aadharCardNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Residential Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      placeholder="Complete residential street, city, pin code details"
                      className="form-input"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Roster Status</label>
                    <select 
                      name="status" 
                      className="form-input text-sm"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="ACTIVE">Active Employee</option>
                      <option value="INACTIVE">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading || !!emailError || !!mobileError}
                >
                  {actionLoading ? <BiLoader className="spin" /> : <BiCheck />}
                  {editingEmployee ? 'Update Profile' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OUT PROFILE DETAIL DRAWER */}
      {drawerOpen && selectedEmployee && (
        <>
          <div className="drawer-overlay open" onClick={handleDrawerClose} />
          <div className="drawer-panel open fade-in">
            <div className="drawer-header">
              <h2>Staff Member Profile</h2>
              <button className="btn-icon" onClick={handleDrawerClose}><BiX size={22} /></button>
            </div>
            
            <div className="drawer-content">
              <div className="drawer-avatar-section">
                <div 
                  className="drawer-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, ${getRolePalette(selectedEmployee.employeeType).color}, #c7d2fe)`,
                    color: 'white' 
                  }}
                >
                  {String(selectedEmployee.employeeName).charAt(0).toUpperCase()}
                </div>
                <h3>{selectedEmployee.employeeName}</h3>
                <span 
                  className="role-badge"
                  style={{ 
                    background: getRolePalette(selectedEmployee.employeeType).bg, 
                    color: getRolePalette(selectedEmployee.employeeType).color, 
                    borderColor: getRolePalette(selectedEmployee.employeeType).border 
                  }}
                >
                  {getRoleLabel(selectedEmployee.employeeType)}
                </span>
              </div>

              {/* SECTION: PERSONAL CREDENTIALS */}
              <div className="drawer-data-group">
                <p className="drawer-group-title"><BiUser /> Core Details</p>
                <div className="drawer-detail-grid">
                  <div className="drawer-detail-item">
                    <label>Employee ID</label>
                    <span>#EMP-{selectedEmployee.id}</span>
                  </div>
                  <div className="drawer-detail-item">
                    <label>Gender</label>
                    <span>{selectedEmployee.gender || 'Not specified'}</span>
                  </div>
                  <div className="drawer-detail-item">
                    <label>Education</label>
                    <span>{selectedEmployee.education || 'High School / Other'}</span>
                  </div>
                  <div className="drawer-detail-item">
                    <label>Roster Status</label>
                    <span style={{ color: selectedEmployee.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: FINANCIAL & SERVICE METRICS */}
              <div className="drawer-data-group">
                <p className="drawer-group-title"><BiWallet /> CTC & Tenure</p>
                <div className="drawer-detail-grid">
                  <div className="drawer-detail-item">
                    <label>Monthly Salary</label>
                    <span style={{ color: '#4f46e5', fontWeight: 800 }}>
                      ₹{(selectedEmployee.salary || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="drawer-detail-item">
                    <label>Annual CTC</label>
                    <span style={{ fontWeight: 700 }}>
                      ₹{((selectedEmployee.salary || 0) * 12).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="drawer-detail-item">
                    <label>Joining Date</label>
                    <span>{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="drawer-detail-item">
                    <label>Service Tenure</label>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <BiTimeFive style={{ color: '#6366f1' }} />
                      {computedYearsOfService(selectedEmployee.joiningDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: SECURE GOVERNMENT ID & CONTACT */}
              <div className="drawer-data-group">
                <p className="drawer-group-title"><BiIdCard /> Identity & Communication</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="drawer-detail-item">
                    <label>Aadhar ID (Secure Copy)</label>
                    <div className="copyable-wrapper">
                      <span>{selectedEmployee.aadharCardNumber || 'Not documented'}</span>
                      {selectedEmployee.aadharCardNumber && (
                        <button 
                          className="copy-btn" 
                          onClick={() => handleCopyText(selectedEmployee.aadharCardNumber, 'aadhar')}
                          title="Copy Aadhar number"
                        >
                          {copiedId === 'aadhar' ? <BiCheckCircle size={16} color="#10b981" /> : <BiCopy size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="drawer-detail-item">
                    <label>Registered Email</label>
                    <span>{selectedEmployee.emailId}</span>
                  </div>

                  <div className="drawer-detail-item">
                    <label>Primary Phone</label>
                    <span>{selectedEmployee.mobileNumber}</span>
                  </div>

                  <div className="drawer-detail-item">
                    <label>Residential Address</label>
                    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'flex-start', lineHeight: 1.4 }}>
                      <BiMapPin size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                      {selectedEmployee.address || 'No residential address documented.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button 
                className="btn btn-outline" 
                onClick={(e) => {
                  handleEditClick(e, selectedEmployee);
                }}
              >
                <BiEdit /> Edit Profile
              </button>
              <button 
                className="btn btn-outline" 
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                onClick={(e) => {
                  handleDeleteClick(e, selectedEmployee);
                }}
              >
                <BiTrash /> Purge
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <BiTrash size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Purge Employee Roster Record?</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete the profile of <strong style={{ color: '#0f172a' }}>{showDeleteConfirm.employeeName}</strong>? This administrative purging operation is irreversible.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: '#ef4444', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
                disabled={actionLoading}
                onClick={handleConfirmDelete}
              >
                {actionLoading ? <BiLoader className="spin" /> : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
