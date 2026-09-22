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
