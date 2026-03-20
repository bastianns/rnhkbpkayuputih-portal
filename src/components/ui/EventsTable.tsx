import Link from 'next/link';
import { Calendar, Clock, ChevronRight, Activity, Loader2 } from 'lucide-react';
import { animate, spring } from 'animejs';

interface EventsTableProps {
  loading: boolean;
  events: any[];
  searchTerm: string;
}

export function EventsTable({ loading, events, searchTerm }: EventsTableProps) {
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  return (
    <div className="bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-[#C5A059]/10">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Info Kegiatan</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Waktu Pelaksanaan</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Status Gerbang</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-[#C5A059]" size={36} />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059]/60 font-bold animate-pulse">Memuat Jadwal Kegiatan...</p>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold italic">
                  {searchTerm ? "Kegiatan tidak ditemukan." : "Belum ada jadwal kegiatan."}
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id_kegiatan} className="anim-row hover:bg-[#C5A059]/10 transition-all duration-300 group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm md:text-base font-black text-white uppercase tracking-wider group-hover:text-[#C5A059] transition-colors">
                        {ev.nama_kegiatan}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <Activity size={12} className="text-[#C5A059]/80" /> {ev.kategori_kegiatan?.nama_kategori}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                        <Calendar size={12} className="text-[#C5A059]/50" /> 
                        {new Date(ev.tanggal_mulai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                        <Clock size={12} className="text-[#C5A059]/50" /> 
                        {new Date(ev.tanggal_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {ev.is_open ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[9px] font-black uppercase tracking-widest shadow-inner animate-pulse">
                         Live (Terbuka)
                      </span>
                    ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/30 text-red-500 text-[9px] font-black uppercase tracking-widest shadow-inner">
                         Ditutup
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link 
                      href={`/admin/events/${ev.id_kegiatan}/attendance`}
                      onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                      onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                      className="inline-flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-[#051122] px-4 py-2.5 rounded-xl transition-all"
                    >
                      Buka Absensi <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}