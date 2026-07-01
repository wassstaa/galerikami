// utils/handDetection.js
// Mendeteksi pose "peace" menggunakan @mediapipe/hands.
// PENTING: kita TIDAK menggunakan Camera dari @mediapipe/camera_utils
// karena ia merebut srcObject video → menyebabkan layar hitam di BlurMode.
// Sebagai gantinya kita pakai loop requestAnimationFrame manual.

import * as mpHands from '@mediapipe/hands'

function isFingerUp(lm, tip, pip) {
  return lm[tip].y < lm[pip].y
}

export function isPeaceSign(lm) {
  if (!lm || lm.length < 21) return false
  const indexUp  = isFingerUp(lm, 8, 6)
  const middleUp = isFingerUp(lm, 12, 10)
  const ringDown  = !isFingerUp(lm, 16, 14)
  const pinkyDown = !isFingerUp(lm, 20, 18)
  const dx = lm[8].x - lm[12].x
  const dy = lm[8].y - lm[12].y
  const spread = Math.sqrt(dx * dx + dy * dy)
  return indexUp && middleUp && ringDown && pinkyDown && spread > 0.04
}

export function createHandDetector(videoEl, onResult) {
  const hands = new mpHands.Hands({
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
      results.multiHandLandmarks?.length > 0 &&
      results.multiHandLandmarks.some(isPeaceSign)
    onResult(Boolean(hasPeace))
  })

  let running = false
  let rafId   = null
  let busy    = false   // prevent overlapping sends

  const loop = async () => {
    if (!running) return
    if (!busy && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      busy = true
      try {
        await hands.send({ image: videoEl })
      } catch (e) {
  console.error("MediaPipe Error:", e)
      }
      busy = false
    }
    rafId = requestAnimationFrame(loop)
  }

  return {
    start: () => {
      running = true
      // Small delay to let the camera stream settle first
      setTimeout(() => loop(), 400)
    },
    stop: () => {
      running = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      try { hands.close() } catch (_) {}
    },
  }
}
