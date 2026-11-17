import React, { useState, useEffect, useCallback } from 'react';
import { BiUser, BiCheckCircle, BiLoader, BiFile, BiMailSend, BiPhone } from 'react-icons/bi';
import { getOwnerProfile, updateOwnerProfile } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const OwnerSettings = () => {
  const ownerId = getAuthValue('ownerId');
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    email: '',
    phoneNo: '',
    address: '',
    dob: '',
    gender: '',
    aadharCard: '',
    fullNameAsPerAadhar: '',
    panCard: '',
    registrationType: ''
  });

  const fetchProfile = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const res = await getOwnerProfile({ ownerId });
      if (res?.data) {
        setFormData({
          name: res.data.name || '',
          fullName: res.data.fullName || '',
          email: res.data.email || '',
          phoneNo: res.data.phoneNo || '',
          address: res.data.address || '',
          dob: res.data.dob || '',
          gender: res.data.gender || '',
          aadharCard: res.data.aadharCard || '',
          fullNameAsPerAadhar: res.data.fullNameAsPerAadhar || '',
          panCard: res.data.panCard || '',
          registrationType: res.data.registrationType || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile settings:', err);
      setMessage({ text: 'Failed to load profile details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!ownerId) return;
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      const payload = {
        ownerId: parseInt(ownerId, 10),
        ...formData
      };
      const res = await updateOwnerProfile(payload);
      if (res?.data?.status === 'SUCCESS') {
        setMessage({ text: 'Franchise profile updated successfully!', type: 'success' });
      } else {
        setMessage({ text: res?.data?.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ text: 'Error occurred while saving profile changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="owner-settings-page space-y-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-dark)' }}>Global Settings</h1>
      <p className="text-muted text-sm mb-2" style={{ color: '#64748b', marginBottom: '2rem' }}>Manage your franchise identity, contact details, and document verifications.</p>

      {/* Tabs */}
      <div className="settings-tabs">
        <button 
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <BiUser /> Personal & Franchise Profile
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`settings-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
        >
          <BiFile /> Verification Documents
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #eaedf0' }}>
          <BiLoader size={36} className="spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 500 }}>Syncing profile datasets...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="settings-form-card">
          {message.text && (
            <div className={`settings-alert alert-${message.type}`}>
              {message.type === 'success' && <BiCheckCircle />}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className="settings-section grid-cols-2">
              <div className="form-group">
                <label className="form-label">Franchise Nickname / Code</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="e.g. MD EduTech Group"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  className="form-control" 
                  value={formData.fullName} 
                  onChange={handleChange}
                  placeholder="e.g. Rajesh Kumar"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Email Address</label>
                <div className="input-with-icon">
                  <BiMailSend className="input-icon" />
                  <input 
                    type="email" 
                    name="email" 
                    className="form-control pad-left" 
                    value={formData.email} 
                    onChange={handleChange}
                    placeholder="name@franchise.com"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Mobile No</label>
                <div className="input-with-icon">
                  <BiPhone className="input-icon" />
                  <input 
                    type="tel" 
                    name="phoneNo" 
                    className="form-control pad-left" 
                    value={formData.phoneNo} 
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select 
                  name="gender" 
                  className="form-control" 
                  value={formData.gender} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  name="dob" 
                  className="form-control" 
                  value={formData.dob} 
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label">Franchise HQ / Personal Address</label>
                <textarea 
                  name="address" 
                  className="form-control text-area" 
                  value={formData.address} 
                  onChange={handleChange}
                  placeholder="Enter full physical address..."
                  rows="3"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="settings-section grid-cols-2">
              <div className="form-group">
                <label className="form-label">Aadhar Card Number</label>
                <input 
                  type="text" 
                  name="aadharCard" 
                  className="form-control" 
                  value={formData.aadharCard} 
                  onChange={handleChange}
                  maxLength="12"
                  placeholder="12-digit Aadhar number"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name (As per Aadhar)</label>
                <input 
                  type="text" 
                  name="fullNameAsPerAadhar" 
                  className="form-control" 
                  value={formData.fullNameAsPerAadhar} 
                  onChange={handleChange}
                  placeholder="Exact legal name matches Aadhar"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">PAN Card Number</label>
                <input 
                  type="text" 
                  name="panCard" 
                  className="form-control" 
                  value={formData.panCard} 
                  onChange={handleChange}
                  maxLength="10"
                  placeholder="10-character PAN number"
                  style={{ textTransform: 'uppercase' }}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Type</label>
                <select 
                  name="registrationType" 
                  className="form-control" 
                  value={formData.registrationType} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Registration</option>
                  <option value="Individual">Individual / Proprietorship</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="PvtLtd">Private Limited Company</option>
                </select>
              </div>
            </div>
          )}

          <div className="settings-footer">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.8rem' }}
            >
              {saving ? (
                <>
                  <BiLoader className="spin" /> Updating...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .owner-settings-page { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .settings-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #eaedf0;
          padding-bottom: 0.5rem;
        }

        .settings-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .settings-tab-btn:hover {
          color: var(--primary);
          background: rgba(93, 95, 239, 0.05);
        }
        .settings-tab-btn.active {
          color: var(--primary);
          background: rgba(93, 95, 239, 0.08);
        }

        .settings-form-card {
          background: white;
          border: 1px solid #eaedf0;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.01);
        }

        .settings-section {
          display: grid;
          gap: 1.5rem;
        }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .span-2 { grid-column: span 2; }

        @media (max-width: 768px) {
          .grid-cols-2 { grid-template-columns: 1fr; }
          .span-2 { grid-column: span 1; }
        }

        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-label { font-size: 0.8rem; font-weight: 700; color: #475569; letter-spacing: 0.3px; }
        
        .form-control {
          padding: 0.7rem 0.95rem;
          border: 1.5px solid #eaedf0;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-dark);
          transition: 0.2s ease;
          background: white;
          width: 100%;
          box-sizing: border-box;
        }
        .form-control:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.12);
        }

        .text-area { resize: vertical; min-height: 80px; font-family: inherit; }

        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
        .pad-left { padding-left: 2.3rem; }

        .settings-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eaedf0;
          display: flex;
          justify-content: flex-end;
        }

        .settings-alert {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default OwnerSettings;
