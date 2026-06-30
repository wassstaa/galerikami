import React from 'react'
import { Link } from 'react-router-dom'

const MODES = [
  {
    to: '/photobooth',
    title: 'Photobooth',
    desc: '4 foto dalam satu strip, pilih tema kertas dan filter warna kesukaanmu.',
  },
  {
    to: '/blur',
    title: 'Blur',
    desc: 'Acungkan tangan dengan pose peace ke kamera, kamera otomatis blur lalu kembali normal.',
  },
  {
    to: '/polaroid',
    title: 'Polaroid',
    desc: 'Satu foto bingkai polaroid lengkap dengan tema polkadot dan warna pilihan.',
  },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-black)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: 'var(--red)',
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'clamp(2.4rem, 8vw, 3.6rem)',
            margin: 0,
            color: 'var(--white)',
            letterSpacing: '0.5px',
          }}
        >
          GaleriKami
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-caption)',
            fontSize: 'clamp(1.4rem, 5vw, 1.9rem)',
            margin: '6px 0 0',
            color: 'var(--white)',
          }}
        >
          kumpulan tempat foto kita, langsung dari browser
        </p>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '22px',
          padding: '40px 18px',
          maxWidth: 640,
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
              display: 'block',
              background: 'var(--red)',
              border: '2px solid var(--red-bright)',
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '0 6px 0 var(--red-dark)',
              transition: 'transform 0.12s ease',
            }}
            onTouchStart={(e) => (e.currentTarget.style.transform = 'translateY(3px)')}
            onTouchEnd={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.7rem',
                margin: '0 0 6px',
                color: 'var(--white)',
              }}
            >
              {m.title}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-caption)',
                fontSize: '1.25rem',
                margin: 0,
                color: 'var(--white)',
                lineHeight: 1.3,
              }}
            >
              {m.desc}
            </p>
          </Link>
        ))}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '18px',
          fontFamily: 'var(--font-caption)',
          fontSize: '1.2rem',
          color: 'var(--white)',
          opacity: 0.7,
        }}
      >
        dibuat dengan cinta - GaleriKami
      </footer>
    </div>
  )
}
