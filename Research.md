# Riset Website Radar BK — Log Progress

> File ini ringkasan sesi 2026-09-15. Baca ini dulu sebelum lanjut kerja.

## 1. Dataset
- `Riset_22Sep/Data Kelas 5 lengkap.xlsx` — 24 siswa × Kelas 1–5 (120 baris sheet `Dataset_Format_Website`; 24 baris sheet `Rekap_Per_Mapel_K1_sd_K5`).
- Kolom: id, nama, kelas, nilai_ipas/bind/mtk, absensi harian (string "94.8%"), rata_nilai, poin_pelanggaran + tren Naik (13) / Turun (11).
- Gap jujur: keterlambatan tugas & kunjungan UKS TIDAK ADA → UI strip "belum tersedia", bukan angka palsu.

## 2. Keputusan desain (disetujui user)
- Flask monolit + HTML (opsi A), lokal tanpa deploy/DB/API.
- 7 route: `/` landing 6 kartu, `/radar`, `/siswa/<id>`, `/tren`, `/kasus`, `/sosiometri`, `/data` (+ `/template`).
- AI = skor rule-based transparan (bukan LLM): absensi<95 → +40; rata<85 → +30; poin>0 → +20; tren Turun → +10. Badge Aman ≤20 / Pantau ≤50 / Intervensi 51+.
- Rekomendasi BK template deterministik (tanpa model): prioritas bila Intervensi, konseling/kunjungan (absensi), bimbel mapel terlemah (nilai), tata tertib (poin), observasi (tren), apresiasi (aman).
- Upload xlsx fleksibel: validasi kolom, pesan ramah, template unduh, max 5MB, simpan `bk_site/uploads/`, default Data Kelas 5.
- Status kasus & sosiometri = memori sesi (hilang saat restart, tertulis di UI). Sosiometri: anti-pilih-diri + anti-duplikat (JS + server), satu pemilih satu data + mode edit (tombol Perbarui, prefill, daftar Sudah mengisi).
- UI: terang modern, gradasi (hero ungu-biru), responsif + hamburger HP, tombol kembali di profil.
- Beranda: judul "RADAR BK", tagline "Baca sinyal siswa sejak dini — satu radar untuk absensi, nilai, poin, dan tren."

## 3. Struktur (`Riset_22Sep/`)
- `bk_site/`: `app.py`, `data_loader.py`, `risk.py`, `rekom.py`, `dataset_store.py`, `paths.py` (portabel dev/exe), `templates/` (8), `static/style.css`, `uploads/` (default xlsx), `tests/` (test_risk 5 + test_rekom 3).
- `dist/RadarBK/RadarBK.exe` (~5MB, PyInstaller onedir) + `build/`, `RadarBK.spec` (path relatif).
- `2026-09-15-website-bk-radar-design.md` (spec S1–S4), `2026-09-15-website-bk-radar-plan.md` (plan 4 task).

## 4. Cara jalan
- Dev: `python -m bk_site.app` dari `Riset_22Sep/` → http://127.0.0.1:5000/
- Tes: `python -m pytest bk_site/tests/ -q` (8 hijau).
- Exe: klik `dist/RadarBK/RadarBK.exe` (browser auto-buka; console jangan ditutup; grafik butuh internet sekali load).
- Rebuild: kill proses `RadarBK` dulu (kunci file!) → `pyinstaller --noconfirm RadarBK.spec` → smoke test route.

## 5. Jawaban sidang siap pakai
- AI di mana: AI pendukung keputusan (skor + alasan + rekomendasi), bukan chatbot. Analogi: skor kredit bank.
- Permodelan: skoring komposit rule-based (expert judgment), bukan ML. Rumus + ambang di §2. Future work: regresi logistik bila data besar.

## 6. Ide lanjut (belum dikerjakan)
- Cetak/export laporan PDF per siswa; login sederhana guru BK; grafik offline tanpa CDN; tuning ambang dari data; sinkron §1 CLAUDE.md kuliah vs disk aktual.

