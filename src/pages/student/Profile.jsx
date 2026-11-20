import React, { useState, useEffect } from 'react';
import { BiUser, BiEnvelope, BiPhone, BiMap, BiCalendar, BiIdCard, BiBookmark, BiGroup } from 'react-icons/bi';
import { useStudentSearch } from '../../contexts/StudentSearchContext';


const getStoredValue = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const { searchQuery } = useStudentSearch();

  useEffect(() => {
    try {
      const stored = getStoredValue('profileData');
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        const userEmail = getStoredValue('userEmail') || 'PANKAJ142221@gmail.com';
        const displayName = getStoredValue('userName') || userEmail.split('@')[0].toUpperCase();
        setProfile({ fullName: displayName, email: userEmail });
      }
    } catch (e) {
      console.error('Failed to parse profile data', e);
    }
  }, []);

  if (!profile) return <div className="student-page-container">Loading Profile...</div>;

  return (
    <div className="student-page-container fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and manage your personal academic record</p>
      </div>

      <div className="premium-card glass profile-page-card">
        <div className="profile-card-header">
          <div className="profile-img-large">
            {profile.fullName?.charAt(0) || <BiUser />}
          </div>
          <div className="profile-main-info">
            <h2>{profile.fullName}</h2>
            <div className="profile-academic-tag">
              Grade {profile.standardName || '—'} {profile.divisionName || '—'}
            </div>
          </div>
        </div>

        <div className="profile-details-grid">
          {(() => {
            const searchLower = (searchQuery || '').toLowerCase();
            const personalRows = [
              { label: 'Email Address', value: profile.email || 'N/A', icon: <BiEnvelope /> },
              { label: 'Phone Number', value: profile.phone || profile.mobile || 'N/A', icon: <BiPhone /> },
              { label: 'Date of Birth', value: profile.dob || 'January 15, 2010', icon: <BiCalendar /> },
              { label: 'Address', value: profile.address || 'Not specified', icon: <BiMap /> }
            ].filter(row => !searchLower || row.label.toLowerCase().includes(searchLower) || String(row.value).toLowerCase().includes(searchLower));

            const academicRows = [
              { label: 'Student ID', value: profile.studentId || profile.rollNo || 'STU-2026-001', icon: <BiIdCard /> },
              { label: 'Standard & Division', value: `${profile.standardName} - ${profile.divisionName}`, icon: <BiBookmark /> },
              { label: 'Parent / Guardian', value: profile.guardianName || 'Mr. Robert Fox', icon: <BiGroup /> },
              { label: 'Admission Date', value: profile.admissionDate || 'June 12, 2024', icon: <BiCalendar /> }
            ].filter(row => !searchLower || row.label.toLowerCase().includes(searchLower) || String(row.value).toLowerCase().includes(searchLower));

            return (
              <>
                {/* Personal & Contact */}
                {personalRows.length > 0 && (
                  <div className="profile-info-block">
                    <span className="profile-section-title">Personal & Contact</span>
                    {personalRows.map((row, idx) => (
                      <div key={idx} className="info-item-row">
                        <div className="info-item-icon">{row.icon}</div>
                        <div className="info-item-content">
                          <span className="label">{row.label}</span>
                          <span className="value">{row.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Academic Information */}
                {academicRows.length > 0 && (
                  <div className="profile-info-block">
                    <span className="profile-section-title">Academic Details</span>
                    {academicRows.map((row, idx) => (
                      <div key={idx} className="info-item-row">
                        <div className="info-item-icon">{row.icon}</div>
                        <div className="info-item-content">
                          <span className="label">{row.label}</span>
                          <span className="value">{row.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {personalRows.length === 0 && academicRows.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No profile details match your search.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
