import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowDown, Scissors, MapPin } from 'lucide-react';
import { publicData } from '@/lib/data';
import { money } from '@/lib/format';
import { Reveal } from '@/components/motion';
import { BrandEmblem } from '@/components/brand-emblem';
import './landing.css';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { services, settings } = await publicData();
  return (
    <div className="luke-home">
      {/* El logo original ocupa el lugar del sillón. */}
      <section className="luke-hero" aria-labelledby="luke-title">
        <div className="luke-backprint" aria-hidden="true">
          LUKE
        </div>
        <div className="luke-hero-copy">
          <p className="luke-kicker">
            <span /> BARBERÍA. OFICIO. ACTITUD.
          </p>
          <h1 id="luke-title" className="luke-title">
            <span>EL CORTE.</span>
            <span>
              ES TU <b>FIRMA.</b>
            </span>
          </h1>
          <p className="luke-hero-note">
            Vos traés el estilo.
            <br />
            Nosotros nos encargamos del resto.
          </p>
          <div className="luke-hero-actions">
            <Link className="button luke-button" href="/reservar">
              QUIERO MI TURNO <ArrowUpRight size={22} />
            </Link>
            <a className="luke-discover" href="#experiencia">
              <ArrowDown size={16} /> CONOCÉ EL ESTUDIO
            </a>
          </div>
          <div className="luke-hero-signoff">
            <Scissors size={18} strokeWidth={1.5} />
            <span>BUEN CORTE. BUENA ENERGÍA.</span>
          </div>
        </div>
        <div className="luke-emblem">
          <BrandEmblem />
        </div>
        <div className="luke-hero-foot">
          <span>BARBER LUKE / ESTILO PROPIO</span>
          <span>EL DETALLE NO SE NEGOCIA.</span>
          <a href="#servicios">
            DESCUBRÍ MÁS <ArrowDown size={13} />
          </a>
        </div>
      </section>
      <div className="luke-tape" aria-label="Tu barrio. Tu estilo. Tu barbería.">
        <div>
          <span>TU BARRIO.</span>
          <Scissors size={26} />
          <span>TU ESTILO.</span>
          <Scissors size={26} />
          <span>TU BARBERÍA.</span>
          <Scissors size={26} />
          <span aria-hidden="true">BARBER LUKE.</span>
        </div>
      </div>
      <section id="experiencia" className="luke-manifesto luke-section">
        <Reveal className="luke-manifesto-poster">
          <p className="luke-kicker">LA FORMA DE HACERLO</p>
          <h2>
            NO ES
            <br />
            <span>SOLO</span>
            <br />
            PELO.
          </h2>
          <span className="luke-poster-foot">ES LO QUE DICE DE VOS.</span>
        </Reveal>
        <Reveal className="luke-manifesto-copy">
          <span className="luke-mini-seal" aria-hidden="true">
            BL / OFICIO
          </span>
          <h3>
            Es cómo salís
            <br />a la calle.
          </h3>
          <p>
            Ese momento frente al espejo en el que decís: <strong>«sí, es por acá».</strong> Para
            eso está Barber Luke.
          </p>
          <p>
            Escuchamos lo que buscás, trabajamos cada línea y le dedicamos a tu corte el tiempo que
            necesita. Sin vueltas. Con oficio.
          </p>
          <div className="luke-standards">
            <div>
              <span>01 /</span>
              <strong>PRECISIÓN</strong>
              <p>Cada línea tiene un porqué.</p>
            </div>
            <div>
              <span>02 /</span>
              <strong>IDENTIDAD</strong>
              <p>Tu estilo no viene en serie.</p>
            </div>
            <div>
              <span>03 /</span>
              <strong>BUENA ENERGÍA</strong>
              <p>Un rato para bajar un cambio.</p>
            </div>
          </div>
        </Reveal>
      </section>
      <section id="servicios" className="luke-menu-section">
        <div className="luke-menu-inner">
          <Reveal className="luke-menu-heading">
            <p className="luke-kicker">SENTATE. ESTÁS EN BUENAS MANOS.</p>
            <h2>
              EL
              <br />
              <span>MENÚ.</span>
            </h2>
            <Scissors size={55} strokeWidth={1} />
            <p>
              Elegí tu servicio.
              <br />
              Dale forma a lo que viene.
            </p>
          </Reveal>
          <Reveal className="luke-menu-board">
            <div className="luke-menu-board-top">
              <span>BARBER LUKE</span>
              <span>SERVICIOS & ESTILO</span>
            </div>
            {services.length ? (
              <div className="luke-menu-list">
                {services.map((service, index) => (
                  <Link href="/reservar" className="luke-menu-item" key={service.id}>
                    <span className="luke-menu-index">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{service.name}</h3>
                      <p>{service.description}</p>
                    </div>
                    <div className="luke-menu-price">
                      <strong>{money(service.price_cents)}</strong>
                      <small>{settings?.slot_minutes} MIN</small>
                    </div>
                    <ArrowUpRight size={24} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="luke-menu-soon">
                <span>PRÓXIMAMENTE / AGENDA ONLINE</span>
                <h3>
                  EL PRÓXIMO CORTE
                  <br />
                  LLEVA <b>TU NOMBRE.</b>
                </h3>
                <p>
                  Estamos preparando la carta de servicios y los horarios. Muy pronto vas a poder
                  elegir tu turno desde acá.
                </p>
                <Link className="button luke-button" href="/reservar">
                  VER RESERVAS <ArrowUpRight size={20} />
                </Link>
              </div>
            )}
            <div className="luke-menu-board-foot">
              <span>EL BUEN ESTILO SE TRABAJA.</span>
              <span>BL</span>
            </div>
          </Reveal>
        </div>
      </section>
      <section id="galeria" className="luke-signature-section">
        <div className="luke-signature-watermark" aria-hidden="true">
          <Image
            src="/brand/barber-luke.png"
            alt=""
            width={640}
            height={640}
            sizes="(max-width: 760px) 90vw, 50vw"
          />
        </div>
        <Reveal className="luke-signature-copy">
          <p className="luke-kicker">EL SELLO DE LA CASA</p>
          <h2>
            NEGRO.
            <br />
            <span>DORADO.</span>
            <br />
            MUY VOS.
          </h2>
          <div className="luke-signature-bottom">
            <p>
              La firma es nuestra.
              <br />
              La actitud es tuya.
            </p>
            <Link
              className="luke-outline-link"
              href="/reservar"
              aria-label="Reservar turno en Barber Luke"
            >
              <ArrowUpRight size={36} strokeWidth={1} />
            </Link>
          </div>
        </Reveal>
        <div className="luke-signature-side" aria-hidden="true">
          BARBER LUKE — SIN COPIA.
        </div>
      </section>
      <section className="luke-booking-strip luke-section">
        <div>
          <p className="luke-kicker">NOS VEMOS EN LA SILLA</p>
          <h2>
            TRES PASOS.
            <br />
            <span>CERO VUELTAS.</span>
          </h2>
        </div>
        <div className="luke-booking-steps">
          {[
            ['01', 'ELEGÍ', 'Tu servicio. Tu estilo.'],
            ['02', 'RESERVÁ', 'El día y la hora que van con vos.'],
            ['03', 'VENÍ', 'Del corte nos ocupamos nosotros.'],
          ].map(([number, title, description]) => (
            <div key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="luke-final">
        <div className="luke-final-tag">¿Y SI EL CAMBIO ES HOY?</div>
        <Reveal>
          <h2>
            TE FALTA
            <br />
            <span>EL CORTE.</span>
          </h2>
          <Link className="button luke-button" href="/reservar">
            RESERVAR MI TURNO <ArrowUpRight size={24} />
          </Link>
        </Reveal>
        <span className="luke-final-mark" aria-hidden="true">
          L.
        </span>
      </section>
      <section className="luke-contact luke-section">
        <div>
          <p className="luke-kicker">DEL OTRO LADO DEL ESPEJO</p>
          <h2>{settings?.address ? 'ACÁ ESTAMOS.' : 'NOS VEMOS PRONTO.'}</h2>
        </div>
        <div className="luke-contact-copy">
          {settings?.address ? (
            <>
              <MapPin size={24} />
              <h3>{settings.address}</h3>
            </>
          ) : (
            <p>
              Estamos preparando todo para recibirte.
              <br />
              Pronto vas a encontrar acá la dirección y el contacto del estudio.
            </p>
          )}
          {settings?.contact && <p>{settings.contact}</p>}
          {settings?.instagram && (
            <a
              href={`https://www.instagram.com/${settings.instagram}/`}
              target="_blank"
              rel="noreferrer"
              className="luke-social"
            >
              @{settings.instagram} <ArrowUpRight size={20} />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
