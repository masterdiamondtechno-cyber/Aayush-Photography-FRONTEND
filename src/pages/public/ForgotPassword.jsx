import BrandLogo from '../../components/photography/BrandLogo';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendSchoolOtp, verifySchoolOtp, updateSchoolPassword } from '../../api/api';
import { 
  BiEnvelope, BiArrowBack, BiCheckCircle, 
  BiShieldQuarter, BiLockAlt, BiShow, BiHide 
} from 'react-icons/bi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendSchoolOtp({ email });
      setStep(2);
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifySchoolOtp({ email, otp });
      setStep(3);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert(error.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      await updateSchoolPassword({ email, newPassword: passwords.new });
      setStep(4);
    } catch (error) {
      console.error("Error updating password:", error);
      alert(error.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#090909] p-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-[#303030] bg-[#141414] p-8 sm:p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFC629]/15 border border-[#FFC629]/30">
            <BiCheckCircle className="text-5xl text-[#FFC629]" />
          </div>
          <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">Password Updated!</h2>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-sm text-[#A0A0A0]">
            Your password has been successfully reset. You can now sign in with your new credentials.
          </p>
          <button
            className="mt-8 h-12 w-full rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-lg shadow-[#ffc629]/20 transition hover:-translate-y-0.5 cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#090909] p-3 sm:p-6 lg:p-8 text-white relative">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#ffc629]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#ffb703]/10 blur-3xl" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-[#303030] bg-[#141414]/95 shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-xl my-auto">
        <div className="flex flex-col lg:flex-row min-h-0">
          
          {/* Visual Brand Side */}
          <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#191919] to-[#0D0D0D] p-8 sm:p-12 lg:p-14 text-center border-b lg:border-b-0 lg:border-r border-[#303030]">
            <div className="mb-6 max-w-[280px] w-full flex justify-center">
              <BrandLogo size="login" animated={true} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#FFC629] mt-1 font-bold">Account Recovery</p>
              <p className="mt-4 max-w-xs leading-relaxed text-xs sm:text-sm text-[#A8A8A8]">
                Restore access to your administrative portal with fast and secure email verification.
              </p>
            </div>
          </div>

          {/* Form Side (Spacious & Breathable) */}
          <div className="flex flex-1 flex-col justify-center bg-[#171717] p-8 sm:p-12 lg:p-14 text-white">
            <button
              className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-[#303030] text-[#B8B8B8] transition hover:bg-[#FFC629] hover:text-black cursor-pointer"
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
              title="Go Back"
            >
              <BiArrowBack className="text-xl" />
            </button>

            <div className="mb-7">
              <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-[#FFC629]">
                {step === 1 ? 'Recover Password' : step === 2 ? 'Verify Code' : 'New Password'}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#A8A8A8]">
                {step === 1 && 'Enter your registered email to receive an authorization code.'}
                {step === 2 && `We've sent a 6-digit code to ${email}.`}
                {step === 3 && 'Choose a strong new password to protect your account.'}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-7 flex gap-2.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-10 bg-[#FFC629]' : 'w-2.5 bg-[#2D2D2D]'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-10 bg-[#FFC629]' : 'w-2.5 bg-[#2D2D2D]'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-10 bg-[#FFC629]' : 'w-2.5 bg-[#2D2D2D]'}`} />
            </div>

            {step === 1 && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-[#FFC629] uppercase tracking-wider mb-3">Registered Email</label>
                  <div className="flex h-14 items-center gap-4 rounded-2xl border border-[#333333] bg-[#101010] px-5 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25">
                    <BiEnvelope className="shrink-0 text-xl text-[#FFC629]" />
                    <input
                      type="email"
                      placeholder="e.g. admin@photography.com"
                      required
                      className="flex-1 h-full py-3 bg-transparent text-sm sm:text-base text-white outline-none placeholder:text-[#808080]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-2 h-14 w-full rounded-2xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-extrabold text-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#ffc629]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-[#FFC629] uppercase tracking-wider mb-3">One-Time Password</label>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#303030] bg-[#141414] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/20">
                    <BiShieldQuarter className="shrink-0 text-lg text-[#FFC629]" />
                    <input
                      type="text"
                      className="flex-1 h-full py-3 bg-transparent text-center text-base font-bold tracking-[0.5em] text-white outline-none placeholder:text-[#808080]"
                      placeholder="••••••"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-2 h-13 w-full rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-md shadow-[#ffc629]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  disabled={loading || otp.length < 4}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-[#FFC629] uppercase tracking-wider mb-3">New Password</label>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#303030] bg-[#141414] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/20">
                    <BiLockAlt className="shrink-0 text-lg text-[#FFC629]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      className="flex-1 h-full py-3 bg-transparent text-sm text-white outline-none placeholder:text-[#808080]"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    />
                    <button
                      type="button"
                      className="text-lg text-[#808080] hover:text-[#FFC629] transition"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <BiHide /> : <BiShow />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-[#FFC629] uppercase tracking-wider mb-3">Confirm New Password</label>
                  <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#303030] bg-[#141414] px-4 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/20">
                    <BiLockAlt className="shrink-0 text-lg text-[#FFC629]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      className="flex-1 h-full py-3 bg-transparent text-sm text-white outline-none placeholder:text-[#808080]"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-md shadow-[#ffc629]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            )}

            <div className="mt-5 text-center border-t border-[#303030] pt-4">
              <Link to="/login" className="text-xs font-bold text-[#FFC629] hover:underline">
                ← Return to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
