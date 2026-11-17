import React from 'react';
import { BiX, BiUser, BiEnvelope, BiPhone, BiMap, BiCalendar, BiIdCard, BiBookmark, BiGroup } from 'react-icons/bi';

const StudentProfileModal = ({ profile, onClose }) => {
  if (!profile) return null;

  return (
    <div className="modal-overlay space-y-8" onClick={onClose}>
      <div className="modal-container profile-modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-top-bar">
          <h2 className="modal-title"><BiUser /> Student Profile</h2>
          <button className="btn-icon-action close" onClick={onClose} title="Close">
            <BiX />
          </button>
        </div>

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
          {/* Personal & Contact */}
          <div className="profile-info-block">
            <span className="profile-section-title">Personal & Contact</span>
            
            <div className="info-item-row">
              <div className="info-item-icon"><BiEnvelope /></div>
              <div className="info-item-content">
                <span className="label">Email Address</span>
                <span className="value">{profile.email || 'N/A'}</span>
              </div>
            </div>

            <div className="info-item-row">
              <div className="info-item-icon"><BiPhone /></div>
              <div className="info-item-content">
                <span className="label">Phone Number</span>
                <span className="value">{profile.phone || profile.mobile || 'N/A'}</span>
              </div>
            </div>

            <div className="info-item-row">
              <div className="info-item-icon"><BiCalendar /></div>
              <div className="info-item-content">
                <span className="label">Date of Birth</span>
                <span className="value">{profile.dob || 'January 15, 2010'}</span>
              </div>
            </div>

            <div className="info-item-row">
              <div className="info-item-icon"><BiMap /></div>
              <div className="info-item-content">
                <span className="label">Address</span>
                <span className="value">{profile.address || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="profile-info-block">
            <span className="profile-section-title">Academic Details</span>
            
            <div className="info-item-row">
              <div className="info-item-icon"><BiIdCard /></div>
              <div className="info-item-content">
                <span className="label">Student ID / Roll No</span>
                <span className="value">{profile.studentId || profile.rollNo || 'STU-2026-001'}</span>
              </div>
            </div>

            <div className="info-item-row">
              <div className="info-item-icon"><BiBookmark /></div>
              <div className="info-item-content">
                <span className="label">Standard & Division</span>
                <span className="value">{profile.standardName} - {profile.divisionName}</span>
              </div>
            </div>

            <div className="info-item-row">
              <div className="info-item-icon"><BiGroup /></div>
              <div className="info-item-content">
                <span className="label">Parent / Guardian</span>
                <span className="value">{profile.guardianName || 'Mr. Robert Fox'}</span>
              </div>
            </div>

            <div className="info-item-row">
              <div className="info-item-icon"><BiCalendar /></div>
              <div className="info-item-content">
                <span className="label">Admission Date</span>
                <span className="value">{profile.admissionDate || 'June 12, 2024'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
