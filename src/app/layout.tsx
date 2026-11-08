import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { Header, Footer } from '@/components/header';
import './globals.css';
import { siteUrl } from '@/lib/site-url';
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Barber Luke · Tu estilo. Tu identidad.', template: '%s · Barber Luke' },
  description:
    'Barbería, detalle y estilo propio. Descubrí Barber Luke y reservá tu próximo turno online.',
  openGraph: {
    title: 'Barber Luke',
    description: 'Tu estilo. Tu identidad.',
    locale: 'es_AR',
    type: 'website',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className={`${sans.variable} ${serif.variable}`}>
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
