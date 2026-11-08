'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

export function BrandEmblem() {
  const stage = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  return (
    <div
      className={`emblem-scene ${paused ? 'emblem-paused' : ''}`}
      ref={stage}
      onPointerMove={(event) => {
        if (reduced || paused || event.pointerType !== 'mouse') return;
        const rect = event.currentTarget.getBoundingClientRect();
        stage.current?.style.setProperty(
          '--pointer-y',
          `${((event.clientX - rect.left - rect.width / 2) / rect.width) * 16}deg`,
        );
        stage.current?.style.setProperty(
          '--pointer-x',
          `${(-(event.clientY - rect.top - rect.height / 2) / rect.height) * 12}deg`,
        );
      }}
      onPointerLeave={() => {
        stage.current?.style.setProperty('--pointer-x', '0deg');
        stage.current?.style.setProperty('--pointer-y', '0deg');
      }}
    >
      <div className="emblem-orbit" aria-hidden="true" />
      <div className="emblem-orbit emblem-orbit-inner" aria-hidden="true" />
      <div className="emblem-tilt">
        <div className="emblem-medallion">
          <div className="emblem-face">
            <Image
              src="/brand/barber-luke.png"
              alt="Logo original dorado de Barber Luke"
              width={1254}
              height={1254}
              sizes="(max-width: 760px) 78vw, (max-width: 1100px) 45vw, 580px"
              priority
            />
            <span className="emblem-shine" aria-hidden="true" />
          </div>
        </div>
      </div>
      <span className="emblem-coordinate emblem-coordinate-top" aria-hidden="true">
        ESTILO CON NOMBRE PROPIO
      </span>
      <div className="emblem-caption">
        <span>
          LA FIRMA ES <b>LUKE.</b>
        </span>
        <button
          type="button"
          onClick={() => {
            setPaused(!paused);
            stage.current?.style.setProperty('--pointer-x', '0deg');
            stage.current?.style.setProperty('--pointer-y', '0deg');
          }}
          aria-pressed={paused}
          aria-label={paused ? 'Activar animación del logo' : 'Pausar animación del logo'}
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          <span>{paused ? 'ACTIVAR EFECTO' : 'PAUSAR EFECTO'}</span>
        </button>
      </div>
    </div>
  );
}
