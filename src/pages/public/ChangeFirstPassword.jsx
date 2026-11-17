import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BiLockAlt,
  BiEnvelope,
  BiShow,
  BiHide,
  BiCheckCircle,
  BiShieldQuarter,
  BiArrowBack,
  BiCheckShield
} from 'react-icons/bi';
import { changeFirstPassword } from '../../api/api';
import BrandLogo from '../../components/photography/BrandLogo';

const ChangeFirstPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve prefilled email or credentials from navigation state or sessionStorage
  const initialEmail = location.state?.email || sessionStorage.getItem('pendingEmail') || '';
  const initialCurrentPassword = location.state?.currentPassword || sessionStorage.getItem('tempCurrentPassword') || '';

  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(4);

  // Sync state if navigation or session updates
  useEffect(() => {
    if (!email && sessionStorage.getItem('pendingEmail')) {
      setEmail(sessionStorage.getItem('pendingEmail') || '');
    }
  }, [email]);

  // Handle countdown on success
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      handleGoToLogin();
    }
    return () => clearTimeout(timer);
  }, [success, countdown]);

  const handleGoToLogin = () => {
    sessionStorage.removeItem('pendingEmail');
    sessionStorage.removeItem('tempCurrentPassword');
    sessionStorage.removeItem('tempToken');
    navigate('/login', {
      state: { msg: 'Password changed successfully! Please login with your new password.' },
      replace: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide the institute email address.');
      return;
    }

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and Confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current default password.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: trimmedEmail,
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      };

      const res = await changeFirstPassword(payload);
      const resData = res?.data ?? res;
      const message =
        resData?.message ||
        'Password changed successfully. You can now login with your new password.';

      setSuccess(true);
      setSuccessMsg(message);

      // Clean temporary storage
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('tempCurrentPassword');
      sessionStorage.removeItem('tempToken');
    } catch (err) {
      console.error('🛑 [Change First Password Error]', err);
      const backendMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to change password. Please verify your current credentials and try again.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#090909] px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      <div className="pointer-events-none absolute -left-28 -top-28 h-[450px] w-[450px] rounded-full bg-[#ffc629]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-[400px] w-[400px] rounded-full bg-[#ffb703]/10 blur-3xl" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-[#2D2D2D] bg-[#141414]/95 shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl my-auto">
        <div className="flex flex-col lg:flex-row min-h-0">
          {/* Left Column: Brand & Security Instructions */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#191919] via-[#141414] to-[#0A0A0A] p-10 xl:p-14 text-center border-r border-[#262626] relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFC629]/5 via-transparent to-transparent" />

            <div className="relative z-10 w-full max-w-[340px] flex justify-center py-6">
              <Link to="/" className="inline-block focus:outline-none" aria-label="आयुष्याची फोटोग्राफी">
                <BrandLogo size="lg" animated={true} />
              </Link>
            </div>

            <div className="relative z-10 max-w-sm mt-3">
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#FFC629] to-transparent mx-auto mb-4" />
              <p className="text-xs uppercase tracking-widest text-[#FFC629] font-extrabold leading-relaxed">
                Tushar Pulate Institute of Photography
              </p>

              <div className="mt-6 rounded-2xl bg-[#0D0D0D]/90 border border-[#2A2A2A] p-5 text-left shadow-lg">
                <div className="flex items-center gap-2.5 text-[#FFC629] font-bold text-xs uppercase tracking-wider mb-2">
                  <BiCheckShield className="text-lg shrink-0" />
                  First-Time Login Security
                </div>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  To protect your institute’s student records, financial transactions, and academic data, you are required to change your temporary default credentials before entering the dashboard.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold text-[#888888]">
                <Link to="/login" className="hover:text-[#FFC629] transition hover:underline inline-flex items-center gap-1">
                  <BiArrowBack /> Back to Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Change Password Form */}
          <div className="flex w-full flex-1 flex-col justify-center bg-[#171717] p-6 sm:p-10 lg:p-12 xl:p-14">
            <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center">
              {/* Mobile Brand Header */}
              <div className="lg:hidden mb-6 flex flex-col items-center text-center">
                <Link to="/" className="inline-block py-1 max-w-[240px]" aria-label="आयुष्याची फोटोग्राफी">
                  <BrandLogo size="login" animated={true} />
                </Link>
                <p className="text-[11px] uppercase tracking-wider text-[#FFC629] font-semibold mt-1">
                  Security Setup
                </p>
              </div>

              {/* Title Section */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-[#FFC629]/15 border border-[#FFC629]/40 flex items-center justify-center shadow-md shadow-[#FFC629]/10 mb-3">
                  <BiShieldQuarter className="h-6 w-6 text-[#FFC629]" />
                </div>
                <h1 className="font-['Cinzel'] text-xl sm:text-2xl font-extrabold text-[#FFC629] tracking-wide">
                  Set New Password
                </h1>
                <p className="text-xs sm:text-sm text-[#CCCCCC] font-medium max-w-sm mt-1.5 leading-relaxed">
                  First-time login detected. Create a secure password for your Institute Administrator account.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-center text-xs font-bold text-red-400 p-3.5 mb-5 shadow-sm">
                  {error}
                </div>
              )}

              {/* Success View */}
              {success ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center shadow-lg">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <BiCheckCircle className="text-3xl" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-400">Password Changed Successfully!</h3>
                  <p className="text-xs text-emerald-200/80 mt-2 leading-relaxed">
                    {successMsg || 'Your new password is now active. You can sign in with your updated credentials.'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-4">
                    Redirecting to login in <span className="font-bold text-[#FFC629]">{countdown}s</span>...
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToLogin}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-extrabold text-black text-xs uppercase tracking-wider py-3.5 transition hover:brightness-110 cursor-pointer shadow-lg shadow-[#ffc629]/20"
                  >
                    Proceed to Sign In Now →
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="flex flex-col w-full">
                  {/* Institute Email */}
                  <div className="flex flex-col mb-4">
                    <label className="block text-[11px] font-bold text-[#FFC629] uppercase tracking-wider mb-1.5">
                      Institute Email
                    </label>
                    <div className="flex h-[50px] w-full items-center gap-3 rounded-xl border border-[#333333] bg-[#101010] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25">
                      <BiEnvelope className="shrink-0 text-xl text-[#888888]" />
                      <input
                        type="email"
                        required
                        placeholder="admin@ayushphotography.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 h-full bg-transparent text-sm text-white outline-none placeholder:text-[#666666]"
                      />
                    </div>
                  </div>

                  {/* Current Password */}
                  <div className="flex flex-col mb-4">
                    <label className="block text-[11px] font-bold text-[#FFC629] uppercase tracking-wider mb-1.5">
                      Current / Default Password
                    </label>
                    <div className="flex h-[50px] w-full items-center gap-3 rounded-xl border border-[#333333] bg-[#101010] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25">
                      <BiLockAlt className="shrink-0 text-xl text-[#888888]" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter temporary default password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="flex-1 h-full bg-transparent text-sm text-white outline-none placeholder:text-[#666666]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-base text-[#888888] hover:text-[#FFC629] p-1.5 transition cursor-pointer"
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? <BiHide /> : <BiShow />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-[#FFC629] uppercase tracking-wider">
                        New Password
                      </label>
                      <span className="text-[10px] text-[#888888]">Min. 6 characters</span>
                    </div>
                    <div className="flex h-[50px] w-full items-center gap-3 rounded-xl border border-[#333333] bg-[#101010] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25">
                      <BiLockAlt className="shrink-0 text-xl text-[#888888]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 h-full bg-transparent text-sm text-white outline-none placeholder:text-[#666666]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-base text-[#888888] hover:text-[#FFC629] p-1.5 transition cursor-pointer"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <BiHide /> : <BiShow />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="flex flex-col mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-[#FFC629] uppercase tracking-wider">
                        Confirm New Password
                      </label>
                      {confirmPassword && (
                        <span
                          className={`text-[10px] font-bold ${
                            newPassword === confirmPassword ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                        </span>
                      )}
                    </div>
                    <div className="flex h-[50px] w-full items-center gap-3 rounded-xl border border-[#333333] bg-[#101010] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25">
                      <BiLockAlt className="shrink-0 text-xl text-[#888888]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="flex-1 h-full bg-transparent text-sm text-white outline-none placeholder:text-[#666666]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-base text-[#888888] hover:text-[#FFC629] p-1.5 transition cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <BiHide /> : <BiShow />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[50px] rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-extrabold text-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#ffc629]/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center cursor-pointer mb-4"
                  >
                    {loading ? 'Updating Password...' : 'Save Password & Continue'}
                  </button>

                  {/* Back Link */}
                  <div className="text-center pt-2 border-t border-[#262626]">
                    <Link
                      to="/login"
                      className="text-xs font-semibold text-[#888888] hover:text-[#FFC629] transition inline-flex items-center gap-1.5"
                    >
                      <BiArrowBack /> Cancel & Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeFirstPassword;
