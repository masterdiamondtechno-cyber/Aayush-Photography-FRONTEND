import React, { useState, useEffect } from 'react';
import { 
  BiTime, 
  BiUser, 
  BiMap, 
  BiCalendar, 
  BiChevronLeft, 
  BiChevronRight,
  BiBookOpen,
  BiTable
} from 'react-icons/bi';
import { getStudentTimetable } from '../../api/api';


const getStoredValue = (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

const parseJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch { return null; }
};

const toNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

/**
 * 2026 India Gazetted Public Holidays (YYYY-MM-DD)
 * Source: Government of India official gazette
 */
const INDIA_PUBLIC_HOLIDAYS_2026 = new Set([
  '2026-01-26', // Republic Day
  '2026-03-04', // Holi
  '2026-03-21', // Id-ul-Fitr
  '2026-03-26', // Rama Navami
  '2026-03-31', // Mahavir Jayanti
  '2026-04-03', // Good Friday
  '2026-05-01', // Buddha Purnima
  '2026-05-27', // Id-ul-Zuha (Bakrid)
  '2026-06-26', // Muharram
  '2026-08-15', // Independence Day
  '2026-08-26', // Id-e-Milad
  '2026-09-04', // Janmashtami
  '2026-10-02', // Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-08', // Diwali
  '2026-11-24', // Guru Nanak Jayanti
  '2026-12-25', // Christmas
]);

/** Check if a date (YYYY-MM-DD) is a Sunday or a gazetted public holiday */
const isHoliday = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 || INDIA_PUBLIC_HOLIDAYS_2026.has(dateStr);
};

/** Get holiday name for display */
const getHolidayName = (dateStr) => {
  if (new Date(dateStr).getDay() === 0) return 'Sunday';
  const names = {
    '2026-01-26': 'Republic Day', '2026-03-04': 'Holi',
    '2026-03-21': 'Id-ul-Fitr', '2026-03-26': 'Rama Navami',
    '2026-03-31': 'Mahavir Jayanti', '2026-04-03': 'Good Friday',
    '2026-05-01': 'Buddha Purnima', '2026-05-27': 'Id-ul-Zuha (Bakrid)',
    '2026-06-26': 'Muharram', '2026-08-15': 'Independence Day',
    '2026-08-26': 'Id-e-Milad', '2026-09-04': 'Janmashtami',
    '2026-10-02': 'Gandhi Jayanti', '2026-10-20': 'Dussehra',
    '2026-11-08': 'Diwali', '2026-11-24': 'Guru Nanak Jayanti',
    '2026-12-25': 'Christmas',
  };
  return names[dateStr] || 'Public Holiday';
};

