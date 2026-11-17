import { useState } from 'react';
import { BiSearch, BiSend, BiPlus, BiX, BiTime, BiCheckDouble, BiCheck, BiEnvelope, BiMessageDetail, BiMessageRoundedDots, BiDotsVerticalRounded } from 'react-icons/bi';

/**
 * Owner — Messages Page
 * Owner ↔ School Admin messaging system
 * Features: Conversation list, Chat panel, Compose, Priority tags, Unread badges
 */

// =============== MOCK DATA ===============
const mockConversations = [
  {
    id: 1,
    adminName: 'Dr. Rajesh Sharma',
    school: 'Sunrise Public School',
    avatar: 'RS',
    lastMessage: 'Fee collection report is ready for review.',
    lastTime: '10:30 AM',
    unread: 2,
    priority: 'Normal',
    messages: [
      { id: 1, sender: 'admin', text: 'Good morning sir, I wanted to discuss the upcoming fee structure changes.', time: '9:15 AM', status: 'read' },
      { id: 2, sender: 'owner', text: 'Good morning! Yes, please share the proposed changes.', time: '9:20 AM', status: 'read' },
      { id: 3, sender: 'admin', text: 'We are planning to increase the tuition fee by 10% for the next academic year. Here are the details...', time: '9:45 AM', status: 'read' },
      { id: 4, sender: 'owner', text: 'I see. Send me the complete breakdown with justification for the increase.', time: '10:00 AM', status: 'read' },
      { id: 5, sender: 'admin', text: 'Fee collection report is ready for review.', time: '10:30 AM', status: 'delivered' },
    ],
  },
  {
    id: 2,
    adminName: 'Mrs. Anita Deshmukh',
    school: 'Green Valley International',
    avatar: 'AD',
    lastMessage: 'We need urgent approval for the science lab equipment purchase.',
    lastTime: '9:45 AM',
    unread: 1,
    priority: 'Urgent',
    messages: [
      { id: 1, sender: 'admin', text: 'Sir, the science lab needs new equipment for the upcoming practical exams.', time: '9:00 AM', status: 'read' },
      { id: 2, sender: 'owner', text: 'What is the estimated budget?', time: '9:15 AM', status: 'read' },
      { id: 3, sender: 'admin', text: 'We need urgent approval for the science lab equipment purchase.', time: '9:45 AM', status: 'delivered' },
    ],
  },
  {
    id: 3,
    adminName: 'Mr. Vikram Patil',
    school: 'Modern Academy',
    avatar: 'VP',
    lastMessage: 'Teachers training program schedule has been finalized.',
    lastTime: 'Yesterday',
    unread: 0,
    priority: 'Normal',
    messages: [
      { id: 1, sender: 'admin', text: 'We have finalized the teacher training schedule for next month.', time: '3:00 PM', status: 'read' },
      { id: 2, sender: 'owner', text: 'Great, please share the schedule.', time: '3:30 PM', status: 'read' },
      { id: 3, sender: 'admin', text: 'Teachers training program schedule has been finalized.', time: '4:00 PM', status: 'read' },
    ],
  },
  {
    id: 4,
    adminName: 'Dr. Sunil Kulkarni',
    school: 'Heritage School',
    avatar: 'SK',
    lastMessage: 'Annual day event budget proposal attached.',
    lastTime: 'Yesterday',
    unread: 0,
    priority: 'Important',
    messages: [
      { id: 1, sender: 'admin', text: 'Sir, please find the annual day event budget proposal.', time: '11:00 AM', status: 'read' },
      { id: 2, sender: 'owner', text: 'Received. I will review and get back to you by tomorrow.', time: '11:30 AM', status: 'read' },
      { id: 3, sender: 'admin', text: 'Annual day event budget proposal attached.', time: '2:00 PM', status: 'read' },
    ],
  },
  {
    id: 5,
    adminName: 'Mr. Arun Mehta',
    school: 'National Public School',
    avatar: 'AM',
    lastMessage: 'Student enrollment numbers for this quarter look promising.',
    lastTime: '2 days ago',
    unread: 0,
    priority: 'Normal',
    messages: [
      { id: 1, sender: 'owner', text: 'How are the enrollment numbers looking this quarter?', time: '10:00 AM', status: 'read' },
      { id: 2, sender: 'admin', text: 'Student enrollment numbers for this quarter look promising.', time: '10:30 AM', status: 'read' },
    ],
  },
];