## 7. Lanjutan sesi (upload fleksibel → persistensi)
- Validasi berbasis isi: nama sheet + urutan kolom bebas, header toleran spasi/kapital; kolom tren & Rata K5 opsional; file salah ditolak ramah + arahan template. Tes: `tests/test_upload.py`.
- Bug upload 500: `secure_filename` rusak nama berspasi → `set_active` pakai basename apa adanya + tolak traversal; `/data/aktifkan` tak lagi 500.
- Bug file "Kelas 5B": label kelas dinamis (`kelas_akhir`, bukan hardcode "Kelas 5"); deret nilai turun dari baris kelas bila rekap kosong; template + risk + rekom ikut dinamis. Tes: `tests/test_fleksibel.py`.
- Bug nilai hilang: kolom rekap K5 bernama "K5 (Asli)" tak ke-map → alias prioritas (Asli); sel tabel tahan None ("-").
- Uploads exe pindah ke `dist/uploads/` (di luar folder exe) + migrasi file lama → selamat dari rebuild. Dev pakai `bk_site/uploads/`. Lihat `bk_site/paths.py`.
- Tren otomatis (rata akhir >= rata awal → Naik, else Turun) bila kolom/rekap kosong.
- Hapus dataset per file (aktif dilindungi, konfirmasi JS).
- Persistensi: STATUS + SOSIO → `uploads/state.json` tiap mutasi; ganti dataset = reset. Tes: `tests/test_state.py` (17 hijau total).
- Sosiometri: anti-pilih-diri + anti-duplikat (JS + server + pesan), satu pemilih satu data + mode edit (Perbarui, prefill, daftar Sudah mengisi).
- Rekomendasi template di profil (`bk_site/rekom.py`); profil tampil ID di bawah nama; tombol kembali; UI gradasi + responsif.
- Beranda: "RADAR BK" + tagline sinyal.
- Pelajaran: kill proses RadarBK sebelum rebuild; `python -m pytest` (bukan `pytest` langsung) agar import paket lolos.

## 8. Lanjutan sesi (review → 404/nama/seed)
- Review kelayakan: proper untuk demo/sidang, belum produksi. Dieksekusi: sosiometri tampil nama (bukan ID), 404 ramah + guard form (`siswa` asing, `kasus_set`), seed anti-hapus + fallback start bila file aktif korup.
- Tes kini 20/20 (`tests/test_state.py` +3: 404, seed, nama). Exe rebuild + smoke lolos.
- Sisa review belum dikerjakan: template contoh penuh, grafik offline (CDN), auth + HTTPS + enkripsi bila push online (UU PDP).
- Footer formal done: `base.html` + CSS navy, "Muhammad Pandu Wirakusuma · Telkom University Jakarta · © 2026". Exe rebuild + smoke lolos (radar 200, footer True).
- Menu /tanya done: `bk_site/tanya.py` rule-based (intervensi/pantau/turun/absensi/nama/bantuan), UI chat bubble, riwayat sesi in-memory cap 20. Tes 25/25 (`test_tanya.py` +5). Exe rebuild + smoke lolos (tanya 200).
- /tanya humanized v2: superlatif (absensi/nilai/mapel terendah-tertinggi, top-N dari angka, "paling rajin"), kalimat natural + saran (bukan dump). Tes 28/28 (`test_tanya.py` 8). Exe rebuild + smoke lolos (tanya 200, jawaban human True).
- Bug dict-leak fix: absensi branch cetak dict utuh → nama saja. Urutan intent: poin dicek sebelum nilai ("poin tertinggi" tak nyangkut). Intent baru: poin, ringkasan jumlah badge, rata-rata kelas. Tes 30/30 (+`test_no_dict_leak`, `test_poin`). Exe rebuild + smoke (dict-leak False, human True).
- /tanya v3: tombol Reset riwayat manual (`POST /tanya/reset`, tanpa auto-reset). Fix tren: "naik" vs "turun" dibedakan ("siapa trennya naik" → daftar Naik + apresiasi). Tes 32/32. Exe rebuild + smoke (reset-btn True, tren-naik-ok True).
- Bantuan list umum: "bantuan" jawab sapaan + 6 kategori contoh (umum, kehadiran, nilai, tren, pelanggaran, per siswa). Hint halaman sync. Tes 32/32. Exe rebuild + smoke (help-list True).
- Nama didahulukan: "[Nama] nilai [mapel] gimana?" jawab deret K1–K5 siswa itu + saran (bukan agregat). Mapel agregat kini kata utuh ("mtk terendah" ya, "ipanya" bukan). Tes 33/33 (+`test_siswa_mapel`). Exe rebuild + smoke (dimas-ok True).
- Tren ya/tidak: "[Nama] ... tren naik?" jawab Ya/Tidak + bukti K1→K5 + tren keseluruhan + saran. Nama kapital tak di dataset → "Ups, sepertinya X tidak berada di data/kelas ini, mohon pilih data kelas yang sesuai". Tes 35/35. Exe rebuild + smoke (jawab-tren True, ups True).
- Level kelas + sinonim: "bagus/baik/jago" = tertinggi, "jelek/buruk" = terendah; "kelas N" pakai rata level itu (`_krl`, angka kelas tak dimakan top-N). Fix `_kr` yang abaikan argumen level. Tes 36/36. Exe rebuild + smoke (kelas1-bagus True).
- Nama + level: "[Nama] nilai kelas N gimana?" jawab detail level itu (rata, 3 mapel, absensi, poin + saran). Tes 37/37. Exe rebuild + smoke (level-ok True).
- Sapu varian badge: "[badge] paling rendah/tinggi" jawab 1 ekstrem skor + saran arah; "siapa yang aman" list Aman; mapel sebut level bila bukan kelas akhir. Tes 38/38. Exe rebuild + smoke (extreme-ok True).
- Ranking: "ranking/juara/peringkat N" = tertinggi top-N ("ranking 1 dikelas 2" → Ranking Kelas 2: 1 nama). Tes 39/39. Exe rebuild + smoke (ranking-ok True).
- Ranking N = anak ke-N saja ("ranking 7" → 1 nama; tanpa angka → top 3). Tes 39/39. Exe rebuild + smoke (rank7-ok True).
- Footer sticky bottom: body flex column, main flex 1. Tes 39/39. Exe rebuild + smoke (footer True).

