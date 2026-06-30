// utils/handDetection.js
// Mendeteksi pose "peace" (jari telunjuk + tengah terangkat, jari lain terlipat)
// menggunakan @mediapipe/hands. Dipakai di mode Blur.
//
// PENTING: kita TIDAK pakai @mediapipe/camera_utils di sini, karena class
// Camera-nya bikin getUserMedia sendiri (kamera depan, terus dia override
// video.srcObject) -> bentrok sama stream kamera yang sudah kita kelola di
// useCamera.js. Itu yang bikin layar jadi hitam dan kamera belakang selalu
// "ditarik balik" ke kamera depan. Solusinya: kirim frame dari elemen
// <video> yang sudah ada (apa pun kamera yang sedang aktif) pakai
// requestAnimationFrame sendiri.

import { Hands } from '@mediapipe/hands'

function isFingerUp(landmarks, tipIdx, pipIdx) {
  return landmarks[tipIdx].y < landmarks[pipIdx].y
}

export function isPeaceSign(landmarks) {
  if (!landmarks || landmarks.length < 21) return false

  const indexUp = isFingerUp(landmarks, 8, 6)
  const middleUp = isFingerUp(landmarks, 12, 10)
  const ringDown = !isFingerUp(landmarks, 16, 14)
  const pinkyDown = !isFingerUp(landmarks, 20, 18)

  const dx = landmarks[8].x - landmarks[12].x
  const dy = landmarks[8].y - landmarks[12].y
  const spread = Math.sqrt(dx * dx + dy * dy)

  return indexUp && middleUp && ringDown && pinkyDown && spread > 0.04
}

/**
 * Membuat instance pendeteksi tangan yang membaca frame dari elemen <video>
 * yang sudah dikelola di luar (lewat useCamera), tanpa membuat stream kamera
 * baru sendiri.
 */
export function createHandDetector(videoEl, onResult) {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  })

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5,
  })

  hands.onResults((results) => {
    const hasPeace =
      results.multiHandLandmarks &&
      results.multiHandLandmarks.length > 0 &&
      results.multiHandLandmarks.some((lm) => isPeaceSign(lm))
    onResult(hasPeace)
  })

  let running = false
  let busy = false
  let rafId = null

  const loop = async () => {
    if (!running) return
    if (!busy && videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      busy = true
      try {
        await hands.send({ image: videoEl })
      } catch (e) {
        // frame sesekali gagal diproses itu wajar, abaikan saja
      }
      busy = false
    }
    rafId = requestAnimationFrame(loop)
  }

  return {
    start: () => {
      if (running) return
      running = true
      loop()
    },
    stop: () => {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      try {
        hands.close()
      } catch (e) {
        // ignore
      }
    },
  }
}
