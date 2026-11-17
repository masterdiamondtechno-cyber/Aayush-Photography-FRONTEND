import { useState, useEffect } from 'react';
import { BiVideo, BiPlay, BiCalendar, BiTime, BiSearch, BiInfoCircle } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';

/**
 * Mock data for live lectures (Filtered for Student's Class in production)
 */
const MOCK_LIVE_LECTURES = [
  { id: 'LL001', title: 'Algebra – Quadratic Equations', subject: 'Mathematics', teacher: 'Arvind Verma', class: '10-A', date: '2026-03-25', startTime: '09:00', duration: '45 min', meetLink: 'https://meet.google.com/abc-defg-hij', status: 'Live' },
  { id: 'LL002', title: 'Chemical Bonding', subject: 'Chemistry', teacher: 'Sneha Sharma', class: '12-B', date: '2026-03-25', startTime: '10:00', duration: '50 min', meetLink: 'https://meet.google.com/xyz-uvwx-yz', status: 'Scheduled' },
  { id: 'LL003', title: 'Essay Writing Techniques', subject: 'English', teacher: 'Raj Kumar', class: '9-C', date: '2026-03-25', startTime: '11:30', duration: '40 min', meetLink: '', status: 'Scheduled' },
  { id: 'LL004', title: 'Hindi Vyakaran – Samas', subject: 'Hindi', teacher: 'Priya Singh', class: '10-A', date: '2026-03-24', startTime: '09:00', duration: '45 min', meetLink: 'https://meet.google.com/lmn-opqr-st', status: 'Completed' },
  { id: 'LL005', title: 'Data Structures – Linked Lists', subject: 'Computer Science', teacher: 'Vikram Patel', class: '11-A', date: '2026-03-24', startTime: '14:00', duration: '60 min', meetLink: 'https://meet.google.com/rst-uvwx-yz', status: 'Completed' },
  { id: 'LL006', title: 'Newton\'s Laws of Motion', subject: 'Physics', teacher: 'Sneha Sharma', class: '11-B', date: '2026-03-26', startTime: '10:00', duration: '50 min', meetLink: '', status: 'Scheduled' },
];

const getStoredValue = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

const StudentLiveLecture = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // In a real app, we'd get the student's class from profileData
  const studentClass = '10-A';

  const studentLectures = MOCK_LIVE_LECTURES.filter(l => l.class === studentClass);
  const liveNow = studentLectures.filter(l => l.status === 'Live').length;
  const totalScheduled = studentLectures.filter(l => l.status === 'Scheduled').length;

  const filteredLectures = studentLectures.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="live-lecture-page fade-in space-y-8">
      {/* Header */}
      <div className="header-section">
        <h1>Live Lectures</h1>
        <p className="breadcrumb">Academic &gt; Live Sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-2 gap-1 mt-2 mb-2">
        <div className="card shadow-sm padding-1 flex-center gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid #ef4444' }}>
          <div className="icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <BiVideo size={24} color="#ef4444" />
          </div>
          <div>
            <p className="text-muted text-xs mb-0">Live Now</p>
            <h3 className="mb-0" style={{ color: '#ef4444' }}>{liveNow} Sessions</h3>
          </div>
        </div>
        <div className="card shadow-sm padding-1 flex-center gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid var(--primary)' }}>
          <div className="icon-box bg-primary-light">
            <BiCalendar size={24} color="var(--primary)" />
          </div>
          <div>
            <p className="text-muted text-xs mb-0">Upcoming Lectures</p>
            <h3 className="mb-0">{totalScheduled} Scheduled</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm" style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex-center gap-1">
            <div className="search-box" style={{ position: 'relative' }}>
              <BiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control text-sm"
                placeholder="Search lectures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '260px' }}
              />
            </div>
            <select
              className="form-control text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="All">All Status</option>
              <option value="Live">Live</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="text-muted text-sm">
            Class: <strong>{studentClass}</strong> | Showing <strong>{filteredLectures.length}</strong> lectures
          </div>
        </div>
      </div>

      {/* Lectures Table */}
      <DataTable
        headers={['Lecture Title', 'Subject', 'Teacher', 'Date & Time', 'Duration', 'Status', 'Action']}
        data={filteredLectures}
        renderRow={(lecture) => (
          <tr key={lecture.id}>
            <td>
              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                <div className="lecture-icon-small">
                  <BiVideo size={16} />
                </div>
                <span className="font-bold">{lecture.title}</span>
              </div>
            </td>
            <td><span className="badge badge-light">{lecture.subject}</span></td>
            <td>
              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                <img src={`https://ui-avatars.com/api/?name=${lecture.teacher}&size=28&background=5d5fef&color=fff`} alt="" style={{ borderRadius: '50%', width: '28px', height: '28px' }} />
                <span className="text-sm">{lecture.teacher}</span>
              </div>
            </td>
            <td>
              <div className="text-sm">
                <div className="font-bold">{new Date(lecture.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className="text-muted">{lecture.startTime}</div>
              </div>
            </td>
            <td className="text-sm">{lecture.duration}</td>
            <td>
              <span className={`status-pill ${lecture.status.toLowerCase()}`}>
                {lecture.status === 'Live' && <span className="live-dot"></span>}
                {lecture.status}
              </span>
            </td>
            <td>
              {lecture.status === 'Live' ? (
                <button className="btn btn-sm btn-live flex-center gap-05" onClick={() => lecture.meetLink && window.open(lecture.meetLink, '_blank')}>
                  <BiPlay /> Join Now
                </button>
              ) : lecture.status === 'Scheduled' ? (
                <span className="text-muted text-xs flex-center gap-05"><BiTime /> Wait for start</span>
              ) : (
                <span className="text-muted text-xs flex-center gap-05"><BiInfoCircle /> Ended</span>
              )}
            </td>
          </tr>
        )}
      />

      <style>{`
        .live-lecture-page { animation: fadeIn 0.5s ease; }

        /* Stats icon box */
        .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .bg-primary-light { background: rgba(93, 95, 239, 0.1); }
        .bg-success-light { background: rgba(16, 185, 129, 0.1); }

        /* Lecture icon in table */
        .lecture-icon-small { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #5d5fef, #7000ff); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* Status pills */
        .status-pill { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.35rem; letter-spacing: 0.02em; }
        .status-pill.live { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; animation: liveGlow 2s infinite; }
        .status-pill.scheduled { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .status-pill.completed { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; animation: pulse 1.5s infinite; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
          50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1); }
        }

        /* Join button */
        .btn-live { background: #dc2626 !important; color: white !important; font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; }
        .btn-live:hover { background: #b91c1c !important; transform: translateY(-1px); }

        /* Form overrides */
        .form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid #e2e8f0; font-size: 0.9rem; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.12); outline: none; }

        /* Helpers */
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .flex-center { display: flex; align-items: center; justify-content: center; }
        .gap-1 { gap: 0.75rem; }
        .gap-05 { gap: 0.35rem; }
        .padding-1 { padding: 1.25rem; }
        .mb-0 { margin-bottom: 0; }
        .mt-2 { margin-top: 1.5rem; }
        .mb-2 { margin-bottom: 1.5rem; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.85rem; }
        .text-muted { color: #64748b; }
        .font-bold { font-weight: 600; }
        .badge-light { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }
        .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); }
      `}</style>
    </div>
  );
};

export default StudentLiveLecture;
