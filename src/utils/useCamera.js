// utils/useCamera.js
import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [facingMode, setFacingMode] = useState('user')
  const [diagnostics, setDiagnostics] = useState({})

  const refreshDiagnostics = useCallback(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!video) {
      setDiagnostics({ note: 'video element belum ada' })
      return
    }
    const track = stream ? stream.getVideoTracks()[0] : null
    setDiagnostics({
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      currentTime: Math.round(video.currentTime * 10) / 10,
      hasSrcObject: !!video.srcObject,
      trackState: track ? track.readyState : 'tidak ada',
      trackEnabled: track ? track.enabled : null,
      trackMuted: track ? track.muted : null,
      trackLabel: track ? track.label : null,
    })
  }, [])

  const attachStream = useCallback((stream) => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    const tryPlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {})
      }
      refreshDiagnostics()
    }
    tryPlay()
    video.onloadedmetadata = () => {
      tryPlay()
    }
    video.onplaying = () => {
      refreshDiagnostics()
    }
    let count = 0
    const interval = setInterval(() => {
      refreshDiagnostics()
      count += 1
      if (count > 20) clearInterval(interval)
    }, 300)
  }, [refreshDiagnostics])

  const start = useCallback(async (mode = facingMode) => {
    setStatus('requesting')
    setErrorMsg('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera.')
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = stream
      attachStream(stream)
      setFacingMode(mode)
      setStatus('granted')
    } catch (err) {
      setStatus(err.name === 'NotAllowedError' ? 'denied' : 'error')
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Aktifkan akses kamera di pengaturan browser kamu lalu coba lagi.'
          : err.message || 'Tidak bisa mengakses kamera.'
      )
    }
  }, [facingMode, attachStream])

  useEffect(() => {
    if (status === 'granted' && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      attachStream(streamRef.current)
    }
  }, [status, attachStream])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const flip = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    start(next)
  }, [facingMode, start])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return { videoRef, status, errorMsg, start, stop, flip, facingMode, diagnostics }
}

export function captureFrame(videoEl, { mirror = true, filterCss = 'none' } = {}) {
  const canvas = document.createElement('canvas')
  const w = videoEl.videoWidth
  const h = videoEl.videoHeight
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.filter = filterCss
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(videoEl, 0, 0, w, h)
  return canvas.toDataURL('image/png')
        }
