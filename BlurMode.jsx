import React, { useEffect, useRef, useState } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate } from './Shared.jsx'
import { createHandDetector } from '../utils/handDetection.js'

export default function BlurMode() {
  const { videoRef, status, errorMsg, start, flip } = useCamera()
  const [filterId, setFilterId] = useState('normal')
  const [isPeace, setIsPeace] = useState(false)
  const [detectorReady, setDetectorReady] = useState(false)
  const [photos, setPhotos] = useState([])
  const detectorRef = useRef(null)

  const filter = COLOR_FILTERS.find((f) => f.id === filterId)

  useEffect(() => {
    if (status === 'idle') start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'granted' || !videoRef.current) return undefined
    const detector = createHandDetector(videoRef.current, (hasPeace) => {
      setIsPeace(hasPeace)
    })
    detectorRef.current = detector
    try {
      detector.start()
      setDetectorReady(true)
    } catch (e) {
      setDetectorReady(false)
    }
    return () => {
      detector.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const combinedFilter = isPeace
    ? `blur(14px) ${filter.css === 'none' ? '' : filter.css}`
    : filter.css

  const manualCapture = () => {
    const dataUrl = captureFrame(videoRef.current, {
      mirror: true,
      filterCss: combinedFilter,
    })
    setPhotos((p) => [dataUrl, ...p])
  }

  const downloadPhoto = (src) => {
    const link = document.createElement('a')
    link.download = `galerikami-blur-${Date.now()}.png`
    link.href = src
    link.click()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Blur" />
      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px', gap: 16 }}>
          <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.35rem', textAlign: 'center', maxWidth: 420, margin: 0 }}>
            Acungkan tangan dengan pose peace ke kamera, layar otomatis blur. Turunkan tangan, kamera kembali normal.
          </p>

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
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                filter: combinedFilter,
                transition: 'filter 0.15s ease',
              }}
            />
            {isPeace && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: 'var(--red)',
                  color: 'var(--white)',
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1.1rem',
                }}
              >
                peace terdeteksi
              </div>
            )}
            {!detectorReady && status === 'granted' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  right: 10,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'var(--white)',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontFamily: 'var(--font-caption)',
                  fontSize: '1rem',
                  textAlign: 'center',
                }}
              >
                memuat pendeteksi tangan...
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

          <button
            onClick={manualCapture}
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

          {photos.length > 0 && (
            <div style={{ width: '100%', maxWidth: 420, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p} alt={`hasil ${i}`} style={{ width: '100%', borderRadius: 8, border: '2px solid var(--red)' }} />
                  <button
                    onClick={() => downloadPhoto(p)}
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      background: 'var(--red)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontFamily: 'var(--font-caption)',
                      fontSize: '0.95rem',
                    }}
                  >
                    unduh
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CameraPermissionGate>
    </div>
  )
}
