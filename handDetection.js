// utils/handDetection.js
// Mendeteksi pose "peace" (jari telunjuk + tengah terangkat, jari lain terlipat)
// menggunakan @mediapipe/hands. Dipakai di mode Blur.

import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

// Index landmark MediaPipe Hands:
// 0 wrist
// 4 thumb tip, 3 thumb ip
// 8 index tip, 6 index pip
// 12 middle tip, 10 middle pip
// 16 ring tip, 14 ring pip
// 20 pinky tip, 18 pinky pip

function isFingerUp(landmarks, tipIdx, pipIdx) {
  // jari dianggap "naik" jika ujung jari lebih tinggi (y lebih kecil) dari sendi pip-nya
  return landmarks[tipIdx].y < landmarks[pipIdx].y
}

export function isPeaceSign(landmarks) {
  if (!landmarks || landmarks.length < 21) return false

  const indexUp = isFingerUp(landmarks, 8, 6)
  const middleUp = isFingerUp(landmarks, 12, 10)
  const ringDown = !isFingerUp(landmarks, 16, 14)
  const pinkyDown = !isFingerUp(landmarks, 20, 18)

  // jarak antar ujung jari telunjuk & tengah harus cukup renggang (bentuk huruf V)
  const dx = landmarks[8].x - landmarks[12].x
  const dy = landmarks[8].y - landmarks[12].y
  const spread = Math.sqrt(dx * dx + dy * dy)

  return indexUp && middleUp && ringDown && pinkyDown && spread > 0.04
}

/**
 * Membuat instance pendeteksi tangan yang berjalan di atas elemen <video>.
 * onResult menerima boolean isPeace setiap frame.
 */
export function createHandDetector(videoEl, onResult) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
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

  const camera = new Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl })
    },
    width: 640,
    height: 480,
  })

  return {
    start: () => camera.start(),
    stop: () => {
      camera.stop()
      hands.close()
    },
  }
}
