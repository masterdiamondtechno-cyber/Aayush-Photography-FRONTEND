import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Star, Compass, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { galleryVideos } from '../../data/photographyData';

const iconMap = {
  cinematic: Video,
  memories: Star,
  drone: Compass,
  studentResult: Award
};

const Gallery = () => {
  const { t, language } = useLanguage();

  return (
    <div className="page-gallery">
      {/* ── Hero Section ── */}
      <section className="gallery-hero-section">
        <div className="gallery-hero-bg">
          <img
            src="/images/gallery-outdoor-batch.png"
            alt="Photography Gallery at आयुष्याची फोटोग्राफी"
            className="gallery-hero-bg-img"
          />
          <div className="gallery-hero-overlay" />
        </div>

        <div className="container gallery-hero-container">
          <motion.div
            className="gallery-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="section-eyebrow">{t.gallery.hero.eyebrow}</span>
            <h1 className="gallery-hero-title">{t.gallery.hero.title}</h1>
            <p className="gallery-hero-subtitle">{t.gallery.hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Videos Grid Section ── */}
      <section className="section gallery-videos-section">
        <div className="container">
          <div className="gallery-video-grid">
            {galleryVideos.map((video, idx) => {
              const IconComp = iconMap[video.id] || Video;
              const tag = language === 'mr' ? video.tagMr : video.tag;
              const title = language === 'mr' ? video.titleMr : video.title;
              const desc = language === 'mr' ? video.descMr : video.desc;

              return (
                <motion.div
                  key={video.id}
                  className="gallery-video-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <div className="video-card-frame">
                    <div className="video-viewport">
                      <video
                        src={video.src}
                        controls
                        playsInline
                        preload="metadata"
                        className="gallery-video-player"
                      >
                        <source src={video.src} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <div className="video-card-info">
                      <div className="video-card-meta">
                        <span className="video-tag-badge">
                          <IconComp size={13} className="gold-icon" />
                          <span>{tag}</span>
                        </span>
                        <span className="video-format-pill">{video.ratioBadge}</span>
                      </div>
                      <h3 className="video-card-title">{title}</h3>
                      <p className="video-card-desc">{desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section section-darker">
        <div className="container">
          <div className="cta-cinematic-banner">
            <div className="cta-content">
              <span className="section-eyebrow">
                {language === 'mr' ? 'आपली कला विकसित करा' : 'Be Part Of Our Next Batch'}
              </span>
              <h2 className="cta-headline">
                {language === 'mr'
                  ? 'पुढील बॅचमध्ये आपले स्थान निश्चित करा'
                  : 'Create Memories Like These'}
              </h2>
              <p className="cta-subheadline">
                {language === 'mr'
                  ? 'प्रत्यक्ष कॅमेरा अनुभव, आउटडोअर सेशन्स आणि तज्ज्ञांचे मार्गदर्शन मिळवण्यासाठी आजच संपर्क साधा.'
                  : 'Experience real field shoots, studio lighting masterclasses, and hands-on guidance from industry veteran Tushar Pulate.'}
              </p>
              <div className="cta-btn-row">
                <Link to="/contact" className="btn btn-primary">
                  <span>
                    {language === 'mr' ? 'प्रवेशासाठी संपर्क करा' : 'Enquire for Next Batch'}
                  </span>
                  <ArrowRight size={17} />
                </Link>
                <Link to="/courses" className="btn btn-secondary">
                  <span>
                    {language === 'mr' ? 'कोर्सेस पहा' : 'View Course Curriculum'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
