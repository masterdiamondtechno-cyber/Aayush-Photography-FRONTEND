import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { 
  BiUser, 
  BiLockOpen, 
  BiBell, 
  BiCog, 
  BiBarChartAlt, 
  BiCalendarCheck, 
  BiPlus, 
  BiEditAlt, 
  BiCheckCircle, 
  BiArchive, 
  BiCamera, 
  BiMap, 
  BiShieldQuarter,
  BiCalendar
} from 'react-icons/bi';
import { 
  getAllAcademicYears, 
  createAcademicYear, 
  updateAcademicYear, 
  activateAcademicYear, 
  archiveAcademicYear,
  getSchoolById,
  updateSchool,
  updateSchoolPassword
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';
import { useAcademicYearStore } from '../../store/academicYearStore';

/**
 * Premium Admin Settings Page
 */
const Settings = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Academic Years State
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [errorYears, setErrorYears] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  });

  const { setActiveAcademicYear, setSelectedAcademicYear } = useAcademicYearStore();

  const schoolId = parseInt(getAuthValue('schoolId'));

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // School Profile & Settings State
  const [schoolData, setSchoolData] = useState(null);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [errorSchool, setErrorSchool] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [profileForm, setProfileForm] = useState({
    schoolName: '',
    email: '',
    phoneNo: '',
    schoolAddress: '',
    state: '',
    district: '',
    taluka: '',
    pincode: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Edit/Read-only Mode control states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);

  useEffect(() => {
    fetchSchoolDetails();
  }, []);

  // Deep-link support: ?tab=academic&action=add opens the form directly
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const action = params.get('action');
    if (tab) {
      setActiveTab(tab);
    }
    if (tab === 'academic' && action === 'add') {
      // Delay slightly so the tab content mounts first
      setTimeout(() => {
        setEditingYear(null);
        setFormData({ startDate: '', endDate: '', status: 'ACTIVE' });
        setShowModal(true);
      }, 150);
    }
  }, [location.search]);

  const fetchSchoolDetails = async () => {
    if (!schoolId) return;
    setLoadingSchool(true);
    setErrorSchool('');
    try {
      const response = await getSchoolById(schoolId);
      if (response && response.status === 'SUCCESS') {
        const data = response.data;
        setSchoolData(data);
        setProfileForm({
          schoolName: data.schoolName || '',
          email: data.email || '',
          phoneNo: data.phoneNo || '',
          schoolAddress: data.schoolAddress || '',
          state: data.state || '',
          district: data.district || '',
          taluka: data.taluka || '',
          pincode: data.pincode || ''
        });
        if (data.schoolLogo) {
          setLogoPreview(data.schoolLogo);
        }
        setIsEditingProfile(false);
        setIsEditingGeneral(false);
      }
    } catch (err) {
      console.error('Error fetching school details:', err);
      setErrorSchool('Failed to load school profile.');
    } finally {
      setLoadingSchool(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelProfile = () => {
    setIsEditingProfile(false);
    setLogoFile(null);
    if (schoolData) {
      setProfileForm({
        schoolName: schoolData.schoolName || '',
        email: schoolData.email || '',
        phoneNo: schoolData.phoneNo || '',
        schoolAddress: schoolData.schoolAddress || '',
        state: schoolData.state || '',
        district: schoolData.district || '',
        taluka: schoolData.taluka || '',
        pincode: schoolData.pincode || ''
      });
      setLogoPreview(schoolData.schoolLogo || '');
    }
  };

  const handleCancelGeneral = () => {
    setIsEditingGeneral(false);
    if (schoolData) {
      setProfileForm(prev => ({
        ...prev,
        schoolAddress: schoolData.schoolAddress || '',
        state: schoolData.state || '',
        district: schoolData.district || '',
        taluka: schoolData.taluka || '',
        pincode: schoolData.pincode || ''
      }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.schoolName || !profileForm.email || !profileForm.phoneNo) {
      alert('School Name, Email, and Phone Number are required.');
      return;
    }

    try {
      setSuccessMsg('');
      const formDataObj = new FormData();
      formDataObj.append('schoolId', schoolId);
      formDataObj.append('schoolName', profileForm.schoolName);
      formDataObj.append('email', profileForm.email);
      formDataObj.append('phoneNo', profileForm.phoneNo);
      formDataObj.append('schoolAddress', profileForm.schoolAddress);
      formDataObj.append('state', profileForm.state);
      formDataObj.append('district', profileForm.district);
      formDataObj.append('taluka', profileForm.taluka);
      formDataObj.append('pincode', profileForm.pincode);
      
      if (logoFile) {
        formDataObj.append('schoolLogo', logoFile);
      }

      const response = await updateSchool(formDataObj);
      if (response && response.status === 'SUCCESS') {
        setSuccessMsg('School profile updated successfully!');
        fetchSchoolDetails();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(response.message || 'Failed to update profile');
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill out all fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New Password and Confirm Password do not match.');
      return;
    }

    try {
      setSuccessMsg('');
      const payload = {
        emailOrPhone: profileForm.email || getAuthValue('userEmail'),
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      };

      const response = await updateSchoolPassword(payload);
      if (response && response.status === 'SUCCESS') {
        setSuccessMsg('Password updated successfully!');
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(response.message || 'Failed to update password.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update password.');
    }
  };

  useEffect(() => {
    if (activeTab === 'academic') {
      fetchAcademicYears();
    }
  }, [activeTab]);

  const fetchAcademicYears = async () => {
    if (!schoolId) return;
    setLoadingYears(true);
    setErrorYears('');
    try {
      const response = await getAllAcademicYears({ schoolId });
      if (response && response.status === 'SUCCESS') {
        setYears(response.data || []);
      } else {
        setYears([]);
      }
    } catch (error) {
      console.error('Failed to load academic years:', error);
      setErrorYears('No academic years registered yet or failed to load.');
      setYears([]);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleOpenModal = (year = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        startDate: year.startDate,
        endDate: year.endDate,
        status: year.status || 'ACTIVE'
      });
    } else {
      setEditingYear(null);
      setFormData({
        startDate: '',
        endDate: '',
        status: 'ACTIVE'
      });
    }
    setShowModal(true);
  };

  const handleSaveYear = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      alert('All fields are required');
      return;
    }

    try {
      const payload = {
        schoolId,
        ...formData,
        yearName: `${formData.startDate.slice(0, 4)}-${formData.endDate.slice(0, 4)}`
      };

      let response;
      if (editingYear) {
        payload.academicYearId = editingYear.academicYearId;
        response = await updateAcademicYear(payload);
      } else {
        response = await createAcademicYear(payload);
      }

      if (response && response.status === 'SUCCESS') {
        const savedYear = response.data;
        if (savedYear && savedYear.isCurrent) {
          setActiveAcademicYear(savedYear);
          setSelectedAcademicYear(savedYear);
          localStorage.setItem("academicYearId", JSON.stringify(savedYear.academicYearId));
          sessionStorage.setItem("academicYearId", JSON.stringify(savedYear.academicYearId));
        }

        setSuccessMsg(editingYear ? 'Academic Year updated successfully!' : 'Academic Year created successfully!');
        setShowModal(false);
        fetchAcademicYears();

        if (savedYear && savedYear.isCurrent) {
          setTimeout(() => {
            setSuccessMsg('');
            window.location.reload();
          }, 1500);
        } else {
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      }
    } catch (error) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleActivate = async (yearId) => {
    if (!window.confirm('Are you sure you want to activate this academic year? This will set it as current and automatically refresh contextual data.')) return;
    try {
      const response = await activateAcademicYear({ schoolId, academicYearId: yearId });
      if (response && response.status === 'SUCCESS') {
        const activated = years.find(y => y.academicYearId === yearId);
        if (activated) {
          setActiveAcademicYear(activated);
          setSelectedAcademicYear(activated);
        }
        setSuccessMsg('Academic Year activated successfully!');
        fetchAcademicYears();
        setTimeout(() => {
          setSuccessMsg('');
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      alert(error.message || 'Activation failed');
    }
  };

  const handleArchive = async (yearId) => {
    if (!window.confirm('Are you sure you want to archive this academic year?')) return;
    try {
      const response = await archiveAcademicYear({ schoolId, academicYearId: yearId });
      if (response && response.status === 'SUCCESS') {
        setSuccessMsg('Academic Year archived successfully!');
        fetchAcademicYears();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (error) {
      alert(error.message || 'Archiving failed');
    }
  };

  return (
    <div className="premium-settings-container settings-page space-y-8">
      <div className="premium-header">
        <div className="header-text">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-black sm:text-3xl">System Configuration</h1>
          <p className="subtitle-badge text-sm text-black">Institutional Settings & Security Control Center</p>
        </div>
        <div className="glow-bubble shadow-glow"></div>
      </div>

      <div className="settings-split-layout gap-6">
        <aside className="premium-sidebar">
          <ul className="settings-nav space-y-1">
            <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
              <BiUser className="nav-icon" />
              <span>Admin Profile</span>
            </li>
            <li className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
              <BiLockOpen className="nav-icon" />
              <span>Security & Password</span>
            </li>
            <li className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>
              <BiCog className="nav-icon" />
              <span>General Settings</span>
            </li>
            <li className={activeTab === 'academic' ? 'active' : ''} onClick={() => setActiveTab('academic')}>
              <BiBarChartAlt className="nav-icon" />
              <span>Academic Year</span>
            </li>
            <li className={activeTab === 'holidays' ? 'active' : ''} onClick={() => setActiveTab('holidays')}>
              <BiCalendarCheck className="nav-icon" />
              <span>Holiday Calendar</span>
            </li>
          </ul>
        </aside>

        <main className="premium-content-card">
          {successMsg && (
            <div className="toast-success-banner">
              <BiCheckCircle className="toast-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="settings-pane-content fade-in">
              <h2 className="pane-title">
                <BiUser className="title-icon" /> Admin Profile Details
              </h2>
              <p className="pane-subtitle">Manage your institution admin profile and credentials.</p>

              {loadingSchool ? (
                <div className="loader-placeholder">
                  <div className="spinner"></div>
                  <p>Fetching secure profile data...</p>
                </div>
              ) : (
                <>
                  {/* Glowing Profile Logo Photo Ring */}
                  <div className="avatar-upload-showcase">
                    <div className="avatar-ring-outer">
                      <div className="avatar-ring-inner">
                        <img 
                          src={logoPreview || "/images/green.png"} 
                          alt="School Logo" 
                          className="premium-avatar-img"
                        />
                      </div>
                      <input 
                        type="file" 
                        id="schoolLogoInput" 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        style={{display: 'none'}} 
                      />
                      {isEditingProfile && (
                        <button 
                          type="button" 
                          className="avatar-change-badge"
                          onClick={() => document.getElementById('schoolLogoInput').click()}
                          title="Upload New Logo"
                        >
                          <BiCamera className="camera-badge-icon" />
                        </button>
                      )}
                    </div>
                    <div className="avatar-desc">
                      <h4>Institution Brand Identity</h4>
                      <p>Accepts PNG, JPG. Max size 2MB.</p>
                    </div>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    await handleSaveProfile(e);
                    setIsEditingProfile(false);
                  }} className="premium-styled-form">
                    <div className="form-input-grid">
                      <div className="form-item-wrapper">
                        <label>School / Institution Name</label>
                        <input 
                          type="text" 
                          value={profileForm.schoolName} 
                          onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })} 
                          placeholder="Enter School Name"
                          disabled={!isEditingProfile}
                          required
                        />
                      </div>

                      <div className="form-item-wrapper">
                        <label>Institutional Registered Email</label>
                        <input 
                          type="email" 
                          value={profileForm.email} 
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                          placeholder="e.g. admin@school.com"
                          disabled={!isEditingProfile}
                          required
                        />
                      </div>

                      <div className="form-item-wrapper">
                        <label>Official Phone Number</label>
                        <input 
                          type="text" 
                          value={profileForm.phoneNo} 
                          onChange={(e) => setProfileForm({ ...profileForm, phoneNo: e.target.value })} 
                          placeholder="Enter 10 digit number"
                          disabled={!isEditingProfile}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-action-row" style={{ gap: '1rem' }}>
                      {!isEditingProfile ? (
                        <button 
                          type="button" 
                          className="premium-btn btn-glowing-primary" 
                          onClick={() => setIsEditingProfile(true)}
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button type="submit" className="premium-btn btn-glowing-primary">
                            Save Changes
                          </button>
                          <button 
                            type="button" 
                            className="premium-btn btn-outline" 
                            onClick={handleCancelProfile}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-pane-content fade-in">
              <h2 className="pane-title">
                <BiShieldQuarter className="title-icon" /> Security Settings
              </h2>
              <p className="pane-subtitle">Keep your school platform login secure by creating robust passwords.</p>

              <form onSubmit={handleChangePassword} className="premium-styled-form max-width-form">
                <div className="form-item-wrapper">
                  <label>New Passcode / Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="form-item-wrapper">
                  <label>Confirm Passcode</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirmPassword} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                    placeholder="Retype password to confirm"
                    required
                  />
                </div>

                <div className="form-action-row" style={{ marginTop: '2rem' }}>
                  <button type="submit" className="premium-btn btn-glowing-primary">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-pane-content fade-in">
              <h2 className="pane-title">
                <BiCog className="title-icon" /> General Settings
              </h2>
              <p className="pane-subtitle">Update institutional locations and state registration addresses.</p>

              {loadingSchool ? (
                <div className="loader-placeholder">
                  <div className="spinner"></div>
                  <p>Fetching location records...</p>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSaveProfile(e);
                  setIsEditingGeneral(false);
                }} className="premium-styled-form">
                  <div className="form-input-grid">
                    <div className="form-item-wrapper">
                      <label>State</label>
                      <input 
                        type="text" 
                        value={profileForm.state} 
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} 
                        placeholder="State Name"
                        disabled={!isEditingGeneral}
                      />
                    </div>

                    <div className="form-item-wrapper">
                      <label>District</label>
                      <input 
                        type="text" 
                        value={profileForm.district} 
                        onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })} 
                        placeholder="District Name"
                        disabled={!isEditingGeneral}
                      />
                    </div>

                    <div className="form-item-wrapper">
                      <label>Taluka</label>
                      <input 
                        type="text" 
                        value={profileForm.taluka} 
                        onChange={(e) => setProfileForm({ ...profileForm, taluka: e.target.value })} 
                        placeholder="Taluka"
                        disabled={!isEditingGeneral}
                      />
                    </div>

                    <div className="form-item-wrapper">
                      <label>Pincode</label>
                      <input 
                        type="text" 
                        value={profileForm.pincode} 
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })} 
                        placeholder="6 Digit PIN code"
                        disabled={!isEditingGeneral}
                      />
                    </div>

                    <div className="form-item-wrapper full-width-input">
                      <label>Full Address</label>
                      <textarea 
                        value={profileForm.schoolAddress} 
                        onChange={(e) => setProfileForm({ ...profileForm, schoolAddress: e.target.value })} 
                        placeholder="Enter the complete institutional physical address"
                        disabled={!isEditingGeneral}
                      />
                    </div>
                  </div>

                  <div className="form-action-row" style={{ gap: '1rem' }}>
                    {!isEditingGeneral ? (
                      <button 
                        type="button" 
                        className="premium-btn btn-glowing-primary" 
                        onClick={() => setIsEditingGeneral(true)}
                      >
                        Edit Settings
                      </button>
                    ) : (
                      <>
                        <button type="submit" className="premium-btn btn-glowing-primary">
                          Save Settings
                        </button>
                        <button 
                          type="button" 
                          className="premium-btn btn-outline" 
                          onClick={handleCancelGeneral}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="settings-pane-content fade-in">
              <div className="flex-between header-action-bar">
                <div>
                  <h2 className="pane-title">
                    <BiBarChartAlt className="title-icon" /> Academic Year Setup
                  </h2>
                  <p className="pane-subtitle">Manage, activate, and archive active terms of your school.</p>
                </div>
                <button className="premium-btn btn-glowing-success flex-center" onClick={() => handleOpenModal()} style={{ gap: '0.5rem' }}>
                  <BiPlus /> Add Academic Year
                </button>
              </div>

              {errorYears && <p className="error-description">{errorYears}</p>}

              {loadingYears ? (
                <div className="loader-placeholder">
                  <div className="spinner"></div>
                  <p>Fetching term periods...</p>
                </div>
              ) : years.length === 0 ? (
                <div className="premium-empty-state">
                  <div className="empty-icon-wrapper">
                    <BiCalendar className="empty-icon" />
                  </div>
                  <h3>No Academic Years Registered</h3>
                  <p>Get started by defining your school's calendar year. This is the foundation of all enrollment, schedules, and attendance records.</p>
                  <button className="premium-btn btn-glowing-success" onClick={() => handleOpenModal()}>
                    <BiPlus /> Setup First Academic Year
                  </button>
                </div>
              ) : (
                <div className="premium-table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Year Name</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Current Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {years.map(year => (
                        <tr key={year.academicYearId} className="premium-row">
                          <td className="bold-column">{year.yearName}</td>
                          <td>{formatDate(year.startDate)}</td>
                          <td>{formatDate(year.endDate)}</td>
                          <td>
                            <span className={`status-pill ${
                              year.status?.toLowerCase() === 'active' ? 'active' :
                              year.status?.toLowerCase() === 'inactive' ? 'inactive' : 'archived'
                            }`}>
                              {year.status || 'INACTIVE'}
                            </span>
                          </td>
                          <td>
                            {year.isCurrent ? (
                              <span className="premium-badge active-glow">CURRENT ACTIVE</span>
                            ) : (
                              <span className="premium-badge backup-gray">Historic</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="row-action-buttons">
                              {!year.isCurrent && year.status === 'ACTIVE' && (
                                <button 
                                  title="Activate Term" 
                                  onClick={() => handleActivate(year.academicYearId)}
                                  className="row-btn btn-activate"
                                >
                                  <BiCheckCircle /> <span>Activate</span>
                                </button>
                              )}
                              <button 
                                title="Edit Details" 
                                onClick={() => handleOpenModal(year)}
                                className="row-btn btn-edit"
                              >
                                <BiEditAlt />
                              </button>
                              {year.status === 'ACTIVE' && (
                                <button 
                                  title="Archive Term" 
                                  onClick={() => handleArchive(year.academicYearId)}
                                  className="row-btn btn-archive"
                                >
                                  <BiArchive />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Advanced Glassmorphic Academic Year Modal Overlay */}
              {showModal && createPortal(
                <div className="premium-modal-overlay">
                  <div className="premium-modal-card fade-in">
                    <div className="modal-header-gradient">
                      <h3 className="modal-header-title">
                        <BiCalendar className="modal-header-icon" />
                        {editingYear ? 'Modify Academic Term' : 'Initiate New Academic Year'}
                      </h3>
                      <p className="modal-header-subtitle">
                        {editingYear ? 'Update dates and status of the academic term.' : 'Set up a new active year calendar for your institution.'}
                      </p>
                    </div>
                    <form onSubmit={handleSaveYear} className="premium-styled-form">
                      <div className="modal-form-body">
                        <div className="modal-grid">
                          <div className="form-item-wrapper">
                            <label>Start Date</label>
                            <input 
                              type="date" 
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              required 
                            />
                          </div>
                          <div className="form-item-wrapper">
                            <label>End Date</label>
                            <input 
                              type="date" 
                              value={formData.endDate}
                              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              required 
                            />
                          </div>
                        </div>
                        <div className="form-item-wrapper">
                          <label>Status</label>
                          <select 
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="premium-select"
                            required
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            {formData.status === 'COMPLETED' && <option value="COMPLETED">Completed</option>}
                            {formData.status === 'ARCHIVED' && <option value="ARCHIVED">Archived</option>}
                          </select>
                        </div>
                      </div>
                      <div className="modal-action-row">
                        <button type="button" onClick={() => setShowModal(false)} className="premium-btn btn-outline">
                          Cancel
                        </button>
                        <button type="submit" className="premium-btn btn-glowing-primary">
                          {editingYear ? 'Save Changes' : 'Launch Term'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}

          {activeTab === 'holidays' && (
            <div className="settings-pane-content fade-in">
              <h2 className="pane-title">
                <BiCalendar className="title-icon" /> Scheduled School Holidays
              </h2>
              <p className="pane-subtitle">View gazetted, national, and state academic vacation breaks.</p>
              
              <div className="holidays-grid-view">
                <div className="holiday-modern-card info-gradient">
                  <div className="holiday-icon-box">🎉</div>
                  <div className="holiday-info">
                    <h4>Independence Day</h4>
                    <span className="holiday-date">15th Aug 2025</span>
                    <span className="holiday-badge national">National Holiday</span>
                  </div>
                </div>

                <div className="holiday-modern-card info-gradient">
                  <div className="holiday-icon-box">🪔</div>
                  <div className="holiday-info">
                    <h4>Diwali Break</h4>
                    <span className="holiday-date">25th Oct - 2nd Nov 2025</span>
                    <span className="holiday-badge festival">Festival Break</span>
                  </div>
                </div>

                <div className="holiday-modern-card info-gradient">
                  <div className="holiday-icon-box">🎄</div>
                  <div className="holiday-info">
                    <h4>Christmas Day</h4>
                    <span className="holiday-date">25th Dec 2025</span>
                    <span className="holiday-badge gazetted">Gazetted Holiday</span>
                  </div>
                </div>
              </div>

              <button className="premium-btn btn-glowing-primary" style={{marginTop: '2.5rem'}}>
                Request Holiday Amendment
              </button>
            </div>
          )}
        </main>
      </div>

      <style>{`
        /* Root container with sleek aesthetic styles */
        .premium-settings-container {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          padding: clamp(1rem, 2.5vw, 2.5rem);
          min-height: 90vh;
          background: #f8fafc;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .settings-split-layout,
        .premium-sidebar,
        .premium-content-card,
        .settings-pane-content {
          min-width: 0;
        }

        .premium-header {
          position: relative;
          margin-bottom: 2.5rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 1.25rem;
          color: white;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.2), 0 8px 10px -6px rgba(79, 70, 229, 0.2);
        }

        .premium-header .header-text h1,
        .premium-header .header-text p {
          color: #000;
        }

        .premium-header .header-text h1 {
          background: none;
          -webkit-text-fill-color: #000;
        }

        .premium-header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .subtitle-badge {
          margin: 0;
          font-size: 0.95rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .glow-bubble {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
          top: -100px;
          right: -100px;
          border-radius: 50%;
          pointer-events: none;
        }

        .settings-split-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        /* Premium sidebar tab controls */
        .premium-sidebar {
          background: white;
          border-radius: 1rem;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        }

        .settings-nav {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .settings-nav li {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1.1rem;
          border-radius: 0.75rem;
          cursor: pointer;
          color: #64748b;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .settings-nav li:hover {
          background-color: #f1f5f9;
          color: #4f46e5;
          transform: translateX(3px);
        }

        .settings-nav li.active {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }

        .nav-icon {
          font-size: 1.3rem;
        }

        /* Glassmorphic premium card content */
        .premium-content-card {
          background: white;
          border-radius: 1.25rem;
          padding: 2.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05);
          min-height: 520px;
        }

        .settings-pane-content {
          width: 100%;
        }

        .pane-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 0.4rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .title-icon {
          color: #4f46e5;
          font-size: 1.6rem;
        }

        .pane-subtitle {
          color: #64748b;
          font-size: 0.92rem;
          margin: 0 0 2rem 0;
        }

        /* Avatar Upload Ring styles */
        .avatar-upload-showcase {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2.5rem;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
        }

        .avatar-ring-outer {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
        }

        .avatar-ring-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: white;
          padding: 3px;
        }

        .premium-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-change-badge {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: white;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #4f46e5;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .avatar-change-badge:hover {
          transform: scale(1.1);
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .camera-badge-icon {
          font-size: 1.15rem;
        }

        .avatar-desc h4 {
          margin: 0 0 0.25rem 0;
          font-weight: 700;
          color: #1e293b;
        }

        .avatar-desc p {
          margin: 0;
          font-size: 0.82rem;
          color: #64748b;
        }

        /* Form elements styles */
        .premium-styled-form {
          width: 100%;
        }

        .max-width-form {
          max-width: 520px;
        }

        .form-input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.75rem 1.5rem;
        }

        .form-item-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .full-width-input {
          grid-column: span 2;
        }

        .form-item-wrapper label {
          font-size: 0.88rem;
          font-weight: 700;
          color: #475569;
        }

        .form-item-wrapper input,
        .form-item-wrapper select,
        .form-item-wrapper textarea {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1.5px solid #cbd5e1;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          color: #1e293b;
          background-color: white;
          transition: all 0.2s;
        }

        .form-item-wrapper input:focus,
        .form-item-wrapper select:focus,
        .form-item-wrapper textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
        }

        .form-item-wrapper textarea {
          min-height: 120px;
          resize: vertical;
        }

        .read-only-badge-input {
          padding: 0.4rem 0;
        }

        .status-text-pill {
          padding: 0.4rem 0.9rem;
          font-size: 0.82rem;
          font-weight: 700;
          border-radius: 2rem;
          text-transform: uppercase;
        }

        .status-text-pill.active {
          background: rgba(16, 185, 129, 0.15);
          color: #059669;
        }

        /* Modern styled buttons */
        .premium-btn {
          padding: 0.8rem 1.75rem;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s;
          border: none;
        }

        .btn-glowing-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
        }

        .btn-glowing-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
        }

        .btn-glowing-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .btn-glowing-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-outline {
          background: transparent;
          border: 1.5px solid #cbd5e1;
          color: #475569;
        }

        .btn-outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .form-action-row {
          margin-top: 2.5rem;
          display: flex;
          justify-content: flex-start;
        }

        /* Success banner overlay */
        .toast-success-banner {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #065f46;
          padding: 1rem 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .toast-icon {
          font-size: 1.4rem;
          color: #10b981;
        }

        /* Table Roster configuration styles */
        .premium-table-container {
          width: 100%;
          overflow-x: auto;
          margin-top: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.85rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .premium-table th {
          background: #f8fafc;
          padding: 1rem 1.25rem;
          font-weight: 700;
          color: #475569;
          font-size: 0.88rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .premium-table td {
          padding: 1.1rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.92rem;
          color: #334155;
        }

        .premium-row:hover {
          background-color: #f8fafc;
        }

        .bold-column {
          font-weight: 700;
          color: #1e293b;
        }

        .status-pill {
          padding: 0.25rem 0.65rem;
          font-size: 0.78rem;
          font-weight: 700;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .status-pill.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-pill.inactive,
        .status-pill.archived {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
        }

        .premium-badge {
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .premium-badge.active-glow {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .premium-badge.backup-gray {
          background: #f1f5f9;
          color: #64748b;
        }

        /* Action buttons within tables */
        .row-action-buttons {
          display: flex;
          gap: 0.4rem;
          justify-content: flex-end;
          align-items: center;
        }

        .row-btn {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .row-btn:hover {
          background-color: #f1f5f9;
          color: #4f46e5;
          border-color: #4f46e5;
        }

        .row-btn.btn-activate {
          width: auto;
          padding: 0 0.75rem;
          gap: 0.4rem;
          font-weight: 700;
          font-size: 0.8rem;
          color: #10b981;
          border-color: #10b981;
        }

        .row-btn.btn-activate:hover {
          background: #10b981;
          color: white;
        }

        .row-btn.btn-archive {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.25);
        }

        .row-btn.btn-archive:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        /* Holiday Cards Styling */
        .holidays-grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .holiday-modern-card {
          display: flex;
          gap: 1.25rem;
          padding: 1.25rem;
          border-radius: 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
          transition: all 0.25s;
        }

        .holiday-modern-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }

        .holiday-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 0.75rem;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .holiday-info h4 {
          margin: 0 0 0.25rem 0;
          font-weight: 700;
          color: #1e293b;
        }

        .holiday-date {
          display: block;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .holiday-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .holiday-badge.national {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .holiday-badge.festival {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .holiday-badge.gazetted {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
        }

        /* Premium dialog model cards */
        .premium-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .premium-modal-card {
          background: white;
          border-radius: 1.25rem;
          width: 90%;
          max-width: 480px;
          padding: 2.25rem;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }

        /* Modal Header Gradient styling */
        .modal-header-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 1.75rem 2.25rem;
          margin: -2.25rem -2.25rem 2rem -2.25rem;
          border-top-left-radius: 1.25rem;
          border-top-right-radius: 1.25rem;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.15);
        }

        .modal-header-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white !important;
        }

        .modal-header-icon {
          font-size: 1.6rem;
        }

        .modal-header-subtitle {
          margin: 0.35rem 0 0 0;
          font-size: 0.88rem;
          opacity: 0.9;
          font-weight: 500;
          line-height: 1.4;
        }

        /* Modal Form Grid & Spacing */
        .modal-form-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .premium-select {
          cursor: pointer;
        }

        .modal-action-row {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        /* Interactive Empty State Card */
        .premium-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 1rem;
          margin-top: 1.5rem;
          transition: all 0.3s ease;
        }

        .premium-empty-state:hover {
          border-color: #4f46e5;
          background: #f1f5f9;
        }

        .empty-icon-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: rgba(79, 70, 229, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          color: #4f46e5;
        }

        .empty-icon {
          font-size: 2.2rem;
        }

        .premium-empty-state h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .premium-empty-state p {
          max-width: 480px;
          color: #64748b;
          font-size: 0.92rem;
          margin: 0 0 2rem 0;
          line-height: 1.6;
        }

        /* Pulsating Active dot status badge */
        .premium-badge.active-glow {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.3);
          box-shadow: 0 0 12px rgba(37, 99, 235, 0.15);
          position: relative;
          padding-left: 1.65rem;
        }

        .premium-badge.active-glow::before {
          content: '';
          position: absolute;
          left: 0.6rem;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #2563eb;
          animation: pulse-dot 1.5s infinite;
        }

        @keyframes pulse-dot {
          0% { transform: translateY(-50%) scale(0.85); opacity: 0.5; }
          50% { transform: translateY(-50%) scale(1.35); opacity: 1; }
          100% { transform: translateY(-50%) scale(0.85); opacity: 0.5; }
        }

        /* Row Action Button Color Coding */
        .row-btn.btn-edit {
          color: #4f46e5;
          border-color: rgba(79, 70, 229, 0.25);
        }

        .row-btn.btn-edit:hover {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        /* Transition Animations */
        .fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Generic Loader placeholder */
        .loader-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #64748b;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #cbd5e1;
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsiveness modifications */
        @media(max-width: 992px) {
          .settings-split-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 1.5rem;
          }
        }

        @media(max-width: 640px) {
          .premium-settings-container {
            padding: 1rem;
          }

          .premium-header {
            margin-bottom: 0;
            padding: 1.5rem;
          }

          .premium-header h1 {
            font-size: 1.5rem;
          }

          .settings-split-layout {
            gap: 1rem;
          }

          .premium-sidebar {
            padding: 0.5rem;
            overflow: hidden;
          }

          .settings-nav {
            flex-direction: row;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            scrollbar-width: thin;
          }

          .settings-nav li {
            flex: 0 0 auto;
            padding: 0.75rem;
            white-space: nowrap;
          }

          .settings-nav li:hover {
            transform: none;
          }

          .premium-content-card {
            padding: 1.25rem;
          }

          .pane-title {
            font-size: 1.2rem;
            flex-wrap: wrap;
          }

          .avatar-upload-showcase {
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
          }

          .form-input-grid,
          .modal-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .full-width-input {
            grid-column: auto;
          }

          .header-action-bar {
            align-items: stretch;
            flex-direction: column;
          }

          .header-action-bar > button {
            align-self: flex-start;
            max-width: 100%;
            white-space: normal;
          }

          .form-action-row,
          .modal-action-row {
            flex-wrap: wrap;
          }

          .premium-modal-overlay {
            box-sizing: border-box;
            padding: 1rem;
            overflow-y: auto;
          }

          .premium-modal-card {
            box-sizing: border-box;
            width: 100%;
            max-height: 90dvh;
            padding: 1.25rem;
            overflow-y: auto;
          }

          .modal-header-gradient {
            margin: -1.25rem -1.25rem 1.25rem;
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
