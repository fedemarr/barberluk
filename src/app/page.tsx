import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Scissors, Sparkles, Clock3, MapPin, Check } from 'lucide-react';
import { publicData } from '@/lib/data';
import { money } from '@/lib/format';
import { Reveal } from '@/components/motion';
import { ArtworkPreview } from '@/components/artwork-preview';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const { services, settings } = await publicData();
  return (
    <>
      <section className="hero">
        <div className="hero-grid-lines" />
        <div className="hero-content">
          <p className="eyebrow">
            <span className="gold-line" /> EL DETALLE HACE LA DIFERENCIA
          </p>
          <h1>
            Tu estilo.
            <br />
            Tu <em>identidad.</em>
          </h1>
          <p className="hero-description">
            Un buen corte se nota.
            <br />
            El tuyo se recuerda.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/reservar">
              Reservá tu momento <ArrowUpRight size={18} />
            </Link>
            <a className="text-link" href="#experiencia">
              Conocé el estudio <ArrowRight size={15} />
            </a>
          </div>
          <div className="hero-caption">
            <span>PRECISIÓN EN CADA LÍNEA</span>
            <span>ACTITUD EN CADA DETALLE</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-ring" />
          <span className="art-topline">BARBER LUKE — ESTILO CON CARÁCTER</span>
          <Image
            src="/studio/chair.svg"
            alt="Ilustración editorial de un sillón de barbería clásico"
            width={700}
            height={850}
            priority
            className="chair"
          />
          <div className="art-label">
            <span>
              EL ARTE DE
              <br />
              <em>hacerlo bien.</em>
            </span>
            <small>
              ILUSTRACIÓN EDITORIAL
              <br />
              FOTOS DEL ESTUDIO PRÓXIMAMENTE
            </small>
          </div>
          <span className="vertical-label">CLÁSICO EN ESENCIA. ACTUAL POR ELECCIÓN.</span>
        </div>
        <div className="hero-bottom">
          <span>01 — UNA EXPERIENCIA PROPIA</span>
          <a href="#experiencia">
            DESLIZÁ PARA DESCUBRIR <span>↓</span>
          </a>
        </div>
      </section>
      <div className="marquee" aria-hidden="true">
        <span>PRECISIÓN</span>
        <i>✦</i>
        <span>ESTILO</span>
        <i>✦</i>
        <span>CARÁCTER</span>
        <i>✦</i>
        <span>BARBER LUKE</span>
        <i>✦</i>
        <span>PRECISIÓN</span>
        <i>✦</i>
        <span>ESTILO</span>
      </div>
      <section id="experiencia" className="section experience">
        <Reveal className="experience-title">
          <p className="eyebrow">01 / EL ESTUDIO</p>
          <h2>
            El corte es solo
            <br />
            el <em>principio.</em>
          </h2>
        </Reveal>
        <Reveal className="experience-copy">
          <p className="lead">Hay algo que cambia cuando te sentís bien con tu estilo.</p>
          <p>
            En Barber Luke creemos en el tiempo bien dedicado. En escuchar lo que buscás, cuidar
            cada línea y encontrar ese detalle que te representa.
          </p>
          <p>Un espacio para bajar un cambio. Una experiencia para volver a ser vos.</p>
          <div className="signature">
            Barber Luke <span>— Hecho con oficio.</span>
          </div>
        </Reveal>
        <div className="value-grid">
          {[
            [Scissors, 'Precisión sin apuro', 'Un trabajo cuidado, de principio a fin.'],
            [Sparkles, 'Estilo propio', 'Tu identidad, en cada detalle.'],
            [Clock3, 'Tu tiempo vale', 'Reservá online y vení con tu turno.'],
          ].map(([Icon, title, copy], i) => {
            const I = Icon as typeof Scissors;
            return (
              <Reveal key={i} className="value">
                <I size={25} strokeWidth={1} />
                <h3>{String(title)}</h3>
                <p>{String(copy)}</p>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section id="servicios" className="section services-section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">02 / SERVICIOS</p>
            <h2>
              Elegí cómo
              <br />
              querés <em>verte.</em>
            </h2>
          </div>
          <p>
            Cuidamos la técnica.
            <br />
            Vos ponés la actitud.
          </p>
        </Reveal>
        <div className="service-list">
          {services.length ? (
            services.map((s, i) => (
              <Reveal key={s.id}>
                <Link href="/reservar" className="service-row">
                  <span className="service-number">0{i + 1}</span>
                  <div>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                  </div>
                  <span className="service-price">
                    {money(s.price_cents)}
                    <small>{settings?.slot_minutes} MIN</small>
                  </span>
                  <ArrowUpRight size={26} strokeWidth={1} />
                </Link>
              </Reveal>
            ))
          ) : (
            <div className="service-announcement">
              <Scissors size={30} strokeWidth={1} />
              <div>
                <h3>Tu próxima versión empieza acá.</h3>
                <p>
                  Estamos preparando la agenda y la carta de servicios. Los precios estarán
                  disponibles al habilitar las reservas.
                </p>
              </div>
              <Link href="/reservar" className="text-link">
                Ver agenda <ArrowUpRight size={20} />
              </Link>
            </div>
          )}
        </div>
        <p className="service-note">
          <Check size={14} /> Reservas automáticas al habilitar la agenda. Sin seña ni pagos online.
        </p>
      </section>
      <section id="galeria" className="section gallery-section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">03 / LA IDENTIDAD</p>
            <h2>
              El oficio.
              <br />
              La <em>actitud.</em>
            </h2>
          </div>
          <p>
            Un universo de detalles.
            <br />
            Pronto, nuestros trabajos reales.
          </p>
        </Reveal>
        <div className="editorial-grid">
          <ArtworkPreview title="La esencia">
            <Reveal className="editorial-card editorial-one">
              <span>01 — LA ESENCIA</span>
              <div className="abstract-blade" />
              <h3>
                Menos ruido.
                <br />
                <em>Más carácter.</em>
              </h3>
              <small>COMPOSICIÓN EDITORIAL · FOTO PRÓXIMAMENTE</small>
            </Reveal>
          </ArtworkPreview>
          <ArtworkPreview title="El detalle">
            <Reveal className="editorial-card editorial-two">
              <span>02 — EL DETALLE</span>
              <div className="abstract-comb" />
              <h3>
                La diferencia
                <br />
                está en <em>las líneas.</em>
              </h3>
              <small>COMPOSICIÓN EDITORIAL · FOTO PRÓXIMAMENTE</small>
            </Reveal>
          </ArtworkPreview>
        </div>
      </section>
      <section className="section steps-section">
        <p className="eyebrow">04 / ASÍ DE SIMPLE</p>
        <h2>
          Tu turno, sin <em>vueltas.</em>
        </h2>
        <div className="how-grid">
          {[
            ['01', 'Elegí tu servicio', 'Encontrá lo que va con vos.'],
            ['02', 'Buscá tu momento', 'La agenda te muestra horarios libres.'],
            ['03', 'Confirmá y listo', 'Entrá con Google. Tu turno queda reservado.'],
          ].map(([n, title, copy]) => (
            <Reveal className="how-step" key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="cta-section">
        <Reveal>
          <p className="eyebrow">EL PRÓXIMO CAMBIO EMPIEZA CON VOS</p>
          <h2>
            Hacé lugar para
            <br />
            tu mejor <em>versión.</em>
          </h2>
          <Link href="/reservar" className="button">
            Reservar mi turno <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </section>
      <section className="section contact-section">
        <div>
          <p className="eyebrow">NOS VEMOS EN EL ESTUDIO</p>
          <h2>
            Encontrá tu <em>lugar.</em>
          </h2>
        </div>
        <div className="contact-details">
          <MapPin size={22} />
          <div>
            <h3>{settings?.address || 'Ubicación del estudio'}</h3>
            <p>
              {settings?.address
                ? 'La dirección también se muestra al reservar.'
                : 'La dirección y el contacto se publicarán una vez confirmados.'}
            </p>
            {settings?.contact && <p>{settings.contact}</p>}
            {settings?.instagram && (
              <a
                className="text-link"
                href={`https://www.instagram.com/${settings.instagram}/`}
                target="_blank"
                rel="noreferrer"
              >
                @{settings.instagram} <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
