import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createSchool } from '../../api/api';
import {
  BiBuildings, BiIdCard, BiMap,
  BiEnvelope, BiPhone, BiCloudUpload,
  BiCheckCircle, BiGlobe, BiArrowBack
} from 'react-icons/bi';
import BrandLogo from '../../components/photography/BrandLogo';

const wrapCls  = "flex h-14 items-center gap-4 rounded-2xl border border-[#333333] bg-[#101010] px-5 transition focus-within:border-[#FFC629] focus-within:ring-2 focus-within:ring-[#ffc629]/25";
const inputCls = "flex-1 h-full py-3 bg-transparent text-sm sm:text-base text-white outline-none placeholder:text-[#808080]";
const labelCls = "block text-xs font-bold text-[#FFC629] mb-3 uppercase tracking-wider";
const fieldCls = "flex flex-col mb-4";
const iconCls  = "shrink-0 text-xl text-[#FFC629]";

const Signup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    schoolName: '',
    udiseNo: '',
    state: '',
    district: '',
    taluka: '',
    pincode: '',
    schoolAddress: '',
    schoolLogo: null,
    email: '',
    phoneNo: '',
    subscriptionStatus: 'ACTIVE',
    schoolStatus: 'INACTIVE'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, schoolLogo: e.target.files[0] }));
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      await createSchool(submitData);
      setSuccess(true);
    } catch (error) {
      console.error('Error creating school:', error);
      alert(error.response?.data?.message || 'Failed to register institute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success Screen ── */
  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#090909] p-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-[#303030] bg-[#141414] p-8 sm:p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFC629]/15 border border-[#FFC629]/30">
            <BiCheckCircle className="text-5xl text-[#FFC629]" />
          </div>
          <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">Registration Submitted!</h2>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-sm text-[#A0A0A0]">
            Your application for <strong className="text-white">{formData.schoolName}</strong> is under review by the administration.
            A confirmation has been sent to <strong className="text-[#FFC629]">{formData.email}</strong>.
          </p>
          <button
            className="mt-8 h-12 w-full rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-lg shadow-[#ffc629]/20 transition hover:-translate-y-0.5 cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  /* ── Step Definitions ── */
  const steps = [
    { number: 1, label: 'Identity', icon: '📸' },
    { number: 2, label: 'Location', icon: '📍' },
    { number: 3, label: 'Contact',  icon: '📞' },
  ];

  return (
    <div className="min-h-dvh bg-[#090909] text-white flex items-center justify-center p-3 sm:p-6 lg:p-8 py-10 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#ffc629]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#ffb703]/10 blur-3xl" />

      <div className="w-full max-w-4xl relative z-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/login" className="inline-block mb-4 group" aria-label="आयुष्याची फोटोग्राफी">
            <BrandLogo size="login" animated={true} />
          </Link>
          <h1 className="font-['Cinzel'] text-lg sm:text-xl font-bold text-white">Institute & Branch Registration</h1>
          <p className="mt-1 text-xs text-[#8E8E93]">Tushar Pulate Institute of Photography & Film Making</p>
        </div>

        {/* Step Progress */}
        <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4 px-2">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-[#FFC629] text-black shadow-md shadow-[#ffc629]/20'
                    : currentStep === step.number
                      ? 'bg-[#FFC629] text-black shadow-lg shadow-[#ffc629]/30 scale-105'
                      : 'bg-[#181818] text-[#808080] border border-[#303030]'
                }`}>
                  {currentStep > step.number ? <BiCheckCircle className="text-xl text-black" /> : step.number}
                </div>
                <span className={`mt-1.5 text-[11px] sm:text-xs font-semibold transition-colors ${
                  currentStep === step.number ? 'text-[#FFC629]' : 'text-[#808080]'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`mb-5 h-0.5 w-10 sm:w-20 rounded-full transition-all duration-300 ${
                  currentStep > step.number ? 'bg-[#FFC629]' : 'bg-[#262626]'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#303030] bg-[#141414]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="h-1 bg-[#222222]">
            <div
              className="h-full bg-gradient-to-r from-[#FFC629] to-[#FFB703] transition-all duration-500 rounded-full"
              style={{ width: `${((currentStep - 1) / 2) * 100 + 33}%` }}
            />
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 lg:p-12">

            {/* ── Step 1: Basic Info ── */}
            {currentStep === 1 && (
              <div className="space-y-5 sm:space-y-6">
                <div className="mb-6">
                  <h2 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white">Institute Identity</h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#8E8E93]">Enter basic identification details for your photography branch</p>
                </div>

                <div className={fieldCls}>
                  <label className={labelCls}>Institute / Branch Name <span className="text-red-400">*</span></label>
                  <div className={wrapCls}>
                    <BiBuildings className={iconCls} />
                    <input
                      type="text"
                      name="schoolName"
                      placeholder="e.g. Ayushyachi Photography - Pune Branch"
                      required
                      className={inputCls}
                      value={formData.schoolName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={fieldCls}>
                  <label className={labelCls}>Registration / UDISE Code <span className="text-red-400">*</span></label>
                  <div className={wrapCls}>
                    <BiIdCard className={iconCls} />
                    <input
                      type="text"
                      name="udiseNo"
                      placeholder="Enter registration or identification number"
                      required
                      className={inputCls}
                      value={formData.udiseNo}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#808080]">Unique identifier or business registration number for the institute</p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-md shadow-[#ffc629]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    onClick={nextStep}
                    disabled={!formData.schoolName || !formData.udiseNo}
                  >
                    Continue to Location →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {currentStep === 2 && (
              <div className="space-y-5 sm:space-y-6">
                <div className="mb-6">
                  <h2 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white">Campus Location</h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#8E8E93]">Where is your studio and campus located?</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className={fieldCls}>
                    <label className={labelCls}>State <span className="text-red-400">*</span></label>
                    <div className={wrapCls}>
                      <BiMap className={iconCls} />
                      <input className={inputCls} type="text" name="state" placeholder="e.g. Maharashtra" required value={formData.state} onChange={handleChange} />
                    </div>
                  </div>
                  <div className={fieldCls}>
                    <label className={labelCls}>District <span className="text-red-400">*</span></label>
                    <div className={wrapCls}>
                      <BiMap className={iconCls} />
                      <input className={inputCls} type="text" name="district" placeholder="e.g. Pune" required value={formData.district} onChange={handleChange} />
                    </div>
                  </div>
                  <div className={fieldCls}>
                    <label className={labelCls}>Taluka / Area</label>
                    <div className={wrapCls}>
                      <BiMap className={iconCls} />
                      <input className={inputCls} type="text" name="taluka" placeholder="e.g. Haveli / Charholi" value={formData.taluka} onChange={handleChange} />
                    </div>
                  </div>
                  <div className={fieldCls}>
                    <label className={labelCls}>Pincode <span className="text-red-400">*</span></label>
                    <div className={wrapCls}>
                      <BiGlobe className={iconCls} />
                      <input className={inputCls} type="text" name="pincode" placeholder="6-digit Pincode" required value={formData.pincode} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className={fieldCls}>
                  <label className={labelCls}>Complete Studio Address</label>
                  <div className="rounded-xl border border-[#303030] bg-[#181818] p-3 transition focus-within:border-[#FFC629]">
                    <textarea
                      name="schoolAddress"
                      rows={3}
                      placeholder="e.g. Parshwa Capital, Charholi Budruk, Pune..."
                      className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-[#808080]"
                      value={formData.schoolAddress}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#303030] bg-[#181818] px-5 font-bold text-white transition hover:border-[#FFC629] cursor-pointer"
                    onClick={prevStep}
                  >
                    <BiArrowBack /> Back
                  </button>
                  <button
                    type="button"
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-md shadow-[#ffc629]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    onClick={nextStep}
                    disabled={!formData.state || !formData.pincode}
                  >
                    Continue to Contact →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Contact & Branding ── */}
            {currentStep === 3 && (
              <div className="space-y-5 sm:space-y-6">
                <div className="mb-6">
                  <h2 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white">Contact & Credentials</h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#8E8E93]">Finalize your administrative contact details</p>
                </div>

                <div className={fieldCls}>
                  <label className={labelCls}>Administrative Email <span className="text-red-400">*</span></label>
                  <div className={wrapCls}>
                    <BiEnvelope className={iconCls} />
                    <input className={inputCls} type="email" name="email" placeholder="admin@photography.com" required value={formData.email} onChange={handleChange} />
                  </div>
                </div>

                <div className={fieldCls}>
                  <label className={labelCls}>Helpline Phone Number <span className="text-red-400">*</span></label>
                  <div className={wrapCls}>
                    <BiPhone className={iconCls} />
                    <input className={inputCls} type="tel" name="phoneNo" placeholder="+91 84599 12189" required value={formData.phoneNo} onChange={handleChange} />
                  </div>
                </div>

                <div className={fieldCls}>
                  <label className={labelCls}>Institute Logo <span className="text-[#808080] font-normal">(optional)</span></label>
                  <label className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#333333] bg-[#181818] p-6 text-center transition cursor-pointer hover:border-[#FFC629]">
                    <BiCloudUpload className="text-4xl text-[#FFC629]" />
                    <div>
                      <p className="text-xs font-semibold text-white">Click to upload brand logo</p>
                      <span className="text-[10px] text-[#808080]">PNG, JPG, or SVG (max 2MB)</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {formData.schoolLogo && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FFC629]/15 border border-[#FFC629]/30 px-3 py-2 text-xs font-semibold text-[#FFC629]">
                      <BiCheckCircle className="text-base" />
                      {formData.schoolLogo.name}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#303030] bg-[#181818] px-5 font-bold text-white transition hover:border-[#FFC629] cursor-pointer"
                    onClick={prevStep}
                  >
                    <BiArrowBack /> Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#FFC629] to-[#FFB703] font-bold text-black shadow-md shadow-[#ffc629]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Complete Institute Registration'}
                  </button>
                </div>
              </div>
            )}

          </form>

          {/* Footer */}
          <div className="border-t border-[#262626] bg-[#101010] px-6 py-4 text-center">
            <p className="text-xs text-[#8E8E93]">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#FFC629] hover:underline transition">
                Sign In to Portal →
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#808080]">
          आयुष्याची फोटोग्राफी · Tushar Pulate Institute of Photography & Film Making
        </p>
      </div>
    </div>
  );
};

export default Signup;
