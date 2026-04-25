import { UserPlus, Mail, Phone, Calendar, MapPin, Merge, X, Loader2, AlertCircle, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

interface QueueCardProps {
  item: any;
  wijkName: string;
  loadingId: string | null;
  onAction: (id: string, action: 'ACCEPT' | 'REJECT' | 'MERGE', candidateId?: string) => void;
  onSpring: (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => void;
  prefixCls?: string;
}

export function QueueCard({ item, wijkName, loadingId, onAction, onSpring, prefixCls = 'rc-card' }: QueueCardProps) {
  const isLoading = loadingId === item.id_quarantine;
  const candidates: any[] = item.candidates || [];
  const [candidateIdx, setCandidateIdx] = useState(0);
  
  // Ambil kandidat saat ini (Hasil normalisasi dari controller)
  const currentCandidate = candidates[candidateIdx] ?? null;

  return (
    <div 
      id={`queue-card-${item.id_quarantine}`}
      className={`${prefixCls}-container anim-queue-card bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col gap-8 transition-all hover:border-[#C5A059]/50`}
    >
      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start">
        {/* DATA BARU (PENDAFTAR) */}
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

        {/* DATA LAMA (PEMBANDING / CANDIDATES) */}
        {currentCandidate && currentCandidate.anggota && (
          <div className="flex-1 w-full space-y-6 text-left bg-blue-900/10 p-6 rounded-[2rem] border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
               Match Found: {(currentCandidate.score * 100).toFixed(1)}%
            </div>

            <div className="flex items-center justify-between border-b border-blue-500/10 pb-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
                  <Users size={28} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Data SSOT (Existing)</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{currentCandidate.anggota.nama_lengkap}</h3>
                </div>
              </div>

              {/* Navigator jika ada > 1 candidate */}
              {candidates.length > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    disabled={candidateIdx === 0}
                    onClick={() => setCandidateIdx(prev => prev - 1)}
                    className="p-2 bg-white/5 rounded-lg text-white disabled:opacity-20"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-bold text-white/50">{candidateIdx + 1}/{candidates.length}</span>
                  <button 
                    disabled={candidateIdx === candidates.length - 1}
                    onClick={() => setCandidateIdx(prev => prev + 1)}
                    className="p-2 bg-white/5 rounded-lg text-white disabled:opacity-20"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataPoint 
                icon={<Mail size={14}/>} 
                label="Email Terdaftar" 
                value={currentCandidate.anggota.email || '-'} 
                isMatch={item.raw_data.email === currentCandidate.anggota.email} 
              />
              <DataPoint 
                icon={<Phone size={14}/>} 
                label="Nomor Telepon" 
                value={currentCandidate.anggota.no_telp || '-'} 
                isMatch={item.raw_data.no_telp === currentCandidate.anggota.no_telp} 
              />
              <DataPoint 
                icon={<Calendar size={14}/>} 
                label="Tanggal Lahir" 
                value={currentCandidate.anggota.tanggal_lahir || '-'} 
                isMatch={item.raw_data.tanggal_lahir === currentCandidate.anggota.tanggal_lahir} 
              />
              <DataPoint 
                icon={<MapPin size={14}/>} 
                label="Wijk / Wilayah" 
                value={currentCandidate.anggota.wijk?.nama_wijk || '-'} 
                isMatch={wijkName === currentCandidate.anggota.wijk?.nama_wijk} 
              />
            </div>
          </div>
        )}

        {/* AKSI PANEL */}
        <div className="w-full lg:w-72 flex flex-col gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 shrink-0">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] text-center mb-1">Tindakan SSOT</p>

          {currentCandidate ? (
            <>
              <button
                onClick={() => onAction(item.id_quarantine, 'MERGE', currentCandidate.id_candidate)}
                disabled={!!loadingId}
                onMouseDown={(e) => onSpring(e as any, 'down')}
                onMouseUp={(e) => onSpring(e as any, 'up')}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Merge size={16} /> Merge Records</>}
              </button>
            </>
          ) : (
            <button
              onClick={() => onAction(item.id_quarantine, 'ACCEPT')}
              disabled={!!loadingId}
              onMouseDown={(e) => onSpring(e as any, 'down')}
              onMouseUp={(e) => onSpring(e as any, 'up')}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C5A059] text-[#051122] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#d4b46a] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><AlertCircle size={16} /> Accept New</>}
            </button>
          )}

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
      
      {currentCandidate && (
        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-amber-500" size={18} />
          <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest leading-relaxed">
            Sistem mendeteksi kemiripan identitas. Gunakan <span className="text-white underline">Merge</span> untuk menggabungkan data login baru dengan profil jemaat yang sudah ada.
          </p>
        </div>
      )}
    </div>
  );
}

function DataPoint({ icon, label, value, isMatch }: any) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
      isMatch ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#051122]/50 border-white/5'
    }`}>
      <div className={`p-2 rounded-lg shadow-inner ${isMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#C5A059]/10 text-[#C5A059]'}`}>{icon}</div>
      <div className="text-left overflow-hidden">
        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className={`text-xs font-bold tracking-wide truncate ${isMatch ? 'text-emerald-400' : 'text-white'}`}>{value || '-'}</p>
      </div>
    </div>
  );
}
