import React from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { facilitiesData, instituteDetails } from '../../data/photographyData';

const FacilityCard = ({ facility, index = 0 }) => {
  const { language, t } = useLanguage();
  const isEven = index % 2 === 0;

  const title = language === 'mr' ? facility.titleMr : facility.title;
  const tag = language === 'mr' ? facility.tagMr : facility.tag;
  const desc = language === 'mr' ? facility.descriptionMr : facility.description;
  const features = language === 'mr' ? facility.featuresMr : facility.features;

  return (
    <motion.article
      className={`facility-card ${isEven ? 'layout-normal' : 'layout-reverse'}`}
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="facility-img-col card-zoom-container camera-crosshair">
        <img
          src={facility.image}
          alt={title}
          className="facility-img card-zoom-img"
          loading="lazy"
        />
        <div className="facility-img-overlay">
          <span className="facility-counter">0{index + 1}</span>
        </div>
      </div>

      <div className="facility-content-col">
        <div className="facility-tag-wrap">
          <span className="badge-gold">
            <Star size={12} />
            <span>{tag}</span>
          </span>
        </div>
        <h3 className="facility-title">{title}</h3>
        <p className="facility-desc">{desc}</p>

        <div className="facility-features-box">
          <h4 className="features-subhead">{t.facilities.featuresTitle}</h4>
          <ul className="features-checklist">
            {features.map((feature, i) => (
              <li key={i}>
                <CheckCircle size={15} className="feat-icon" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  );
};

const Facilities = () => {
  const { t, language } = useLanguage();

  return (
    <div className="page-facilities">
      {/* ── Hero Section ── */}
      <section className="facilities-hero-section">
        <div className="facilities-hero-bg">
          <img
            src="/images/studio.jpg"
            alt="Shooting Studio at आयुष्याची फोटोग्राफी"
            className="facilities-hero-bg-img"
          />
          <div className="facilities-hero-overlay" />
        </div>

        <div className="container facilities-hero-container">
          <motion.div
            className="facilities-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="section-eyebrow">{t.facilities.hero.eyebrow}</span>
            <h1 className="facilities-hero-title">{t.facilities.hero.title}</h1>
            <p className="facilities-hero-subtitle">{t.facilities.hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Facilities List Section ── */}
      <section className="section">
        <div className="container">
          <div className="facilities-list-wrap">
            {facilitiesData.map((facility, i) => (
              <FacilityCard key={facility.id} facility={facility} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Campus Visit Section ── */}
      <section className="section section-darker">
        <div className="container">
          <div className="cta-cinematic-banner">
            <div className="cta-content">
              <span className="section-eyebrow">
                {language === 'mr' ? 'कॅम्पस भेट' : 'Campus Visit'}
              </span>
              <h2 className="cta-headline">{t.facilities.enquireCta.title}</h2>
              <p className="cta-subheadline">{t.facilities.enquireCta.subtitle}</p>

              <div className="campus-address-chip">
                <MapPin size={16} className="text-gold" />
                <span>
                  {language === 'mr'
                    ? instituteDetails.addressMarathi
                    : instituteDetails.address}
                </span>
              </div>

              <div className="cta-btn-row" style={{ marginTop: '1.75rem' }}>
                <Link to="/contact" className="btn btn-primary">
                  <span>{t.facilities.enquireCta.btn}</span>
                  <ArrowRight size={17} />
                </Link>
                <a
                  href={instituteDetails.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <span>
                    {language === 'mr' ? 'मॅपवर लोकेशन पहा' : 'View on Google Maps'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Facilities;
