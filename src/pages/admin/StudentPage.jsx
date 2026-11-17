import { useState, useEffect, useCallback } from "react";
import { BiSearchAlt, BiUser } from "react-icons/bi";
import DataTable from "../../components/common/DataTable";
import { getAllStudents } from '../../api/api';
import { getAuthValue } from '../../utils/auth';


const DUMMY_STUDENTS = [
  { id: 1, name: "Rahul Patil", email: "rahul@gmail.com", phone: "9876543210", className: "10th", section: "A", status: "Active" },
  { id: 2, name: "Sneha Joshi", email: "sneha@gmail.com", phone: "9123456780", className: "9th", section: "B", status: "Active" },
  { id: 3, name: "Amit Sharma", email: "amit@gmail.com", phone: "9988776655", className: "8th", section: "A", status: "Active" },
];

const StudentPage = () => {
  const schoolId = getAuthValue('schoolId');
  const academicYearId = getAuthValue('academicYearId');

  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      const res = await getAllStudents(schoolId, academicYearId);
      const apiStudents = res?.data || [];
      if (apiStudents.length > 0) {
        const mapped = apiStudents.map((s, idx) => ({
          id: s.id || s.studentId || (1000 + idx),
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          email: s.email || '-',
          phone: s.phone || s.mobileNo || '-',
          className: s.class || s.standardName || s.standard || '-',
          section: s.section || s.divisionName || s.division || '-',
          status: (s.status || 'Active').toLowerCase() === 'active' ? 'Active' : 'Inactive',
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYearId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (s.name || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.phone || '').includes(term) ||
      String(s.id).includes(term);
  });

  return (
    <div className="student-page-container space-y-8">
      <div style={{ width: '100%', maxWidth: '1350px', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div className="header-section flex-between">
          <div>
            <h1>Students</h1>
            <p className="sp-breadcrumb">Management &gt; Students</p>
          </div>
        </div>

        {/* Stats */}
        <div className="sp-stats-row">
          <div className="sp-stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="sp-stat-icon" style={{ background: 'rgba(93,95,239,0.1)' }}>
              <BiUser size={22} color="var(--primary)" />
            </div>
            <div>
              <p className="sp-stat-label">Total Students</p>
              <h3 className="sp-stat-value">{students.length}</h3>
            </div>
          </div>
          <div className="sp-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="sp-stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <BiUser size={22} color="#10b981" />
            </div>
            <div>
              <p className="sp-stat-label">Active</p>
              <h3 className="sp-stat-value" style={{ color: '#10b981' }}>{students.filter(s => s.status === 'Active').length}</h3>
            </div>
          </div>
          <div className="sp-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="sp-stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <BiUser size={22} color="#ef4444" />
            </div>
            <div>
              <p className="sp-stat-label">Inactive</p>
              <h3 className="sp-stat-value" style={{ color: '#ef4444' }}>{students.filter(s => s.status !== 'Active').length}</h3>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card sp-shadow" style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <BiSearchAlt style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="sp-input"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '280px' }}
              />
            </div>
            <span className="sp-text-muted" style={{ fontSize: '0.85rem' }}>
              {loading ? 'Loading...' : <><strong>{filtered.length}</strong> of {students.length} students</>}
            </span>
          </div>
        </div>

        {/* Table */}
        <DataTable
          headers={['ID', 'Student Name', 'Email', 'Phone', 'Class', 'Section', 'Status']}
          data={filtered}
          renderRow={(student) => (
            <tr key={student.id}>
              <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>#{student.id}</td>
              <td>
                <div className="flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start' }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${student.name}&size=32&background=5d5fef&color=fff`}
                    alt=""
                    style={{ borderRadius: '50%', width: 32, height: 32 }}
                  />
                  <span style={{ fontWeight: 600 }}>{student.name}</span>
                </div>
              </td>
              <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{student.email}</td>
              <td style={{ fontSize: '0.85rem' }}>{student.phone}</td>
              <td>
                <span className="sp-badge">{student.className}</span>
              </td>
              <td>
                <span className="sp-badge">{student.section}</span>
              </td>
              <td>
                <span className={`sp-status ${(student.status || 'Active').toLowerCase()}`}>
                  {student.status || 'Active'}
                </span>
              </td>
            </tr>
          )}
        />
      </div>

      <style>{`
        .student-page-container { animation: fadeIn 0.5s ease; }
        .sp-breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
        .sp-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; }
        .sp-stat-card { display: flex; align-items: center; gap: 0.75rem; background: var(--bg-card, #fff); border-radius: 12px; padding: 1.25rem; box-shadow: var(--shadow-sm); }
        .sp-stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .sp-stat-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.15rem; }
        .sp-stat-value { margin: 0; font-size: 1.5rem; font-weight: 700; }
        .sp-shadow { box-shadow: var(--shadow-sm); }
        .sp-input { padding: 0.6rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: 0.9rem; transition: 0.2s; outline: none; }
        .sp-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93,95,239,0.12); }
        .sp-text-muted { color: var(--text-muted); }
        .sp-badge { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }
        .sp-status { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .sp-status.active { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .sp-status.inactive { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        /* Table column alignment */
        .student-page-container .data-table { table-layout: fixed; width: 100%; }
        .student-page-container .data-table th:nth-child(1),
        .student-page-container .data-table td:nth-child(1) { width: 8%; text-align: left; }
        .student-page-container .data-table th:nth-child(2),
        .student-page-container .data-table td:nth-child(2) { width: 22%; text-align: left; }
        .student-page-container .data-table th:nth-child(3),
        .student-page-container .data-table td:nth-child(3) { width: 22%; text-align: left; }
        .student-page-container .data-table th:nth-child(4),
        .student-page-container .data-table td:nth-child(4) { width: 15%; text-align: left; }
        .student-page-container .data-table th:nth-child(5),
        .student-page-container .data-table td:nth-child(5) { width: 10%; text-align: center; }
        .student-page-container .data-table th:nth-child(6),
        .student-page-container .data-table td:nth-child(6) { width: 10%; text-align: center; }
        .student-page-container .data-table th:nth-child(7),
        .student-page-container .data-table td:nth-child(7) { width: 13%; text-align: center; }
        .student-page-container .data-table td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
        .student-page-container .data-table th { white-space: nowrap; vertical-align: middle; }

        @media (max-width: 768px) {
          .sp-stats-row { grid-template-columns: 1fr; }
          .student-page-container .data-table { table-layout: auto; }
        }
      `}</style>
    </div>
  );
};

export default StudentPage;