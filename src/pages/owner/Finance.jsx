import React, { useState, useEffect, useCallback } from 'react';
import { BiBarChartAlt, BiTrendingUp, BiTrendingDown, BiWallet, BiLoader } from 'react-icons/bi';
import { getOwnerFinanceSummary, getOwnerFinanceBranchWise } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const OwnerFinance = () => {
  const ownerId = getAuthValue('ownerId');
  
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, pendingAmount: 0 });
  const [branchWise, setBranchWise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('2025-2026');

  const parseFinancialYear = (fy) => {
    const [startYear, endYear] = fy.split('-');
    return {
      startDate: `${startYear}-04-01`,
      endDate:   `${endYear}-03-31`
    };
  };

  const fetchFinanceData = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const dates = parseFinancialYear(filterYear);
      const [summaryRes, branchRes] = await Promise.all([
        getOwnerFinanceSummary({ ownerId, ...dates }),
        getOwnerFinanceBranchWise({ ownerId, ...dates })
      ]);
      
      setSummary(summaryRes?.data || { totalBilled: 0, totalCollected: 0, pendingAmount: 0 });
      setBranchWise(Array.isArray(branchRes?.data) ? branchRes.data : []);
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [ownerId, filterYear]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="dashboard-page animation-fade-in space-y-8">
      <div className="flex-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Global Financial Overview</h1>
        <select 
          className="form-control" 
          style={{ width: 'auto' }}
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="2025-2026">Financial Year 2025-2026</option>
          <option value="2024-2025">Financial Year 2024-2025</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <BiLoader size={40} className="spin" style={{ color: 'var(--primary)' }} />
          <p className="text-muted" style={{ marginTop: '1rem' }}>Loading financial data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="card shadow-sm padding-1-5 flex-between" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: 'white' }}>
              <div>
                <p className="text-sm font-bold opacity-90">Total Revenue Collected</p>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{formatCurrency(summary.totalCollected)}</h2>
              </div>
              <BiTrendingUp size={48} style={{ opacity: 0.5 }} />
            </div>
            <div className="card shadow-sm padding-1-5 flex-between" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', color: 'white' }}>
              <div>
                <p className="text-sm font-bold opacity-90">Outstanding Dues</p>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{formatCurrency(summary.pendingAmount)}</h2>
              </div>
              <BiTrendingDown size={48} style={{ opacity: 0.5 }} />
            </div>
            <div className="card shadow-sm padding-1-5 flex-between" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: 'white' }}>
              <div>
                <p className="text-sm font-bold opacity-90">Total Billed Amount</p>
                <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{formatCurrency(summary.totalBilled)}</h2>
              </div>
              <BiWallet size={48} style={{ opacity: 0.5 }} />
            </div>
          </div>

          <div className="card shadow-sm table-responsive">
            <div className="padding-1-5 border-bottom flex-between">
               <h3 style={{ margin: 0 }}>Branch-wise Revenue Split</h3>
               <button className="btn btn-outline-primary text-sm">Export CSV</button>
            </div>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Total Students</th>
                  <th>Revenue Collected</th>
                  <th>Pending Dues</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {branchWise.length > 0 ? (
                  branchWise.map((branch, i) => (
                    <tr key={i}>
                      <td className="font-bold">{branch.schoolName}</td>
                      <td>{branch.studentCount}</td>
                      <td className="text-success font-bold">{formatCurrency(branch.collected)}</td>
                      <td className="text-danger">{formatCurrency(branch.pending)}</td>
                      <td>
                        <span className={`px-2 py-1 round text-sm ${branch.pending === 0 ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                          {branch.pending === 0 ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      No branch-wise data available for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      <style>{`
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default OwnerFinance;
