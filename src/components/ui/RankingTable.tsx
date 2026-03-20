import { AlertTriangle, ChevronUp } from 'lucide-react';

interface RankingTableProps {
  allData: any[];
}

export function RankingTable({ allData }: RankingTableProps) {
  return (
    <div className="bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[3rem] shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] border-b border-[#C5A059]/10">
            <tr>
              <th className="px-10 py-8">Pos</th>
              <th className="px-10 py-8">Identity / Wilayah</th>
              <th className="px-10 py-8 text-center">Resources</th>
              <th className="px-10 py-8 text-center">Participation</th>
              <th className="px-10 py-8">Total Score</th>
              <th className="px-10 py-8">Health Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C5A059]/5">
            {allData.map((wijk, index) => (
              <tr key={wijk.id_wijk} className="anim-row hover:bg-[#C5A059]/5 transition-colors group cursor-default">
                <td className="px-10 py-7">
                  <span className={`size-12 rounded-[1rem] flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                    index < 3 ? 'bg-[#C5A059] text-[#051122] shadow-[0_0_15px_rgba(197,160,89,0.2)]' : 'bg-white/5 text-white/40 border border-white/5'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-10 py-7 text-left">
                  <div className="flex flex-col">
                    <span className="font-black text-white uppercase text-lg italic tracking-tight group-hover:text-[#C5A059] transition-colors">{wijk.nama_wijk}</span>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Wijk Code: {wijk.kode_wijk || 'W-ID'}</span>
                  </div>
                </td>
                <td className="px-10 py-7 text-center">
                  <div className="flex flex-col items-center bg-white/5 rounded-2xl py-3 px-4 group-hover:bg-[#C5A059]/10 border border-transparent transition-colors">
                    <span className="text-lg font-black text-white">{wijk.total_anggota}</span>
                    <span className="text-[9px] font-black uppercase text-[#C5A059]/60 tracking-tighter">JIWA</span>
                  </div>
                </td>
                <td className="px-10 py-7 text-center">
                    <div className="flex flex-col items-center bg-white/5 rounded-2xl py-3 px-4 group-hover:bg-[#C5A059]/10 border border-transparent transition-colors">
                    <span className="text-lg font-black text-white">{wijk.total_partisipasi}</span>
                    <span className="text-[9px] font-black uppercase text-[#C5A059]/60 tracking-tighter">EVENTS</span>
                  </div>
                </td>
                <td className="px-10 py-7">
                  <div className="flex items-center gap-2">
                    <div className="px-6 py-3 bg-[#051122] border border-[#C5A059]/30 text-[#C5A059] rounded-2xl text-base font-black shadow-inner italic group-hover:bg-[#C5A059] group-hover:text-[#051122] transition-colors">
                      {wijk.total_poin_wilayah.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-10 py-7">
                  <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl w-fit font-black text-[10px] uppercase tracking-widest ${
                    wijk.indeks_keaktifan < 0.5 ? 'bg-red-950/30 text-red-400 border border-red-900/30' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                  }`}>
                    {wijk.indeks_keaktifan < 0.5 ? <AlertTriangle size={14} className="animate-pulse"/> : <ChevronUp size={14}/>}
                    {wijk.indeks_keaktifan < 0.5 ? 'Low Engagement' : 'Optimal'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}