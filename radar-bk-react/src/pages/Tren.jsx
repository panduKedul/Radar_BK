import students from '../data/students.json'
import TrendChart from '../components/TrendChart.jsx'

export default function Tren() {
  const labels = students.length ? students[0].kelas_labels : []
  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Tren Nilai</h1>
      <TrendChart students={students} labels={labels} />
    </div>
  )
}
