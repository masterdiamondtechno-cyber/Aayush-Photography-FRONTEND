import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { MOCK_STATS } from '../../data/mockData';
import { BiUser, BiGroup } from 'react-icons/bi';
import { getDashboardData, getSchoolById } from '../../api/api';
import { getAuthValue } from '../../utils/auth';
import { useAcademicYearStore } from '../../store/academicYearStore';

/**
 * Admin Dashboard Page - Luxury Dark Gold Theme per Ayushyachi Photography
 * High-contrast Bright Yellow Typography & Spacious Cards ("khula khula")
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);

  // School Info Modal State
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loadingSchoolInfo, setLoadingSchoolInfo] = useState(false);

  // Student Count Modal State
  const [showStudentCountModal, setShowStudentCountModal] = useState(false);

  const { selectedAcademicYear } = useAcademicYearStore();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAcademicYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const schoolId = getAuthValue('schoolId');
      const academicYearId = selectedAcademicYear?.academicYearId || getAuthValue('academicYearId');
      const role = getAuthValue('userRole') || 'school';

      if (!schoolId) {
        setError("Configuration missing: School ID not found. Please log in again.");
        setLoading(false);
        return;
      }
      if (!academicYearId) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      setNeedsSetup(false);

      const payload = {
        schoolId: parseInt(schoolId),
        academicYearId: parseInt(academicYearId),
        role: role.toLowerCase() === 'admin' ? 'school' : role.toLowerCase()
      };

      const response = await getDashboardData(payload);
      if (response && response.status === 'SUCCESS') {
        const itemsMap = {};
        response.data.items.forEach(item => {
          itemsMap[item.dashboardItemName] = item.data;
        });
        setDashboardData(itemsMap);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolCardClick = async () => {
    setShowSchoolModal(true);
    if (!schoolInfo) {
      setLoadingSchoolInfo(true);
      try {
        const schoolId = getAuthValue('schoolId');
        if (schoolId) {
          const response = await getSchoolById(parseInt(schoolId));
          if (response && response.status === 'SUCCESS') {
            setSchoolInfo(response.data);
          }
        }
      } catch (err) {
        console.error('Error fetching school info:', err);
      } finally {
        setLoadingSchoolInfo(false);
      }
    }
  };

  const handleStatCardClick = (moduleName) => {
    const role = getAuthValue('userRole') || 'admin';
    const targetPath = `/${role}/${moduleName}`;
    navigate(targetPath);
  };

  const fallbackSchoolName = getAuthValue('schoolName') || (getAuthValue('userEmail') || '').split('@')[0].toUpperCase();
  const schoolName = fallbackSchoolName || MOCK_STATS.schoolName;
  const userRole = getAuthValue('userRole') || 'admin';
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  if (loading && !dashboardData && !needsSetup) {
    return (
      <div className="flex h-64 items-center justify-center text-xl font-bold text-[#FFC629] animate-pulse">
        Loading Dashboard...
      </div>
    );
  }

  // First-time setup state (Waiting for Academic Year setup)
  if (needsSetup) {
    const role = getAuthValue('userRole') || 'school';
    const isSchoolRoute = location.pathname.startsWith('/school');
    const basePrefix = isSchoolRoute ? '/school' : (role.toLowerCase() === 'admin' ? '/admin' : '/school');
    const masterMenuPath = `${basePrefix}/master-menu`;

    const setupModules = [
      { label: '📅 Academic Year', route: `${basePrefix}/settings?tab=academic&action=add` },
      { label: '🏛️ Classes', route: `${basePrefix}/classes` },
      { label: '📚 Subjects', route: `${basePrefix}/subjects` },
      { label: '👨‍🏫 Teachers', route: `${basePrefix}/teachers` },
      { label: '👨‍🎓 Students', route: `${basePrefix}/students` },
      { label: '📝 Exams & Fees', route: `${basePrefix}/exam-center` },
    ];

    return (
      <div className="max-w-[1400px] mx-auto animate-[fadeIn_0.5s_ease-out] space-y-10">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
            <div>
              <h1 className="font-['Cinzel'] text-3xl sm:text-4xl font-extrabold text-[#FFC629] mb-2 tracking-wide">
                Welcome to Ayushyachi Photography
              </h1>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Let's configure <span className="text-[#FFC629] font-extrabold underline decoration-[#FFC629]/50">{schoolName}</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#141414] px-5 py-3 rounded-2xl border border-[#2A2A2A] shadow-md shrink-0">
                <div className="text-[11px] text-[#FFC629] font-extrabold uppercase tracking-widest">Today</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banner: Luxury Dark Gold Card matching Image 3/6 Layout ("khula khula") */}
        <div className="bg-gradient-to-br from-[#1C1917] via-[#2A200B] to-[#0F0E04] rounded-3xl p-10 md:p-14 lg:p-16 text-center relative overflow-hidden border border-[#FFC629]/40 shadow-2xl shadow-[#FFC629]/15">
          {/* Subtle Ambient Gold Glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FFC629]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#FFB703]/15 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="text-6xl md:text-7xl mb-6 animate-bounce">🏫</div>
            <h2 className="font-['Cinzel'] text-3xl md:text-5xl font-extrabold text-[#FFC629] mb-5 tracking-tight">
              Your institute setup is waiting!
            </h2>
            <p className="text-[#F5E6BE] text-base md:text-lg max-w-[650px] mx-auto mb-10 leading-relaxed font-medium">
              You haven't configured an Academic Year yet. Use the <strong className="text-[#FFC629] font-extrabold">Master Setup Wizard</strong> to
              configure your institute step-by-step — it only takes a few minutes to unlock the full platform.
            </p>

            <div className="flex justify-center gap-3.5 flex-wrap mb-10">
              {setupModules.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className="px-5 py-2.5 bg-[#FFC629]/15 hover:bg-[#FFC629]/30 active:bg-[#FFC629]/40 border border-[#FFC629]/40 hover:border-[#FFC629] rounded-full text-[#FFC629] hover:text-white font-bold text-sm backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-md shadow-black/20 hover:scale-105 active:scale-95"
                  title={`Configure ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(masterMenuPath)}
              className="px-10 py-4.5 bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black border-none rounded-2xl text-base font-extrabold cursor-pointer shadow-xl shadow-[#FFC629]/30 transition-all duration-300 inline-flex items-center gap-3 tracking-tight hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-[#FFC629]/50 active:translate-y-0"
            >
              <span className="text-xl">🚀</span>
              <span className="font-extrabold uppercase tracking-wide">Start Setup Wizard</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Dashboard
  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-[fadeIn_0.4s_ease-out]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-['Cinzel'] text-3xl sm:text-4xl font-extrabold text-[#FFC629] tracking-wide">
            {displayRole} Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#F5E6BE] mt-2 font-medium">
            Welcome back, <span className="font-bold text-white">{schoolName}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#141414] px-5 py-2.5 rounded-xl border border-[#2A2A2A] text-sm text-[#FFC629] font-bold shrink-0">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold">
          {error}
        </div>
      )}

      {/* Row 1: School Identity & Metric Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="md:col-span-2 lg:col-span-2 p-6 sm:p-8 bg-[#141414] border border-[#2A2A2A] rounded-3xl flex items-center gap-6 cursor-pointer hover:border-[#FFC629] hover:shadow-xl transition dashboard-panel"
          onClick={handleSchoolCardClick}
        >
          <div className="w-20 h-20 bg-[#1A1A1A] border-2 border-[#FFC629]/40 rounded-2xl flex items-center justify-center flex-shrink-0 p-3 overflow-hidden shadow-inner">
            <img
              src={dashboardData?.['School Info']?.schoolLogo || "/assets/school_logo_premium_1772187603829.png"}
              alt="Institute Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-block px-3 py-1 mb-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30">
              Verified Institute
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FFC629] mb-1.5 truncate font-['Cinzel']">
              {dashboardData?.['School Info']?.schoolName || fallbackSchoolName || MOCK_STATS.schoolName}
            </h3>
            <p className="text-[#F5E6BE] text-sm truncate font-medium">
              {dashboardData?.['School Info']?.schoolAddress || 'Excellence in Photography & Arts'}
            </p>
          </div>
        </div>

        <StatCard
          title="Students"
          count={dashboardData?.['Student Count']?.total || 0}
          icon={BiGroup}
          color="#FFC629"
          subtitle={`Active: ${dashboardData?.['Student Count']?.active || 0}`}
          onClick={() => handleStatCardClick('student')}
        />
        <StatCard
          title="Teachers"
          count={dashboardData?.['Teacher Count']?.total || 0}
          icon={BiUser}
          color="#10b981"
          subtitle={`Active: ${dashboardData?.['Teacher Count']?.active || 0}`}
          onClick={() => handleStatCardClick('teacher')}
        />
      </div>

      {/* Row 2: Student Attendance & Teacher Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-8">
        <div className="p-6 sm:p-8 lg:p-10 bg-[#141414] border border-[#2A2A2A] rounded-3xl shadow-xl dashboard-panel">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A2A]">
            <h3 className="font-['Cinzel'] text-xl font-bold text-[#FFC629]">Student Attendance</h3>
            <span className="text-xs font-bold text-white uppercase tracking-wider bg-[#1E1E1E] px-3 py-1 rounded-lg">By Standard</span>
          </div>
          <div className="h-[250px] flex flex-col justify-end">
            {(dashboardData?.['Student Attendance Bar Chart'] || []).length > 0 ? (
              <>
                <div className="flex items-end justify-around h-[180px] border-b border-l border-[#2A2A2A] p-4">
                  {dashboardData['Student Attendance Bar Chart'].map((item, i) => {
                    const value = item.attendancePercentage || 0;
                    return (
                      <div
                        key={i}
                        className="w-12 sm:w-16 bg-gradient-to-t from-[#B88B12] via-[#E0AC1B] to-[#FFC629] rounded-t-lg relative group transition-all"
                        style={{ height: `${Math.max(value, 5)}%` }}
                      >
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-extrabold opacity-0 group-hover:opacity-100 bg-[#090909] text-[#FFC629] border border-[#FFC629]/50 px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap transition-opacity">
                          {value}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-around mt-4 text-xs font-bold text-white">
                  {dashboardData['Student Attendance Bar Chart'].map((item, i) => (
                    <span key={i}>{item.standardName}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[#F5E6BE] text-sm font-medium">
                No attendance records available
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 bg-[#141414] border border-[#2A2A2A] rounded-3xl shadow-lg dashboard-panel">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A2A]">
            <h3 className="font-['Cinzel'] text-xl font-bold text-[#FFC629]">Teacher Attendance</h3>
            <span className="text-xs font-bold text-white uppercase tracking-wider bg-[#1E1E1E] px-3 py-1 rounded-lg">Daily Status</span>
          </div>
          <ul className="list-none space-y-3.5">
            {(dashboardData?.['Teacher Attendance Report'] || []).length > 0 ? (
              dashboardData['Teacher Attendance Report'].map((teacher, i) => {
                const status = (teacher.status || 'N/A').toUpperCase();
                const isPresent = status === 'ACTIVE';
                return (
                  <li key={i} className="p-4 border border-[#2A2A2A] bg-[#181818] rounded-xl flex justify-between items-center hover:border-[#FFC629]/40 transition">
                    <span className="text-white font-bold text-sm">{teacher.teacherName}</span>
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase ${
                        isPresent
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isPresent ? 'Present' : 'Absent'}
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="p-6 text-center text-[#F5E6BE] text-sm font-medium">No teacher attendance records</li>
            )}
          </ul>
        </div>
      </div>

      {/* Row 3: Student Distribution & Fee Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="p-6 sm:p-8 lg:p-10 bg-[#141414] border border-[#2A2A2A] rounded-3xl cursor-pointer hover:border-[#FFC629] shadow-lg transition dashboard-panel"
          onClick={() => setShowStudentCountModal(true)}
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A2A]">
            <h3 className="font-['Cinzel'] text-xl font-bold text-[#FFC629]">Student Distribution</h3>
            <span className="text-xs font-bold text-white uppercase tracking-wider bg-[#1E1E1E] px-3 py-1 rounded-lg">By Standard</span>
          </div>
          {(() => {
            const stdData = (dashboardData?.['Standard wise Student Count'] || []).filter(item => item.standardName !== 'Total');
            const total = stdData.reduce((sum, item) => sum + (item.count || 0), 0);
            const colors = ['#FFC629', '#E6A21A', '#C7810A', '#9E6000', '#D97706', '#B45309'];
            let cumPercent = 0;
            const gradientParts = stdData.map((item, i) => {
              const pct = total > 0 ? ((item.count || 0) / total) * 100 : 0;
              const start = cumPercent;
              cumPercent += pct;
              return `${colors[i % colors.length]} ${start}% ${cumPercent}%`;
            });
            const gradient = gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(', ')})` : 'conic-gradient(#FFC629 0% 100%)';
            return (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-4">
                <div className="w-[160px] h-[160px] rounded-full flex items-center justify-center relative shrink-0 shadow-lg" style={{ background: gradient }}>
                  <div className="w-[100px] h-[100px] bg-[#141414] rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-[#FFC629]">{dashboardData?.['Student Count']?.total || total}</div>
                      <div className="text-[11px] text-white uppercase tracking-wider font-bold">Total</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5 w-full max-w-xs">
                  {stdData.length > 0 ? stdData.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: colors[i % colors.length] }}></span>
                        <span className="text-[#F5E6BE] truncate font-semibold">{item.standardName}</span>
                      </div>
                      <span className="font-extrabold text-[#FFC629] shrink-0 text-sm">{item.count}</span>
                    </div>
                  )) : (
                    <span className="text-[#F5E6BE] text-xs">No class data</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div
          className="p-6 sm:p-8 lg:p-10 bg-[#141414] border border-[#2A2A2A] rounded-3xl cursor-pointer hover:border-[#FFC629] shadow-lg transition dashboard-panel"
          onClick={() => navigate(`/${userRole.toLowerCase() === 'admin' ? 'school' : userRole.toLowerCase()}/fee-collection`)}
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2A2A]">
            <h3 className="font-['Cinzel'] text-xl font-bold text-[#FFC629]">Fee Collection</h3>
            <span className="text-xs font-bold text-white uppercase tracking-wider bg-[#1E1E1E] px-3 py-1 rounded-lg">Per Standard</span>
          </div>
          <div className="space-y-5">
            {(() => {
              const feeData = dashboardData?.['Fee Collection Report'] || [];
              if (feeData.length === 0) return <div className="text-[#F5E6BE] p-6 text-center text-sm font-medium">No fee records available</div>;
              const maxCollected = Math.max(...feeData.map(item => item.totalCollected || 0), 1);
              return feeData.slice(0, 5).map((item, i) => {
                const collected = item.totalCollected || 0;
                const percentage = (collected / maxCollected) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-2 text-xs">
                      <span className="font-bold text-white">{item.standardName} Standard</span>
                      <span className="font-extrabold text-[#FFC629] text-sm">₹{collected.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-3 bg-[#222222] rounded-full overflow-hidden border border-[#333333]">
                      <div className="h-full bg-gradient-to-r from-[#FFC629] to-[#FFB703] rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Student Count Breakdown Modal */}
      {showStudentCountModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowStudentCountModal(false)}>
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl w-full max-w-[800px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#1C1917] via-[#2A200B] to-[#141414] border-b border-[#2A2A2A] p-6 sm:p-8 flex items-center justify-between">
              <div>
                <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-extrabold text-[#FFC629] m-0">Student Distribution</h3>
                <p className="mt-1 text-xs text-[#F5E6BE]">Standard-wise breakdown with division details</p>
              </div>
              <button
                onClick={() => setShowStudentCountModal(false)}
                className="w-10 h-10 bg-[#262626] hover:bg-[#333333] text-white rounded-full flex items-center justify-center transition-colors text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {(dashboardData?.['Standard wise Student Count'] || []).filter(item => item.standardName !== 'Total').map((std, idx) => (
                <div key={idx} className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-2xl">
                  <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3 mb-3">
                    <div>
                      <h4 className="m-0 text-[#FFC629] text-base font-extrabold">{std.standardName} Standard</h4>
                      <p className="text-xs text-[#F5E6BE] mt-0.5 font-medium">Division details</p>
                    </div>
                    <span className="bg-[#FFC629]/15 border border-[#FFC629]/40 text-[#FFC629] px-4 py-1.5 rounded-full text-xs font-extrabold">
                      {std.count} Students
                    </span>
                  </div>
                  {std.divisions && std.divisions.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {std.divisions.map((div, dIdx) => (
                        <div key={dIdx} className="bg-[#141414] p-3.5 rounded-xl border border-[#2A2A2A]">
                          <div className="flex justify-between items-center mb-1.5">
                            <strong className="text-xs text-white">Div {div.divisionName}</strong>
                            <span className="font-extrabold text-sm text-[#FFC629]">{div.count}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-[#F5E6BE]">
                            <span className="text-emerald-400 font-bold">{div.activeCount} Active</span>
                            <span>{div.inactiveCount} Inactive</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[#F5E6BE] text-xs">No divisions configured</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-[#2A2A2A] p-5 bg-[#0D0D0D]">
              <button
                onClick={() => setShowStudentCountModal(false)}
                className="bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black font-extrabold px-8 py-3 rounded-xl text-sm cursor-pointer hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Profile Modal */}
      {showSchoolModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowSchoolModal(false)}>
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl w-full max-w-[700px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#1C1917] via-[#2A200B] to-[#141414] border-b border-[#2A2A2A] p-6 sm:p-8 flex items-center justify-between">
              <div>
                <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-extrabold text-[#FFC629] m-0">Institute Profile</h3>
                <p className="mt-1 text-xs text-[#F5E6BE]">Institutional credentials and registration</p>
              </div>
              <button
                onClick={() => setShowSchoolModal(false)}
                className="w-10 h-10 bg-[#262626] hover:bg-[#333333] text-white rounded-full flex items-center justify-center transition-colors text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {loadingSchoolInfo ? (
                <div className="text-center p-8 text-[#FFC629] font-bold animate-pulse">Loading institute details...</div>
              ) : (
                <>
                  <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#2A2A2A]">
                    <div className="w-20 h-20 bg-[#1A1A1A] border-2 border-[#FFC629]/40 rounded-2xl flex items-center justify-center p-3 overflow-hidden shrink-0 shadow-inner">
                      <img
                        src={schoolInfo?.schoolLogo || dashboardData?.['School Info']?.schoolLogo || "/assets/school_logo_premium_1772187603829.png"}
                        alt="Institute Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl sm:text-2xl font-extrabold text-[#FFC629] mb-1.5 truncate">
                        {schoolInfo?.schoolName || dashboardData?.['School Info']?.schoolName || fallbackSchoolName || MOCK_STATS.schoolName}
                      </h4>
                      <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Active Institution
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#181818] border border-[#2A2A2A] p-4 rounded-xl">
                      <div className="text-[11px] font-extrabold uppercase text-[#FFC629] tracking-wider mb-1">Email</div>
                      <div className="text-sm font-semibold text-white truncate">{schoolInfo?.email || 'admin@school.com'}</div>
                    </div>
                    <div className="bg-[#181818] border border-[#2A2A2A] p-4 rounded-xl">
                      <div className="text-[11px] font-extrabold uppercase text-[#FFC629] tracking-wider mb-1">Phone</div>
                      <div className="text-sm font-semibold text-white">{schoolInfo?.phoneNo || '+91 98765 43210'}</div>
                    </div>
                    <div className="bg-[#181818] border border-[#2A2A2A] p-4 rounded-xl sm:col-span-2">
                      <div className="text-[11px] font-extrabold uppercase text-[#FFC629] tracking-wider mb-1">Address</div>
                      <div className="text-sm font-semibold text-[#F5E6BE] leading-relaxed">{schoolInfo?.schoolAddress || 'Excellence in Photography'}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-[#2A2A2A] p-5 bg-[#0D0D0D]">
              <button
                onClick={() => setShowSchoolModal(false)}
                className="bg-gradient-to-r from-[#FFC629] to-[#FFB703] text-black font-extrabold px-8 py-3 rounded-xl text-sm cursor-pointer hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
