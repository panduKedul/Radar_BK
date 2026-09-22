import { useEffect, useRef, useState } from 'react'
import { computeRisk } from '../lib/risk.js'

const BADGE_COLOR = { Aman: '#059669', Pantau: '#d97706', Intervensi: '#dc2626' }
const LINE_SERIES = [
  { key: 'ip_k', label: 'IPAS', color: '#4f46e5' },
  { key: 'bi_k', label: 'B. Indonesia', color: '#059669' },
  { key: 'mtk_k', label: 'Matematika', color: '#d97706' },
]

function setupCanvas(ref, h) {
  const canvas = ref.current
  if (!canvas) return null
  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth || 800
  canvas.width = W * dpr
  canvas.height = h * dpr
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H_unused(h))
  return { ctx, W, H: h }
  function H_unused(v) { return v }
}

export function BarTrend({ students }) {
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const [tip, setTip] = useState(null)
  const rows = students.map((s) => {
    const kr = (s.kelas_rows || {})[s.kelas_akhir] || {}
    const risk = computeRisk(s)
    return { id: s.id, nama: s.nama, rata: kr.rata ?? 0, badge: risk.badge, skor: risk.skor }
  }).sort((a, b) => b.rata - a.rata)

  useEffect(() => {
    const got = setupCanvas(ref, 420)
    if (!got) return
    const { ctx, W, H } = got
    const pad = { l: 44, r: 12, t: 16, b: 110 }
    const max = 100
    const X = (i) => pad.l + (i + 0.5) * ((W - pad.l - pad.r) / rows.length)
    const bw = Math.max(((W - pad.l - pad.r) / rows.length) * 0.62, 4)
    const Y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
    ctx.font = '12px system-ui'
    // grid + ambang 85
    ;[0, 20, 40, 60, 80, 100].forEach((v) => {
      ctx.strokeStyle = '#e2e8f0'
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke()
      ctx.fillStyle = '#64748b'; ctx.fillText(v, 10, Y(v) + 4)
    })
    ctx.strokeStyle = '#dc2626'; ctx.setLineDash([6, 4])
    ctx.beginPath(); ctx.moveTo(pad.l, Y(85)); ctx.lineTo(W - pad.r, Y(85)); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#dc2626'; ctx.fillText('Ambang 85', W - 90, Y(85) - 6)
    rows.forEach((r, i) => {
      ctx.fillStyle = BADGE_COLOR[r.badge]
      const x = X(i) - bw / 2
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, Y(r.rata), bw, H - pad.b - Y(r.rata), [6, 6, 0, 0])
      else ctx.rect(x, Y(r.rata), bw, H - pad.b - Y(r.rata))
      ctx.fill()
      ctx.fillStyle = '#334155'
      ctx.fillText(r.rata == null ? '-' : Number(r.rata).toFixed(1), X(i) - 10, Y(r.rata) - 6)
      ctx.save()
      ctx.translate(X(i), H - 8)
      ctx.rotate(-Math.PI / 4)
      ctx.textAlign = 'right'
      ctx.fillText(r.nama.length > 14 ? r.nama.slice(0, 13) + '…' : r.nama, 0, 0)
      ctx.restore()
      ctx.textAlign = 'left'
    })
    ref.current._bars = rows.map((r, i) => ({ x: X(i), w: bw, r }))
  }, [students])

  const onMove = (e) => {
    const canvas = ref.current
    if (!canvas || !canvas._bars) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const hit = canvas._bars.find((b) => Math.abs(b.x - mx) < b.w)
    if (hit) setTip({ x: hit.x, r: hit.r })
    else setTip(null)
  }

  return (
    <div ref={wrapRef} className="relative rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-1 text-lg font-bold">Rata Akhir per Siswa</h2>
      <p className="mb-2 text-sm text-slate-500">Urut tertinggi → terendah. Warna = badge risiko. Garis merah = ambang 85.</p>
      <canvas ref={ref} className="w-full cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setTip(null)} aria-label="Bar rata akhir per siswa" />
      {tip && (
        <div className="pointer-events-none absolute rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg" style={{ left: Math.min(tip.x + 12, 220), top: 60 }}>
          <div className="font-bold">{tip.r.nama}</div>
          <div>Rata: {Number(tip.r.rata).toFixed(1)} · {tip.r.badge} (skor {tip.r.skor})</div>
        </div>
      )}
      <div className="mt-2 flex gap-4 text-xs text-slate-600">
        <span><i className="mr-1 inline-block h-3 w-3 rounded" style={{ background: BADGE_COLOR.Aman }} />Aman</span>
        <span><i className="mr-1 inline-block h-3 w-3 rounded" style={{ background: BADGE_COLOR.Pantau }} />Pantau</span>
        <span><i className="mr-1 inline-block h-3 w-3 rounded" style={{ background: BADGE_COLOR.Intervensi }} />Intervensi</span>
      </div>
    </div>
  )
}

