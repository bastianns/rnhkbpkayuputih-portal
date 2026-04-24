import { UserPlus, Mail, Phone, Calendar, MapPin, Merge, X, Loader2 } from 'lucide-react';

interface QueueCardProps {
  item: any;
  wijkName: string;
  loadingId: string | null;
  onAction: (id: string, action: 'ACCEPT' | 'REJECT' | 'MERGE') => void;
  onSpring: (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => void;
  prefixCls?: string;
}

export function QueueCard({ item, wijkName, loadingId, onAction, onSpring, prefixCls = 'rc-card' }: QueueCardProps) {
  const isLoading = loadingId === item.id_quarantine;

  return (
    <div 
      id={`queue-card-${item.id_quarantine}`}
      className={`${prefixCls}-container anim-queue-card bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row gap-8 justify-between items-start transition-all hover:border-[#C5A059]/50`}
    >
      <div className="flex-1 w-full space-y-6 text-left">
        <div className="flex items-center gap-5 border-b border-white/5 pb-6">
          <div className="p-4 bg-[#C5A059]/10 rounded-2xl border border-[#C5A059]/20 shadow-inner">
            <UserPlus size={28} className="text-[#C5A059]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-1">Pengajuan Baru</p>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{item.raw_data.nama_lengkap}</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataPoint icon={<Mail size={14}/>} label="Email Terdaftar" value={item.raw_data.email} />
          <DataPoint icon={<Phone size={14}/>} label="Nomor Telepon" value={item.raw_data.no_telp || '-'} />
          <DataPoint icon={<Calendar size={14}/>} label="Tanggal Lahir" value={item.raw_data.tanggal_lahir || '-'} />
          <DataPoint icon={<MapPin size={14}/>} label="Wijk / Wilayah" value={wijkName} />
        </div>
      </div>

      <div className="w-full lg:w-72 flex flex-col gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 shrink-0">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] text-center mb-1">Tindakan SSOT</p>
        
        <button
          onClick={() => onAction(item.id_quarantine, 'ACCEPT')}
          disabled={!!loadingId}
          onMouseDown={(e) => onSpring(e as any, 'down')}
          onMouseUp={(e) => onSpring(e as any, 'up')}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C5A059] text-[#051122] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#d4b46a] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)]"
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Merge size={16} /> Approve & Merge</>}
        </button>

        <button
          onClick={() => onAction(item.id_quarantine, 'REJECT')}
          disabled={!!loadingId}
          onMouseDown={(e) => onSpring(e as any, 'down')}
          onMouseUp={(e) => onSpring(e as any, 'up')}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-900/50 hover:text-white transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><X size={16} /> Reject Data</>}
        </button>
      </div>
    </div>
  );
}

function DataPoint({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 bg-[#051122]/50 p-4 rounded-2xl border border-white/5">
      <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-lg shadow-inner">{icon}</div>
      <div className="text-left">
        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xs font-bold text-white tracking-wide truncate">{value || '-'}</p>
      </div>
    </div>
  );
}