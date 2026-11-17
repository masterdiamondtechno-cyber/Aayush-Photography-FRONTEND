import { useState } from 'react';
import { BiPlayCircle, BiPlay, BiCalendar, BiTime, BiDownload, BiSearch, BiVideo } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';

/**
 * Mock data for recorded lectures (student view – only published lectures for their class)
 */
const MOCK_RECORDED_LECTURES = [
  { id: 'RL001', title: 'Algebra – Quadratic Equations', subject: 'Mathematics', teacher: 'Arvind Verma', class: '10-A', recordedDate: '2026-03-20', duration: '45 min', fileSize: '120 MB', views: 234, status: 'Published' },
  { id: 'RL002', title: 'Chemical Bonding – Ionic & Covalent', subject: 'Chemistry', teacher: 'Sneha Sharma', class: '10-A', recordedDate: '2026-03-18', duration: '50 min', fileSize: '145 MB', views: 189, status: 'Published' },
  { id: 'RL003', title: 'Essay Writing – Advanced Techniques', subject: 'English', teacher: 'Raj Kumar', class: '10-A', recordedDate: '2026-03-15', duration: '40 min', fileSize: '98 MB', views: 156, status: 'Published' },
  { id: 'RL004', title: 'Hindi Vyakaran – Alankar', subject: 'Hindi', teacher: 'Priya Singh', class: '10-A', recordedDate: '2026-03-22', duration: '35 min', fileSize: '85 MB', views: 45, status: 'Published' },
  { id: 'RL005', title: 'Data Structures – Binary Trees', subject: 'Computer Science', teacher: 'Vikram Patel', class: '10-A', recordedDate: '2026-03-21', duration: '60 min', fileSize: '180 MB', views: 312, status: 'Published' },
  { id: 'RL006', title: 'Newton\'s Laws – Applications', subject: 'Physics', teacher: 'Sneha Sharma', class: '10-A', recordedDate: '2026-03-19', duration: '55 min', fileSize: '160 MB', views: 278, status: 'Published' },
];

const getStoredValue = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

/**
 * Recorded Lecture Page (Student View)
 * Browse and watch recorded lectures for the student's class
 */
