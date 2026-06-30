import React, { useState, useEffect, useRef } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS, STRIP_THEMES, drawPolkaDots } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate, ClickyButton } from './Shared.jsx'

const SHOTS_NEEDED = 4
const COUNTDOWN_SECONDS = 3

export default function Photobooth() {
  const { videoRef, status, errorMsg, start, flip, facingMode } = useCamera()
  const [filterId, setFilterId] = useState('normal')
  const [themeId, setThemeId] = useState('classic-black')
  const [shots, setShots] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const filter = COLOR_FILTERS.find((f) => f.id === filterId)
  const theme = STRIP_THEMES.find((t) => t.id === themeId)

  // Mirror: kamera depan (user) di-mirror, kamera belakang (environment) tidak
  const shouldMirror = facingMode === 'user'

  useEffect(() => {
    if (status === 'idle') start()
  }, []) // eslint-disable-line

  const takeOneShot = () =>
    new Promise((resolve) => {
      let n = COUNTDOWN_SECONDS
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
      results.push(shot)
      setShots([...results])
      if (i < SHOTS_NEEDED - 1) await new Promise((r) => setTimeout(r, 500))
    }
    setIsCapturing(false)
    // Pastikan stream tetap hidup setelah selesai foto
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {})
    }
  }

  const retake = () => setShots([])

  // ─── download strip ─────────────────────────────────────────────────────────
  const downloadStrip = async () => {
    // Ukuran strip mirip photobooth asli: portrait sempit, foto hampir square
    const stripW = 320
    const photoW = 280
    const photoH = 210  // rasio 4:3
    const padV = 18     // padding atas & bawah
    const padH = (stripW - photoW) / 2
    const gap = 10
    const footerH = 70
    const totalH = padV + (photoH + gap) * SHOTS_NEEDED - gap + footerH + padV

    const canvas = document.createElement('canvas')
    canvas.width = stripW
    canvas.height = totalH
    const ctx = canvas.getContext('2d')

    // background kertas
    ctx.fillStyle = theme.paper
    ctx.fillRect(0, 0, stripW, totalH)

    // polkadot (kalau ada)
    if (theme.dotColor) {
      drawPolkaDots(ctx, stripW, totalH, theme.dotColor, { gap: 20, radius: 4 })
    }

    // border strip
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, stripW - 4, totalH - 4)

    for (let i = 0; i < shots.length; i++) {
      const img = await loadImage(shots[i])
      const y = padV + i * (photoH + gap)
      drawCover(ctx, img, padH, y, photoW, photoH)
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = 2
      ctx.strokeRect(padH, y, photoW, photoH)
    }

    // footer
    const footerY = totalH - footerH - padV + 16
    ctx.fillStyle = theme.text
    ctx.textAlign = 'center'
    ctx.font = `700 18px Georgia, serif`
    ctx.fillText('GaleriKami', stripW / 2, footerY)
    ctx.font = `13px Georgia, serif`
    ctx.fillText(new Date().toLocaleDateString('id-ID'), stripW / 2, footerY + 22)

    const link = document.createElement('a')
    link.download = `galerikami-photobooth-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Photobooth" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 18px 24px', gap: 14 }}>

          {/* viewfinder */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 400,
            aspectRatio: '4/3',
            borderRadius: 14,
            overflow: 'hidden',
            border: '2.5px solid var(--red)',
            background: '#000',
            boxShadow: '0 0 24px rgba(193,18,31,0.2)',
          }}>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                // Mirror hanya saat kamera depan
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
                  fontSize: '7rem', fontWeight: 800, color: 'var(--white)',
                  textShadow: '0 0 30px rgba(193,18,31,0.8)',
                  lineHeight: 1,
                }}>
                  {countdown}
                </span>
              </div>
            )}
            {isCapturing && countdown === null && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                background: 'var(--red)', color: '#fff',
                fontFamily: 'var(--font-caption)', fontSize: '0.85rem',
                padding: '3px 10px', borderRadius: 6,
              }}>
                foto {shots.length + 1}/{SHOTS_NEEDED}
              </div>
            )}
          </div>

          {/* tombol balik kamera */}
          <ClickyButton variant="secondary" onClick={flip} style={{ padding: '8px 20px', fontSize: '1rem' }}>
            🔄 balik kamera
          </ClickyButton>

          {/* filter */}
          <div style={{ width: '100%', maxWidth: 400 }}>
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
                    color: 'var(--white)',
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

          {/* tema strip */}
          <div style={{ width: '100%', maxWidth: 400 }}>
            <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.1rem', margin: '0 0 6px', opacity: 0.8 }}>Tema Strip</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {STRIP_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  style={{
                    flex: '0 0 auto',
                    background: t.paper,
                    backgroundImage: t.dotColor
                      ? `radial-gradient(${t.dotColor} 2px, transparent 2.5px)`
                      : 'none',
                    backgroundSize: t.dotColor ? '12px 12px' : undefined,
                    border: themeId === t.id ? '3px solid var(--white)' : `2px solid ${t.accent}`,
                    color: t.text,
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontFamily: 'var(--font-caption)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'transform 0.08s',
                    transform: themeId === t.id ? 'scale(1.06)' : 'scale(1)',
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* aksi */}
          {shots.length < SHOTS_NEEDED ? (
            <ClickyButton onClick={startSession} disabled={isCapturing} style={{ minWidth: 200, marginTop: 4 }}>
              {isCapturing ? `sedang memotret… (${shots.length}/${SHOTS_NEEDED})` : '📷 mulai sesi (4 foto)'}
            </ClickyButton>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <ClickyButton variant="secondary" onClick={retake}>🔁 ulangi</ClickyButton>
              <ClickyButton onClick={downloadStrip}>⬇ unduh strip</ClickyButton>
            </div>
          )}

          {/* preview strip */}
          {shots.length > 0 && (
            <div style={{
              background: theme.paper,
              backgroundImage: theme.dotColor
                ? `radial-gradient(${theme.dotColor} 2px, transparent 2.5px)`
                : 'none',
              backgroundSize: theme.dotColor ? '16px 16px' : undefined,
              border: `3px solid ${theme.accent}`,
              borderRadius: 10,
              padding: '12px 10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              width: '100%',
              maxWidth: 200,
            }}>
              {shots.map((s, i) => (
                <img
                  key={i}
                  src={s}
                  alt={`foto ${i + 1}`}
                  style={{ width: '100%', borderRadius: 3, border: `1.5px solid ${theme.accent}`, display: 'block' }}
                />
              ))}
              <p style={{
                fontFamily: 'var(--font-caption)',
                fontSize: '1rem',
                textAlign: 'center',
                color: theme.text,
                margin: '4px 0 0',
              }}>
                GaleriKami · {new Date().toLocaleDateString('id-ID')}
              </p>
            </div>
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
