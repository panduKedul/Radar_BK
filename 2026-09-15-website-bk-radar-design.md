# Website Radar BK Kelas 5 — Design Doc

Tanggal: 2026-09-15
Status: Disetujui user (S1+S2+S3). Pendekatan A: monolit Flask 5 menu + sosiometri, skor rule-based, lokal tanpa deploy.
Scope: deteksi dini + administrasi ringan. BUKAN konseling isi curhat (sensitif, dikecualikan).

## 1. Dataset
Sumber: `Riset_22Sep/Data Kelas 5 lengkap.xlsx` (2 sheet, read-only, dibaca via openpyxl saat app start).
- `Dataset_Format_Website`: 120 baris = 24 siswa × Kelas 1-5. Kolom: id, nama, kelas, nilai_ipas, nilai_bind, nilai_mtk, absensi harian (string "94.8%"), rata_nilai, poin_pelanggaran.
- `Rekap_Per_Mapel_K1_sd_K5`: 24 baris/siswa. Kolom: No, ID, Nama, IPAS K1-K5, B.Ind K1-K5, MTK K1-K5, Rata-rata K5, Tren Akhir (Naik 13 / Turun 11).
- Gap jujur: keterlambatan tugas & kunjungan UKS TIDAK ADA di dataset → UI tampil strip "data belum tersedia", bukan angka palsu.

## 2. Arsitektur
Flask monolit, Python semua, `templates/` Jinja, Chart.js CDN untuk grafik (atau matplotlib PNG bila offline penuh — putuskan saat implementasi; default Chart.js karena demo lokal pakai browser sendiri). Tanpa DB: status kasus & sosiometri simpan memori proses (hilang saat restart; tulis jujur di UI). Tanpa API LLM: skor rule-based murni.

## 3. Route & Menu (S1)
| Route | Menu | Isi |
|---|---|---|
| `/` | Landing | 6 kartu menu + ringkasan (24 siswa, N butuh perhatian) |
| `/radar` | Dashboard Radar | Tabel 24 siswa (K5): nama, rata, absensi, poin, tren, badge risiko + alasan |
| `/siswa/<id>` | Profil Siswa | Biodata, nilai K1-K5 per mapel (grafik garis), absensi, badge |
| `/tren` | Tren Nilai | Grafik per mapel K1-K5 + hitung Naik/Turun |
| `/kasus` | Status Kasus | Tabel + dropdown: observasi/dipanggil/orangtua/rujuk (memori sesi) |
| `/sosiometri` | Sosiometri | Form pilih 3 teman/siswa, daftar pilihan terbanyak & tak dipilih |
| `/data` | Data | Upload xlsx baru, validasi ramah, unduh template, pilih dataset aktif (S4) |

## 4. Skor Risiko (S2)
Skor 0-100 per siswa (data K5 + tren): absensi<95% → +40; rata_nilai<85 → +30; poin_pelanggaran>0 → +20; tren Turun → +10.
Badge: 0-20 Aman (hijau), 21-50 Pantau (kuning), 51+ Intervensi (merah). Tiap badge tampilkan alasan komponen (transparan, bisa dijelaskan ke guru BK).
Absensi diparse dari string persen. Ambang boleh di-tuning satu konstanta di `risk.py`.

## 5. Sosiometri & Kasus (S3)
Sosiometri: satu pemilih = satu siswa memilih 3 teman; agregat pilihan; tampil "bintang" (terbanyak dipilih) & "terisolasi" (tak dipilih). Murni demonstrasi administrasi BK.
Kasus: status awal semua "observasi"; perubahan via dropdown; simpan dict memori; label UI: "tersimpan sementara (hilang saat server restart)".

## 6. Upload Dataset Fleksibel (S4)
Tujuan: pengguna umum ganti dataset tanpa sentuh kode. Route `/data`: form upload `.xlsx`; validasi kolom wajib sheet1 (`id,nama,kelas,nilai_ipas,nilai_bind,nilai_mtk,absensi harian,rata_nilai,poin_pelanggaran`) + sheet2 (`ID Siswa,Nama Siswa,Rata-rata K5 (Asli),Tren Akhir`); pesan error sebut kolom kurang per sheet; tombol unduh template kosong berheader benar; file valid simpan `Riset_22Sep/bk_siteuploads/`; daftar dataset + tombol jadikan aktif; default aktif = Data Kelas 5. Batas: max 5MB, hanya xlsx. Keamanan: filename dibersihkan (secure_filename), tak dieksekusi.

## 7. Etik & Batas
Tanpa isi curhat konseling. Tanpa nama di URL publik (pakai id). Data 24 siswa fiktif/riset — tetap perlakukan sebagai data pribadi di demo.

## 8. File (rencana implementasi)
`Riset_22Sep/bk_siteapp.py`, `Riset_22Sep/bk_sitedata_loader.py`, `Riset_22Sep/bk_siterisk.py`, `Riset_22Sep/bk_sitedataset_store.py` (upload+validasi+aktif), `Riset_22Sep/bk_sitetemplates/*.html`, `Riset_22Sep/bk_sitestatic/style.css`, `Riset_22Sep/bk_siteuploads/` (default + unggahan), `requirements.txt` (flask, openpyxl). Uji: buka tiap route, cek 24 baris radar, skor manual 2 siswa, submit sosiometri + ubah status, upload file salah (wajib ditolak ramah) + file benar (jadi aktif).

## 9. Self-review
- Tanpa placeholder/TBD; ambang & route eksplisit.
- Konsisten: 6 route, 5 kartu landing, memori-sesi jujur, gap tugas/UKS diakui.
- Scope tunggal (deteksi dini + admin ringan); konseling isi & ML dikecualikan eksplisit.
- Chart.js vs offline: satu-satunya titik ambigu → default Chart.js, fallback diputus saat implementasi bila laptop demo offline.
