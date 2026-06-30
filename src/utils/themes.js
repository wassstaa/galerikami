// utils/themes.js

export const COLOR_FILTERS = [
  { id: 'normal',   label: 'Normal',        css: 'none' },
  { id: 'bw',       label: 'Hitam Putih',   css: 'grayscale(1) contrast(1.05)' },
  { id: 'sepia',    label: 'Sepia',         css: 'sepia(0.65) contrast(1.05)' },
  { id: 'warm',     label: 'Hangat',        css: 'saturate(1.3) sepia(0.15) brightness(1.05)' },
  { id: 'cool',     label: 'Dingin',        css: 'saturate(1.1) hue-rotate(180deg) brightness(1.02)' },
  { id: 'vintage',  label: 'Vintage',       css: 'sepia(0.4) contrast(0.9) brightness(0.95) saturate(0.8)' },
  { id: 'redtone',  label: 'Merah',         css: 'sepia(0.3) hue-rotate(-30deg) saturate(1.6)' },
  { id: 'noir',     label: 'Noir',          css: 'grayscale(1) contrast(1.4) brightness(0.9)' },
  { id: 'soft',     label: 'Lembut',        css: 'brightness(1.08) contrast(0.92) saturate(1.05)' },
]

// Tema strip photobooth
// dotColor: warna polkadot (null = tidak ada polkadot)
export const STRIP_THEMES = [
  { id: 'classic-black',  label: 'Klasik Hitam',    paper: '#111111', accent: '#c1121f', text: '#ffffff', dotColor: null },
  { id: 'classic-red',    label: 'Klasik Merah',    paper: '#8c0f17', accent: '#ffffff', text: '#ffffff', dotColor: null },
  { id: 'cream',          label: 'Krem Hangat',     paper: '#f3e6d8', accent: '#c1121f', text: '#241204', dotColor: null },
  { id: 'midnight',       label: 'Malam',           paper: '#1a1a2e', accent: '#e0202f', text: '#ffffff', dotColor: null },
  { id: 'rose',           label: 'Mawar',           paper: '#2a0a10', accent: '#ff8fb1', text: '#ffffff', dotColor: null },
  // Tema baru dengan polkadot
  {
    id: 'pink-polkadot',
    label: '🩷 Pink Polkadot',
    paper: '#ff8fb1',
    accent: '#0a0a0a',
    text: '#0a0a0a',
    dotColor: '#0a0a0a',   // titik hitam di atas pink
  },
  {
    id: 'black-polkadot',
    label: '🖤 Hitam Polkadot',
    paper: '#0a0a0a',
    accent: '#ff8fb1',
    text: '#ffffff',
    dotColor: '#ff8fb1',   // titik pink di atas hitam
  },
]

// Tema Polaroid
// dotColor: null = tidak ada polkadot di backdrop
export const POLAROID_THEMES = [
  {
    id: 'polkadot-black-pink',
    label: '🩷 Polkadot Pink',
    background: '#ff8fb1',
    dotColor: '#0a0a0a',
  },
  {
    id: 'polkadot-pink-black',
    label: '🖤 Polkadot Hitam',
    background: '#0a0a0a',
    dotColor: '#ff8fb1',
  },
  {
    id: 'plain-white',
    label: '🤍 Putih Polos',
    background: '#e0e0e0',
    dotColor: null,
  },
  {
    id: 'plain-red',
    label: '❤️ Merah Polos',
    background: '#c1121f',
    dotColor: null,
  },
  {
    id: 'plain-black',
    label: '🖤 Hitam Polos',
    background: '#111111',
    dotColor: null,
  },
]
