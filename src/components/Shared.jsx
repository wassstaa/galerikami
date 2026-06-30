import React from 'react'
import { Link } from 'react-router-dom'

// ── tombol clicky reusable ───────────────────────────────────────────────────
const clickyBase = {
  cursor: 'pointer',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
  fontFamily: 'var(--font-caption)',
}

export const clickyDown = (el) => {
  el.style.transform = 'translateY(3px) scale(0.97)'
  el.style.boxShadow = '0 1px 0 var(--red-dark)'
}
export const clickyUp = (el) => {
  el.style.transform = ''
  el.style.boxShadow = ''
}

export function ClickyButton({ onClick, disabled, style = {}, children, variant = 'primary' }) {
  const isPrimary = variant === 'primary'
  const base = {
    ...clickyBase,
    border: isPrimary ? '2px solid var(--red-bright)' : '2px solid var(--red)',
    borderRadius: 12,
    padding: '12px 28px',
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--white)',
    background: isPrimary ? 'var(--red)' : 'transparent',
    boxShadow: isPrimary ? '0 4px 0 var(--red-dark)' : 'none',
    opacity: disabled ? 0.55 : 1,
    ...style,
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={base}
      onMouseDown={(e) => !disabled && clickyDown(e.currentTarget)}
      onMouseUp={(e) => !disabled && clickyUp(e.currentTarget)}
      onMouseLeave={(e) => clickyUp(e.currentTarget)}
      onTouchStart={(e) => !disabled && clickyDown(e.currentTarget)}
      onTouchEnd={(e) => !disabled && clickyUp(e.currentTarget)}
    >
      {children}
    </button>
  )
}

// ── header tiap mode ─────────────────────────────────────────────────────────
export function ModeHeader({ title }) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      borderBottom: '1.5px solid var(--red)',
      boxShadow: '0 2px 12px rgba(193,18,31,0.25)',
    }}>
      <Link
        to="/"
        style={{
          ...clickyBase,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-caption)',
          fontSize: '1rem',
          color: 'var(--white)',
          background: 'rgba(193,18,31,0.18)',
          border: '1.5px solid var(--red)',
          borderRadius: 20,
          padding: '5px 14px',
          boxShadow: '0 2px 0 var(--red-dark)',
          textDecoration: 'none',
        }}
        onMouseDown={(e) => clickyDown(e.currentTarget)}
        onMouseUp={(e) => clickyUp(e.currentTarget)}
        onMouseLeave={(e) => clickyUp(e.currentTarget)}
        onTouchStart={(e) => clickyDown(e.currentTarget)}
        onTouchEnd={(e) => clickyUp(e.currentTarget)}
      >
        ← kembali
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--red)', opacity: 0.7, fontFamily: 'monospace', letterSpacing: 2 }}>
          ▸ GALERIKAMI
        </span>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1.25rem',
          margin: 0,
          color: 'var(--white)',
          letterSpacing: '0.5px',
        }}>
          {title}
        </h1>
      </div>

      {/* dot dekoratif */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
        {['var(--red)', '#444', '#333'].map((c, i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
        ))}
      </div>
    </header>
  )
}

// ── gate izin kamera ─────────────────────────────────────────────────────────
export function CameraPermissionGate({ status, errorMsg, onRequest, children }) {
  if (status === 'granted') return children

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.55rem', maxWidth: 420, lineHeight: 1.3 }}>
        {status === 'denied' || status === 'error'
          ? errorMsg
          : 'GaleriKami butuh izin akses kamera untuk mulai memotret.'}
      </p>
      <ClickyButton onClick={onRequest}>
        {status === 'requesting' ? 'meminta izin...' : 'izinkan kamera'}
      </ClickyButton>
      {status !== 'idle' && status !== 'requesting' && (
        <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.1rem', opacity: 0.65, maxWidth: 380 }}>
          Di Chrome: ketuk ikon gembok/kamera di kolom alamat, lalu pilih "Izinkan" untuk Kamera.
        </p>
      )}
    </div>
  )
}
