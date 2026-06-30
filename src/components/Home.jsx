import React from 'react'
import { Link } from 'react-router-dom'
import { clickyDown, clickyUp } from './Shared.jsx'

const MODES = [
  {
    to: '/photobooth',
    icon: '📸',
    title: 'Photobooth',
    desc: '4 foto dalam satu strip, pilih tema kertas dan filter warna kesukaanmu.',
  },
  {
    to: '/blur',
    icon: '✌️',
    title: 'Blur',
    desc: 'Acungkan pose peace ke kamera, latar otomatis blur. Plus fitur video!',
  },
  {
    to: '/polaroid',
    icon: '🎞️',
    title: 'Polaroid',
    desc: 'Satu foto bingkai polaroid asli lengkap dengan tema polkadot, caption, dan tanggal.',
  },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-black)', display: 'flex', flexDirection: 'column' }}>

      {/* ── header aesthetic, compact ── */}
      <header style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0003 60%, #0a0a0a 100%)',
        padding: '18px 24px 16px',
        borderBottom: '1.5px solid var(--red)',
        boxShadow: '0 3px 20px rgba(193,18,31,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
      }}>
        {/* label kecil di atas */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.6rem',
          letterSpacing: '0.25em',
          color: 'var(--red)',
          opacity: 0.8,
          textTransform: 'uppercase',
        }}>
          ● live • photo studio
        </span>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
            margin: 0,
            color: 'var(--white)',
            letterSpacing: '-0.5px',
          }}>
            GaleriKami
          </h1>
          {/* aksen merah kecil */}
          <span style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--red)',
            flexShrink: 0,
            marginBottom: 4,
            boxShadow: '0 0 8px var(--red)',
          }} />
        </div>

        <p style={{
          fontFamily: 'var(--font-caption)',
          fontSize: 'clamp(0.95rem, 3vw, 1.15rem)',
          margin: 0,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.02em',
        }}>
          kumpulan tempat foto kita, langsung dari browser
        </p>
      </header>

      {/* ── card menu ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '28px 18px',
        maxWidth: 560,
        margin: '0 auto',
        width: '100%',
      }}>
        {MODES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'linear-gradient(135deg, #1a0003 0%, #111 100%)',
              border: '1.5px solid #3a0008',
              borderLeft: '4px solid var(--red)',
              borderRadius: 14,
              padding: '16px 20px',
              boxShadow: '0 4px 0 #3a0008, 0 6px 20px rgba(0,0,0,0.4)',
              transition: 'transform 0.09s ease, box-shadow 0.09s ease',
              textDecoration: 'none',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseDown={(e) => clickyDown(e.currentTarget)}
            onMouseUp={(e) => clickyUp(e.currentTarget)}
            onMouseLeave={(e) => clickyUp(e.currentTarget)}
            onTouchStart={(e) => clickyDown(e.currentTarget)}
            onTouchEnd={(e) => clickyUp(e.currentTarget)}
          >
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>{m.icon}</span>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.35rem',
                margin: '0 0 4px',
                color: 'var(--white)',
              }}>
                {m.title}
              </h2>
              <p style={{
                fontFamily: 'var(--font-caption)',
                fontSize: '1rem',
                margin: 0,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.35,
              }}>
                {m.desc}
              </p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--red)', fontSize: '1.2rem', flexShrink: 0 }}>›</span>
          </Link>
        ))}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '14px',
        fontFamily: 'var(--font-caption)',
        fontSize: '0.95rem',
        color: 'rgba(255,255,255,0.3)',
      }}>
        dibuat dengan cinta — GaleriKami ♥
      </footer>
    </div>
  )
}
