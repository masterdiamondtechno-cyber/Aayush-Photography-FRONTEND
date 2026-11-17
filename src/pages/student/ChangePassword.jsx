import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiLockAlt, BiShow, BiHide, BiCheckShield } from 'react-icons/bi';
import { studentChangePassword } from '../../api/api';

const StudentChangePassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { studentId, schoolId, currentPassword: defaultPassword } = location.state || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if no state (direct access)
  if (!studentId || !schoolId) {
    window.location.href = '/login';
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await studentChangePassword({
        studentId,
        schoolId,
        currentPassword: defaultPassword,
        newPassword,
        confirmPassword
      });

      // Clear the temporary token from storage so the auto-login redirect is not triggered on /login mount
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('schoolId');
      localStorage.removeItem('studentId');

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { msg: 'Password changed successfully. Please login with your new password.' } });
      }, 3000);
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top_left,#c7d2fe,#eef2ff_35%,#f8fafc_70%)] p-4 space-y-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-10">
          <div className="mb-7">
            <BiCheckShield size={48} className="mb-4 text-indigo-500" />
            <h2 className="font-['Lexend'] text-2xl font-bold text-slate-800">Mandatory Password Change</h2>
            <p className="mt-2 leading-7 text-slate-500">Your account requires a password update for security. Please set a new password to continue.</p>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-500/15 bg-red-500/10 p-4 text-sm font-bold text-red-500">{error}</div>}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600">
              Password changed successfully! Redirecting to login...
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New Password</label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20">
                  <BiLockAlt className="absolute left-4 text-xl text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-12 pr-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-4 text-xl text-slate-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <BiHide /> : <BiShow />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20">
                  <BiLockAlt className="absolute left-4 text-xl text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="h-14 rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <p className="mt-2 text-center text-sm text-slate-500">
                Your current temporary password was your Date of Birth.
              </p>
            </form>
          )}
      </div>
    </div>
  );
};

export default StudentChangePassword;
