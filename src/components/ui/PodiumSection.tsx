import { Crown, Medal, Activity } from 'lucide-react';

interface PodiumSectionProps {
  topThreeData: any[];
}

export function PodiumSection({ topThreeData }: PodiumSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-8">
      {topThreeData.map((wijk, idx) => {
        const isWinner = idx === 0;
        return (
          <div 
            key={wijk.id_wijk} 
            // Class 'anim-podium' tetap dipertahankan agar bisa ditangkap oleh Anime.js di page.tsx
            className={`anim-podium relative p-10 rounded-[3.5rem] border flex flex-col items-center text-center transition-colors duration-500 hover:scale-105 ${
              isWinner 
                ? 'bg-gradient-to-b from-[#C5A059] to-[#a38040] text-[#051122] border-[#C5A059] shadow-[0_0_40px_rgba(197,160,89,0.3)] z-10' 
                : 'bg-[#0a192f]/60 backdrop-blur-xl border-[#C5A059]/20 shadow-2xl text-white'
            }`}
          >
            {isWinner && (
              <div className="absolute -top-5 bg-[#051122] text-[#C5A059] border border-[#C5A059]/30 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-lg flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Supreme
              </div>
            )}
            
            <div className="mb-6">
              {idx === 0 && <Crown className="text-[#051122]" size={64} />}
              {idx === 1 && <Medal className="text-slate-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" size={56} />}
              {idx === 2 && <Medal className="text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.2)]" size={56} />}
            </div>

            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 leading-tight">
              {wijk.nama_wijk}
            </h3>
            
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-8 ${
              isWinner ? 'bg-[#051122]/10 text-[#051122]' : 'bg-[#C5A059]/10 text-[#C5A059]'
            }`}>
              Ranking #{idx + 1}
            </span>

            <div className={`grid grid-cols-2 gap-8 w-full pt-8 border-t ${isWinner ? 'border-[#051122]/10' : 'border-white/10'}`}>
              <div className="space-y-1">
                <p className={`text-[9px] font-black uppercase opacity-60 tracking-[0.2em] ${isWinner ? 'text-[#051122]' : 'text-[#C5A059]'}`}>Power Score</p>
                <p className="text-3xl font-black tabular-nums">{wijk.total_poin_wilayah.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className={`text-[9px] font-black uppercase opacity-60 tracking-[0.2em] ${isWinner ? 'text-[#051122]' : 'text-[#C5A059]'}`}>Efficiency</p>
                <p className={`text-3xl font-black tabular-nums ${isWinner ? 'text-[#051122]' : 'text-emerald-400'}`}>
                  {wijk.indeks_keaktifan}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}