import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BiGridAlt, BiBell, BiShieldQuarter, BiGroup, 
  BiCalendar, BiTrendingUp, BiRightArrowAlt,
  BiLogInCircle, BiCamera, BiFilm, BiUserCheck,
  BiAward, BiCheckDouble, BiMapPin, BiPhoneCall,
  BiCheck
} from 'react-icons/bi';
import { useLanguage } from '../../context/LanguageContext';
import { coursesData, facilitiesData, instituteDetails } from '../../data/photographyData';

const STATS = [
  { 
    value: '500+', 
    labelEn: 'Batches Completed', 
    labelMr: 'यशस्वी बॅचेस', 
    subEn: 'Over 6+ years of excellence', 
    subMr: '६+ वर्षांचा गौरवशाली अनुभव',
    icon: BiAward 
  },
  { 
    value: '1.2K+', 
    labelEn: 'Students Trained', 
    labelMr: 'प्रशिक्षित विद्यार्थी', 
    subEn: 'Across Maharashtra & India', 
    subMr: 'महाराष्ट्र व देशभरातून',
    icon: BiGroup 
  },
  { 
    value: '25+', 
    labelEn: 'Master Mentors', 
    labelMr: 'तज्ज्ञ मार्गदर्शक', 
    subEn: 'Industry working professionals', 
    subMr: 'इंडस्ट्रीमधील तज्ज्ञ मार्गदर्शक',
    icon: BiFilm 
  },
  { 
    value: '99.9%', 
    labelEn: 'Practical Success', 
    labelMr: 'प्रात्यक्षिक निकाल', 
    subEn: 'Hands-on shoot mastery', 
    subMr: '१००% प्रॅक्टिकल यश',
    icon: BiCheckDouble 
  },
];

const FEATURES = [
  {
    num: '01',
    icon: BiGridAlt,
    titleEn: 'Efficient Orchestration',
    titleMr: 'एकात्मिक व्यवस्थापन',
    descEn: 'A unified dashboard harmonizing photography students, faculty, studio labs, and equipment resources.',
    descMr: 'विद्यार्थी, शिक्षक, स्टुडिओ आणि संसाधनांचे एकाच डॅशबोर्डवरून अखंड नियंत्रण.'
  },
  {
    num: '02',
    icon: BiBell,
    titleEn: 'Instant Connectivity',
    titleMr: 'त्वरित सूचना व संवाद',
    descEn: 'Real-time notifications for shoot schedules, masterclasses, and field practical updates.',
    descMr: 'प्रॅक्टिकल शूट्स, मास्टरक्लासेस आणि सूचनांचे रिअल-टाइम अलर्ट्स.'
  },
  {
    num: '03',
    icon: BiShieldQuarter,
    titleEn: 'Enterprise Security',
    titleMr: 'सुरक्षित प्रवेश नियंत्रण',
    descEn: 'Sophisticated role-based access control protecting academic records, shoot assets, and student portfolios.',
    descMr: 'अ‍ॅडमिन, शिक्षक आणि विद्यार्थ्यांसाठी सुरक्षित भूमिका-आधारित अ‍ॅक्सेस.'
  },
  {
    num: '04',
    icon: BiGroup,
    titleEn: 'Multi-Role Portals',
    titleMr: 'मल्टी-रोल पोर्टल्स',
    descEn: 'Tailored interfaces for School Admin, Instructors, Students, Parents, and Institute Owners.',
    descMr: 'अ‍ॅडमिन, फॅकल्टी, विद्यार्थी, पालक आणि ओनर्ससाठी स्वतंत्र समृद्ध पोर्टल्स.'
  },
  {
    num: '05',
    icon: BiCalendar,
    titleEn: 'Smart Scheduling',
    titleMr: 'स्मार्ट वेळापत्रक',
    descEn: 'Automated practical timetable generation, indoor studio booking, and attendance tracking.',
    descMr: 'स्टुडिओ शेड्युलिंग, प्रॅक्टिकल्स आणि उपस्थितीचे स्वयंचलित ट्रॅकिंग.'
  },
  {
    num: '06',
    icon: BiTrendingUp,
    titleEn: 'Analytics & Financials',
    titleMr: 'अ‍ॅनालिटिक्स व फी ट्रॅकिंग',
    descEn: 'In-depth student performance analytics, batch milestones, and instant fee collection tracking.',
    descMr: 'विद्यार्थ्यांची प्रगती, बॅच रेकॉर्ड्स आणि फी संकलनाचे सविस्तर अहवाल.'
  },
];

