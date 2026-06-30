# GaleriKami

Web photobooth dengan 3 mode: Photobooth (strip 4 foto), Blur (blur otomatis saat pose peace), dan Polaroid (bingkai polkadot).

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173, browser akan minta izin kamera.

## Deploy ke Vercel

1. Push folder ini ke repository GitHub baru.
2. Buka https://vercel.com, klik "Add New Project", import repo GitHub kamu.
3. Framework preset otomatis terdeteksi sebagai "Vite". Build command: `npm run build`, output directory: `dist`.
4. Klik Deploy. Selesai — situs otomatis HTTPS, sehingga akses kamera (getUserMedia) bisa berjalan di semua browser modern termasuk Chrome Android dan Safari iOS (kamera browser butuh koneksi HTTPS atau localhost).

## Tentang font

- **Allura** dipakai untuk semua caption/teks biasa, diambil otomatis dari Google Fonts.
- **Recoleta** dipakai untuk judul "GaleriKami", "Photobooth", "Blur", "Polaroid". Recoleta adalah font berbayar (bukan Google Font gratis), jadi project ini memakai **Fraunces** sebagai pengganti visual yang mirip secara default.
  - Jika kamu punya lisensi font Recoleta: taruh file `Recoleta-Bold.woff2` di folder `public/fonts/`, lalu buka `src/index.css` dan aktifkan (uncomment) blok `@font-face` yang sudah disediakan. Font asli akan otomatis dipakai tanpa mengubah komponen lain.

## Mode Blur (deteksi pose peace)

Mode ini memakai library `@mediapipe/hands` (dimuat dari CDN jsdelivr) untuk mendeteksi 21 titik landmark tangan secara real-time di browser, lalu mengecek apakah jari telunjuk & tengah terangkat membentuk huruf V sementara jari manis & kelingking terlipat. Saat pose ini terdeteksi, video otomatis diberi efek `blur()`; begitu pose hilang, blur otomatis hilang.

## Catatan kompatibilitas

- Akses kamera browser (`getUserMedia`) hanya berjalan di halaman HTTPS atau `localhost` — Vercel otomatis menyediakan HTTPS jadi aman dipakai di Android maupun iPhone.
- Di iOS Safari, video memakai atribut `playsInline` dan `muted` agar bisa autoplay tanpa diblokir.
- Tombol "balik kamera" tersedia untuk berpindah kamera depan/belakang di perangkat mobile.
