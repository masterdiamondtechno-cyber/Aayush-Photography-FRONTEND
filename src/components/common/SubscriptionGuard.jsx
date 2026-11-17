import React from 'react';
import { getAuthValue, clearAuthStorage } from '../../utils/auth';
import { hasSubscriptionFeature, isSubscriptionExpired } from '../../utils/subscription';
import { BiCrown, BiLockAlt, BiLogOut } from 'react-icons/bi';

const SubscriptionGuard = ({ children, feature }) => {
  const isExpired = isSubscriptionExpired();
  const isAllowed = hasSubscriptionFeature(feature);
  const role = (getAuthValue('userRole') || '').toLowerCase();
  const isAdminOrSchool = ['admin', 'school'].includes(role);
  const isPlanPage = window.location.pathname.includes('/subscription-plan');

  const handleLogout = () => {
    clearAuthStorage();
    sessionStorage.setItem('logout_msg', 'logged_out');
    window.location.href = '/login';
  };

  if (isExpired) {
    if (isAdminOrSchool && isPlanPage) {
      return children; // Allow admins to load payment plans to upgrade
    }

    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.05),transparent_40%)] p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 shadow-[0_0_0_8px_rgba(254,226,226,0.4)]">
            <BiLockAlt className="z-10 text-4xl text-red-500" />
            <BiCrown className="absolute right-2 top-2 rotate-12 text-xl text-amber-500" />
          </div>
          <h2 className="font-['Lexend'] text-3xl font-bold text-slate-800">Trial Expired</h2>
          <p className="my-6 text-base leading-7 text-slate-500">
            {isAdminOrSchool 
              ? 'Your 7-day free trial of MD EduTech has expired. Upgrade your school subscription plan now to restore full access to your educational platform.'
              : "Your school's free trial has expired. Please contact your school administrator to renew the subscription and restore access."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAdminOrSchool ? (
              <button 
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5"
                onClick={() => window.location.href = '/school/subscription-plan'}
              >
                <BiCrown /> Upgrade Now
              </button>
            ) : (
              <button 
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={handleLogout}
              >
                <BiLogOut /> Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    // Standard plan users trying to access Premium features
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.05),transparent_40%)] p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-indigo-500/25 bg-indigo-500/10">
            <BiLockAlt className="z-10 text-4xl text-fuchsia-500" />
            <BiCrown className="absolute right-2 top-2 rotate-12 text-xl text-amber-500" />
          </div>
          <h2 className="font-['Lexend'] text-3xl font-bold text-slate-800">Feature Locked</h2>
          <p className="my-6 text-base leading-7 text-slate-500">
            The <strong>{feature ? feature.replace('-', ' ') : 'premium'}</strong> module is premium. 
            {isAdminOrSchool 
              ? 'Upgrade your school subscription plan to unlock access to premium virtual classrooms and real-time tracking.'
              : 'This feature is not enabled for your school. Please contact your school administrator to request an upgrade.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAdminOrSchool && (
              <button 
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5"
                onClick={() => window.location.href = '/school/subscription-plan'}
              >
                <BiCrown /> Upgrade Now
              </button>
            )}
            <button 
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default SubscriptionGuard;
