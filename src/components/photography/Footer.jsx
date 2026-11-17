import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import BrandLogo from './BrandLogo';
import { WhatsAppIcon, InstagramIcon, YouTubeIcon } from './SocialIcons';
import { instituteDetails } from '../../data/photographyData';

const Footer = () => {
  const { t, language } = useLanguage();
  const whatsappMsg = encodeURIComponent(
    language === 'mr'
      ? 'नमस्कार, मला ऍडमिशन बद्दल थेट बोलायचे आहे.'
      : 'Hello, I want to chat directly regarding photography admission.'
  );

  return (
    <footer className="site-footer">
      <div className="footer-top-accent" />
      <div className="container footer-content">
        <div className="footer-compact-wrap">
          <div className="footer-brand-block">
            <Link
              to="/home"
              className="footer-brand-link"
              aria-label="आयुष्याची फोटोग्राफी - Journey From Nothing To Everything"
            >
              <BrandLogo size="footer" />
            </Link>
            <div className="footer-cert-badge">
              <Award size={15} color="#FFC629" />
              <span>{t.footer.certificationNotice}</span>
            </div>
          </div>

          <div className="footer-contact-block">
            <div className="footer-contact-items">
              <a
                href={`tel:${instituteDetails.phone.replace(/[^0-9+]/g, '')}`}
                className="footer-quick-link"
              >
                <Phone size={15} className="text-gold" />
                <span>{instituteDetails.phone}</span>
              </a>
              <div className="footer-address-text">
                <MapPin size={15} className="text-gold flex-shrink-0" />
                <span>
                  {language === 'mr'
                    ? instituteDetails.addressMarathi
                    : instituteDetails.address}
                </span>
              </div>
            </div>

            <div className="footer-social-row">
              <span className="footer-social-label">
                {language === 'mr' ? 'अधिकृत सोशल मीडिया:' : 'Official Socials:'}
              </span>
              <div className="footer-social-buttons">
                <a
                  href={`https://wa.me/${instituteDetails.whatsappNumber}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-btn whatsapp-hover"
                  title="Direct WhatsApp Helpline (+91 84599 12189)"
                  aria-label="Direct WhatsApp Chat"
                >
                  <WhatsAppIcon size={20} />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={instituteDetails.socials.instagramInstitute.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-btn instagram-hover"
                  aria-label="Instagram Institute"
                  title="Instagram: @aayushyachi_photography"
                >
                  <InstagramIcon size={20} />
                  <span>Instagram</span>
                </a>
                <a
                  href={instituteDetails.socials.youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-btn youtube-hover"
                  aria-label="YouTube Channel"
                  title="YouTube: @Aayushyachi_Photography"
                >
                  <YouTubeIcon size={20} />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-compact">
          <p className="copyright-text">
            © {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p className="disclaimer-text">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
