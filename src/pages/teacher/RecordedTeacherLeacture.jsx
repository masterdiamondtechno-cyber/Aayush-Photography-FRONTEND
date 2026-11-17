import { useState } from 'react';
import { BiPlayCircle, BiPlus, BiEditAlt, BiTrash, BiPlay, BiCalendar, BiTime, BiDownload, BiSearch, BiFilterAlt } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';


/**
 * Mock data for recorded lectures
 */
const MOCK_RECORDED_LECTURES = [
  { id: 'RL001', title: 'Algebra – Quadratic Equations', subject: 'Mathematics', teacher: 'Arvind Verma', class: '10-A', recordedDate: '2026-03-20', duration: '45 min', fileSize: '120 MB', views: 234, status: 'Published' },
  { id: 'RL002', title: 'Chemical Bonding – Ionic & Covalent', subject: 'Chemistry', teacher: 'Sneha Sharma', class: '12-B', recordedDate: '2026-03-18', duration: '50 min', fileSize: '145 MB', views: 189, status: 'Published' },
  { id: 'RL003', title: 'Essay Writing – Advanced Techniques', subject: 'English', teacher: 'Raj Kumar', class: '9-C', recordedDate: '2026-03-15', duration: '40 min', fileSize: '98 MB', views: 156, status: 'Published' },
  { id: 'RL004', title: 'Hindi Vyakaran – Alankar', subject: 'Hindi', teacher: 'Priya Singh', class: '10-A', recordedDate: '2026-03-22', duration: '35 min', fileSize: '85 MB', views: 45, status: 'Processing' },
  { id: 'RL005', title: 'Data Structures – Binary Trees', subject: 'Computer Science', teacher: 'Vikram Patel', class: '11-A', recordedDate: '2026-03-21', duration: '60 min', fileSize: '180 MB', views: 312, status: 'Published' },
  { id: 'RL006', title: 'Newton\'s Laws – Applications', subject: 'Physics', teacher: 'Sneha Sharma', class: '11-B', recordedDate: '2026-03-19', duration: '55 min', fileSize: '160 MB', views: 278, status: 'Published' },
  { id: 'RL007', title: 'Trigonometry Basics', subject: 'Mathematics', teacher: 'Arvind Verma', class: '9-C', recordedDate: '2026-03-23', duration: '42 min', fileSize: '110 MB', views: 0, status: 'Draft' },
];

/**
 * Recorded Lecture Management Page (Admin)
 * Upload, manage and organize recorded lectures
 */
