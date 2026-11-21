import { useState, useEffect } from 'react';
import { BiTable, BiDownload, BiFilterAlt, BiEditAlt, BiCheck, BiX, BiPlus, BiTrash, BiBook, BiUser, BiMapPin } from 'react-icons/bi';
import {
  getAllStandards,
  getAllDivisionsByStandardId,
  getTimetableByDivision,
  getSubjectsForTimetable,
  getTeachersForTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  getCurrentAcademicYear
} from '../../api/api';
import { getAuthValue, setAuthValue } from '../../utils/auth';

/**
 * Dynamic subject-based color picker
 */
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

/**
 * Timetable Page (Admin)
 * Supports viewing and editing class schedules using live API data
 */
const Timetable = () => {
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  const [timetableGrid, setTimetableGrid] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentYearId, setCurrentYearId] = useState(getAuthValue('academicYearId'));
  const [academicYearName, setAcademicYearName] = useState('');

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8]; // Default period range

  const schoolId = getAuthValue('schoolId');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      let yearId = currentYearId;

      if (!yearId && schoolId) {
        console.warn('⚠️ [Timetable] academicYearId missing from storage, fetching current...');
        try {
          const yearRes = await getCurrentAcademicYear(schoolId);
          if (yearRes.data && yearRes.data.academicYearId) {
            yearId = yearRes.data.academicYearId;
            setAuthValue('academicYearId', yearId);
            setCurrentYearId(yearId);
            if (yearRes.data.academicYearName) {
              setAcademicYearName(yearRes.data.academicYearName);
            }
            console.log('✅ [Timetable] Fetched and saved current academicYearId:', yearId);
          }
        } catch (yearErr) {
          console.error('🛑 [Timetable] Failed to fetch current academic year:', yearErr);
        }
      }

      if (!schoolId || !yearId) {
        setError("Configuration missing: School ID or Academic Year ID not found.");
        setLoading(false);
        return;
      }

      console.log('🚀 [Timetable] Fetching data for School:', schoolId, 'Year:', yearId);

      const standardRes = await getAllStandards(schoolId, yearId);
      console.log('✅ [Timetable] Standards Response:', standardRes);
      const standardData = standardRes.data || [];
      setStandards(standardData);

      const subjectRes = await getSubjectsForTimetable({ schoolId, academicYearId: yearId });
      console.log('✅ [Timetable] Subjects Response:', subjectRes);
      const subjectData = subjectRes.data || [];
      setSubjects(subjectData);

      if (!academicYearName && subjectData.length > 0) {
        setAcademicYearName(subjectData[0].academicYearName);
      }

      const teacherRes = await getTeachersForTimetable({ schoolId, academicYearId: yearId });
      console.log('✅ [Timetable] Teachers Response:', teacherRes);
      setTeachers(teacherRes.data || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load standards/subjects/teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardChange = async (standardId) => {
    setSelectedStandard(standardId);
    setSelectedDivision('');
    setTimetableGrid([]);
    if (!standardId) return;

    try {
      const divisionRes = await getAllDivisionsByStandardId({
        schoolId,
        standardId,
        academicYearId: currentYearId
      });
      setDivisions(divisionRes.data || []);
    } catch (err) {
      console.error('Error fetching divisions:', err);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedDivision) return;
    try {
      setLoading(true);
      setError('');
      const res = await getTimetableByDivision({
        schoolId,
        academicYearId: currentYearId,
        standardId: selectedStandard,
        divisionId: selectedDivision
      });
      
      console.log('✅ [Timetable] Loaded grid data:', res);
      
      const rawData = res && res.data;
      const flatList = (rawData && Array.isArray(rawData.timetable)) ? rawData.timetable : [];
      
      const periodsMap = {};
      
      flatList.forEach(item => {
        const pNum = item.periodNumber;
        if (!periodsMap[pNum]) {
          periodsMap[pNum] = {
            periodNumber: pNum,
            startTime: item.startTime || '09:00:00',
            endTime: item.endTime || '10:00:00',
            slots: []
          };
        }
        
        periodsMap[pNum].slots.push({
          timetableId: item.periodId,
          dayOfWeek: item.dayOfWeek?.toUpperCase(),
          subjectId: item.subject?.id || '',
          subjectName: item.subject?.name || '',
          teacherId: item.teacher?.id || '',
          teacherName: item.teacher?.name || '',
          startTime: item.startTime || '09:00:00',
          endTime: item.endTime || '10:00:00',
          roomNumber: item.roomNumber || ''
        });
      });
      
      const formattedGrid = Object.values(periodsMap).sort((a, b) => a.periodNumber - b.periodNumber);
      setTimetableGrid(formattedGrid);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError('Failed to load timetable grid');
    } finally {
      setLoading(false);
    }
  };

  const getSlotData = (day, periodNum) => {
    const periodEntry = timetableGrid.find(p => p.periodNumber === periodNum);
    if (!periodEntry || !periodEntry.slots) return null;
    return periodEntry.slots.find(s => s.dayOfWeek === day);
  };

  const safeTime = (timeStr) => {
    if (!timeStr) return '09:00';
    return timeStr.substring(0, 5);
  };

  const handleSlotClick = (day, periodNum) => {
    if (!isEditing) return;
    const slot = getSlotData(day, periodNum);
    setActiveSlot({
      dayOfWeek: day,
      periodNumber: periodNum,
      ...(slot || { subjectId: '', teacherId: '', startTime: '09:00:00', endTime: '10:00:00', roomNumber: '' })
    });
    setShowEditModal(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      schoolId,
      academicYearId: currentYearId,
      standardId: selectedStandard,
      divisionId: selectedDivision,
      subjectId: parseInt(formData.get('subjectId')),
      teacherId: parseInt(formData.get('teacherId')),
      dayOfWeek: activeSlot.dayOfWeek,
      startTime: formData.get('startTime') || '09:00:00',
      endTime: formData.get('endTime') || '10:00:00',
      periodNumber: activeSlot.periodNumber,
      roomNumber: formData.get('roomNumber') || ''
    };

    try {
      let res;
      if (activeSlot.timetableId) {
        res = await updateTimetableSlot({
          ...payload,
          timetableId: activeSlot.timetableId
        });
      } else {
        res = await createTimetableSlot(payload);
      }

      if (res?.status === 'SUCCESS' || res?.code === 200) {
        setShowEditModal(false);
        fetchTimetable();
      } else {
        alert(res?.message || 'Failed to save timetable slot');
      }
    } catch (err) {
      console.error('Error saving slot:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Failed to save timetable slot';
      alert(serverMsg);
    }
  };

  const handleDeleteSlot = async () => {
    if (!activeSlot.timetableId) return;
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      await deleteTimetableSlot({
        schoolId,
        timetableId: activeSlot.timetableId
      });
      setShowEditModal(false);
      fetchTimetable();
    } catch (err) {
      console.error('Error deleting slot:', err);
      alert('Failed to delete slot');
    }
  };

  const handlePrintTimetable = () => {
    if (!selectedStandard || !selectedDivision) {
      alert('Please select a Standard and Division first.');
      return;
    }
    const std = standards.find(s => String(s.standardId) === String(selectedStandard));
    const div = divisions.find(d => String(d.divisionId) === String(selectedDivision));
    const sn = std ? (std.standard || std.standardName) : '';
    const dn = div ? div.divisionName : '';
    let rows = '';
    periods.forEach(pn => {
      const pe = timetableGrid.find(p => p.periodNumber === pn);
      const ts = pe ? pe.startTime.substring(0,5)+' - '+pe.endTime.substring(0,5) : 'Period '+pn;
      let cells = '';
      days.forEach(day => {
        const sl = getSlotData(day, pn);
        cells += sl
          ? '<td style="border:1px solid #e2e8f0;padding:12px;text-align:center;background:#fff;border-left:4px solid #5d5fef;box-shadow: 0 2px 4px rgba(0,0,0,0.02)"><b style="font-size:0.9rem;color:#1e293b;font-family:Segoe UI,sans-serif">'+( sl.subjectName||'')+'</b><br/><span style="font-size:0.75rem;color:#5d5fef;font-weight:600">'+(sl.teacherName||'')+'</span><br/><span style="font-size:0.65rem;color:#64748b">Rm: '+(sl.roomNumber||'TBA')+'</span></td>'
          : '<td style="border:1px solid #e2e8f0;padding:12px;text-align:center;color:#cbd5e1;background:#fafafa">—</td>';
      });
      rows += '<tr><td style="border:1px solid #e2e8f0;padding:12px;text-align:center;background:#f8fafc"><b style="color:#5d5fef;font-size:1.1rem">P'+pn+'</b><br/><span style="font-size:0.75rem;color:#64748b">'+ts+'</span></td>'+cells+'</tr>';
    });
    const dh = days.map(d => '<th style="background:#5d5fef;color:#ffffff;font-weight:700;font-size:0.85rem;text-transform:uppercase;padding:12px;border:1px solid #e2e8f0;font-family:Segoe UI,sans-serif">'+d+'</th>').join('');
    const pw = window.open('','_blank');
    pw.document.write('<html><head><title>Timetable - '+sn+'</title><style>body{font-family:Segoe UI,sans-serif;margin:40px;background:#fff;color:#1e293b}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{font-family:Segoe UI,sans-serif}@page{size:landscape;margin:10mm}</style></head><body><div style="border-bottom:2px solid #5d5fef;padding-bottom:10px"><h2 style="margin:0 0 4px;color:#5d5fef;font-size:1.8rem">Academic Schedule</h2><p style="color:#64748b;margin:0;font-size:0.95rem;font-weight:500">'+sn+' Standard '+(dn ? ' | Division '+dn : '')+' '+(academicYearName?' | Academic Year: '+academicYearName : '')+'</p></div><p style="color:#94a3b8;font-size:0.8rem;text-align:right;margin-top:10px">Printed on: '+new Date().toLocaleDateString('en-US',{weekday:"long",year:"numeric",month:"long",day:"numeric"})+'</p><table><thead><tr><th style="background:#334155;color:#fff;font-weight:700;padding:12px;border:1px solid #e2e8f0;width:110px">Period</th>'+dh+'</tr></thead><tbody>'+rows+'</tbody></table></body></html>');
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 400);
  };

  return (
    <div className="timetable-page space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h1 className="flex items-center gap-3 font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BiTable className="text-xl" />
            </span>
            Time Table Management
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Academic &gt; Timetable</span>
            {academicYearName && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                AY: {academicYearName}
              </span>
            )}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm font-semibold text-[#F5E6BE] shadow-sm transition hover:border-[#FFC629] hover:text-[#FFC629]"
            onClick={handlePrintTimetable}
          >
            <BiDownload className="text-lg text-[#FFC629]" /> Print PDF
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition ${
              isEditing
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black shadow-[#FFC629]/20 hover:brightness-110'
            } disabled:opacity-50`}
            onClick={() => setIsEditing(!isEditing)}
            disabled={!selectedDivision}
          >
            {isEditing ? <><BiCheck className="text-lg" /> Finish Editing</> : <><BiEditAlt className="text-lg" /> Edit Schedule</>}
          </button>
        </div>
      </div>

      {/* Control Panel & Grid */}
      <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#FFC629]">Standard Class</label>
              <select
                className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3.5 py-2.5 text-sm font-medium text-white shadow-sm outline-none transition focus:border-[#FFC629]"
                value={selectedStandard}
                onChange={(e) => handleStandardChange(e.target.value)}
              >
                <option value="">Select Class</option>
                {standards.map(s => (
                  <option key={s.standardId} value={s.standardId}>
                    {s.standard || s.standardName}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#FFC629]">Division Section</label>
              <select
                className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3.5 py-2.5 text-sm font-medium text-white shadow-sm outline-none transition focus:border-[#FFC629] disabled:opacity-50"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                disabled={!selectedStandard}
              >
                <option value="">Section</option>
                {divisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
              </select>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] px-5 py-2.5 text-sm font-bold text-black shadow-sm transition hover:brightness-110 disabled:opacity-50"
              onClick={fetchTimetable}
              disabled={!selectedDivision || loading}
            >
              <BiFilterAlt className="text-lg" /> {loading ? 'Loading...' : 'Load Schedule'}
            </button>
          </div>
          {isEditing && (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Click any cell to add or modify schedule slots
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!selectedDivision ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
            <BiTable className="text-4xl text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700">No Schedule Selected</h3>
            <p className="max-w-md text-sm">Please select a Standard and Division from the panel above to load the timetable grid.</p>
          </div>
        ) : (
          <div className="table-responsive-premium">
            <table className="timetable-grid-premium">
              <thead>
                <tr>
                  <th className="time-col-premium">Period</th>
                  {days.map(day => <th key={day}>{day.charAt(0) + day.slice(1).toLowerCase()}</th>)}
                </tr>
              </thead>
              <tbody>
                {periods.map(periodNum => {
                  const periodEntry = timetableGrid.find(p => p.periodNumber === periodNum);
                  const timeStr = periodEntry ? `${periodEntry.startTime.substring(0, 5)} - ${periodEntry.endTime.substring(0, 5)}` : `Period ${periodNum}`;

                  return (
                    <tr key={periodNum}>
                      <td className="time-slot-premium">
                        <div className="period-label-premium">P{periodNum}</div>
                        <div className="time-sublabel-premium">{timeStr}</div>
                      </td>
                      {days.map(day => {
                        const slot = getSlotData(day, periodNum);
                        const color = getSubjectColor(slot?.subjectName);
                        
                        return (
                          <td
                            key={`${day}-${periodNum}`}
                            className={`slot-cell-premium ${isEditing ? 'editable' : ''} ${slot ? 'has-data' : 'empty'}`}
                            onClick={() => handleSlotClick(day, periodNum)}
                          >
                            {slot ? (
                              <div className="timetable-slot-card" style={{
                                background: color.light,
                                borderLeft: `4px solid ${color.text}`,
                                borderColor: color.border,
                              }}>
                                <div className="slot-inner-premium">
                                  <span className="subject-name-premium" style={{ color: color.text }}>
                                    <BiBook className="slot-icon-inline" /> {slot.subjectName}
                                  </span>
                                  <span className="teacher-name-premium" style={{ color: '#475569' }}>
                                    <BiUser className="slot-icon-inline" /> {slot.teacherName}
                                  </span>
                                  {slot.roomNumber && (
                                    <span className="room-number-premium" style={{ background: color.border, color: color.text }}>
                                      <BiMapPin className="slot-icon-inline" /> Rm {slot.roomNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              isEditing ? (
                                <div className="timetable-empty-card">
                                  <BiPlus size={16} />
                                  <span>Assign</span>
                                </div>
                              ) : (
                                <span className="empty-dash">—</span>
                              )
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
        )}
      </div>

      {/* Glassmorphic Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay-premium" onClick={() => setShowEditModal(false)}>
          <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h3>{activeSlot.timetableId ? 'Modify' : 'Create'} Schedule Slot</h3>
              <button className="btn-close-premium" onClick={() => setShowEditModal(false)}><BiX /></button>
            </div>
            
            <div className="modal-badge-slot-info">
              <span>{activeSlot.dayOfWeek}</span> &bull; <span>Period {activeSlot.periodNumber}</span>
            </div>

            <form className="grid gap-15 mt-1" onSubmit={handleSaveSlot}>
              <div className="form-group-premium">
                <label>Subject</label>
                <select className="select-premium w-100" name="subjectId" defaultValue={activeSlot.subjectId} required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
                </select>
              </div>
              <div className="form-group-premium">
                <label>Assigned Teacher</label>
                <select className="select-premium w-100" name="teacherId" defaultValue={activeSlot.teacherId} required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.teacherName}</option>)}
                </select>
              </div>
              <div className="form-group-premium">
                <label>Room / Class Room</label>
                <input type="text" name="roomNumber" className="input-premium" defaultValue={activeSlot.roomNumber || ''} placeholder="e.g. 101, Lab A" />
              </div>
              <div className="grid grid-2 gap-1">
                <div className="form-group-premium">
                  <label>Start Time</label>
                  <input type="time" name="startTime" className="input-premium" defaultValue={safeTime(activeSlot.startTime)} required />
                </div>
                <div className="form-group-premium">
                  <label>End Time</label>
                  <input type="time" name="endTime" className="input-premium" defaultValue={safeTime(activeSlot.endTime)} required />
                </div>
              </div>
              
              <div className="flex-between gap-1 mt-2 modal-footer-actions">
                {activeSlot.timetableId ? (
                  <button type="button" className="btn-delete-slot flex-center gap-05" onClick={handleDeleteSlot}>
                    <BiTrash /> Remove Slot
                  </button>
                ) : <div />}
                <div className="flex-center gap-1">
                  <button type="button" className="btn-cancel-modal" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn-submit-modal">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled CSS */}
      <style>{`
        .timetable-page {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .main-title-timetable {
          font-weight: 850;
          color: var(--text-main);
          font-size: 2.1rem;
          letter-spacing: -0.03em;
        }

        .icon-badge {
          background: var(--primary-glow);
          color: var(--primary);
          padding: 0.6rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          margin-right: 0.25rem;
        }

        .subtitle-container {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .badge-academic-year {
          background: var(--primary-soft, rgba(93, 95, 239, 0.1));
          color: var(--primary);
          padding: 0.25rem 0.65rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1px solid rgba(93, 95, 239, 0.15);
        }

        .live-dot-indicator {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #10b981;
        }

        /* Buttons styling */
        .btn-outline-premium {
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          color: var(--text-main);
          font-weight: 600;
          border-radius: 12px;
          padding: 0.65rem 1.3rem;
          font-size: 0.9rem;
          transition: all 0.25s ease;
          box-shadow: var(--shadow-sm);
        }

        .btn-outline-premium:hover {
          background: var(--bg-light);
          border-color: var(--text-muted);
          transform: translateY(-1px);
        }

        .btn-edit-timetable {
          background: var(--primary);
          color: #ffffff;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.65rem 1.4rem;
          font-size: 0.9rem;
          border: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(93, 95, 239, 0.2);
        }

        .btn-edit-timetable:hover:not(:disabled) {
          background: var(--primary-dark);
          box-shadow: 0 6px 20px rgba(93, 95, 239, 0.35);
          transform: translateY(-1px);
        }

        .btn-edit-timetable:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .btn-finish-editing {
          background: #10b981;
          color: #ffffff;
          font-weight: 600;
          border-radius: 12px;
          padding: 0.65rem 1.4rem;
          font-size: 0.9rem;
          border: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .btn-finish-editing:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        /* Board layout */
        .timetable-board-card {
          background: #0E0E0E;
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid #222222;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .filter-dashboard-panel {
          background: #141414;
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid #2A2A2A;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .filters-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .form-group-premium {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-group-premium label {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #FFC629;
          letter-spacing: 0.05em;
        }

        .select-premium {
          background: #161616;
          border: 1.5px solid #333333;
          border-radius: 12px;
          height: 42px !important;
          padding: 0 1.25rem !important;
          font-size: 0.88rem;
          font-weight: 600;
          color: #FFC629;
          min-width: 160px;
          outline: none;
          transition: all 0.25s ease;
          box-sizing: border-box !important;
        }

        .select-premium:focus {
          border-color: #FFC629;
          box-shadow: 0 0 0 3px rgba(255, 198, 41, 0.2);
        }

        .input-premium {
          background: #161616;
          border: 1.5px solid #333333;
          border-radius: 12px;
          padding: 0.65rem 1.25rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: #FFFFFF;
          outline: none;
          transition: all 0.25s ease;
        }

        .input-premium:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.15);
        }

        .btn-load-grid {
          background: var(--primary);
          color: #ffffff;
          border: none;
          font-weight: 700;
          border-radius: 12px;
          padding: 0 1.5rem !important;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(93, 95, 239, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 42px !important;
          box-sizing: border-box !important;
        }

        .btn-load-grid:hover:not(:disabled) {
          background: var(--primary-dark);
          box-shadow: 0 6px 16px rgba(93, 95, 239, 0.35);
          transform: translateY(-1px);
        }

        .btn-load-grid:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .badge-edit-mode {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #ffedd5;
          padding: 0.5rem 1.1rem;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .edit-pulse-dot {
          width: 8px;
          height: 8px;
          background: #f97316;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }

        /* Placeholder */
        .empty-grid-placeholder {
          text-align: center;
          padding: 5rem 2rem;
          color: var(--text-muted);
        }

        .placeholder-icon-table {
          font-size: 4.5rem;
          color: var(--border-light);
          margin-bottom: 1.5rem;
        }

        .empty-grid-placeholder h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }

        .empty-grid-placeholder p {
          max-width: 420px;
          margin: 0 auto;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Grid elements */
        .table-responsive-premium {
          overflow-x: auto;
          width: 100%;
          border-radius: 24px;
          border: none;
          margin-top: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          background: #f8fafc;
          padding: 10px;
          box-sizing: border-box;
        }

        .timetable-grid-premium {
          width: 100%;
          border-collapse: separate;
          border-spacing: 8px; /* Spaced tiles instead of boring flat table lines! */
          table-layout: fixed; /* Strictly equal column sizes */
        }

        .timetable-grid-premium th, 
        .timetable-grid-premium td {
          border: none !important; /* Clean rounded cards without borders */
          border-radius: 16px;
        }

        .timetable-grid-premium th {
          background: transparent !important;
          color: #475569;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          padding: 0.85rem 0.5rem;
          width: 15%; /* Tuesday - Saturday columns */
        }

        .time-col-premium {
          width: 10% !important; /* Period column */
        }

        .time-slot-premium {
          background: #181818 !important;
          vertical-align: middle;
          padding: 1.25rem 0.75rem !important;
          border: 1px solid #262626 !important;
        }

        .period-label-premium {
          font-size: 1.2rem;
          font-weight: 850;
          color: #FFC629 !important;
          font-family: 'Lexend', sans-serif;
        }

        .time-sublabel-premium {
          font-size: 0.68rem;
          color: #A0A0A0;
          font-weight: 650;
          margin-top: 0.2rem;
        }

        .slot-cell-premium {
          min-width: 130px;
          transition: all 0.25s ease;
          position: relative;
          height: 105px;
          vertical-align: middle;
          background: #121212 !important;
          border: 1px solid #222222 !important;
          padding: 0px !important; /* Fill slot exactly */
        }

        .timetable-slot-card {
          border-radius: 16px;
          padding: 0.65rem 0.85rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid #2A2A2A;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .timetable-slot-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.5);
          filter: brightness(1.1);
        }

        .timetable-empty-card {
          border: 2px dashed #2A2A2A;
          border-radius: 16px;
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #666666;
          background: #141414;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .timetable-empty-card:hover {
          border-color: #FFC629;
          color: #FFC629;
          background: rgba(255, 198, 41, 0.08);
        }
          background: transparent;
          box-sizing: border-box;
        }

        .timetable-empty-card:hover {
          border-color: var(--primary);
          background: rgba(93, 95, 239, 0.04);
          color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(93, 95, 239, 0.05);
        }

        .slot-inner-premium {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: left;
        }

        .subject-name-premium {
          font-weight: 800;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          line-height: 1.2;
          font-family: 'Lexend', sans-serif;
        }

        .slot-icon-inline {
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .teacher-name-premium {
          font-size: 0.72rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .room-number-premium {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .empty-dash {
          color: #e2e8f0;
          font-weight: 400;
          font-size: 1.2rem;
        }

        /* Modal styling */
        .modal-overlay-premium {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modalFadeIn 0.25s ease;
          padding: 1.5rem;
          box-sizing: border-box;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content-premium {
          background: #ffffff;
          border: none;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-radius: 24px;
          padding: 2.5rem;
          width: 90%;
          max-width: 500px;
          box-sizing: border-box;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: calc(100vh - 3rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-content-premium form,
        .modal-content-premium .padding-1-5 {
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .modal-content-premium form::-webkit-scrollbar,
        .modal-content-premium .padding-1-5::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content-premium form::-webkit-scrollbar-track,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-content-premium form::-webkit-scrollbar-thumb,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .modal-content-premium form::-webkit-scrollbar-thumb:hover,
        .modal-content-premium .padding-1-5::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header-premium h3 {
          font-family: 'Lexend', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }

        .btn-close-premium {
          background: #f1f5f9;
          border: none;
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-close-premium:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: rotate(90deg);
        }

        .modal-badge-slot-info {
          background: var(--primary-glow);
          color: var(--primary);
          padding: 0.35rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          width: fit-content;
          margin-top: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .modal-footer-actions {
          border-top: 1.5px solid var(--border-light);
          padding-top: 1.25rem;
        }

        .btn-delete-slot {
          background: rgba(239, 68, 68, 0.08);
          border: none;
          color: #ef4444;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.6rem 1.1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-delete-slot:hover {
          background: #ef4444;
          color: #ffffff;
        }

        .btn-cancel-modal {
          background: transparent;
          border: 1.5px solid var(--border-light);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.88rem;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel-modal:hover {
          background: var(--bg-light);
        }

        .btn-submit-modal {
          background: var(--primary);
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.6rem 1.4rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(93, 95, 239, 0.2);
        }

        .btn-submit-modal:hover {
          background: var(--primary-dark);
          box-shadow: 0 6px 16px rgba(93, 95, 239, 0.35);
        }

        .alert-premium {
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .alert-danger-premium {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default Timetable;
