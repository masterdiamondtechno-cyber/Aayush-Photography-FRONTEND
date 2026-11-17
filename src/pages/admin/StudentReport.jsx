import { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import { MOCK_STUDENT_ATTENDANCE_REPORT } from '../../data/mockData';
import { BiSearchAlt, BiDownload } from 'react-icons/bi';

/**
 * Student Attendance Report Page (Admin)
 */
const StudentReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const filteredData = MOCK_STUDENT_ATTENDANCE_REPORT.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'All' || r.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const totalStudents = MOCK_STUDENT_ATTENDANCE_REPORT.length;
  const avgAttendance = Math.round(MOCK_STUDENT_ATTENDANCE_REPORT.reduce((sum, r) => sum + r.percentage, 0) / totalStudents);
  const lowAttendance = MOCK_STUDENT_ATTENDANCE_REPORT.filter(r => r.percentage < 75).length;

  return (
    <div className="report-page">
      <div className="header-section flex-between">
        <div>
          <h1>Attendance Report</h1>
          <p className="breadcrumb">Students &gt; Attendance Report</p>
        </div>
        <button className="btn btn-primary flex-center gap-1">
          <BiDownload /> Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card-report" style={{borderLeft: '4px solid var(--primary)'}}>
          <p className="stat-label">Total Students</p>
          <h2 className="stat-value">{totalStudents}</h2>
          <p className="stat-sub">This month</p>
        </div>
        <div className="stat-card-report" style={{borderLeft: '4px solid var(--success)'}}>
          <p className="stat-label">Average Attendance</p>
          <h2 className="stat-value" style={{color: 'var(--success)'}}>{avgAttendance}%</h2>
          <p className="stat-sub">Across all classes</p>
        </div>
        <div className="stat-card-report" style={{borderLeft: '4px solid var(--danger)'}}>
          <p className="stat-label">Low Attendance</p>
          <h2 className="stat-value" style={{color: 'var(--danger)'}}>{lowAttendance}</h2>
          <p className="stat-sub">Below 75%</p>
        </div>
      </div>

      <div className="card shadow-sm" style={{marginTop: '1.5rem'}}>
        <div className="filter-section flex-between" style={{marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
          <div className="search-box">
            <BiSearchAlt className="input-icon" />
            <input
              type="text"
              placeholder="Search student name..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{paddingLeft: '2.5rem', width: '280px'}}
            />
          </div>
          <div className="flex-center gap-1">
            <label className="text-sm" style={{fontWeight: 600}}>Class:</label>
            <select className="form-control" value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{padding: '0.4rem', width: '100px'}}>
              <option>All</option>
              <option value="9">9th</option>
              <option value="10">10th</option>
              <option value="11">11th</option>
              <option value="12">12th</option>
            </select>
          </div>
        </div>

        <DataTable
          headers={['#', 'Student Name', 'Class', 'Total Days', 'Present', 'Absent', 'Attendance %']}
          data={filteredData}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                <div className="flex-center gap-2" style={{justifyContent: 'flex-start'}}>
                  <img src={`https://ui-avatars.com/api/?name=${item.name}&background=random`} alt="" style={{width: '30px', height: '30px', borderRadius: '50%'}} />
                  <strong>{item.name}</strong>
                </div>
              </td>
              <td>{item.class}th - {item.section}</td>
              <td>{item.totalDays}</td>
              <td style={{color: 'var(--success)', fontWeight: 600}}>{item.presentDays}</td>
              <td style={{color: 'var(--danger)', fontWeight: 600}}>{item.absentDays}</td>
              <td>
                <div className="flex-center gap-1" style={{justifyContent: 'flex-start'}}>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{width: `${item.percentage}%`, background: item.percentage >= 75 ? 'var(--success)' : 'var(--danger)'}} />
                  </div>
                  <span style={{fontWeight: 600, fontSize: '0.85rem', color: item.percentage >= 75 ? 'var(--success)' : 'var(--danger)'}}>{item.percentage}%</span>
                </div>
              </td>
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

        .progress-bar-bg { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

        @media (max-width: 768px) { .stats-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default StudentReport;
