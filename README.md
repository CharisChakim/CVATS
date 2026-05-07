<div align="center">
  <img src="./public/logo.svg" width="64" height="64" alt="CVATS logo" />
  <h1>CVATS</h1>
  <p><strong>Buat CV profesional, gratis dan aman.</strong></p>
  <p>
    AI-powered resume builder — tanpa biaya, tanpa akun, tanpa menyimpan data apapun.
  </p>
  <p>
    <a href="https://cvats.vercel.app/">🚀 Coba Sekarang</a>
    &nbsp;·&nbsp;
    <a href="https://github.com/devXprite/resumave/issues/new">Laporkan Bug</a>
  </p>
</div>

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| **100% Gratis** | Semua fitur tersedia tanpa biaya apapun |
| **Tanpa Akun** | Tidak perlu daftar atau login |
| **Data Aman** | Data hanya tersimpan di browser kamu — tidak dikirim ke server |
| **AI Upload CV** | Upload PDF resume lama, AI otomatis mengisi semua field |
| **AI Refine** | Perbaiki summary, pengalaman, dan proyek dengan satu klik |
| **ATS-Friendly** | Format CV yang lolos sistem rekrutmen otomatis (ATS) |
| **2 Template** | Classic (tradisional) dan Modern (kontemporer) |
| **Compact Mode** | Satu klik untuk memadatkan CV agar muat satu halaman |
| **Skills sebagai Tag** | Input skill satu per satu, tampil rapi seperti badge |
| **Dark / Light Mode** | Tema gelap dan terang, preferensi tersimpan otomatis |
| **Ekspor PDF** | Unduh CV dalam format A4 PDF siap kirim |

---

## 🛠 Teknologi

- **Next.js 14** — App Router, dynamic imports, SSR-safe rendering
- **Tailwind CSS** — Utility-first, dark mode support
- **Redux Toolkit** — State management
- **@react-pdf/renderer** — Generate PDF dengan font Carlito (setara Calibri)
- **react-pdf** — Preview PDF langsung di browser
- **OpenRouter API** — Fitur AI via model NVIDIA Nemotron

---

## 📸 Screenshots

<img src="./public/screenshots/1.png" width="75%" />
<img src="./public/screenshots/2.png" width="75%" />

---

## 🚀 Instalasi Lokal

1. Clone repositori:
   ```bash
   git clone https://github.com/devXprite/resumave.git
   cd resumave
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env.local` dan isi API key OpenRouter:
   ```env
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
   ```

4. Jalankan dev server:
   ```bash
   npm run dev
   ```

5. Buka browser di `http://localhost:3000`

---

## 🙏 Credits

Proyek ini terinspirasi dari [Resumave](https://github.com/devxprite/resumave) oleh [@devxprite](https://github.com/devxprite). Terima kasih atas fondasi yang luar biasa!

---

## 📄 Lisensi

MIT License — bebas digunakan dan dimodifikasi.
