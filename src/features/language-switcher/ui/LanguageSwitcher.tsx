'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/shared/config';

export function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      aria-label={t('label')}
      className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-2 py-1 cursor-pointer hover:border-gray-500 transition-colors"
    >
      <option value="en">{t('en')}</option>
      <option value="ko">{t('ko')}</option>
    </select>
  );
}
