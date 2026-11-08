import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Barber Luke · El corte es tu firma.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/brand/barber-luke.png'));
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#080706',
        color: '#f7edcf',
        padding: '65px',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '14px solid #e5bb3a',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: 600 }}>
        <span style={{ fontSize: 22, color: '#e5bb3a', letterSpacing: 6, marginBottom: 40 }}>
          BARBER LUKE
        </span>
        <span style={{ fontSize: 87, fontWeight: 900, lineHeight: 1 }}>EL CORTE.</span>
        <span style={{ fontSize: 87, fontWeight: 900, lineHeight: 1 }}>ES TU</span>
        <span style={{ fontSize: 105, fontWeight: 900, lineHeight: 1.1, color: '#e5bb3a' }}>
          FIRMA.
        </span>
        <span style={{ fontSize: 15, color: '#b9b09b', letterSpacing: 4, marginTop: 32 }}>
          BARBERÍA. OFICIO. ACTITUD.
        </span>
      </div>
      {/* next/image no se utiliza dentro del renderizador de imágenes de Satori. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${logo.toString('base64')}`}
        width={470}
        height={470}
        alt="Logo de Barber Luke"
        style={{ borderRadius: '50%' }}
      />
    </div>,
    size,
  );
}
