import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BiEnvelope, BiLockAlt, BiShow, BiHide, BiShieldQuarter } from 'react-icons/bi';
import { login, adminLogin } from '../../api/api';
import {
  clearAuthStorage,
  isAuthenticated,
  getDashboardURL,
  setAuthValue,
} from '../../utils/auth';
import {
  storeLoginResponse,
} from '../../hooks/useLoginRedirectLogger';
import BrandLogo from '../../components/photography/BrandLogo';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // OTP flow state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');

  // Auto-login check: redirect if already authenticated
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMsg = params.get('msg');
    const msg = urlMsg || location.state?.msg || sessionStorage.getItem('logout_msg');
    
    if (msg === 'session_expired') {
      clearAuthStorage();
      setStatusMsg('Your session has expired. Please sign in again.');
    } else if (msg === 'logged_out') {
      clearAuthStorage();
      setStatusMsg('You have been successfully signed out.');
    } else if (msg === 'inactive') {
      clearAuthStorage();
      setStatusMsg('Your account is inactive. Please contact your school administrator.');
    } else if (msg) {
      clearAuthStorage();
      setStatusMsg(msg);
    } else if (isAuthenticated()) {
      window.location.href = getDashboardURL();
    }

    if (msg) {
      sessionStorage.removeItem('logout_msg');
    }
    if (urlMsg) {
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate]);

  /** Step 1: Submit credentials → backend sends OTP */
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      clearAuthStorage();
      // Proceed with real login request


      const payload = { 
        username: username.trim(), 
        password
      };
      const response = await adminLogin(payload);
      const data = response?.data ?? response;
      
      // Support both nested data envelope from backend and flat data from mocks/direct responses
      const apiData = data?.data && typeof data.data === 'object' && ('token' in data.data || 'otpRequired' in data.data || 'isFirstLogin' in data.data) ? data.data : data;

      // If OTP is required, switch to step 2
      if (apiData?.otpRequired) {
        setOtpStep(true);
        setStatusMsg('OTP has been sent to your email. Please verify.');
        return;
      }

      // Case A: First-Time Login (isFirstLogin: true)
      // Check response.data.data.isFirstLogin === true (or apiData.isFirstLogin === true)
      const isFirstLogin = apiData?.isFirstLogin === true || data?.isFirstLogin === true;
      if (isFirstLogin) {
        const userEmail = apiData?.user?.email || data?.user?.email || username.trim();
        sessionStorage.setItem('pendingEmail', userEmail);
        if (password) {
          sessionStorage.setItem('tempCurrentPassword', password);
        }
        if (apiData?.token) {
          sessionStorage.setItem('tempToken', apiData.token);
        }
        // DO NOT route the user to the main Dashboard yet.
        // Immediately redirect to /change-first-password
        navigate('/change-first-password', {
          state: {
            email: userEmail,
            currentPassword: password
          }
        });
        return;
      }

      // If backend returns token directly (no OTP), complete login
      if (apiData?.token) {
        if (apiData.passwordChangeRequired) {
          // Store token and refreshToken so the changePassword API request is authenticated in axiosInstance
          setAuthValue('token', apiData.token);
          if (apiData.refreshToken) {
            setAuthValue('refreshToken', apiData.refreshToken);
          }
          
          navigate('/student/change-password', { 
            state: { 
              studentId: apiData.studentId, 
              schoolId: apiData.schoolId,
              currentPassword: password 
            } 
          });
          return;
        }
        completeLogin(response);
        return;
      }



    } catch (err) {
      console.error('🛑 [Login Step 1 Error]', err);
      if (err.response?.data?.message) {
        const errMsg = err.response.data.message;
        if (errMsg.toLowerCase().includes('inactive')) {
          setError('Your account is inactive. Please contact your school administrator.');
        } else {
          setError(errMsg);
        }
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: Verify OTP via unified login endpoint */
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { username: username.trim(), otp };
      const response = await login(payload);
      completeLogin(response);
    } catch (err) {
      console.error('🛑 [OTP Verify Error]', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /** Process the final login response and store auth data */
  const completeLogin = (response) => {
    const responseBody = response?.data ?? response;
    if (!responseBody) {
      setError('Unexpected login response received from the server.');
      return;
    }

    storeLoginResponse(response);

    // Support both nested data envelope from backend and flat data from mocks
    const data = responseBody?.data && typeof responseBody.data === 'object' && 'token' in responseBody.data ? responseBody.data : responseBody;

    let rawRole = data.role || data.user?.role;
    if (!rawRole) {
      if (data.studentId || data.student?.id) {
        rawRole = 'student';
      } else if (data.teacherId || data.teacher?.id) {
        rawRole = 'teacher';
      } else {
        rawRole = 'school';
      }
    }
    const role = rawRole.toLowerCase().replace('role_', '');

    const schoolId =
      data.school?.id ||
      data.schoolId ||
      data.user?.schoolId ||
      data.student?.schoolId ||
      data.teacher?.schoolId;
    const academicYearId =
      data.academicYearId ||
      data.currentAcademicYearId ||
      data.student?.academicYearId ||
      data.teacher?.academicYearId;
    const userId = data.user?.id || data.userId;
    const studentId = data.studentId || data.student?.id;
    const teacherId = data.teacherId || data.teacher?.id;
    const ownerId = data.ownerId || data.user?.ownerId || data.uid;

    // Case A: First-Time Login check
    if (data.isFirstLogin === true) {
      const userEmail = data.user?.email || username.trim();
      sessionStorage.setItem('pendingEmail', userEmail);
      if (password) {
        sessionStorage.setItem('tempCurrentPassword', password);
      }
      if (data.token) {
        sessionStorage.setItem('tempToken', data.token);
      }
      navigate('/change-first-password', {
        state: {
          email: userEmail,
          currentPassword: password
        }
      });
      return;
    }

    // Case B: Normal Login (isFirstLogin: false)
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    setAuthValue('token', data.token);
    if (data.refreshToken) {
      setAuthValue('refreshToken', data.refreshToken);
    }
    if (data.user) {
      setAuthValue('user', data.user);
    }
    setAuthValue('userRole', role);
    setAuthValue('userEmail', data.user?.email || username);
    setAuthValue('schoolId', schoolId);
    setAuthValue('userId', userId);
    setAuthValue('studentId', studentId);
    setAuthValue('teacherId', teacherId);
    setAuthValue('academicYearId', academicYearId);
    setAuthValue('ownerId', ownerId);
    if (data.standardId) setAuthValue('standardId', data.standardId);
    if (data.divisionId) setAuthValue('divisionId', data.divisionId);
    if (data.school?.name) setAuthValue('schoolName', data.school.name);

    const isExpired = data.school?.isSubscriptionExpired === true || data.isSubscriptionExpired === true;
    setAuthValue('isSubscriptionExpired', isExpired);

    const subscriptionStatus = data.school?.subscriptionStatus || data.subscriptionStatus || (data.children && data.children[0]?.subscriptionStatus);
    setAuthValue('subscriptionStatus', subscriptionStatus || '');

    // Case B: Navigate directly to the role-specific dashboard
    const targetDashboard = `/${role}/dashboard`;
    navigate(targetDashboard);
  };

  /** Go back from OTP step to credentials step */
  const handleBackToCredentials = () => {
    setOtpStep(false);
    setOtp('');
    setError('');
    setStatusMsg('');
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#090909] px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      <div className="pointer-events-none absolute -left-28 -top-28 h-[450px] w-[450px] rounded-full bg-[#ffc629]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-[400px] w-[400px] rounded-full bg-[#ffb703]/10 blur-3xl" />
      
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-[#2D2D2D] bg-[#141414]/95 shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl my-auto">
        <div className="flex flex-col lg:flex-row min-h-0">
          
          {/* Desktop Left Brand Column (No photo, pure prominent BrandLogo with floating up-down animation & gold hover) */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#191919] via-[#141414] to-[#0A0A0A] p-10 xl:p-16 text-center border-r border-[#262626] relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFC629]/5 via-transparent to-transparent" />
            
            {/* Majestic Central Brand Logo with Up-Down Floating Animation & Hover Glow */}
            <div className="relative z-10 w-full max-w-[360px] flex justify-center py-8">
              <Link to="/" className="inline-block focus:outline-none" aria-label="आयुष्याची फोटोग्राफी">
                <BrandLogo size="lg" animated={true} />
              </Link>
            </div>

            <div className="relative z-10 max-w-sm mt-3">
              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#FFC629] to-transparent mx-auto mb-5" />
              <p className="text-sm uppercase tracking-widest text-[#FFC629] font-extrabold leading-relaxed">
                Tushar Pulate Institute of Photography & Film Making
              </p>
              
              <div className="mt-8 rounded-2xl bg-[#0D0D0D]/90 border border-[#2A2A2A] p-6 text-xs italic text-[#C0C0C0] leading-relaxed shadow-lg">
                “कला कोणतीही असो जीव ओतून काम केल्याशिवाय कलाकार घडत नसतो..!”
                <span className="block mt-3 font-semibold text-[#FFC629] not-italic text-xs tracking-wider">— तुषार पुलाटे</span>
              </div>


            </div>
          </div>

          {/* Right Column: Portal Login Form (Spacious, Breathable "khula khula") */}
          <div className="flex w-full flex-1 flex-col justify-center bg-[#171717] p-6 sm:p-10 lg:p-12 xl:p-14">
            <div className="login-form-wrapper w-full max-w-[420px] mx-auto flex flex-col justify-center">
              {/* Mobile Brand Header */}
              <div className="lg:hidden mb-6 flex flex-col items-center text-center">
                <Link to="/" className="inline-block py-1 max-w-[260px]" aria-label="आयुष्याची फोटोग्राफी">
                  <BrandLogo size="login" animated={true} />
                </Link>
                <p className="text-[11px] uppercase tracking-wider text-[#FFC629] font-semibold mt-1">
                  Institute Portal
                </p>
              </div>

              <div className="flex flex-col items-center text-center" style={{ marginBottom: '20px' }}>
                <div className="h-12 w-12 rounded-full bg-[#FFC629]/15 border border-[#FFC629]/40 flex items-center justify-center shadow-md shadow-[#FFC629]/10" style={{ marginBottom: '10px' }}>
                  <img src="/aperture-icon.svg" alt="Aperture" className="h-5 w-5" />
                </div>
                <h2 className="font-['Cinzel'] text-xl sm:text-2xl font-extrabold text-[#FFC629] tracking-wide" style={{ letterSpacing: '0.03em' }}>
                  Institute Portal Login
                </h2>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-medium max-w-sm" style={{ marginTop: '4px' }}>
                  {otpStep
                    ? 'Enter the 6-digit OTP sent to your registered email to continue.'
                    : 'Sign in to access your dashboard, lectures, timetable, and records.'}
                </p>
              </div>

              {statusMsg && (
                <div 
                  className="rounded-xl border border-[#ffc629]/30 bg-[#ffc629]/10 text-center text-xs font-bold text-[#FFC629] shadow-sm"
                  style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '12px' }}
                >
                  {statusMsg}
                </div>
              )}
              {error && (
                <div 
                  className="rounded-xl border border-red-500/30 bg-red-500/10 text-center text-xs font-bold text-red-400 shadow-sm"
                  style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '12px' }}
                >
                  {error}
                </div>
              )}

              {/* Step 1: Credentials Form */}
              {!otpStep && (
                <form onSubmit={handleCredentialSubmit} className="flex flex-col w-full">
                  {/* Email / Aadhar Field Group */}
                  <div className="login-field-group" style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                    <label 
                      className="login-field-label block text-xs font-bold text-[#FFC629] uppercase tracking-wider"
                      style={{ display: 'block', marginBottom: '6px', color: '#FFC629', fontWeight: 700, letterSpacing: '0.05em', fontSize: '11px' }}
                    >
                      Email / Aadhar Number
                    </label>
                    <div 
                      className="login-input-box flex items-center rounded-xl border border-[#333333] bg-[#101010] transition-all duration-200 focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25 focus-within:shadow-[0_0_15px_rgba(255,198,41,0.15)]"
                      style={{ display: 'flex', height: '50px', minHeight: '50px', width: '100%', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1.5px solid #333333', backgroundColor: '#101010', padding: '0 16px', marginTop: '0', marginBottom: '0' }}
                    >
                      <BiEnvelope className="shrink-0 text-[#888888]" style={{ fontSize: '20px', color: '#888888', flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Enter your Email or Aadhar"
                        required
                        className="login-inner-input flex-1 h-full bg-transparent text-sm text-white outline-none placeholder:text-[#888888]"
                        style={{ flex: 1, height: '100%', background: 'transparent', color: '#FFFFFF', outline: 'none', border: 'none', fontSize: '14px' }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Field Group */}
                  <div className="login-field-group" style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
                    <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label 
                        className="login-field-label block text-xs font-bold text-[#FFC629] uppercase tracking-wider"
                        style={{ display: 'block', marginBottom: '0', color: '#FFC629', fontWeight: 700, letterSpacing: '0.05em', fontSize: '11px' }}
                      >
                        Password
                      </label>
                    </div>
                    <div 
                      className="login-input-box flex items-center rounded-xl border border-[#333333] bg-[#101010] transition-all duration-200 focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25 focus-within:shadow-[0_0_15px_rgba(255,198,41,0.15)]"
                      style={{ display: 'flex', height: '50px', minHeight: '50px', width: '100%', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1.5px solid #333333', backgroundColor: '#101010', padding: '0 16px', marginTop: '0', marginBottom: '0' }}
                    >
                      <BiLockAlt className="shrink-0 text-[#888888]" style={{ fontSize: '20px', color: '#888888', flexShrink: 0 }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        className="login-inner-input flex-1 h-full bg-transparent text-sm text-white outline-none placeholder:text-[#888888]"
                        style={{ flex: 1, height: '100%', background: 'transparent', color: '#FFFFFF', outline: 'none', border: 'none', fontSize: '14px' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="ml-auto shrink-0 text-base text-[#888888] transition hover:text-[#FFC629] p-1.5 cursor-pointer rounded-lg hover:bg-[#202020]"
                        style={{ padding: '6px', cursor: 'pointer', borderRadius: '8px', background: 'transparent', border: 'none', color: '#888888' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <BiHide /> : <BiShow />}
                      </button>
                    </div>
                  </div>

                  {/* Keep Me Signed In & Forgot Password */}
                  <div 
                    className="flex items-center justify-between text-xs"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', marginBottom: '16px' }}
                  >
                    <label 
                      className="checkbox-label inline-flex items-center gap-2.5 text-[#A8A8A8] cursor-pointer hover:text-white transition select-none"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#A8A8A8', marginBottom: 0 }}
                    >
                      <input 
                        type="checkbox" 
                        className="h-3.5 w-3.5 accent-[#FFC629] rounded cursor-pointer"
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#FFC629' }} 
                      />
                      <span style={{ fontSize: '12px' }}>Keep me signed in</span>
                    </label>
                    <Link 
                      className="font-semibold text-[#FFC629] hover:underline" 
                      to="/forgot-password" 
                      title="Forgot Password?"
                      style={{ color: '#FFC629', fontWeight: 600, fontSize: '12px' }}
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full rounded-xl font-extrabold text-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#ffc629]/25 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-[#ffc629]/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center cursor-pointer"
                    style={{ 
                      height: '50px', 
                      minHeight: '50px',
                      width: '100%', 
                      borderRadius: '12px', 
                      backgroundColor: '#FFC629', 
                      backgroundImage: 'linear-gradient(135deg, #FFC629 0%, #FFB703 100%)', 
                      color: '#090909',
                      fontWeight: 800,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: '0',
                      boxShadow: '0 6px 20px rgba(255,198,41,0.22)'
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Sign In to Portal'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP Verification Form */}
              {otpStep && (
                <form onSubmit={handleOtpVerify} className="flex flex-col w-full">
                  <div className="login-field-group" style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                    <label 
                      className="login-field-label block text-xs font-bold text-[#CCCCCC] uppercase tracking-wider"
                      style={{ display: 'block', marginBottom: '6px', color: '#FFC629', fontWeight: 700, letterSpacing: '0.05em', fontSize: '11px' }}
                    >
                      One-Time Password
                    </label>
                    <div 
                      className="login-input-box flex items-center rounded-xl border border-[#333333] bg-[#101010] transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/20"
                      style={{ display: 'flex', height: '50px', minHeight: '50px', width: '100%', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1.5px solid #333333', backgroundColor: '#101010', padding: '0 16px', marginTop: '0', marginBottom: '0' }}
                    >
                      <BiShieldQuarter className="shrink-0 text-lg text-[#FFC629]" style={{ fontSize: '20px', color: '#FFC629', flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                        className="login-inner-input flex-1 h-full bg-transparent text-base font-bold tracking-[0.4em] text-white outline-none"
                        style={{ flex: 1, height: '100%', background: 'transparent', color: '#FFFFFF', outline: 'none', border: 'none', fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.35em' }}
                      />
                    </div>
                    <p className="text-xs text-[#808080]" style={{ marginTop: '6px', fontSize: '11px', color: '#888888' }}>
                      OTP sent to <strong className="text-white" style={{ color: '#FFFFFF' }}>{username}</strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl font-extrabold text-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#ffc629]/25 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-[#ffc629]/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center cursor-pointer"
                    style={{ 
                      height: '50px', 
                      minHeight: '50px',
                      width: '100%', 
                      borderRadius: '12px', 
                      backgroundColor: '#FFC629', 
                      backgroundImage: 'linear-gradient(135deg, #FFC629 0%, #FFB703 100%)', 
                      color: '#090909',
                      fontWeight: 800,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: '14px',
                      boxShadow: '0 6px 20px rgba(255,198,41,0.22)'
                    }}
                    disabled={loading || otp.length < 4}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="w-full text-center text-xs font-semibold text-[#FFC629] hover:underline cursor-pointer"
                    style={{ width: '100%', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#FFC629', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
