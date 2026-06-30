import React, { useEffect, useState } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS, POLAROID_THEMES } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate } from './Shared.jsx'

export default function Polaroid() {
  const { videoRef, status, errorMsg, start, flip } = useCamera()
  const [filterId, setFilterId] = useState('normal')
  const [themeId, setThemeId] = useState('polkadot-black-pink')
  const [caption, setCaption] = useState('')
  const [photo, setPhoto] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const filter = COLOR_FILTERS.find((f) => f.id === filterId)
  const theme = POLAROID_THEMES.find((t) => t.id === themeId)

  useEffect(() => {
    if (status === 'idle') start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const takeShot = () => {
    let n = 3
    setCountdown(n)
    const timer = setInterval(() => {
      n -= 1
      if (n <= 0) {
        clearInterval(timer)
        setCountdown(null)
        const dataUrl = captureFrame(videoRef.current, { mirror: true, filterCss: filter.css })
        setPhoto(dataUrl)
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  const retake = () => setPhoto(null)

  const downloadPolaroid = async () => {
    const W = 480
    const H = 580
    const margin = 28
    const photoH = 420
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // latar polaroid
    ctx.fillStyle = theme.background
    ctx.fillRect(0, 0, W, H)

    // polkadot
    if (theme.dotColor !== 'transparent') {
      drawPolkaDots(ctx, W, H, theme.dotColor)
    }

    // bingkai putih/krem di sekeliling foto
    ctx.fillStyle = theme.frame
    ctx.fillRect(margin - 10, margin - 10, W - (margin - 10) * 2, photoH + 20)

    const img = await loadImage(photo)
    drawCover(ctx, img, margin, margin, W - margin * 2, photoH)

    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(margin, margin, W - margin * 2, photoH)

    ctx.fillStyle = theme.text
    ctx.textAlign = 'center'
    ctx.font = 'italic 32px Georgia, serif'
    ctx.fillText(caption || 'GaleriKami', W / 2, H - 60)
    ctx.font = '18px Georgia, serif'
    ctx.fillText(new Date().toLocaleDateString('id-ID'), W / 2, H - 28)

    const link = document.createElement('a')
    link.download = `galerikami-polaroid-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Polaroid" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px', gap: 16 }}>
          {!photo ? (
            <>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 380,
                  aspectRatio: '4/3',
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '3px solid var(--red)',
                  background: '#000',
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    filter: filter.css,
                  }}
                />
                {countdown !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.35)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '5rem',
                      fontWeight: 800,
                      color: 'var(--white)',
                    }}
                  >
                    {countdown}
                  </div>
                )}
              </div>

              <button
                onClick={flip}
                style={{
                  background: 'transparent',
                  border: '2px solid var(--red)',
                  color: 'var(--white)',
                  borderRadius: 10,
                  padding: '8px 18px',
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.2rem',
                }}
              >
                balik kamera
              </button>

              <div style={{ width: '100%', maxWidth: 380 }}>
                <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.3rem', margin: '0 0 8px' }}>Filter warna</p>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {COLOR_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterId(f.id)}
                      style={{
                        flex: '0 0 auto',
                        background: filterId === f.id ? 'var(--red)' : 'var(--bg-black-soft)',
                        border: '2px solid var(--red)',
                        color: 'var(--white)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontFamily: 'var(--font-caption)',
                        fontSize: '1.05rem',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: 380 }}>
                <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.3rem', margin: '0 0 8px' }}>Tema polaroid</p>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {POLAROID_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      style={{
                        flex: '0 0 auto',
                        background: t.background,
                        border: themeId === t.id ? '3px solid var(--white)' : '2px solid var(--red)',
                        color: t.text,
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontFamily: 'var(--font-caption)',
                        fontSize: '1.05rem',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={takeShot}
                style={{
                  background: 'var(--red)',
                  border: '2px solid var(--red-bright)',
                  borderRadius: 12,
                  padding: '14px 34px',
                  color: 'var(--white)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  boxShadow: '0 5px 0 var(--red-dark)',
                }}
              >
                ambil foto
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '100%',
                  maxWidth: 320,
                  background: theme.background,
                  backgroundImage:
                    theme.dotColor !== 'transparent'
                      ? `radial-gradient(${theme.dotColor} 3px, transparent 3.5px)`
                      : 'none',
                  backgroundSize: '22px 22px',
                  borderRadius: 6,
                  padding: '16px 16px 50px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ background: theme.frame, padding: 8, borderRadius: 3 }}>
                  <img src={photo} alt="hasil polaroid" style={{ width: '100%', display: 'block', borderRadius: 2 }} />
                </div>
              </div>

              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="tulis caption..."
                style={{
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.4rem',
                  background: 'var(--bg-black-soft)',
                  border: '2px solid var(--red)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: 'var(--white)',
                  width: '100%',
                  maxWidth: 320,
                  textAlign: 'center',
                }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={retake}
                  style={{
                    background: 'transparent',
                    border: '2px solid var(--red)',
                    color: 'var(--white)',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontFamily: 'var(--font-caption)',
                    fontSize: '1.2rem',
                  }}
                >
                  ulangi
                </button>
                <button
                  onClick={downloadPolaroid}
                  style={{
                    background: 'var(--red)',
                    border: '2px solid var(--red-bright)',
                    color: 'var(--white)',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontFamily: 'var(--font-caption)',
                    fontSize: '1.2rem',
                  }}
                >
                  unduh polaroid
                </button>
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
    sh = img.height
    sw = sh * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function drawPolkaDots(ctx, w, h, color) {
  ctx.fillStyle = color
  const gap = 26
  const radius = 5
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
