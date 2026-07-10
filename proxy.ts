import createMiddleware from 'next-intl/middleware'
import { routing } from './lib/i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    '/',
    '/(es|en|fr|pt)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
