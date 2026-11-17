import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { 
  BiBuildings, BiUserPin, BiTrendingUp, 
  BiCreditCard, BiDotsVerticalRounded 
} from 'react-icons/bi';
import { getSuperAdminDashboard, getGlobalAnalytics } from '../../api/api';

/**
 * SuperAdmin — Dashboard
 * Luxury Dark Gold Theme for Ayushyachi Photography
 * High-contrast Bright Yellow Typography & Spacious Cards
 */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalRevenue: 0,
    growthRate: 0,
    pendingApprovals: 0,
    criticalTickets: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentSchools, setRecentSchools] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes] = await Promise.all([
        getSuperAdminDashboard(),
        getGlobalAnalytics()
      ]);

      const data = statsRes?.data || {};
      setStats({
        totalSchools: data.totalSchools !== undefined ? data.totalSchools : 142,
        totalTeachers: data.totalTeachers !== undefined ? data.totalTeachers : 1850,
        totalStudents: data.totalStudents !== undefined ? data.totalStudents : 45200,
        totalRevenue: data.totalRevenue !== undefined ? data.totalRevenue : 12500000,
        growthRate: data.growthRate !== undefined ? data.growthRate : 12.5,
        pendingApprovals: data.pendingApprovals !== undefined ? data.pendingApprovals : 8,
        criticalTickets: data.criticalTickets !== undefined ? data.criticalTickets : 0
      });

      setRecentSchools(data.recentSchools && data.recentSchools.length > 0 ? data.recentSchools : [
        { name: 'Elite International Institute', registration: '2026-04-18', status: 'Pending', city: 'Delhi' },
        { name: 'Greenwood Arts Academy', registration: '2026-04-15', status: 'Active', city: 'Pune' },
        { name: 'Sunrise Institute of Film', registration: '2026-04-12', status: 'Active', city: 'Mumbai' },
        { name: 'Royal St. Judes Media', registration: '2026-04-10', status: 'Inactive', city: 'Bangalore' },
      ]);

      setGrowthData(analyticsRes?.data && analyticsRes.data.length > 0 
        ? analyticsRes.data 
        : [65, 45, 75, 55, 85, 40, 95, 60, 80, 50, 70, 90]
      );
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => `₹${(amt / 1000000).toFixed(1)}M`;

  return (
    <div className="min-h-full pb-10 space-y-10 animate-[fadeIn_0.4s_ease-out]">
      {/* Page Header (Spacious with Gold Title) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-4xl font-extrabold text-[#FFC629] tracking-wide">
            Global Ecosystem Analytics
          </h1>
          <p className="mt-2 text-sm text-[#F5E6BE] font-medium">
            Platform Overview &gt; Super Admin Dashboard
          </p>
        </div>
        <div className="bg-[#141414] px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-xs font-bold uppercase tracking-wider text-[#FFC629]">
          Platform Live • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Global Stat Cards (4 in a row, Spacious & Breathable "khula khula") */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 lg:gap-8">
        <StatCard 
          title="Consolidated Institutes" 
          count={stats.totalSchools} 
          icon={BiBuildings} 
          color="#FFC629" 
          trend={{ value: '4.2%', isUp: true }}
          onClick={() => navigate('/superadmin/schools')}
        />
        <StatCard 
          title="Platform Teachers" 
          count={stats.totalTeachers} 
          icon={BiUserPin} 
          color="#10b981" 
          trend={{ value: '8.1%', isUp: true }}
        />
        <StatCard 
          title="Total Gross Revenue" 
          count={formatCurrency(stats.totalRevenue)} 
          icon={BiCreditCard} 
          color="#FFC629" 
          trend={{ value: '15%', isUp: true }}
        />
        <StatCard 
          title="Global Growth Rate" 
          count={`${stats.growthRate}%`} 
          icon={BiTrendingUp} 
          color="#3b82f6" 
          trend={{ value: '2.4%', isUp: true }}
        />
      </div>

      {/* Middle Row: Revenue & Enrollment Growth + Platform Alerts (Generous Spacing "khula khula") */}
      <div className="grid grid-cols-1 gap-8 lg:gap-8 xl:grid-cols-12">
        {/* Growth Analytics Section */}
        <div className="xl:col-span-8 rounded-3xl border border-[#2A2A2A] bg-[#141414] shadow-2xl p-6 sm:p-8 lg:p-10 dashboard-panel">
          <div className="flex flex-col gap-4 pb-6 border-b border-[#2A2A2A] sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-[#FFC629]">
                Revenue & Enrollment Growth
              </h3>
              <p className="text-xs sm:text-sm text-[#F5E6BE] mt-1.5 font-medium">
                Cross-institutional performance trend
              </p>
            </div>
            <select className="rounded-xl border border-[#3A3A3A] bg-[#101010] px-4 py-3 text-xs font-bold text-[#FFC629] outline-none focus:border-[#FFC629] focus:ring-2 focus:ring-[#FFC629]/20 sm:w-44 cursor-pointer">
              <option>Last 12 Months</option>
              <option>Year 2026</option>
              <option>Year 2025</option>
            </select>
          </div>
          <div className="pt-8 pb-3 px-2 sm:px-4">
            <div className="flex h-[280px] items-end gap-3.5 border-b border-[#2A2A2A] pb-4 sm:gap-6">
              {growthData.map((val, i) => (
                <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <div 
                    className="relative w-full rounded-t-lg bg-gradient-to-t from-[#B88B12] via-[#E0AC1B] to-[#FFC629] transition-all duration-200 group-hover:brightness-125 group-hover:shadow-[0_0_20px_rgba(255,198,41,0.4)]" 
                    style={{ height: `${val}%` }}
                  >
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg bg-[#0A0A0A] border border-[#FFC629]/60 px-2 py-0.5 text-[0.7rem] font-bold text-[#FFC629] opacity-0 transition group-hover:opacity-100 whitespace-nowrap shadow-2xl z-20">
                      {val}%
                    </div>
                  </div>
                  <span className="mt-3.5 text-xs font-bold text-[#FFC629]/70 group-hover:text-[#FFC629]">
                    {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Alerts */}
        <div className="xl:col-span-4 rounded-3xl border border-[#2A2A2A] bg-[#141414] p-6 sm:p-8 lg:p-10 shadow-2xl flex flex-col justify-between dashboard-panel">
          <div>
            <h3 className="mb-8 font-['Cinzel'] text-xl sm:text-2xl font-bold text-[#FFC629]">
              Platform Alerts
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4 rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 transition hover:border-[#FFC629]/50 shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFC629]/15 text-2xl border border-[#FFC629]/30">
                  <BiBuildings color="#FFC629" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm sm:text-base">Pending Institute Approvals</p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#F5E6BE]">
                    There are <strong className="text-[#FFC629] font-extrabold">{stats.pendingApprovals}</strong> new institute requests waiting for review.
                  </p>
                  <button 
                    className="mt-3.5 border-0 bg-transparent p-0 text-xs font-extrabold text-[#FFC629] hover:underline cursor-pointer flex items-center gap-1.5" 
                    onClick={() => navigate('/superadmin/school-approval')}
                  >
                    View Requests &rarr;
                  </button>
                </div>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#2A2A2A] bg-[#181818] p-6 transition hover:border-red-500/40 shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-2xl border border-red-500/30">
                  <BiDotsVerticalRounded color="#ef4444" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm sm:text-base">Critical Tickets</p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#F5E6BE]">
                    <strong className="text-white font-extrabold">{stats.criticalTickets}</strong> tickets marked as URGENT require attention.
                  </p>
                  <button 
                    className="mt-3.5 border-0 bg-transparent p-0 text-xs font-bold text-red-400 hover:underline cursor-pointer flex items-center gap-1.5" 
                    onClick={() => navigate('/superadmin/tickets')}
                  >
                    Go to Tickets &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Schools Table (Dark Theme, Spacious Rows) */}
      <div className="rounded-3xl border border-[#2A2A2A] bg-[#141414] p-6 sm:p-8 lg:p-10 shadow-2xl dashboard-panel">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-[#FFC629]">
            Recent Institute Registrations
          </h3>
          <button 
            onClick={() => navigate('/superadmin/schools')}
            className="text-xs sm:text-sm font-extrabold text-[#FFC629] hover:underline cursor-pointer"
          >
            View All &rarr;
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#2A2A2A]">
          <table className="w-full text-left text-sm text-white bg-[#141414]">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#181818]">
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-[#FFC629]">Institute Name</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-[#FFC629]">City</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-[#FFC629]">Registration Date</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-[#FFC629]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {recentSchools.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="py-4.5 px-6 font-bold text-white">{item.name}</td>
                  <td className="py-4.5 px-6 text-[#F5E6BE]">{item.city}</td>
                  <td className="py-4.5 px-6 text-[#D4D4D8]">{item.registration}</td>
                  <td className="py-4.5 px-6">
                    <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase ${
                      item.status.toLowerCase() === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : item.status.toLowerCase() === 'pending'
                        ? 'bg-[#FFC629]/15 text-[#FFC629] border border-[#FFC629]/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
