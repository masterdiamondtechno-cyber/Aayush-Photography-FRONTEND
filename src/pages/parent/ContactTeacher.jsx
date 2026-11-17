import React, { useState } from 'react';
import { BiSend, BiUserCircle } from 'react-icons/bi';

const ParentContactTeacher = () => {
  const [messages, setMessages] = useState([
    { sender: 'teacher', text: 'Hello! Yogesh is doing very well in Class 10th Math.', time: '10:00 AM' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    setMessages([...messages, { sender: 'parent', text: currentMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setCurrentMessage('');
  };

  return (
    <div className="dashboard-page animation-fade-in space-y-8" style={{ height: 'calc(100vh - 120px)' }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>Contact Teacher</h1>
      
      <div className="grid h-100" style={{ gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
        {/* Contacts Sidebar */}
        <div className="card shadow-sm padding-1-5">
          <h3 className="border-bottom pb-1 mb-1" style={{ color: 'var(--text-dark)' }}>Class Teachers</h3>
          <div className="flex-center gap-1 p-1" style={{ background: '#f8fafc', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid var(--primary)' }}>
            <BiUserCircle size={40} color="var(--primary)" />
            <div>
              <p className="font-bold" style={{ margin: 0 }}>Arvind Verma</p>
              <p className="text-sm text-muted" style={{ margin: 0 }}>Mathematics</p>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="card shadow-sm flex-column">
          <div className="padding-1-5 border-bottom flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
             <BiUserCircle size={40} color="var(--primary)" />
             <div>
                <h3 style={{ margin: 0 }}>Chat with Arvind Verma</h3>
                <p className="text-sm text-muted text-success" style={{ margin: 0 }}>● Online</p>
             </div>
          </div>

          <div className="padding-1-5" style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-1 flex-column ${msg.sender === 'parent' ? 'items-end' : 'items-start'}`}>
                <div className="p-1 shadow-sm" style={{ 
                  background: msg.sender === 'parent' ? 'var(--primary)' : 'white', 
                  color: msg.sender === 'parent' ? 'white' : 'var(--text-dark)',
                  borderRadius: '1rem', 
                  maxWidth: '70%',
                  borderBottomRightRadius: msg.sender === 'parent' ? '0' : '1rem',
                  borderBottomLeftRadius: msg.sender === 'teacher' ? '0' : '1rem'
                }}>
                  {msg.text}
                </div>
                <span className="text-xs text-muted mt-05" style={{ alignSelf: msg.sender === 'parent' ? 'flex-end' : 'flex-start' }}>{msg.time}</span>
              </div>
            ))}
          </div>

          <form className="padding-1 border-top flex-center gap-1" onSubmit={handleSend}>
             <input type="text" className="form-control" placeholder="Type a message to the teacher..." value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} style={{ flex: 1 }} />
             <button type="submit" className="btn btn-primary flex-center gap-05"><BiSend /> Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentContactTeacher;