export function ClassLine({ students, labels }) {
  const ref = useRef(null)
  useEffect(() => {
    const got = setupCanvas(ref, 360)
    if (!got) return
    const { ctx, W, H } = got
    const pad = { l: 44, r: 12, t: 16, b: 36 }
    const avg = (key, i) => {
      const vals = students.map((s) => (s[key] || [])[i]).filter((v) => v != null)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }
    const X = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(labels.length - 1, 1)
    const Y = (v) => pad.t + (1 - (v - 60) / 40) * (H - pad.t - pad.b)
    ctx.font = '12px system-ui'
    for (let v = 60; v <= 100; v += 10) {
      ctx.strokeStyle = '#e2e8f0'
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke()
      ctx.fillStyle = '#64748b'; ctx.fillText(v, 12, Y(v) + 4)
    }
    labels.forEach((lb, i) => { ctx.fillStyle = '#334155'; ctx.fillText(lb.replace('Kelas ', 'K'), X(i) - 14, H - 10) })
    LINE_SERIES.forEach((sr) => {
      ctx.strokeStyle = sr.color; ctx.lineWidth = 3
      ctx.beginPath()
      labels.forEach((_, i) => { const y = Y(avg(sr.key, i)); if (i === 0) ctx.moveTo(X(i), y); else ctx.lineTo(X(i), y) })
      ctx.stroke()
      ctx.lineWidth = 1
      labels.forEach((_, i) => {
        const v = avg(sr.key, i)
        ctx.fillStyle = sr.color
        ctx.beginPath(); ctx.arc(X(i), Y(v), 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(X(i), Y(v), 2, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#334155'
        ctx.fillText(v.toFixed(1), X(i) - 12, Y(v) - 10)
      })
    })
  }, [students, labels])
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-1 text-lg font-bold">Tren Rata Kelas K1 → K5</h2>
      <p className="mb-2 text-sm text-slate-500">Rata-rata seluruh siswa per mapel tiap tingkat.</p>
      <canvas ref={ref} className="w-full" aria-label="Garis tren rata kelas" />
      <div className="mt-2 flex gap-4 text-xs text-slate-600">
        {LINE_SERIES.map((s) => (
          <span key={s.key}><i className="mr-1 inline-block h-3 w-3 rounded-full" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  )
}

export function StudentLine({ student, labels }) {
  const ref = useRef(null)
  const series = [
    { label: 'IPAS', color: '#4f46e5', arr: student.ip_k || [] },
    { label: 'B. Indonesia', color: '#059669', arr: student.bi_k || [] },
    { label: 'Matematika', color: '#d97706', arr: student.mtk_k || [] },
  ]
  useEffect(() => {
    const got = setupCanvas(ref, 300)
    if (!got) return
    const { ctx, W, H } = got
    const pad = { l: 44, r: 12, t: 16, b: 36 }
    const X = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(labels.length - 1, 1)
    const Y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b)
    ctx.font = '12px system-ui'
    for (let v = 0; v <= 100; v += 20) {
      ctx.strokeStyle = '#e2e8f0'
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke()
      ctx.fillStyle = '#64748b'; ctx.fillText(v, 12, Y(v) + 4)
    }
    labels.forEach((lb, i) => { ctx.fillStyle = '#334155'; ctx.fillText(lb.replace('Kelas ', 'K'), X(i) - 14, H - 10) })
    series.forEach((sr) => {
      ctx.strokeStyle = sr.color; ctx.lineWidth = 3
      ctx.beginPath()
      let started = false
      labels.forEach((_, i) => {
        const v = sr.arr[i]
        if (v == null) return
        if (!started) { ctx.moveTo(X(i), Y(v)); started = true } else ctx.lineTo(X(i), Y(v))
      })
      ctx.stroke()
      ctx.lineWidth = 1
      labels.forEach((_, i) => {
        const v = sr.arr[i]
        if (v == null) return
        ctx.fillStyle = sr.color
        ctx.beginPath(); ctx.arc(X(i), Y(v), 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(X(i), Y(v), 2, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#334155'
        ctx.fillText(v, X(i) - 10, Y(v) - 10)
      })
    })
  }, [student, labels])
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-1 font-semibold">Grafik Nilai {student.nama}</h2>
      <p className="mb-2 text-sm text-slate-500">Per mapel tiap tingkat — naik/turun kelihatan langsung.</p>
      <canvas ref={ref} className="w-full" aria-label={`Grafik nilai ${student.nama}`} />
      <div className="mt-2 flex gap-4 text-xs text-slate-600">
        {series.map((s) => (
          <span key={s.label}><i className="mr-1 inline-block h-3 w-3 rounded-full" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  )
}

export default function TrendChart({ students, labels }) {
  return (
    <div className="grid gap-4">
      <BarTrend students={students} />
      <ClassLine students={students} labels={labels} />
    </div>
  )
}
