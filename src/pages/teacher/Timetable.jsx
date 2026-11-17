import React, { useState, useEffect } from 'react';
import { 
  BiTime, 
  BiUser, 
  BiMap, 
  BiCalendar, 
  BiChevronLeft, 
  BiChevronRight, 
  BiGridAlt, 
  BiListUl,
  BiCalendarCheck,
  BiCalendarX,
  BiInfoCircle,
  BiRefresh,
  BiBookOpen,
  BiTable
} from 'react-icons/bi';
import { getTeacherAppTimetable } from '../../api/api';
import { getAuthValue } from '../../utils/auth';


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

// 2026 India Gazetted Public Holidays (YYYY-MM-DD)
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

const isHoliday = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 || INDIA_PUBLIC_HOLIDAYS_2026.has(dateStr);
};

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

const TeacherTimetable = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('week'); // 'day' or 'week'
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSlot, setActiveSlot] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');

    const jwt = parseJwtPayload(getAuthValue('token'));
    const academicYearId = toNumber(getAuthValue('academicYearId') || jwt?.ayi);
    const schoolId = toNumber(getAuthValue('schoolId') || jwt?.sid);
    const teacherId = toNumber(getAuthValue('teacherId') || getAuthValue('userId') || jwt?.uid);

    if (!academicYearId || !schoolId || !teacherId) {
      setError('Session data missing (academicYearId, schoolId, or teacherId)');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        teacherId,
        schoolId,
        academicYearId,
        type: viewType,
        date: selectedDate
      };

      console.groupCollapsed('📅 [Teacher Timetable] API Sync');
      console.log('Payload:', payload);
      const response = await getTeacherAppTimetable(payload);
      console.log('Response:', response);
      console.groupEnd();

      if (response?.status === 'SUCCESS' || response?.code === 200) {
        setScheduleData(response.data);
      } else {
        setError(response?.message || 'Failed to retrieve schedule data.');
      }
    } catch (err) {
      console.error('[Teacher Timetable Error]', err);
      setError(err?.response?.data?.message || err.message || 'An error occurred while loading schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedDate, viewType, tick]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const shiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleSlotClick = (slot) => {
    setActiveSlot(slot);
    setShowDetailModal(true);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'upcoming': return 'status-upcoming';
      default: return 'status-upcoming';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const formatLocalDate = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getOngoingClass = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate !== todayStr || !scheduleData?.schedule || scheduleData.schedule.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const item of scheduleData.schedule) {
      if (item.isCancelled) continue;
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
    
    if (scheduleData?.days) {
      scheduleData.days.forEach(day => {
        if (Array.isArray(day.schedule)) {
          day.schedule.forEach(slot => {
            const start = slot.startTime || '';
            const end = slot.endTime || '';
            if (start && end) {
              const key = `${start}-${end}`;
              if (!seen.has(key)) {
                seen.add(key);
                timeSlots.push({
                  start,
                  end,
                  isBreak: slot.isBreak || slot.status?.toLowerCase() === 'break'
                });
              }
            }
          });
        }
      });
    }
    
    // Sort chronologically by start time
    timeSlots.sort((a, b) => a.start.localeCompare(b.start));
    return timeSlots;
  };

  const ongoingClass = getOngoingClass();
  const uniqueTimeSlots = getUniqueTimeSlots();

  return (
    <div className="teacher-page-container fade-in teacher-timetable-wrapper space-y-8">
      {/* Scope Timetable specific custom styling */}
      <style>{`
        .teacher-timetable-wrapper {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .teacher-title-icon-box {
          background: rgba(93, 95, 239, 0.1);
          color: var(--primary);
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
          border: 1px solid var(--border-light);
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
          color: var(--primary);
          box-shadow: 0 4px 12px rgba(93, 95, 239, 0.12);
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
          color: var(--primary);
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
          background: rgba(93, 95, 239, 0.08);
          color: var(--primary);
          font-weight: 700;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .btn-today:hover {
          background: var(--primary);
          color: white;
        }

        .legend-indicator-group {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dot-ongoing { background: #10b981; }
        .dot-upcoming { background: var(--primary); }
        .dot-completed { background: #94a3b8; }
        .dot-cancelled { background: #ef4444; }
        .dot-substitute { background: #f59e0b; }

        /* Teacher Hero Tracker */
        .teacher-ongoing-hero {
          background: linear-gradient(135deg, var(--primary) 0%, #7a6dfa 100%);
          border-radius: 24px;
          padding: 1.75rem 2rem;
          color: white;
          box-shadow: 0 10px 30px rgba(93, 95, 239, 0.2);
        }

        .teacher-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .teacher-pulse-badge {
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

        .teacher-pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 8px #10b981;
        }

        .teacher-rem-badge {
          font-size: 0.85rem;
          font-weight: 700;
          background: rgba(0,0,0,0.12);
          padding: 0.35rem 0.85rem;
          border-radius: 10px;
        }

        .teacher-hero-subject {
          font-family: 'Lexend', sans-serif;
          font-size: 1.8rem;
          font-weight: 850;
          margin-bottom: 0.45rem;
        }

        .teacher-hero-meta-row {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .teacher-hero-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          opacity: 0.95;
        }

        .teacher-hero-progress {
          background: rgba(0,0,0,0.06);
          padding: 1rem;
          border-radius: 14px;
        }

        /* Day Timeline Schedule */
        .timeline-container {
          position: relative;
          padding-left: 1.5rem;
          margin: 1.5rem 0 1.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-container::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: #e2e8f0;
        }

        .timeline-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1.25rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          cursor: pointer;
        }

        .timeline-card:hover {
          transform: translateX(8px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.04);
        }

        .timeline-card::before {
          content: '';
          position: absolute;
          left: -1.9rem;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #cbd5e1;
          z-index: 2;
          transition: all 0.3s;
        }

        .timeline-card:hover::before {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-soft);
        }

        .timeline-card.active-class {
          border-left: 5px solid #10b981;
        }

        .timeline-card.active-class::before {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }

        .timeline-card.cancelled-class {
          opacity: 0.65;
          border-left: 5px solid #ef4444;
          background: #f8fafc;
        }

        .timeline-card.cancelled-class::before {
          border-color: #ef4444;
        }

        .card-time-badge {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 90px;
        }

        .card-time-main {
          font-size: 1.25rem;
          font-weight: 850;
          color: #1e293b;
          font-family: 'Lexend', sans-serif;
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .card-time-sub {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 650;
        }

        .card-details-panel {
          flex: 1;
          padding: 0 2rem;
        }

        .card-subject-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }

        .card-subject-name {
          font-size: 1.2rem;
          font-weight: 800;
          font-family: 'Lexend', sans-serif;
        }

        .badge-period {
          background: rgba(93, 95, 239, 0.08);
          color: var(--primary);
          padding: 0.25rem 0.65rem;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .card-meta-row {
          display: flex;
          align-items: center;
          gap: 1.75rem;
          flex-wrap: wrap;
        }

        .card-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.88rem;
          color: #475569;
          font-weight: 600;
        }

        .meta-icon {
          font-size: 1.05rem;
        }

        .card-status-panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
        }

        .status-pill {
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .status-pill.status-ongoing {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-pill.status-completed {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-pill.status-upcoming {
          background: rgba(93, 95, 239, 0.1);
          color: var(--primary);
        }

        .badge-special {
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .badge-cancelled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .badge-substitute {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        /* Dynamic Weekly Table Grid Layout (Matches Admin Grid) */
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
          background: rgba(93, 95, 239, 0.08) !important;
          color: var(--primary) !important;
          border-bottom: 2px solid var(--primary);
        }

        .grid-time-slot-cell {
          width: 120px !important;
          background: #f8fafc !important;
          text-align: center !important;
        }

        .grid-period-label {
          font-size: 1.25rem;
          font-weight: 850;
          color: var(--primary);
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
          cursor: pointer;
        }

        .grid-slot-cell.has-data:hover {
          transform: scale(1.02);
          z-index: 10;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05) !important;
          border-radius: 12px;
          border-color: transparent !important;
        }

        .grid-slot-cell.col-is-today {
          background: rgba(93, 95, 239, 0.015);
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

        .grid-meta-item-class {
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

        .grid-status-alert-row {
          display: flex;
          gap: 0.2rem;
          flex-wrap: wrap;
          margin-top: 0.1rem;
        }

        .grid-status-mini-badge {
          font-size: 0.6rem;
          font-weight: 800;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .grid-badge-cancelled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .grid-badge-substitute {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .grid-empty-dash {
          color: #cbd5e1;
          font-weight: 400;
        }

        /* Glassmorphic Modal */
        .glass-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modalFadeIn 0.25s ease;
        }

        .glass-modal-container {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: var(--shadow-lg);
          width: 90%;
          max-width: 500px;
          border-radius: 24px;
          padding: 2rem;
          position: relative;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-close-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: rotate(90deg);
        }

        .modal-header-sec {
          margin-bottom: 1.5rem;
        }

        .modal-title-main {
          font-family: 'Lexend', sans-serif;
          font-size: 1.5rem;
          font-weight: 850;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .modal-status-badge {
          display: inline-flex;
        }

        .modal-body-list {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          margin-bottom: 2rem;
        }

        .modal-info-tile {
          display: flex;
          gap: 1rem;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 0.85rem 1.1rem;
          border-radius: 14px;
        }

        .tile-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          flex-shrink: 0;
        }

        .tile-content-box {
          display: flex;
          flex-direction: column;
        }

        .tile-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .tile-value {
          font-size: 0.95rem;
          font-weight: 800;
          color: #1e293b;
        }

        .substitute-alert {
          background: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 14px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .sub-alert-icon {
          color: #d97706;
          font-size: 1.3rem;
          margin-top: 0.15rem;
        }

        .sub-alert-text {
          font-size: 0.82rem;
          color: #b45309;
          font-weight: 600;
          line-height: 1.4;
        }

        .btn-modal-action {
          width: 100%;
          padding: 0.9rem;
          background: var(--primary);
          color: white;
          border: none;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .btn-modal-action:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
        }

        .sync-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
      `}</style>

      {/* Header Panel */}
      <div className="page-header flex-between flex-wrap gap-1">
        <div>
          <h1 className="page-title flex-center gap-05">
            <div className="teacher-title-icon-box"><BiCalendar /></div> My Academic Timetable
          </h1>
          <p className="page-subtitle">Manage your daily scheduled lectures, standard sections, and room assignments.</p>
        </div>
      </div>

      {/* Toolbar / Controls */}
      <div className="timetable-toolbar">
        {/* Toggle Switch Day / Week */}
        <div className="view-toggle-group">
          <button 
            className={`view-toggle-btn ${viewType === 'day' ? 'active' : ''}`}
            onClick={() => setViewType('day')}
          >
            <BiListUl /> Day View
          </button>
          <button 
            className={`view-toggle-btn ${viewType === 'week' ? 'active' : ''}`}
            onClick={() => setViewType('week')}
          >
            <BiGridAlt /> Week View
          </button>
        </div>

        {/* Date Navigator */}
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

        {/* Sync Status Legend */}
        <div className="legend-indicator-group">
          <div className="legend-item">
            <span className="legend-dot dot-ongoing" /> Ongoing
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-upcoming" /> Upcoming
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-completed" /> Completed
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-cancelled" /> Cancelled
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-substitute" /> Substitute
          </div>
        </div>
      </div>

      {/* Hero Ongoing Card Panel */}
      {viewType === 'day' && ongoingClass && (
        <div className="teacher-ongoing-hero fade-in mb-2">
          <div className="teacher-hero-top">
            <span className="teacher-pulse-badge">
              <span className="teacher-pulse-dot"></span>
              Active Lecture
            </span>
            <span className="teacher-rem-badge">
              {ongoingClass.minutesLeft} min remaining
            </span>
          </div>
          <div className="hero-main-info mt-1">
            <h2 className="teacher-hero-subject">{ongoingClass.subject || 'Lecture Session'}</h2>
            <div className="teacher-hero-meta-row mt-05">
              <div className="teacher-hero-meta">
                <BiUser />
                <span>Class {ongoingClass.class || 'N/A'} - {ongoingClass.division || 'N/A'}</span>
              </div>
              <div className="teacher-hero-meta">
                <BiMap />
                <span>Room {ongoingClass.room || 'TBA'}</span>
              </div>
              <div className="teacher-hero-meta">
                <BiTime />
                <span>{formatTime(ongoingClass.startTime)} - {formatTime(ongoingClass.endTime)} (Period {ongoingClass.periodId})</span>
              </div>
            </div>
          </div>
          <div className="teacher-hero-progress mt-15">
            <div className="progress-bar-label" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', opacity: 0.9 }}>
              Lecture elapsed progress ({ongoingClass.progressPercent}%)
            </div>
            <div className="progress-track-ongoing" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="progress-fill-ongoing" style={{ height: '100%', background: '#ffffff', width: `${ongoingClass.progressPercent}%`, borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      {loading ? (
        <div className="loading-wrapper glass-panel" style={{ padding: '4rem', textAlign: 'center', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '20px' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
          <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Syncing your schedule live from institute database...</p>
        </div>
      ) : error ? (
        <div className="sync-warning">
          <BiInfoCircle style={{ fontSize: '1.25rem' }} />
          <span>{error}</span>
          <button onClick={fetchTimetable} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <BiRefresh /> Retry Sync
          </button>
        </div>
      ) : (
        <>
          {/* Sunday / Holiday Check */}
          {isHoliday(selectedDate) && viewType === 'day' ? (
            <div className="glass-panel text-center" style={{ padding: '5rem 2rem', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '24px' }}>
              <BiCalendarX style={{ fontSize: '4.5rem', color: '#f59e0b', marginBottom: '1.5rem', opacity: 0.8 }} />
              <h2 style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 800, color: '#1e293b', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Gazetted Holiday — {getHolidayName(selectedDate)}
              </h2>
              <p style={{ color: '#64748b', fontWeight: 650, maxWidth: '500px', margin: '0 auto' }}>
                {selectedDate} is flagged as a public holiday or weekend. No official academic sessions are scheduled. Have a wonderful break!
              </p>
            </div>
          ) : (
            <>
              {/* Day View */}
              {viewType === 'day' && (
                <div className="glass-panel" style={{ padding: '2rem 2.5rem', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '24px' }}>
                  <div className="section-title-wrapper" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '1.35rem', fontWeight: 850, color: '#1e293b' }}>
                      Schedule for {formatLocalDate(selectedDate)}
                    </h2>
                  </div>

                  {scheduleData?.schedule && scheduleData.schedule.length > 0 ? (
                    <div className="timeline-container">
                      {scheduleData.schedule.map((slot) => {
                        const isOngoing = slot.status?.toLowerCase() === 'ongoing';
                        const isCancelled = slot.isCancelled;
                        const color = getSubjectColor(slot.subject);

                        return (
                          <div 
                            key={slot.periodId} 
                            className={`timeline-card ${isOngoing ? 'active-class' : ''} ${isCancelled ? 'cancelled-class' : ''}`}
                            onClick={() => handleSlotClick(slot)}
                            style={!isCancelled ? { borderLeft: `4px solid ${color.text}` } : {}}
                          >
                            {/* Time section */}
                            <div className="card-time-badge">
                              <span className="card-time-main" style={!isCancelled ? { color: color.text } : {}}>{formatTime(slot.startTime)}</span>
                              <span className="card-time-sub">to {formatTime(slot.endTime)}</span>
                            </div>

                            {/* Details section */}
                            <div className="card-details-panel">
                              <div className="card-subject-row">
                                <span className="card-subject-name" style={!isCancelled ? { color: color.text } : {}}>{slot.subject || 'Unassigned Session'}</span>
                                <span className="badge-period" style={!isCancelled ? { background: color.border, color: color.text } : {}}>Period {slot.periodId}</span>
                              </div>
                              <div className="card-meta-row">
                                <span className="card-meta-item">
                                  <BiUser className="meta-icon" style={!isCancelled ? { color: color.text } : {}} /> 
                                  Class {slot.class || 'N/A'} - {slot.division || 'N/A'}
                                </span>
                                <span className="card-meta-item">
                                  <BiMap className="meta-icon" style={!isCancelled ? { color: color.text } : {}} /> 
                                  Room {slot.room || 'TBA'}
                                </span>
                              </div>
                            </div>

                            {/* Status tags */}
                            <div className="card-status-panel">
                              <span className={`status-pill ${getStatusClass(slot.status)}`}>
                                {slot.status}
                              </span>
                              {slot.isCancelled && (
                                <span className="badge-special badge-cancelled">Cancelled</span>
                              )}
                              {slot.isSubstitute && (
                                <span className="badge-special badge-substitute">Substitute</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center" style={{ padding: '4rem 2rem' }}>
                      <BiCalendar style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '1rem', opacity: 0.5 }} />
                      <h3 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.25rem', marginBottom: '0.25rem' }}>No lectures scheduled</h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 650 }}>You have no teaching lectures assigned for this day.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Week View Grid Layout */}
              {viewType === 'week' && (
                <>
                  {scheduleData?.days && scheduleData.days.length > 0 && uniqueTimeSlots.length > 0 ? (
                    <div className="grid-responsive-wrapper fade-in">
                      <table className="week-grid-table">
                        <thead>
                          <tr>
                            <th className="grid-time-slot-cell">Period</th>
                            {scheduleData.days.map(day => {
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
                                {scheduleData.days.map(day => {
                                  const slot = day.schedule?.find(s => 
                                    s.startTime === timeSlot.start && 
                                    s.endTime === timeSlot.end
                                  );
                                  const isCancelled = slot?.isCancelled;
                                  const color = getSubjectColor(slot?.subject);

                                  return (
                                    <td 
                                      key={day.date} 
                                      className={`grid-slot-cell ${slot ? 'has-data' : 'empty'} ${day.date === new Date().toISOString().split('T')[0] ? 'col-is-today' : ''}`}
                                      onClick={() => slot && handleSlotClick(slot)}
                                      style={slot && !isCancelled ? { background: color.light, borderLeft: `4px solid ${color.text}`, borderColor: color.border } : {}}
                                    >
                                      {slot ? (
                                        <div className="grid-slot-card-content">
                                          <div className="grid-subject-title-row" style={!isCancelled ? { color: color.text } : {}}>
                                            <BiBookOpen className="grid-icon-inline" />
                                            <span className="grid-subject-name" style={{ fontSize: '0.82rem' }}>{slot.subject}</span>
                                          </div>
                                          <div className="grid-meta-item-class">
                                            <BiUser className="grid-icon-inline-muted" />
                                            <span>Class {slot.class || 'N/A'}-{slot.division || 'N/A'}</span>
                                          </div>
                                          {slot.room && (
                                            <div className="grid-room-badge" style={!isCancelled ? { background: color.border, color: color.text } : {}}>
                                              <BiMap className="grid-icon-inline-muted" />
                                              <span>Rm {slot.room}</span>
                                            </div>
                                          )}
                                          <div className="grid-status-alert-row">
                                            {slot.isCancelled && <span className="grid-status-mini-badge grid-badge-cancelled">Cancelled</span>}
                                            {slot.isSubstitute && <span className="grid-status-mini-badge grid-badge-substitute">Substitute</span>}
                                          </div>
                                        </div>
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
                    <div className="glass-panel text-center" style={{ padding: '5rem 2rem', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '24px' }}>
                      <BiTable className="empty-icon" style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '1.5rem', opacity: 0.5 }} />
                      <h2 style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 800, color: '#1e293b' }}>Weekly Timetable Offline</h2>
                      <p style={{ color: '#64748b', fontWeight: 650 }}>No lecture structure exists in this academic year for your profile.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Lecture Detail Glassmorphic Modal */}
      {showDetailModal && activeSlot && (
        <div className="glass-modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="glass-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>&times;</button>
            
            <div className="modal-header-sec">
              <h3 className="modal-title-main">{activeSlot.subject || 'Unassigned Session'}</h3>
              <div className="modal-status-badge">
                <span className={`status-pill ${getStatusClass(activeSlot.status)}`}>
                  {activeSlot.status}
                </span>
              </div>
            </div>

            <div className="modal-body-list">
              {/* Class & Division Tile */}
              <div className="modal-info-tile">
                <div className="tile-icon-box">
                  <BiUser />
                </div>
                <div className="tile-content-box">
                  <span className="tile-label">Assigned Class</span>
                  <span className="tile-value">Class {activeSlot.class || 'N/A'} &bull; Section {activeSlot.division || 'N/A'}</span>
                </div>
              </div>

              {/* Room Number Tile */}
              <div className="modal-info-tile">
                <div className="tile-icon-box">
                  <BiMap />
                </div>
                <div className="tile-content-box">
                  <span className="tile-label">Lecture Room</span>
                  <span className="tile-value">Room {activeSlot.room || 'TBA'}</span>
                </div>
              </div>

              {/* Lecture Time Tile */}
              <div className="modal-info-tile">
                <div className="tile-icon-box">
                  <BiTime />
                </div>
                <div className="tile-content-box">
                  <span className="tile-label">Time Frame</span>
                  <span className="tile-value">{formatTime(activeSlot.startTime)} - {formatTime(activeSlot.endTime)} (Period {activeSlot.periodId})</span>
                </div>
              </div>

              {/* Substitution info warning block if applicable */}
              {activeSlot.isSubstitute && (
                <div className="substitute-alert">
                  <BiInfoCircle className="sub-alert-icon" />
                  <div className="sub-alert-text">
                    This class is a substitute cover lecture. The original scheduled tutor is{' '}
                    <strong>{activeSlot.originalTeacher || 'another staff member'}</strong>.
                  </div>
                </div>
              )}

              {activeSlot.isCancelled && (
                <div className="substitute-alert" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <BiCalendarX className="sub-alert-icon" style={{ color: 'var(--color-absent)' }} />
                  <div className="sub-alert-text" style={{ color: '#991b1b' }}>
                    This lecture is flagged as <strong>CANCELLED</strong> for this specific session. No attendance registration or active lecture is required.
                  </div>
                </div>
              )}
            </div>

            <button className="btn-modal-action" onClick={() => setShowDetailModal(false)}>
              Got it, close details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;
