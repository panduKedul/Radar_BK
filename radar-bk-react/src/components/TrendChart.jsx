import { useEffect, useRef } from 'react'

const SERIES = [
  { key: 'ip_k', label: 'IPAS', color: '#4f46e5' },
  { key: 'bi_k', label: 'B. Indonesia', color: '#059669' },
  { key: 'mtk_k', label: 'Matematika', color: '#d97706' },
]

export default function TrendChart({ students, labels }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth || 600
    const H = canvas.height = 260
    const pad = { l: 36, r: 8, t: 12, b: 28 }
    ctx.clearRect(0, 0, W, H)
    const all = students.flatMap((s) => SERIES.flatMap((sr) => s[sr.key] || []))
    const min = Math.min(...all, 0)
    const max = Math.max(...all, 100)
    const X = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max((labels.length - 1), 1)
    const Y = (v) => pad.t + (1 - (v - min) / Math.max((max - min), 1)) * (H - pad.t - pad.b)
    ctx.strokeStyle = '#e2e8f0'
    ctx.fillStyle = '#64748b'
    ctx.font = '11px system-ui'
    for (let g = 0; g <= 4; g++) {
      const v = min + ((max - min) * g) / 4
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke()
      ctx.fillText(Math.round(v), 4, Y(v) + 4)
    }
    labels.forEach((lb, i) => ctx.fillText(lb.replace('Kelas ', 'K'), X(i) - 8, H - 8))
    students.slice(0, 24).forEach((s) => {
      SERIES.forEach((sr) => {
        const arr = s[sr.key] || []
        ctx.strokeStyle = sr.color
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        arr.forEach((v, i) => { if (i === 0) ctx.moveTo(X(i), Y(v)); else ctx.lineTo(X(i), Y(v)) })
        ctx.stroke()
        ctx.globalAlpha = 1
      })
    })
    SERIES.forEach((sr, i) => {
      ctx.fillStyle = sr.color
      ctx.fillRect(pad.l + i * 110, H - 20, 12, 12)
      ctx.fillStyle = '#334155'
      ctx.fillText(sr.label, pad.l + i * 110 + 16, H - 10)
    })
  }, [students, labels])
  return <canvas ref={ref} className="w-full rounded-xl bg-white shadow" aria-label="Grafik tren nilai" />
}
