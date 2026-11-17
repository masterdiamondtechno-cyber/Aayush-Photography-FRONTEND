import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, Info, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import CourseModal from './CourseModal';

const CourseCard = ({ course, index = 0 }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { language, t } = useLanguage();

  const title = language === 'mr' ? course.titleMr : course.title;
  const shortDesc = language === 'mr' ? course.shortDescMr : course.shortDesc;
  const topics = language === 'mr' ? course.topicsMr : course.topics;

  return (
    <>
      <motion.article
        className="course-card"
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.45, delay: (index % 3) * 0.1 }}
      >
        <div className="course-card-top card-zoom-container">
          <img
            src={course.image}
            alt={title}
            className="course-card-img card-zoom-img"
            loading="lazy"
          />
          <div className="course-img-gradient" />
          {course.featured && (
            <span className="course-featured-badge">
              <Star size={13} />
              <span>{language === 'mr' ? 'प्रमुख कोर्स' : 'Core Module'}</span>
            </span>
          )}
          <div className="course-duration-chip">
            <span>30 {language === 'mr' ? 'दिवस' : 'Days'}</span>
          </div>
        </div>

        <div className="course-card-body">
          <h3 className="course-card-title">{title}</h3>
          <p className="course-card-desc">{shortDesc}</p>

          <div className="course-topics-preview">
            <span className="topics-preview-label">
              {language === 'mr' ? 'प्रमुख घटक:' : 'Key Skills:'}
            </span>
            <ul className="topics-mini-list">
              {topics.slice(0, 3).map((topic, i) => (
                <li key={i} className="topic-mini-item">
                  <Check size={13} className="check-gold" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="course-card-actions">
            <button
              type="button"
              className="btn-card-details"
              onClick={() => setModalOpen(true)}
              aria-label={`View details for ${title}`}
            >
              <Info size={15} />
              <span>{t.courses.viewDetails}</span>
            </button>
            <Link
              to={`/contact?course=${course.id}`}
              className="btn btn-primary btn-sm course-card-enquire"
            >
              <span>{t.courses.enquireNow}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </motion.article>

      <CourseModal
        course={course}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default CourseCard;
