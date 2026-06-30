// utils/themes.js

export const COLOR_FILTERS = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'bw', label: 'Hitam Putih', css: 'grayscale(1) contrast(1.05)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.65) contrast(1.05)' },
  { id: 'warm', label: 'Hangat', css: 'saturate(1.3) sepia(0.15) brightness(1.05)' },
  { id: 'cool', label: 'Dingin', css: 'saturate(1.1) hue-rotate(180deg) brightness(1.02)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.4) contrast(0.9) brightness(0.95) saturate(0.8)' },
  { id: 'redtone', label: 'Merah', css: 'sepia(0.3) hue-rotate(-30deg) saturate(1.6)' },
  { id: 'noir', label: 'Noir', css: 'grayscale(1) contrast(1.4) brightness(0.9)' },
  { id: 'soft', label: 'Lembut', css: 'brightness(1.08) contrast(0.92) saturate(1.05)' },
]

// Tema strip photobooth (latar kertas di sekitar 4 foto)
export const STRIP_THEMES = [
  {
    id: 'classic-black',
    label: 'Klasik Hitam',
    paper: '#111111',
    accent: '#c1121f',
    text: '#ffffff',
  },
  {
    id: 'classic-red',
    label: 'Klasik Merah',
    paper: '#8c0f17',
    accent: '#ffffff',
    text: '#ffffff',
  },
  {
    id: 'cream',
    label: 'Krem Hangat',
    paper: '#f3e6d8',
    accent: '#c1121f',
    text: '#241204',
  },
  {
    id: 'midnight',
    label: 'Malam',
    paper: '#1a1a2e',
    accent: '#e0202f',
    text: '#ffffff',
  },
  {
    id: 'rose',
    label: 'Mawar',
    paper: '#2a0a10',
    accent: '#ff8fb1',
    text: '#ffffff',
  },
]

// Tema polkadot khusus mode Polaroid
export const POLAROID_THEMES = [
  {
    id: 'polkadot-black-pink',
    label: 'Polkadot Hitam di Latar Pink',
    background: '#ff8fb1',
    dotColor: '#0a0a0a',
    frame: '#ffffff',
    text: '#0a0a0a',
  },
  {
    id: 'polkadot-pink-black',
    label: 'Polkadot Pink di Latar Hitam',
    background: '#0a0a0a',
    dotColor: '#ff8fb1',
    frame: '#1a1a1a',
    text: '#ffffff',
  },
  {
    id: 'plain-white',
    label: 'Polaroid Putih Polos',
    background: '#ffffff',
    dotColor: 'transparent',
    frame: '#ffffff',
    text: '#111111',
  },
  {
    id: 'plain-red',
    label: 'Polaroid Merah Polos',
    background: '#c1121f',
    dotColor: 'transparent',
    frame: '#8c0f17',
    text: '#ffffff',
  },
]
