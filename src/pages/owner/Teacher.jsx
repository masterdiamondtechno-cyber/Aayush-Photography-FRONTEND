import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import {
  BiSearchAlt, BiUser, BiUserVoice, BiCheckCircle,
  BiTimeFive, BiWallet, BiBuildings, BiLoader, BiPhone, BiEnvelope, BiCalendar
} from 'react-icons/bi';
import { getOwnerTeachers, getOwnerSchools, getOwnerTeacherStats } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

/**
 * Owner — Teachers Page
 * Displays all teachers across all of the owner's school branches.
 *
 * Fixed field mappings (OwnerTeacherDTO):
 *   teacherId, teacherName, emailId, mobileNumber,
 *   status, monthlySalary, joiningDate, gender, schoolId, schoolName
 */
const Teacher = () => {
  const ownerId = getAuthValue('ownerId');

  const [teachers, setTeachers]         = useState([]);
  const [schools, setSchools]           = useState([]);
  const [stats, setStats]               = useState({ totalTeachers: 0, activeTeachers: 0, onLeaveTeachers: 0, avgSalary: 0 });
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalCount, setTotalCount]     = useState(0);

  // ─── Fetch Schools for dropdown ──────────────────────────────────────────
  const fetchSchools = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res  = await getOwnerSchools({ ownerId, page: 0, size: 100 });
      const data = res?.data?.data || res?.data || [];
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  }, [ownerId]);

  // ─── Fetch global stats (calls new /owner/teachers/stats endpoint) ────────
  const fetchStats = useCallback(async () => {
    if (!ownerId) return;
    setStatsLoading(true);
    try {
      const res  = await getOwnerTeacherStats({ ownerId });
      const data = res?.data || {};
      setStats({
        totalTeachers:   data.totalTeachers   ?? 0,
        activeTeachers:  data.activeTeachers  ?? 0,
        onLeaveTeachers: data.onLeaveTeachers ?? 0,
        avgSalary:       data.avgSalary       ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch teacher stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [ownerId]);

  // ─── Fetch Teachers list (paginated + filtered) ───────────────────────────
  const fetchTeachers = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const payload = {
        ownerId,
        page,
        size: 10,
        search:   searchTerm   || undefined,
        schoolId: selectedSchool || undefined,
        status:   selectedStatus || undefined,
      };
      const res  = await getOwnerTeachers(payload);
      const data = res?.data || {};

      if (data?.data) {
        setTeachers(data.data);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalElements ?? data.data.length);
      } else {
        const list = Array.isArray(data) ? data : [];
        setTeachers(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, page, searchTerm, selectedSchool, selectedStatus]);

  useEffect(() => { fetchSchools(); fetchStats(); }, [fetchSchools, fetchStats]);
  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setPage(0); };
  const handleSchoolChange = (e) => { setSelectedSchool(e.target.value); setPage(0); };
  const handleStatusChange = (e) => { setSelectedStatus(e.target.value); setPage(0); };

  // ─── Format salary (stored as String in DB) ───────────────────────────────
  const formatSalary = (monthlySalary) => {
    const val = parseFloat(monthlySalary);
    return isNaN(val) ? '—' : `₹${val.toLocaleString('en-IN')}`;
  };

  // ─── Status badge styling ─────────────────────────────────────────────────
  const getStatusClass = (status = '') => {
    const s = status.toLowerCase().replace(/[_ ]/g, '-');
    return `status-badge ${s}`;
  };

  return (
    <div className="owner-teachers-page space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="header-section flex-between" style={{ marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>
            Teachers
          </h1>
          <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Owner Panel &gt; All Teachers
          </p>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1.75rem' }}
      >
        <StatCard
          title="Total Teachers"
          count={statsLoading ? '…' : stats.totalTeachers}
          icon={BiUserVoice}
          color="#5d5fef"
        />
        <StatCard
          title="Active Teachers"
          count={statsLoading ? '…' : stats.activeTeachers}
          icon={BiCheckCircle}
          color="#10b981"
        />
        <StatCard
          title="On Leave"
          count={statsLoading ? '…' : stats.onLeaveTeachers}
          icon={BiTimeFive}
          color="#f59e0b"
        />
        <StatCard
          title="Avg. Monthly Salary"
          count={statsLoading ? '…' : formatSalary(stats.avgSalary)}
          icon={BiWallet}
          color="#0ea5e9"
        />
      </div>

      {/* ── Main Table Card ─────────────────────────────────────────────── */}
      <div className="card shadow-sm" style={{ marginTop: '2rem', padding: 0 }}>

        {/* Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>

            {/* Left: school + status filters */}
            <div className="flex-center" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={selectedSchool}
                onChange={handleSchoolChange}
                style={{ width: '220px' }}
              >
                <option value="">All Schools</option>
                {schools.map(s => (
                  <option key={s.schoolId} value={s.schoolId}>{s.schoolName}</option>
                ))}
              </select>

              <select
                className="form-control"
                value={selectedStatus}
                onChange={handleStatusChange}
                style={{ width: '160px' }}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>

              <span className="text-muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {loading ? 'Loading…' : <><strong>{totalCount}</strong> teacher{totalCount !== 1 ? 's' : ''}</>}
              </span>
            </div>

            {/* Right: search */}
            <div className="search-box">
              <BiSearchAlt className="input-icon" />
              <input
                type="text"
                placeholder="Search name, email, phone…"
                className="form-control"
                value={searchTerm}
                onChange={handleSearch}
                style={{ paddingLeft: '2.4rem', width: '260px' }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <BiLoader size={32} className="spin" style={{ color: 'var(--primary)' }} />
              <p className="text-muted" style={{ marginTop: '1rem' }}>Loading teachers…</p>
            </div>
          ) : teachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <BiUserVoice size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <p className="text-muted" style={{ marginTop: '1rem' }}>No teachers found for the selected filters.</p>
            </div>
          ) : (
            <DataTable
              headers={['ID', 'Teacher', 'School', 'Phone', 'Salary', 'Status', 'Action']}
              data={teachers}
              renderRow={(teacher) => (
                <tr key={teacher.teacherId}>
                  <td className="font-bold" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    #{teacher.teacherId}
                  </td>

                  {/* Teacher name + email */}
                  <td>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.teacherName || 'T')}&background=6366f1&color=fff`}
                        alt=""
                        style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }}
                      />
                      <div>
                        <div className="font-bold" style={{ fontSize: '0.9rem' }}>{teacher.teacherName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{teacher.emailId}</div>
                      </div>
                    </div>
                  </td>

                  {/* School */}
                  <td>
                    <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <BiBuildings style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem' }}>{teacher.schoolName}</span>
                    </div>
                  </td>

                  {/* Phone (replaces non-existent Subject column) */}
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {teacher.mobileNumber || '—'}
                  </td>

                  {/* Salary (monthlySalary is a String in the DB) */}
                  <td className="font-bold" style={{ fontSize: '0.88rem' }}>
                    {formatSalary(teacher.monthlySalary)}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={getStatusClass(teacher.status)}>
                      {teacher.status || 'Active'}
                    </span>
                  </td>

                  {/* Action */}
                  <td>
                    <button
                      className="btn-icon"
                      title="View Profile"
                      onClick={() => setViewingProfile(teacher)}
                    >
                      <BiUser />
                    </button>
                  </td>
                </tr>
              )}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex-center gap-1"
            style={{ justifyContent: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}
          >
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-muted">Page {page + 1} of {totalPages}</span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── View Profile Modal ─────────────────────────────────────────── */}
      {viewingProfile && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewingProfile(null)}>
          <div className="modal-content card max-w-700 no-padding overflow-hidden">

            {/* Modal Header */}
            <div className="padding-2 text-white" style={{ background: 'linear-gradient(135deg, #5d5fef, #7c3aed)' }}>
              <div className="flex-between">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(viewingProfile.teacherName || 'T')}&size=128&background=fff&color=5d5fef`}
                    alt=""
                    style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid white', flexShrink: 0 }}
                  />
                  <div>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>
                      {viewingProfile.teacherName}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
                      {viewingProfile.gender || 'Teacher'} &bull; {viewingProfile.schoolName}
                    </p>
                    <span className={`status-badge ${(viewingProfile.status || '').toLowerCase().replace(/[_ ]/g, '-')}`}
                      style={{ marginTop: '0.5rem', display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                      {viewingProfile.status || 'Active'}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={() => setViewingProfile(null)}
                  style={{ fontSize: '1.5rem', color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 36, height: 36 }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

              {/* Personal Details */}
              <div className="info-group">
                <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Personal Details
                </h4>
                <div className="info-row">
                  <BiEnvelope className="info-icon" />
                  <div>
                    <div className="info-label">Email</div>
                    <div className="info-value">{viewingProfile.emailId || '—'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <BiPhone className="info-icon" />
                  <div>
                    <div className="info-label">Phone</div>
                    <div className="info-value">{viewingProfile.mobileNumber || '—'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <BiUser className="info-icon" />
                  <div>
                    <div className="info-label">Gender</div>
                    <div className="info-value">{viewingProfile.gender || '—'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <BiCalendar className="info-icon" />
                  <div>
                    <div className="info-label">Joining Date</div>
                    <div className="info-value">
                      {viewingProfile.joiningDate
                        ? new Date(viewingProfile.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="info-group">
                <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Employment Details
                </h4>
                <div className="info-row">
                  <BiBuildings className="info-icon" />
                  <div>
                    <div className="info-label">Branch / School</div>
                    <div className="info-value">{viewingProfile.schoolName || '—'}</div>
                  </div>
                </div>
                <div className="info-row">
                  <BiWallet className="info-icon" />
                  <div>
                    <div className="info-label">Monthly Salary</div>
                    <div className="info-value" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {formatSalary(viewingProfile.monthlySalary)}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <BiCheckCircle className="info-icon" />
                  <div>
                    <div className="info-label">Status</div>
                    <div>
                      <span className={getStatusClass(viewingProfile.status)}>
                        {viewingProfile.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <BiUserVoice className="info-icon" />
                  <div>
                    <div className="info-label">Teacher ID</div>
                    <div className="info-value">#{viewingProfile.teacherId}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-outline" onClick={() => setViewingProfile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scoped Styles ──────────────────────────────────────────────── */}
      <style>{`
        .owner-teachers-page { animation: fadeIn 0.4s ease; }

        /* Status badges */
        .status-badge {
          display: inline-block;
          padding: 0.2rem 0.65rem;
          border-radius: 1rem;
          font-size: 0.74rem;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }
        .status-badge.active   { background: #dcfce7; color: #16a34a; }
        .status-badge.inactive { background: #fee2e2; color: #dc2626; }
        .status-badge.on-leave { background: #fef3c7; color: #d97706; }

        /* Table gaps */
        .gap-2 { gap: 0.75rem; }

        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s ease;
          padding: 1rem;
        }
        .max-w-700 { width: 100%; max-width: 700px; }
        .no-padding { padding: 0 !important; }
        .overflow-hidden { overflow: hidden; }
        .padding-2 { padding: 1.75rem 2rem; }
        .text-white { color: white; }

        /* Info rows inside modal */
        .info-row {
          display: flex; align-items: flex-start; gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .info-icon { font-size: 1.1rem; color: var(--primary); margin-top: 0.15rem; flex-shrink: 0; }
        .info-label { font-size: 0.73rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.1rem; }
        .info-value { font-size: 0.9rem; color: var(--text-dark); font-weight: 500; word-break: break-all; }

        /* Search box */
        .search-box { position: relative; }
        .search-box .input-icon {
          position: absolute; left: 0.8rem; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); font-size: 1.05rem; pointer-events: none;
        }

        /* Controls */
        .form-control {
          padding: 0.6rem 0.85rem;
          border: 1.5px solid var(--border-light);
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: white;
          color: var(--text-dark);
        }
        .form-control:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(93,95,239,0.12);
          outline: none;
        }

        .btn-outline {
          background: white; border: 1.5px solid var(--border-light);
          color: var(--text-main); padding: 0.55rem 1.2rem;
          border-radius: 8px; cursor: pointer; font-weight: 500;
          transition: background 0.2s;
        }
        .btn-outline:hover { background: #f1f5f9; }
        .btn-sm { font-size: 0.82rem; padding: 0.4rem 0.8rem; }

        .btn-icon {
          background: none; border: none; cursor: pointer;
          padding: 0.4rem; border-radius: 6px;
          font-size: 1.1rem; color: var(--text-muted);
          transition: background 0.2s, color 0.2s;
        }
        .btn-icon:hover { background: rgba(93,95,239,0.1); color: var(--primary); }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Teacher;
