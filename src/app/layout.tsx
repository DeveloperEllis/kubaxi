import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
