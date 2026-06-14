import { LANGUAGES } from '@i18n/types';
import { useTranslation } from '@i18n/useTranslation';

import './LanguageSwitcher.scss';

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useTranslation();
  return (
    <div className="language-switcher" role="group" aria-label={t('lang.switch')}>
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className={`language-switcher__option${language === code ? ' language-switcher__option--active' : ''}`}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
};
