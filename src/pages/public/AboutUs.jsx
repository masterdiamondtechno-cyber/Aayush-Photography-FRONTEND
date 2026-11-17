import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Award, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { instituteDetails, founderDetails } from '../../data/photographyData';
import BrandLogo from '../../components/photography/BrandLogo';

const AboutUs = () => {
  const { t, language } = useLanguage();

  return (
    <div className="page-about">
      {/* ── Hero Section ── */}
      <section className="about-hero-section">
        <div className="about-hero-bg">
          <img
            src="/images/about-banner.png"
            alt="Tushar Pulate Institute of Photography & Film Making"
            className="about-hero-bg-img"
          />
          <div className="about-hero-overlay" />
        </div>

        <div className="container about-hero-container">
          <motion.div
            className="about-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="mb-4 flex justify-center">
              <BrandLogo size="lg" animated={true} />
            </div>
            <span className="section-eyebrow">{t.about.hero.eyebrow}</span>
            <h1 className="about-hero-title">{t.about.hero.title}</h1>
            <p className="about-hero-subtitle">{t.about.hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Intro & Positioning ── */}
      <section className="section section-darker">
        <div className="container">
          <div className="about-intro-grid">
            <motion.div
              className="about-intro-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-eyebrow">{t.about.intro.eyebrow}</span>
              <h2 className="section-title text-left">{t.about.intro.title}</h2>
              <div className="gold-divider left-aligned" />
              <p className="about-paragraph">{t.about.intro.desc1}</p>
              <p className="about-paragraph">{t.about.intro.desc2}</p>

              <div className="positioning-card">
                <span className="pos-badge">
                  <Star size={14} />
                  <span>{language === 'mr' ? 'उद्दिष्ट व ध्येय' : 'Core Vision'}</span>
                </span>
                <h3 className="pos-title">{t.about.positioning.title}</h3>
                <h4 className="pos-sub">{t.about.positioning.subtitle}</h4>
                <p className="pos-desc">{t.about.positioning.desc}</p>
              </div>
            </motion.div>

            <motion.div
              className="about-intro-visual card-zoom-container camera-crosshair"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <img
                src="/images/gallery-classroom-interactive.png"
                alt="Students learning at Tushar Pulate Institute"
                className="about-intro-img card-zoom-img"
              />
              <div className="about-visual-overlay">
                <span className="badge-gold">
                  {language === 'mr'
                    ? '३० दिवस सखोल प्रात्यक्षिक'
                    : '30-Day Practical Intensive'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Video Showcase Section ── */}
      <section className="section about-video-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">
              {t.about.videoShowcase?.eyebrow || 'Discover Our Institute'}
            </span>
            <h2 className="section-title">
              {t.about.videoShowcase?.title || 'Inside आयुष्याची फोटोग्राफी'}
            </h2>
            <p className="section-subtitle">
              {t.about.videoShowcase?.desc ||
                'Take an inside look at our institute through this introduction video, showcasing our courses, professional studio, editing labs, practical training, facilities, and overall learning experience.'}
            </p>
            <div className="gold-divider" />
          </div>

          <motion.div
            className="about-video-card-container"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="about-video-frame">
              <div className="about-video-glow-effect" />
              <div className="about-video-inner">
                <video
                  src={founderDetails.aboutVideo}
                  controls
                  playsInline
                  preload="metadata"
                  className="about-portrait-video"
                >
                  <source src={founderDetails.aboutVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Meet the Founder Section ── */}
      <section className="section section-founder">
        <div className="container">
          <div className="founder-grid">
            <motion.div
              className="founder-img-col card-zoom-container camera-crosshair"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="/images/tushar-instructor.jpg"
                alt="Tushar Pulate - Founder & Instructor"
                className="founder-img card-zoom-img"
              />
              <div className="founder-tagline-chip">
                <span>{instituteDetails.tagline}</span>
              </div>
            </motion.div>

            <motion.div
              className="founder-content-col"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-eyebrow">{t.about.founder.eyebrow}</span>
              <h2 className="founder-name">{t.about.founder.name}</h2>
              <span className="founder-role">{t.about.founder.role}</span>
              <div className="gold-divider left-aligned" />
              <p className="founder-bio">{t.about.founder.bio1}</p>
              <p className="founder-bio">{t.about.founder.bio2}</p>

              <div className="founder-quote-banner">
                <p className="fq-quote">
                  “कला कोणतीही असो जीव ओतून काम केल्याशिवाय कलाकार घडत नसतो..!”
                </p>
                <span className="fq-sig">— {instituteDetails.founder}</span>
              </div>

              <div className="founder-action-wrap">
                <Link to="/contact" className="btn btn-primary">
                  <span>{t.about.founder.enquireBtn}</span>
                  <ArrowRight size={17} />
                </Link>
                <a
                  href={instituteDetails.socials.instagramFounder.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <span>Instagram: {instituteDetails.socials.instagramFounder.handle}</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Quality Certification Banner ── */}
      <section className="section section-darker">
        <div className="container">
          <motion.div
            className="certification-banner"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="cert-left">
              <div className="cert-badge-box">
                <ShieldCheck size={36} color="#FFC629" />
              </div>
              <div className="cert-text-info">
                <span className="section-eyebrow">{t.about.certification.eyebrow}</span>
                <h3 className="cert-title">{t.about.certification.title}</h3>
                <p className="cert-desc">{t.about.certification.desc}</p>
                <p className="cert-disclaimer">{t.about.certification.disclaimer}</p>
              </div>
            </div>
            <div className="cert-visual-card">
              <img
                src="/images/about-banner.png"
                alt="ISO 9001:2015 and IAF certification on brochure"
                className="cert-brochure-preview"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 7-Pillar Framework Section ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">{t.about.learningApproach.eyebrow}</span>
            <h2 className="section-title">{t.about.learningApproach.title}</h2>
            <p className="section-subtitle">{t.about.learningApproach.subtitle}</p>
            <div className="gold-divider" />
          </div>

          <div className="pillars-grid">
            {t.about.learningApproach.pillars.map((pillar, i) => (
              <motion.div
                key={i}
                className="pillar-card"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <div className="pillar-num-badge">0{i + 1}</div>
                <div className="pillar-card-content">
                  <h3 className="pillar-card-title">{pillar.title}</h3>
                  <p className="pillar-card-desc">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section section-cta">
        <div className="container">
          <div className="cta-cinematic-banner">
            <div className="cta-content">
              <span className="section-eyebrow">
                {language === 'mr' ? 'प्रवेशाची पहिली पायरी' : 'Take The First Step'}
              </span>
              <h2 className="cta-headline">{t.about.cta.title}</h2>
              <p className="cta-subheadline">{t.about.cta.subtitle}</p>
              <div className="cta-btn-row">
                <Link to="/contact" className="btn btn-primary">
                  <span>{t.about.cta.btn}</span>
                  <ArrowRight size={17} />
                </Link>
                <Link to="/courses" className="btn btn-secondary">
                  <span>{language === 'mr' ? 'कोर्सेस पहा' : 'Explore Courses'}</span>
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

export default AboutUs;