const Message = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConvo, setSelectedConvo] = useState(mockConversations[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', message: '', priority: 'Normal' });

  // Filter conversations
  const filteredConvos = conversations.filter(c =>
    c.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  // Send message
  const handleSend = () => {
    if (!newMessage.trim()) return;
    const updatedConvos = conversations.map(c => {
      if (c.id === selectedConvo.id) {
        const updatedMessages = [...c.messages, {
          id: c.messages.length + 1,
          sender: 'owner',
          text: newMessage,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        }];
        return { ...c, messages: updatedMessages, lastMessage: newMessage, lastTime: 'Just now', unread: 0 };
      }
      return c;
    });
    setConversations(updatedConvos);
    setSelectedConvo(updatedConvos.find(c => c.id === selectedConvo.id));
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Select convo and mark as read
  const selectConvo = (convo) => {
    setSelectedConvo(convo);
    setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return { bg: '#fce4ec', color: '#c62828' };
      case 'Important': return { bg: '#fff3e0', color: '#e65100' };
      default: return { bg: '#e8f5e9', color: '#388e3c' };
    }
  };

  return (
    <div className="owner-messages-page space-y-8">
      {/* Header */}
      <div className="header-section flex-between">
        <div>
          <h1>Messages</h1>
          <p className="breadcrumb">Owner Panel &gt; Messages {totalUnread > 0 && <span className="unread-total">{totalUnread} unread</span>}</p>
        </div>
        <button className="btn btn-primary flex-center gap-1" onClick={() => setShowCompose(true)}>
          <BiPlus /> Compose
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className="chat-container" style={{ marginTop: '2rem' }}>
        {/* Left Panel — Conversation List */}
        <div className="convo-list-panel card" style={{ padding: 0 }}>
          <div className="convo-search" style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ position: 'relative' }}>
              <BiSearch style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          <div className="convo-list">
            {filteredConvos.map(convo => (
              <div
                key={convo.id}
                className={`convo-item ${selectedConvo?.id === convo.id ? 'active' : ''} ${convo.unread > 0 ? 'has-unread' : ''}`}
                onClick={() => selectConvo(convo)}
              >
                <div className="convo-avatar" style={{ background: convo.unread > 0 ? 'linear-gradient(135deg, #5d5fef, #7000ff)' : '#e2e8f0' }}>
                  {convo.avatar}
                </div>
                <div className="convo-info">
                  <div className="flex-between">
                    <span className="convo-name">{convo.adminName}</span>
                    <span className="convo-time">{convo.lastTime}</span>
                  </div>
                  <div className="convo-school">{convo.school}</div>
                  <div className="convo-preview">{convo.lastMessage}</div>
                </div>
                <div className="convo-badges">
                  {convo.unread > 0 && <span className="unread-badge">{convo.unread}</span>}
                  {convo.priority !== 'Normal' && (
                    <span className="priority-tag" style={{ background: getPriorityColor(convo.priority).bg, color: getPriorityColor(convo.priority).color }}>
                      {convo.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Chat Messages */}
        <div className="chat-panel card" style={{ padding: 0 }}>
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                  <div className="convo-avatar-sm" style={{ background: 'linear-gradient(135deg, #5d5fef, #7000ff)' }}>
                    {selectedConvo.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{selectedConvo.adminName}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{selectedConvo.school}</div>
                  </div>
                </div>
                <div className="flex-center gap-1">
                  {selectedConvo.priority !== 'Normal' && (
                    <span className="priority-tag" style={{ background: getPriorityColor(selectedConvo.priority).bg, color: getPriorityColor(selectedConvo.priority).color }}>
                      {selectedConvo.priority}
                    </span>
                  )}
                  <button className="btn-icon"><BiDotsVerticalRounded /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {selectedConvo.messages.map(msg => (
                  <div key={msg.id} className={`message ${msg.sender}`}>
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                      <div className="message-meta">
                        <span className="message-time"><BiTime style={{ fontSize: '0.7rem' }} /> {msg.time}</span>
                        {msg.sender === 'owner' && (
                          <span className="message-status">
                            {msg.status === 'read' ? <BiCheckDouble style={{ color: '#0ea5e9' }} /> :
                              msg.status === 'delivered' ? <BiCheckDouble /> : <BiCheck />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="chat-input">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ flex: 1, borderRadius: '24px', padding: '0.75rem 1.2rem' }}
                />
                <button className="send-btn" onClick={handleSend} disabled={!newMessage.trim()}>
                  <BiSend />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <BiMessageRoundedDots style={{ fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>Select a conversation</h3>
              <p className="text-muted">Choose from your existing conversations or start a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== COMPOSE MODAL ===== */}
      {showCompose && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '550px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2>New Message</h2>
              <button className="btn-icon" onClick={() => setShowCompose(false)}><BiX style={{ fontSize: '1.2rem' }} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowCompose(false); }}>
              <div className="form-group">
                <label>To (School Admin)</label>
                <select className="form-control" value={composeData.to} onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}>
                  <option value="">Select a school admin...</option>
                  {mockConversations.map(c => (
                    <option key={c.id} value={c.adminName}>{c.adminName} — {c.school}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={composeData.priority} onChange={(e) => setComposeData(prev => ({ ...prev, priority: e.target.value }))}>
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" className="form-control" placeholder="Message subject..." value={composeData.subject} onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea className="form-control" placeholder="Type your message..." rows="5" style={{ resize: 'vertical' }} value={composeData.message} onChange={(e) => setComposeData(prev => ({ ...prev, message: e.target.value }))}></textarea>
              </div>
              <div className="flex-end gap-1" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCompose(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><BiSend /> Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .owner-messages-page { animation: fadeIn 0.5s ease; }
        .unread-total { background: var(--danger); color: white; padding: 0.15rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem; }

        /* Chat Layout */
        .chat-container { display: grid; grid-template-columns: 360px 1fr; gap: 1.5rem; height: calc(100vh - 280px); min-height: 500px; }

        /* Left Panel */
        .convo-list-panel { overflow: hidden; display: flex; flex-direction: column; }
        .convo-list { overflow-y: auto; flex: 1; }

        .convo-item {
          display: flex; align-items: flex-start; gap: 0.8rem;
          padding: 1rem 1.2rem; cursor: pointer;
          border-bottom: 1px solid var(--border-light);
          transition: all 0.2s; position: relative;
        }
        .convo-item:hover { background: rgba(93, 95, 239, 0.04); }
        .convo-item.active { background: rgba(93, 95, 239, 0.08); border-left: 3px solid var(--primary); }
        .convo-item.has-unread { background: rgba(93, 95, 239, 0.03); }

        .convo-avatar {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 0.85rem;
        }
        .convo-avatar-sm {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 0.8rem;
        }

        .convo-info { flex: 1; min-width: 0; }
        .convo-name { font-weight: 700; font-size: 0.9rem; }
        .convo-school { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem; }
        .convo-preview { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.3rem; }
        .convo-time { font-size: 0.7rem; color: var(--text-muted); }

        .convo-badges { position: absolute; right: 1rem; bottom: 0.8rem; display: flex; gap: 0.3rem; align-items: center; }
        .unread-badge { background: var(--primary); color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
        .priority-tag { padding: 0.1rem 0.5rem; border-radius: 1rem; font-size: 0.65rem; font-weight: 600; }

        /* Right Panel */
        .chat-panel { display: flex; flex-direction: column; overflow: hidden; }
        .chat-header {
          padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-light);
          display: flex; align-items: center; justify-content: space-between;
        }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1.5rem;
          display: flex; flex-direction: column; gap: 0.8rem;
          background: #f8fafc;
        }

        .message { display: flex; }
        .message.admin { justify-content: flex-start; }
        .message.owner { justify-content: flex-end; }

        .message-bubble {
          max-width: 70%; padding: 0.8rem 1.1rem;
          border-radius: 16px; font-size: 0.9rem; line-height: 1.5;
        }
        .message.admin .message-bubble {
          background: white; border: 1px solid var(--border-light);
          border-bottom-left-radius: 4px;
        }
        .message.owner .message-bubble {
          background: linear-gradient(135deg, #5d5fef, #7000ff);
          color: white; border-bottom-right-radius: 4px;
        }

        .message-meta {
          display: flex; align-items: center; gap: 0.4rem; margin-top: 0.4rem;
          font-size: 0.7rem; opacity: 0.7;
        }
        .message-time { display: flex; align-items: center; gap: 0.2rem; }
        .message-status { display: flex; align-items: center; }

        .chat-input {
          padding: 1rem 1.5rem; border-top: 1px solid var(--border-light);
          display: flex; gap: 0.8rem; align-items: center;
        }
        .send-btn {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--primary); color: white; border: none;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(93, 95, 239, 0.3);
        }
        .send-btn:hover { transform: scale(1.05); background: var(--primary-dark); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .no-chat-selected {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 2rem;
        }

        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; }

        .gap-1 { gap: 1rem; }
        .gap-2 { gap: 1.5rem; }
        .flex-end { display: flex; justify-content: flex-end; }

        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; color: #374151; }
        .form-control { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid var(--border-light); border-radius: 8px; font-size: 0.9rem; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(93,95,239,0.15); outline: none; }

        .btn-outline { background: white; border: 1px solid var(--border-light); color: var(--text-main); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.2s; }
        .btn-outline:hover { background: #f1f5f9; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 0.4rem; border-radius: 6px; font-size: 1.1rem; color: var(--text-muted); transition: 0.2s; }
        .btn-icon:hover { background: rgba(93,95,239,0.1); color: var(--primary); }

        @media (max-width: 900px) {
          .chat-container { grid-template-columns: 1fr; height: auto; }
          .convo-list-panel { max-height: 300px; }
        }
      `}</style>
    </div>
  );
};

export default Message;
