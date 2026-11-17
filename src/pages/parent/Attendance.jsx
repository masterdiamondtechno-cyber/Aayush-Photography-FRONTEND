import React from 'react';
import { BiCalendarCheck, BiError } from 'react-icons/bi';
import { MOCK_STUDENT_ATTENDANCE_REPORT } from '../../data/mockData';

const ParentAttendance = () => {
  // Use the student's mock data safely
  const studentData = MOCK_STUDENT_ATTENDANCE_REPORT.find(s => s.studentId === 1001) || MOCK_STUDENT_ATTENDANCE_REPORT[0];

  return (
    <div className="dashboard-page animation-fade-in space-y-8">
      <div className="flex-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Ward Attendance</h1>
        <div className="flex-center gap-1">
           <span className="text-sm font-bold text-muted">Current Term: March 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div>
            <p className="text-muted text-sm font-bold">Total Days</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{studentData.totalDays}</h2>
          </div>
        </div>
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid #10b981' }}>
          <div>
            <p className="text-muted text-sm font-bold">Present Days</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{studentData.presentDays}</h2>
          </div>
        </div>
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div>
            <p className="text-muted text-sm font-bold">Absent Days</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{studentData.absentDays}</h2>
          </div>
        </div>
        <div className="card shadow-sm padding-1-5 flex-between" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div>
            <p className="text-muted text-sm font-bold">Percentage</p>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '2rem' }}>{studentData.percentage}%</h2>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card shadow-sm padding-1-5">
           <h3 className="mb-1 border-bottom pb-1">Attendance Calendar (March 2026)</h3>
           
           <style>{`
             .attendance-calendar {
               width: 100%;
               border: 1px solid #e2e8f0;
               border-radius: 0.5rem;
               overflow: hidden;
             }
             .calendar-header-row {
               display: grid;
               grid-template-columns: repeat(7, 1fr);
               background: #f8fafc;
               border-bottom: 1px solid #e2e8f0;
             }
             .calendar-weekday {
               padding: 0.75rem;
               text-align: center;
               font-weight: 600;
               color: #64748b;
               font-size: 0.85rem;
             }
             .calendar-days-grid {
               display: grid;
               grid-template-columns: repeat(7, 1fr);
             }
             .calendar-day-cell {
               aspect-ratio: 1;
               padding: 0.5rem;
               border-right: 1px solid #e2e8f0;
               border-bottom: 1px solid #e2e8f0;
               position: relative;
               display: flex;
               align-items: flex-start;
               justify-content: flex-end;
               font-size: 0.9rem;
               font-weight: 500;
               color: #334155;
               background: white;
             }
             .calendar-day-cell:nth-child(7n) { border-right: none; }
             .calendar-day-cell.empty { background: #f8fafc; }
             .calendar-day-cell.present { background: #ecfdf5; color: #065f46; }
             .calendar-day-cell.absent { background: #fef2f2; color: #991b1b; }
             .calendar-day-cell.holiday { background: #f1f5f9; color: #64748b; }
             
             .day-status-dot {
               position: absolute;
               bottom: 8px;
               left: 8px;
               width: 8px;
               height: 8px;
               border-radius: 50%;
             }
             .present .day-status-dot { background-color: #10b981; }
             .absent .day-status-dot { background-color: #ef4444; }
             .holiday .day-status-dot { background-color: #94a3b8; }
             
             .calendar-legend {
               display: flex;
               gap: 1rem;
               margin-top: 1rem;
               justify-content: center;
               font-size: 0.85rem;
             }
             .legend-item {
               display: flex;
               align-items: center;
               gap: 0.25rem;
             }
             .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
           `}</style>
 
           <div className="attendance-calendar">
             <div className="calendar-header-row">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                 <div key={day} className="calendar-weekday">{day}</div>
               ))} 
             </div>
             <div className="calendar-days-grid">
               {/* Empty cells for Feb (March 2026 starts on Sunday, so 0 empty cells) */}
               {Array.from({ length: 31 }, (_, i) => {
                 const date = i + 1;
                 const isSunday = (date - 1) % 7 === 0;
                 const isAbsent = date === 5 || date === 12;
                 
                 let statusClass = 'present';
                 if (isSunday) statusClass = 'holiday';
                 else if (isAbsent) statusClass = 'absent';
                 else if (date > 20) statusClass = ''; // Future dates (assuming today is March 20th)

                 return (
                   <div key={date} className={`calendar-day-cell ${statusClass}`}>
                     {date}
                     {statusClass && <div className="day-status-dot"></div>}
                   </div>
                 );
               })}
             </div>
           </div>
           
           <div className="calendar-legend">
             <div className="legend-item"><div className="legend-dot" style={{ background: '#10b981' }}></div> Present</div>
             <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }}></div> Absent</div>
             <div className="legend-item"><div className="legend-dot" style={{ background: '#94a3b8' }}></div> Holiday</div>
           </div>
        </div>
        <div className="card shadow-sm padding-1-5">
           <h3 className="mb-1 border-bottom pb-1">Recent Absences</h3>
           <ul className="grid gap-1 mt-1">
             <li className="flex-center gap-1 text-sm p-1" style={{ background: '#fef3c7', color: '#b45309', borderRadius: '0.5rem' }}>
               <BiError size={20} /> <strong>12 March 2026:</strong> Sick Leave
             </li>
             <li className="flex-center gap-1 text-sm p-1" style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem' }}>
               <BiError size={20} /> <strong>05 March 2026:</strong> Unexcused Absence
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentAttendance;
