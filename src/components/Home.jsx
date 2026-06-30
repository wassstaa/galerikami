import React from 'react'
import { Link } from 'react-router-dom'

const MODES = [
  {
    to: '/photobooth',
    icon: '🎞️',
    title: 'Photobooth',
    desc: '4 foto dalam satu strip, pilih tema kertas & filter warna.',
  },
  {
    to: '/blur',
    icon: '✌️',
    title: 'Blur',
    desc: 'Acungkan peace ke kamera, layar auto-blur. Ada fitur rekam video juga!',
  },
  {
    to: '/polaroid',
    icon: '📸',
    title: 'Polaroid',
    desc: 'Satu foto bingkai polaroid asli lengkap dengan caption & tanggal.',
  },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-black)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Aesthetic compact header ── */}
      <header
        style={{
          background: 'linear-gradient(135deg, #6b0010 0%, var(--red) 55%, #e8404f 100%)',
          padding: '18px 22px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 90, height: 90, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -14, left: 60,
          width: 55, height: 55, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <span
            style={{
              fontSize: '1.9rem',
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 12,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >📷</span>

          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(1.25rem, 5vw, 1.65rem)',
                margin: 0,
                color: '#fff',
                letterSpacing: '0.6px',
                lineHeight: 1.1,
              }}
            >
              GaleriKami
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-caption)',
                fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                margin: '2px 0 0',
                color: 'rgba(255,255,255,0.75)',
                letterSpacing: '0.2px',
              }}
            >
              kumpulan tempat foto kita, langsung dari browser
            </p>
          </div>
        </div>
      </header>

      {/* ── Mode cards ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '28px 18px',
          maxWidth: 560,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {MODES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'linear-gradient(135deg, var(--red-dark) 0%, var(--red) 100%)',
              border: '1.5px solid var(--red-bright)',
              borderRadius: 16,
              padding: '16px 20px',
              boxShadow: '0 6px 0 var(--red-dark), 0 8px 20px rgba(0,0,0,0.4)',
              transition: 'transform 0.09s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.97) translateY(3px)')}
            onTouchEnd={(e) => (e.currentTarget.style.transform = '')}
          >
            <span
              style={{
                fontSize: '2rem',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {m.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  margin: '0 0 3px',
                  color: '#fff',
                  letterSpacing: '0.3px',
                }}
              >
                {m.title}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.1rem',
                  margin: 0,
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.3,
                }}
              >
                {m.desc}
              </p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', flexShrink: 0 }}>›</span>
          </Link>
        ))}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '14px',
          fontFamily: 'var(--font-caption)',
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.3px',
        }}
      >
        dibuat dengan cinta ✨ GaleriKami
      </footer>
    </div>
  )
}
