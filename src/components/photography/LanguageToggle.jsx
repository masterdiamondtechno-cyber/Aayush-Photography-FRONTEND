import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageToggle = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`lang-switcher-wrap ${className}`} role="group" aria-label="Language selection">
      <div className="lang-switcher">
        <Globe size={15} className="lang-icon" />
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`lang-btn ${language === 'en' ? 'active' : ''}`}
          aria-pressed={language === 'en'}
        >
          English
        </button>
        <span className="lang-sep">|</span>
        <button
          type="button"
          onClick={() => setLanguage('mr')}
          className={`lang-btn ${language === 'mr' ? 'active' : ''}`}
          aria-pressed={language === 'mr'}
        >
          मराठी
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
