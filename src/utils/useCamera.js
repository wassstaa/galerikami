// utils/useCamera.js
import { useRef, useState, useCallback, useEffect } from 'react'
import { applyManualFilter } from './canvasHelpers.js'

export function useCamera() {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [status,     setStatus]     = useState('idle')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [facingMode, setFacingMode] = useState('user')

  // Attach a MediaStream to the <video> element and keep it alive.
  const attachStream = useCallback((stream) => {
    const video = videoRef.current
    if (!video) return
    video.muted      = true
    video.playsInline = true
    video.srcObject  = stream

    const tryPlay = () => {
      video.play().catch(() => {})
    }

    // Resume automatically if the browser pauses the video
    // (common iOS behaviour after canvas drawImage calls)
    video.onpause = () => {
      if (video.srcObject) video.play().catch(() => {})
    }

    video.onloadedmetadata = tryPlay
    tryPlay()
  }, [])

  const start = useCallback(async (mode = facingMode) => {
    setStatus('requesting')
    setErrorMsg('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera.')
      }
      // Stop previous stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setFacingMode(mode)
      setStatus('granted')
      // Attach after state update so React has re-rendered the video element
      setTimeout(() => attachStream(stream), 0)
    } catch (err) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
      setStatus(isDenied ? 'denied' : 'error')
      setErrorMsg(
        isDenied
          ? 'Izin kamera ditolak. Aktifkan akses kamera di pengaturan browser lalu coba lagi.'
          : err.message || 'Tidak bisa mengakses kamera.'
      )
    }
  }, [facingMode, attachStream])

  // Re-attach if srcObject was cleared (e.g. after component re-mount)
  useEffect(() => {
    if (status === 'granted' && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      attachStream(streamRef.current)
    }
  }, [status, attachStream])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.onpause = null
      videoRef.current.srcObject = null
    }
  }, [])

  const flip = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    start(next)
  }, [facingMode, start])

  useEffect(() => () => stop(), [stop])

  return { videoRef, streamRef, status, errorMsg, start, stop, flip, facingMode }
}

/**
 * Capture a single frame from a video element.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {object} opts
 * @param {string}  opts.filterId   - filter id from themes.js (default 'normal')
 * @param {string}  opts.facingMode - 'user'|'environment' (default 'user')
 * @param {number}  opts.blurPx    - gaussian blur in px to apply before colour filter (default 0)
 * @returns {string|null} data URL or null if video not ready
 */
export function captureFrame(videoEl, { filterId = 'normal', facingMode = 'user', blurPx = 0 } = {}) {
  if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return null

  const w = videoEl.videoWidth
  const h = videoEl.videoHeight
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Mirror only for front camera (user-facing)
  const mirror = facingMode === 'user'

  // Optionally apply CSS blur via ctx.filter before drawing
  // (works on desktop; silently ignored on some iOS – acceptable for blur effect)
  if (blurPx > 0) {
    ctx.filter = `blur(${blurPx}px)`
  }

  if (mirror) {
    ctx.save()
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoEl, 0, 0, w, h)
    ctx.restore()
  } else {
    ctx.drawImage(videoEl, 0, 0, w, h)
  }

  ctx.filter = 'none'

  // Apply colour filter via pixel manipulation – works on ALL browsers/devices
  if (filterId && filterId !== 'normal') {
    applyManualFilter(ctx, w, h, filterId)
  }

  // iOS fix: canvas drawImage may pause the video element
  if (videoEl.paused && videoEl.srcObject) {
    videoEl.play().catch(() => {})
  }

  return canvas.toDataURL('image/png')
}
