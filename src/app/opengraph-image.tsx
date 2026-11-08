import { ImageResponse } from 'next/og';
export const alt = 'Barber Luke · Tu estilo. Tu identidad.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#080a09',
        color: '#f5f1e8',
        padding: '70px',
        border: '1px solid #c5ab6e',
        fontFamily: 'serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: 'sans-serif',
          fontSize: 20,
          letterSpacing: 8,
          color: '#c5ab6e',
        }}
      >
        BARBER LUKE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 110, lineHeight: 1.05 }}>
        <span>Tu estilo.</span>
        <span style={{ color: '#c5ab6e', fontStyle: 'italic' }}>Tu identidad.</span>
      </div>
      <div style={{ display: 'flex', fontFamily: 'sans-serif', fontSize: 18, color: '#a4a69a' }}>
        El detalle hace la diferencia.
      </div>
    </div>,
    size,
  );
}
