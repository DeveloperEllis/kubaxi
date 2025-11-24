import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // Lista de idiomas soportados
  locales: ['es', 'en', 'fr'],
 
  // Idioma por defecto
  defaultLocale: 'es'
});
 
export const config = {
  // Matcher ignorando archivos internos de Next.js y estáticos
  matcher: [
    // Incluir todas las rutas excepto las que empiezan con:
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Incluir la raíz
    '/',
    // Incluir rutas con locale
    '/(es|en|fr)/:path*'
  ]
};
