import React, { useState, useEffect, useRef } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS, STRIP_THEMES } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate } from './Shared.jsx'
import { drawPolkaDots, loadImage, drawCover, applyManualFilter } from '../utils/canvasHelpers.js'

const SHOTS_NEEDED      = 4
const COUNTDOWN_SECONDS = 3

// ── Shared button styles ────────────────────────────────────────────────────
const btnPrimary = {
  background: 'var(--red)',
  border: 'none',
  borderRadius: 14,
  padding: '13px 30px',
  color: '#fff',
  fontSize: '1.3rem',
  fontWeight: 700,
  boxShadow: '0 6px 0 var(--red-dark)',
  letterSpacing: '0.3px',
}
const btnSecondary = {
  background: 'rgba(255,255,255,0.08)',
  border: '1.5px solid rgba(255,255,255,0.3)',
  borderRadius: 12,
  padding: '11px 22px',
  color: '#fff',
  fontSize: '1.15rem',
  boxShadow: '0 4px 0 rgba(0,0,0,0.35)',
}

export default function Photobooth() {
  const { videoRef, status, errorMsg, start, flip, facingMode } = useCamera()
  const [filterId,     setFilterId]     = useState('normal')
  const [themeId,      setThemeId]      = useState('classic-black')
  const [shots,        setShots]        = useState([])
  const [countdown,    setCountdown]    = useState(null)
  const [isCapturing,  setIsCapturing]  = useState(false)

  const filter = COLOR_FILTERS.find(f => f.id === filterId) ?? COLOR_FILTERS[0]
  const theme  = STRIP_THEMES.find(t => t.id === themeId)  ?? STRIP_THEMES[0]

  useEffect(() => { if (status === 'idle') start() }, [])

  // ── Capture one shot with countdown ──────────────────────────────────────
  const takeOneShot = () =>
    new Promise((resolve) => {
      let n = COUNTDOWN_SECONDS
      setCountdown(n)
      const timer = setInterval(() => {
        n -= 1
        if (n <= 0) {
          clearInterval(timer)
          setCountdown(null)
          const dataUrl = captureFrame(videoRef.current, { filterId, facingMode })
          resolve(dataUrl)
        } else {
          setCountdown(n)
        }
      }, 1000)
    })

  const startSession = async () => {
    setShots([])
    setIsCapturing(true)
    const results = []
    for (let i = 0; i < SHOTS_NEEDED; i++) {
      const shot = await takeOneShot()
      if (shot) { results.push(shot); setShots([...results]) }
      if (i < SHOTS_NEEDED - 1) await new Promise(r => setTimeout(r, 500))
    }
    setIsCapturing(false)
  }

  const retake = () => setShots([])

  // ── Download strip to PNG ──────────────────────────────────────────────────
  const downloadStrip = async () => {
    // Strip dimensions – narrower, more photo-booth like
    const stripW   = 300
    const photoH   = 220
    const padding  = 14
    const gap      = 8
    const footerH  = 72
    const totalH   = padding * 2 + photoH * SHOTS_NEEDED + gap * (SHOTS_NEEDED - 1) + footerH

    const canvas = document.createElement('canvas')
    canvas.width  = stripW
    canvas.height = totalH
    const ctx = canvas.getContext('2d')

    // Paper background
    ctx.fillStyle = theme.paper
    ctx.fillRect(0, 0, stripW, totalH)

    // Optional polkadot pattern on strip background
    if (theme.dotColor) {
      drawPolkaDots(ctx, stripW, totalH, theme.dotColor, 20, 4)
    }

    // Outer border
    ctx.strokeStyle = theme.accent
    ctx.lineWidth   = 4
    ctx.strokeRect(2, 2, stripW - 4, totalH - 4)

    // Photos
    for (let i = 0; i < shots.length; i++) {
      const img = await loadImage(shots[i])
      const x   = padding
      const y   = padding + i * (photoH + gap)
      const w   = stripW - padding * 2

      drawCover(ctx, img, x, y, w, photoH)

      // Apply the selected filter to each photo area
      if (filterId !== 'normal') {
        const imageData = ctx.getImageData(x, y, w, photoH)
        const tmp = document.createElement('canvas')
        tmp.width = w; tmp.height = photoH
        const tCtx = tmp.getContext('2d')
        tCtx.putImageData(imageData, 0, 0)
        applyManualFilter(tCtx, w, photoH, filterId)
        ctx.drawImage(tmp, x, y)
      }

      // Photo border
      ctx.strokeStyle = theme.accent
      ctx.lineWidth   = 2
      ctx.strokeRect(x, y, w, photoH)
    }

    // Footer text
    ctx.fillStyle  = theme.text
    ctx.textAlign  = 'center'
    ctx.font       = '700 22px Georgia, serif'
    ctx.fillText('GaleriKami', stripW / 2, totalH - footerH / 2 + 6)
    ctx.font       = '14px Georgia, serif'
    ctx.fillText(new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }), stripW / 2, totalH - footerH / 2 + 26)

    const link      = document.createElement('a')
    link.download   = `galerikami-photobooth-${Date.now()}.png`
    link.href       = canvas.toDataURL('image/png')
    link.click()
  }

  // ── CSS video transform: only mirror for front camera ────────────────────
  const videoStyle = {
    width: '100%', height: '100%', objectFit: 'cover',
    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
    filter: filter.css !== 'none' ? filter.css : undefined,
    transition: 'filter 0.15s ease',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Photobooth" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px', gap: 14 }}>

          {/* ── Viewfinder ── */}
          <div style={{
            position: 'relative',
            width: '100%', maxWidth: 420, aspectRatio: '4/3',
            borderRadius: 14, overflow: 'hidden',
            border: '3px solid var(--red)',
            background: '#000',
            boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
          }}>
            <video ref={videoRef} playsInline muted autoPlay style={videoStyle} />

            {countdown !== null && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)',
                fontFamily: 'var(--font-heading)',
                fontSize: '5.5rem', fontWeight: 800,
                color: '#fff',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
              }}>
                {countdown}
              </div>
            )}

            {/* Shot counter badge */}
            {isCapturing && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'var(--red)', color: '#fff',
                borderRadius: 20, padding: '3px 11px',
                fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700,
              }}>
                {shots.length + (countdown !== null ? 0 : 1)}/{SHOTS_NEEDED}
              </div>
            )}
          </div>

          {/* ── Flip camera ── */}
          <button onClick={flip} style={btnSecondary}>
            🔄 balik kamera
          </button>

          {/* ── Filter warna ── */}
          <div style={{ width: '100%', maxWidth: 420 }}>
            <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.25rem', margin: '0 0 8px', opacity: 0.85 }}>Filter warna</p>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
              {COLOR_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterId(f.id)}
                  style={{
                    flex: '0 0 auto',
                    background: filterId === f.id ? 'var(--red)' : 'rgba(255,255,255,0.07)',
                    border: filterId === f.id ? '2px solid var(--red-bright)' : '1.5px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '7px 13px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    boxShadow: filterId === f.id ? '0 3px 0 var(--red-dark)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tema kertas ── */}
          <div style={{ width: '100%', maxWidth: 420 }}>
            <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.25rem', margin: '0 0 8px', opacity: 0.85 }}>Tema strip</p>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
              {STRIP_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  style={{
                    flex: '0 0 auto',
                    background: t.paper,
                    border: themeId === t.id ? '2.5px solid var(--white)' : '1.5px solid rgba(255,255,255,0.2)',
                    color: t.text,
                    borderRadius: 10,
                    padding: '7px 13px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.85rem',
                    boxShadow: themeId === t.id ? '0 0 0 3px var(--red)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tombol utama ── */}
          {shots.length < SHOTS_NEEDED ? (
            <button
              onClick={startSession}
              disabled={isCapturing}
              style={{ ...btnPrimary, opacity: isCapturing ? 0.6 : 1, fontSize: '1.25rem' }}
            >
              {isCapturing ? '⏳ sedang memotret…' : '📷 mulai sesi (4 foto)'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={retake}       style={btnSecondary}>🔄 ulangi</button>
              <button onClick={downloadStrip} style={btnPrimary}>⬇️ unduh strip</button>
            </div>
          )}

          {/* ── Preview strip (lebih kecil / proporsional) ── */}
          {shots.length > 0 && (
            <div style={{
              background: theme.paper,
              border: `3px solid ${theme.accent}`,
              borderRadius: 10,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              width: '100%',
              maxWidth: 180,   // lebih kecil dari sebelumnya (260)
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              position: 'relative',
            }}>
              {/* polkadot overlay di preview */}
              {theme.dotColor && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden',
                  backgroundImage: `radial-gradient(${theme.dotColor} 2px, transparent 2.5px)`,
                  backgroundSize: '18px 18px',
                  pointerEvents: 'none',
                  opacity: 0.35,
                }} />
              )}

              {shots.map((s, i) => (
                <img
                  key={i}
                  src={s}
                  alt={`foto ${i + 1}`}
                  style={{
                    width: '100%',
                    borderRadius: 3,
                    border: `1.5px solid ${theme.accent}`,
                    display: 'block',
                  }}
                />
              ))}
              <p style={{
                fontFamily: 'var(--font-caption)',
                fontSize: '1rem',
                textAlign: 'center',
                color: theme.text,
                margin: 0,
              }}>
                GaleriKami
              </p>
            </div>
          )}

        </div>
      </CameraPermissionGate>
    </div>
  )
}
