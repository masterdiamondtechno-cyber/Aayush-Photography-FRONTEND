import React, { useState, useEffect, useCallback } from 'react';
import { 
  BiBuildingHouse, 
  BiMap, 
  BiUserCircle, 
  BiLoader, 
  BiMailSend, 
  BiPhoneCall, 
  BiGroup, 
  BiCoinStack, 
  BiCalendarEvent,
  BiPlus,
  BiX,
  BiCloudUpload,
  BiCheckCircle,
  BiErrorCircle
} from 'react-icons/bi';
import { getOwnerSchools, requestOwnerSchool } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const OwnerBranches = () => {
  const ownerId = getAuthValue('ownerId');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    udiseNo: '',
    principalName: '',
    email: '',
    phoneNo: '',
    state: '',
    district: '',
    taluka: '',
    pincode: '',
    schoolAddress: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  const fetchBranches = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const res = await getOwnerSchools({ ownerId, page: 0, size: 100 });
      const data = res?.data || res;
      let content = [];
      if (data?.data) {
        content = data.data;
      } else if (Array.isArray(data)) {
        content = data;
      } else if (data?.content) {
        content = data.content;
      }
      setBranches(content);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const showToastNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, schoolLogo: 'Logo size must be less than 2MB' }));
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => ({ ...prev, schoolLogo: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.schoolName.trim()) errors.schoolName = 'School name is required';
    
    if (!formData.udiseNo.trim()) {
      errors.udiseNo = 'UDISE No is required';
    } else if (!/^\d+$/.test(formData.udiseNo)) {
      errors.udiseNo = 'UDISE No must be numeric';
    } else if (formData.udiseNo.length < 8 || formData.udiseNo.length > 15) {
      errors.udiseNo = 'UDISE No must be between 8 and 15 digits';
    }

    if (!formData.principalName.trim()) errors.principalName = 'Principal Name is required';
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNo.trim()) {
      errors.phoneNo = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNo)) {
      errors.phoneNo = 'Mobile number must be exactly 10 digits';
    }

    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.district.trim()) errors.district = 'District/City is required';
    if (!formData.taluka.trim()) errors.taluka = 'Taluka is required';
    
    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (!formData.schoolAddress.trim()) errors.schoolAddress = 'Detailed address is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const submissionData = new FormData();
      
      // Append core school fields
      submissionData.append('ownerId', ownerId);
      submissionData.append('schoolName', formData.schoolName);
      submissionData.append('udiseNo', formData.udiseNo);
      submissionData.append('principalName', formData.principalName);
      submissionData.append('email', formData.email);
      submissionData.append('phoneNo', formData.phoneNo);
      submissionData.append('state', formData.state);
      submissionData.append('district', formData.district);
      submissionData.append('taluka', formData.taluka);
      submissionData.append('pincode', formData.pincode);
      submissionData.append('schoolAddress', formData.schoolAddress);

      if (logoFile) {
        submissionData.append('schoolLogo', logoFile);
      }

      const res = await requestOwnerSchool(submissionData);
      
      if (res?.data?.status === 'SUCCESS') {
        showToastNotification('Branch requested successfully! Awaiting Super Admin review.');
        setShowModal(false);
        // Reset form
        setFormData({
          schoolName: '',
          udiseNo: '',
          principalName: '',
          email: '',
          phoneNo: '',
          state: '',
          district: '',
          taluka: '',
          pincode: '',
          schoolAddress: ''
        });
        setLogoFile(null);
        setLogoPreview(null);
        // Refresh the list immediately
        fetchBranches();
      } else {
        showToastNotification(res?.data?.message || 'Failed to submit branch request.', 'error');
      }
    } catch (err) {
      console.error('Submission error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Server connection error.';
      showToastNotification(serverMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt) => `₹${(amt || 0).toLocaleString('en-IN')}`;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusConfig = (branch) => {
    const regStatus = branch.registrationStatus ? branch.registrationStatus.toUpperCase() : null;
    const opStatus = branch.schoolStatus ? branch.schoolStatus.toUpperCase() : 'ACTIVE';
    
    if (regStatus === 'PENDING') {
      return { label: 'PENDING APPROVAL', className: 'pending' };
    } else if (regStatus === 'REJECTED') {
      return { label: 'REJECTED', className: 'inactive' };
    }
    
    return { label: opStatus, className: opStatus.toLowerCase() };
  };

  return (
    <div className="school-clean-page space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`notification-toast ${toast.type}`}>
          {toast.type === 'success' ? <BiCheckCircle size={20} /> : <BiErrorCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex-between mb-2" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ margin: 0, color: 'var(--text-dark)' }}>Franchise Branches</h1>
          <p className="text-muted text-sm" style={{ margin: '0.2rem 0 0 0', color: '#64748b' }}>Monitor academic metrics, faculty size, and financials across your franchise locations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge-aggregate">
            Total Branches: {branches.length}
          </div>
          <button 
            className="btn-request-branch"
            onClick={() => setShowModal(true)}
          >
            <BiPlus size={20} />
            Request New Branch
          </button>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
          <BiLoader size={40} className="spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 500 }}>Syncing active branches...</p>
        </div>
      ) : (
        <div className="branches-grid">
          {branches.map(branch => {
            const statusConfig = getStatusConfig(branch);
            return (
              <div key={branch.schoolId || branch.id} className="simple-card">
                <div className="card-header bg-light">
                   <div className="flex-center gap-1" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <div className="simple-icon-box">
                       {branch.schoolLogo ? (
                         <img src={branch.schoolLogo} alt={branch.schoolName} className="branch-card-logo" />
                       ) : (
                         <BiBuildingHouse size={22} />
                       )}
                     </div>
                     <div>
                       <h3 className="branch-title">{branch.schoolName}</h3>
                       <p className="branch-location"><BiMap /> {branch.district}, {branch.state}</p>
                     </div>
                   </div>
                   <span className={`status-pill ${statusConfig.className}`}>
                     {statusConfig.label}
                   </span>
                </div>

                <div className="card-metrics-grid">
                  <div className="metric-box">
                     <p className="metric-label">Enrolled Students</p>
                     <p className="metric-value"><BiGroup style={{ color: '#5d5fef' }} /> {(branch.studentCount || 0).toLocaleString()}</p>
                  </div>
                  <div className="metric-box">
                     <p className="metric-label">Faculty Staff</p>
                     <p className="metric-value"><BiUserCircle style={{ color: '#10b981' }} /> {(branch.teacherCount || 0).toLocaleString()}</p>
                  </div>
                  <div className="metric-box" style={{ gridColumn: 'span 2' }}>
                     <p className="metric-label">Revenue Generated (All Time)</p>
                     <p className="metric-value text-success"><BiCoinStack style={{ color: '#10b981' }} /> {formatCurrency(branch.totalRevenue)}</p>
                  </div>
                </div>

                <div className="card-details-section">
                  <div className="detail-row">
                    <span className="detail-label"><BiMailSend /> Contact Email:</span>
                    <strong className="detail-value">{branch.email || '-'}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><BiPhoneCall /> Mobile No:</span>
                    <strong className="detail-value">{branch.phoneNo || '-'}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><BiCalendarEvent /> Onboarded:</span>
                    <strong className="detail-value">{formatDate(branch.createdAt)}</strong>
                  </div>
                </div>
              </div>
            );
          })}

          {branches.length === 0 && (
            <div className="no-branches-empty">
              No franchise branches found under your franchise profile.
            </div>
          )}
        </div>
      )}

      {/* Glassmorphic Sliding Drawer Modal */}
      {showModal && (
        <div className="drawer-overlay" onClick={() => setShowModal(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>Request New Branch</h2>
                <p>Register a new school branch. Submissions enter the Super Admin approval pipeline.</p>
              </div>
              <button className="btn-close-drawer" onClick={() => setShowModal(false)}>
                <BiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="drawer-form">
              {/* Form Grid */}
              <div className="form-section-title">Core Branch Information</div>
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>School/Branch Name <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="schoolName" 
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    placeholder="e.g. Greenwood Franchise Academy, North Branch"
                    className={formErrors.schoolName ? 'error' : ''}
                  />
                  {formErrors.schoolName && <span className="error-text">{formErrors.schoolName}</span>}
                </div>

                <div className="form-group">
                  <label>UDISE Number <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="udiseNo" 
                    value={formData.udiseNo}
                    onChange={handleInputChange}
                    placeholder="11-digit school code"
                    className={formErrors.udiseNo ? 'error' : ''}
                  />
                  {formErrors.udiseNo && <span className="error-text">{formErrors.udiseNo}</span>}
                </div>

                <div className="form-group">
                  <label>Principal Name <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="principalName" 
                    value={formData.principalName}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className={formErrors.principalName ? 'error' : ''}
                  />
                  {formErrors.principalName && <span className="error-text">{formErrors.principalName}</span>}
                </div>
              </div>

              <div className="form-section-title">Contact Credentials</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Official Email ID <span className="req">*</span></label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. principal.north@greenwood.com"
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Contact Phone Number <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="phoneNo" 
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={formErrors.phoneNo ? 'error' : ''}
                  />
                  {formErrors.phoneNo && <span className="error-text">{formErrors.phoneNo}</span>}
                </div>
              </div>

              <div className="form-section-title">Geographical Location & Address</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>State <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="state" 
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className={formErrors.state ? 'error' : ''}
                  />
                  {formErrors.state && <span className="error-text">{formErrors.state}</span>}
                </div>

                <div className="form-group">
                  <label>District / City <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="district" 
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="District"
                    className={formErrors.district ? 'error' : ''}
                  />
                  {formErrors.district && <span className="error-text">{formErrors.district}</span>}
                </div>

                <div className="form-group">
                  <label>Taluka <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="taluka" 
                    value={formData.taluka}
                    onChange={handleInputChange}
                    placeholder="Taluka"
                    className={formErrors.taluka ? 'error' : ''}
                  />
                  {formErrors.taluka && <span className="error-text">{formErrors.taluka}</span>}
                </div>

                <div className="form-group">
                  <label>Pincode <span className="req">*</span></label>
                  <input 
                    type="text" 
                    name="pincode" 
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit postal code"
                    maxLength={6}
                    className={formErrors.pincode ? 'error' : ''}
                  />
                  {formErrors.pincode && <span className="error-text">{formErrors.pincode}</span>}
                </div>

                <div className="form-group span-2">
                  <label>Full Mailing Address <span className="req">*</span></label>
                  <textarea 
                    name="schoolAddress" 
                    value={formData.schoolAddress}
                    onChange={handleInputChange}
                    placeholder="Enter complete institutional address..."
                    rows={3}
                    className={formErrors.schoolAddress ? 'error' : ''}
                  />
                  {formErrors.schoolAddress && <span className="error-text">{formErrors.schoolAddress}</span>}
                </div>
              </div>

              <div className="form-section-title">Branding Logo</div>
              <div className="logo-upload-container">
                <div className="logo-preview-box">
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo Preview" className="logo-preview-img" />
                  ) : (
                    <div className="logo-placeholder">
                      <BiBuildingHouse size={32} />
                    </div>
                  )}
                </div>
                <div className="logo-upload-details">
                  <label className="btn-logo-upload">
                    <BiCloudUpload size={20} />
                    <span>Upload Logo Image</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="logo-hint">Accepts PNG, JPG (Max 2MB)</span>
                  {formErrors.schoolLogo && <span className="error-text block">{formErrors.schoolLogo}</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <BiLoader size={18} className="spin" />
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Branch Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .school-clean-page { color: #333; animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        .badge-aggregate {
          background: rgba(93, 95, 239, 0.08); 
          color: var(--primary); 
          font-weight: 700; 
          padding: 0.5rem 1.1rem; 
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .btn-request-branch {
          background: linear-gradient(135deg, #5d5fef 0%, #3f41c5 100%);
          color: white;
          border: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(93, 95, 239, 0.25);
        }
        .btn-request-branch:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(93, 95, 239, 0.35);
        }

        .branches-grid {
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); 
          gap: 1.5rem;
        }

        .simple-card { 
          background: white; 
          border: 1px solid #eaedf0; 
          border-radius: 12px; 
          overflow: hidden; 
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(0,0,0,0.01);
        }
        .simple-card:hover { 
          border-color: var(--primary); 
          transform: translateY(-3px); 
          box-shadow: 0 10px 25px rgba(93, 95, 239, 0.08); 
        }

        .card-header {
          padding: 1.25rem 1.5rem; 
          background: #fafbfc; 
          border-bottom: 1px solid #eaedf0; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
        }

        .branch-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-dark); }
        .branch-location { 
          justify-content: flex-start; 
          margin: 0.2rem 0 0 0; 
          display: flex; 
          align-items: center; 
          gap: 0.3rem; 
          font-size: 0.8rem; 
          color: #64748b; 
        }
        
        .simple-icon-box { 
          width: 42px; 
          height: 42px; 
          background: rgba(93, 95, 239, 0.08); 
          color: var(--primary); 
          border-radius: 8px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden;
        }
        
        .branch-card-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .status-pill { 
          padding: 0.3rem 0.8rem; 
          border-radius: 100px; 
          font-size: 0.7rem; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        .status-pill.active { background: #d1fae5; color: #065f46; }
        .status-pill.inactive { background: #fee2e2; color: #991b1b; }
        .status-pill.pending { background: #fef3c7; color: #92400e; }

        .card-metrics-grid {
          padding: 1.5rem; 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 1.25rem;
        }

        .metric-label { 
          margin: 0; 
          font-size: 0.75rem; 
          font-weight: 700; 
          color: #94a3b8; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }
        .metric-value { 
          margin: 0.4rem 0 0 0; 
          font-size: 1.4rem; 
          font-weight: 800; 
          color: var(--text-dark); 
          display: flex; 
          align-items: center; 
          gap: 0.4rem; 
        }
        .metric-value.text-success { color: #10b981; }

        .card-details-section {
          padding: 1.2rem 1.5rem; 
          background: #f8fafc; 
          border-top: 1px solid #eaedf0; 
          display: flex; 
          flex-direction: column; 
          gap: 0.65rem; 
          font-size: 0.85rem; 
        }

        .detail-row { display: flex; justify-content: space-between; color: #475569; }
        .detail-label { display: flex; gap: 0.4rem; align-items: center; color: #64748b; }
        .detail-value { color: var(--text-dark); font-weight: 600; }

        .no-branches-empty {
          grid-column: span 2; 
          border-radius: 12px; 
          background: white; 
          padding: 4rem 2rem; 
          border: 1.5px dashed #ccd5e0; 
          color: #64748b;
          text-align: center;
          font-weight: 500;
        }

        /* Glassmorphic Modal Overlay */
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.25s ease-out;
        }

        /* Drawer Sliding Content Panel */
        .drawer-content {
          width: 100%;
          max-width: 580px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .drawer-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #eaedf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-header h2 { margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text-dark); }
        .drawer-header p { margin: 0.3rem 0 0 0; font-size: 0.8rem; color: #64748b; }

        .btn-close-drawer {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-close-drawer:hover {
          background: #f1f5f9;
          color: var(--text-dark);
          transform: rotate(90deg);
        }

        /* Drawer Form Scrollable Area */
        .drawer-form {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          scrollbar-width: thin;
        }

        .form-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--primary);
          border-bottom: 1px solid rgba(93, 95, 239, 0.1);
          padding-bottom: 0.4rem;
          margin-top: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group.span-2 { grid-column: span 2; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
        }
        .form-group label .req { color: #ef4444; }

        .form-group input, .form-group textarea {
          padding: 0.65rem 0.9rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          color: var(--text-dark);
          transition: all 0.2s ease;
          outline: none;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.15);
          background: white;
        }
        .form-group input.error, .form-group textarea.error {
          border-color: #ef4444;
          background: rgba(254, 242, 242, 0.5);
        }
        
        .error-text {
          font-size: 0.75rem;
          color: #ef4444;
          font-weight: 500;
        }
        .error-text.block { display: block; margin-top: 0.4rem; }

        /* Logo Branding Area */
        .logo-upload-container {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(248, 250, 252, 0.6);
          padding: 1.2rem;
          border-radius: 10px;
          border: 1px dashed #cbd5e1;
        }
        
        .logo-preview-box {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          background: white;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
        }
        .logo-preview-img { width: 100%; height: 100%; object-fit: cover; }

        .btn-logo-upload {
          background: white;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .btn-logo-upload:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        
        .logo-hint {
          display: block;
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 0.3rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eaedf0;
        }
        
        .btn-cancel {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-cancel:hover { background: #f1f5f9; }

        .btn-submit {
          flex: 2;
          padding: 0.75rem;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #5d5fef 0%, #3f41c5 100%);
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(93, 95, 239, 0.2);
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(93, 95, 239, 0.3);
        }
        .btn-submit:disabled, .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Slide Notifications */
        .notification-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          z-index: 1100;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          animation: slideDownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .notification-toast.success {
          background: #10b981;
        }
        .notification-toast.error {
          background: #ef4444;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes slideDownIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OwnerBranches;
