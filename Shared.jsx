import React from 'react'
import { Link } from 'react-router-dom'

export function ModeHeader({ title }) {
  return (
    <header
      style={{
        background: 'var(--red)',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: 'var(--font-caption)',
          fontSize: '1.3rem',
          color: 'var(--white)',
          border: '2px solid var(--white)',
          borderRadius: 8,
          padding: '4px 12px',
        }}
      >
        kembali
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1.7rem',
          margin: 0,
          color: 'var(--white)',
        }}
      >
        {title}
      </h1>
    </header>
  )
}

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
      <p
        style={{
          fontFamily: 'var(--font-caption)',
          fontSize: '1.7rem',
          maxWidth: 420,
          lineHeight: 1.3,
        }}
      >
        {status === 'denied'
          ? errorMsg
          : status === 'error'
          ? errorMsg
          : 'GaleriKami butuh izin akses kamera untuk mulai memotret.'}
      </p>
      <button
        onClick={onRequest}
        style={{
          background: 'var(--red)',
          border: '2px solid var(--red-bright)',
          borderRadius: 12,
          padding: '14px 30px',
          color: 'var(--white)',
          fontSize: '1.3rem',
          fontWeight: 700,
          boxShadow: '0 5px 0 var(--red-dark)',
        }}
      >
        {status === 'requesting' ? 'meminta izin...' : 'izinkan kamera'}
      </button>
      {status !== 'idle' && status !== 'requesting' && (
        <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.15rem', opacity: 0.75, maxWidth: 380 }}>
          Di Chrome: ketuk ikon gembok/kamera di kolom alamat, lalu pilih "Izinkan" untuk Kamera.
        </p>
      )}
    </div>
  )
}
