import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { CONTACT_INFO, SOCIAL_MEDIA, COMPANY_INFO, APP_NAME } from '@/lib/constants';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <img
                src={COMPANY_INFO.logoPath}
                alt={`${APP_NAME} Logo`}
                className="w-10 h-10 drop-shadow-lg"
              />
              <span className="text-2xl font-bold text-blue-600">{APP_NAME}</span>
            </Link>
            <Link 
              href={`/${locale}`}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              ← {t('nav.home')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 md:p-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img
                src={COMPANY_INFO.logoPath}
                alt={`${APP_NAME} Logo`}
                className="w-16 h-16 drop-shadow-lg"
              />
              <h1 className="text-4xl md:text-5xl font-bold">{APP_NAME}</h1>
            </div>
            <p className="text-xl text-center text-blue-100">
              {t('footer.description')}
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 space-y-8">
            {/* About Us */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-4">
                {t('footer.aboutUs')}
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {COMPANY_INFO.name} {t('about.intro')} {COMPANY_INFO.experienceYears} {t('about.yearsExperience')}
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-4">
                {t('footer.services')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">{t('about.privateTaxi')}</h3>
                  <p className="text-gray-600">
                    {t('about.privateTaxiDesc')}
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">{t('about.collectiveTaxi')}</h3>
                  <p className="text-gray-600">
                    {t('about.collectiveTaxiDesc')}
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">{t('about.excursions')}</h3>
                  <p className="text-gray-600">
                    {t('about.excursionsDesc')}
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">{t('about.packages')}</h3>
                  <p className="text-gray-600">
                    {t('about.packagesDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-4">
                {t('footer.contact')}
              </h2>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-gray-700 text-lg font-medium">{CONTACT_INFO.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700 text-lg font-medium">{CONTACT_INFO.location[locale as 'es' | 'en' | 'fr']}</span>
                  </div>
                  <a 
                    href={SOCIAL_MEDIA.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    {t('about.contactWhatsApp')}
                  </a>
                </div>
              </div>
            </section>

            {/* Why Choose Us */}
            <section>
              <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-4">
                {t('about.whyChoose')}
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-600">
                    <strong>{t('about.experience')}</strong> {COMPANY_INFO.experienceYears} {t('about.experienceDesc')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-600">
                    <strong>{t('about.safety')}</strong> {t('about.safetyDesc')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-600">
                    <strong>{t('about.flexibility')}</strong> {t('about.flexibilityDesc')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-600">
                    <strong>{t('about.fairPrices')}</strong> {t('about.fairPricesDesc')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-600">
                    <strong>{t('about.support247')}</strong> {t('about.support247Desc')}
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
