import React from 'react'
import { Link } from 'react-router-dom'

// ── Aesthetic compact header for sub-pages ──────────────────────────────────
export function ModeHeader({ title }) {
  return (
    <header
      style={{
        background: 'linear-gradient(135deg, var(--red-dark) 0%, var(--red) 100%)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 3px 12px rgba(0,0,0,0.55)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Back button – pill style */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.35)',
          borderRadius: 20,
          padding: '5px 13px',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.85rem',
          color: 'var(--white)',
          backdropFilter: 'blur(4px)',
          flexShrink: 0,
          letterSpacing: '0.3px',
          transition: 'background 0.15s',
        }}
      >
        ← kembali
      </Link>

      {/* Camera icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📷</span>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '1.15rem',
            margin: 0,
            color: 'var(--white)',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Decorative dot cluster (right side) */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexShrink: 0 }}>
        {['#fff', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.25)'].map((c, i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: c,
              display: 'block',
            }}
          />
        ))}
      </div>
    </header>
  )
}

// ── Camera permission gate ──────────────────────────────────────────────────
export function CameraPermissionGate({ status, errorMsg, onRequest, children }) {
  if (status === 'granted') return children

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem' }}>📷</div>
      <p
        style={{
          fontFamily: 'var(--font-caption)',
          fontSize: '1.6rem',
          maxWidth: 380,
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {status === 'denied' || status === 'error'
          ? errorMsg
          : 'GaleriKami butuh izin kamera untuk mulai memotret.'}
      </p>
      <button
        onClick={onRequest}
        style={{
          background: 'var(--red)',
          border: 'none',
          borderRadius: 14,
          padding: '14px 32px',
          color: 'var(--white)',
          fontSize: '1.25rem',
          fontWeight: 700,
          boxShadow: '0 6px 0 var(--red-dark)',
          letterSpacing: '0.3px',
        }}
      >
        {status === 'requesting' ? '⏳ meminta izin…' : '✅ izinkan kamera'}
      </button>
      {status !== 'idle' && status !== 'requesting' && (
        <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.1rem', opacity: 0.7, maxWidth: 360 }}>
          Di Chrome: ketuk ikon gembok/kamera di bilah alamat lalu pilih "Izinkan".
        </p>
      )}
    </div>
  )
}
