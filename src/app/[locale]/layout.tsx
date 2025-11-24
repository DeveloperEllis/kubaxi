import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kubaxi - Tu Taxi en Cuba',
  description: 'Reserva tu taxi en Cuba de manera fácil y rápida. Viajes locales e intermunicipales con los mejores precios.',
  keywords: 'taxi, cuba, transporte, viajes, reserva, kubaxi',
  openGraph: {
    title: 'Kubaxi - Tu Taxi en Cuba',
    description: 'Reserva tu taxi en Cuba de manera fácil y rápida.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
