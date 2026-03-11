import '../globals.css';
import { type Metadata } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { CoreProvider } from '@/app';
import { routing } from '@/shared/config/i18n/routing';

const pretendard = localFont({
  src: '../../src/fonts/PretendardVariable.woff2',
  weight: '45 920',
  variable: '--font-pretendard',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${pretendard.className} font-sans`}
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
      >
        <NextIntlClientProvider messages={messages}>
          <CoreProvider>
            <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>
          </CoreProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
