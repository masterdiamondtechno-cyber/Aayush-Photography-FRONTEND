import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BiGridAlt, BiBell, BiShieldQuarter, BiGroup, 
  BiCalendar, BiTrendingUp, BiCheck, BiRightArrowAlt,
  BiLogInCircle, BiCamera, BiFilm, BiUserCheck
} from 'react-icons/bi';
import { useLanguage } from '../../context/LanguageContext';
import BrandLogo from '../../components/photography/BrandLogo';

const STATS = [
  { value: '500+', labelEn: 'Batches Completed', labelMr: 'यशस्वी बॅचेस' },
  { value: '1.2K+', labelEn: 'Students Trained', labelMr: 'प्रशिक्षित विद्यार्थी' },
  { value: '25+', labelEn: 'Master Mentors', labelMr: 'तज्ज्ञ मार्गदर्शक' },
  { value: '99.9%', labelEn: 'Practical Success', labelMr: 'प्रात्यक्षिक निकाल' },
];

const FEATURES = [
  {
    icon: BiGridAlt,
    titleEn: 'Efficient Orchestration',
    titleMr: 'एकात्मिक व्यवस्थापन',
    descEn: 'A unified dashboard harmonizing photography students, faculty, studio labs, and equipment resources.',
    descMr: 'विद्यार्थी, शिक्षक, स्टुडिओ आणि संसाधनांचे एकाच डॅशबोर्डवरून अखंड नियंत्रण.'
  },
  {
    icon: BiBell,
    titleEn: 'Instant Connectivity',
    titleMr: 'त्वरित सूचना व संवाद',
    descEn: 'Real-time notifications for shoot schedules, masterclasses, and field practical updates.',
    descMr: 'प्रॅक्टिकल शूट्स, मास्टरक्लासेस आणि सूचनांचे रिअल-टाइम अलर्ट्स.'
  },
  {
    icon: BiShieldQuarter,
    titleEn: 'Enterprise-Grade Security',
    titleMr: 'सुरक्षित प्रवेश नियंत्रण',
    descEn: 'Sophisticated role-based access control protecting academic records and student portfolios.',
    descMr: 'अ‍ॅडमिन, शिक्षक आणि विद्यार्थ्यांसाठी सुरक्षित भूमिका-आधारित अ‍ॅक्सेस.'
  },
  {
    icon: BiGroup,
    titleEn: 'Multi-Role Portals',
    titleMr: 'मल्टी-रोल पोर्टल्स',
    descEn: 'Tailored interfaces for Admin, Instructors, Students, Parents, and Institute Owners.',
    descMr: 'अ‍ॅडमिन, फॅकल्टी, विद्यार्थी, पालक आणि ओनर्ससाठी स्वतंत्र समृद्ध पोर्टल्स.'
  },
  {
    icon: BiCalendar,
    titleEn: 'Smart Scheduling',
    titleMr: 'स्मार्ट वेळापत्रक',
    descEn: 'Automated practical timetable generation, studio booking, and biometric attendance tracking.',
    descMr: 'स्टुडिओ शेड्युलिंग, प्रॅक्टिकल्स आणि उपस्थितीचे स्वयंचलित ट्रॅकिंग.'
  },
  {
    icon: BiTrendingUp,
    titleEn: 'Analytics & Financials',
    titleMr: 'अ‍ॅनालिटिक्स व फी ट्रॅकिंग',
    descEn: 'In-depth student performance analytics, batch milestones, and instant fee collection tracking.',
    descMr: 'विद्यार्थ्यांची प्रगती, बॅच रेकॉर्ड्स आणि फी संकलनाचे सविस्तर अहवाल.'
  },
];