const RecordedTeacherLecture = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');

  const totalLectures = MOCK_RECORDED_LECTURES.length;
  const publishedCount = MOCK_RECORDED_LECTURES.filter(l => l.status === 'Published').length;
  const totalViews = MOCK_RECORDED_LECTURES.reduce((sum, l) => sum + l.views, 0);

  const filteredLectures = MOCK_RECORDED_LECTURES.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    const matchesSubject = filterSubject === 'All' || l.subject === filterSubject;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const subjects = [...new Set(MOCK_RECORDED_LECTURES.map(l => l.subject))];

  return (
    <div className="recorded-lecture-page space-y-8">
  <div
    style={{
      width: '100%',
      maxWidth: '1350px',
      margin: '0 auto',
      padding: '20px 24px',
      boxSizing: 'border-box'
    }}
  >      {/* Header */}
      <div className="header-section flex-between">
        <div>
          <h1>Recorded Lectures</h1>
          <p className="rl-breadcrumb">Academic &gt; Recorded Lectures</p>
        </div>
        <button className="btn btn-primary flex-center rl-gap-1" onClick={() => setShowModal(true)}>
          <BiPlus /> Upload Lecture
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid rl-grid-3 rl-gap-1 rl-mt-2 rl-mb-2">
        <div className="card rl-shadow-sm rl-padding-1 flex-center rl-gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid var(--primary)' }}>
          <div className="rl-icon-box rl-bg-primary-light">
            <BiPlayCircle size={24} color="var(--primary)" />
          </div>
          <div>
            <p className="rl-text-muted rl-text-xs rl-mb-0">Total Lectures</p>
            <h3 className="rl-mb-0">{totalLectures}</h3>
          </div>
        </div>
        <div className="card rl-shadow-sm rl-padding-1 flex-center rl-gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid #10b981' }}>
          <div className="rl-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <BiCalendar size={24} color="#10b981" />
          </div>
          <div>
            <p className="rl-text-muted rl-text-xs rl-mb-0">Published</p>
            <h3 className="rl-mb-0" style={{ color: '#10b981' }}>{publishedCount}</h3>
          </div>
        </div>
        <div className="card rl-shadow-sm rl-padding-1 flex-center rl-gap-1" style={{ justifyContent: 'flex-start', borderLeft: '4px solid #f59e0b' }}>
          <div className="rl-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <BiPlay size={24} color="#f59e0b" />
          </div>
          <div>
            <p className="rl-text-muted rl-text-xs rl-mb-0">Total Views</p>
            <h3 className="rl-mb-0" style={{ color: '#f59e0b' }}>{totalViews.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card rl-shadow-sm" style={{ padding: '1rem 1.5rem', marginBottom: '1rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex-center rl-gap-1">
            <div className="rl-search-box" style={{ position: 'relative' }}>
              <BiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="rl-form-control rl-text-sm"
                placeholder="Search lectures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '260px' }}
              />
            </div>
            <select
              className="rl-form-control rl-text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Processing">Processing</option>
              <option value="Draft">Draft</option>
            </select>
            <select
              className="rl-form-control rl-text-sm"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="All">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="rl-text-muted rl-text-sm">
            Showing <strong>{filteredLectures.length}</strong> of {MOCK_RECORDED_LECTURES.length} lectures
          </div>
        </div>
      </div>

      {/* Lectures Table */}
      <DataTable
        headers={['ID', 'Lecture Title', 'Subject', 'Teacher', 'Class', 'Recorded Date', 'Duration', 'Views', 'Status', 'Actions']}
        data={filteredLectures}
        renderRow={(lecture) => (
          <tr key={lecture.id}>
            <td className="rl-font-bold rl-text-sm">#{lecture.id}</td>
            <td>
              <div className="flex-center rl-gap-1" style={{ justifyContent: 'flex-start' }}>
                <div className="rl-lecture-icon-small">
                  <BiPlayCircle size={16} />
                </div>
                <div>
                  <span className="rl-font-bold">{lecture.title}</span>
                  <div className="rl-text-muted rl-text-xs">{lecture.fileSize}</div>
                </div>
              </div>
            </td>
            <td><span className="rl-badge-light">{lecture.subject}</span></td>
            <td>
              <div className="flex-center rl-gap-1" style={{ justifyContent: 'flex-start' }}>
                <img src={`https://ui-avatars.com/api/?name=${lecture.teacher}&size=28&background=5d5fef&color=fff`} alt="" style={{ borderRadius: '50%', width: '28px', height: '28px' }} />
                <span className="rl-text-sm">{lecture.teacher}</span>
              </div>
            </td>
            <td><span className="rl-badge-light">{lecture.class}</span></td>
            <td className="rl-text-sm">
              {new Date(lecture.recordedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
            <td className="rl-text-sm">{lecture.duration}</td>
            <td className="rl-text-sm rl-font-bold">{lecture.views}</td>
            <td>
              <span className={`rl-status-pill rl-status-${lecture.status.toLowerCase()}`}>
                {lecture.status}
              </span>
            </td>
            <td>
              <div className="flex-center rl-gap-1" style={{ justifyContent: 'flex-start' }}>
                <button className="rl-btn-icon" title="Play"><BiPlay /></button>
                <button className="rl-btn-icon" title="Download"><BiDownload /></button>
                <button className="rl-btn-icon" title="Edit"><BiEditAlt /></button>
                <button className="rl-btn-icon rl-text-danger" title="Delete"><BiTrash /></button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Upload Lecture Modal */}
      {showModal && (
        <div className="rl-modal-overlay">
          <div className="rl-modal-content card rl-max-w-600">
            <div className="flex-between rl-mb-1">
              <h2>Upload Recorded Lecture</h2>
              <button className="rl-btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form className="grid rl-gap-1 rl-mt-1" onSubmit={(e) => e.preventDefault()}>
              <div className="rl-form-group">
                <label>Lecture Title</label>
                <input type="text" className="rl-form-control" placeholder="e.g. Algebra – Quadratic Equations" />
              </div>
              <div className="grid rl-grid-2 rl-gap-1">
                <div className="rl-form-group">
                  <label>Subject</label>
                  <select className="rl-form-control">
                    <option value="">Select Subject</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Computer Science</option>
                  </select>
                </div>
                <div className="rl-form-group">
                  <label>Teacher</label>
                  <select className="rl-form-control">
                    <option value="">Select Teacher</option>
                    <option>Arvind Verma</option>
                    <option>Sneha Sharma</option>
                    <option>Raj Kumar</option>
                    <option>Priya Singh</option>
                    <option>Vikram Patel</option>
                  </select>
                </div>
              </div>
              <div className="grid rl-grid-2 rl-gap-1">
                <div className="rl-form-group">
                  <label>Class</label>
                  <select className="rl-form-control">
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
                <div className="rl-form-group">
                  <label>Recorded Date</label>
                  <input type="date" className="rl-form-control" />
                </div>
              </div>
              <div className="rl-form-group">
                <label>Upload Video File</label>
                <div className="rl-upload-zone">
                  <BiPlayCircle size={36} color="#94a3b8" />
                  <p className="rl-text-muted rl-text-sm" style={{ margin: '0.5rem 0 0' }}>Drag & drop video file or <span className="rl-upload-link">Browse</span></p>
                  <p className="rl-text-muted rl-text-xs">Supports MP4, AVI, MKV (max 500MB)</p>
                </div>
              </div>
              <div className="rl-flex-end rl-gap-1 rl-mt-1">
                <button className="btn rl-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { alert('Lecture uploaded successfully!'); setShowModal(false); }}>
                  <BiPlus /> Upload Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .recorded-lecture-page { animation: fadeIn 0.5s ease; }

        /* Stats icon box */
        .rl-icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .rl-bg-primary-light { background: rgba(93, 95, 239, 0.1); }

        /* Lecture icon in table */
        .rl-lecture-icon-small { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #5d5fef, #7000ff); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* Status pills */
        .rl-status-pill { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.35rem; letter-spacing: 0.02em; }
        .rl-status-published { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .rl-status-processing { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; animation: processingPulse 2s infinite; }
        .rl-status-draft { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

        @keyframes processingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
          50% { box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.1); }
        }

        /* Upload zone */
        .rl-upload-zone { border: 2px dashed var(--border-light); border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: 0.2s; }
        .rl-upload-zone:hover { border-color: var(--primary); background: rgba(93, 95, 239, 0.03); }
        .rl-upload-link { color: var(--primary); font-weight: 600; cursor: pointer; }

        /* Table action icons */
        .rl-btn-icon { font-size: 1.2rem; color: var(--text-muted); padding: 0.3rem; border-radius: 6px; transition: 0.2s; cursor: pointer; background: none; border: none; }
        .rl-btn-icon:hover { background: var(--bg-light); color: var(--primary); }
        .rl-text-danger { color: var(--danger) !important; }
        .rl-text-danger:hover { color: #b91c1c !important; }

        /* Badges */
        .rl-badge-light { background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.8rem; font-weight: 500; }

        /* Modal */
        .rl-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
        .rl-max-w-600 { width: 100%; max-width: 640px; }
        .rl-modal-content { max-height: 90vh; overflow-y: auto; }

        /* Form overrides */
        .rl-form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .rl-form-group label { font-weight: 600; font-size: 0.85rem; color: var(--text-main); }
        .rl-form-control { padding: 0.65rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border-light); font-size: 0.9rem; transition: 0.2s; }
        .rl-form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.12); outline: none; }

        /* Grid helpers */
        .rl-grid-2 { grid-template-columns: 1fr 1fr; }
        .rl-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .rl-gap-1 { gap: 0.75rem; }
        .rl-mt-2 { margin-top: 1.5rem; }
        .rl-mb-2 { margin-bottom: 1.5rem; }
        .rl-mb-1 { margin-bottom: 0.75rem; }
        .rl-mb-0 { margin-bottom: 0; }
        .rl-mt-1 { margin-top: 0.75rem; }
        .rl-padding-1 { padding: 1.25rem; }
        .rl-text-xs { font-size: 0.75rem; }
        .rl-text-sm { font-size: 0.85rem; }
        .rl-text-muted { color: var(--text-muted); }
        .rl-font-bold { font-weight: 600; }
        .rl-flex-end { display: flex; justify-content: flex-end; align-items: center; }
        .rl-btn-outline { background: transparent; border: 1.5px solid var(--border-light); color: var(--text-main); }
        .rl-btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        .rl-shadow-sm { box-shadow: var(--shadow-sm); }
        .rl-breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }

        @media (max-width: 768px) {
          .rl-grid-2, .rl-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default RecordedTeacherLecture;
