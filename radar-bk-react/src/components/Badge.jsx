const COLORS = {
  Aman: 'bg-emerald-100 text-emerald-800',
  Pantau: 'bg-amber-100 text-amber-800',
  Intervensi: 'bg-red-100 text-red-800',
}
export default function Badge({ value }) {
  const cls = COLORS[value] || 'bg-slate-100 text-slate-800'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{value}</span>
}