const getSubjectColor = (subjectName) => {
  if (!subjectName) return {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    text: '#64748b',
    border: '#cbd5e1',
    light: '#f8fafc'
  };
  const name = subjectName.trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const presets = [
    { bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', text: '#4f46e5', border: '#a5b4fc', light: '#eef2ff' }, // Indigo
    { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', text: '#059669', border: '#6ee7b7', light: '#ecfdf5' }, // Emerald
    { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', text: '#7c3aed', border: '#d8b4fe', light: '#f9f5ff' }, // Purple/Violet
    { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#b45309', border: '#fcd34d', light: '#fffbeb' }, // Amber
    { bg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', text: '#e11d48', border: '#fda4af', light: '#fff1f2' }, // Rose
    { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', text: '#0284c7', border: '#7dd3fc', light: '#f0f9ff' }, // Sky
    { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', text: '#ea580c', border: '#fed7aa', light: '#fff7ed' }, // Orange
    { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', text: '#0891b2', border: '#67e8f9', light: '#f0fdfa' }, // Cyan
  ];
  return presets[Math.abs(hash) % presets.length];
};

const Timetable = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('day'); // 'day' or 'week'
  const [schedule, setSchedule] = useState([]);
  const [fullWeekData, setFullWeekData] = useState([]);
  const [dayStatus, setDayStatus] = useState('normal');
  const [holidayName, setHolidayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto refresh timer for class progress
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTimetable = async () => {
      setLoading(true);
      setError('');
      setDayStatus('normal');
      setHolidayName('');

      // Client-side holiday check
      if (isHoliday(selectedDate) && viewType === 'day') {
        setSchedule([]);
        setDayStatus('holiday');
        setHolidayName(getHolidayName(selectedDate));
        setLoading(false);
        return;
      }

      const jwt = parseJwtPayload(getStoredValue('token'));
      const academicYearId = toNumber(getStoredValue('academicYearId') || jwt?.ayi);
      const schoolId = toNumber(getStoredValue('schoolId') || jwt?.sid);
      const studentId = toNumber(getStoredValue('studentId') || getStoredValue('userId') || jwt?.uid);

      if (!academicYearId || !schoolId || !studentId) {
        setError('Session data missing (academicYearId, schoolId, or studentId)');
        setLoading(false);
        return;
      }

      try {
        const payload = {
          studentId,
          schoolId,
          academicYearId,
          type: 'week',
          date: selectedDate
        };

        console.log('[Timetable] Fetching with payload:', payload);
        const response = await getStudentTimetable(payload);

        if (!isMounted) return;

        if (response?.status === 'SUCCESS' || response?.status === 'success' || response?.code === 200) {
          const apiData = response.data || {};
          let targetSchedule = [];
          let weekDays = [];

          if (Array.isArray(apiData.days)) {
            weekDays = apiData.days;
            const dayRecord = apiData.days.find(d => d.date === selectedDate);
            console.log('[Timetable] Matching dayRecord for', selectedDate, ':', dayRecord);
            if (dayRecord && Array.isArray(dayRecord.schedule)) {
              targetSchedule = dayRecord.schedule;
            }
          } else if (Array.isArray(apiData)) {
            targetSchedule = apiData;
          } else if (Array.isArray(response.data)) {
            targetSchedule = response.data;
          }

          console.log('[Timetable] Setting schedule state to:', targetSchedule);
          setSchedule(targetSchedule);
          setFullWeekData(weekDays);
        } else {
          setError(response?.message || 'Failed to fetch timetable');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || err.message || 'An error occurred');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTimetable();
    return () => { isMounted = false; };
  }, [selectedDate, viewType, tick]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const shiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getOngoingClass = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate !== todayStr || !schedule || schedule.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const item of schedule) {
      if (item.type?.toLowerCase() === 'break' || item.isBreak) continue;
      const startStr = item.startTime;
      const endStr = item.endTime;
      if (!startStr || !endStr) continue;

      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        const totalDuration = endMinutes - startMinutes;
        const elapsed = currentMinutes - startMinutes;
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
        const minutesLeft = endMinutes - currentMinutes;

        return {
          ...item,
          progressPercent,
          minutesLeft
        };
      }
    }
    return null;
  };

  // Compile unique time slots for the weekly table grid rows
  const getUniqueTimeSlots = () => {
    const timeSlots = [];
    const seen = new Set();
    
    fullWeekData.forEach(day => {
      if (Array.isArray(day.schedule)) {
        day.schedule.forEach(slot => {
          const start = slot.startTime || slot.time || '';
          const end = slot.endTime || '';
          if (start && end) {
            const key = `${start}-${end}`;
            if (!seen.has(key)) {
              seen.add(key);
              timeSlots.push({
                start,
                end,
                isBreak: slot.isBreak || slot.type?.toLowerCase() === 'break'
              });
            }
          }
        });
      }
    });
    
    // Sort chronologically by start time
    timeSlots.sort((a, b) => a.start.localeCompare(b.start));
    return timeSlots;
  };

  const ongoingClass = getOngoingClass();
  const uniqueTimeSlots = getUniqueTimeSlots();

  return (
    <div className="student-page-container fade-in student-timetable-wrapper space-y-8">
      {/* Embedded Styled CSS */}
      <style>{`
        .student-timetable-wrapper {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .student-title-icon-box {
          background: rgba(108, 92, 231, 0.1);
          color: #6C5CE7;
          padding: 0.65rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          font-size: 1.5rem;
        }

        .timetable-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .view-toggle-group {
          display: flex;
          background: #f1f5f9;
          padding: 0.3rem;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
        }

        .view-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.3rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .view-toggle-btn.active {
          background: white;
          color: #6C5CE7;
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.12);
        }

        .date-navigator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.25rem 0.5rem;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
        }

        .date-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #64748b;
          font-size: 1.25rem;
          transition: all 0.2s;
        }

        .date-nav-btn:hover {
          background: #e2e8f0;
          color: #6C5CE7;
        }

        .date-picker-input {
          border: none;
          outline: none;
          font-weight: 750;
          color: #1e293b;
          font-family: inherit;
          padding: 0 0.5rem;
          cursor: pointer;
          background: transparent;
          font-size: 0.95rem;
        }

        .btn-today {
          padding: 0.5rem 1.1rem;
          background: rgba(108, 92, 231, 0.08);
          color: #6C5CE7;
          font-weight: 700;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .btn-today:hover {
          background: #6C5CE7;
          color: white;
        }

        /* Ongoing Class Hero Panel */
        .student-ongoing-hero {
          background: linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%);
          border-radius: 24px;
          padding: 1.75rem 2rem;
          color: white;
          box-shadow: 0 10px 30px rgba(108, 92, 231, 0.2);
        }

        .student-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .student-pulse-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          background: rgba(255,255,255,0.18);
          padding: 0.35rem 0.85rem;
          border-radius: 30px;
          letter-spacing: 0.05em;
        }

        .student-pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 8px #10b981;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }

        .student-rem-badge {
          font-size: 0.85rem;
          font-weight: 700;
          background: rgba(0,0,0,0.12);
          padding: 0.35rem 0.85rem;
          border-radius: 10px;
        }

        .student-hero-subject {
          font-family: 'Lexend', sans-serif;
          font-size: 1.8rem;
          font-weight: 850;
          margin-bottom: 0.45rem;
        }

        .student-hero-meta-row {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .student-hero-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          opacity: 0.95;
        }

        .student-hero-progress {
          background: rgba(0,0,0,0.06);
          padding: 1rem;
          border-radius: 14px;
        }

        /* Day Timeline */
        .student-timeline-track {
          position: relative;
          padding-left: 1.5rem;
          margin: 1.5rem 0 1.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .student-timeline-track::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: #e2e8f0;
        }

        .student-timeline-item {
          position: relative;
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .student-timeline-item::before {
          content: '';
          position: absolute;
          left: -1.9rem;
          top: 0.8rem;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #cbd5e1;
          z-index: 2;
        }

        .student-timeline-item.is-break::before {
          border-color: #cbd5e1;
          background: #cbd5e1;
        }

        .student-timeline-time {
          display: flex;
          flex-direction: column;
          min-width: 90px;
          padding-top: 0.4rem;
        }

        .time-start {
          font-size: 1.2rem;
          font-weight: 850;
          color: #1e293b;
          font-family: 'Lexend', sans-serif;
          line-height: 1;
        }

        .time-end {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 0.2rem;
        }

        .student-timeline-card-content {
          flex: 1;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.005);
          transition: all 0.25s ease;
        }

        .student-timeline-item:hover .student-timeline-card-content {
          transform: translateX(6px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.03);
        }

        .timeline-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-subject-title {
          font-size: 1.2rem;
          font-weight: 800;
          font-family: 'Lexend', sans-serif;
        }

        .timeline-badge-period {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
        }

        .timeline-badge-recess {
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .timeline-meta-row {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .timeline-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.88rem;
          color: #475569;
          font-weight: 600;
        }

        .timeline-meta-icon {
          font-size: 1.05rem;
        }

        .recess-caption {
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 600;
        }

        /* Dynamic Weekly Table Grid Layout (Replaces Columns list) */
        .grid-responsive-wrapper {
          overflow-x: auto;
          width: 100%;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          margin-top: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          background: #ffffff;
        }

        .week-grid-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
        }

        .week-grid-table th, 
        .week-grid-table td {
          border: 1px solid #e2e8f0;
          padding: 1.1rem;
          text-align: center;
          vertical-align: middle;
          font-family: inherit;
        }

        .week-grid-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 1px;
        }

        .week-grid-table th.col-is-today {
          background: rgba(108, 92, 231, 0.08) !important;
          color: #6C5CE7 !important;
          border-bottom: 2px solid #6C5CE7;
        }

        .grid-time-slot-cell {
          width: 120px !important;
          background: #f8fafc !important;
          text-align: center !important;
        }

        .grid-period-label {
          font-size: 1.25rem;
          font-weight: 850;
          color: #6C5CE7;
          font-family: 'Lexend', sans-serif;
        }

        .grid-time-sublabel {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 650;
          margin-top: 0.2rem;
        }

        .grid-slot-cell {
          min-width: 140px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          height: 110px;
        }

        .grid-slot-cell.has-data:hover {
          transform: scale(1.02);
          z-index: 10;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05) !important;
          border-radius: 12px;
          border-color: transparent !important;
        }

        .grid-slot-cell.col-is-today {
          background: rgba(108, 92, 231, 0.015);
        }

        .grid-slot-card-content {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          text-align: left;
          height: 100%;
          justify-content: center;
        }

        .grid-subject-title-row {
          font-weight: 800;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          line-height: 1.2;
          font-family: 'Lexend', sans-serif;
        }

        .grid-icon-inline {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .grid-icon-inline-muted {
          font-size: 0.85rem;
          color: #64748b;
          flex-shrink: 0;
        }

        .grid-meta-item-teacher {
          font-size: 0.75rem;
          color: #1e293b;
          font-weight: 600;
          opacity: 0.85;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .grid-room-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .grid-break-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
        }

        .grid-break-badge {
          background: rgba(226, 232, 240, 0.8);
          color: #475569;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.55rem;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .grid-break-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .grid-empty-dash {
          color: #cbd5e1;
          font-weight: 400;
        }

        .exam-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-icon {
          font-size: 3.5rem;
          color: #cbd5e1;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .text-warning {
          color: #f59e0b !important;
        }
      `}</style>

      {/* Header Title Section */}
      <div className="page-header flex-between flex-wrap gap-1">
        <div>
          <h1 className="page-title flex-center gap-05">
            <div className="student-title-icon-box"><BiCalendar /></div> My Daily Timetable
          </h1>
          <p className="page-subtitle">Track your registered sections, subject timetables, breaks and physical classrooms.</p>
        </div>
      </div>

      {/* Top Controls Toolbar */}
      <div className="timetable-toolbar">
        {/* Day / Week Switcher */}
        <div className="view-toggle-group">
          <button 
            className={`view-toggle-btn ${viewType === 'day' ? 'active' : ''}`}
            onClick={() => setViewType('day')}
          >
            Day View
          </button>
          <button 
            className={`view-toggle-btn ${viewType === 'week' ? 'active' : ''}`}
            onClick={() => setViewType('week')}
          >
            Week View
          </button>
        </div>

        {/* Date Selector Navigation */}
        <div className="date-navigator">
          <button className="date-nav-btn" onClick={() => shiftDate(-1)}>
            <BiChevronLeft />
          </button>
          <input 
            type="date" 
            className="date-picker-input" 
            value={selectedDate}
            onChange={handleDateChange}
          />
          <button className="date-nav-btn" onClick={() => shiftDate(1)}>
            <BiChevronRight />
          </button>
          <button className="btn-today" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
            Today
          </button>
        </div>
      </div>

      {/* Live Active Class Hero Panel */}
      {viewType === 'day' && ongoingClass && (
        <div className="student-ongoing-hero fade-in mb-2">
          <div className="student-hero-top">
            <span className="student-pulse-badge">
              <span className="student-pulse-dot"></span>
              Lecture In Progress
            </span>
            <span className="student-rem-badge">
              {ongoingClass.minutesLeft} min remaining
            </span>
          </div>
          <div className="hero-main-info mt-1">
            <h2 className="student-hero-subject">{ongoingClass.subjectName || ongoingClass.subject || 'Ongoing Session'}</h2>
            <div className="student-hero-meta-row mt-05">
              <div className="student-hero-meta">
                <BiUser />
                <span>{ongoingClass.teacherName || ongoingClass.teacher || 'TBA'}</span>
              </div>
              <div className="student-hero-meta">
                <BiMap />
                <span>Room {ongoingClass.roomName || ongoingClass.room || 'TBA'}</span>
              </div>
              <div className="student-hero-meta">
                <BiTime />
                <span>{ongoingClass.startTime ? ongoingClass.startTime.substring(0, 5) : '00:00'} - {ongoingClass.endTime ? ongoingClass.endTime.substring(0, 5) : '00:00'}</span>
              </div>
            </div>
          </div>
          <div className="student-hero-progress mt-15">
            <div className="progress-bar-label" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', opacity: 0.9 }}>
              Session elapsed progress ({ongoingClass.progressPercent}%)
            </div>
            <div className="progress-track" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="progress-fill" style={{ height: '100%', background: '#ffffff', width: `${ongoingClass.progressPercent}%`, borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Timetable View Area */}
      {loading ? (
        <div className="loading-wrapper glass-panel" style={{ padding: '4rem', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
          <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Retrieving your academic schedule live...</p>
        </div>
      ) : error ? (
        <div className="glass-panel text-center" style={{ padding: '3rem 2rem', background: '#fff', border: '1px solid #fecaca' }}>
          <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Day View Timeline Layout */}
          {viewType === 'day' && (
            <>
              {schedule.length > 0 ? (
                <div className="glass-panel" style={{ padding: '2rem 2.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                  <div className="section-title-wrapper" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '1.35rem', fontWeight: 850, color: '#1e293b' }}>
                      Agenda Timeline - {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h2>
                  </div>

                  <div className="student-timeline-track">
                    {schedule.map((item, idx) => {
                      const isBreak = item.type?.toLowerCase() === 'break' || item.isBreak;
                      const color = getSubjectColor(item.subjectName || item.subject);

                      return (
                        <div 
                          key={idx} 
                          className={`student-timeline-item ${isBreak ? 'is-break' : ''}`}
                          style={!isBreak ? { borderLeftColor: color.text } : {}}
                        >
                          {/* Time badge */}
                          <div className="student-timeline-time">
                            <span className="time-start">{item.startTime || item.time || '00:00'}</span>
                            {item.endTime && <span className="time-end">to {item.endTime}</span>}
                          </div>

                          {/* Detail card */}
                          <div 
                            className="student-timeline-card-content"
                            style={!isBreak ? { background: color.light, borderColor: color.border } : {}}
                          >
                            <div className="timeline-title-row">
                              <h3 className="timeline-subject-title" style={!isBreak ? { color: color.text } : {}}>
                                {item.subjectName || item.subject || (isBreak ? 'Interval / Recess' : 'Study Hour')}
                              </h3>
                              {!isBreak && <span className="timeline-badge-period" style={{ background: color.border, color: color.text }}>Lecture {idx + 1}</span>}
                              {isBreak && <span className="timeline-badge-recess">Break</span>}
                            </div>

                            {!isBreak && (
                              <div className="timeline-meta-row mt-05">
                                <span className="timeline-meta-item">
                                  <BiUser className="timeline-meta-icon" style={{ color: color.text }} />
                                  {item.teacherName || item.teacher || 'TBA'}
                                </span>
                                <span className="timeline-meta-item">
                                  <BiMap className="timeline-meta-icon" style={{ color: color.text }} />
                                  Room {item.roomName || item.room || 'TBA'}
                                </span>
                              </div>
                            )}
                            
                            {isBreak && (
                              <p className="recess-caption mt-05">School-wide scheduled interval. Enjoy your break!</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="glass-panel text-center" style={{ padding: '5rem 2rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                  <BiCalendar className={`empty-icon ${dayStatus === 'holiday' ? 'text-warning' : ''}`} />
                  <h3 style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 800, color: '#1e293b' }}>
                    {dayStatus === 'holiday' ? `Public Holiday — ${holidayName}` : 'No Classes Scheduled'}
                  </h3>
                  <p style={{ color: '#64748b', fontWeight: 650, maxWidth: '500px', margin: '0.5rem auto' }}>
                    {dayStatus === 'holiday'
                      ? `${selectedDate} is a public holiday (${holidayName}). No classes today.`
                      : `No academic classes are scheduled for this date (${selectedDate}).`
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Week View Table Grid Layout */}
          {viewType === 'week' && (
            <>
              {fullWeekData.length > 0 && uniqueTimeSlots.length > 0 ? (
                <div className="grid-responsive-wrapper fade-in">
                  <table className="week-grid-table">
                    <thead>
                      <tr>
                        <th className="grid-time-slot-cell">Period</th>
                        {fullWeekData.map(day => {
                          const isToday = day.date === new Date().toISOString().split('T')[0];
                          return (
                            <th key={day.date} className={isToday ? 'col-is-today' : ''}>
                              <div>{day.dayName}</div>
                              <div style={{ fontSize: '0.7rem', fontWeight: '500', opacity: 0.75, marginTop: '2px', textTransform: 'none' }}>{day.date}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueTimeSlots.map((timeSlot, idx) => {
                        const periodLabel = `P${idx + 1}`;
                        const timeRangeStr = `${timeSlot.start.substring(0, 5)} - ${timeSlot.end.substring(0, 5)}`;
                        
                        return (
                          <tr key={idx}>
                            <td className="grid-time-slot-cell">
                              <div className="grid-period-label">{periodLabel}</div>
                              <div className="grid-time-sublabel">{timeRangeStr}</div>
                            </td>
                            {fullWeekData.map(day => {
                              const slot = day.schedule?.find(s => 
                                (s.startTime || s.time || '') === timeSlot.start && 
                                (s.endTime || '') === timeSlot.end
                              );
                              const isBreak = slot?.isBreak || slot?.type?.toLowerCase() === 'break' || timeSlot.isBreak;
                              const color = getSubjectColor(slot?.subjectName || slot?.subject);

                              return (
                                <td 
                                  key={day.date} 
                                  className={`grid-slot-cell ${slot ? 'has-data' : 'empty'} ${day.date === new Date().toISOString().split('T')[0] ? 'col-is-today' : ''}`}
                                  style={slot && !isBreak ? { background: color.light, borderLeft: `4px solid ${color.text}`, borderColor: color.border } : {}}
                                >
                                  {slot ? (
                                    isBreak ? (
                                      <div className="grid-break-content">
                                        <span className="grid-break-badge">Break</span>
                                        <span className="grid-break-text">Recess</span>
                                      </div>
                                    ) : (
                                      <div className="grid-slot-card-content">
                                        <div className="grid-subject-title-row" style={{ color: color.text }}>
                                          <BiBookOpen className="grid-icon-inline" />
                                          <span className="grid-subject-name">{slot.subjectName || slot.subject}</span>
                                        </div>
                                        <div className="grid-meta-item-teacher">
                                          <BiUser className="grid-icon-inline-muted" />
                                          <span>{slot.teacherName || slot.teacher || 'TBA'}</span>
                                        </div>
                                        {slot.roomName || slot.room ? (
                                          <div className="grid-room-badge" style={{ background: color.border, color: color.text }}>
                                            <BiMap className="grid-icon-inline-muted" />
                                            <span>Rm {slot.roomName || slot.room}</span>
                                          </div>
                                        ) : null}
                                      </div>
                                    )
                                  ) : (
                                    <span className="grid-empty-dash">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-panel text-center" style={{ padding: '5rem 2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                  <BiTable className="empty-icon" />
                  <h3 style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 800, color: '#1e293b' }}>Weekly Timetable Offline</h3>
                  <p style={{ color: '#64748b', fontWeight: 650 }}>No weekly timetable structure could be generated for your section.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Timetable;