const ROLES = [
  {
    role: 'Admin / School Portal',
    roleMr: 'इन्स्टिट्यूट अ‍ॅडमिन पोर्टल',
    descEn: 'Comprehensive institute control: student admissions, fee collection, batch scheduling, and teacher management.',
    descMr: 'संपूर्ण इन्स्टिट्यूट ऑपरेशन्स, ऍडमिशन, फी कलेक्शन आणि फॅकल्टी मॅनेजमेंट.',
    link: '/login',
    icon: BiShieldQuarter,
    highlightsEn: ['Admissions & Fees', 'Batch Management', 'Faculty Records'],
    highlightsMr: ['ऍडमिशन व फी कलेक्शन', 'बॅच व्यवस्थापन', 'फॅकल्टी रेकॉर्ड्स']
  },
  {
    role: 'Instructors & Mentors',
    roleMr: 'फॅकल्टी / मार्गदर्शक पोर्टल',
    descEn: 'Conduct live lectures, manage daily practical batches, log attendance, and upload learning materials.',
    descMr: 'लाईव्ह लेक्चर्स, प्रॅक्टिकल बॅचेस, दैनंदिन हजेरी आणि अभ्यास साहित्य व्यवस्थापन.',
    link: '/login',
    icon: BiCamera,
    highlightsEn: ['Live Lectures', 'Practical Batches', 'Study Material'],
    highlightsMr: ['लाईव्ह लेक्चर्स', 'प्रॅक्टिकल बॅचेस', 'अभ्यास साहित्य']
  },
  {
    role: 'Students & Learners',
    roleMr: 'विद्यार्थी पोर्टल',
    descEn: 'Access shoot timetables, examination schedules, live lectures, recorded library, and certificates.',
    descMr: 'प्रॅक्टिकल वेळापत्रक, परीक्षा, रेकॉर्डेड लेक्चर्स आणि प्रगती अहवाल पहा.',
    link: '/login',
    icon: BiUserCheck,
    highlightsEn: ['Shoot Schedules', 'Recorded Lectures', 'Exam & Results'],
    highlightsMr: ['शूट वेळापत्रक', 'रेकॉर्डेड लेक्चर्स', 'परीक्षा व निकाल']
  },
  {
    role: 'Institute Owners',
    roleMr: 'ओनर डॅशबोर्ड',
    descEn: 'High-level multi-branch analytics, financial reports, revenue insights, and branch director controls.',
    descMr: 'मल्टी-ब्रँच अ‍ॅनालिटिक्स, फायनान्स रिपोर्ट आणि महसूल अहवाल व्यवस्थापन.',
    link: '/login',
    icon: BiTrendingUp,
    highlightsEn: ['Branch Analytics', 'Financial Reports', 'Director Controls'],
    highlightsMr: ['ब्रँच अ‍ॅनालिटिक्स', 'आर्थिक अहवाल', 'संचालक नियंत्रण']
  }
];

