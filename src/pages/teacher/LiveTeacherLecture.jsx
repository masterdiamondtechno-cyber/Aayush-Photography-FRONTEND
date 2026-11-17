import { useState } from 'react';
import { BiVideo, BiPlus, BiEditAlt, BiTrash, BiPlay, BiCalendar, BiTime, BiGroup, BiLinkExternal, BiSearch } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';

/**
 * Mock data for live lecturesas
 */
const MOCK_LIVE_LECTURES = [
  { id: 'LL001', title: 'Algebra – Quadratic Equations', subject: 'Mathematics', teacher: 'Arvind Verma', class: '10-A', date: '2026-03-25', startTime: '09:00', duration: '45 min', meetLink: 'https://meet.google.com/abc-defg-hij', status: 'Live' },
  { id: 'LL002', title: 'Chemical Bonding', subject: 'Chemistry', teacher: 'Sneha Sharma', class: '12-B', date: '2026-03-25', startTime: '10:00', duration: '50 min', meetLink: 'https://meet.google.com/xyz-uvwx-yz', status: 'Scheduled' },
  { id: 'LL003', title: 'Essay Writing Techniques', subject: 'English', teacher: 'Raj Kumar', class: '9-C', date: '2026-03-25', startTime: '11:30', duration: '40 min', meetLink: '', status: 'Scheduled' },
  { id: 'LL004', title: 'Hindi Vyakaran – Samas', subject: 'Hindi', teacher: 'Priya Singh', class: '10-A', date: '2026-03-24', startTime: '09:00', duration: '45 min', meetLink: 'https://meet.google.com/lmn-opqr-st', status: 'Completed' },
  { id: 'LL005', title: 'Data Structures – Linked Lists', subject: 'Computer Science', teacher: 'Vikram Patel', class: '11-A', date: '2026-03-24', startTime: '14:00', duration: '60 min', meetLink: 'https://meet.google.com/rst-uvwx-yz', status: 'Completed' },
  { id: 'LL006', title: 'Newton\'s Laws of Motion', subject: 'Physics', teacher: 'Sneha Sharma', class: '11-B', date: '2026-03-26', startTime: '10:00', duration: '50 min', meetLink: '', status: 'Scheduled' },
];

/**g
 * Live Lecture Management Page (Admin)
 * Schedule, manage and monitor live lectures
 */
