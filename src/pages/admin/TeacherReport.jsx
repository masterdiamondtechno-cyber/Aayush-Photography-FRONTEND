import { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import { MOCK_TEACHER_SALARY_REPORT } from '../../data/mockData';
import { BiSearchAlt, BiDownload } from 'react-icons/bi';

/**
 * Teacher Salary Report Page (Admin)
 */
const TeacherReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredData = MOCK_TEACHER_SALARY_REPORT.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalSalary = MOCK_TEACHER_SALARY_REPORT.reduce((sum, r) => sum + r.salary, 0);
  const paidAmount = MOCK_TEACHER_SALARY_REPORT.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.salary, 0);
  const pendingAmount = totalSalary - paidAmount;

  return (
    <div className="report-page space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Salary Report</h1>
          <p className="text-sm text-slate-500">Teachers &gt; Salary Report</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700">
          <BiDownload className="text-lg" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Salary</p>
          <h2 className="mt-2 font-['Lexend'] text-2xl font-extrabold text-slate-900">₹{totalSalary.toLocaleString()}</h2>
          <p className="mt-1 text-sm text-slate-500">{MOCK_TEACHER_SALARY_REPORT.length} Teachers</p>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</p>
          <h2 className="mt-2 font-['Lexend'] text-2xl font-extrabold text-emerald-600">₹{paidAmount.toLocaleString()}</h2>
          <p className="mt-1 text-sm text-slate-500">{MOCK_TEACHER_SALARY_REPORT.filter(r => r.status === 'Paid').length} Teachers</p>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</p>
          <h2 className="mt-2 font-['Lexend'] text-2xl font-extrabold text-amber-600">₹{pendingAmount.toLocaleString()}</h2>
          <p className="mt-1 text-sm text-slate-500">{MOCK_TEACHER_SALARY_REPORT.filter(r => r.status === 'Pending').length} Teachers</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-[240px]">
            <BiSearchAlt className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              type="text"
              placeholder="Search teacher or department..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '280px' }}
            />
          </div>
          <div className="flex-center gap-1">
            <label className="text-sm" style={{ fontWeight: 600 }}>Status:</label>
            <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.4rem', width: '120px' }}>
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        <DataTable
          headers={['#', 'Teacher Name', 'Department', 'Salary', 'Month', 'Status', 'Paid Date']}
          data={filteredData}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                  <img src={`https://ui-avatars.com/api/?name=${item.name}&background=6366f1&color=fff`} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                  <strong>{item.name}</strong>
                </div>
              </td>
              <td><span className="badge badge-info">{item.department}</span></td>
              <td>₹{item.salary.toLocaleString()}</td>
              <td>{item.month}</td>
              <td>
                <span className={`status-badge ${item.status === 'Paid' ? 'paid' : 'pending'}`}>{item.status}</span>
              </td>
              <td>{item.paidDate ? new Date(item.paidDate).toLocaleDateString() : '—'}</td>
            </tr>
          )}
        />
      </div>

      <style>{`
        .report-page { animation: fadeIn 0.5s ease; }
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2rem; }
        .stat-card-report { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .stat-label { font-size: 0.85rem; color: #64748b; font-weight: 500; margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
        .stat-sub { font-size: 0.8rem; color: #94a3b8; }

        .badge-info { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; }
        .status-badge { padding: 0.2rem 0.8rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; }
        .status-badge.paid { background: #e8f5e9; color: #388e3c; }
        .status-badge.pending { background: #fff3e0; color: #e65100; }

        @media (max-width: 768px) { .stats-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default TeacherReport;
