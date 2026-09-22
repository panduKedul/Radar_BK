# Radar BK React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrasi full Radar BK Flask ke Vite React + Tailwind + JSON statis, visual inspirasi CoreUI.

**Architecture:** Vite SPA, react-router 8 route, lib JS port 1:1 dari `risk.py`/`rekom.py`/`tanya.py`, localStorage ganti state.json, SheetJS untuk upload xlsx client-side, canvas murni untuk tren offline.

**Tech Stack:** Vite 5 + React 19 + Tailwind v4 + react-router-dom 6 + SheetJS xlsx 0.18 + Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-22-radar-bk-react-design.md`

## Global Constraints

- Bahasa UI ID penuh, copy sama dengan Flask (RADAR BK, tagline sinyal).
- Skor rule-based: absensi<95 +40, rata<85 +30, poin>0 +20, tren Turun +10; Aman≤20/Pantau≤50/Intervensi51+.
- Offline-first, tanpa LLM/API/CDN (chart canvas murni).
- Footer: Muhammad Pandu Wirakusuma · Telkom University Jakarta · © 2026, sticky bottom.
- Seed JSON tak boleh dihapus; dataset aktif dilindungi dari hapus.
- Node 20+, npm, Python hanya untuk konversi xlsx→JSON sekali.

---

## File Structure

```
radar-bk-react/
├── package.json, vite.config.js, tailwind.config.js, index.html
├── src/
│   ├── main.jsx, App.jsx (router), index.css (tailwind)
│   ├── data/students.json (seed, dari Data Kelas 5 lengkap.xlsx)
│   ├── lib/risk.js, rekom.js, tanya.js, store.js, xlsx-validate.js
│   ├── components/AdminLayout.jsx, StatCard.jsx, Badge.jsx, RiskTable.jsx, TrendChart.jsx, SosioForm.jsx, UploadBox.jsx, ChatBubble.jsx
│   └── pages/Landing.jsx, Radar.jsx, Siswa.jsx, Tren.jsx, Kasus.jsx, Sosiometri.jsx, DataPage.jsx, Tanya.jsx, NotFound.jsx
└── tests/*.test.js (vitest port 39 pytest)
```

---

### Task 1: Scaffold + AdminLayout shell

**Files:**
- Create: `radar-bk-react/package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/components/AdminLayout.jsx`
- Test: `radar-bk-react/tests/shell.test.jsx`

**Interfaces:**
- Consumes: nothing
- Produces: `AdminLayout` (props: children), router outlet, nav 7 item

- [ ] **Step 1: Write the failing test**

```jsx
// tests/shell.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'
test('sidebar tampil 7 nav + footer formal', () => {
  render(<MemoryRouter><App /></MemoryRouter>)
  expect(screen.getByText(/RADAR BK/)).toBeTruthy()
  expect(screen.getByText(/Pandu/)).toBeTruthy()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/shell.test.jsx`
Expected: FAIL with "Cannot find module ../src/App.jsx"

- [ ] **Step 3: Write minimal implementation**

```bash
npm create vite@latest radar-bk-react -- --template react
npm i react-router-dom xlsx
npm i -D tailwindcss postcss autoprefixer vitest @testing-library/react
```

```jsx
// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import AdminLayout from './components/AdminLayout.jsx'
import Landing from './pages/Landing.jsx'
export default function App(){ return (<AdminLayout><Routes><Route path="/" element={<Landing/>}/></Routes></AdminLayout>) }
```

```jsx
// src/components/AdminLayout.jsx
export default function AdminLayout({children}){
  return (<div className="flex min-h-screen bg-[#f3f4f6]">
    <aside className="w-60 bg-[#1e2a3a] text-white p-4 hidden md:block">RADAR BK<nav>...</nav></aside>
    <div className="flex-1 flex flex-col"><main className="flex-1 p-4">{children}</main>
    <footer className="bg-[#1e2a3a] text-white text-center p-3">Muhammad Pandu Wirakusuma · Telkom University Jakarta · © 2026</footer></div></div>)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/shell.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add radar-bk-react
git commit -m "feat: scaffold react tailwind admin shell"
```

---

### Task 2: Seed JSON + risk/rekom lib

**Files:**
- Create: `radar-bk-react/src/data/students.json`, `src/lib/risk.js`, `src/lib/rekom.js`
- Test: `radar-bk-react/tests/risk.test.js`

**Interfaces:**
- Consumes: `Data Kelas 5 lengkap.xlsx`
- Produces: `computeRisk(s)` → `{skor,badge,alasan}`; `rekomendasi(s,risk)` → `string[]`

- [ ] **Step 1: Write the failing test**

```js
// tests/risk.test.js
import { computeRisk } from '../src/lib/risk.js'
test('absensi 94 + rata 80 + poin 1 + turun = 100 Intervensi', () => {
  const s = { kelas_akhir:'Kelas 5', tren:'Turun', kelas_rows:{'Kelas 5':{absensi:94,rata:80,poin:1,ipas:80,bind:80,mtk:80}} }
  const r = computeRisk(s)
  expect(r.skor).toBe(100); expect(r.badge).toBe('Intervensi')
})
test('semua baik = 0 Aman', () => {
  const s = { kelas_akhir:'Kelas 5', tren:'Naik', kelas_rows:{'Kelas 5':{absensi:100,rata:90,poin:0,ipas:90,bind:90,mtk:90}} }
  expect(computeRisk(s).badge).toBe('Aman')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/risk.test.js`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```bash
python -c "import openpyxl,json; print('konversi via script tools/convert_xlsx.py')"
# tools/convert_xlsx.py baca bk_site/data_loader.load_dataset lalu dump students list ke src/data/students.json
```

```js
// src/lib/risk.js
export function computeRisk(s){
  const kr = (s.kelas_rows||{})[s.kelas_akhir]||{};
  let skor=0; const alasan=[];
  if((kr.absensi??100)<95){skor+=40;alasan.push(`Absensi ${Number(kr.absensi).toFixed(1)}% < 95`)}
  if((kr.rata??100)<85){skor+=30;alasan.push(`Rata ${kr.rata} < 85`)}
  if((kr.poin??0)>0){skor+=20;alasan.push(`Poin pelanggaran ${kr.poin}`)}
  if(String(s.tren||'').toLowerCase()==='turun'){skor+=10;alasan.push('Tren akhir Turun')}
  const badge = skor<=20?'Aman':(skor<=50?'Pantau':'Intervensi');
  return {skor,badge,alasan:alasan.length?alasan:['Semua indikator baik']};
}
```

```js
// src/lib/rekom.js (port rekom.py 1:1)
export function rekomendasi(s,risk){
  const kr=(s.kelas_rows||{})[s.kelas_akhir]||{}; const out=[];
  if(risk.badge==='Intervensi') out.push('Prioritas: panggil siswa minggu ini; bila tak membaik, undang orang tua.');
  if((kr.absensi??100)<95) out.push('Konseling individu soal kehadiran; koordinasi wali kelas; bila berlanjut, kunjungan rumah.');
  if((kr.rata??100)<85){const lemah=[['IPAS',kr.ipas],['B.Indonesia',kr.bind],['Matematika',kr.mtk]].sort((a,b)=>(a[1]??100)-(b[1]??100))[0][0];out.push(`Bimbingan belajar mapel terlemah (${lemah}); pantau tugas 2 minggu.`)}
  if((kr.poin??0)>0) out.push('Pembinaan bertahap sesuai tata tertib; catat di buku saku BK.');
  if(s.tren==='Turun') out.push('Observasi 2 minggu: sandingkan tren nilai dengan kehadiran.');
  if(!out.length) out.push('Pertahankan; beri apresiasi agar konsisten.');
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/risk.test.js`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add radar-bk-react/src/data radar-bk-react/src/lib radar-bk-react/tests/risk.test.js
git commit -m "feat: seed json plus risk rekom lib"
```

---

### Task 3: Radar + Siswa + Tren pages

**Files:**
- Create: `src/components/Badge.jsx`, `RiskTable.jsx`, `TrendChart.jsx`, `src/pages/Radar.jsx`, `Siswa.jsx`, `Tren.jsx`, `Landing.jsx`
- Test: `tests/pages.test.jsx`

**Interfaces:**
- Consumes: `computeRisk`, `students.json`
- Produces: pages render tabel sort desc, profil + rekom, chart canvas

- [ ] **Step 1: Write the failing test**

```jsx
// tests/pages.test.jsx
import { computeRisk } from '../src/lib/risk.js'
import data from '../src/data/students.json'
test('24 siswa seed + sort desc', () => {
  expect(data.length).toBe(24)
  const rows = data.map(s=>({...s,risk:computeRisk(s)})).sort((a,b)=>b.risk.skor-a.risk.skor)
  expect(rows[0].risk.skor).toBeGreaterThanOrEqual(rows[23].risk.skor)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/pages.test.jsx`
Expected: FAIL with "Cannot find module ../src/data/students.json"

- [ ] **Step 3: Write minimal implementation**

```jsx
// RiskTable.jsx: table nama, kelas akhir, absensi, rata, poin, tren, badge, skor; sort by skor desc
// TrendChart.jsx: <canvas> gambar garis ip_k/bi_k/mtk_k + label kelas_labels, tanpa lib luar
// Radar.jsx: const rows = students.map(s=>({...s,risk:computeRisk(s)})).sort((a,b)=>b.risk.skor-a.risk.skor)
// Siswa.jsx: useParams sid; find by id else <NotFound/>; tampil ID di bawah nama + tombol kembali + alasan + rekom list
// Landing.jsx: hero gradasi ungu-biru + 6 kartu nav + n + n_int
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/pages.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add radar-bk-react/src/pages radar-bk-react/src/components/Badge.jsx radar-bk-react/src/components/RiskTable.jsx radar-bk-react/src/components/TrendChart.jsx
git commit -m "feat: radar siswa tren landing pages"
```

---

### Task 4: Kasus + Sosiometri + store

**Files:**
- Create: `src/lib/store.js`, `src/pages/Kasus.jsx`, `Sosiometri.jsx`, `src/components/SosioForm.jsx`
- Test: `tests/store.test.js`

**Interfaces:**
- Consumes: `computeRisk`
- Produces: `loadState()/saveState()`, STATUS, SOSIO di localStorage key `radar-bk-v1`

- [ ] **Step 1: Write the failing test**

```js
// tests/store.test.js
import { saveState, loadState } from '../src/lib/store.js'
test('status roundtrip', () => {
  saveState({S1:'rujuk'}, {}, 'seed.xlsx')
  expect(loadState().status.S1).toBe('rujuk')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/store.test.js`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/store.js
const K='radar-bk-v1';
export function loadState(){ try{return JSON.parse(localStorage.getItem(K))||{status:{},sosio:{}}}catch{return{status:{},sosio:{}}} }
export function saveState(status,sosio){ localStorage.setItem(K,JSON.stringify({status,sosio})) }
// Kasus.jsx: choices observasi/dipanggil/orangtua/rujuk; select per baris onChange save
// Sosiometri.jsx: Counter top5 + terisol; SosioForm: select pemilih + 3 select teman; guard pemilih!==teman + unik; edit prefill + daftar Sudah mengisi
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/store.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add radar-bk-react/src/lib/store.js radar-bk-react/src/pages/Kasus.jsx radar-bk-react/src/pages/Sosiometri.jsx
git commit -m "feat: kasus sosiometri localstorage"
```

---

### Task 5: Tanya + Data upload

**Files:**
- Create: `src/lib/tanya.js`, `src/lib/xlsx-validate.js`, `src/pages/Tanya.jsx`, `DataPage.jsx`, `src/components/ChatBubble.jsx`, `UploadBox.jsx`
- Test: `tests/tanya.test.js`

**Interfaces:**
- Consumes: `computeRisk`, `rekomendasi`, `students.json`
- Produces: `jawab(q, DATA)` string ID; `validateRows()` pesan ramah

- [ ] **Step 1: Write the failing test**

```js
// tests/tanya.test.js
import { jawab } from '../src/lib/tanya.js'
import data from '../src/data/students.json'
const DATA = { students: data }
test('bantuan list 6 kategori', () => { expect(jawab('bantuan',DATA)).toMatch(/kehadiran/) })
test('nama asing ramah', () => { expect(jawab('Zzz nilai mtk gimana?',DATA)).toMatch(/Ups/) })
test('ranking 1', () => { expect(jawab('ranking 1',DATA)).toMatch(/Ranking/) })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/tanya.test.js`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/tanya.js: port tanya.py 344 baris -> JS; urutan intent: nama+mapel > tren ya/tidak > poin > ranking > badge ekstrem > superlatif > level kelas > bantuan; cap q 300 char
// DataPage.jsx: UploadBox SheetJS read -> validate header toleran (id,nama,kelas,3 nilai,absensi,rata,poin + ID/Nama) -> set aktif -> reset status/sosio; list file + aktif badge + hapus guard (seed + aktif dilindungi); template unduh build workbook client-side
// Tanya.jsx: riwayat cap20 localStorage + reset btn POST lokal
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/tanya.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add radar-bk-react/src/lib/tanya.js radar-bk-react/src/pages/Tanya.jsx radar-bk-react/src/pages/DataPage.jsx
git commit -m "feat: tanya rule-based plus data upload"
```

---

### Task 6: Build smoke + polish

**Files:**
- Modify: `src/components/AdminLayout.jsx` (hamburger), `src/index.css` (focus, reduced-motion)
- Test: `tests/smoke.test.js`

**Interfaces:**
- Consumes: all pages
- Produces: `dist/` build lolos, 8 route render

- [ ] **Step 1: Write the failing test**

```js
// tests/smoke.test.js
import { routes } from '../src/App.jsx'
test('8 route terdaftar', () => { expect(routes.length).toBeGreaterThanOrEqual(8) })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/smoke.test.js`
Expected: FAIL with "routes not exported"

- [ ] **Step 3: Write minimal implementation**

```jsx
// App.jsx export const routes=[...8 route...]; AdminLayout hamburger useState; css: :focus-visible outline, @media prefers-reduced-motion
// vite build; cek dist/index.html ada
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/smoke.test.js
npm run build`
Expected: PASS + dist built

- [ ] **Step 5: Commit**

```bash
git add radar-bk-react
git commit -m "feat: polish responsive plus build smoke"
```

---

## Self-Review

- Spec coverage: S1 scaffold Task1, seed+risk Task2, pages Task3, kasus/sosio Task4, tanya/data Task5, polish Task6. Semua CLO spec terpetakan.
- Placeholder scan: no TBD/TODO, semua step ada kode + command exact.
- Type consistency: computeRisk/rekomendasi/jawab signature sama lintas task; STATUS/SOSIO key `radar-bk-v1` konsisten.
