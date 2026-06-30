import React, { useState, useEffect, useRef } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS, STRIP_THEMES } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate } from './Shared.jsx'

const SHOTS_NEEDED = 4
const COUNTDOWN_SECONDS = 3

export default function Photobooth() {
  const { videoRef, status, errorMsg, start, flip, diagnostics } = useCamera()
  const [filterId, setFilterId] = useState('normal')
  const [themeId, setThemeId] = useState('classic-black')
  const [shots, setShots] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const stripRef = useRef(null)

  const filter = COLOR_FILTERS.find((f) => f.id === filterId)
  const theme = STRIP_THEMES.find((t) => t.id === themeId)

  useEffect(() => {
    if (status === 'idle') start()
  }, [])

  const takeOneShot = () =>
    new Promise((resolve) => {
      let n = COUNTDOWN_SECONDS
      setCountdown(n)
      const timer = setInterval(() => {
        n -= 1
        if (n <= 0) {
          clearInterval(timer)
          setCountdown(null)
          const dataUrl = captureFrame(videoRef.current, { mirror: true, filterCss: filter.css })
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
      await new Promise((r) => setTimeout(r, 600))
    }
    setIsCapturing(false)
  }

  const retake = () => setShots([])

  const downloadStrip = async () => {
    const stripWidth = 480
    const photoHeight = 360
    const padding = 24
    const gap = 16
    const footerHeight = 90
    const totalH = padding * 2 + photoHeight * SHOTS_NEEDED + gap * (SHOTS_NEEDED - 1) + footerHeight

    const canvas = document.createElement('canvas')
    canvas.width = stripWidth
    canvas.height = totalH
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = theme.paper
    ctx.fillRect(0, 0, stripWidth, totalH)

    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, stripWidth - 6, totalH - 6)

    for (let i = 0; i < shots.length; i++) {
      const img = await loadImage(shots[i])
      const y = padding + i * (photoHeight + gap)
      const x = padding
      const w = stripWidth - padding * 2
      drawCover(ctx, img, x, y, w, photoHeight)
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, w, photoHeight)
    }

    ctx.fillStyle = theme.text
    ctx.textAlign = 'center'
    ctx.font = '700 30px Georgia, serif'
    ctx.fillText('GaleriKami', stripWidth / 2, totalH - 38)
    ctx.font = '20px Georgia, serif'
    ctx.fillText(new Date().toLocaleDateString('id-ID'), stripWidth / 2, totalH - 12)

    const link = document.createElement('a')
    link.download = `galerikami-photobooth-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Photobooth" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px', gap: 18 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
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

          <pre
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#1a1a1a',
              color: '#9eff9e',
              fontSize: '0.75rem',
              padding: 10,
              borderRadius: 8,
              overflowX: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(diagnostics, null, 2)}
          </pre>

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

          <div style={{ width: '100%', maxWidth: 420 }}>
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

          <div style={{ width: '100%', maxWidth: 420 }}>
            <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.3rem', margin: '0 0 8px' }}>Tema kertas</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {STRIP_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  style={{
                    flex: '0 0 auto',
                    background: t.paper,
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

          {shots.length < SHOTS_NEEDED ? (
            <button
              onClick={startSession}
              disabled={isCapturing}
              style={{
                background: 'var(--red)',
                border: '2px solid var(--red-bright)',
                borderRadius: 12,
                padding: '14px 34px',
                color: 'var(--white)',
                fontSize: '1.4rem',
                fontWeight: 700,
                boxShadow: '0 5px 0 var(--red-dark)',
                opacity: isCapturing ? 0.7 : 1,
              }}
            >
              {isCapturing ? 'sedang memotret...' : 'mulai sesi (4 foto)'}
            </button>
          ) : (
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
                onClick={downloadStrip}
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
                unduh strip
              </button>
            </div>
          )}

          {shots.length > 0 && (
            <div
              ref={stripRef}
              style={{
                background: theme.paper,
                border: `4px solid ${theme.accent}`,
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: '100%',
                maxWidth: 260,
              }}
            >
              {shots.map((s, i) => (
                <img
                  key={i}
                  src={s}
                  alt={`foto ${i + 1}`}
                  style={{ width: '100%', borderRadius: 4, border: `2px solid ${theme.accent}` }}
                />
              ))}
              <p
                style={{
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  color: theme.text,
                  margin: 0,
                }}
              >
                GaleriKami
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
