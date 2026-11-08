import type { Metadata } from 'next';
import { Bebas_Neue, Cormorant_Garamond, Manrope } from 'next/font/google';
import { Header, Footer } from '@/components/header';
import './globals.css';
import { siteUrl } from '@/lib/site-url';
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const poster = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-poster' });
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  icons: { icon: '/brand/barber-luke.png', apple: '/brand/barber-luke.png' },
  title: { default: 'Barber Luke · El corte es tu firma.', template: '%s · Barber Luke' },
  description:
    'Barbería, detalle y estilo propio. Descubrí Barber Luke y reservá tu próximo turno online.',
  openGraph: {
    title: 'Barber Luke',
    description: 'El corte es tu firma. Barbería, oficio y actitud.',
    locale: 'es_AR',
    type: 'website',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className={`${sans.variable} ${serif.variable} ${poster.variable}`}>
        <a className="skip-link" href="#main">
          Ir al contenido
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
