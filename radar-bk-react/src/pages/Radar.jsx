import { computeRisk } from '../lib/risk.js'
import { useDataset } from '../lib/dataset.js'
import RiskTable from '../components/RiskTable.jsx'

export default function Radar() {
  const students = useDataset()
  const rows = students.map((s) => ({ ...s, risk: computeRisk(s) })).sort((a, b) => b.risk.skor - a.risk.skor)
  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Radar Risiko</h1>
      <RiskTable rows={rows} />
    </div>
  )
}
