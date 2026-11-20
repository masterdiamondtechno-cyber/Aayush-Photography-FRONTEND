import { useEffect, useState } from 'react';
import {
  BiEnvelope,
  BiPhone,
  BiCalendar,
  BiMap,
  BiBell,
  BiCheckCircle,
} from 'react-icons/bi';
import { getDashboardData } from '../../api/api';
import { useLoginRedirectLogger } from '../../hooks/useLoginRedirectLogger';
import { useStudentSearch } from '../../contexts/StudentSearchContext';


const DASHBOARD_SECTION_NAMES = {
  profile: [
    'student profile',
    'profile',
    'student information',
    'student info',
  ],
  attendance: [
    'monthly attendance',
    'attendance summary',
    'student attendance',
    'attendance',
  ],
  attendanceTrend: [
    'attendance trend',
    'attendance chart',
    'monthly attendance chart',
  ],
  subjectProgress: [
    'syllabus progress',
    'subject progress',
    'subject-wise progress',
    'progress report',
  ],
  assessments: [
    'upcoming assessments',
    'assessment schedule',
    'upcoming exams',
    'exam schedule',
    'assessments',
  ],
  feedback: [
    "teacher's feedback",
    'teachers feedback',
    'teacher feedback',
    'feedback',
  ],
};

const getStoredValue = (key) =>
  sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '';

const parseJwtPayload = (token) => {
  if (!token) {
    return null;
  }

  const tokenParts = token.split('.');

  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      '='
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
};

const toNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const normalizeKey = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const clampPercentage = (value) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(parsedValue)));
};

const createItemsMap = (items = []) => {
  const mappedItems = {};

  items.forEach((item, index) => {
    const itemName =
      item?.dashboardItemName || item?.name || item?.title || `item ${index}`;

    mappedItems[normalizeKey(itemName)] =
      item?.data ?? item?.value ?? item?.items ?? item;
  });

  return mappedItems;
};

const findDashboardSection = (itemsMap, candidateNames) => {
  for (const candidateName of candidateNames) {
    const normalizedCandidate = normalizeKey(candidateName);

    if (itemsMap[normalizedCandidate] !== undefined) {
      return itemsMap[normalizedCandidate];
    }
  }

  for (const [itemName, itemValue] of Object.entries(itemsMap)) {
    if (
      candidateNames.some((candidateName) => {
        const normalizedCandidate = normalizeKey(candidateName);
        return (
          itemName.includes(normalizedCandidate) ||
          normalizedCandidate.includes(itemName)
        );
      })
    ) {
      return itemValue;
    }
  }

  return null;
};

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.list)) {
    return value.list;
  }

  if (Array.isArray(value?.records)) {
    return value.records;
  }

  return [];
};

const getAssessmentDateParts = (value) => {
  if (!value) {
    return { month: 'TBA', day: '--' };
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return { month: 'TBA', day: '--' };
  }

  return {
    month: parsedDate
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase(),
    day: parsedDate.toLocaleDateString('en-US', { day: '2-digit' }),
  };
};

const getAttendanceBars = (trendItems, fallbackValue) => {
  if (trendItems.length > 0) {
    return trendItems
      .slice(0, 7)
      .map((item) =>
        clampPercentage(
          item?.attendancePercentage ??
          item?.presentPercentage ??
          item?.percentage ??
          item?.value ??
          item
        )
      );
  }

  return Array.from({ length: 7 }, () => clampPercentage(fallbackValue));
};

