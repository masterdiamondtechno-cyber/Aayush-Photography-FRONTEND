import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import { BiSearchAlt, BiBuildings, BiCheck, BiX, BiMap, BiUser, BiPhone, BiEnvelope, BiGroup, BiLoader } from 'react-icons/bi';
import { getOwnerSchools, getOwnerSchoolStats } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const AyushyachiInstitute = () => {
  const ownerId = getAuthValue('ownerId');

  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState({ totalSchools: 0, activeSchools: 0, totalStudents: 0, totalTeachers: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingSchool, setViewingSchool] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSchools = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const payload = { ownerId, page, size: 10 };
      if (filterStatus) payload.status = filterStatus;
      if (searchTerm) payload.search = searchTerm;

      const res = await getOwnerSchools(payload);
      const data = res?.data || res;
      if (data?.data) {
        setSchools(data.data);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setSchools(data);
      } else {
        setSchools([]);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, page, filterStatus, searchTerm]);

  const fetchStats = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await getOwnerSchoolStats({ ownerId });
      setStats(res?.data || res || {});
    } catch (err) {
      console.error('Failed to fetch school stats:', err);
    }
  }, [ownerId]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="owner-schools-page space-y-8">
      {/* Header */}
      <div className="header-section flex-between">
        <div>
          <h1>Schools</h1>
          <p className="breadcrumb">Owner Panel &gt; Schools Management</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <StatCard title="Total Schools" count={stats.totalSchools || 0} icon={BiBuildings} color="#5d5fef" />
        <StatCard title="Active Schools" count={stats.activeSchools || 0} icon={BiCheck} color="#10b981" />
        <StatCard title="Total Students" count={(stats.totalStudents || 0).toLocaleString()} icon={BiGroup} color="#f59e0b" />
        <StatCard title="Total Teachers" count={stats.totalTeachers || 0} icon={BiUser} color="#0ea5e9" />
      </div>

      {/* Table Card */}
      <div className="card shadow-sm" style={{ marginTop: '2rem', padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex-center gap-1">
              <select className="form-control" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} style={{ width: '150px' }}>
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                Showing <strong>{schools.length}</strong> schools
              </div>
            </div>
            <div className="search-box">
              <BiSearchAlt className="input-icon" />
              <input type="text" placeholder="Search school, city..." className="form-control" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setPage(0); fetchSchools(); } }}
                style={{ paddingLeft: '2.5rem', width: '300px' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <BiLoader size={32} className="spin" style={{ color: 'var(--primary)' }} />
              <p className="text-muted" style={{ marginTop: '1rem' }}>Loading schools...</p>
            </div>
          ) : (
            <DataTable
              headers={['ID', 'School Name', 'District', 'Students', 'Teachers', 'Revenue', 'Status', 'Actions']}
              data={schools}
              renderRow={(school) => (
                <tr key={school.schoolId}>
                  <td className="font-bold">#{school.schoolId}</td>
                  <td>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #5d5fef, #7000ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                        {(school.schoolName || 'S').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold">{school.schoolName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{school.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <BiMap style={{ color: 'var(--text-muted)' }} /> {school.district || school.state || '-'}
                    </div>
                  </td>
                  <td><strong>{school.studentCount || 0}</strong></td>
                  <td><strong>{school.teacherCount || 0}</strong></td>
                  <td><strong style={{ color: 'var(--primary)' }}>₹{(school.totalRevenue || 0).toLocaleString()}</strong></td>
                  <td>
                    <span className={`status-badge ${(school.schoolStatus || 'active').toLowerCase()}`}>
                      {school.schoolStatus || school.subscriptionStatus || '-'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" title="View" onClick={() => setViewingSchool(school)}><BiBuildings /></button>
                  </td>
                </tr>
              )}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-center gap-1" style={{ justifyContent: 'center', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
            <span className="text-sm text-muted">Page {page + 1} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* View School Modal */}
      {viewingSchool && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-700 no-padding overflow-hidden">
            <div className="padding-2 text-white" style={{ background: 'linear-gradient(135deg, #5d5fef, #7000ff)' }}>
              <div className="flex-between">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700 }}>
                    {(viewingSchool.schoolName || 'S').charAt(0)}
                  </div>
                  <div>
                    <h2 className="mb-0 text-white">{viewingSchool.schoolName}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>{viewingSchool.district || ''} | {viewingSchool.state || ''}</p>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setViewingSchool(null)} style={{ fontSize: '2rem', color: 'white', background: 'rgba(255,255,255,0.15)' }}>&times;</button>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ flex: 1, padding: '1.2rem', textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{viewingSchool.studentCount || 0}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Students</div>
              </div>
              <div style={{ flex: 1, padding: '1.2rem', textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{viewingSchool.teacherCount || 0}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Teachers</div>
              </div>
              <div style={{ flex: 1, padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: viewingSchool.schoolStatus === 'ACTIVE' ? '#10b981' : '#ef4444' }}>{viewingSchool.schoolStatus || '-'}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Status</div>
              </div>
            </div>

            <div className="padding-2 grid grid-2 gap-2">
              <div className="info-group">
                <h4 className="border-bottom pb-05 mb-1">School Details</h4>
                <p><BiEnvelope style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /><strong>Email:</strong> {viewingSchool.email || '-'}</p>
                <p><BiPhone style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /><strong>Phone:</strong> {viewingSchool.phoneNo || '-'}</p>
                <p><strong>Created:</strong> {viewingSchool.createdAt ? new Date(viewingSchool.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div className="info-group">
                <h4 className="border-bottom pb-05 mb-1">Financial</h4>
                <p><strong>Total Revenue:</strong> ₹{(viewingSchool.totalRevenue || 0).toLocaleString()}</p>
                <p><strong>Subscription:</strong> {viewingSchool.subscriptionStatus || '-'}</p>
              </div>
            </div>

            <div className="bg-light padding-1 flex-end gap-1">
              <button className="btn btn-outline" onClick={() => setViewingSchool(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .owner-schools-page { animation: fadeIn 0.5s ease; }
        .status-badge { padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }
        .status-badge.active { background: #e8f5e9; color: #388e3c; }
        .status-badge.inactive { background: #fff3e0; color: #e65100; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; }
        .max-w-700 { width: 100%; max-width: 700px; }
        .no-padding { padding: 0 !important; }
        .overflow-hidden { overflow: hidden; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .gap-1 { gap: 1rem; }
        .gap-2 { gap: 1.5rem; }
        .flex-end { display: flex; justify-content: flex-end; }
        .padding-1 { padding: 1rem; }
        .padding-2 { padding: 2rem; }
        .bg-light { background: #f8fafc; }
        .text-white { color: white; }
        .mb-0 { margin-bottom: 0; }
        .pb-05 { padding-bottom: 0.5rem; }
        .mb-1 { margin-bottom: 1rem; }
        .btn-outline { background: white; border: 1px solid var(--border-light); color: var(--text-main); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.2s; }
        .btn-outline:hover { background: #f1f5f9; }
        .btn-sm { font-size: 0.85rem; padding: 0.4rem 0.8rem; }
        .info-group p { margin-bottom: 0.6rem; font-size: 0.9rem; color: #475569; display: flex; align-items: center; }
        .info-group p strong { color: #1e293b; margin-right: 0.3rem; }
        .form-control { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid var(--border-light); border-radius: 8px; font-size: 0.9rem; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93,95,239,0.15); outline: none; }
        .search-box { position: relative; }
        .search-box .input-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 0.4rem; border-radius: 6px; font-size: 1.1rem; color: var(--text-muted); transition: 0.2s; }
        .btn-icon:hover { background: rgba(93,95,239,0.1); color: var(--primary); }
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default AyushyachiInstitute;
