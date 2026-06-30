// utils/useCamera.js
import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [facingMode, setFacingMode] = useState('user')
  const facingModeRef = useRef('user')

  const attachStream = useCallback((stream) => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    const tryPlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    tryPlay()
    video.onloadedmetadata = tryPlay

    const track = stream.getVideoTracks()[0]
    if (track) {
      // Beberapa browser (terutama Safari/iOS) suka "mematikan" track kamera
      // saat tab balik aktif atau dipakai library lain. Kalau itu terjadi,
      // otomatis coba sambung ulang biar layar nggak hitam permanen.
      track.onended = () => {
        start(facingModeRef.current)
      }
      track.onmute = () => {
        setTimeout(() => {
          if (track.muted) start(facingModeRef.current)
        }, 700)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(async (mode = facingModeRef.current) => {
    setStatus('requesting')
    setErrorMsg('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera.')
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = stream
      attachStream(stream)
      facingModeRef.current = mode
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
  }, [attachStream])

  useEffect(() => {
    if (status === 'granted' && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      attachStream(streamRef.current)
    }
  }, [status, attachStream])

  // Kalau tab balik kelihatan (misal user sempat pindah app lalu balik lagi)
  // dan video-nya kebetulan berhenti, coba lanjutkan play lagi.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && videoRef.current && streamRef.current) {
        const p = videoRef.current.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const flip = useCallback(() => {
    const next = facingModeRef.current === 'user' ? 'environment' : 'user'
    start(next)
  }, [start])

  const getStream = useCallback(() => streamRef.current, [])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return { videoRef, status, errorMsg, start, stop, flip, facingMode, getStream }
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
