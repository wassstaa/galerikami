import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate, ClickyButton } from './Shared.jsx'
import { createHandDetector } from '../utils/handDetection.js'

export default function BlurMode() {
  const { videoRef, status, errorMsg, start, flip, facingMode, getStream } = useCamera()
  const [filterId, setFilterId] = useState('normal')
  const [isPeace, setIsPeace] = useState(false)
  const [detectorReady, setDetectorReady] = useState(false)
  const [photos, setPhotos] = useState([])

  // ── video recording state ──
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState([])
  const [videos, setVideos] = useState([])
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const detectorRef = useRef(null)
  const filter = COLOR_FILTERS.find((f) => f.id === filterId)
  const shouldMirror = facingMode === 'user'

  // Filter gabungan: peace → tambah blur di atas filter yang dipilih
  const combinedFilter = isPeace
    ? `blur(14px)${filter.css !== 'none' ? ' ' + filter.css : ''}`
    : filter.css === 'none' ? undefined : filter.css

  useEffect(() => {
    if (status === 'idle') start()
  }, []) // eslint-disable-line

  // Mulai detektor setelah kamera aktif
  useEffect(() => {
    if (status !== 'granted' || !videoRef.current) return
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
      setDetectorReady(false)
    }
  }, [status]) // eslint-disable-line

  // ── rekam video ─────────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const stream = getStream()
    if (!stream) return
    chunksRef.current = []

    let mimeType = 'video/webm;codecs=vp8'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : ''
    }

    const opts = mimeType ? { mimeType } : {}
    let recorder
    try {
      recorder = new MediaRecorder(stream, opts)
    } catch (e) {
      recorder = new MediaRecorder(stream)
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setVideos((v) => [{ url, blob }, ...v])
      setRecordedChunks([])
    }
    recorder.start(100) // timeslice 100ms
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }, [getStream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsRecording(false)
    }
  }, [isRecording])

  const downloadVideo = (item) => {
    const a = document.createElement('a')
    a.href = item.url
    a.download = `galerikami-blur-${Date.now()}.webm`
    a.click()
  }

  // ── foto manual ─────────────────────────────────────────────────────────────
  const manualCapture = () => {
    const dataUrl = captureFrame(videoRef.current, {
      mirror: shouldMirror,
      filterCss: combinedFilter || 'none',
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 18px 28px', gap: 14 }}>

          <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.1rem', textAlign: 'center', maxWidth: 400, margin: 0, opacity: 0.8 }}>
            Acungkan pose ✌️ ke kamera — layar otomatis blur. Foto atau rekam videomu!
          </p>

          {/* viewfinder */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 400,
            aspectRatio: '4/3',
            borderRadius: 14,
            overflow: 'hidden',
            border: isRecording ? '2.5px solid #ff4444' : '2.5px solid var(--red)',
            background: '#000',
            boxShadow: isRecording
              ? '0 0 0 3px rgba(255,68,68,0.4)'
              : '0 0 20px rgba(193,18,31,0.18)',
            transition: 'box-shadow 0.2s',
          }}>
            <video
              ref={videoRef}
              playsInline muted autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: shouldMirror ? 'scaleX(-1)' : 'none',
                filter: combinedFilter,
                transition: 'filter 0.18s ease',
              }}
            />

            {/* badge peace */}
            {isPeace && (
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'var(--red)', color: '#fff',
                padding: '4px 12px', borderRadius: 8,
                fontFamily: 'var(--font-caption)', fontSize: '0.95rem',
                backdropFilter: 'blur(4px)',
              }}>
                ✌️ peace!
              </div>
            )}

            {/* badge rec */}
            {isRecording && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.65)', color: '#ff4444',
                padding: '4px 10px', borderRadius: 8,
                fontFamily: 'monospace', fontSize: '0.85rem',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ff4444',
                  animation: 'pulse 1s infinite',
                }} />
                REC
              </div>
            )}

            {!detectorReady && status === 'granted' && (
              <div style={{
                position: 'absolute', bottom: 8, left: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', color: '#fff',
                padding: '6px 10px', borderRadius: 8,
                fontFamily: 'var(--font-caption)', fontSize: '0.9rem',
                textAlign: 'center',
              }}>
                memuat detektor tangan…
              </div>
            )}
          </div>

          {/* balik kamera */}
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

          {/* kontrol foto + video */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ClickyButton onClick={manualCapture} disabled={isRecording}>
              📷 foto
            </ClickyButton>

            {!isRecording ? (
              <ClickyButton
                onClick={startRecording}
                style={{ background: '#8c0000', border: '2px solid #ff4444', boxShadow: '0 4px 0 #4a0000' }}
              >
                ⏺ rekam video
              </ClickyButton>
            ) : (
              <ClickyButton
                onClick={stopRecording}
                style={{ background: '#ff4444', border: '2px solid #ff8888', boxShadow: '0 4px 0 #880000' }}
              >
                ⏹ stop
              </ClickyButton>
            )}
          </div>

          {/* galeri foto */}
          {photos.length > 0 && (
            <div style={{ width: '100%', maxWidth: 400 }}>
              <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1rem', margin: '0 0 8px', opacity: 0.7 }}>
                Foto ({photos.length})
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={p}
                      alt={`foto ${i}`}
                      style={{ width: '100%', borderRadius: 8, border: '1.5px solid var(--red)', display: 'block' }}
                    />
                    <button
                      onClick={() => downloadPhoto(p)}
                      style={{
                        position: 'absolute', bottom: 5, right: 5,
                        background: 'var(--red)', color: '#fff',
                        border: 'none', borderRadius: 6,
                        padding: '3px 8px',
                        fontFamily: 'var(--font-caption)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      ⬇
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* galeri video */}
          {videos.length > 0 && (
            <div style={{ width: '100%', maxWidth: 400 }}>
              <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1rem', margin: '0 0 8px', opacity: 0.7 }}>
                Video ({videos.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {videos.map((v, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #ff4444' }}>
                    <video
                      src={v.url}
                      controls
                      style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'contain', background: '#000' }}
                    />
                    <button
                      onClick={() => downloadVideo(v)}
                      style={{
                        position: 'absolute', bottom: 5, right: 5,
                        background: '#ff4444', color: '#fff',
                        border: 'none', borderRadius: 6,
                        padding: '3px 10px',
                        fontFamily: 'var(--font-caption)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                    >
                      ⬇ video
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </CameraPermissionGate>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
