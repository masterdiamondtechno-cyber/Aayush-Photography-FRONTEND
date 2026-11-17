import { useState, useEffect, useCallback } from 'react';
import StatCard from '../../components/common/StatCard';
import { 
  BiWallet, 
  BiTrendingUp, 
  BiReceipt, 
  BiBarChartAlt2, 
  BiDownload, 
  BiBuildings, 
  BiGroup, 
  BiCalendar, 
  BiLoader,
  BiTrendingDown,
  BiCreditCard
} from 'react-icons/bi';
import { 
  getOwnerReportRevenue, 
  getOwnerReportAttendance, 
  getOwnerReportEnrollments, 
  getOwnerReportFees,
  getOwnerSchools,
  getOwnerFinanceSummary
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';

/**
 * Owner — Reports Page (Fully Integrated)
 */

const Report = () => {
  const ownerId = getAuthValue('ownerId');
  
  const [activeTab, setActiveTab] = useState('revenue');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  // Dynamic filters
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('All');
  
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, pendingAmount: 0, transactionCount: 0 });
  const [tabData, setTabData] = useState([]);

  // Date converter helper
  const buildDateRange = useCallback((year, month) => {
    if (month === 'All') {
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    }
    const months = {
      January: '01', February: '02', March: '03', April: '04',
      May: '05', June: '06', July: '07', August: '08',
      September: '09', October: '10', November: '11', December: '12'
    };
    const mm = months[month];
    const lastDay = new Date(parseInt(year, 10), parseInt(mm, 10), 0).getDate();
    const dd = String(lastDay).padStart(2, '0');
    return { startDate: `${year}-${mm}-01`, endDate: `${year}-${mm}-${dd}` };
  }, []);

  // Fetch school list for filter
  useEffect(() => {
    const fetchSchools = async () => {
      if (!ownerId) return;
      try {
        const res = await getOwnerSchools({ ownerId, page: 0, size: 100 });
        setSchools(res?.data?.content || res?.data || []);
      } catch (err) {
        console.error('Failed to fetch school list:', err);
      }
    };
    fetchSchools();
  }, [ownerId]);

  // Fetch Financial KPI Summary
  const fetchSummary = useCallback(async () => {
    if (!ownerId) return;
    try {
      setSummaryLoading(true);
      const { startDate, endDate } = buildDateRange(selectedYear, selectedMonth);
      const payload = { 
        ownerId, 
        startDate, 
        endDate,
        schoolId: selectedSchoolId === 'All' ? null : parseInt(selectedSchoolId, 10)
      };
      
      const res = await getOwnerFinanceSummary(payload);
      setSummary(res?.data || { totalBilled: 0, totalCollected: 0, pendingAmount: 0, transactionCount: 0 });
    } catch (err) {
      console.error('Failed to fetch report finance summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [ownerId, selectedYear, selectedMonth, selectedSchoolId, buildDateRange]);

  // Fetch Tab-Specific Report Data
  const fetchTabData = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const { startDate, endDate } = buildDateRange(selectedYear, selectedMonth);
      const groupBy = selectedMonth === 'All' ? 'month' : 'day';
      
      const payload = { 
        ownerId, 
        startDate, 
        endDate, 
        schoolId: selectedSchoolId === 'All' ? null : parseInt(selectedSchoolId, 10),
        groupBy 
      };
      
      let res;
      switch (activeTab) {
        case 'revenue':
          res = await getOwnerReportRevenue(payload);
          break;
        case 'attendance':
          res = await getOwnerReportAttendance(payload);
          break;
        case 'enrollment':
          res = await getOwnerReportEnrollments(payload);
          break;
        case 'fee':
          res = await getOwnerReportFees(payload);
          break;
        default:
          res = { data: { data: [] } };
      }
      
      // Backend returns OwnerReportDTO which contains 'data'
      setTabData(res?.data?.data || []);
    } catch (err) {
      console.error(`Failed to fetch ${activeTab} data:`, err);
      setTabData([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, activeTab, selectedYear, selectedMonth, selectedSchoolId, buildDateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  const tabs = [
    { key: 'revenue', label: 'Revenue Trend', icon: BiWallet },
    { key: 'attendance', label: 'Attendance Analysis', icon: BiCalendar },
    { key: 'enrollment', label: 'Enrollment Growth', icon: BiGroup },
    { key: 'fee', label: 'Fee Channels', icon: BiReceipt },
  ];

  const formatCurrency = (amt) => `₹${(amt || 0).toLocaleString('en-IN')}`;

  const formatPeriod = (periodStr) => {
    if (!periodStr) return '';
    try {
      const dateParts = periodStr.split('T')[0].split('-');
      const year = dateParts[0];
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const day = dateParts[2];
      
      const d = new Date(year, monthIndex, day || 1);
      if (selectedMonth === 'All') {
        return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      } else {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      return periodStr;
    }
  };

  const collectionRate = summary.totalBilled > 0 
    ? Math.round((summary.totalCollected / summary.totalBilled) * 100) 
    : 0;

  return (
    <div className="owner-reports-page space-y-8">
      {/* Header */}
      <div className="header-section flex-between">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="breadcrumb">Owner Panel &gt; Reports</p>
        </div>
        <button className="btn btn-primary flex-center gap-1" style={{ padding: '0.6rem 1.2rem', gap: '0.5rem' }}>
          <BiDownload /> Export Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <StatCard 
          title="Total Billed" 
          count={summaryLoading ? '...' : formatCurrency(summary.totalBilled)} 
          icon={BiReceipt} 
          color="#5d5fef" 
        />
        <StatCard 
          title="Total Collected (Revenue)" 
          count={summaryLoading ? '...' : formatCurrency(summary.totalCollected)} 
          icon={BiTrendingUp} 
          color="#10b981" 
        />
        <StatCard 
          title="Pending Collection" 
          count={summaryLoading ? '...' : formatCurrency(summary.pendingAmount)} 
          icon={BiTrendingDown} 
          color="#ef4444" 
        />
        <StatCard 
          title="Collection Rate" 
          count={summaryLoading ? '...' : `${collectionRate}%`} 
          icon={BiBarChartAlt2} 
          color="#f59e0b" 
        />
      </div>

      {/* Main Card with Tabs */}
      <div className="card shadow-sm" style={{ marginTop: '2rem', padding: 0 }}>
        {/* Tab Bar */}
        <div className="tabs-bar" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`report-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon style={{ fontSize: '1.1rem' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-light)', background: '#fafbfc' }}>
          <div className="flex-center gap-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="filter-group">
              <label className="filter-label">School Branch</label>
              <select 
                className="form-control" 
                value={selectedSchoolId} 
                onChange={(e) => setSelectedSchoolId(e.target.value)} 
                style={{ width: '200px' }}
              >
                <option value="All">All Branches</option>
                {schools.map(school => (
                  <option key={school.schoolId} value={school.schoolId}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Year</label>
              <select className="form-control" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: '110px' }}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Month</label>
              <select className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '140px' }}>
                <option value="All">All Months</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
              <BiLoader size={36} className="spin" style={{ color: 'var(--primary)' }} />
              <p className="text-muted" style={{ marginTop: '1rem', fontWeight: 500 }}>Syncing reports dataset...</p>
            </div>
          ) : (
            <>
              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div className="report-table-wrap">
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Revenue Breakdown over Time</h3>
                    <span className="badge-aggregate">
                      Total Collected: {formatCurrency(tabData.reduce((s, r) => s + (r.revenue || 0), 0))}
                    </span>
                  </div>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Reporting Period</th>
                          <th>Collected Revenue</th>
                          <th>Transactions Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.length > 0 ? tabData.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                <BiCalendar style={{ color: 'var(--primary)', fontSize: '1.1rem' }} /> 
                                <strong>{formatPeriod(row.period)}</strong>
                              </div>
                            </td>
                            <td className="text-success font-semibold">{formatCurrency(row.revenue)}</td>
                            <td>{row.transactions || 0}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" className="no-data-cell">No revenue trends found for selected period</td></tr>
                        )}
                      </tbody>
                      {tabData.length > 0 && (
                        <tfoot>
                          <tr className="total-row">
                            <td>Total</td>
                            <td className="text-success">{formatCurrency(tabData.reduce((s, r) => s + (r.revenue || 0), 0))}</td>
                            <td>{tabData.reduce((s, r) => s + (r.transactions || 0), 0)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div className="report-table-wrap">
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Attendance Trend & Consistency</h3>
                    {tabData.length > 0 && (
                      <span className="badge-aggregate">
                        Average: {Math.round(tabData.reduce((s, r) => s + (r.attendancePct || 0), 0) / tabData.length)}%
                      </span>
                    )}
                  </div>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Reporting Period</th>
                          <th>Total Records Checked</th>
                          <th>Present Count</th>
                          <th>Attendance Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.length > 0 ? tabData.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                <BiCalendar style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                                <strong>{formatPeriod(row.period)}</strong>
                              </div>
                            </td>
                            <td>{(row.totalRecords || 0).toLocaleString()}</td>
                            <td className="text-success">{(row.presentCount || 0).toLocaleString()}</td>
                            <td>
                              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                <div className="progress-bar-mini">
                                  <div 
                                    className="progress-fill" 
                                    style={{ 
                                      width: `${row.attendancePct || 0}%`, 
                                      background: (row.attendancePct || 0) >= 90 ? '#10b981' : (row.attendancePct || 0) >= 75 ? '#f59e0b' : '#ef4444' 
                                    }}
                                  />
                                </div>
                                <span className="font-semibold">{row.attendancePct || 0}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-dot ${(row.attendancePct || 0) >= 90 ? 'good' : (row.attendancePct || 0) >= 75 ? 'avg' : 'poor'}`}>
                                {(row.attendancePct || 0) >= 90 ? 'Excellent' : (row.attendancePct || 0) >= 75 ? 'Consistent' : 'Low'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" className="no-data-cell">No attendance records found for selected period</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Enrollment Tab */}
              {activeTab === 'enrollment' && (
                <div className="report-table-wrap">
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Student Admissions Growth</h3>
                    <span className="badge-aggregate">
                      Total New Enrollments: {tabData.reduce((s, r) => s + (r.enrollments || 0), 0)}
                    </span>
                  </div>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Reporting Period</th>
                          <th>New Admissions</th>
                          <th>Growth Metrics</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.length > 0 ? tabData.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                <BiCalendar style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                                <strong>{formatPeriod(row.period)}</strong>
                              </div>
                            </td>
                            <td className="text-success font-semibold">+{row.enrollments || 0}</td>
                            <td>
                              <div className="trend-bar">
                                <div className="trend-fill" style={{ width: `${Math.min((row.enrollments || 0) * 12, 120)}px`, background: 'linear-gradient(90deg, #5d5fef, #10b981)' }}></div>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" className="no-data-cell">No enrollment metrics logged for selected period</td></tr>
                        )}
                      </tbody>
                      {tabData.length > 0 && (
                        <tfoot>
                          <tr className="total-row">
                            <td>Total</td>
                            <td className="text-success">+{tabData.reduce((s, r) => s + (r.enrollments || 0), 0)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* Fee Collection Tab */}
              {activeTab === 'fee' && (
                <div className="report-table-wrap">
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Fee Receipts breakdown by Channel</h3>
                    <span className="badge-aggregate">
                      Total Collected: {formatCurrency(tabData.reduce((s, r) => s + (r.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Reporting Period</th>
                          <th>Payment Method</th>
                          <th>Amount Collected</th>
                          <th>Transactions Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabData.length > 0 ? tabData.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                <BiCalendar style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                                <strong>{formatPeriod(row.period)}</strong>
                              </div>
                            </td>
                            <td>
                              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', gap: '0.4rem' }}>
                                <BiCreditCard style={{ color: 'var(--text-muted)' }} />
                                <span className="payment-badge">{row.paymentMode || 'UNKNOWN'}</span>
                              </div>
                            </td>
                            <td className="text-success font-semibold">{formatCurrency(row.amount)}</td>
                            <td>{row.count || 0}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan="4" className="no-data-cell">No fee channel records logged for selected period</td></tr>
                        )}
                      </tbody>
                      {tabData.length > 0 && (
                        <tfoot>
                          <tr className="total-row">
                            <td>Total</td>
                            <td></td>
                            <td className="text-success">{formatCurrency(tabData.reduce((s, r) => s + (r.amount || 0), 0))}</td>
                            <td>{tabData.reduce((s, r) => s + (r.count || 0), 0)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .owner-reports-page { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
        .filter-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }

        .report-tab {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 1.1rem 1.8rem; font-weight: 600; font-size: 0.9rem;
          color: var(--text-muted); background: none;
          border: none; border-bottom: 2px solid transparent;
          cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
        }
        .report-tab.active {
          color: var(--primary); border-bottom-color: var(--primary);
          background: rgba(93, 95, 239, 0.04);
        }
        .report-tab:hover { color: var(--primary); background: rgba(93, 95, 239, 0.02); }

        .report-table { width: 100%; border-collapse: collapse; }
        .report-table th {
          text-align: left; padding: 1rem 1.2rem; font-size: 0.8rem;
          text-transform: uppercase; letter-spacing: 0.75px;
          color: var(--text-muted); background: #f8fafc;
          border-bottom: 2px solid var(--border-light);
          font-weight: 700;
        }
        .report-table td { padding: 1rem 1.2rem; font-size: 0.9rem; border-bottom: 1px solid var(--border-light); color: var(--text-dark); }
        .report-table tbody tr:hover { background: rgba(93, 95, 239, 0.02); }
        
        .no-data-cell { text-align: center; padding: 3rem 1.5rem !important; color: var(--text-muted); font-weight: 500; font-size: 0.95rem; }
        
        .total-row { background: #f7f9ff !important; }
        .total-row td { font-weight: 700; border-top: 2px solid var(--primary); border-bottom: none; color: var(--primary); }
        .table-responsive { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border-light); }

        .text-success { color: #10b981; }
        .text-danger { color: #ef4444; }
        .text-warning { color: #f59e0b; }
        .text-primary { color: var(--primary); }
        .font-semibold { font-weight: 600; }

        .progress-bar-mini { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

        .trend-bar { width: 120px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .trend-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

        .status-dot { padding: 0.25rem 0.7rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 700; }
        .status-dot.good { background: #d1fae5; color: #065f46; }
        .status-dot.avg { background: #fef3c7; color: #92400e; }
        .status-dot.poor { background: #fee2e2; color: #991b1b; }

        .payment-badge {
          background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 700;
          padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase;
        }

        .badge-aggregate {
          background: rgba(93, 95, 239, 0.08); color: var(--primary);
          font-weight: 700; font-size: 0.85rem; padding: 0.4rem 0.8rem; border-radius: 6px;
        }

        .form-control { 
          padding: 0.6rem 0.9rem; 
          border: 1.5px solid var(--border-light); 
          border-radius: 8px; 
          font-size: 0.9rem; 
          transition: 0.2s ease; 
          background: white;
          color: var(--text-dark);
          font-weight: 500;
        }
        .form-control:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(93,95,239,0.15); }
      `}</style>
    </div>
  );
};

export default Report;
