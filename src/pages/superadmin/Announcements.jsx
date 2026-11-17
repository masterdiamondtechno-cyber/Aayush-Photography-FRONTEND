import { useState, useEffect } from 'react';
import { 
  BiMessageSquareAdd, BiSend, BiUserVoice, 
  BiBuildings, BiUser, BiBell, BiTime, BiTrash
} from 'react-icons/bi';
import { 
  createGlobalAnnouncement, 
  getAllGlobalAnnouncements, 
  deleteGlobalAnnouncement 
} from '../../api/api';

const SuperAdminAnnouncements = () => {
  const [target, setTarget] = useState('ALL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await getAllGlobalAnnouncements();
      if (response && response.status === 'SUCCESS') {
        setAnnouncements(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const response = await createGlobalAnnouncement({
        title: subject,
        message: message,
        targetAudience: target
      });
      if (response && response.status === 'SUCCESS') {
        alert('Broadcast sent successfully!');
        setSubject('');
        setMessage('');
        fetchAnnouncements();
      } else {
        alert(response.message || 'Failed to send broadcast');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error sending broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const response = await deleteGlobalAnnouncement(id);
      if (response && response.status === 'SUCCESS') {
        fetchAnnouncements();
      } else {
        alert(response.message || 'Failed to delete announcement');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error deleting announcement');
    }
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const targetMapping = {
    'ALL': 'Everyone',
    'ADMINS': 'School Admins',
    'OWNERS': 'Franchise Owners'
  };

  return (
    <div className="superadmin-announcements space-y-8">
      <div className="header-section">
        <h1>Global Announcements</h1>
        <p className="breadcrumb">Communication &gt; Broadcast System</p>
      </div>

      <div className="grid grid-2 gap-2 mt-2">
        {/* Composer */}
        <div className="card shadow-sm">
          <h3 className="mb-1-5 flex-center gap-05" style={{ justifyContent: 'flex-start' }}>
            <BiMessageSquareAdd className="text-primary" /> Create New Broadcast
          </h3>
          <form onSubmit={handleBroadcast}>
            <div className="form-group">
              <label>Target Audience</label>
              <div className="flex-center gap-1 mt-05">
                <button 
                  type="button"
                  className={`btn btn-sm ${target === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTarget('ALL')}
                >
                  <BiBell /> Everyone
                </button>
                <button 
                  type="button"
                  className={`btn btn-sm ${target === 'ADMINS' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTarget('ADMINS')}
                >
                  <BiBuildings /> School Admins
                </button>
                <button 
                  type="button"
                  className={`btn btn-sm ${target === 'OWNERS' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTarget('OWNERS')}
                >
                  <BiUser /> Owners
                </button>
              </div>
            </div>

            <div className="form-group mt-1-5">
              <label>Broadcast Subject</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. System Maintenance Update"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="form-group mt-1">
              <label>Message Content</label>
              <textarea 
                className="form-control" 
                rows="6" 
                placeholder="Type your platform-wide message here..."
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-2" disabled={sending}>
              {sending ? 'Broadcasting...' : <><BiSend /> Send Announcement</>}
            </button>
          </form>
        </div>

        {/* Recent Broadcasts */}
        <div className="card shadow-sm bg-light">
          <h3 className="mb-1-5 text-dark font-semibold">Recent Activity</h3>
          <div className="broadcast-history">
            {loading && announcements.length === 0 ? (
              <div className="text-center p-3 text-muted">
                <p>Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="empty-state text-center p-3 text-muted">
                <BiBell style={{ fontSize: '2.5rem', opacity: 0.5 }} className="mb-1 text-primary animate-pulse" />
                <p className="mb-0 font-medium">No announcements broadcasted yet</p>
                <span className="text-xs">Create a new broadcast to reach your platform audience</span>
              </div>
            ) : (
              announcements.map(b => (
                <div key={b.id} className="broadcast-item card mb-1 flex-between p-1 shadow-xs hover-card">
                  <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', flex: 1 }}>
                    <div className="icon-wrap bg-primary-light text-primary"><BiUserVoice /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="mb-0 text-sm font-semibold text-truncate" title={b.title}>{b.title}</h4>
                      <div className="text-xs text-muted mt-02 flex-center gap-05" style={{ justifyContent: 'flex-start' }}>
                        <span>To: {targetMapping[b.targetAudience] || b.targetAudience}</span>
                        <span>•</span>
                        <span className="text-truncate" title={b.message}>{b.message}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-center gap-1 ml-1" style={{ flexShrink: 0 }}>
                    <span className="text-xs text-muted flex-center gap-02">
                      <BiTime /> {formatTime(b.sentAt || b.createdAt)}
                    </span>
                    <button 
                      onClick={() => handleDelete(b.id)} 
                      className="btn-delete"
                      title="Delete Announcement"
                    >
                      <BiTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .icon-wrap { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .text-sm { font-size: 0.875rem; }
        .mb-1-5 { margin-bottom: 1.5rem; }
        .hover-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .text-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mt-02 {
          margin-top: 0.2rem;
        }
        .font-semibold {
          font-weight: 600;
        }
        .font-medium {
          font-weight: 500;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem !important;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          border: 1px dashed rgba(0, 0, 0, 0.08);
        }
        .btn-delete {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all 0.2s ease;
          opacity: 0.6;
        }
        .btn-delete:hover {
          background-color: rgba(239, 68, 68, 0.1);
          opacity: 1;
          transform: scale(1.1);
        }
        .ml-1 {
          margin-left: 1rem;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminAnnouncements;
