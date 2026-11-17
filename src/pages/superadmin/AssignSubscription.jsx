import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BiArrowBack, 
  BiShield, 
  BiCalendar, 
  BiTimeFive, 
  BiMessageSquareDetail, 
  BiLoaderAlt, 
  BiCheckCircle,
  BiHistory
} from 'react-icons/bi';
import { 
  getSchoolById, 
  getAvailableSubscriptionPlans, 
  assignManualSubscription, 
  getSubscriptionHistory 
} from '../../api/api';
import { getAuthValue } from '../../utils/auth';

const AssignSubscription = () => {
  const location = useLocation();
  const schoolId = location.state?.schoolId;
  const navigate = useNavigate();
  
  // Page States
  const [school, setSchool] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [duration, setDuration] = useState('1 Month');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [statusActive, setStatusActive] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      alert('No school selected. Redirecting back to directory...');
      navigate('/superadmin/schools');
      return;
    }
    fetchData();
  }, [schoolId]);

  // Fetch school, plans, and history in parallel
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [schoolRes, plansRes, historyRes] = await Promise.all([
        getSchoolById(schoolId),
        getAvailableSubscriptionPlans(),
        getSubscriptionHistory(schoolId)
      ]);

      // 1. Resolve school
      const schoolData = schoolRes?.data || schoolRes;
      if (schoolData) {
        setSchool(schoolData);
      } else {
        alert('School details could not be found.');
        navigate('/superadmin/schools');
        return;
      }

      // 2. Resolve plans and log payload structure for debugging
      console.log('[AssignSubscription] Plans API Response:', plansRes);
      const plansList = plansRes?.data || plansRes || [];
      setPlans(Array.isArray(plansList) ? plansList : []);

      // 3. Resolve history
      const historyList = historyRes?.data || historyRes || [];
      setHistory(Array.isArray(historyList) ? historyList : []);

    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Failed to load required data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically calculate end date based on start date & duration selection
  const calculateEndDate = (startStr, durationVal) => {
    if (!startStr) return;
    const date = new Date(startStr);
    if (isNaN(date.getTime())) return;
    
    if (durationVal === '1 Month') {
      date.setMonth(date.getMonth() + 1);
    } else if (durationVal === '3 Months') {
      date.setMonth(date.getMonth() + 3);
    } else if (durationVal === '6 Months') {
      date.setMonth(date.getMonth() + 6);
    } else if (durationVal === '1 Year') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      return; // Custom requires user to input end date directly
    }
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setEndDate(`${yyyy}-${mm}-${dd}`);
  };

  useEffect(() => {
    calculateEndDate(startDate, duration);
  }, [startDate, duration]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId || !startDate || !endDate || !reason) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const adminId = getAuthValue('userId');
      
      const payload = {
        schoolId: parseInt(schoolId),
        planId: parseInt(selectedPlanId),
        startDate: startDate + 'T00:00:00',
        endDate: endDate + 'T23:59:59',
        duration: duration,
        status: statusActive ? 'ACTIVE' : 'INACTIVE',
        reason: reason,
        assignedBy: adminId ? parseInt(adminId) : null
      };

      const res = await assignManualSubscription(payload);
      if (res && (res.status === 'SUCCESS' || res.code === 200)) {
        alert('Subscription assigned and activated successfully!');
        navigate('/superadmin/schools');
      } else {
        alert(res?.message || 'Failed to assign subscription');
      }
    } catch (err) {
      console.error('Error assigning subscription:', err);
      alert(err.response?.data?.message || 'Failed to complete assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 space-y-8">
        <BiLoaderAlt size={48} className="animate-spin text-indigo-600" />
        <p className="font-bold text-slate-500">Loading school information & plans...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-1 pb-8 sm:p-2">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-3">
        <button className="flex w-fit items-center gap-2 border-0 bg-transparent p-0 font-bold text-indigo-600 transition hover:-translate-x-1" onClick={() => navigate('/superadmin/schools')}>
          <BiArrowBack />
          <span>Back to Directory</span>
        </button>
        <div>
          <h1 className="font-['Lexend'] text-2xl font-extrabold text-slate-800 sm:text-4xl">Manual Subscription Assignment</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            SUPERADMIN / INSTITUTIONS / {school?.schoolName?.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* LEFT COLUMN: THE FORM */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 border-b-2 border-slate-100 pb-3 font-['Lexend'] text-xl font-extrabold text-slate-900">
            <BiShield className="text-2xl text-indigo-600" />
            <span>Assignment Form</span>
          </h2>
          
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">School Name</label>
              <input 
                type="text" 
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none"
                value={school?.schoolName || ''} 
                readOnly 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Subscription Plan</label>
              <select 
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15"
                value={selectedPlanId} 
                onChange={(e) => {
                  setSelectedPlanId(e.target.value);
                  const plan = plans.find(p => p.planId === parseInt(e.target.value));
                  if (plan) {
                    const durationStr = plan.billingCycle?.toUpperCase() === 'YEARLY' ? '1 Year' : '1 Month';
                    setDuration(durationStr);
                    calculateEndDate(startDate, durationStr);
                  }
                }}
                required
              >
                <option value="">Select Plan</option>
                {plans.map(p => (
                  <option key={p.planId} value={p.planId}>
                    {p.planName} (₹{p.price ? p.price.toLocaleString('en-IN') : '0'}/{p.billingCycle ? p.billingCycle.toLowerCase() : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <BiCalendar className="text-base text-slate-500" />
                  <span>Start Date</span>
                </label>
                <input 
                  type="date" 
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15"
                  value={startDate} 
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    calculateEndDate(e.target.value, duration);
                  }}
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <BiTimeFive className="text-base text-slate-500" />
                  <span>Duration</span>
                </label>
                <select 
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15"
                  value={duration} 
                  onChange={(e) => {
                    setDuration(e.target.value);
                    calculateEndDate(startDate, e.target.value);
                  }}
                >
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="1 Year">1 Year</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">End Date</label>
              <input 
                type="date" 
                className={`h-12 w-full rounded-xl border px-4 text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 ${duration !== 'Custom' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-300 bg-white text-slate-700'}`} 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                readOnly={duration !== 'Custom'}
                required 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                <BiMessageSquareDetail className="text-base text-slate-500" />
                <span>Reason for Assignment</span>
              </label>
              <textarea 
                className="min-h-28 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15" 
                placeholder="E.g., Special promotion for branch trial extension..."
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-bold text-slate-700">Subscription Active Status</span>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {statusActive ? 'Active' : 'Inactive'}
                </span>
                <label className="relative inline-flex h-6 w-12 cursor-pointer">
                  <input className="peer sr-only" 
                    type="checkbox" 
                    checked={statusActive} 
                    onChange={(e) => setStatusActive(e.target.checked)} 
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-6"></span>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
              <button 
                type="button" 
                className="h-12 rounded-xl border border-slate-300 bg-slate-100 px-7 font-bold text-slate-600 transition hover:bg-slate-200" 
                onClick={() => navigate('/superadmin/schools')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-7 font-bold text-white shadow-lg shadow-emerald-600/20 disabled:cursor-not-allowed disabled:bg-slate-400" 
                disabled={submitting}
              >
                {submitting ? 'Assigning...' : 'Assign Subscription'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: CURRENT DETAILS & TIMELINE */}
        <div className="flex flex-col gap-6">
          {/* Current Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 border-b-2 border-slate-100 pb-3 font-['Lexend'] text-xl font-extrabold text-slate-900">Current Subscription Status</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500">Current Plan:</span>
                <span className="text-sm font-semibold text-slate-800">{school?.subscriptionPlan?.planName || school?.subscriptionStatus || 'Standard Plan'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500">Source:</span>
                <span className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-extrabold uppercase text-sky-700">
                  {school?.subscriptionSource || 'TRIAL'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500">Status:</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${school?.isSubscriptionExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {school?.isSubscriptionExpired ? 'Expired' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Expiry Date:</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatDate(school?.subscriptionSource === 'MANUAL' || school?.subscriptionSource === 'PURCHASED'
                    ? school?.subscriptionEndDate
                    : school?.trialEndDate)}
                </span>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b-2 border-slate-100 pb-3 font-['Lexend'] text-xl font-extrabold text-slate-900">
              <BiHistory className="text-2xl text-indigo-600" />
              <span>Subscription Audit Logs</span>
            </h2>
            <div className="ml-2 flex flex-col gap-5 border-l-2 border-slate-200 pl-6">
              {history.length > 0 ? (
                history.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 shadow-[0_0_0_2px_#e2e8f0]"></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900">{log.planName}</span>
                        <span className="rounded bg-sky-100 px-2 py-0.5 text-[0.7rem] font-extrabold uppercase text-sky-700">
                          {log.subscriptionSource}
                        </span>
                      </div>
                      <div className="mb-2 text-xs text-slate-500">
                        {formatDate(log.startDate)} - {formatDate(log.endDate)} ({log.duration || 'N/A'})
                      </div>
                      {log.reason && (
                        <div className="mb-2 rounded-lg border border-slate-200 bg-white p-2 text-sm leading-5 text-slate-700">
                          <strong>Reason:</strong> {log.reason}
                        </div>
                      )}
                      <div className="text-xs text-slate-400">
                        Assigned by: {log.assignedByName || 'System'} on {formatDate(log.assignmentDate)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="my-6 text-center text-sm font-semibold text-slate-400">No subscription records found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignSubscription;
