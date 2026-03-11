'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex w-full h-full items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 p-8 rounded-md shadow-md max-w-md">
        <h2 className="text-2xl font-bold text-red-500">{t('title')}</h2>
        <p className="text-base text-gray-700 text-center">{error.message || t('unknownMessage')}</p>
        {error.digest && <p className="text-sm text-gray-500">{t('errorId', { digest: error.digest })}</p>}
        <Button onClick={reset} className="mt-4">
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
