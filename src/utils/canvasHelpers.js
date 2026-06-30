// utils/canvasHelpers.js
// Helper canvas yang dipakai bersama oleh Photobooth & Polaroid:
// - loadImage / drawCover: utilitas gambar umum
// - drawPolkaDots: pola polkadot untuk tema strip & polaroid
// - applyManualFilter: filter warna versi manual (operasi piksel langsung),
//   dipakai supaya hasil FOTO YANG DIAMBIL konsisten di semua browser.
//   (ctx.filter bawaan canvas tidak didukung penuh di sejumlah browser
//   mobile, jadi filter kelihatan "tidak ngaruh" saat hasil foto diunduh.
//   Dengan memanipulasi piksel langsung, filter dijamin selalu berlaku.)

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function drawCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sx, sy, sw, sh
  if (imgRatio > boxRatio) {
    sh = img.height
    sw = sh * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export function drawPolkaDots(ctx, w, h, color, gap = 26, radius = 5) {
  ctx.save()
  ctx.fillStyle = color
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

// ---- mesin filter manual (mereplikasi rumus matrix resmi CSS Filter Effects) ----

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function opGrayscale(r, g, b, amount) {
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return [r + (gray - r) * amount, g + (gray - g) * amount, b + (gray - b) * amount]
}

function opSepia(r, g, b, amount) {
  const tr = 0.393 * r + 0.769 * g + 0.189 * b
  const tg = 0.349 * r + 0.686 * g + 0.168 * b
  const tb = 0.272 * r + 0.534 * g + 0.131 * b
  return [r + (tr - r) * amount, g + (tg - g) * amount, b + (tb - b) * amount]
}

function opSaturate(r, g, b, amount) {
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return [gray + (r - gray) * amount, gray + (g - gray) * amount, gray + (b - gray) * amount]
}

function opBrightness(r, g, b, amount) {
  return [r * amount, g * amount, b * amount]
}

function opContrast(r, g, b, amount) {
  return [(r - 128) * amount + 128, (g - 128) * amount + 128, (b - 128) * amount + 128]
}

function opHueRotate(r, g, b, deg) {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const m = [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.140, 0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072,
  ]
  return [r * m[0] + g * m[1] + b * m[2], r * m[3] + g * m[4] + b * m[5], r * m[6] + g * m[7] + b * m[8]]
}

const OPS = {
  grayscale: opGrayscale,
  sepia: opSepia,
  saturate: opSaturate,
  brightness: opBrightness,
  contrast: opContrast,
  hueRotate: opHueRotate,
}

// Setiap filter didefinisikan sebagai urutan langkah, identik dengan string
// CSS filter aslinya di utils/themes.js (dipakai untuk preview video langsung).
export const FILTER_STEPS = {
  normal: [],
  bw: [
    { op: 'grayscale', amount: 1 },
    { op: 'contrast', amount: 1.05 },
  ],
  sepia: [
    { op: 'sepia', amount: 0.65 },
    { op: 'contrast', amount: 1.05 },
  ],
  warm: [
    { op: 'saturate', amount: 1.3 },
    { op: 'sepia', amount: 0.15 },
    { op: 'brightness', amount: 1.05 },
  ],
  cool: [
    { op: 'saturate', amount: 1.1 },
    { op: 'hueRotate', amount: 180 },
    { op: 'brightness', amount: 1.02 },
  ],
  vintage: [
    { op: 'sepia', amount: 0.4 },
    { op: 'contrast', amount: 0.9 },
    { op: 'brightness', amount: 0.95 },
    { op: 'saturate', amount: 0.8 },
  ],
  redtone: [
    { op: 'sepia', amount: 0.3 },
    { op: 'hueRotate', amount: -30 },
    { op: 'saturate', amount: 1.6 },
  ],
  noir: [
    { op: 'grayscale', amount: 1 },
    { op: 'contrast', amount: 1.4 },
    { op: 'brightness', amount: 0.9 },
  ],
  soft: [
    { op: 'brightness', amount: 1.08 },
    { op: 'contrast', amount: 0.92 },
    { op: 'saturate', amount: 1.05 },
  ],
}

/**
 * Menerapkan filter warna langsung ke piksel canvas yang sudah berisi
 * gambar (dipanggil SETELAH ctx.drawImage). Ini menggantikan ctx.filter
 * supaya hasilnya konsisten di semua browser/HP.
 */
export function applyManualFilter(ctx, w, h, filterId) {
  const steps = FILTER_STEPS[filterId]
  if (!steps || steps.length === 0) return
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let b = d[i + 2]
    for (const step of steps) {
      const fn = OPS[step.op]
      ;[r, g, b] = fn(r, g, b, step.amount)
    }
    d[i] = clamp(r)
    d[i + 1] = clamp(g)
    d[i + 2] = clamp(b)
  }
  ctx.putImageData(imageData, 0, 0)
}
