import React, { useEffect, useRef, useState } from 'react'
import { useCamera, captureFrame } from '../utils/useCamera.js'
import { COLOR_FILTERS } from '../utils/themes.js'
import { ModeHeader, CameraPermissionGate } from './Shared.jsx'
import { createHandDetector } from '../utils/handDetection.js'

// ── Shared button styles ────────────────────────────────────────────────────
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
const btnDanger = {
  background: '#b91c1c', border: 'none', borderRadius: 14,
  padding: '12px 28px', color: '#fff', fontSize: '1.2rem', fontWeight: 700,
  boxShadow: '0 6px 0 #7f1d1d',
  animation: 'pulse 1.4s infinite',
}

export default function BlurMode() {
  const { videoRef, streamRef, status, errorMsg, start, flip, facingMode } = useCamera()
  const [filterId,       setFilterId]       = useState('normal')
  const [isPeace,        setIsPeace]        = useState(false)
  const [detectorReady,  setDetectorReady]  = useState(false)
  const [photos,         setPhotos]         = useState([])
  const [isRecording,    setIsRecording]    = useState(false)
  const [recordedVideos, setRecordedVideos] = useState([])
  const detectorRef       = useRef(null)
  const mediaRecorderRef  = useRef(null)
  const chunksRef         = useRef([])

  const filter = COLOR_FILTERS.find(f => f.id === filterId) ?? COLOR_FILTERS[0]

  // Start camera on mount
  useEffect(() => { if (status === 'idle') start() }, [])

  // Start hand-detection loop once camera is ready
  useEffect(() => {
    if (status !== 'granted' || !videoRef.current) return
    const detector = createHandDetector(videoRef.current, (hasPeace) => setIsPeace(hasPeace))
    detectorRef.current = detector
    detector.start()
    setDetectorReady(true)
    return () => { detector.stop(); detectorRef.current = null; setDetectorReady(false) }
  }, [status])

  // CSS filter applied to the live video (preview only)
  const combinedCss = isPeace
    ? `blur(14px)${filter.css !== 'none' ? ' ' + filter.css : ''}`
    : filter.css !== 'none' ? filter.css : undefined

  // ── Photo capture ──────────────────────────────────────────────────────────
  const manualCapture = () => {
    const dataUrl = captureFrame(videoRef.current, {
      filterId,
      facingMode,
      blurPx: isPeace ? 14 : 0,
    })
    if (dataUrl) setPhotos(p => [dataUrl, ...p])
  }

  const downloadPhoto = (src) => {
    const a = document.createElement('a')
    a.download = `galerikami-blur-${Date.now()}.png`
    a.href = src
    a.click()
  }

  // ── Video recording ────────────────────────────────────────────────────────
  const startRecording = () => {
    const stream = streamRef.current
    if (!stream) return

    const mimeType =
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')           ? 'video/webm'
      : 'video/mp4'

    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url  = URL.createObjectURL(blob)
      setRecordedVideos(prev => [{ url, mimeType }, ...prev])
    }
    recorder.start(200)
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const downloadVideo = ({ url, mimeType }) => {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const a = document.createElement('a')
    a.href = url
    a.download = `galerikami-video-${Date.now()}.${ext}`
    a.click()
  }

  const deleteVideo = (idx) => {
    setRecordedVideos(prev => {
      URL.revokeObjectURL(prev[idx].url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── CSS mirror: only for front camera ──────────────────────────────────────
  const videoStyle = {
    width: '100%', height: '100%', objectFit: 'cover',
    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
    filter: combinedCss,
    transition: 'filter 0.18s ease',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)' }}>
      <ModeHeader title="Blur" />

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 6px 0 #7f1d1d} 50%{box-shadow:0 6px 16px #ef4444} }
      `}</style>

      <CameraPermissionGate status={status} errorMsg={errorMsg} onRequest={() => start()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px', gap: 14 }}>

          <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.3rem', textAlign: 'center', maxWidth: 400, margin: 0, opacity: 0.85 }}>
            Tunjukkan ✌️ peace ke kamera → layar otomatis blur. Turunkan tangan → kembali normal.
          </p>

          {/* ── Viewfinder ── */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 420, aspectRatio: '4/3',
            borderRadius: 14, overflow: 'hidden',
            border: `3px solid ${isPeace ? '#ff8fb1' : 'var(--red)'}`,
            background: '#000',
            boxShadow: `0 6px 24px ${isPeace ? 'rgba(255,143,177,0.4)' : 'rgba(0,0,0,0.6)'}`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <video ref={videoRef} playsInline muted autoPlay style={videoStyle} />

            {/* Peace badge */}
            {isPeace && (
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'var(--pink)', color: '#000',
                padding: '4px 13px', borderRadius: 20,
                fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700,
              }}>
                ✌️ peace!
              </div>
            )}

            {/* Recording badge */}
            {isRecording && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: '#ef4444', color: '#fff',
                padding: '4px 13px', borderRadius: 20,
                fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                REC
              </div>
            )}

            {/* Loading hand detector */}
            {!detectorReady && status === 'granted' && (
              <div style={{
                position: 'absolute', bottom: 10, left: 10, right: 10,
                background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '6px 10px',
                borderRadius: 8, fontFamily: 'var(--font-heading)', fontSize: '0.85rem', textAlign: 'center',
              }}>
                ⏳ memuat pendeteksi tangan…
              </div>
            )}
          </div>

          {/* ── Flip camera ── */}
          <button onClick={flip} style={btnSecondary}>🔄 balik kamera</button>

          {/* ── Filter warna ── */}
          <div style={{ width: '100%', maxWidth: 420 }}>
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

          {/* ── Action row ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={manualCapture} style={btnPrimary}>📷 ambil foto</button>

            {!isRecording
              ? <button onClick={startRecording} style={{ ...btnSecondary, borderColor: '#ef4444', color: '#ef4444' }}>
                  ⏺️ mulai rekam
                </button>
              : <button onClick={stopRecording} style={btnDanger}>
                  ⏹️ stop rekam
                </button>
            }
          </div>

          {/* ── Photo gallery ── */}
          {photos.length > 0 && (
            <>
              <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.2rem', margin: '4px 0 0', opacity: 0.75 }}>Foto diambil</p>
              <div style={{ width: '100%', maxWidth: 420, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid var(--red)' }}>
                    <img src={p} alt={`hasil ${i}`} style={{ width: '100%', display: 'block' }} />
                    <button
                      onClick={() => downloadPhoto(p)}
                      style={{
                        position: 'absolute', bottom: 5, right: 5,
                        background: 'var(--red)', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '4px 10px',
                        fontFamily: 'var(--font-heading)', fontSize: '0.8rem',
                      }}
                    >⬇️</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Video gallery ── */}
          {recordedVideos.length > 0 && (
            <>
              <p style={{ fontFamily: 'var(--font-caption)', fontSize: '1.2rem', margin: '4px 0 0', opacity: 0.75 }}>Video terekam</p>
              <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recordedVideos.map((v, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid var(--red)', background: '#000' }}>
                    <video
                      src={v.url}
                      controls
                      playsInline
                      style={{ width: '100%', display: 'block', maxHeight: 260 }}
                    />
                    <div style={{ display: 'flex', gap: 8, padding: '8px 10px', background: '#0a0a0a' }}>
                      <button onClick={() => downloadVideo(v)} style={{ ...btnPrimary, padding: '7px 16px', fontSize: '0.9rem', flex: 1 }}>
                        ⬇️ unduh video
                      </button>
                      <button onClick={() => deleteVideo(i)} style={{ ...btnSecondary, padding: '7px 14px', fontSize: '0.9rem' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </CameraPermissionGate>
    </div>
  )
}
