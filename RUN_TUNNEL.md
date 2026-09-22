# RUN_TUNNEL — Radar BK demo sidang sementara (Cloudflared)

> Scope minimal. Tanpa auth, tanpa deploy permanen. Link publik = data siswa terbuka. Pakai hanya saat sidang.

## Prasyarat

- Python + `pip install flask openpyxl pytest` (lihat `bk_site/requirements.txt`)
- Biner `cloudflared`: `winget install --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements` (v2026.9.1) atau https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- Path aktual: `C:\Program Files (x86)\cloudflared\cloudflared.exe` (BUKAN `Program Files`, tak masuk PATH shell lama — pakai full path atau terminal baru)
- Cek: `& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' --version` dan `python -m bk_site.app --help`

## Run

```powershell
cd E:\AI` Agent\Riset_22Sep
powershell -ExecutionPolicy Bypass -File run_tunnel.ps1 -Port 5000
```

Flow script: Flask background (`python -m bk_site.app --host 127.0.0.1 --port 5000`) → tunggu `/radar` 200 (max 30 dtk) → `cloudflared tunnel --url http://127.0.0.1:5000` foreground → copy URL `https://xxx.trycloudflare.com` ke penguji → Ctrl+C untuk stop (job Flask auto-cleanup).

## Varian

- Port bentrok: `-Port 5100`
- LAN tanpa tunnel (HP se-WiFi): `python -m bk_site.app --host 0.0.0.0 --port 5000`, buka `http://<IP-laptop>:5000/`
- Exe: `dist\RadarBK\RadarBK.exe --port 5100` (args lolos, console=True)

## Aturan sidang

1. Start tunnel H-5 menit, stop right after demo.
2. Jangan upload data asli selama tunnel aktif (pakai seed 24 siswa).
3. Jangan share URL di luar penguji / grup sidang.
4. Grafik butuh internet sekali load (Chart.js CDN) — tunnel sudah online jadi OK.

## Troubleshooting

| Gejala | Fix |
|---|---|
| `cloudflared tak ketemu` | Install biner, restart terminal |
| `Flask tak sehat (30 dtk)` | Port dipakai: ganti `-Port`; cek `python -m bk_site.app --port 5100` manual |
| URL 502 dari cloudflared | Flask mati duluan — cek log job, kill `python.exe` ganda |
| Exe buka browser lama | Normal FROZEN auto-open; pakai `--host/--port` aktual |
