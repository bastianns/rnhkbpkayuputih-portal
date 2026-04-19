import Link from 'next/link';
import { MapPin, Phone, Mail, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { animate, spring } from 'animejs';

interface RecordsTableProps {
  loading: boolean;
  records: any[];
  searchTerm: string;
  prefixCls?: string;
}

export function RecordsTable({ loading, records, searchTerm, prefixCls = 'rc-table' }: RecordsTableProps) {
  // ── FITUR: Tactile Spring Feedback ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  return (
    <div className={`${prefixCls}-container bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-[#C5A059]/10">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Identitas Jemaat</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Kontak Terdaftar</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Status Record</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-[#C5A059]" size={36} />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059]/60 font-bold animate-pulse">Menarik Data Master...</p>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold italic">
                  {searchTerm ? "Data tidak ditemukan." : "Belum ada data di dalam SSOT."}
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id_anggota} className="anim-row hover:bg-[#C5A059]/10 transition-all duration-300 group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm md:text-base font-black text-white uppercase tracking-wider group-hover:text-[#C5A059] transition-colors">
                        {record.nama_lengkap}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <MapPin size={12} className="text-[#C5A059]/80" /> {record.wijk?.nama_wijk || 'Belum Terklasifikasi'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                        <Mail size={12} className="text-[#C5A059]/50" /> {record.email || '-'}
                      </span>
                      <span className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                        <Phone size={12} className="text-[#C5A059]/50" /> {record.no_telp || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[9px] font-black uppercase tracking-widest shadow-inner">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link 
                      href={`/admin/records/${record.id_anggota}`}
                      onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                      onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                      className="inline-flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-[#C5A059] hover:text-[#051122] hover:border-[#C5A059] px-5 py-3 rounded-xl transition-all shadow-sm group-hover:shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                    >
                      Golden Record <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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