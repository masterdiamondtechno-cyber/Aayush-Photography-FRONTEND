import { useState, useEffect, useCallback } from 'react';
import { BiBuildingHouse, BiGroup, BiTrendingUp, BiWallet, BiLoader, BiError } from 'react-icons/bi';
import { getOwnerDashboard } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const OwnerDashboard = () => {
  const ownerId = getAuthValue('ownerId');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  const fetchDashboard = useCallback(async () => {
    if (!ownerId) { setError('Owner ID not found. Please log in again.'); setLoading(false); return; }
    try {
      setLoading(true);
      const res = await getOwnerDashboard({ ownerId, year: filterYear, month: filterMonth });
      setDashboard(res?.data || res);
      setError('');
    } catch (err) {
      console.error('Failed to fetch owner dashboard:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [ownerId, filterYear, filterMonth]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="dashboard-page animation-fade-in space-y-8" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <BiLoader size={40} className="spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page animation-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <BiError size={40} />
          <p style={{ marginTop: '1rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboard} style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      </div>
    );
  }

  const d = dashboard || {};

  return (
    <div className="dashboard-page animation-fade-in">
      <div className="flex-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Franchise Overview</h1>
        <div className="flex-center gap-1">
          <select className="form-control" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ width: '110px' }}>
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-control" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={{ width: '130px' }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div>
            <p className="text-muted text-sm font-bold">Total Branches</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{d.totalBranches || 0}</h2>
          </div>
          <div className="icon-box-premium" style={{ opacity: 0.8 }}><BiBuildingHouse size={28} color="#fff" /></div>
        </div>
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid #10b981' }}>
          <div>
            <p className="text-muted text-sm font-bold">Total Students</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{(d.totalStudents || 0).toLocaleString()}</h2>
          </div>
          <div className="icon-box-premium" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', opacity: 0.8 }}><BiGroup size={28} color="#fff" /></div>
        </div>
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div>
            <p className="text-muted text-sm font-bold">Total Revenue</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>₹{((d.totalRevenue || 0) / 100000).toFixed(1)}L</h2>
          </div>
          <div className="icon-box-premium" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', opacity: 0.8 }}><BiWallet size={28} color="#fff" /></div>
        </div>
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid #6366f1' }}>
          <div>
            <p className="text-muted text-sm font-bold">Growth Rate</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>
              {d.growthRate >= 0 ? '+' : ''}{d.growthRate || 0}%
            </h2>
          </div>
          <div className="icon-box-premium" style={{ opacity: 0.8 }}><BiTrendingUp size={28} color="#fff" /></div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Performance Matrix */}
        <div className="card shadow-sm padding-1-5">
          <h3 className="mb-1 border-bottom pb-1" style={{ color: 'var(--text-dark)' }}>Branch Performance Matrix</h3>
          {(d.performanceMatrix || []).length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>School</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {d.performanceMatrix.map((pm, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{pm.schoolName}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{pm.studentCount || 0}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <span style={{ color: (pm.attendancePct || 0) >= 80 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                          {pm.attendancePct || 0}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>₹{(pm.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-center p-3 text-muted" style={{ background: '#f8fafc', borderRadius: '1rem', height: '200px' }}>
              No performance data available
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card shadow-sm padding-1-5">
          <h3 className="mb-1 border-bottom pb-1" style={{ color: 'var(--text-dark)' }}>Recent Alerts</h3>
          {(d.recentAlerts || []).length > 0 ? (
            <ul className="grid gap-1 mt-1" style={{ listStyle: 'none', padding: 0 }}>
              {d.recentAlerts.map((alert, i) => (
                <li key={i} className="flex-center gap-1 text-sm p-1" style={{
                  background: alert.type === 'LOW_ATTENDANCE' ? '#fee2e2' : '#dcfce7',
                  color: alert.type === 'LOW_ATTENDANCE' ? '#b91c1c' : '#15803d',
                  borderRadius: '0.5rem', padding: '0.75rem'
                }}>
                  <strong>{alert.schoolName}:</strong> {alert.message}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-center p-3 text-muted" style={{ background: '#f8fafc', borderRadius: '1rem', height: '200px' }}>
              No active alerts
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .form-control{padding:.6rem .9rem;border:1.5px solid var(--border-light);border-radius:8px;font-size:.9rem}
        .form-control:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px rgba(93,95,239,.15)}
      `}</style>
    </div>
  );
};

export default OwnerDashboard;