const Home = () => {
  const { language } = useLanguage();
  const isMr = language === 'mr';

  // 4 featured flagship courses
  const featuredCourses = coursesData.slice(0, 4);

  // Top 3 facilities
  const previewFacilities = facilitiesData.slice(0, 3);

  return (
    <div className="home-page-container">
      
      {/* ── 1. Hero Section (Balanced 2-Column Layout that Fills the Whole Screen) ── */}
      <section className="home-hero-section">
        <div className="home-wrapper-full">
          <div className="home-hero-grid">
            
            {/* Left Column: Heading, Subtitle, Buttons, Credentials */}
            <div className="home-hero-left">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#FFC629]/35 bg-[#FFC629]/10 px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold tracking-wider text-[#FFC629] mb-5 sm:mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#FFC629] animate-pulse" />
                <span>
                  {isMr ? 'आयुष्याची फोटोग्राफी • अधिकृत संस्था पोर्टल' : 'Ayushyachi Photography • Premier Institute'}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-['Cinzel'] text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-normal text-white mb-5">
                {isMr ? (
                  <>
                    तुषार पुलाटे इन्स्टिट्यूट ऑफ फोटोग्राफी
                    <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FFC629] via-[#FFE25C] to-[#E0AC1B]">
                      अधिकृत व्यवस्थापन व शैक्षणिक पोर्टल
                    </span>
                  </>
                ) : (
                  <>
                    The Premier Photography & Film Making Institute
                    <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FFC629] via-[#FFE25C] to-[#E0AC1B]">
                      Official Management & Learning Platform
                    </span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg leading-relaxed text-[#A0A0A0] mb-8 max-w-xl">
                {isMr
                  ? 'तुषार पुलाटे इन्स्टिट्यूट ऑफ फोटोग्राफी अँड फिल्म मेकिंगसाठी तयार केलेली सर्वसमावेशक प्रणाली. विद्यार्थी, मार्गदर्शक आणि प्रशासनाचे सशक्त व्यासपीठ.'
                  : 'A comprehensive, intuitive, and high-performance management ecosystem built for Tushar Pulate Institute of Photography & Film Making. Empowering mentors, students, and administration.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto mb-8">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#FFC629] hover:bg-[#E0AC1B] text-black px-7 py-3.5 sm:py-4 text-base font-bold transition-all duration-200 shadow-lg shadow-[#FFC629]/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <BiLogInCircle className="text-2xl" />
                  <span>{isMr ? 'पोर्टल लॉगिन करा' : 'Sign In to Portal'}</span>
                </Link>
                <Link
                  to="/courses"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#333333] hover:border-[#FFC629]/70 bg-[#141414] hover:bg-[#1A1A1A] text-white px-6 py-3.5 sm:py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5"
                >
                  <BiCamera className="text-xl text-[#FFC629]" />
                  <span>{isMr ? 'सर्व कोर्सेस पहा' : 'Explore Courses'}</span>
                </Link>
                <Link
                  to="/about"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#8E8E93] hover:text-[#FFC629] px-4 py-3 transition-colors"
                >
                  <span>{isMr ? 'आमच्याबद्दल' : 'About Us'}</span>
                  <BiRightArrowAlt className="text-lg" />
                </Link>
              </div>

              {/* Trust & Credibility Badges */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-[#8E8E93]">
                <span className="inline-flex items-center gap-1.5 bg-[#141414] border border-[#222222] px-3 py-1.5 rounded-lg">
                  <BiCheck className="text-[#FFC629] text-base" />
                  <span>ISO 9001:2015 & IAF Certified</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#141414] border border-[#222222] px-3 py-1.5 rounded-lg">
                  <BiCheck className="text-[#FFC629] text-base" />
                  <span>30 Days Intensive Format</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#141414] border border-[#222222] px-3 py-1.5 rounded-lg">
                  <BiCheck className="text-[#FFC629] text-base" />
                  <span>Charholi Budruk, Pune</span>
                </span>
              </div>
            </div>

            {/* Right Column: Visual Photography Showcase Frame (Fills the Right Half!) */}
            <div className="home-hero-right">
              <div className="home-hero-showcase-frame group">
                <img
                  src="/images/gallery-outdoor-practicals.png"
                  alt="Photography Practicals at Ayushyachi Photography"
                  className="home-hero-showcase-img"
                  loading="eager"
                />
                
                {/* Visual Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/30 pointer-events-none" />

                {/* Top Badge: Founder & Mentor */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-black/80 backdrop-blur-md border border-[#FFC629]/40 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-[#FFC629]" />
                  <span>Tushar Pulate • Lead Mentor</span>
                </div>

                {/* Top Right Badge: 30 Days Practical */}
                <div className="absolute top-4 right-4 bg-[#FFC629] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  30 Days Practical
                </div>

                {/* Bottom Floating Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#121212]/90 backdrop-blur-md border border-[#2A2A2A] p-4 rounded-xl shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFC629]/15 border border-[#FFC629]/30 flex items-center justify-center text-[#FFC629] text-xl">
                      <BiCamera />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#AAAAAA]">
                        {isMr ? 'आगामी प्रत्यक्ष बॅच' : 'Upcoming Batch Open'}
                      </div>
                      <div className="text-sm font-bold text-white">
                        {isMr ? 'सीट बुकिंग: ₹५,०००' : 'Seat Booking: ₹5,000'}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FFC629] hover:underline"
                  >
                    <span>{isMr ? 'चौकशी करा' : 'Enquire Now'}</span>
                    <BiRightArrowAlt className="text-base" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* ── Stats Cards Grid (Centered & Spanning the Entire Screen Width from Left to Right) ── */}
          <div className="home-stats-grid">
            {STATS.map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={idx} 
                  className="home-stat-card group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-[#FFC629]/10 group-hover:bg-[#FFC629]/20 border border-[#FFC629]/20 flex items-center justify-center text-[#FFC629] text-2xl transition-all duration-300 group-hover:scale-105">
                        <IconComponent />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#FFC629]/60 tracking-wider">
                        0{idx + 1}
                      </span>
                    </div>
                    <div className="font-['Cinzel'] text-3xl sm:text-4xl font-extrabold text-white group-hover:text-[#FFC629] transition-colors mb-2">
                      {stat.value}
                    </div>
                    <div className="text-base font-bold text-[#F0F0F0] mb-1.5">
                      {isMr ? stat.labelMr : stat.labelEn}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed pt-3 border-t border-[#222222]/80">
                    {isMr ? stat.subMr : stat.subEn}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 2. Multi-Role Portals Showcase (Full Width 2x2 Grid) ── */}
      <section className="home-section-spacer bg-[#0B0B0B]">
        <div className="home-wrapper-full">
          <div className="home-header-spacing">
            <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#FFC629] bg-[#FFC629]/10 border border-[#FFC629]/25 px-4 py-1.5 rounded-full mb-3.5">
              {isMr ? 'पोर्टल्स' : 'Unified Ecosystem'}
            </span>
            <h2 className="font-['Cinzel'] text-2xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'प्रत्येक भूमिकेसाठी स्वतंत्र डॅशबोर्ड' : 'Dedicated Portals for Every Role'}
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed max-w-xl mx-auto">
              {isMr
                ? 'अ‍ॅडमिन, शिक्षक, विद्यार्थी आणि संस्थाचालकांसाठी सुरक्षित व आधुनिक प्रवेश पोर्टल्स.'
                : 'Tailored views and controls ensuring each user has seamless access to their academic tools.'}
            </p>
          </div>

          <div className="home-roles-grid">
            {ROLES.map((r, idx) => {
              const RoleIcon = r.icon;
              const highlights = isMr ? r.highlightsMr : r.highlightsEn;

              return (
                <div
                  key={idx}
                  className="home-card-standalone group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon + Status */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFC629]/10 border border-[#FFC629]/25 flex items-center justify-center text-[#FFC629] text-3xl group-hover:bg-[#FFC629]/20 group-hover:scale-105 transition-all duration-300">
                        <RoleIcon />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{isMr ? 'सक्रिय' : 'Live Portal'}</span>
                      </span>
                    </div>

                    {/* Role Title */}
                    <h3 className="font-['Cinzel'] text-xl sm:text-2xl font-bold text-white group-hover:text-[#FFC629] transition-colors mb-3">
                      {isMr ? r.roleMr : r.role}
                    </h3>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed mb-6">
                      {isMr ? r.descMr : r.descEn}
                    </p>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2.5 mb-8">
                      {highlights.map((tag, tIdx) => (
                        <span 
                          key={tIdx} 
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C8C8CC] bg-[#1C1C1C] border border-[#2B2B2B] px-3.5 py-1.5 rounded-lg"
                        >
                          <BiCheck className="text-[#FFC629]" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={r.link}
                    className="inline-flex items-center justify-between w-full rounded-xl bg-[#181818] hover:bg-[#FFC629] text-white hover:text-black px-5 py-3.5 font-bold text-sm border border-[#2B2B2B] hover:border-[#FFC629] transition-all duration-200"
                  >
                    <span>{isMr ? 'पोर्टल मध्ये प्रवेश करा' : 'Sign In to Portal'}</span>
                    <BiRightArrowAlt className="text-xl transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Featured Flagship Courses (Full Width 4-Column Grid) ── */}
      <section className="home-section-spacer bg-[#090909]">
        <div className="home-wrapper-full">
          <div className="home-header-spacing">
            <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#FFC629] bg-[#FFC629]/10 border border-[#FFC629]/25 px-4 py-1.5 rounded-full mb-3.5">
              {isMr ? 'अभ्यासक्रम' : 'Flagship Modules'}
            </span>
            <h2 className="font-['Cinzel'] text-2xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'प्रमुख फोटोग्राफी व फिल्म मेकिंग कोर्सेस' : 'Featured Professional Courses'}
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed max-w-xl mx-auto">
              {isMr
                ? '३० दिवसांचे सखोल प्रात्यक्षिक शिक्षण जे तुम्हाला स्वतंत्र आणि व्यावसायिक कलाकार बनवते.'
                : 'Intensive 30-day hands-on curriculum engineered to forge industry-ready visual creators.'}
            </p>
          </div>

          <div className="home-courses-grid">
            {featuredCourses.map((course, idx) => {
              const title = isMr ? course.titleMr : course.title;
              const shortDesc = isMr ? course.shortDescMr : course.shortDesc;

              return (
                <div
                  key={idx}
                  className="home-card-standalone group p-0 overflow-hidden flex flex-col justify-between"
                  style={{ padding: 0 }}
                >
                  <div>
                    {/* Course Image */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#1A1A1A]">
                      <img
                        src={course.image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-black/25 to-transparent" />
                      <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-[#FFC629]/40 text-[#FFC629] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        30 {isMr ? 'दिवस' : 'Days'}
                      </div>
                    </div>

                    {/* Course Body */}
                    <div className="p-6">
                      <h3 className="font-['Cinzel'] text-lg font-bold text-white group-hover:text-[#FFC629] transition-colors mb-2.5 line-clamp-1">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed line-clamp-3 mb-4">
                        {shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-6 pt-0">
                    <Link
                      to="/courses"
                      className="inline-flex items-center justify-between w-full text-xs sm:text-sm font-bold text-[#FFC629] hover:text-[#FFE25C] pt-3 border-t border-[#222222] transition-colors"
                    >
                      <span>{isMr ? 'अधिक जाणून घ्या' : 'Explore Course'}</span>
                      <BiRightArrowAlt className="text-lg transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-[#FFC629] text-white px-8 py-3.5 text-sm font-semibold transition-all duration-200"
            >
              <span>{isMr ? 'माहितीपत्रकातील सर्व १० कोर्सेस पहा' : 'View All 10 Brochure Courses'}</span>
              <BiRightArrowAlt className="text-lg text-[#FFC629]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Features & Institute Capabilities (Full Width 3-Column Grid) ── */}
      <section className="home-section-spacer bg-[#0B0B0B]">
        <div className="home-wrapper-full">
          <div className="home-header-spacing">
            <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#FFC629] bg-[#FFC629]/10 border border-[#FFC629]/25 px-4 py-1.5 rounded-full mb-3.5">
              {isMr ? 'प्रणाली वैशिष्ट्ये' : 'Core Capabilities'}
            </span>
            <h2 className="font-['Cinzel'] text-2xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'परिपूर्ण शैक्षणिक व्यवस्थापन साधने' : 'Built for Modern Educational Excellence'}
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed max-w-xl mx-auto">
              {isMr
                ? 'फोटोग्राफी इन्स्टिट्यूटच्या दैनंदिन कामकाजासाठी आवश्यक असणारी सर्व अद्ययावत व सुरक्षित साधने.'
                : 'Every tool required to streamline practical sessions, student attendance, fees, and masterclasses.'}
            </p>
          </div>

          <div className="home-features-grid">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="home-card-standalone group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-13 h-13 rounded-2xl bg-[#FFC629]/10 group-hover:bg-[#FFC629]/20 border border-[#FFC629]/20 flex items-center justify-center text-[#FFC629] text-2xl transition-all duration-300 group-hover:scale-105">
                        <Icon />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#FFC629]/70 tracking-widest">
                        {feat.num}
                      </span>
                    </div>

                    <h3 className="font-['Cinzel'] text-lg sm:text-xl font-bold text-white group-hover:text-[#FFC629] transition-colors mb-3">
                      {isMr ? feat.titleMr : feat.titleEn}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#8E8E93]">
                      {isMr ? feat.descMr : feat.descEn}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#1F1F1F] flex items-center gap-2 text-xs font-semibold text-[#666666] group-hover:text-[#FFC629] transition-colors">
                    <span>{isMr ? 'तपशीलवार माहिती' : 'Integrated Module'}</span>
                    <BiRightArrowAlt className="text-base transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. World-Class Infrastructure Preview (Full Width 3-Column Grid) ── */}
      <section className="home-section-spacer bg-[#090909]">
        <div className="home-wrapper-full">
          <div className="home-header-spacing">
            <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#FFC629] bg-[#FFC629]/10 border border-[#FFC629]/25 px-4 py-1.5 rounded-full mb-3.5">
              {isMr ? 'पायाभूत सुविधा' : 'Creative Infrastructure'}
            </span>
            <h2 className="font-['Cinzel'] text-2xl sm:text-4xl font-bold text-white mb-4">
              {isMr ? 'कलाकारांसाठी दर्जेदार सुविधा' : 'World-Class Studio & Lab Facilities'}
            </h2>
            <p className="text-sm sm:text-base text-[#8E8E93] leading-relaxed max-w-xl mx-auto">
              {isMr
                ? 'गोडॉक्स लायटिंग स्टुडिओ, स्वतंत्र एडिटिंग वर्कस्टेशन्स आणि भव्य स्क्रीनिंग हॉल.'
                : 'Fully equipped professional indoor shooting studios, computer suites, and lecture halls.'}
            </p>
          </div>

          <div className="home-facilities-grid">
            {previewFacilities.map((fac, idx) => {
              const title = isMr ? fac.titleMr : fac.title;
              const desc = isMr ? fac.descriptionMr : fac.description;
              const tag = isMr ? fac.tagMr : fac.tag;

              return (
                <div
                  key={idx}
                  className="home-card-standalone group p-0 overflow-hidden flex flex-col justify-between"
                  style={{ padding: 0 }}
                >
                  <div>
                    <div className="relative h-56 w-full overflow-hidden bg-[#1A1A1A]">
                      <img
                        src={fac.image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-black/25 to-transparent" />
                      <span className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-[#FFC629]/30 text-[#FFC629] text-[11px] font-semibold px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="font-['Cinzel'] text-lg sm:text-xl font-bold text-white group-hover:text-[#FFC629] transition-colors mb-3">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed line-clamp-3">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      to="/facilities"
                      className="inline-flex items-center justify-between w-full text-xs sm:text-sm font-bold text-[#FFC629] hover:text-[#FFE25C] pt-3 border-t border-[#222222] transition-colors"
                    >
                      <span>{isMr ? 'सुविधेची माहिती पहा' : 'Explore Facility'}</span>
                      <BiRightArrowAlt className="text-lg transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/facilities"
              className="inline-flex items-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-[#FFC629] text-white px-8 py-3.5 text-sm font-semibold transition-all duration-200"
            >
              <span>{isMr ? 'सर्व ८ इन्स्टिट्यूट सुविधा पहा' : 'Explore All Campus Facilities'}</span>
              <BiRightArrowAlt className="text-lg text-[#FFC629]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Inspiring Quote Banner (Full Width Centered) ── */}
      <section className="home-section-spacer bg-[#0A0A0A]">
        <div className="home-wrapper-full">
          <div className="home-quote-card">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 flex justify-center">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#FFC629]/40 shadow-xl shadow-[#FFC629]/10">
                  <img
                    src="/images/quote-tushar.jpg"
                    alt="Tushar Pulate"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>
              <div className="md:col-span-8 text-center md:text-left">
                <div className="text-[#FFC629] text-4xl sm:text-5xl font-serif mb-2 leading-none">“</div>
                <blockquote className="font-['Cinzel'] text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug mb-4">
                  {isMr 
                    ? 'कला कोणतीही असो जीव ओतून काम केल्याशिवाय कलाकार घडत नसतो..!' 
                    : '“Whatever the art may be, an artist is never forged without pouring their very soul into the craft..!”'}
                </blockquote>
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3">
                  <span className="text-base font-bold text-[#FFC629]">
                    {instituteDetails.founder}
                  </span>
                  <span className="text-xs sm:text-sm text-[#888888]">
                    {isMr ? 'संस्थापक आणि मुख्य मार्गदर्शक' : 'Founder & Lead Instructor, Ayushyachi Photography'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. High-Impact Closing CTA (Full Width Centered) ── */}
      <section className="home-section-spacer bg-[#090909]">
        <div className="home-wrapper-full">
          <div className="home-cta-card">
            <div className="home-cta-inner">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FFC629]/15 border border-[#FFC629]/30 flex items-center justify-center mx-auto mb-6 sm:mb-8 text-[#FFC629] text-3xl sm:text-4xl shadow-inner">
                <BiCamera />
              </div>

              <h2 className="font-['Cinzel'] text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 leading-tight text-center">
                {isMr ? 'आपला सर्जनशील प्रवास आजच सुरू करा' : 'Start Your Creative Journey Today'}
              </h2>

              <p className="text-sm sm:text-base text-[#A0A0A0] max-w-xl mx-auto mb-10 leading-relaxed text-center">
                {isMr
                  ? 'तुषार पुलाटे इन्स्टिट्यूटच्या आगामी बॅचमध्ये प्रवेश निश्चित करा किंवा आपल्या संस्थेच्या व्यवस्थापनासाठी पोर्टलमध्ये प्रवेश करा.'
                  : 'Sign in to access your customized academic dashboard, or get in touch for upcoming offline batch admissions.'}
              </p>

              <div className="home-cta-buttons">
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#FFC629] hover:bg-[#E0AC1B] text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#FFC629]/25 hover:-translate-y-0.5"
                >
                  <BiLogInCircle className="text-xl" />
                  <span>{isMr ? 'आताच लॉगिन करा' : 'Sign In to Portal'}</span>
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 border border-[#333333] hover:border-[#FFC629] bg-[#141414] hover:bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200"
                >
                  <BiPhoneCall className="text-xl text-[#FFC629]" />
                  <span>{isMr ? 'प्रवेश चौकशी व संपर्क' : 'Admission Enquiry'}</span>
                </Link>
              </div>

              {/* Quick Contact Chips */}
              <div className="home-cta-chips">
                <span className="inline-flex items-center gap-1.5">
                  <BiMapPin className="text-[#FFC629]" />
                  <span>Charholi Budruk, Pune</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BiPhoneCall className="text-[#FFC629]" />
                  <span>+91 84599 12189</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
