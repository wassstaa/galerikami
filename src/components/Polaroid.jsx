import React, { useEffect, useRef, useState } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS, POLAROID_THEMES } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate } from './Shared.jsx'
import { loadImage, drawCover, drawPolkaDots, applyManualFilter } from '../utils/canvasHelpers.js'

const btnPrimary = {
  background: 'var(--red)', border: 'none', borderRadius: 14,
  padding: '12px 28px', color: '#fff', fontSize: '1.2rem', fontWeight: 700,
  boxShadow: '0 6px 0 var(--red-dark)', letterSpacing: '0.3px',
}
const btnSecondary = {
  background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.3)',
  borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: '1.1rem',
  boxShadow: '0 4px 0 rgba(0,0,0,0.35)',
}

// Format tanggal Indonesia
function formatDate() {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Polaroid() {
  const { videoRef, status, errorMsg, start, flip, facingMode } = useCamera()
  const [filterId,   setFilterId]   = useState('normal')
  const [themeId,    setThemeId]    = useState('polkadot-black-pink')
  const [caption,    setCaption]    = useState('')
  const [photo,      setPhoto]      = useState(null)
  const [countdown,  setCountdown]  = useState(null)
  const capturedDate = useRef('')

  const filter = COLOR_FILTERS.find(f => f.id === filterId) ?? COLOR_FILTERS[0]
  const theme  = POLAROID_THEMES.find(t => t.id === themeId) ?? POLAROID_THEMES[0]

  useEffect(() => { if (status === 'idle') start() }, [])

  // ── Take photo with countdown ──────────────────────────────────────────────
  const takeShot = () => {
    let n = 3
    setCountdown(n)
    const timer = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(timer)
        setCountdown(null)
        capturedDate.current = formatDate()
        const dataUrl = captureFrame(videoRef.current, { filterId, facingMode })
        if (dataUrl) setPhoto(dataUrl)
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  const retake = () => { setPhoto(null); setCaption('') }

  // ── Download real-polaroid PNG ─────────────────────────────────────────────
  const downloadPolaroid = async () => {
    // Real polaroid proportions:
    //   total: 3.5" × 4.2" → ratio 1 : 1.2
    //   photo area: 3.1" × 3.1" (square)
    //   borders: equal on top/left/right (~0.2"), larger on bottom (~0.9")
    const W          = 600
    const H          = 720
    const sideMargin = 30
    const topMargin  = 30
    const bottomH    = 140          // thick bottom border
    const photoW     = W - sideMargin * 2
    const photoH     = H - topMargin - bottomH

    const canvas = document.createElement('canvas')
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // ── Backdrop (polkadot or solid) ──────────────────────────────────────
    ctx.fillStyle = theme.background
    ctx.fillRect(0, 0, W, H)
    if (theme.dotColor) {
      drawPolkaDots(ctx, W, H, theme.dotColor, 28, 5.5)
    }

    // ── White polaroid paper ──────────────────────────────────────────────
    const paperX = sideMargin - 8
    const paperW = W - (sideMargin - 8) * 2
    const paperY = topMargin - 8
    const paperH = H - (topMargin - 8) * 2
    ctx.fillStyle = '#fefcf8'
    // Rounded corners via clip
    ctx.save()
    roundRect(ctx, paperX, paperY, paperW, paperH, 4)
    ctx.fill()
    ctx.restore()

    // ── Photo (square crop) ──────────────────────────────────────────────
    const img = await loadImage(photo)
    // Crop to square from the centre
    const squareSide = Math.min(photoW, photoH)
    const photoX0    = sideMargin + (photoW - squareSide) / 2
    const photoY0    = topMargin

    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX0, photoY0, squareSide, photoH)
    ctx.clip()

    const { sx, sy, sw, sh } = squareCrop(img)
    ctx.drawImage(img, sx, sy, sw, sh, photoX0, photoY0, squareSide, photoH)
    ctx.restore()

    // Apply colour filter
    if (filterId !== 'normal') {
      // Extract the photo region, filter, put back
      const tmp  = document.createElement('canvas')
      tmp.width  = squareSide
      tmp.height = photoH
      const tCtx = tmp.getContext('2d')
      tCtx.drawImage(canvas, photoX0, photoY0, squareSide, photoH, 0, 0, squareSide, photoH)
      applyManualFilter(tCtx, squareSide, photoH, filterId)
      ctx.drawImage(tmp, photoX0, photoY0)
    }

    // Subtle photo border
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth   = 1
    ctx.strokeRect(photoX0, photoY0, squareSide, photoH)

    // ── Bottom white area – caption & date ───────────────────────────────
    const bottomY = topMargin + photoH
    const centerX = W / 2

    ctx.fillStyle  = '#111'
    ctx.textAlign  = 'center'
    ctx.textBaseline = 'middle'

    const captionText = caption || 'GaleriKami'
    ctx.font = `italic 700 28px 'Georgia', serif`
    ctx.fillText(captionText, centerX, bottomY + 44)

    ctx.font = '17px Georgia, serif'
    ctx.fillStyle = '#777'
    ctx.fillText(capturedDate.current || formatDate(), centerX, bottomY + 80)

    const link      = document.createElement('a')
    link.download   = `galerikami-polaroid-${Date.now()}.png`
    link.href       = canvas.toDataURL('image/png')
    link.click()
  }

  // CSS mirror only for front camera
  const videoStyle = {
    width: '100%', height: '100%', objectFit: 'cover',
    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
    filter: filter.css !== 'none' ? filter.css : undefined,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Polaroid" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px', gap: 14 }}>

          {!photo ? (
            <>
              {/* ── Viewfinder (square preview) ── */}
              <div style={{
                position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1/1',
                borderRadius: 14, overflow: 'hidden',
                border: '3px solid var(--red)', background: '#000',
                boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
              }}>
                <video ref={videoRef} playsInline muted autoPlay style={videoStyle} />
                {countdown !== null && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    fontFamily: 'var(--font-heading)', fontSize: '5.5rem', fontWeight: 800,
                    color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  }}>
                    {countdown}
                  </div>
                )}
              </div>

              <button onClick={flip} style={btnSecondary}>🔄 balik kamera</button>

              {/* Filter warna */}
              <div style={{ width: '100%', maxWidth: 380 }}>
                <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.2rem', margin: '0 0 7px', opacity: 0.85 }}>Filter warna</p>
                <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
                  {COLOR_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFilterId(f.id)}
                      style={{
                        flex: '0 0 auto',
                        background: filterId === f.id ? 'var(--red)' : 'rgba(255,255,255,0.07)',
                        border: filterId === f.id ? '2px solid var(--red-bright)' : '1.5px solid rgba(255,255,255,0.2)',
                        color: '#fff', borderRadius: 10, padding: '7px 12px',
                        fontFamily: 'var(--font-heading)', fontSize: '0.88rem',
                        boxShadow: filterId === f.id ? '0 3px 0 var(--red-dark)' : 'none',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema polaroid */}
              <div style={{ width: '100%', maxWidth: 380 }}>
                <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.2rem', margin: '0 0 7px', opacity: 0.85 }}>Tema latar</p>
                <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
                  {POLAROID_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      style={{
                        flex: '0 0 auto',
                        background: t.background,
                        border: themeId === t.id ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.2)',
                        color: '#fff', borderRadius: 10, padding: '7px 12px',
                        fontFamily: 'var(--font-heading)', fontSize: '0.85rem',
                        boxShadow: themeId === t.id ? '0 0 0 3px var(--red)' : 'none',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={takeShot} style={btnPrimary}>📷 ambil foto</button>
            </>
          ) : (
            <>
              {/* ── Real-polaroid preview ── */}
              <div style={{
                // Polkadot backdrop
                background: theme.background,
                ...(theme.dotColor ? {
                  backgroundImage: `radial-gradient(${theme.dotColor} 2.5px, transparent 3px)`,
                  backgroundSize: '22px 22px',
                } : {}),
                borderRadius: 14,
                padding: 20,
                boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
              }}>
                {/* Actual polaroid paper */}
                <div style={{
                  background: '#fefcf8',
                  borderRadius: 3,
                  padding: '10px 10px 0 10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.06)',
                  maxWidth: 280,
                }}>
                  {/* Square photo */}
                  <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: 2 }}>
                    <img
                      src={photo}
                      alt="polaroid"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  {/* Bottom white area – caption & date (written ON the polaroid) */}
                  <div style={{ padding: '10px 6px 16px', textAlign: 'center' }}>
                    <p style={{
                      fontFamily: 'var(--font-caption)',
                      fontSize: '1.55rem',
                      color: '#222',
                      margin: '0 0 2px',
                      lineHeight: 1.2,
                    }}>
                      {caption || 'GaleriKami'}
                    </p>
                    <p style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '0.72rem',
                      color: '#888',
                      margin: 0,
                      letterSpacing: '0.6px',
                    }}>
                      {capturedDate.current || formatDate()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Caption input */}
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="✍️ tulis caption…"
                maxLength={40}
                style={{
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.3rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  color: '#fff',
                  width: '100%',
                  maxWidth: 320,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={retake}          style={btnSecondary}>🔄 ulangi</button>
                <button onClick={downloadPolaroid} style={btnPrimary}>⬇️ unduh polaroid</button>
              </div>
            </>
          )}

        </div>
      </CameraPermissionGate>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function squareCrop(img) {
  const s = Math.min(img.width, img.height)
  return {
    sx: (img.width  - s) / 2,
    sy: (img.height - s) / 2,
    sw: s, sh: s,
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
