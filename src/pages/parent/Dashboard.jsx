import { BiUserCircle, BiCheckShield, BiBusSchool, BiTime, BiDetail, BiCalendarEvent, BiMessageRoundedDots } from 'react-icons/bi';
import { Link } from 'react-router-dom';

const ParentDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-['Lexend'] text-3xl font-bold text-slate-900">Ward Overview</h1>
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">Academic Year 2025-26</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 text-center shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600" />
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-md">
            <BiUserCircle size={80} className="text-slate-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Yogesh Yadav</h2>
          <p className="font-semibold text-slate-500">10th Standard - Section A</p>
          <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/30">
            <BiCheckShield size={18} /> Present Today
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-left text-sm">
            <div className="text-slate-500">Roll No: <strong className="float-right text-slate-800">24</strong></div>
            <div className="text-slate-500">DOB: <strong className="float-right text-slate-800">12 May 2010</strong></div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-8 shadow-sm">
            <div className="relative z-10">
              <h3 className="mb-2 text-xl font-bold text-red-700">Live Safety Tracker</h3>
              <p className="mb-5 text-sm text-slate-500">School Bus #4 is currently in transit • ETA: 15 mins</p>
              <Link to="/parent/bus-tracker" className="inline-flex rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-500/30 transition hover:bg-red-600">
                Track Bus Live
              </Link>
            </div>
            <BiBusSchool size={100} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-200" />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-600 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-indigo-600">
                <h4 className="text-sm font-semibold">Now Ongoing</h4>
                <BiTime size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mathematics</h3>
              <p className="mt-2 text-xs text-slate-500">09:00 AM - 10:00 AM</p>
            </div>
            <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-emerald-600">
                <h4 className="text-sm font-semibold">Attendance</h4>
                <BiCheckShield size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">92% Average</h3>
              <p className="mt-2 text-xs font-medium text-emerald-600">Above 90% target</p>
            </div>
            <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-amber-600">
                <h4 className="text-sm font-semibold">Upcoming</h4>
                <BiDetail size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mid-Term Test</h3>
              <p className="mt-2 text-xs text-amber-600">Starts in 12 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Academic Performance</h3>
            <Link to="/parent/marks" className="text-sm font-bold text-indigo-600">View Full Report</Link>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div className="font-bold text-slate-800">Mathematics (Unit Test 1)</div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600">95 / 100</span>
                <span className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">A+</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div className="font-bold text-slate-800">Science (Unit Test 1)</div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800">88 / 100</span>
                <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">A</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="mb-5 border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">Noticeboard & Messages</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <BiMessageRoundedDots size={24} className="shrink-0 text-emerald-600" />
              <div>
                <h4 className="mb-1 text-sm font-bold text-emerald-800">Teacher Arvind Verma</h4>
                <p className="text-xs text-slate-500">Yogesh scored excellently in today&apos;s pop-quiz.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <BiCalendarEvent size={24} className="shrink-0 text-blue-600" />
              <div>
                <h4 className="mb-1 text-sm font-bold text-blue-800">School Administration</h4>
                <p className="text-xs text-slate-500">Tomorrow is a half-day due to teacher training.</p>
              </div>
            </div>
          </div>
          <Link to="/parent/contact-teacher" className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-indigo-200 bg-indigo-50 py-3 text-sm font-bold text-indigo-600">
            Message Teacher
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
