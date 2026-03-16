import createMiddleware from 'next-intl/middleware';
import { routing } from '@/shared/config/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/engine-simulator', '/event-simulator', '/closure-simulator', '/this-simulator', '/(ko)/:path*'],
};