const getAssessmentStatus = (assessment) => {
  const explicitStatus =
    assessment?.status || assessment?.examStatus || assessment?.type;

  if (explicitStatus) {
    return explicitStatus;
  }

  const assessmentDate =
    assessment?.examDate || assessment?.date || assessment?.startDate;

  if (!assessmentDate) {
    return 'Scheduled';
  }

  const parsedDate = new Date(assessmentDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Scheduled';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate >= today ? 'Upcoming' : 'Completed';
};

const getStatusStyles = (status) => {
  const normalizedStatus = normalizeKey(status);

  if (normalizedStatus.includes('complete')) {
    return {
      background: 'rgba(16, 185, 129, 0.12)',
      color: '#0f9f6e',
    };
  }

  if (normalizedStatus.includes('upcoming') || normalizedStatus.includes('next')) {
    return {
      background: 'rgba(255, 153, 0, 0.12)',
      color: '#cc7a00',
    };
  }

  return {
    background: 'rgba(92, 84, 246, 0.12)',
    color: 'var(--primary)',
  };
};

const StudentDashboard = () => {
  useLoginRedirectLogger('Student Dashboard Login Response:');

  const [dashboardItems, setDashboardItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { searchQuery } = useStudentSearch();

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      const tokenPayload = parseJwtPayload(getStoredValue('token'));
      const academicYearId = toNumber(
        getStoredValue('academicYearId') || tokenPayload?.ayi
      );
      const schoolId = toNumber(getStoredValue('schoolId') || tokenPayload?.sid);
      const studentId = toNumber(
        getStoredValue('studentId') || getStoredValue('userId') || tokenPayload?.uid
      );
      const role =
        tokenPayload?.role ||
        (getStoredValue('userRole') || 'student').toUpperCase();

      const missingFields = [];

      if (!academicYearId) missingFields.push('academicYearId');
      if (!schoolId) missingFields.push('schoolId');
      if (!studentId) missingFields.push('studentId');
      if (!role) missingFields.push('role');

      if (missingFields.length > 0) {
        if (isMounted) {
          setError(
            `Dashboard session is missing: ${missingFields.join(', ')}.`
          );
          setLoading(false);
        }
        return;
      }

      try {
        const requestPayload = {
          academicYearId,
          schoolId,
          studentId,
          role,
        };

        const response = await getDashboardData(requestPayload);

        if (!isMounted) return;

        if (response?.status === 'SUCCESS') {
          const itemsMap = createItemsMap(response?.data?.items || []);
          setDashboardItems(itemsMap);
          
          // Save student profile data dynamically from response.data.studentInfo
          const studentInfo = response?.data?.studentInfo;
          if (studentInfo) {
            const profileData = {
              fullName: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim(),
              email: studentInfo.emailId || '',
              phone: studentInfo.mobileNumber || '',
              dob: studentInfo.dateOfBirth || '',
              address: studentInfo.address || '',
              studentId: studentInfo.studentId || '',
              rollNo: studentInfo.studentId || '',
              standardName: studentInfo.standardName || '',
              divisionName: studentInfo.divisionName || '',
              guardianName: studentInfo.guardianName || '',
              admissionDate: studentInfo.admissionDate || '',
            };
            sessionStorage.setItem('profileData', JSON.stringify(profileData));
          } else {
            // Fallback to section parsing if studentInfo is not directly present
            const profileInfo = findDashboardSection(itemsMap, DASHBOARD_SECTION_NAMES.profile);
            if (profileInfo) {
              sessionStorage.setItem('profileData', JSON.stringify(profileInfo));
            }
          }
          return;
        }

        setError(response?.message || 'Failed to load dashboard data.');
      } catch (fetchError) {
        if (!isMounted) return;
        const backendMessage = fetchError?.response?.data?.message || fetchError?.message;
        setError(backendMessage || 'Failed to load dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  const userRole = (getStoredValue('userRole') || 'student').toLowerCase();
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  const attendanceData = asObject(
    findDashboardSection(dashboardItems, DASHBOARD_SECTION_NAMES.attendance)
  );
  const attendanceTrendSection =
    findDashboardSection(dashboardItems, DASHBOARD_SECTION_NAMES.attendanceTrend) ||
    attendanceData?.dailyBreakdown ||
    attendanceData?.trend ||
    attendanceData?.chartData;
  const subjectProgress = asArray(
    findDashboardSection(dashboardItems, DASHBOARD_SECTION_NAMES.subjectProgress)
  );
  const assessments = asArray(
    findDashboardSection(dashboardItems, DASHBOARD_SECTION_NAMES.assessments)
  );

  const attendancePercentage = clampPercentage(
    attendanceData?.attendancePercentage ??
    attendanceData?.percentage ??
    attendanceData?.presentPercentage ??
    attendanceData?.monthlyAttendance ??
    attendanceData?.rate
  );
  const attendanceChange = Number(
    attendanceData?.changeFromLastMonth ?? attendanceData?.changePercentage
  );
  const attendanceMeta = attendanceData?.monthName
    ? `${attendanceData.monthName}${attendanceData?.year ? ` ${attendanceData.year}` : ''}`
    : 'Current month';
  const attendanceInsight =
    attendanceData?.changeText ||
    attendanceData?.summary ||
    attendanceData?.remark ||
    (Number.isFinite(attendanceChange)
      ? `${attendanceMeta}: ${attendanceChange > 0 ? '+' : ''}${attendanceChange}% from last month`
      : 'Attendance trend is shown below.');
  const attendanceStatsText =
    attendanceData?.totalDays !== undefined
      ? `Present ${attendanceData?.presentDays ?? 0}/${attendanceData.totalDays} days | Absent ${attendanceData?.absentDays ?? 0}`
      : attendanceMeta;
  const attendanceBars = getAttendanceBars(
    asArray(attendanceTrendSection),
    attendancePercentage
  );
  const progressItems = subjectProgress.slice(0, 4).map((item, index) => ({
    id: item?.id || item?.subjectId || `subject-progress-${index}`,
    name:
      item?.subjectName ||
      item?.subject ||
      item?.name ||
      `Subject ${index + 1}`,
    percentage: clampPercentage(
      item?.completionPercentage ??
      item?.progress ??
      item?.progressPercentage ??
      item?.percentage ??
      item?.averagePercentage
    ),
  }));
  const assessmentItems = assessments.slice(0, 4).map((item, index) => ({
    id: item?.id || item?.examId || `assessment-${index}`,
    title:
      item?.assessmentName ||
      item?.examName ||
      item?.title ||
      item?.name ||
      `Assessment ${index + 1}`,
    subtitle:
      item?.subjectName ||
      item?.subject ||
      item?.time ||
      item?.description ||
      'Details unavailable',
    date: item?.examDate || item?.date || item?.startDate,
    status: getAssessmentStatus(item),
  }));

  const searchLower = (searchQuery || '').toLowerCase();
  
  const filteredProgressItems = searchLower 
    ? progressItems.filter(item => (item.name || '').toLowerCase().includes(searchLower))
    : progressItems;
    
  const filteredAssessmentItems = searchLower
    ? assessmentItems.filter(item => 
        (item.title || '').toLowerCase().includes(searchLower) ||
        (item.subtitle || '').toLowerCase().includes(searchLower) ||
        (item.status || '').toLowerCase().includes(searchLower)
      )
    : assessmentItems;

  if (loading) {
    return (
      <div className="student-dashboard fade-in space-y-8">
        <div className="premium-card" style={{ padding: '2rem', textAlign: 'center', marginTop: '1rem' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="flex student-dashboard fade-in">
      <div className="dashboard-header-part">
        <h1 className="dashboard-title">{displayRole} Dashboard</h1>
        <p className="dashboard-subtitle">Track your academic journey and performance.</p>
        {error && <div className="error-notice">{error}</div>}
      </div>

      <div className="student-dashboard-content-wrapper">
        <div className="student-main-content full-width">
          <div className="stats-grid-row">
            {/* Attendance */}
            <div className="premium-card attendance-vibe">
              <div className="attendance-vibe-content">
                <h3 className="attendance-vibe-title">Monthly Attendance</h3>
                <div className="attendance-vibe-stats">
                  <span className="attendance-vibe-percentage">{attendancePercentage}%</span>
                  <span className="attendance-vibe-insight">{attendanceInsight}</span>
                </div>
                <div className="attendance-vibe-details">{attendanceStatsText}</div>
                <div className="mini-chart">
                  {attendanceBars.map((height, index) => (
                    <div key={`attendance-bar-${index}`} className="mini-chart-bar" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
              <BiCheckCircle className="attendance-vibe-bg-icon" />
            </div>

            {/* Syllabus */}
            <div className="premium-card">
              <h3 className="card-title">Syllabus Progress</h3>
              <div>
                {filteredProgressItems.length > 0 ? (
                  filteredProgressItems.map((item) => (
                    <div key={item.id} className="subject-progress-item">
                      <div className="progress-labels">
                        <span className="progress-subject-name">{item.name}</span>
                        <span className="progress-percentage">{item.percentage}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state-text">{searchQuery ? 'No subjects match your search.' : 'No syllabus progress data available yet.'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Assessments */}
          <div className="premium-card glass-card">
            <div className="card-header-flex">
              <h3>Upcoming Assessments</h3>
              <button type="button" className="btn-link">Exam Schedule</button>
            </div>
            <div className="assessment-list">
              {filteredAssessmentItems.length > 0 ? (
                filteredAssessmentItems.map((assessment) => {
                  const dateParts = getAssessmentDateParts(assessment.date);
                  const statusStyles = getStatusStyles(assessment.status);

                  return (
                    <div key={assessment.id} className="assessment-item">
                      <div className="date-icon-box">
                        <span className="date-month">{dateParts.month}</span>
                        <span className="date-day">{dateParts.day}</span>
                      </div>
                      <div className="assessment-info">
                        <h4>{assessment.title}</h4>
                        <p>
                          {assessment.subtitle}
                          {assessment.date ? ` | ${assessment.date}` : ''}
                        </p>
                      </div>
                      <span className="badge-status" style={{ background: statusStyles.background, color: statusStyles.color }}>
                        {assessment.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="empty-state-text">{searchQuery ? 'No assessments match your search.' : 'No upcoming assessments available yet.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
