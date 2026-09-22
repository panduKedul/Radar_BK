# Radar BK React — Design Spec (2026-09-22)

## S1 Arsitektur (approved)
- `radar-bk-react/` Vite React19 + Tailwind v4 + react-router-dom. No Bootstrap.
- Inspirasi CoreUI: sidebar navy `#1e2a3a`, header sticky, stat cards, tabel, badge.
- Data: `src/data/students.json` seed flatten dari `Data Kelas 5 lengkap.xlsx` (120 baris Dataset_Format_Website + rekap K1-K5).
- Logic port 1:1: `src/lib/risk.js` (absensi<95 +40, rata<85 +30, poin>0 +20, tren Turun +10; Aman≤20/Pantau≤50/Intervensi51+), `rekom.js` deterministik 6 template, `tanya.js` rule-based intent (badge, superlatif, top-N, ranking, nama+mapel/tren/level, ups bila nama asing).
- Persist: localStorage ganti `state.json` (STATUS, SOSIO, riwayat tanya cap20, dataset aktif).
- Route 8: `/, /radar, /siswa/:id, /tren, /kasus, /sosiometri, /data, /tanya` (+404).
- Bahasa ID penuh. Ganti EN hanya bila lib force.
- Upload xlsx client-side via SheetJS; template unduh generate client-side.

## S2 Komponen (approved)
- `AdminLayout`: Sidebar (7 nav + hamburger HP), Header (judul RADAR BK + tagline sinyal), Outlet, Footer sticky (Pandu · Tel-U Jakarta · © 2026).
- Kit: StatCard, Badge, RiskTable (sort skor desc), TrendChart (canvas murni offline, ganti CDN), SosioForm (anti-diri + anti-duplikat JS + edit Perbarui/prefill/Sudah-mengisi), UploadBox (max 5MB), ChatBubble + Reset btn.
- Token Tailwind: bg `#f3f4f6`, card white, aksen indigo, gradasi hero ungu-biru di landing.
- Responsive 375/768/1024/1440. Reduced-motion respect. Kontras 4.5:1.

## S3 Dataflow (approved)
- load JSON → computeRisk → sort desc → render per page.
- Kasus: POST lokal → STATUS[id] → save localStorage.
- Sosio: pemilih + 3 teman → validate → SOSIO[pemilih]=teman → Counter top5 + terisol list.
- Tanya: q≤300 char → jawab(DATA) → push cap20 → render bubble.
- Data: list seed + uploads → parse SheetJS → validate header toleran (sheet name + urutan bebas, tren & rata K5 opsional) → set aktif → reset STATUS/SOSIO.

## S4 Edge + Test (approved)
- Edge: sid asing → 404 ramah; file salah → pesan ramah + arahan template; seed anti-hapus; aktif dilindungi; absensi "94.8%" parse float; None → "-".
- Test Vitest port 39 pytest: risk 5, rekom 3, tanya 12+, upload/state/fleksibel.
- Verif: `npm run build` + smoke 8 route 200 + footer True + tanya human True.
- Non-goal: auth, backend, deploy, grafik CDN, PDF export (future).
