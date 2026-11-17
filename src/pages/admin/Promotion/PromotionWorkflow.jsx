import { useState, useEffect } from 'react';
import { useAcademicYearStore } from '../../../store/academicYearStore';
import { 
  getAllAcademicYears, 
  getAllStandards, 
  getAllDivisionsByStandardId, 
  getActiveStudents, 
  promoteStudents 
} from '../../../api/api';
import { getAuthValue } from '../../../utils/auth';
import { BiUserCheck, BiArrowToRight, BiLoaderCircle, BiCheckDouble, BiCheckCircle } from 'react-icons/bi';

const PromotionWorkflow = () => {
  const { availableYears } = useAcademicYearStore();
  const schoolId = parseInt(getAuthValue('schoolId'));

  // Step state
  const [sourceYear, setSourceYear] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [standards, setStandards] = useState([]);
  const [sourceStandard, setSourceStandard] = useState('');
  const [targetStandard, setTargetStandard] = useState('');
  
  // Mapping divisions state
  const [divisions, setDivisions] = useState([]);
  const [targetDivision, setTargetDivision] = useState('');

  // Student listing state
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchStandards();
    }
  }, [schoolId]);

  const fetchStandards = async () => {
    try {
      const response = await getAllStandards({ schoolId });
      if (response && response.status === 'SUCCESS') {
        setStandards(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load standards for promotion:', error);
    }
  };

  const handleSourceStandardChange = async (stdId) => {
    setSourceStandard(stdId);
    setStudents([]);
    setSelectedStudentIds([]);
    if (!stdId || !sourceYear) return;

    setLoadingStudents(true);
    try {
      // Fetch active students for this standard in the selected source year
      const response = await getActiveStudents({
        schoolId,
        academicYearId: parseInt(sourceYear),
        standardId: parseInt(stdId)
      });
      if (response && response.status === 'SUCCESS') {
        // filter students belonging to this standard (if needed, but backend standardId should handle this)
        const studentList = response.data || [];
        setStudents(studentList.filter(s => s.standardId === parseInt(stdId)));
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleTargetStandardChange = async (stdId) => {
    setTargetStandard(stdId);
    setTargetDivision('');
    setDivisions([]);
    if (!stdId) return;

    try {
      const response = await getAllDivisionsByStandardId({
        schoolId,
        standardId: parseInt(stdId),
        academicYearId: parseInt(targetYear || availableYears.find(y => y.isCurrent)?.academicYearId)
      });
      if (response && response.status === 'SUCCESS') {
        setDivisions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load divisions:', error);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handlePromoteSubmit = async () => {
    if (!sourceYear || !targetYear || !targetStandard || !targetDivision || selectedStudentIds.length === 0) {
      alert('Please fill out all setup fields and select at least one student.');
      return;
    }

    if (sourceYear === targetYear) {
      alert('Source and Target academic years must be different.');
      return;
    }

    if (!window.confirm(`Are you sure you want to promote ${selectedStudentIds.length} students to the next academic year?`)) return;

    setSubmitting(true);
    try {
      // Build promotions array following PromotionStudentDTO schema
      const promotions = selectedStudentIds.map(studentId => {
        const student = students.find(s => s.id === studentId);
        return {
          studentId,
          fromClassId: parseInt(sourceStandard),
          toClassId: parseInt(targetStandard),
          toSectionId: parseInt(targetDivision),
          status: 'PROMOTED'
        };
      });

      const response = await promoteStudents({
        schoolId,
        fromAcademicYearId: parseInt(sourceYear),
        toAcademicYearId: parseInt(targetYear),
        promotions
      });

      if (response && response.status === 'SUCCESS') {
        setSuccessMsg(`Successfully promoted ${selectedStudentIds.length} students!`);
        setStudents([]);
        setSelectedStudentIds([]);
        setSourceStandard('');
        setTargetStandard('');
        setTargetDivision('');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (error) {
      alert(error.message || 'Promotion process failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="promotion-workflow-page space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Student Academic Promotion</h1>
        <p className="text-sm text-slate-500">Academic Context • Student Management</p>
      </div>

      <div className="promotion-layout grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="promotion-setup-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1 h-fit">
          <h3 className="mb-5 border-b border-slate-100 pb-3 text-lg font-bold text-slate-900">Promotion Setup</h3>
          
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Source Year (From)</label>
            <select
              value={sourceYear}
              onChange={(e) => { setSourceYear(e.target.value); setStudents([]); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select Source Year</option>
              {availableYears.map(y => (
                <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Target Year (To)</label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select Target Year</option>
              {availableYears.map(y => (
                <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Source Standard (From)</label>
            <select 
              value={sourceStandard} 
              onChange={(e) => handleSourceStandardChange(e.target.value)}
              disabled={!sourceYear}
              className="form-control"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '0.5rem' }}
            >
              <option value="">Select Class</option>
              {standards.map(s => (
                <option key={s.id} value={s.id}>{s.standardName}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Target Standard (To)</label>
            <select 
              value={targetStandard} 
              onChange={(e) => handleTargetStandardChange(e.target.value)}
              disabled={!sourceStandard}
              className="form-control"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '0.5rem' }}
            >
              <option value="">Select Class</option>
              {standards.map(s => (
                <option key={s.id} value={s.id}>{s.standardName}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Target Division/Section</label>
            <select 
              value={targetDivision} 
              onChange={(e) => setTargetDivision(e.target.value)}
              disabled={!targetStandard}
              className="form-control"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '0.5rem' }}
            >
              <option value="">Select Section</option>
              {divisions.map(d => (
                <option key={d.id} value={d.id}>{d.divisionName || d.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handlePromoteSubmit} 
            disabled={submitting || selectedStudentIds.length === 0} 
            className="btn btn-primary flex-center w-100" 
            style={{ gap: '0.5rem', padding: '0.75rem' }}
          >
            {submitting ? (
              <BiLoaderCircle className="spin" />
            ) : (
              <BiCheckDouble style={{ fontSize: '1.2rem' }} />
            )}
            Execute Promotion ({selectedStudentIds.length})
          </button>
        </div>

        {/* STUDENT WORKSPACE TABLE */}
        <div className="promotion-student-card card xl:col-span-3" style={{ padding: '2rem' }}>
          {successMsg && (
            <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <BiCheckCircle style={{ fontSize: '1.4rem' }} />
              {successMsg}
            </div>
          )}

          <div className="promotion-student-header flex-between" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Eligible Students</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Select the students you wish to promote to the targeted year configuration.</p>
            </div>
            {students.length > 0 && (
              <button className="btn btn-outline" onClick={handleSelectAll}>
                {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {loadingStudents ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BiLoaderCircle className="spin" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem' }} />
              <p>Fetching active standard student roster...</p>
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)', background: '#fafafa', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
              <BiUserCheck style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '1rem', opacity: 0.5 }} />
              <h4>No Active Students</h4>
              <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem' }}>Choose a Source Academic Year and Class Standard to load the student list for promotion processing.</p>
            </div>
          ) : (
            <div className="promotion-table-scroll">
              <table className="data-table promotion-student-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Select</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Current Standard</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} onClick={() => handleSelectStudent(s.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => {}} // click handles it
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 700 }}>{s.rollNumber || 'N/A'}</td>
                      <td>{s.firstName} {s.lastName}</td>
                      <td>{s.emailId}</td>
                      <td>{s.standardName || 'Assigned standard'}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--success)',
                          fontWeight: 600
                        }}>
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .promotion-workflow-page,
        .promotion-layout,
        .promotion-setup-card,
        .promotion-student-card {
          min-width: 0;
          max-width: 100%;
        }

        .promotion-layout {
          grid-template-columns: minmax(0, 1fr);
        }

        .promotion-table-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
        }

        .promotion-student-table {
          min-width: 720px;
        }

        @media (min-width: 1280px) {
          .promotion-layout {
            grid-template-columns: minmax(0, 1fr) repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .promotion-setup-card,
          .promotion-student-card {
            padding: 1rem !important;
          }

          .promotion-student-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.75rem;
          }

          .promotion-student-header > div {
            min-width: 0;
          }

          .promotion-student-header p {
            overflow-wrap: anywhere;
          }

          .promotion-student-header button {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PromotionWorkflow;