const LiveTeacherLecture = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const todaysCount = MOCK_LIVE_LECTURES.filter(l => l.date === '2026-03-25').length;
  const liveNow = MOCK_LIVE_LECTURES.filter(l => l.status === 'Live').length;
  const totalScheduled = MOCK_LIVE_LECTURES.filter(l => l.status === 'Scheduled').length;

  const filteredLectures = MOCK_LIVE_LECTURES.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="live-lecture-page space-y-8">
      {/* Header */}
      <div className="header-section flex-between">
        <div>
          <h1>Live Lecture Management</h1>
          <p className="breadcrumb">Academic &gt; Live Lectures</p>
        </div>
        <button className="btn btn-primary flex-center gap-1" onClick={() => setShowModal(true)}>
          <BiPlus /> Schedule Lecture
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-3 gap-1 mt-2 mb-2">
        <div className="card shadow-sm padding-1 flex-center gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid var(--primary)' }}>
          <div className="icon-box bg-primary-light">
            <BiCalendar size={24} color="var(--primary)" />
          </div>
          <div>
            <p className="text-muted text-xs mb-0">Today's Lectures</p>
            <h3 className="mb-0">{todaysCount}</h3>
          </div>
        </div>
        <div className="card shadow-sm padding-1 flex-center gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid #ef4444' }}>
          <div className="icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <BiVideo size={24} color="#ef4444" />
          </div>
          <div>
            <p className="text-muted text-xs mb-0">Live Now</p>
            <h3 className="mb-0" style={{ color: '#ef4444' }}>{liveNow}</h3>
          </div>
        </div>
        <div className="card shadow-sm padding-1 flex-center gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid var(--success)' }}>
          <div className="icon-box bg-success-light">
            <BiTime size={24} color="var(--success)" />
          </div>
          <div>
            <p className="text-muted text-xs mb-0">Upcoming Scheduled</p>
            <h3 className="mb-0">{totalScheduled}</h3>
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
            Showing <strong>{filteredLectures.length}</strong> of {MOCK_LIVE_LECTURES.length} lectures
          </div>
        </div>
      </div>

      {/* Lectures Table */}
      <DataTable
        headers={['ID', 'Lecture Title', 'Subject', 'Teacher', 'Class', 'Date & Time', 'Duration', 'Status', 'Actions']}
        data={filteredLectures}
        renderRow={(lecture) => (
          <tr key={lecture.id}>
            <td className="font-bold text-sm">#{lecture.id}</td>
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
            <td><span className="badge badge-light">{lecture.class}</span></td>
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
              <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                {lecture.status === 'Live' && (
                  <button className="btn btn-sm btn-live flex-center gap-05" onClick={() => lecture.meetLink && window.open(lecture.meetLink, '_blank')}>
                    <BiPlay /> Join
                  </button>
                )}
                {lecture.status === 'Scheduled' && lecture.meetLink && (
                  <button className="btn-icon" title="Open Link" onClick={() => window.open(lecture.meetLink, '_blank')}>
                    <BiLinkExternal />
                  </button>
                )}
                <button className="btn-icon" title="Edit"><BiEditAlt /></button>
                <button className="btn-icon text-danger" title="Delete"><BiTrash /></button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Schedule Lecture Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-600">
            <div className="flex-between mb-1">
              <h2>Schedule New Lecture</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form className="grid gap-1 mt-1" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Lecture Title</label>
                <input type="text" className="form-control" placeholder="e.g. Algebra – Quadratic Equations" />
              </div>
              <div className="grid grid-2 gap-1">
                <div className="form-group">
                  <label>Subject</label>
                  <select className="form-control">
                    <option value="">Select Subject</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Computer Science</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Teacher</label>
                  <select className="form-control">
                    <option value="">Select Teacher</option>
                    <option>Arvind Verma</option>
                    <option>Sneha Sharma</option>
                    <option>Raj Kumar</option>
                    <option>Priya Singh</option>
                    <option>Vikram Patel</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-3 gap-1">
                <div className="form-group">
                  <label>Class</label>
                  <select className="form-control">
                    <option value="">Select Class</option>
                    <option>9-C</option>
                    <option>10-A</option>
                    <option>10-B</option>
                    <option>11-A</option>
                    <option>11-B</option>
                    <option>12-A</option>
                    <option>12-B</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" className="form-control" />
                </div>
              </div>
              <div className="grid grid-2 gap-1">
                <div className="form-group">
                  <label>Duration</label>
                  <select className="form-control">
                    <option>30 min</option>
                    <option>40 min</option>
                    <option selected>45 min</option>
                    <option>50 min</option>
                    <option>60 min</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Meeting Link <span className="text-muted text-xs">(optional)</span></label>
                  <input type="url" className="form-control" placeholder="https://meet.google.com/..." />
                </div>
              </div>
              <div className="flex-end gap-1 mt-1">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { alert('Lecture scheduled successfully!'); setShowModal(false); }}>
                  <BiCalendar /> Schedule Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        .btn-live { background: #dc2626 !important; color: white !important; font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 6px; font-weight: 600; }
        .btn-live:hover { background: #b91c1c !important; transform: translateY(-1px); }

        /* Table action icons */
        .btn-icon { font-size: 1.2rem; color: var(--text-muted); padding: 0.3rem; border-radius: 6px; transition: 0.2s; cursor: pointer; background: none; border: none; }
        .btn-icon:hover { background: var(--bg-light); color: var(--primary); }
        .text-danger { color: var(--danger) !important; }
        .text-danger:hover { color: #b91c1c !important; }

        /* Badges */
        .badge-light { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }

        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
        .max-w-600 { width: 100%; max-width: 640px; }
        .modal-content { max-height: 90vh; overflow-y: auto; }

        /* Form overrides */
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-group label { font-weight: 600; font-size: 0.85rem; color: var(--text-main); }
        .form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: 0.9rem; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.12); outline: none; }

        /* Grid helpers */
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .gap-05 { gap: 0.35rem; }
        .gap-1 { gap: 0.75rem; }
        .mt-2 { margin-top: 1.5rem; }
        .mb-2 { margin-bottom: 1.5rem; }
        .mb-1 { margin-bottom: 0.75rem; }
        .mb-0 { margin-bottom: 0; }
        .mt-1 { margin-top: 0.75rem; }
        .padding-1 { padding: 1.25rem; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.85rem; }
        .text-muted { color: var(--text-muted); }
        .font-bold { font-weight: 600; }
        .flex-end { display: flex; justify-content: flex-end; align-items: center; }
        .btn-sm { font-size: 0.8rem; padding: 0.35rem 0.65rem; }
        .btn-outline { background: transparent; border: 1.5px solid var(--border-light); color: var(--text-main); }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        .shadow-sm { box-shadow: var(--shadow-sm); }
        .breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }

        @media (max-width: 768px) {
          .grid-2, .grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LiveTeacherLecture;
