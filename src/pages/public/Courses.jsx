import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CreditCard, Bookmark, AlertCircle, Search, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { coursesData } from '../../data/photographyData';
import CourseCard from '../../components/photography/CourseCard';

const Courses = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = coursesData.filter((course) => {
    const title = language === 'mr' ? course.titleMr : course.title;
    const desc = language === 'mr' ? course.shortDescMr : course.shortDesc;
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  });

  return (
    <div className="page-courses">
      {/* ── Hero Section ── */}
      <section className="courses-hero-section">
        <div className="courses-hero-bg">
          <img
            src="/images/gallery-theory-aperture.png"
            alt="Courses at Tushar Pulate Institute"
            className="courses-hero-bg-img"
          />
          <div className="courses-hero-overlay" />
        </div>

        <div className="container courses-hero-container">
          <motion.div
            className="courses-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="section-eyebrow">{t.courses.hero.eyebrow}</span>
            <h1 className="courses-hero-title">{t.courses.hero.title}</h1>
            <p className="courses-hero-subtitle">{t.courses.hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Overview Banner ── */}
      <section className="course-pricing-banner-section">
        <div className="container">
          <motion.div
            className="pricing-overview-card"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="pricing-grid">
              <div className="pricing-block">
                <div className="pricing-icon-box">
                  <Clock size={24} color="#FFC629" />
                </div>
                <div>
                  <span className="p-block-label">{t.courses.banner.durationLabel}</span>
                  <span className="p-block-val">{t.courses.banner.durationVal}</span>
                  <span className="p-block-note">{t.courses.banner.durationNote}</span>
                </div>
              </div>

              <div className="pricing-block">
                <div className="pricing-icon-box">
                  <CreditCard size={24} color="#FFC629" />
                </div>
                <div>
                  <span className="p-block-label">{t.courses.banner.feeLabel}</span>
                  <span className="p-block-val text-gold">{t.courses.banner.feeVal}</span>
                  <span className="p-block-note">{t.courses.banner.feeNote}</span>
                </div>
              </div>

              <div className="pricing-block">
                <div className="pricing-icon-box">
                  <Bookmark size={24} color="#FFC629" />
                </div>
                <div>
                  <span className="p-block-label">{t.courses.banner.bookingLabel}</span>
                  <span className="p-block-val">{t.courses.banner.bookingVal}</span>
                  <span className="p-block-note">{t.courses.banner.bookingNote}</span>
                </div>
              </div>
            </div>

            <div className="pricing-notice-bar">
              <AlertCircle size={16} className="notice-icon" />
              <span>{t.courses.banner.importantNotice}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Course Catalogue Grid ── */}
      <section className="section">
        <div className="container">
          <div className="catalogue-toolbar">
            <span className="courses-count-pill">
              <Star size={14} />
              <span>{t.courses.allCoursesCount}</span>
            </span>

            <div className="course-search-box">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder={t.courses.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="course-search-input"
                aria-label="Search courses"
              />
            </div>
          </div>

          <div className="courses-catalogue-grid">
            {filteredCourses.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="courses-empty-state">
              <p>
                {language === 'mr'
                  ? 'कोणताही कोर्स सापडला नाही.'
                  : 'No courses match your search criteria.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section section-darker">
        <div className="container">
          <div className="cta-cinematic-banner">
            <div className="cta-content">
              <span className="section-eyebrow">
                {language === 'mr' ? 'अनामत सीट बुकिंग' : 'Reserve Your Seat'}
              </span>
              <h2 className="cta-headline">
                {language === 'mr' ? 'मर्यादित जागा उपलब्ध आहेत' : 'Limited Seats Per Batch'}
              </h2>
              <p className="cta-subheadline">
                {language === 'mr'
                  ? 'प्रत्येक विद्यार्थ्याला वैयक्तिक लक्ष व प्रत्यक्ष कॅमेरा प्रॅक्टिस मिळण्यासाठी बॅचमधील जागा मर्यादित असतात. आजच ₹५,००० भरून आपली सीट आरक्षित करा.'
                  : 'To ensure hands-on camera access, personalized attention, and dedicated editing workstations, batch seats are kept strictly limited. Reserve your seat today with ₹5,000.'}
              </p>
              <div className="cta-btn-row">
                <Link to="/contact" className="btn btn-primary">
                  <span>
                    {language === 'mr' ? 'सीट बुकिंगसाठी संपर्क करा' : 'Enquire & Book Seat'}
                  </span>
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
