import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Phone, MessageSquare, ChevronDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { faqsData, instituteDetails } from '../../data/photographyData';

const FAQ = () => {
  const { t, language } = useLanguage();
  const [openIds, setOpenIds] = useState([1]); // First FAQ open by default

  const toggleFaq = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const whatsappMsg = encodeURIComponent(
    language === 'mr'
      ? 'नमस्कार, मला कोर्सेस आणि ऍडमिशन बद्दल काही शंका विचारायच्या आहेत.'
      : 'Hello, I have questions regarding admissions and courses at Tushar Pulate Institute.'
  );

  return (
    <div className="page-faq">
      {/* ── Hero Section ── */}
      <section className="faq-hero-section">
        <div className="faq-hero-bg">
          <img
            src="/images/gallery-classroom-interactive.png"
            alt="FAQ at Tushar Pulate Institute"
            className="faq-hero-bg-img"
          />
          <div className="faq-hero-overlay" />
        </div>

        <div className="container faq-hero-container">
          <motion.div
            className="faq-hero-content"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <span className="section-eyebrow">{t.faq.hero.eyebrow}</span>
            <h1 className="faq-hero-title">{t.faq.hero.title}</h1>
            <p className="faq-hero-subtitle">{t.faq.hero.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Accordion List Section ── */}
      <section className="section">
        <div className="container">
          <div className="faq-layout">
            <div className="faq-accordion-list">
              {faqsData.map((faq) => {
                const isOpen = openIds.includes(faq.id);
                const question = language === 'mr' ? faq.questionMr : faq.question;
                const answer = language === 'mr' ? faq.answerMr : faq.answer;

                return (
                  <div
                    key={faq.id}
                    className={`faq-item ${isOpen ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-q-text">{question}</span>
                      <ChevronDown
                        size={18}
                        className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          className="faq-answer-wrap"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="faq-answer-inner">
                            <p>{answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Support Card */}
            <div className="faq-support-card">
              <div className="faq-supp-left">
                <HelpCircle size={24} color="#FFC629" />
                <div>
                  <h4 className="faq-supp-title">{t.faq.supportNotice}</h4>
                  <p className="faq-supp-sub">{t.faq.contactSupport}</p>
                </div>
              </div>

              <div className="faq-supp-actions">
                <a
                  href={`tel:${instituteDetails.phone.replace(/[^0-9+]/g, '')}`}
                  className="btn btn-primary btn-sm"
                >
                  <Phone size={15} />
                  <span>{language === 'mr' ? 'कॉल करा' : 'Call Desk'}</span>
                </a>
                <a
                  href={`https://wa.me/${instituteDetails.whatsappNumber}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <MessageSquare size={15} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section section-darker">
        <div className="container">
          <div className="cta-cinematic-banner">
            <div className="cta-content">
              <span className="section-eyebrow">
                {language === 'mr' ? 'मार्गदर्शन हवे आहे का?' : 'Still Deciding?'}
              </span>
              <h2 className="cta-headline">
                {language === 'mr'
                  ? 'आमच्या मार्गदर्शकांशी बोला'
                  : 'Speak Directly With Our Counselors'}
              </h2>
              <p className="cta-subheadline">
                {language === 'mr'
                  ? 'आपल्या छंदाला व्यावसायिक रूप देण्यासाठी कोणता कोर्स सर्वात योग्य ठरेल हे जाणून घ्या.'
                  : 'Let us help you understand the batch schedule, fee structure, and hostel availability.'}
              </p>
              <div className="cta-btn-row">
                <Link to="/contact" className="btn btn-primary">
                  <span>
                    {language === 'mr'
                      ? 'प्रवेश अर्ज भरा'
                      : 'Fill Admission Enquiry Form'}
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

export default FAQ;
