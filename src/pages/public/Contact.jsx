import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, MapPin, Send, CheckCircle2, MessageCircle, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { coursesData, instituteDetails } from '../../data/photographyData';
import { WhatsAppIcon } from '../../components/photography/SocialIcons';

const Contact = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    const courseParam = searchParams.get('course');
    if (courseParam) {
      const match = coursesData.find((c) => c.id === courseParam);
      if (match) {
        setFormData((prev) => ({ ...prev, course: match.id }));
      }
    }
  }, [searchParams]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = t.contact.form.errors.nameRequired;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      errs.phone = t.contact.form.errors.phoneRequired;
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = t.contact.form.errors.phoneInvalid;
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      errs.email = t.contact.form.errors.emailInvalid;
    }

    if (!formData.course) {
      errs.course = t.contact.form.errors.courseRequired;
    }

    if (!formData.message.trim()) {
      errs.message = t.contact.form.errors.messageRequired;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCourseObj = coursesData.find((c) => c.id === formData.course);
    const courseTitle = selectedCourseObj
      ? language === 'mr'
        ? selectedCourseObj.titleMr
        : selectedCourseObj.title
      : formData.course === 'all'
      ? language === 'mr'
        ? 'संपूर्ण ३० दिवसांचा मास्टर कोर्स'
        : 'Complete 30-Day Master Course'
      : formData.course;

    const lines = [
      language === 'mr'
        ? '*नवीन प्रवेश चौकशी - आयुष्याची फोटोग्राफी*'
        : '*New Admission Enquiry - Tushar Pulate Institute*',
      '---------------------------------',
      `👤 *Name:* ${formData.name}`,
      `📞 *Mobile:* ${formData.phone}`,
      formData.email.trim() ? `✉️ *Email:* ${formData.email}` : null,
      `🎓 *Selected Course:* ${courseTitle}`,
      `📝 *Message / Query:* ${formData.message}`,
      '---------------------------------',
      '_Sent from ayushyachiphotography.com_'
    ].filter(Boolean);

    const fullMsg = lines.join('\n');
    const waUrl = `https://wa.me/${instituteDetails.whatsappNumber}?text=${encodeURIComponent(
      fullMsg
    )}`;

    setGeneratedLink(waUrl);
    setSubmitted(true);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: '', phone: '', email: '', course: '', message: '' });
    setErrors({});
  };

  return (
    <div className="page-contact">
      {/* ── Hero Section ── */}
      <section className="contact-hero-section">
        <div className="contact-hero-bg">
          <img
            src="/images/quote-tushar.jpg"
            alt="Contact आयुष्याची फोटोग्राफी"
            className="contact-hero-bg-img"
          />
          <div className="contact-hero-overlay" />
        </div>

        <div className="container contact-hero-container">
          <motion.div
            className="contact-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="section-eyebrow">{t.contact.hero.eyebrow}</span>
            <h1 className="contact-hero-title">{t.contact.hero.title}</h1>
            <p className="contact-hero-subtitle">{t.contact.hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Main Contact Form & Details Section ── */}
      <section className="section">
        <div className="container">
          <div className="contact-layout-grid">
            {/* Form Column */}
            <motion.div
              className="contact-form-card"
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <h2 className="form-card-title">{t.contact.form.title}</h2>
              <p className="form-card-subtitle">{t.contact.form.subtitle}</p>

              {submitted ? (
                <div className="form-success-box">
                  <CheckCircle2 size={44} color="#FFC629" className="success-icon" />
                  <h3 className="success-heading">{t.contact.form.successTitle}</h3>
                  <p className="success-desc">{t.contact.form.successDesc}</p>
                  {generatedLink && (
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-block"
                      style={{ marginTop: '1.25rem', gap: '0.6rem' }}
                    >
                      <WhatsAppIcon size={22} />
                      <span>{t.contact.form.openWhatsAppBtn}</span>
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={handleReset}
                    style={{ marginTop: '0.85rem' }}
                  >
                    <span>
                      {language === 'mr' ? 'नवीन अर्ज भरा' : 'Submit Another Enquiry'}
                    </span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="admission-form">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      {t.contact.form.nameLabel}
                    </label>
                    <input
                      type="text"
                      id="name"
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                      placeholder={t.contact.form.namePlaceholder}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        {t.contact.form.phoneLabel}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className={`form-input ${errors.phone ? 'input-error' : ''}`}
                        placeholder={t.contact.form.phonePlaceholder}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                      {errors.phone && (
                        <span className="error-text">{errors.phone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        {t.contact.form.emailLabel}
                      </label>
                      <input
                        type="email"
                        id="email"
                        className={`form-input ${errors.email ? 'input-error' : ''}`}
                        placeholder={t.contact.form.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                      {errors.email && (
                        <span className="error-text">{errors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="course" className="form-label">
                      {t.contact.form.courseLabel}
                    </label>
                    <select
                      id="course"
                      className={`form-select ${errors.course ? 'input-error' : ''}`}
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                      required
                    >
                      <option value="">-- {t.contact.form.courseDefault} --</option>
                      <option value="all">{t.contact.form.allCoursesOption}</option>
                      {coursesData.map((course) => (
                        <option key={course.id} value={course.id}>
                          {language === 'mr' ? course.titleMr : course.title}
                        </option>
                      ))}
                    </select>
                    {errors.course && (
                      <span className="error-text">{errors.course}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      {t.contact.form.messageLabel}
                    </label>
                    <textarea
                      id="message"
                      rows="3"
                      className={`form-textarea ${errors.message ? 'input-error' : ''}`}
                      placeholder={t.contact.form.messagePlaceholder}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />
                    {errors.message && (
                      <span className="error-text">{errors.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block submit-btn"
                  >
                    <Send size={17} />
                    <span>{t.contact.form.submitBtn}</span>
                  </button>

                  <p className="form-disclaimer-note">
                    {t.contact.form.whatsappNotice}
                  </p>
                </form>
              )}
            </motion.div>

            {/* Info Column */}
            <motion.div
              className="contact-info-col"
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="contact-info-card">
                <span className="section-eyebrow">{t.contact.info.title}</span>
                <h3 className="institute-official-name">{instituteDetails.name}</h3>
                <span className="institute-official-brand">
                  {instituteDetails.nameMarathi}
                </span>

                <div className="contact-details-list">
                  <div className="c-detail-item">
                    <div className="c-detail-icon-box">
                      <Phone size={20} color="#FFC629" />
                    </div>
                    <div>
                      <span className="c-detail-label">{t.contact.info.phoneTitle}</span>
                      <a
                        href={`tel:${instituteDetails.phone.replace(/[^0-9+]/g, '')}`}
                        className="c-detail-val link-gold"
                      >
                        {instituteDetails.phone}
                      </a>
                    </div>
                  </div>

                  <div className="c-detail-item">
                    <div
                      className="c-detail-icon-box"
                      style={{
                        background: 'rgba(37, 211, 102, 0.12)',
                        borderColor: 'rgba(37, 211, 102, 0.4)'
                      }}
                    >
                      <WhatsAppIcon size={24} />
                    </div>
                    <div>
                      <span className="c-detail-label">WhatsApp Helpline</span>
                      <a
                        href={`https://wa.me/${instituteDetails.whatsappNumber}?text=${encodeURIComponent(
                          language === 'mr'
                            ? 'नमस्कार, मला आयुष्याची फोटोग्राफी इन्स्टिट्यूटच्या ऍडमिशन बद्दल माहिती हवी आहे.'
                            : 'Hello, I want to enquire about admission at Tushar Pulate Institute.'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="c-detail-val"
                        style={{ color: '#25D366', fontWeight: 600 }}
                      >
                        +91 84599 12189 (Chat Directly on WhatsApp)
                      </a>
                    </div>
                  </div>

                  <div className="c-detail-item">
                    <div className="c-detail-icon-box">
                      <MapPin size={20} color="#FFC629" />
                    </div>
                    <div>
                      <span className="c-detail-label">{t.contact.info.addressTitle}</span>
                      <p className="c-detail-val">
                        {language === 'mr'
                          ? instituteDetails.addressMarathi
                          : instituteDetails.address}
                      </p>
                      <a
                        href={instituteDetails.mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-link"
                      >
                        <Navigation size={14} />
                        <span>{t.contact.info.directionsBtn}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Maps Card */}
              <div className="contact-map-card">
                <h4 className="map-card-heading">{t.contact.mapTitle}</h4>
                <div className="map-iframe-container">
                  <iframe
                    title="Ayushyachi Photography Location Map"
                    src={instituteDetails.mapEmbedUrl}
                    width="100%"
                    height="260"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bottom Call / WhatsApp Action ── */}
      <section className="section section-darker">
        <div className="container">
          <div className="cta-cinematic-banner">
            <div className="cta-content">
              <span className="section-eyebrow">
                {language === 'mr' ? 'थेट संवाद' : 'Direct Conversation'}
              </span>
              <h2 className="cta-headline">{t.contact.cta.title}</h2>
              <p className="cta-subheadline">{t.contact.cta.subtitle}</p>
              <div className="cta-btn-row">
                <a
                  href={`tel:${instituteDetails.phone.replace(/[^0-9+]/g, '')}`}
                  className="btn btn-primary"
                >
                  <Phone size={17} />
                  <span>{t.contact.cta.callBtn}</span>
                </a>
                <a
                  href={`https://wa.me/${instituteDetails.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <MessageCircle size={17} />
                  <span>{t.contact.cta.whatsappBtn}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
