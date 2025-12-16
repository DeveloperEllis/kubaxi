import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { APP_NAME } from "@/lib/constants";
import { DataProvider } from "@/contexts/DataContext";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} - Tu Taxi en Cuba`,
  description:
    "Reserva tu taxi en Cuba de manera fácil y rápida. Viajes locales e intermunicipales con los mejores precios.",
  keywords: `taxi, cuba, transporte, viajes, reserva, ${APP_NAME.toLowerCase()}`,
  openGraph: {
    title: `${APP_NAME} - Tu Taxi en Cuba`,
    description: "Reserva tu taxi en Cuba de manera fácil y rápida.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DataProvider>{children}</DataProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
