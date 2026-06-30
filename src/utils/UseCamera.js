// utils/useCamera.js
import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Hook untuk meminta izin kamera dan mengelola stream <video>.
 * Mendukung Chrome desktop, Android Chrome, dan Safari iOS
 * (memakai playsInline + muted agar autoplay diizinkan di iOS).
 */
export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | requesting | granted | denied | error
  const [errorMsg, setErrorMsg] = useState('')
  const [facingMode, setFacingMode] = useState('user')

  const start = useCallback(async (mode = facingMode) => {
    setStatus('requesting')
    setErrorMsg('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera.')
      }
      // hentikan stream lama kalau ada
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
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
  }, [facingMode])

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

  return { videoRef, status, errorMsg, start, stop, flip, facingMode }
}

/**
 * Mengambil satu frame dari elemen video menjadi data URL (PNG),
 * dengan opsi mirror (selfie) dan filter CSS.
 */
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
