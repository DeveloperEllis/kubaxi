import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // Lista de idiomas soportados
  locales: ['es', 'en', 'fr'],
 
  // Idioma por defecto
  defaultLocale: 'es'
});
 
export const config = {
  // Matcher ignorando archivos internos de Next.js
  matcher: ['/', '/(es|en|fr)/:path*']
};
