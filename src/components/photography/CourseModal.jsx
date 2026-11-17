import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { instituteDetails } from '../../data/photographyData';

const CourseModal = ({ course, isOpen, onClose }) => {
  const { language, t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!course) return null;

  const title = language === 'mr' ? course.titleMr : course.title;
  const fullDesc = language === 'mr' ? course.fullDescMr : course.fullDesc;
  const topics = language === 'mr' ? course.topicsMr : course.topics;
  const highlights = language === 'mr' ? course.highlightsMr : course.highlights;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="course-modal-backdrop"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="course-modal-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <div className="modal-header">
              <div className="modal-header-info">
                <span className="badge-gold">
                  {instituteDetails.duration}{' '}
                  {language === 'mr' ? 'अभ्यासक्रम' : 'Course Module'}
                </span>
                <h3 className="modal-course-title">{title}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label={t.courses.modalClose}
              >
                <X size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-img-wrap">
                <img src={course.image} alt={title} className="modal-img" />
                <div className="modal-img-overlay">
                  <span className="modal-badge-inst">आयुष्याची फोटोग्राफी</span>
                </div>
              </div>

              <div className="modal-content-grid">
                <div>
                  <h4 className="modal-sec-title">
                    {language === 'mr' ? 'कोर्सचा सारांश' : 'Course Overview'}
                  </h4>
                  <p className="modal-desc-text">{fullDesc}</p>

                  <h4 className="modal-sec-title" style={{ marginTop: '1.5rem' }}>
                    {t.courses.topicsTitle}
                  </h4>
                  <ul className="modal-topics-list">
                    {topics.map((topic, i) => (
                      <li key={i} className="topic-item">
                        <CheckCircle size={16} className="topic-icon" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="modal-sidebar-card">
                  <h4 className="modal-sec-title">{t.courses.highlightsTitle}</h4>
                  <ul className="modal-highlights-list">
                    {highlights.map((hl, i) => (
                      <li key={i}>
                        <span className="hl-bullet" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="modal-pricing-box">
                    <div className="pricing-row">
                      <span className="p-label">
                        {language === 'mr' ? 'कोर्स फी:' : 'Full Course Fee:'}
                      </span>
                      <span className="p-val">{instituteDetails.courseFee}</span>
                    </div>
                    <div className="pricing-row">
                      <span className="p-label">
                        {language === 'mr' ? 'सीट बुकिंग:' : 'Booking Deposit:'}
                      </span>
                      <span className="p-val-sub">{instituteDetails.seatBooking}</span>
                    </div>
                    <p className="p-note">
                      {language === 'mr'
                        ? instituteDetails.seatBookingNoteMarathi
                        : instituteDetails.seatBookingNote}
                    </p>
                  </div>

                  <Link
                    to={`/contact?course=${course.id}`}
                    className="btn btn-primary btn-block modal-enquire-btn"
                    onClick={onClose}
                  >
                    <span>{t.courses.enquireNow}</span>
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CourseModal;
