import React, { useState } from 'react';
import { BiUserCircle, BiBell, BiShieldAlt2, BiPalette, BiChevronRight, BiCheck, BiX, BiCamera, BiLock, BiEnvelope, BiPhone } from 'react-icons/bi';


const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    attendance: true,
    exam: true,
    announcements: false,
  });
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2500);
  };

  const sections = [
    { id: 'profile', icon: BiUserCircle, title: 'Profile Settings', desc: 'Update your personal info and bio', color: '#5d5fef' },
    { id: 'notifications', icon: BiBell, title: 'Notifications', desc: 'Manage your alert preferences', color: '#f59e0b' },
    { id: 'security', icon: BiShieldAlt2, title: 'Security', desc: 'Password and account protection', color: '#10b981' },
    { id: 'appearance', icon: BiPalette, title: 'Appearance', desc: 'Customize your dashboard theme', color: '#8b5cf6' },
  ];

  return (
    <div className="teacher-page-container fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your teacher dashboard preferences</p>
      </div>

      {/* Save Toast */}
      {showSaveMsg && (
        <div className="settings-toast">
          <BiCheck /> Changes saved successfully!
        </div>
      )}

      <div className="settings-layout">
        {/* Sidebar Nav */}
        <div className="settings-sidebar">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon" style={{ background: `${section.color}15`, color: section.color }}>
                <section.icon />
              </span>
              <div className="settings-nav-text">
                <span className="settings-nav-title">{section.title}</span>
                <span className="settings-nav-desc">{section.desc}</span>
              </div>
              <BiChevronRight className="settings-nav-arrow" />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="settings-panel fade-in">
              <div className="settings-panel-header">
                <h2>Profile Settings</h2>
                <p>Update your personal information and bio</p>
              </div>

              <div className="settings-avatar-section">
                <div className="settings-avatar">
                  <BiUserCircle />
                </div>
                <div className="settings-avatar-info">
                  <h4>Profile Photo</h4>
                  <p>JPG, PNG or GIF. Max 2MB.</p>
                  <button className="settings-btn-outline" onClick={handleSave}>
                    <BiCamera /> Upload Photo
                  </button>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="Enter your full name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="settings-form-group">
                  <label>Email Address</label>
                  <div className="settings-input-icon">
                    <BiEnvelope />
                    <input
                      type="email"
                      className="settings-input"
                      placeholder="teacher@school.com"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>Phone Number</label>
                  <div className="settings-input-icon">
                    <BiPhone />
                    <input
                      type="tel"
                      className="settings-input"
                      placeholder="+91 XXXXX XXXXX"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="settings-form-group full-width">
                  <label>Bio</label>
                  <textarea
                    className="settings-textarea"
                    rows="3"
                    placeholder="Write a short bio about yourself..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </div>

              <div className="settings-actions">
                <button className="settings-btn-primary" onClick={handleSave}>Save Changes</button>
                <button className="settings-btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="settings-panel fade-in">
              <div className="settings-panel-header">
                <h2>Notification Preferences</h2>
                <p>Choose how you want to be notified</p>
              </div>

              <div className="settings-toggle-list">
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <h4>Email Notifications</h4>
                    <p>Receive important updates via email</p>
                  </div>
                  <button
                    className={`settings-toggle ${notifications.email ? 'active' : ''}`}
                    onClick={() => handleToggle('email')}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <h4>SMS Notifications</h4>
                    <p>Get text messages for urgent alerts</p>
                  </div>
                  <button
                    className={`settings-toggle ${notifications.sms ? 'active' : ''}`}
                    onClick={() => handleToggle('sms')}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <h4>Attendance Alerts</h4>
                    <p>Notified when student attendance is marked</p>
                  </div>
                  <button
                    className={`settings-toggle ${notifications.attendance ? 'active' : ''}`}
                    onClick={() => handleToggle('attendance')}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <h4>Exam Updates</h4>
                    <p>Get notified about exam schedules and results</p>
                  </div>
                  <button
                    className={`settings-toggle ${notifications.exam ? 'active' : ''}`}
                    onClick={() => handleToggle('exam')}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <h4>Announcements</h4>
                    <p>School-wide announcements and notices</p>
                  </div>
                  <button
                    className={`settings-toggle ${notifications.announcements ? 'active' : ''}`}
                    onClick={() => handleToggle('announcements')}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              </div>

              <div className="settings-actions">
                <button className="settings-btn-primary" onClick={handleSave}>Save Preferences</button>
                <button className="settings-btn-ghost">Reset to Default</button>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="settings-panel fade-in">
              <div className="settings-panel-header">
                <h2>Security Settings</h2>
                <p>Manage your password and account security</p>
              </div>

              <div className="settings-security-card">
                <div className="settings-security-icon">
                  <BiLock />
                </div>
                <div className="settings-security-info">
                  <h4>Change Password</h4>
                  <p>It's recommended to change your password regularly</p>
                </div>
              </div>

              <div className="settings-form-grid single-col">
                <div className="settings-form-group">
                  <label>Current Password</label>
                  <input type="password" className="settings-input" placeholder="Enter current password" />
                </div>
                <div className="settings-form-group">
                  <label>New Password</label>
                  <input type="password" className="settings-input" placeholder="Enter new password" />
                </div>
                <div className="settings-form-group">
                  <label>Confirm New Password</label>
                  <input type="password" className="settings-input" placeholder="Confirm new password" />
                </div>
              </div>

              <div className="settings-password-rules">
                <span>Password must contain:</span>
                <ul>
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One number or special character</li>
                </ul>
              </div>

              <div className="settings-actions">
                <button className="settings-btn-primary" onClick={handleSave}>Update Password</button>
                <button className="settings-btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="settings-panel fade-in">
              <div className="settings-panel-header">
                <h2>Appearance</h2>
                <p>Customize how your dashboard looks</p>
              </div>

              <div className="settings-theme-section">
                <h4>Theme</h4>
                <div className="settings-theme-options">
                  <button className="settings-theme-card active">
                    <div className="theme-preview light">
                      <div className="theme-sidebar-preview"></div>
                      <div className="theme-content-preview">
                        <div className="theme-line"></div>
                        <div className="theme-line short"></div>
                      </div>
                    </div>
                    <span>Light</span>
                    <BiCheck className="theme-check" />
                  </button>
                  <button className="settings-theme-card">
                    <div className="theme-preview dark">
                      <div className="theme-sidebar-preview"></div>
                      <div className="theme-content-preview">
                        <div className="theme-line"></div>
                        <div className="theme-line short"></div>
                      </div>
                    </div>
                    <span>Dark</span>
                  </button>
                  <button className="settings-theme-card">
                    <div className="theme-preview auto">
                      <div className="theme-sidebar-preview"></div>
                      <div className="theme-content-preview">
                        <div className="theme-line"></div>
                        <div className="theme-line short"></div>
                      </div>
                    </div>
                    <span>System</span>
                  </button>
                </div>
              </div>

              <div className="settings-theme-section">
                <h4>Accent Color</h4>
                <div className="settings-color-options">
                  <button className="settings-color-swatch active" style={{ background: '#5d5fef' }}><BiCheck /></button>
                  <button className="settings-color-swatch" style={{ background: '#10b981' }}></button>
                  <button className="settings-color-swatch" style={{ background: '#f59e0b' }}></button>
                  <button className="settings-color-swatch" style={{ background: '#ef4444' }}></button>
                  <button className="settings-color-swatch" style={{ background: '#8b5cf6' }}></button>
                  <button className="settings-color-swatch" style={{ background: '#ec4899' }}></button>
                </div>
              </div>

              <div className="settings-actions">
                <button className="settings-btn-primary" onClick={handleSave}>Apply Theme</button>
                <button className="settings-btn-ghost">Reset to Default</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
