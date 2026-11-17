import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { BiGroup, BiBook, BiBookmark, BiMessageSquareDetail, BiTime, BiCheckCircle, BiCalendar } from 'react-icons/bi';
import DataTable from '../../components/common/DataTable';
import { getTeacherStats, getTeacherSchedule, getTeacherGradingTasks, getCurrentAcademicYear, getActiveNotifications } from '../../api/api';
import { getAuthValue, setAuthValue } from '../../utils/auth';


/**
 * Enhanced Teacher Dashboard Page
 */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || 'Teacher';
  const displayName = userEmail.split('@')[0].toUpperCase();
  const userRole = localStorage.getItem('userRole') || 'teacher';
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  // States for API data
  const [stats, setStats] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [tasksData, setTasksData] = useState({ tasks: [], pendingTasksCount: 0 });
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      let schoolId = getAuthValue('schoolId');
      let academicYearId = getAuthValue('academicYearId');
      let teacherId = getAuthValue('teacherId') || getAuthValue('userId');

      // Attempt to recover missing academicYearId if schoolId is present
      if (!academicYearId && schoolId) {
        try {
          console.log('[TeacherDashboard] Academic Year missing, attempting recovery...');
          const yearRes = await getCurrentAcademicYear(schoolId);
          if (yearRes.status === 'SUCCESS' && (yearRes.data?.academicYearId || yearRes.data?.id)) {
            academicYearId = yearRes.data.academicYearId || yearRes.data.id;
            // Update storage for next time
            setAuthValue('academicYearId', academicYearId);
            console.log('[TeacherDashboard] Recovered Academic Year:', academicYearId);
          }
        } catch (yearErr) {
          console.error('[TeacherDashboard] Failed to recover academic year:', yearErr);
        }
      }

      if (!schoolId || !academicYearId || !teacherId) {
        console.warn('[TeacherDashboard] Missing session IDs:', { schoolId, academicYearId, teacherId });
        setError('Missing session configuration (Academic Year). Please log in again.');
        setLoading(false);
        return;
      }

      const payload = { schoolId, academicYearId, teacherId };

      try {
        const [statsRes, scheduleRes, tasksRes, noticesRes] = await Promise.all([
          getTeacherStats(payload),
          getTeacherSchedule(payload),
          getTeacherGradingTasks(payload),
          getActiveNotifications({ schoolId: parseInt(schoolId), academicYearId: parseInt(academicYearId) })
            .catch(err => {
              console.log('[TeacherDashboard] No active notifications or error:', err.message);
              return { status: 'SUCCESS', data: [] };
            })
        ]);

        if (statsRes.status === 'SUCCESS') setStats(statsRes.data);
        if (scheduleRes.status === 'SUCCESS') setSchedule(scheduleRes.data.schedule || []);
        if (tasksRes.status === 'SUCCESS') setTasksData(tasksRes.data);
        if (noticesRes.status === 'SUCCESS' && Array.isArray(noticesRes.data)) {
          const filteredNotices = noticesRes.data.filter(notice => {
            const aud = (notice.targetAudience || '').toUpperCase();
            return aud.includes('TEACHER') || aud === 'ALL';
          });
          setNotices(filteredNotices);
        }

      } catch (err) {
        console.error('[TeacherDashboard] API Error:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p className="text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '70vh', textAlign: 'center', padding: '2rem' }}>
        <div className="card glass-card p-3">
          <h3 className="text-danger mb-1">Notice</h3>
          <p className="text-muted">{error}</p>
          <button className="btn-primary mt-2" onClick={() => window.location.reload()}>Retry Sync</button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-['Lexend'] text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{displayRole} Dashboard</h1>
        <h2 className="text-lg font-medium text-slate-500">Welcome back, <span className="font-bold text-indigo-600">{stats?.teacherUsername || displayName}</span></h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          title="My Students" 
          count={stats?.stats?.totalStudents || "0"} 
          icon={BiGroup} 
          color="#5d5fef" 
          subtitle={stats?.stats?.isClassTeacher 
            ? `Class Teacher of ${stats?.stats?.classTeacherClassName || ''}` 
            : `Across ${stats?.stats?.totalSections || 0} sections`
          } 
          onClick={() => navigate('/teacher/students')}
        />
        <StatCard 
          title="My Subjects" 
          count={stats?.stats?.totalSubjects || "0"} 
          icon={BiBook} 
          color="#10b981" 
          subtitle="Active this term" 
          onClick={() => navigate('/teacher/subjects')}
        />
        <StatCard 
          title="Study Materials" 
          count={stats?.stats?.studyMaterialsCount || "0"} 
          icon={BiBookmark} 
          color="#f59e0b" 
          subtitle="Uploaded files" 
        />
        <StatCard 
          title="New Feedbacks" 
          count={stats?.stats?.newFeedbacksCount || "0"} 
          icon={BiMessageSquareDetail} 
          color="#ef4444" 
          subtitle="Awaiting review" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-900">Today&apos;s Schedule</h3>
              <span className="text-sm text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="timeline" style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-light)' }}>
              {schedule.length > 0 ? (
                schedule.map((item, idx) => (
                  <div key={idx} className={`timeline-item ${item.status === 'IN_PROGRESS' ? 'current' : ''}`} style={{ position: 'relative', paddingBottom: '2rem' }}>
                    <div className="time-indicator" style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      color: item.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem', 
                      marginBottom: '0.25rem' 
                    }}>
                      <BiTime /> {item.time}
                    </div>
                    <div className="event-details">
                      <strong style={{ display: 'block' }}>{item.subjectName}</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        {item.standard} Standard - Section {item.section} | {item.room}
                      </p>
                    </div>
                    {item.status === 'IN_PROGRESS' && (
                      <span className="badge-live" style={{ display: 'inline-block', marginTop: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid var(--success)' }}>In Progress</span>
                    )}
                    {item.status === 'COMPLETED' && (
                      <span className="badge-completed" style={{ display: 'inline-block', marginTop: '0.5rem', background: 'rgba(93, 95, 239, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>Done</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-2">
                  <p className="text-muted italic">No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex-between mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Institutional Notices</h3>
              <button className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate('/teacher/noticeboard')}>View All</button>
            </div>
            <DataTable 
              headers={['Subject', 'Type', 'Date']}
              data={notices}
              renderRow={(notice, index) => (
                <tr key={index}>
                  <td className="font-medium" style={{ fontWeight: '500' }}>{notice.title}</td>
                  <td><span className="badge-type" style={{ background: 'rgba(93, 95, 239, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>{notice.sentBy || notice.type || 'Admin'}</span></td>
                  <td className="text-muted" style={{ color: 'var(--text-muted)' }}>
                    {notice.sentAt ? new Date(notice.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>

        <div className="side-cards-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card grading-task-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Grading Tasks</h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8, fontSize: '0.9rem' }}>
              You have {tasksData.pendingTasksCount} sets of assignments awaiting evaluation.
            </p>
            <div className="tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasksData.tasks.slice(0, 3).map((task, idx) => (
                <div key={idx} className="task-item-bg" style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '10px' }}>
                  <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{task.title}</span>
                    <span style={{ fontWeight: '700' }}>{task.gradedCount}/{task.totalCount}</span>
                  </div>
                  <div className="progress-bar-small" style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                    <div className="progress-fill" style={{ height: '100%', background: 'white', borderRadius: '2px', width: `${task.progressPercent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-white" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}>Continue Grading</button>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button className="action-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-light)', background: 'var(--bg-light)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <BiCheckCircle style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Attendance</span>
              </button>
              <button className="action-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-light)', background: 'var(--bg-light)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <BiBookmark style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Resources</span>
              </button>
              <button className="action-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-light)', background: 'var(--bg-light)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <BiMessageSquareDetail style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Messages</span>
              </button>
              <button className="action-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border-light)', background: 'var(--bg-light)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <BiCalendar style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Exams</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
