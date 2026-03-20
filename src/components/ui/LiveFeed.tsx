import { Users, Clock, ChevronRight, Activity } from 'lucide-react';

interface LiveFeedProps {
  attendees: any[];
  feedContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function LiveFeed({ attendees, feedContainerRef }: LiveFeedProps) {
  return (
    <div className="relative z-10 w-full lg:w-[500px] p-8 md:p-12 bg-[#0a192f]/60 backdrop-blur-2xl border-l border-[#C5A059]/10 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex justify-between items-end mb-16 shrink-0">
        <div className="text-left">
          <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-3">Live Intelligence</h2>
          <div className="flex items-baseline gap-3">
            <p className="text-8xl font-black text-white tracking-tighter leading-none">{attendees.length}</p>
            <span className="text-xs font-black text-[#C5A059] uppercase tracking-widest italic">Hadir</span>
          </div>
        </div>
        <Users size={56} className="text-white/5" />
      </div>

      <div ref={feedContainerRef} className="space-y-4 flex-1">
        {attendees.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-[#C5A059]/10 rounded-[3rem] bg-white/5 flex flex-col items-center gap-4">
            <Activity size={32} className="text-[#C5A059]/20 animate-pulse" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Waiting for initial check-in...</p>
          </div>
        ) : (
          attendees.map((log) => (
            <div 
              key={log.id_partisipasi} 
              className="feed-item flex items-center gap-5 p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-[#C5A059]/30 hover:bg-[#C5A059]/5 transition-colors group"
              style={{ opacity: 0 }} // Diatur inline agar ditangkap Anime.js
            >
              <div className="size-14 bg-[#C5A059] text-[#051122] rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                <Users size={24} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-black text-white uppercase text-sm truncate leading-none mb-2 italic tracking-wide group-hover:text-[#C5A059] transition-colors">
                  {log.anggota?.nama_lengkap}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                  <Clock size={12} className="text-[#C5A059]/40" /> 
                  {new Date(log.waktu_check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                 <ChevronRight size={14} className="text-white/10 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 shrink-0">
         <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em] text-center italic">
           RNHKBP SSOT Real-Time Calibration
         </p>
      </div>
    </div>
  );
}