## 9. Rekap sesi malam 15 Sep 2026 (tutup sesi)

- Tes: 8 → 39 hijau (`test_tanya.py` 12). Exe `dist/RadarBK/` rebuild tiap perubahan + smoke lolos.
- Baru: footer formal (Pandu · Tel-U Jakarta · © 2026, sticky bottom) + menu `/tanya` rule-based human-like (badge, superlatif, top-N, ranking N = anak ke-N, nama+mapel/tren/level, ups bila nama tak di dataset, reset manual, bantuan list).
- Prinsip: offline, tanpa LLM/API, privasi aman. Aturan rebuild: kill RadarBK dulu.
- Lanjut besok: sisa §8 (template contoh penuh, grafik offline, auth/HTTPS UU PDP) + §6 (export PDF/siswa, login, tuning ambang).

## 10. Port Forwarding demo sidang (17 Sep 2026)

- Scope minimal (approved): CLI `--host/--port/--public-url` di `bk_site/app.py` + `run_tunnel.ps1` (Flask + `cloudflared tunnel --url`) + `RUN_TUNNEL.md`. Tanpa UI, tanpa auth.
- Verifikasi: `--help` OK (dev + exe), `pytest` 39 hijau, dev `:5101/radar` 200, exe rebuild + `:5102/radar` 200.
- Aturan: tunnel hanya saat sidang, stop after demo, jangan upload data asli (UU PDP).

## 11. Tunnel LIVE (17 Sep 2026, sesi lanjut)

- URL publik: **https://owen-usual-pounds-well.trycloudflare.com** (Quick Tunnel, acak tiap run)
- Proses: FLASK-PID=30200 (`127.0.0.1:5000`), CF-PID=15612. Log: `C:\Users\pandu\AppData\Local\Temp\opencode\radar_tunnel\` (flask.out/err, cf.out/err).
- Stop: `Stop-Process -Id 30200,15612 -Force` (ganti PID bila run ulang).
- Resume: run ulang launch (URL baru tiap run — Quick Tunnel tanpa akun). Script `run_tunnel.ps1` blocks tool → dipakai manual; agent pakai pola Start-Process background + poll `trycloudflare.com` di log.
- Pelajaran: winget MSI taruh biner di `C:\Program Files (x86)\cloudflared\` (bukan `Program Files`), PATH shell lama basi → full path. Flask yatim PID 31860 (run gagal pertama) di-kill.
- **Warning:** URL live = data 24 siswa terbuka publik. Stop tunnel seusai demo. Jangan share di luar penguji.
