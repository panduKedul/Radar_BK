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
