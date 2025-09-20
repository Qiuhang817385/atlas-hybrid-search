import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import Button from '@leafygreen-ui/button';

export default function LanguageSwitcher () {
  const t = useTranslations();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale) => {
    // 这里需要实现语言切换逻辑
    // 由于我们使用的是 Pages Router，需要重新加载页面
    if (newLocale !== locale) {
      window.location.href = `/${newLocale}${window.location.pathname.replace(/^\/[a-z]{2}/, '')}`;
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="default"
        style={{ minWidth: '120px' }}
      >
        {currentLanguage.flag} {currentLanguage.name}
      </Button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: lang.code === locale ? '#f0f0f0' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = lang.code === locale ? '#f0f0f0' : 'white'}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