const ROLES = [
  {
    role: 'Admin / School',
    roleMr: 'इन्स्टिट्यूट अ‍ॅडमिन',
    descEn: 'Complete institute operations, admissions, student records, fee collection, and faculty management.',
    descMr: 'संपूर्ण इन्स्टिट्यूट ऑपरेशन्स, ऍडमिशन, फी कलेक्शन आणि फॅकल्टी मॅनेजमेंट.',
    link: '/login',
    color: 'from-amber-500/20 to-[#FFC629]/10'
  },
  {
    role: 'Instructors / Faculty',
    roleMr: 'फॅकल्टी / शिक्षक',
    descEn: 'Conduct live lectures, manage practical batches, track attendance, and upload study materials.',
    descMr: 'लाईव्ह लेक्चर्स, प्रॅक्टिकल बॅचेस, हजेरी आणि अभ्यास साहित्य अपलोड करा.',
    link: '/login',
    color: 'from-amber-600/20 to-amber-400/10'
  },
  {
    role: 'Students / Learners',
    roleMr: 'विद्यार्थी पोर्टल',
    descEn: 'View practical timetables, exams, live classes, recorded sessions, and certificate records.',
    descMr: 'प्रॅक्टिकल वेळापत्रक, परीक्षा, रेकॉर्डेड लेक्चर्स आणि प्रगती अहवाल पहा.',
    link: '/login',
    color: 'from-yellow-500/20 to-amber-500/10'
  },
  {
    role: 'Institute Owners',
    roleMr: 'ओनर डॅशबोर्ड',
    descEn: 'High-level multi-branch analytics, financial reports, revenue insights, and branch director controls.',
    descMr: 'मल्टी-ब्रँच अ‍ॅनालिटिक्स, फायनान्स रिपोर्ट आणि महसूल अहवाल व्यवस्थापन.',
    link: '/login',
    color: 'from-amber-400/20 to-yellow-600/10'
  }
];

