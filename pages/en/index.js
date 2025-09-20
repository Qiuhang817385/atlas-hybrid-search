import Home from '../../components/home';
import { AppProvider } from '../../context/AppContext';
import { ToastProvider } from '@leafygreen-ui/toast';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

// 导入翻译文件
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';

const messages = {
  en: enMessages,
  zh: zhMessages
};

export default function App () {


  const router = useRouter();
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // 从 URL 路径或 localStorage 获取语言设置
    const pathLocale = router.locale || 'en';
    const savedLocale = localStorage.getItem('preferred-language') || pathLocale;
    setLocale(savedLocale);
  }, [router.locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <AppProvider>
        <ToastProvider>
          <Home />
        </ToastProvider>
      </AppProvider>
    </NextIntlClientProvider>
  )
}