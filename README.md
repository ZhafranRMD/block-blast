# ?? Block Blast! 3D & Tetris - 16:9 Landscape Fullscreen PWA

Game arcade puzzle balok 3D modern yang menggabungkan mode **Block Blast 8x8** dan **Classic Tetris**, dirancang khusus dengan visual neon cyber spektakuler, audio blast dinamis, dukungan layar lebar **16:9 Landscape Fullscreen**, serta siap diinstal sebagai **Progressive Web App (PWA)** offline!

---

## ? Fitur Unggulan

- ?? **Dual Game Mode**:
  - **?? Block Blast (8x8)**: Tarik dan tempatkan ragam bentuk balok polyomino ke papan 8x8. Hancurkan baris dan kolom secara bersamaan untuk menghasilkan kombo blast spektakuler!
  - **??? Tetris Falling Mode**: Mode klasik balok jatuh dengan sistem 7-bag RNG, rotasi SRS, ghost piece preview, Hold piece, Next piece, dan soft/hard drop.
- ?? **16:9 Landscape Fullscreen Experience**:
  - Tampilan proporsional 16:9 widescreen arcade cabinet.
  - Tombol **Layar Penuh (Fullscreen)** terintegrasi dengan penguncian orientasi landscape otomatis.
  - Ukuran papan balok besar dan jelas di laptop, monitor PC, tablet, maupun HP horizontal.
- ?? **Progressive Web App (PWA) Offline Ready**:
  - Dapat diinstal langsung ke desktop/ponsel via tombol **Pasang Aplikasi** atau menu browser.
  - Dilengkapi Service Worker cache-first sehingga dapat dimainkan **100% tanpa koneksi internet (offline)**.
  - Icon definisi tinggi (192x192, 512x512 maskable, apple-touch-icon, favicon).
- ?? **Power-Ups Interaktif (Block Blast)**:
  - ?? **Bomb**: Menghancurkan area balok 3x3 di sekitarnya.
  - ?? **Hammer**: Menghancurkan 1 balok pilihan pemain.
  - ?? **Refresh**: Mengacak dan memberikan 3 balok baru di rak.
- ?? **Sintesis Audio & BGM Neon**:
  - Efek suara real-time Web Audio API (pick, hover, drop, clear, combo fanfare, power-up).
  - Musik latar synthwave neon cyber retro lo-fi yang adiktif.

---

## ?? Kontrol & Pintasan Keyboard

| Tombol / Aksi | Fungsi |
|---|---|
| **F** | Toggle Layar Penuh (16:9 Fullscreen) |
| **M** | Toggle Musik Latar (BGM) |
| **R** | Mulai Ulang / Bersihkan Papan (Block Blast) |
| **Mouse Drag / Touch** | Tarik dan letakkan balok ke celah papan |
| **? / ? / ?** | Gerakkan balok Tetris ke kiri / bawah / kanan |
| **? / Spasi / ?** | Putar balok Tetris / Hard Drop instan |
| **C / Tombol HOLD** | Simpan balok Tetris saat ini |

---

## ?? Cara Menjalankan Secara Lokal

Buka file index.html langsung di browser, atau jalankan server lokal sederhana:

`ash
# Menggunakan Node.js
npx serve .

# Atau menggunakan Python
python -m http.server 3000
`
Buka http://localhost:3000 di browser Google Chrome / Edge / Safari.

---

## ?? Cara Push ke GitHub & Deploy ke GitHub Pages

### 1. Inisialisasi & Push ke GitHub
Buat repository baru di GitHub (misalnya bernama lock-blast), lalu jalankan di folder project ini:

`ash
git remote add origin https://github.com/USERNAME_ANDA/block-blast.git
git branch -M main
git push -u origin main
`

### 2. Aktifkan GitHub Pages (Gratis Main Online)
1. Buka repository Anda di GitHub.
2. Masuk ke **Settings** > **Pages**.
3. Pada bagian **Build and deployment** > **Branch**, pilih branch main dan folder / (root).
4. Klik **Save**.
5. Game Anda akan langsung online dan dapat dimainkan siapa saja via URL:
   https://USERNAME_ANDA.github.io/block-blast/

---

## ?? Struktur Berkas

`
Block Blast Game/
+-- index.html            # Markup struktur 3-panel 16:9
+-- style.css             # Tema neon cyber, tata letak 16:9 responsive
+-- app.js                # Game controller, Fullscreen & PWA manager
+-- blockblast.js         # Logika permainan Block Blast 8x8 & rak balok
+-- tetris.js             # Logika permainan Tetris mode balok jatuh
+-- renderer.js           # Engine render balok 3D, partikel, & teks animasi
+-- audio.js              # Web Audio API Sound Effects & Synth BGM
+-- manifest.json         # Konfigurasi PWA standalone landscape
+-- sw.js                 # Service worker cache untuk akses offline
+-- icon.jpg              # Master asset icon resolusi tinggi
+-- icon-192.png          # Icon PWA 192x192
+-- icon-512.png          # Icon PWA 512x512
+-- icon-maskable-512.png # Icon PWA maskable Android
+-- apple-touch-icon.png  # Icon iOS Apple Touch
+-- favicon.png           # Favicon tab browser
+-- .gitignore            # Filter berkas yang tidak perlu di-push
+-- README.md             # Dokumentasi lengkap
`

---
Dibuat dengan ?? untuk pengalaman gaming arcade puzzle terbaik!
