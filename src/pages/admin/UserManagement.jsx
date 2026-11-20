import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BiPlus, BiSearch, BiFilter, BiEditAlt, BiTrash, BiUserCircle, BiX, BiCheck, BiLoader, BiBuildings, BiCalendar, BiWallet, BiIdCard, BiUser } from 'react-icons/bi';
import {
  getAllUsers,
  getTeacherById,
  getStudentById,
  updateTeacher,
  updateStudent,
  deleteTeacher,
  deleteStudent,
  changeTeacherStatus,
  updateStudentStatus
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';


/**
 * User Management Page
 * Handles user list, search, edit, and deletion via real API
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');

  useEffect(() => {
    fetchUsers();
  }, []);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchUsers = async () => {
    if (!schoolId || !academicYearId) return;
    try {
      setLoading(true);
      const res = await getAllUsers({ schoolId, academicYearId });
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showFeedback('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNameClick = async (user) => {
    try {
      setViewLoading(true);
      setViewingProfile({ ...user, isLoading: true });
      const payload = { id: user.id, schoolId, academicYearId };
      let res;
      if (user.userType === 'teacher') {
        res = await getTeacherById(payload);
      } else {
        res = await getStudentById(payload);
      }
      if (res.data) {
        setViewingProfile({ ...res.data, userType: user.userType, isLoading: false });
      } else {
        setViewingProfile(null);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      showFeedback('Failed to load user details', 'error');
      setViewingProfile(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleEditClick = async (user) => {
    try {
      setEditLoading(true);
      setShowModal(true);
      const payload = { id: user.id, schoolId, academicYearId };
      let res;
      if (user.userType === 'teacher') {
        res = await getTeacherById(payload);
      } else {
        res = await getStudentById(payload);
      }
      if (res.data) {
        setEditingUser({ ...res.data, userType: user.userType });
        setEditFormData({ ...res.data });
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      showFeedback('Failed to load user details', 'error');
      setShowModal(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditLoading(true);
      
      if (editingUser.userType === 'teacher') {
        await changeTeacherStatus({
          id: String(editingUser.id),
          schoolId: String(schoolId),
          status: editFormData.status
        });
      } else {
        await updateStudentStatus({
          id: editingUser.id,
          schoolId: schoolId,
          status: editFormData.status
        });
      }
      showFeedback(`${editingUser.userType === 'teacher' ? 'Teacher' : 'Student'} status updated successfully`);
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      showFeedback('Failed to update user status', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setShowDeleteConfirm(user);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;
    const user = showDeleteConfirm;
    try {
      setDeleteLoading(true);
      const payload = { id: user.id, schoolId };
      if (user.userType === 'teacher') {
        await deleteTeacher(payload);
      } else {
        await deleteStudent(payload);
      }
      showFeedback(`${user.userType === 'teacher' ? 'Teacher' : 'Student'} deleted successfully`);
      setShowDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showFeedback('Failed to delete user', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const name = (user.name || user.teacherName || `${user.firstName || ''} ${user.lastName || ''}`).trim().toLowerCase();
    const email = (user.email || user.emailId || '').toLowerCase();
    const phone = (user.phone || user.mobileNumber || '').toLowerCase();
    const role = (user.userType || user.role || '').toLowerCase();
    const studentId = (user.studentId || '').toLowerCase();
    const prnNumber = (user.prnNumber || '').toLowerCase();

    return name.includes(term) ||
      email.includes(term) ||
      phone.includes(term) ||
      role.includes(term) ||
      studentId.includes(term) ||
      prnNumber.includes(term);
  });

  const getUserName = (user) => user.name || user.teacherName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const getUserEmail = (user) => user.email || user.emailId || '';
  const getUserRole = (user) => user.userType || 'unknown';
  const getUserStatus = (user) => user.status || 'ACTIVE';

  return (
    <div className="user-management-page space-y-8">
      {feedback && (
        <div className={`um-toast ${feedback.type}`}>
          {feedback.type === 'success' ? <BiCheck /> : <BiX />}
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">User Management</h1>
          <p className="text-sm text-slate-500">Administration &gt; Users</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="relative min-w-[240px]">
            <BiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="text-sm text-slate-500">
            Total: <strong className="text-slate-800">{filteredUsers.length}</strong> users
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <BiLoader className="animate-spin text-3xl text-indigo-600" /> Retrieving user database...
            </div>
          ) : (
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contact Info</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role / Placement</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
                      No users found in database
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={`${user.userType}-${user.id}`}>
                      {/* Name + Avatar */}
                      <td style={{ minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(user))}&background=${user.userType === 'teacher' ? '10b981' : '6366f1'}&color=fff&bold=true&size=80`}
                            alt=""
                            style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, boxShadow: `0 2px 8px ${user.userType === 'teacher' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`, border: `2px solid ${user.userType === 'teacher' ? '#d1fae5' : '#e0e7ff'}` }}
                          />
                          <div>
                            <div
                              style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.92rem', cursor: 'pointer', lineHeight: 1.3 }}
                              onClick={() => handleNameClick(user)}
                              title="Click to view full profile"
                            >
                              {getUserName(user)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ background: user.gender === 'FEMALE' ? '#fce7f3' : user.gender === 'MALE' ? '#dbeafe' : '#f3f4f6', color: user.gender === 'FEMALE' ? '#be185d' : user.gender === 'MALE' ? '#1d4ed8' : '#6b7280', padding: '1px 7px', borderRadius: '20px', fontWeight: 600, fontSize: '0.68rem', textTransform: 'capitalize' }}>
                                {user.gender ? user.gender.toLowerCase() : 'N/A'}
                              </span>
                              <span style={{ color: '#d1d5db' }}>·</span>
                              <span style={{ color: user.userType === 'teacher' ? '#10b981' : '#6366f1', fontWeight: 600 }}>#{user.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ minWidth: '180px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>
                          {user.phone || <span style={{ color: '#d1d5db' }}>No phone</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getUserEmail(user) || <span style={{ color: '#d1d5db' }}>No email</span>}
                        </div>
                      </td>

                      {/* Role / Placement */}
                      <td style={{ minWidth: '150px' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`badge badge-${getUserRole(user).toLowerCase()}`} style={{ fontWeight: 700, fontSize: '0.75rem', width: 'fit-content' }}>
                            {getUserRole(user).charAt(0).toUpperCase() + getUserRole(user).slice(1)}
                          </span>
                          {user.userType === 'student' && user.standardId && (
                            <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>
                              Class ID: {user.standardId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle (Clickable Badge!) */}
                      <td style={{ minWidth: '100px' }}>
                        <button
                          onClick={async () => {
                            const nextStatus = getUserStatus(user) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                            try {
                              if (user.userType === 'teacher') {
                                await changeTeacherStatus({
                                  id: String(user.id),
                                  schoolId: String(schoolId),
                                  status: nextStatus
                                });
                              } else {
                                await updateStudentStatus({
                                  id: user.id,
                                  schoolId: schoolId,
                                  status: nextStatus
                                });
                              }
                              showFeedback(`User status updated to ${nextStatus}`);
                              fetchUsers();
                            } catch (err) {
                              console.error('Error toggling status:', err);
                              showFeedback('Failed to update status', 'error');
                            }
                          }}
                          title="Click to toggle status"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
                            transition: 'all 0.2s ease',
                            ...(getUserStatus(user) === 'ACTIVE'
                              ? { background: '#dcfce7', color: '#15803d', boxShadow: '0 0 0 1px #bbf7d0' }
                              : { background: '#fee2e2', color: '#b91c1c', boxShadow: '0 0 0 1px #fecaca' })
                          }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: getUserStatus(user) === 'ACTIVE' ? '#16a34a' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                          {getUserStatus(user) === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleNameClick(user)}
                            title="View Profile"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e0e7ff', background: '#f5f3ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='#6366f1'; e.currentTarget.style.color='white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.color='#6366f1'; }}
                          ><BiUserCircle /></button>
                          <button
                            onClick={() => handleEditClick(user)}
                            title="Edit User Status"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='#059669'; e.currentTarget.style.color='white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.color='#059669'; }}
                          ><BiEditAlt /></button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            title="Delete User"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff1f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#fff1f2'; e.currentTarget.style.color='#ef4444'; }}
                          ><BiTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== EDIT USER MODAL ===== */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content card" style={{width: '100%', maxWidth: '550px', padding: '2rem'}}>
            {editLoading && !editingUser ? (
              <div className="um-loading">
                <BiLoader className="um-spinner" /> Loading details...
              </div>
            ) : editingUser ? (
              <>
                <div className="flex-between" style={{marginBottom: '1.5rem'}}>
                  <h2>Edit {editingUser.userType === 'teacher' ? 'Teacher' : 'Student'}</h2>
                  <button className="btn-icon" onClick={() => { setShowModal(false); setEditingUser(null); }}><BiX style={{fontSize: '1.2rem'}} /></button>
                </div>
                <form className="grid gap-1" onSubmit={handleEditSubmit}>
                  {editingUser.userType === 'teacher' ? (
                    <>
                      <div className="form-group">
                        <label>Teacher Name</label>
                        <input type="text" name="teacherName" className="form-control" value={editFormData.teacherName || ''} onChange={handleEditInputChange} readOnly />
                      </div>
                      <div className="grid" style={{gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                        <div className="form-group">
                          <label>Email</label>
                          <input type="email" name="emailId" className="form-control" value={editFormData.emailId || ''} onChange={handleEditInputChange} readOnly />
                        </div>
                        <div className="form-group">
                          <label>Mobile Number</label>
                          <input type="text" name="mobileNumber" className="form-control" value={editFormData.mobileNumber || ''} onChange={handleEditInputChange} readOnly />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input type="text" name="address" className="form-control" value={editFormData.address || ''} onChange={handleEditInputChange} readOnly />
                      </div>
                      <div className="grid" style={{gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                        <div className="form-group">
                          <label>Salary Type</label>
                          <select name="salaryType" className="form-control" value={editFormData.salaryType || ''} onChange={handleEditInputChange} disabled>
                            <option value="">Select</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Annual">Annual</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <select name="status" className="form-control" value={editFormData.status || ''} onChange={handleEditInputChange}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid" style={{gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                        <div className="form-group">
                          <label>First Name</label>
                          <input type="text" name="firstName" className="form-control" value={editFormData.firstName || ''} onChange={handleEditInputChange} readOnly />
                        </div>
                        <div className="form-group">
                          <label>Last Name</label>
                          <input type="text" name="lastName" className="form-control" value={editFormData.lastName || ''} onChange={handleEditInputChange} readOnly />
                        </div>
                      </div>
                      <div className="grid" style={{gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                        <div className="form-group">
                          <label>Email</label>
                          <input type="email" name="emailId" className="form-control" value={editFormData.emailId || ''} onChange={handleEditInputChange} readOnly />
                        </div>
                        <div className="form-group">
                          <label>Mobile Number</label>
                          <input type="text" name="mobileNumber" className="form-control" value={editFormData.mobileNumber || ''} onChange={handleEditInputChange} readOnly />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Guardian Name</label>
                        <input type="text" name="guardianName" className="form-control" value={editFormData.guardianName || ''} onChange={handleEditInputChange} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input type="text" name="address" className="form-control" value={editFormData.address || ''} onChange={handleEditInputChange} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select name="status" className="form-control" value={editFormData.status || ''} onChange={handleEditInputChange}>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className="flex-end gap-1 mt-1">
                    <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditingUser(null); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={editLoading}>
                      {editLoading ? 'Saving...' : <><BiCheck /> Update</>}
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        </div>,
        document.body
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      {showDeleteConfirm && createPortal(
        <div className="modal-overlay" style={{zIndex: 1100}}>
          <div className="modal-content card" style={{maxWidth: '420px', textAlign: 'center', padding: '2rem'}}>
            <div style={{fontSize: '3rem', color: 'var(--danger)', marginBottom: '0.5rem'}}>⚠️</div>
            <h2 style={{marginBottom: '0.5rem'}}>Delete {showDeleteConfirm.userType === 'teacher' ? 'Teacher' : 'Student'}?</h2>
            <p className="text-muted" style={{marginBottom: '1.5rem'}}>
              Are you sure you want to delete <strong>{getUserName(showDeleteConfirm)}</strong>? This action cannot be undone.
            </p>
            <div className="flex-center gap-1">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)} disabled={deleteLoading}>Cancel</button>
              <button className="btn" style={{background: 'var(--danger)', color: 'white'}} onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : <><BiTrash /> Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== VIEW PROFILE MODAL ===== */}
      {viewingProfile && createPortal(
        <div className="modal-overlay">
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', padding: 0, overflow: 'hidden', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: 'none' }}>
            {viewingProfile.isLoading ? (
              <div className="um-loading" style={{ padding: '5rem' }}>
                <BiLoader className="um-spinner" style={{ fontSize: '2.5rem', color: 'var(--primary)' }} /> Loading detailed credentials...
              </div>
            ) : (
              <>
                {/* Header Hero Section */}
                <div className="profile-hero" style={{ background: viewingProfile.userType === 'teacher' ? 'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', padding: '2.5rem 2rem 2rem 2rem', position: 'relative' }}>
                  <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(viewingProfile))}&size=128&background=fff&color=${viewingProfile.userType === 'teacher' ? '0d9488' : '4f46e5'}&bold=true`} 
                        alt="" 
                        style={{ width: '90px', height: '90px', borderRadius: '24px', border: '4px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', objectFit: 'cover' }} 
                      />
                      <div>
                        <h2 className="mb-0 text-white" style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'white' }}>
                          {getUserName(viewingProfile)}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{ background: 'white', color: viewingProfile.userType === 'teacher' ? '#0d9488' : '#4f46e5', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {viewingProfile.userType}
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
                <div className="modal-body-scroll" style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto', background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  
                  {/* Type-Specific Layout */}
                  {viewingProfile.userType === 'teacher' ? (
                    <>
                      {/* Teacher Group 1: Personal Particulars */}
                      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                          <BiUser style={{ color: '#0d9488', fontSize: '1.2rem' }} /> Personal Details
                        </h4>
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Gender</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{viewingProfile.gender ? String(viewingProfile.gender).toLowerCase() : 'Not specified'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Date of Birth</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.dateOfBirth ? new Date(viewingProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not specified'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Email Address</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={viewingProfile.emailId}>{viewingProfile.emailId || 'Not provided'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Mobile Number</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.mobileNumber || 'Not provided'}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Correspondence Address</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, lineHeight: '1.4' }}>{viewingProfile.address || 'Not registered'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Teacher Group 2: Employment details */}
                      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                          <BiBuildings style={{ color: '#0ea5e9', fontSize: '1.2rem' }} /> Employment Setup
                        </h4>
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Roster Status</span>
                            <span className={`status-badge ${String(viewingProfile.status).toLowerCase() === 'active' ? 'active' : 'inactive'}`} style={{ margin: 0 }}>
                              {viewingProfile.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Salary Grade</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.salaryType || 'FIXED'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Joining Date</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.joiningDate ? new Date(viewingProfile.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not provided'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Aadhar Ref</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.aadharCardNumber || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Teacher Group 3: Financial compensation details */}
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
                    </>
                  ) : (
                    <>
                      {/* Student Group 1: Personal details */}
                      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                          <BiUser style={{ color: '#4f46e5', fontSize: '1.2rem' }} /> Personal Details
                        </h4>
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Gender</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{viewingProfile.gender ? String(viewingProfile.gender).toLowerCase() : 'Not specified'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Date of Birth</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.dateOfBirth ? new Date(viewingProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not specified'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Aadhar Ref</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.aadharNumber || 'Not provided'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Contact Phone</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.mobileNumber || 'Not provided'}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Correspondence Address</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, lineHeight: '1.4' }}>{viewingProfile.address || 'Not registered'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Group 2: Academic placement */}
                      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                          <BiBuildings style={{ color: '#0ea5e9', fontSize: '1.2rem' }} /> Academic Setup
                        </h4>
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Roster Status</span>
                            <span className={`status-badge ${String(viewingProfile.status).toLowerCase() === 'active' ? 'active' : 'inactive'}`} style={{ margin: 0 }}>
                              {viewingProfile.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Class Grade / Standard</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.standard || 'Class ID: ' + (viewingProfile.standardId || 'Unassigned')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Section / Division</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.divisionName || 'Division ID: ' + (viewingProfile.divisionId || 'Unassigned')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Roll call roll No.</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.rollNumber || 'Unassigned'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Admission Date</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.admissionDate ? new Date(viewingProfile.admissionDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not provided'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Group 3: Parent details */}
                      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', margin: '0 0 1rem 0' }}>
                          <BiIdCard style={{ color: '#f59e0b', fontSize: '1.2rem' }} /> Parent & Guardian Particulars
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div style={{ display: 'grid', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Guardian Name</span>
                              <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.guardianName || 'Not specified'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '4px' }}>
                              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Emergency Contact</span>
                              <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.parentMobileNumber || 'Not specified'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Emergency Correspondence Email</span>
                            <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>{viewingProfile.parentEmailId || 'None registered'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Group 4: Billing Details */}
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
                    </>
                  )}

                </div>

                {/* Footer */}
                <div className="bg-light padding-1 flex-end gap-1 border-top" style={{ padding: '1.25rem 2rem', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => setViewingProfile(null)} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer', transition: '0.2s' }}>Close</button>
                  <button className="btn btn-primary" onClick={() => { setViewingProfile(null); handleEditClick(viewingProfile); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 600, background: viewingProfile.userType === 'teacher' ? '#0d9488' : '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: viewingProfile.userType === 'teacher' ? '0 4px 6px -1px rgba(13, 148, 136, 0.2)' : '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>Edit Status</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .user-management-page { animation: fadeIn 0.5s ease; }
        .search-box { position: relative; width: 300px; }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-gray); }
        .search-box input { width: 100%; padding: 0.6rem 0.6rem 0.6rem 2.5rem; border: 1px solid var(--border-light); border-radius: 0.5rem; }
        
        .badge { padding: 0.3rem 0.8rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 500; }
        .badge-admin { background: #e3f2fd; color: #1976d2; }
        .badge-teacher { background: #f3e5f5; color: #7b1fa2; }
        .badge-student { background: #e8f5e9; color: #388e3c; }
        .badge-owner { background: #fff3e0; color: #f57c00; }

        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
        .status-dot.online { background: #4caf50; }
        .status-dot.offline { background: #ef5350; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-group label { font-weight: 600; font-size: 0.85rem; }
        .form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: 0.9rem; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93,95,239,0.12); outline: none; }

        .form-control[readonly], .form-control:disabled {
          background-color: #f8fafc !important;
          color: #64748b !important;
          border-color: #e2e8f0 !important;
          cursor: not-allowed !important;
          opacity: 0.85;
        }

        .um-loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 3rem; color: var(--text-muted); font-size: 0.95rem; }
        .um-spinner { animation: spin 1s linear infinite; font-size: 1.2rem; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .um-toast { position: fixed; top: 20px; right: 20px; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; z-index: 2000; display: flex; align-items: center; gap: 0.5rem; animation: slideInRight 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .um-toast.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .um-toast.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default UserManagement;
