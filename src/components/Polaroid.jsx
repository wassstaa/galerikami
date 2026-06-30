import React, { useEffect, useState } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS, POLAROID_THEMES, drawPolkaDots } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate, ClickyButton } from './Shared.jsx'

export default function Polaroid() {
  const { videoRef, status, errorMsg, start, flip, facingMode } = useCamera()
  const [filterId, setFilterId] = useState('normal')
  const [themeId, setThemeId] = useState('polkadot-black-pink')
  const [caption, setCaption] = useState('')
  const [photo, setPhoto] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const filter = COLOR_FILTERS.find((f) => f.id === filterId)
  const theme = POLAROID_THEMES.find((t) => t.id === themeId)

  // Tanggal hari ini format Indonesia
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const shouldMirror = facingMode === 'user'

  useEffect(() => {
    if (status === 'idle') start()
  }, []) // eslint-disable-line

  const takeShot = () => {
    if (countdown !== null) return
    let n = 3
    setCountdown(n)
    const timer = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(timer)
        setCountdown(null)
        const dataUrl = captureFrame(videoRef.current, {
          mirror: shouldMirror,
          filterCss: filter.css,
        })
        setPhoto(dataUrl)
        // Pastikan stream tetap aktif setelah foto
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {})
        }
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  const retake = () => setPhoto(null)

  // ── download polaroid asli ───────────────────────────────────────────────────
  const downloadPolaroid = async () => {
    // Dimensi polaroid 600 film asli: 3.5" x 4.2" → kita scale 400x480px
    // area foto: ~3.5" x 3.5" → 400x400, border bawah lebih besar (ruang label)
    const W = 400
    const borderSide = 20   // kiri/kanan
    const borderTop = 20    // atas
    const borderBottom = 72 // bawah (ciri khas polaroid!)
    const photoW = W - borderSide * 2
    const photoH = photoW   // square
    const H = borderTop + photoH + borderBottom

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // ── background luar (motif/warna) ──
    ctx.fillStyle = theme.background
    ctx.fillRect(0, 0, W, H)
    if (theme.dotColor && theme.dotColor !== 'transparent') {
      drawPolkaDots(ctx, W, H, theme.dotColor, { gap: 24, radius: 4.5 })
    }

    // ── frame putih (bingkai fisik polaroid) ──
    const frameRadius = 6
    roundRect(ctx, 6, 6, W - 12, H - 12, frameRadius)
    ctx.fillStyle = '#f8f4ee'   // putih kekuningan, mirip polaroid asli
    ctx.fill()

    // ── area foto ──
    const img = await loadImage(photo)
    // Sedikit inset biar ada efek "ditempel"
    ctx.save()
    ctx.beginPath()
    ctx.rect(borderSide, borderTop, photoW, photoH)
    ctx.clip()
    drawCover(ctx, img, borderSide, borderTop, photoW, photoH)
    ctx.restore()

    // shadow tipis di dalam bingkai foto
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(borderSide, borderTop, photoW, photoH)

    // ── area bawah (label) ──
    const labelY = borderTop + photoH
    const labelMid = labelY + borderBottom / 2

    ctx.fillStyle = '#111'
    ctx.textAlign = 'center'
    ctx.font = `italic 600 ${Math.round(borderBottom * 0.3)}px Georgia, serif`
    ctx.fillText(caption || 'GaleriKami', W / 2, labelMid - 4)
    ctx.font = `${Math.round(borderBottom * 0.19)}px Georgia, serif`
    ctx.fillStyle = '#555'
    ctx.fillText(todayStr, W / 2, labelMid + Math.round(borderBottom * 0.22))

    const link = document.createElement('a')
    link.download = `galerikami-polaroid-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Polaroid" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 18px 28px', gap: 14 }}>

          {!photo ? (
            <>
              {/* viewfinder */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 380,
                aspectRatio: '4/3',
                borderRadius: 14,
                overflow: 'hidden',
                border: '2.5px solid var(--red)',
                background: '#000',
                boxShadow: '0 0 20px rgba(193,18,31,0.18)',
              }}>
                <video
                  ref={videoRef}
                  playsInline muted autoPlay
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    transform: shouldMirror ? 'scaleX(-1)' : 'none',
                    filter: filter.css === 'none' ? undefined : filter.css,
                  }}
                />
                {countdown !== null && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '7rem', fontWeight: 800, color: '#fff',
                      textShadow: '0 0 30px rgba(193,18,31,0.8)',
                      lineHeight: 1,
                    }}>{countdown}</span>
                  </div>
                )}
              </div>

              <ClickyButton variant="secondary" onClick={flip} style={{ padding: '8px 20px', fontSize: '1rem' }}>
                🔄 balik kamera
              </ClickyButton>

              {/* filter */}
              <div style={{ width: '100%', maxWidth: 380 }}>
                <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.1rem', margin: '0 0 6px', opacity: 0.8 }}>Filter</p>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {COLOR_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterId(f.id)}
                      style={{
                        flex: '0 0 auto',
                        background: filterId === f.id ? 'var(--red)' : '#1e1e1e',
                        border: filterId === f.id ? '2px solid var(--red-bright)' : '1.5px solid #333',
                        color: '#fff',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontFamily: 'var(--font-caption)',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'background 0.12s',
                        boxShadow: filterId === f.id ? '0 2px 0 var(--red-dark)' : 'none',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* tema */}
              <div style={{ width: '100%', maxWidth: 380 }}>
                <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.1rem', margin: '0 0 6px', opacity: 0.8 }}>Tema Polaroid</p>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {POLAROID_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      style={{
                        flex: '0 0 auto',
                        background: t.background,
                        backgroundImage: t.dotColor && t.dotColor !== 'transparent'
                          ? `radial-gradient(${t.dotColor} 2px, transparent 2.5px)`
                          : 'none',
                        backgroundSize: '12px 12px',
                        border: themeId === t.id ? '3px solid #fff' : `2px solid ${t.dotColor && t.dotColor !== 'transparent' ? t.dotColor : '#555'}`,
                        color: t.text,
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontFamily: 'var(--font-caption)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transform: themeId === t.id ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.09s',
                        minWidth: 90,
                        textAlign: 'center',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <ClickyButton onClick={takeShot} disabled={countdown !== null} style={{ minWidth: 180, marginTop: 4 }}>
                📸 ambil foto
              </ClickyButton>
            </>
          ) : (
            <>
              {/* preview polaroid asli */}
              <div style={{
                width: '100%',
                maxWidth: 280,
                background: theme.background,
                backgroundImage: theme.dotColor && theme.dotColor !== 'transparent'
                  ? `radial-gradient(${theme.dotColor} 3px, transparent 3.5px)`
                  : 'none',
                backgroundSize: '22px 22px',
                borderRadius: 8,
                padding: 8,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              }}>
                {/* frame polaroid */}
                <div style={{
                  background: '#f8f4ee',
                  borderRadius: 4,
                  padding: '10px 10px 48px 10px',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  <img
                    src={photo}
                    alt="polaroid"
                    style={{ width: '100%', display: 'block', borderRadius: 2 }}
                  />
                  <div style={{ textAlign: 'center', marginTop: 0, paddingTop: 10 }}>
                    <p style={{
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: '1.1rem',
                      color: '#111',
                      margin: '0 0 4px',
                    }}>
                      {caption || 'GaleriKami'}
                    </p>
                    <p style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '0.75rem',
                      color: '#666',
                      margin: 0,
                    }}>
                      {todayStr}
                    </p>
                  </div>
                </div>
              </div>

              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="tulis caption…"
                style={{
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.2rem',
                  background: '#1a1a1a',
                  border: '2px solid var(--red)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: '#fff',
                  width: '100%',
                  maxWidth: 280,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <ClickyButton variant="secondary" onClick={retake}>🔁 ulangi</ClickyButton>
                <ClickyButton onClick={downloadPolaroid}>⬇ unduh polaroid</ClickyButton>
              </div>
            </>
          )}
        </div>
      </CameraPermissionGate>
    </div>
  )
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

function drawCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sx, sy, sw, sh
  if (imgRatio > boxRatio) {
    sh = img.height; sw = sh * boxRatio
    sx = (img.width - sw) / 2; sy = 0
  } else {
    sw = img.width; sh = sw / boxRatio
    sx = 0; sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

// helper untuk rect rounded di canvas
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