const StudentRecordedLecture = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  // In a real app, we'd get the student's class from profile / JWT
  const studentClass = '10-A';

  const studentLectures = MOCK_RECORDED_LECTURES.filter(l => l.class === studentClass && l.status === 'Published');
  const totalLectures = studentLectures.length;
  const totalViews = studentLectures.reduce((sum, l) => sum + l.views, 0);
  const subjects = [...new Set(studentLectures.map(l => l.subject))];

  const filteredLectures = studentLectures.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'All' || l.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="srl-page fade-in space-y-8">
      {/* Header */}
      <div className="header-section">
        <h1>Recorded Lectures</h1>
        <p className="srl-breadcrumb">Academic &gt; Recorded Lectures</p>
      </div>

      {/* Stats Cards */}
      <div className="grid srl-grid-3 srl-gap-1 srl-mt-2 srl-mb-2">
        <div className="card srl-shadow-sm srl-padding-1 flex-center srl-gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid var(--primary)' }}>
          <div className="srl-icon-box srl-bg-primary-light">
            <BiPlayCircle size={24} color="var(--primary)" />
          </div>
          <div>
            <p className="srl-text-muted srl-text-xs srl-mb-0">Total Lectures</p>
            <h3 className="srl-mb-0">{totalLectures}</h3>
          </div>
        </div>
        <div className="card srl-shadow-sm srl-padding-1 flex-center srl-gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid #10b981' }}>
          <div className="srl-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <BiVideo size={24} color="#10b981" />
          </div>
          <div>
            <p className="srl-text-muted srl-text-xs srl-mb-0">Your Class</p>
            <h3 className="srl-mb-0" style={{ color: '#10b981' }}>{studentClass}</h3>
          </div>
        </div>
        <div className="card srl-shadow-sm srl-padding-1 flex-center srl-gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid #f59e0b' }}>
          <div className="srl-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <BiPlay size={24} color="#f59e0b" />
          </div>
          <div>
            <p className="srl-text-muted srl-text-xs srl-mb-0">Total Views</p>
            <h3 className="srl-mb-0" style={{ color: '#f59e0b' }}>{totalViews.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card srl-shadow-sm" style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex-center srl-gap-1">
            <div className="srl-search-box" style={{ position: 'relative' }}>
              <BiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="srl-form-control srl-text-sm"
                placeholder="Search lectures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '260px' }}
              />
            </div>
            <select
              className="srl-form-control srl-text-sm"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="All">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="srl-text-muted srl-text-sm">
            Class: <strong>{studentClass}</strong> | Showing <strong>{filteredLectures.length}</strong> lectures
          </div>
        </div>
      </div>

      {/* Lectures Table */}
      <DataTable
        headers={['Lecture Title', 'Subject', 'Teacher', 'Recorded Date', 'Duration', 'Views', 'Action']}
        data={filteredLectures}
        renderRow={(lecture) => (
          <tr key={lecture.id}>
            <td>
              <div className="flex-center srl-gap-1" style={{ justifyContent: 'flex-start' }}>
                <div className="srl-lecture-icon-small">
                  <BiPlayCircle size={16} />
                </div>
                <div>
                  <span className="srl-font-bold">{lecture.title}</span>
                  <div className="srl-text-muted srl-text-xs">{lecture.fileSize}</div>
                </div>
              </div>
            </td>
            <td><span className="srl-badge-light">{lecture.subject}</span></td>
            <td>
              <div className="flex-center srl-gap-1" style={{ justifyContent: 'flex-start' }}>
                <img src={`https://ui-avatars.com/api/?name=${lecture.teacher}&size=28&background=5d5fef&color=fff`} alt="" style={{ borderRadius: '50%', width: '28px', height: '28px' }} />
                <span className="srl-text-sm">{lecture.teacher}</span>
              </div>
            </td>
            <td className="srl-text-sm">
              {new Date(lecture.recordedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
            <td className="srl-text-sm">{lecture.duration}</td>
            <td className="srl-text-sm srl-font-bold">{lecture.views}</td>
            <td>
              <div className="flex-center srl-gap-1" style={{ justifyContent: 'flex-start' }}>
                <button className="srl-btn-action srl-btn-play" title="Watch Lecture">
                  <BiPlay /> Watch
                </button>
                <button className="srl-btn-icon" title="Download">
                  <BiDownload />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <style>{`
        .srl-page { animation: fadeIn 0.5s ease; }

        /* Stats icon box */
        .srl-icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .srl-bg-primary-light { background: rgba(93, 95, 239, 0.1); }

        /* Lecture icon in table */
        .srl-lecture-icon-small { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #5d5fef, #7000ff); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* Badges */
        .srl-badge-light { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }

        /* Action buttons */
        .srl-btn-action { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s ease; }
        .srl-btn-play { background: linear-gradient(135deg, #5d5fef, #7000ff); color: white; }
        .srl-btn-play:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(93, 95, 239, 0.35); }

        .srl-btn-icon { font-size: 1.2rem; color: #64748b; padding: 0.35rem; border-radius: 6px; transition: 0.2s; cursor: pointer; background: none; border: none; display: flex; align-items: center; justify-content: center; }
        .srl-btn-icon:hover { background: #f1f5f9; color: var(--primary); }

        /* Form overrides */
        .srl-form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid #e2e8f0; font-size: 0.9rem; transition: 0.2s; }
        .srl-form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.12); outline: none; }

        /* Grid helpers */
        .srl-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .srl-gap-1 { gap: 0.75rem; }
        .srl-mt-2 { margin-top: 1.5rem; }
        .srl-mb-2 { margin-bottom: 1.5rem; }
        .srl-mb-0 { margin-bottom: 0; }
        .srl-padding-1 { padding: 1.25rem; }
        .srl-text-xs { font-size: 0.75rem; }
        .srl-text-sm { font-size: 0.85rem; }
        .srl-text-muted { color: #64748b; }
        .srl-font-bold { font-weight: 600; }
        .srl-shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .srl-breadcrumb { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }

        @media (max-width: 768px) {
          .srl-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default StudentRecordedLecture;
