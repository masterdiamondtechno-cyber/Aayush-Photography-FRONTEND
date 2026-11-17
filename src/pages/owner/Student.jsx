import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import { BiSearchAlt, BiUser, BiX, BiGroup, BiCheckCircle, BiXCircle, BiRupee, BiBuildings, BiLoader } from 'react-icons/bi';
import { getOwnerStudents, getOwnerSchools, getOwnerSchoolStats, getOwnerStudentStats, getCurrentAcademicYear, getAllClassesBySchoolId } from '../../api/api';
import { getAuthValue } from '../../utils/auth';

/**
 * Owner — Students Page
 */

const Student = () => {
  const ownerId = getAuthValue('ownerId');

  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [standards, setStandards] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, paidCount: 0, pendingCount: 0, avgFee: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Schools
  const fetchSchools = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await getOwnerSchools({ ownerId, size: 100 });
      const data = res?.data?.data || res?.data || res || [];
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  }, [ownerId]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await getOwnerStudentStats({ ownerId });
      const data = res?.data || res || {};
      setStats({
        totalStudents: data.totalStudents || 0,
        paidCount: data.paidStudents || 0,
        pendingCount: data.pendingStudents || 0,
        avgFee: data.avgFee || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [ownerId]);

  // Fetch dynamic standards based on selected school
  useEffect(() => {
    const fetchStandards = async () => {
      if (selectedSchool === 'All') {
        setStandards([]);
        setSelectedClass('All');
        return;
      }
      try {
        const ayRes = await getCurrentAcademicYear(selectedSchool);
        const ay = ayRes?.data?.data || ayRes?.data;
        if (ay?.academicYearId) {
          const stdRes = await getAllClassesBySchoolId({ 
            schoolId: selectedSchool, 
            academicYearId: ay.academicYearId 
          });
          const list = stdRes?.data?.data || stdRes?.data || [];
          setStandards(Array.isArray(list) ? list : []);
        } else {
          setStandards([]);
        }
      } catch (err) {
        console.error('Failed to fetch standards:', err);
        setStandards([]);
      }
    };
    fetchStandards();
  }, [selectedSchool]);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    if (!ownerId) return;
    try {
      setLoading(true);
      const payload = {
        ownerId,
        page,
        size: 10,
        search: searchTerm || undefined,
        schoolId: selectedSchool !== 'All' ? selectedSchool : undefined,
        classId: selectedClass !== 'All' ? selectedClass : undefined
      };
      
      const res = await getOwnerStudents(payload);
      const data = res?.data || res;

      if (data?.data) {
        setStudents(data.data);
        setTotalPages(data.totalPages || 1);
      } else {
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, page, searchTerm, selectedSchool, selectedClass]);

  useEffect(() => {
    fetchSchools();
    fetchStats();
  }, [fetchSchools, fetchStats]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleSchoolChange = (e) => {
    setSelectedSchool(e.target.value);
    setSelectedClass('All');
    setPage(0);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setPage(0);
  };

  return (
    <div className="owner-students-page space-y-8">
      {/* Header */}
      <div className="header-section flex-between">
        <div>
          <h1>Students</h1>
          <p className="breadcrumb">Owner Panel &gt; All Students</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <StatCard title="Total Students" count={stats.totalStudents} icon={BiGroup} color="#5d5fef" />
        <StatCard title="Paid (Page)" count={stats.paidCount} icon={BiCheckCircle} color="#10b981" />
        <StatCard title="Pending (Page)" count={stats.pendingCount} icon={BiXCircle} color="#ef4444" />
        <StatCard title="Avg. Fee (Page)" count={`₹${stats.avgFee.toLocaleString()}`} icon={BiRupee} color="#f59e0b" />
      </div>

      {/* Main Card */}
      <div className="card shadow-sm" style={{ marginTop: '2rem', padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={selectedSchool}
                onChange={handleSchoolChange}
                style={{ width: '240px', padding: '0.6rem 0.9rem' }}
              >
                <option value="All">All Schools</option>
                {schools.map(s => <option key={s.schoolId} value={s.schoolId}>{s.schoolName}</option>)}
              </select>
              <select
                className="form-control"
                value={selectedClass}
                onChange={handleClassChange}
                disabled={selectedSchool === 'All'}
                style={{ width: '180px', padding: '0.6rem 0.9rem' }}
              >
                <option value="All">All Classes</option>
                {standards.map(std => (
                  <option key={std.standardId} value={std.standardId}>{std.standard}</option>
                ))}
              </select>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                Showing <strong>{students.length}</strong> students
              </div>
            </div>
            <div className="search-box">
              <BiSearchAlt className="input-icon" />
              <input
                type="text"
                placeholder="Search name or email..."
                className="form-control"
                value={searchTerm}
                onChange={handleSearch}
                style={{ paddingLeft: '2.5rem', width: '260px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <BiLoader size={32} className="spin" style={{ color: 'var(--primary)' }} />
              <p className="text-muted" style={{ marginTop: '1rem' }}>Loading students...</p>
            </div>
          ) : (
            <DataTable
              headers={['ID', 'Student', 'School', 'Class', 'Guardian', 'Fee Status', 'Action']}
              data={students}
              renderRow={(student) => (
                <tr key={student.studentId || student.id}>
                  <td className="font-bold">#{student.studentId || student.id}</td>
                  <td>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${student.studentName || student.name}&background=random`}
                        alt="" style={{ width: '34px', height: '34px', borderRadius: '50%' }}
                      />
                      <div>
                        <div className="font-bold">{student.studentName || student.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{student.gender || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <BiBuildings style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                      <span style={{ fontSize: '0.85rem' }}>{student.schoolName || student.school}</span>
                    </div>
                  </td>
                  <td>
                    <span className="class-pill">{student.standardName || student.class || '-'} - {student.divisionName || student.section || '-'}</span>
                  </td>
                  <td>{student.guardianName || student.guardian || '-'}</td>
                  <td>
                    <span className={`fee-badge ${(student.feeStatus || '').toLowerCase()}`}>
                      {student.feeStatus || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" title="View Profile" onClick={() => setViewingProfile(student)}>
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
          <div className="flex-center gap-1" style={{ justifyContent: 'center', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
            <span className="text-sm text-muted">Page {page + 1} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* ===== VIEW PROFILE MODAL ===== */}
      {viewingProfile && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-700 no-padding overflow-hidden">
            <div className="padding-2 text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <div className="flex-between">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${viewingProfile.studentName || viewingProfile.name}&size=128&background=fff&color=10b981`}
                    alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid white' }}
                  />
                  <div>
                    <h2 className="mb-0 text-white">{viewingProfile.studentName || viewingProfile.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Student ID: #{viewingProfile.studentId || viewingProfile.id} | {viewingProfile.standardName || viewingProfile.class} - {viewingProfile.divisionName || viewingProfile.section}</p>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => setViewingProfile(null)} style={{ fontSize: '2rem', color: 'white', background: 'rgba(255,255,255,0.15)' }}>&times;</button>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ flex: 1, padding: '1rem', textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{viewingProfile.standardName || viewingProfile.class}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Class</div>
              </div>
              <div style={{ flex: 1, padding: '1rem', textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>₹{(viewingProfile.totalFee || viewingProfile.finalFee || 0).toLocaleString()}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Fee</div>
              </div>
              <div style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
                <span className={`fee-badge ${(viewingProfile.feeStatus || '').toLowerCase()}`}>{viewingProfile.feeStatus || 'Unknown'}</span>
              </div>
            </div>

            <div className="padding-2 grid grid-2 gap-2">
              <div className="info-group">
                <h4 className="border-bottom pb-05 mb-1">Student Details</h4>
                <p><strong>Email:</strong> {viewingProfile.email || '-'}</p>
                <p><strong>Phone:</strong> {viewingProfile.phoneNo || viewingProfile.phone || '-'}</p>
                <p><strong>Gender:</strong> {viewingProfile.gender || '-'}</p>
                <p><strong>Admission Date:</strong> {viewingProfile.admissionDate || '-'}</p>
              </div>
              <div className="info-group">
                <h4 className="border-bottom pb-05 mb-1">School & Guardian</h4>
                <p><strong>School:</strong> {viewingProfile.schoolName || viewingProfile.school}</p>
                <p><strong>Class:</strong> {viewingProfile.standardName || viewingProfile.class} - {viewingProfile.divisionName || viewingProfile.section}</p>
                <p><strong>Guardian:</strong> {viewingProfile.guardianName || viewingProfile.guardian || '-'}</p>
                <p><strong>Fee:</strong> ₹{(viewingProfile.totalFee || viewingProfile.finalFee || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-light padding-1 flex-end gap-1">
              <button className="btn btn-outline" onClick={() => setViewingProfile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .owner-students-page { animation: fadeIn 0.5s ease; }

        .class-pill { background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.7rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 600; }

        .fee-badge { padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
        .fee-badge.paid { background: #e8f5e9; color: #388e3c; }
        .fee-badge.pending { background: #fff8e1; color: #f57f17; }
        .fee-badge.overdue { background: #fce4ec; color: #c62828; }

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

        .info-group p { margin-bottom: 0.5rem; font-size: 0.9rem; color: #475569; }
        .info-group p strong { color: #1e293b; }

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

export default Student;
