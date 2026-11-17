import React, { useState, useEffect } from 'react';
import { 
  BiPlus, 
  BiTrash, 
  BiEdit, 
  BiShow, 
  BiBell, 
  BiUser, 
  BiCalendar, 
  BiFilterAlt, 
  BiLockAlt, 
  BiCheckCircle, 
  BiXCircle, 
  BiInfoCircle, 
  BiMailSend,
  BiEnvelope 
} from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import { 
  createNotification, 
  getAllNotifications, 
  deleteNotification, 
  updateNotification, 
  deactivateNotification,
  getAllStandards,
  getAllBatches
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';

// ─── Helpers (same pattern as Teachers.jsx) ─────────────────────────────────
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

const toNumber = (v) => {
  if (v === null || v === undefined || v === 'undefined' || v === 'null') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notice Board Management Page (Admin)
 * Sleek, glassmorphic layout, fully integrated with Spring Boot NotificationController
 */
const Noticeboard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter and Category States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAudience, setFilterAudience] = useState('ALL');

  // ── Robust session context (sessionStorage → localStorage → JWT → fallback) ──
  let schoolId = toNumber(getAuthValue('schoolId'));
  let academicYearId = toNumber(getAuthValue('academicYearId'));

  if (!schoolId || !academicYearId) {
    const payload = parseJwtPayload(
      localStorage.getItem('token') || sessionStorage.getItem('token')
    );
    if (payload) {
      if (!schoolId)       schoolId       = toNumber(payload.schoolId || payload.sid);
      if (!academicYearId) academicYearId = toNumber(payload.academicYearId || payload.ayi);
    }
  }
  if (!academicYearId) academicYearId = 6; // Safety fallback

  // Dropdown lists
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Active Selected Item
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Form Field States
  const [formFields, setFormFields] = useState({
    title: '',
    message: '',
    type: 'GENERAL', // GENERAL, IMPORTANT, EVENT
    targetAudience: 'ALL', // ALL, TEACHERS, STUDENTS
    targetStandardId: '',
    targetDivisionId: '',
    expiryDate: '',
    sentBy: 'School Administration'
  });

  // Fetch all live notices from Spring Boot
  const fetchNotices = async () => {
    if (!schoolId || !academicYearId) return;
    setLoading(true);
    setError(null);
    try {
      // NOTE: axiosInstance interceptor returns response.data directly
      // so `res` is { code, status, message, data } — NOT the Axios envelope
      const res = await getAllNotifications({ schoolId, academicYearId });
      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setNotices(Array.isArray(res?.data) ? res.data : []);
      } else if (Array.isArray(res)) {
        // interceptor may return empty array for 404 empty-list
        setNotices(res);
      } else {
        setNotices([]);
      }
    } catch (err) {
      console.warn("Failed to load backend notices, falling back to empty list", err);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown helper data
  const fetchDropdowns = async () => {
    try {
      if (schoolId && academicYearId) {
        const stdRes = await getAllStandards(schoolId, academicYearId);
        if (stdRes.data && Array.isArray(stdRes.data.data)) {
          setStandards(stdRes.data.data);
        } else if (Array.isArray(stdRes.data)) {
          setStandards(stdRes.data);
        }

        const divRes = await getAllBatches(schoolId, academicYearId);
        if (divRes.data && Array.isArray(divRes.data.data)) {
          setDivisions(divRes.data.data);
        } else if (Array.isArray(divRes.data)) {
          setDivisions(divRes.data);
        }
      }
    } catch (e) {
      console.error("Error loading standards/divisions:", e);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchDropdowns();
  }, [schoolId, academicYearId]);

  // Handle Save Notice (Create)
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!formFields.title || !formFields.message) {
      alert("Please fill in the title and message fields.");
      return;
    }
    if (!schoolId || !academicYearId) {
      alert("Session context is missing (schoolId / academicYearId). Please log out and log in again.");
      return;
    }

    try {
      const payload = {
        schoolId,
        academicYearId,
        title: formFields.title,
        message: formFields.message,
        type: formFields.type,
        targetAudience: formFields.targetAudience,
        targetStandardId: formFields.targetStandardId ? Number(formFields.targetStandardId) : null,
        targetDivisionId: formFields.targetDivisionId ? Number(formFields.targetDivisionId) : null,
        sentBy: formFields.sentBy || "School Administration",
        expiryDate: formFields.expiryDate || null,
        isActive: true
      };

      const res = await createNotification(payload);
      // axiosInstance interceptor returns response.data directly
      // success shape: { code: 200, status: "SUCCESS", message: "...", data: null }
      const ok = res?.status === 'SUCCESS' || res?.code === 200;
      if (ok) {
        alert("Notice published successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchNotices();
      } else {
        alert(res?.message || "Failed to create notice.");
      }
    } catch (err) {
      console.error('[Noticeboard] createNotification error:', err);
      alert(err?.message || "Something went wrong while publishing.");
    }
  };

  // Handle Update Notice (Edit)
  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    if (!selectedNotice) return;

    try {
      const payload = {
        notificationId: selectedNotice.notificationId,
        schoolId,
        academicYearId,
        title: formFields.title,
        message: formFields.message,
        type: formFields.type,
        targetAudience: formFields.targetAudience,
        targetStandardId: formFields.targetStandardId ? Number(formFields.targetStandardId) : null,
        targetDivisionId: formFields.targetDivisionId ? Number(formFields.targetDivisionId) : null,
        sentBy: formFields.sentBy || "School Administration",
        expiryDate: formFields.expiryDate || null,
        isActive: selectedNotice.isActive
      };

      const res = await updateNotification(payload);
      const ok = res?.status === 'SUCCESS' || res?.code === 200;
      if (ok) {
        alert("Notice updated successfully!");
        setShowEditModal(false);
        resetForm();
        fetchNotices();
      } else {
        alert(res?.message || "Failed to update notice.");
      }
    } catch (err) {
      console.error('[Noticeboard] updateNotification error:', err);
      alert(err?.message || "Failed to edit notice.");
    }
  };

  // Handle Delete Notice
  const handleDelete = async (noticeId) => {
    if (!window.confirm("Are you sure you want to permanently delete this notice?")) return;

    try {
      const res = await deleteNotification({
        notificationId: noticeId,
        schoolId
      });
      const ok = res?.status === 'SUCCESS' || res?.code === 200;
      if (ok) {
        alert("Notice deleted successfully.");
        fetchNotices();
      } else {
        alert(res?.message || "Failed to delete notice.");
      }
    } catch (err) {
      console.error('[Noticeboard] deleteNotification error:', err);
      alert(err?.message || "Failed to delete notice.");
    }
  };

  // Handle Deactivate Notice
  const handleDeactivate = async (noticeId) => {
    try {
      const res = await deactivateNotification({
        notificationId: noticeId,
        schoolId,
        academicYearId
      });
      const ok = res?.status === 'SUCCESS' || res?.code === 200;
      if (ok) {
        alert("Notice deactivated successfully.");
        fetchNotices();
      } else {
        alert(res?.message || "Failed to deactivate notice.");
      }
    } catch (err) {
      console.error('[Noticeboard] deactivateNotification error:', err);
      alert(err?.message || "Failed to deactivate notice.");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (notice) => {
    setSelectedNotice(notice);
    setFormFields({
      title: notice.title || '',
      message: notice.message || '',
      type: notice.type || 'GENERAL',
      targetAudience: notice.targetAudience || 'ALL',
      targetStandardId: notice.targetStandardId || '',
      targetDivisionId: notice.targetDivisionId || '',
      expiryDate: notice.expiryDate || '',
      sentBy: notice.sentBy || 'School Administration'
    });
    setShowEditModal(true);
  };

  const openViewModal = (notice) => {
    setSelectedNotice(notice);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormFields({
      title: '',
      message: '',
      type: 'GENERAL',
      targetAudience: 'ALL',
      targetStandardId: '',
      targetDivisionId: '',
      expiryDate: '',
      sentBy: 'School Administration'
    });
    setSelectedNotice(null);
  };

  // Filters calculation
  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAudience = filterAudience === 'ALL' || n.targetAudience === filterAudience;
    return matchesSearch && matchesAudience;
  });

  const getAudienceBadge = (aud) => {
    switch (aud) {
      case 'TEACHERS':
        return <span className="notice-badge badge-teachers">Teachers</span>;
      case 'STUDENTS':
        return <span className="notice-badge badge-students">Students</span>;
      default:
        return <span className="notice-badge badge-all">All Users</span>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'IMPORTANT':
        return <span className="type-badge badge-important">⚠️ Important</span>;
      case 'EVENT':
        return <span className="type-badge badge-event">📅 Event</span>;
      default:
        return <span className="type-badge badge-general">📢 Announcement</span>;
    }
  };

  const totalActiveCount = notices.filter(n => n.isActive).length;
  const totalImportantCount = notices.filter(n => n.type === 'IMPORTANT').length;

  return (
    <div className="noticeboard-page space-y-8">
      <style>{`
        .noticeboard-page {
          font-family: 'Inter', sans-serif;
          animation: fadeIn 0.4s ease;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }

        .stat-card-notice {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon.blue { background: #eef2ff; color: #4f46e5; }
        .stat-icon.green { background: #ecfdf5; color: #059669; }
        .stat-icon.red { background: #fef2f2; color: #dc2626; }

        .stat-info p {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stat-info h3 {
          margin: 0.25rem 0 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }

        .workspace-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .filter-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          min-width: 240px;
          padding: 0.65rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9rem;
          outline: none;
        }
        .search-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .btn-create {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 0.7rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
        }
        .btn-create:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
        }

        /* Stats Section */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card-notice {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue { background: rgba(37,99,235,0.1); color: #2563eb; }
        .stat-icon.green { background: rgba(16,185,129,0.1); color: #10b981; }
        .stat-icon.red { background: rgba(239,68,68,0.1); color: #ef4444; }

        .stat-info p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .stat-info h3 {
          margin: 4px 0 0;
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
        }

        /* Main Workspace */
        .workspace-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
        }

        .filter-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          position: relative;
          min-width: 280px;
        }

        .search-input {
          width: 100%;
          padding: 9px 12px 9px 36px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 14px;
          outline: none;
          transition: 0.2s;
        }

        .search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .audience-select {
          padding: 9px 12px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 14px;
          background: white;
          outline: none;
          min-width: 160px;
          cursor: pointer;
        }

        /* Notice Badges */
        .notice-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-teachers { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .badge-students { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .badge-all { background: rgba(100, 116, 139, 0.1); color: #64748b; }

        .type-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .badge-important { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
        .badge-event { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
        .badge-general { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }

        /* Action Buttons */
        .btn-action-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 18px;
          padding: 5px;
          border-radius: 6px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-action-icon:hover {
          background: #f1f5f9;
          color: #2563eb;
        }

        .btn-action-icon.text-danger:hover {
          color: #ef4444;
          background: #fef2f2;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .modal-body-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1e293b;
          font-weight: 700;
        }

        .btn-modal-close {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          padding: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-control-notice {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 14px;
          outline: none;
          transition: 0.2s;
        }

        .form-control-notice:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .form-label {
          display: block;
          font-weight: 600;
          font-size: 13px;
          color: #334155;
          margin-bottom: 6px;
        }

        .btn-submit {
          background: #2563eb;
          color: white;
          font-weight: 600;
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit:hover {
          background: #1d4ed8;
        }

        .btn-cancel {
          background: transparent;
          border: 1.5px solid #cbd5e1;
          color: #64748b;
          padding: 10px 20px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          border-color: #94a3b8;
          color: #334155;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Notice Board Control Panel
          </h1>
          <p className="text-sm text-slate-500">Communication &gt; Live Announcements</p>
        </div>
        <button className="btn-create" onClick={openCreateModal}>
          <BiPlus size={20} /> Publish Announcement
        </button>
      </div>

      {/* Stats Board */}
      <div className="stats-row">
        <div className="stat-card-notice">
          <div className="stat-icon blue">
            <BiBell size={24} />
          </div>
          <div className="stat-info">
            <p>Total Published</p>
            <h3>{notices.length}</h3>
          </div>
        </div>

        <div className="stat-card-notice">
          <div className="stat-icon green">
            <BiCheckCircle size={24} />
          </div>
          <div className="stat-info">
            <p>Active Live Announcements</p>
            <h3>{totalActiveCount}</h3>
          </div>
        </div>

        <div className="stat-card-notice">
          <div className="stat-icon red">
            <BiInfoCircle size={24} />
          </div>
          <div className="stat-info">
            <p>Critical Warnings</p>
            <h3>{totalImportantCount}</h3>
          </div>
        </div>
      </div>

      {/* Notice Board Workspace */}
      <div className="workspace-card">
        <div className="filter-panel">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search announcements..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className="audience-select"
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
            >
              <option value="ALL">All Audiences</option>
              <option value="TEACHERS">Teachers Only</option>
              <option value="STUDENTS">Students Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '15px', color: '#64748b', fontWeight: '500' }}>Fetching live board announcements...</p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
            <BiEnvelope size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: 0, color: '#475569' }}>No announcements published</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Click 'Publish Announcement' to broadcast your first announcement.</p>
          </div>
        ) : (
          <DataTable 
            headers={['Topic/Title', 'Date Posted', 'Audience', 'Severity', 'Active', 'Actions']}
            data={filteredNotices}
            renderRow={(notice) => (
              <tr key={notice.notificationId}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: '#1e293b', fontSize: '14px' }}>{notice.title}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>By {notice.sentBy || "School Administration"}</span>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: '#475569' }}>
                  {notice.sentAt ? new Date(notice.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </td>
                <td>{getAudienceBadge(notice.targetAudience)}</td>
                <td>{getTypeBadge(notice.type)}</td>
                <td>
                  <span style={{ 
                    background: notice.isActive ? '#dcfce7' : '#f1f5f9', 
                    color: notice.isActive ? '#15803d' : '#475569',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {notice.isActive ? 'LIVE' : 'ARCHIVED'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-action-icon" title="View details" onClick={() => openViewModal(notice)}>
                      <BiShow />
                    </button>
                    <button className="btn-action-icon" title="Edit announcement" onClick={() => openEditModal(notice)}>
                      <BiEdit />
                    </button>
                    {notice.isActive ? (
                      <button className="btn-action-icon" style={{ color: '#d97706' }} title="Deactivate" onClick={() => handleDeactivate(notice.notificationId)}>
                        <BiXCircle />
                      </button>
                    ) : null}
                    <button className="btn-action-icon text-danger" title="Delete notice" onClick={() => handleDelete(notice.notificationId)}>
                      <BiTrash />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-body-content">
            <div className="modal-header">
              <h2>Publish Announcement</h2>
              <button className="btn-modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateNotice}>
              <div style={{ marginBottom: '15px' }}>
                <label className="form-label">Announcement Title *</label>
                <input 
                  type="text" 
                  className="form-control-notice"
                  placeholder="e.g. Mid-term Examinations Postponed"
                  value={formFields.title}
                  onChange={(e) => setFormFields(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label className="form-label">Detailed Message *</label>
                <textarea 
                  className="form-control-notice"
                  rows="4"
                  placeholder="Provide detailed description of the announcement..."
                  value={formFields.message}
                  onChange={(e) => setFormFields(p => ({ ...p, message: e.target.value }))}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Type / Category</label>
                  <select 
                    className="form-control-notice"
                    value={formFields.type}
                    onChange={(e) => setFormFields(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="GENERAL">📢 General Announcement</option>
                    <option value="IMPORTANT">⚠️ Important Alert</option>
                    <option value="EVENT">📅 Event Broadcast</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Audience</label>
                  <select 
                    className="form-control-notice"
                    value={formFields.targetAudience}
                    onChange={(e) => setFormFields(p => ({ ...p, targetAudience: e.target.value }))}
                  >
                    <option value="ALL">All Users</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              {formFields.targetAudience === 'STUDENTS' && (
                <div className="form-row" style={{ marginBottom: '15px' }}>
                  <div>
                    <label className="form-label">Limit to Standard (Optional)</label>
                    <select 
                      className="form-control-notice"
                      value={formFields.targetStandardId}
                      onChange={(e) => setFormFields(p => ({ ...p, targetStandardId: e.target.value }))}
                    >
                      <option value="">Select Standard</option>
                      {standards.map(s => (
                        <option key={s.standardId} value={s.standardId}>{s.standard || s.standardName || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Limit to Section (Optional)</label>
                    <select 
                      className="form-control-notice"
                      value={formFields.targetDivisionId}
                      onChange={(e) => setFormFields(p => ({ ...p, targetDivisionId: e.target.value }))}
                    >
                      <option value="">Select Section</option>
                      {divisions.map(d => (
                        <option key={d.batchId || d.divisionId || d.id} value={d.batchId || d.divisionId || d.id}>
                          {d.batchName || d.divisionName || d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div>
                  <label className="form-label">Expiry Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-control-notice"
                    value={formFields.expiryDate}
                    onChange={(e) => setFormFields(p => ({ ...p, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Sender Identity</label>
                  <input 
                    type="text" 
                    className="form-control-notice"
                    placeholder="e.g. Principal's Office"
                    value={formFields.sentBy}
                    onChange={(e) => setFormFields(p => ({ ...p, sentBy: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-body-content">
            <div className="modal-header">
              <h2>Edit Announcement</h2>
              <button className="btn-modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateNotice}>
              <div style={{ marginBottom: '15px' }}>
                <label className="form-label">Announcement Title *</label>
                <input 
                  type="text" 
                  className="form-control-notice"
                  value={formFields.title}
                  onChange={(e) => setFormFields(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label className="form-label">Detailed Message *</label>
                <textarea 
                  className="form-control-notice"
                  rows="4"
                  value={formFields.message}
                  onChange={(e) => setFormFields(p => ({ ...p, message: e.target.value }))}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Type / Category</label>
                  <select 
                    className="form-control-notice"
                    value={formFields.type}
                    onChange={(e) => setFormFields(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="GENERAL">📢 General Announcement</option>
                    <option value="IMPORTANT">⚠️ Important Alert</option>
                    <option value="EVENT">📅 Event Broadcast</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Audience</label>
                  <select 
                    className="form-control-notice"
                    value={formFields.targetAudience}
                    onChange={(e) => setFormFields(p => ({ ...p, targetAudience: e.target.value }))}
                  >
                    <option value="ALL">All Users</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Expiry Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-control-notice"
                    value={formFields.expiryDate}
                    onChange={(e) => setFormFields(p => ({ ...p, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Sender Identity</label>
                  <input 
                    type="text" 
                    className="form-control-notice"
                    value={formFields.sentBy}
                    onChange={(e) => setFormFields(p => ({ ...p, sentBy: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedNotice && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-body-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {getTypeBadge(selectedNotice.type)}
                  {getAudienceBadge(selectedNotice.targetAudience)}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: '#1e293b' }}>{selectedNotice.title}</h2>
              </div>
              <button className="btn-modal-close" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            
            <div style={{ minHeight: '100px', fontSize: '14px', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              {selectedNotice.message}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '12px', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BiUser size={16} /> <strong>Sender:</strong> {selectedNotice.sentBy || "School Administration"}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BiCalendar size={16} /> <strong>Posted:</strong> {selectedNotice.sentAt ? new Date(selectedNotice.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </div>
              {selectedNotice.expiryDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                  <BiCalendar size={16} /> <strong>Expires:</strong> {new Date(selectedNotice.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-cancel" onClick={() => setShowViewModal(false)} style={{ padding: '8px 16px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Noticeboard;