const Home = () => {
  const { language } = useLanguage();
  const isMr = language === 'mr';

  return (
    <div className="bg-[#090909] text-[#EDEDED] min-h-screen">
      
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 lg:pt-40 sm:pb-24 border-b border-[#1E1E1E]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-[#090909]/80 to-[#090909] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFC629]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#FFC629]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC629]/30 bg-[#FFC629]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FFC629] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FFC629] animate-pulse" />
              <span>{isMr ? 'आयुष्याची फोटोग्राफी - व्यवस्थापन प्रणाली' : 'Tushar Pulate Institute Management Platform'}</span>
            </div>
            

            {/* Main Title */}
            <h1 className="font-['Cinzel'] text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
              {isMr ? 'फोटोग्राफी इन्स्टिट्यूटचे' : 'The Future of Photography'}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC629] via-[#FFE25C] to-[#E0AC1B]">
                {isMr ? 'आधुनिक पोर्टल' : 'Institute Management'}
              </span>{' '}
              {isMr ? 'येथे आहे.' : 'is Here.'}
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-[#A0A0A0] mb-10">
              {isMr
                ? 'तुषार पुलाटे इन्स्टिट्यूट ऑफ फोटोग्राफी अँड फिल्म मेकिंग साठी डिझाइन केलेली सर्वसमावेशक, सुरक्षित व वेगवान व्यवस्थापन प्रणाली. विद्यार्थी, शिक्षक व प्रशासनाचे एकात्मिक व्यासपीठ.'
                : 'A comprehensive, intuitive, and high-performance management ecosystem tailored for Tushar Pulate Institute of Photography & Film Making. Empowering mentors, students, and administration.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#FFC629] hover:bg-[#E0AC1B] text-black px-8 py-3.5 text-base font-bold transition shadow-lg shadow-[#FFC629]/20 hover:-translate-y-0.5"
              >
                <BiLogInCircle className="text-xl" />
                <span>{isMr ? 'पोर्टल लॉगिन करा' : 'Sign In to Portal'}</span>
              </Link>
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#333333] hover:border-[#FFC629]/60 bg-[#141414] hover:bg-[#1A1A1A] text-white px-7 py-3.5 text-base font-semibold transition"
              >
                <span>{isMr ? 'नवीन ब्रँच नोंदणी' : 'Register Institute / Branch'}</span>
                <BiRightArrowAlt className="text-xl text-[#FFC629]" />
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#A0A0A0] hover:text-[#FFC629] px-4 py-3.5 transition"
              >
                <span>{isMr ? 'इन्स्टिट्यूट बद्दल जाणून घ्या' : 'About Institute'}</span>
              </Link>
            </div>
          </div>

          {/* ── Stats Bar ── */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-[#222222] bg-[#111111]/80 backdrop-blur-md">
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center p-3 border-r last:border-r-0 border-[#222222]">
                <div className="font-['Cinzel'] text-3xl sm:text-4xl font-extrabold text-[#FFC629] mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#8E8E93]">
                  {isMr ? stat.labelMr : stat.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 border-b border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-bold text-[#FFC629] block mb-2">
              {isMr ? 'प्रणाली वैशिष्ट्ये' : 'Core Capabilities'}
            </span>
            <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'संपूर्ण व्यवस्थापन साधने' : 'Built for Modern Educational Excellence'}
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93]">
              {isMr
                ? 'फोटोग्राफी इन्स्टिट्यूटच्या दैनंदिन कामकाजासाठी आवश्यक असणारी सर्व अद्ययावत साधने.'
                : 'Every tool required to streamline practical sessions, student attendance, fees, and masterclasses.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#222222] bg-[#121212] hover:bg-[#161616] p-7 transition duration-300 hover:border-[#FFC629]/50 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FFC629]/10 group-hover:bg-[#FFC629]/20 flex items-center justify-center text-[#FFC629] text-2xl mb-5 transition">
                    <Icon />
                  </div>
                  <h3 className="font-['Cinzel'] text-lg font-bold text-white group-hover:text-[#FFC629] transition mb-2">
                    {isMr ? feat.titleMr : feat.titleEn}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#8E8E93]">
                    {isMr ? feat.descMr : feat.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Multi-Role Portals Showcase ── */}
      <section className="py-20 border-b border-[#1E1E1E] bg-[#0C0C0C]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-bold text-[#FFC629] block mb-2">
              {isMr ? 'पोर्टल्स' : 'Unified Ecosystem'}
            </span>
            <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'प्रत्येक भूमिकेसाठी स्वतंत्र डॅशबोर्ड' : 'Dedicated Portals for Every Role'}
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93]">
              {isMr
                ? 'अ‍ॅडमिन, शिक्षक, विद्यार्थी आणि संस्थाचालकांसाठी सुरक्षित प्रवेश.'
                : 'Tailored views and controls ensuring each user has access to exactly what they need.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map((r, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-[#222222] bg-gradient-to-br from-[#141414] to-[#101010] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-['Cinzel'] text-xl font-bold text-white">
                      {isMr ? r.roleMr : r.role}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFC629]/10 text-[#FFC629] border border-[#FFC629]/20">
                      {isMr ? 'सक्रिय' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-[#8E8E93] leading-relaxed mb-6">
                    {isMr ? r.descMr : r.descEn}
                  </p>
                </div>
                <Link
                  to={r.link}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#FFC629] hover:underline"
                >
                  <span>{isMr ? 'पोर्टल मध्ये प्रवेश करा' : 'Access Portal'}</span>
                  <BiRightArrowAlt className="text-lg" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ready to Start CTA ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl border border-[#FFC629]/30 bg-gradient-to-b from-[#161616] to-[#0E0E0E] shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl bg-[#FFC629]/15 border border-[#FFC629]/30 flex items-center justify-center mx-auto mb-6 text-[#FFC629] text-3xl">
              <BiCamera />
            </div>
            <h2 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'आयुष्याची फोटोग्राफी पोर्टल मध्ये सामील व्हा' : 'Get Started with Ayushyachi Photography Portal'}
            </h2>
            <p className="text-sm sm:text-base text-[#A0A0A0] max-w-xl mx-auto mb-8">
              {isMr
                ? 'आपल्या बॅचेस, विद्यार्थी आणि फीचे व्यवस्थापन एकाच क्लिकवर सुरू करा.'
                : 'Sign in to access your dashboard or register your branch for complete management control.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFC629] hover:bg-[#E0AC1B] text-black font-bold px-8 py-3.5 rounded-xl transition"
              >
                <BiLogInCircle className="text-xl" />
                <span>{isMr ? 'आताच लॉगिन करा' : 'Sign In Now'}</span>
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#333333] hover:border-[#FFC629] text-white px-7 py-3.5 rounded-xl font-semibold transition"
              >
                <span>{isMr ? 'संपर्क साधा' : 'Contact Support'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
