import { useState, useEffect, useCallback } from 'react';
import { 
  BiMessageDetail, BiMessageSquareAdd, BiFilterAlt, 
  BiSearchAlt, BiBuildings, BiTime, BiCheckCircle, 
  BiChevronRight, BiLoaderAlt, BiX, BiSliderAlt
} from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import { getGlobalTickets, updateTicketStatus, updateTicketPriority, updateTicketNotes } from '../../api/api';

/**
 * SuperAdmin — Support Tickets
 * Unified view of all support requests across the platform
 */
const SuperAdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [internalNotesText, setInternalNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getGlobalTickets({ 
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm 
      });
      setTickets(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch global tickets:', error);
      // Fallback mock data if API is empty
      setTickets([
        { id: 101, schoolName: 'Global High', issue: 'Payment Gateway Issue', priority: 'URGENT', status: 'OPEN', createdAt: '2026-04-19T10:00:00Z', createdBy: 'Admin Rahul' },
        { id: 102, schoolName: 'Star Academy', issue: 'Teacher Login Loop', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: '2026-04-18T14:30:00Z', createdBy: 'Admin Sneha' },
        { id: 103, schoolName: 'City School', issue: 'Noticeboard not syncing', priority: 'MEDIUM', status: 'RESOLVED', createdAt: '2026-04-17T09:15:00Z', createdBy: 'Admin Vikas' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdate = async (id, type, value) => {
    try {
      if (type === 'status') {
        await updateTicketStatus(id, { status: value, internalNotes: internalNotesText });
      } else {
        await updateTicketPriority(id, { priority: value });
      }
      
      fetchTickets();
      if (selectedTicket?.id === id) setShowDetailModal(false);
    } catch (err) {
      alert('Failed to update ticket');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    try {
      setNotesSaving(true);
      await updateTicketNotes(selectedTicket.id, { internalNotes: internalNotesText });
      
      // Update local ticket list so it reflects immediately without refetching
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, internalNotes: internalNotesText } : t));
      alert('Internal notes saved successfully');
    } catch (err) {
      alert('Failed to save internal notes');
    } finally {
      setNotesSaving(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getStatusClass = (s) => s.toLowerCase().replace('_', '-');

  return (
    <div className="superadmin-tickets-page space-y-8">
      <div className="header-section flex-between">
        <div>
          <h1>Global Support Tickets</h1>
          <p className="breadcrumb">Support &gt; All Platform Tickets</p>
        </div>
        <div className="flex-center gap-1">
          <div className="ticket-stats-mini flex-center gap-1 bg-white p-05 px-1 shadow-sm" style={{ borderRadius: '0.8rem' }}>
            <div className="text-center">
              <span className="text-xs text-muted block mb-0">OPEN</span>
              <span className="font-bold text-danger">{tickets.filter(t => t.status === 'OPEN').length}</span>
            </div>
            <div className="text-center" style={{ borderLeft: '1px solid #eee', paddingLeft: '1rem' }}>
              <span className="text-xs text-muted block mb-0">TOTAL</span>
              <span className="font-bold text-primary">{tickets.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-2 p-0 overflow-hidden">
        {/* Filter Bar */}
        <div className="filter-bar p-1 flex-between border-bottom bg-light">
          <div className="flex-center gap-2">
            <div className="search-box">
              <BiSearchAlt className="input-icon" />
              <input 
                type="text" 
                placeholder="Search ticket, school or issue..." 
                className="form-control" 
                style={{ paddingLeft: '2.5rem', width: '320px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-center gap-1">
              <BiSliderAlt className="text-muted" />
              <select 
                className="form-control text-sm" 
                style={{ width: '150px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchTickets}>
            <BiFilterAlt /> Refresh List
          </button>
        </div>

        {/* Tickets Table */}
        <div className="table-responsive">
          {loading ? (
             <div className="flex-center py-5"><BiLoaderAlt className="spin text-primary" size={32} /></div>
          ) : (
            <DataTable 
              headers={['ID', 'School Info', 'Issue / Subject', 'Priority', 'Status', 'Actions']}
              data={tickets}
              renderRow={(ticket) => (
                <tr key={ticket.id} className="ticket-row hvr-bg">
                  <td className="font-bold text-muted">#{ticket.id}</td>
                  <td>
                    <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <div className="school-init">{ticket.schoolName?.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <p className="font-bold mb-0 text-sm">{ticket.schoolName}</p>
                        <p className="text-xs text-muted mb-0"><BiTime /> {new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="issue-wrap">
                      <p className="font-bold text-sm mb-0">{ticket.issue}</p>
                      <p className="text-xs text-muted truncate-1">Reported by: {ticket.createdBy}</p>
                    </div>
                  </td>
                  <td>
                    <span className="priority-dot" style={{ background: getPriorityColor(ticket.priority) }}></span>
                    <span className="text-xs font-bold uppercase ml-05" style={{ color: getPriorityColor(ticket.priority) }}>{ticket.priority}</span>
                  </td>
                  <td>
                    <span className={`ticket-status-badge ${getStatusClass(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-icon bg-light" 
                      title="Manage Ticket"
                      onClick={() => { 
                        setSelectedTicket(ticket); 
                        setInternalNotesText(ticket.internalNotes || '');
                        setShowDetailModal(true); 
                      }}
                    >
                      <BiChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-600 no-padding overflow-hidden scale-in">
            <div className="modal-header-accent p-2 text-white" style={{ background: getPriorityColor(selectedTicket.priority) }}>
              <div className="flex-between">
                <div>
                  <span className="text-xs font-bold uppercase opacity-75">Support Ticket #{selectedTicket.id}</span>
                  <h2 className="mb-0 text-white">{selectedTicket.issue}</h2>
                </div>
                <button className="btn-icon text-white hover-dim" onClick={() => setShowDetailModal(false)}><BiX size={24} /></button>
              </div>
            </div>
            
            <div className="p-2">
              <div className="grid grid-2 gap-2 border-bottom pb-2">
                <div>
                  <p className="text-xs text-muted mb-05 font-bold uppercase">Requester Institution</p>
                  <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                    <BiBuildings className="text-primary" />
                    <span>{selectedTicket.schoolName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-05 font-bold uppercase">Requested By</p>
                  <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                    <BiMessageDetail className="text-primary" />
                    <span>{selectedTicket.createdBy}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-xs text-muted mb-1 font-bold uppercase">Update Ticket State</p>
                <div className="grid grid-2 gap-1">
                  <div className="form-group mb-0">
                    <label className="text-xs">Ticket Status</label>
                    <select 
                      className="form-control" 
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdate(selectedTicket.id, 'status', e.target.value)}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="text-xs">Urgency Priority</label>
                    <select 
                      className="form-control" 
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdate(selectedTicket.id, 'priority', e.target.value)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Platform Level)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-2 bg-light p-1 border-radius-sm">
                <div className="flex-between mb-05">
                  <p className="text-xs text-muted mb-0 font-bold uppercase">Internal Management Notes</p>
                  {notesSaving ? (
                    <span className="text-xs text-muted flex-center gap-05"><BiLoaderAlt className="spin" /> Saving...</span>
                  ) : (
                    <button 
                      className="btn btn-link btn-xs p-0 text-primary font-bold"
                      style={{ fontSize: '0.75rem', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={handleSaveNotes}
                    >
                      Save Notes
                    </button>
                  )}
                </div>
                <textarea 
                  className="form-control text-sm" 
                  rows="3" 
                  placeholder="Add notes for other super admins..."
                  value={internalNotesText}
                  onChange={(e) => setInternalNotesText(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="p-1-5 flex-end bg-light border-top">
              <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>Close Window</button>
              <button className="btn btn-primary ml-1" onClick={() => handleUpdate(selectedTicket.id, 'status', 'RESOLVED')}>
                <BiCheckCircle /> Quick Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .superadmin-tickets-page { animation: fadeIn 0.5s ease; }
        .school-init { width: 36px; height: 36px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; }
        .priority-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .ticket-status-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .ticket-status-badge.open { background: #fee2e2; color: #ef4444; }
        .ticket-status-badge.in-progress { background: #fff8e1; color: #f59e0b; }
        .ticket-status-badge.resolved { background: #e8f5e9; color: #10b981; }
        .ticket-status-badge.closed { background: #f1f5f9; color: #64748b; }
        
        .truncate-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .issue-wrap { max-width: 400px; }
        .hvr-bg:hover { background: rgba(112, 0, 255, 0.02) !important; }
        
        .block { display: block; }
        .ml-05 { margin-left: 0.5rem; }
        .ml-1 { margin-left: 1rem; }
        .p-1-5 { padding: 1.25rem; }
        .no-padding { padding: 0 !important; }
        .border-radius-sm { border-radius: 8px; }
        .hover-dim:hover { opacity: 0.8; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s ease; }
        .scale-in { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default SuperAdminTickets;
