'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  BadgeCheck, 
  RefreshCw, 
  CheckCircle, 
  Merge,
  AlertCircle,
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
  Loader2,
  Mail
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function QueuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [wijkList, setWijkList] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0 });

  // MOCK RBAC: Dalam produksi, ambil dari session/auth context
  const [userRole] = useState<'ADMIN' | 'VIEWER'>('ADMIN'); 

  // ── Refs untuk Animasi Premium ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const fetchQueue = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const { data: queueData, error: qError } = await supabase
        .from('quarantine_anggota')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (qError) throw qError;

      const { data: wijkData } = await supabase.from('wijk').select('*');
      if (wijkData) setWijkList(wijkData);

      setItems(queueData || []);
      setStats({ pending: queueData?.length || 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // ── FITUR 1: WAAPI Ambient Background Khusus Admin ──
  useEffect(() => {
    if (isInitialLoading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.03, 0.08, 0.03],
      scale: [1, 1.2, 1],
      duration: 40000,
      iterations: Infinity,
      easing: 'linear'
    });

    return () => { ambientAnim?.cancel(); };
  }, [isInitialLoading]);

  // ── FITUR 2: Elastic Staggered Entry Choreography ──
  useEffect(() => {
    if (isInitialLoading) return;

    if (headerRef.current) headerRef.current.style.opacity = '0';
    const metricNodes = Array.from(document.querySelectorAll('.anim-metric'));
    metricNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    const cardNodes = Array.from(document.querySelectorAll('.anim-queue-card'));
    cardNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      if (!headerNode || !titleNode) return;

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        titleNode.innerText = "Data Vetting Queue"; 
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });

      tl.add(headerNode, { opacity: [0, 1], y: [-20, 0] });

      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity: [0, 1], y: [20, 0], rotateX: [90, 0], delay: stagger(30)
        }, '<-=600');
      }

      if (metricNodes.length > 0) {
        tl.add(metricNodes, { opacity: [0, 1], y: [20, 0], delay: stagger(100) }, '<-=500');
      }

      if (cardNodes.length > 0) {
        tl.add(cardNodes, {
          opacity: [0, 1], 
          x: [80, 0], // Meluncur dari jarak lebih jauh
          ease: 'outElastic(1, 0.6)', // Efek membal (bouncing) saat berhenti
          delay: stagger(100, { start: 200 }) // Jeda masuk lebih natural
        }, '<-=600');
      }

    }, 150);

    return () => clearTimeout(timer);
  }, [isInitialLoading, items]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };

  // ── Logika Approval & Exit Animation ──
  const handleAction = async (id_quarantine: string, action: 'approve' | 'reject') => {
    if (userRole !== 'ADMIN') {
      alert("Akses ditolak: Hanya Admin yang dapat memverifikasi data.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin melakukan ${action.toUpperCase()} pada data ini?`)) return;

    setLoadingId(id_quarantine);
    try {
      const item = items.find(i => i.id_quarantine === id_quarantine);
      if (!item) throw new Error("Data tidak ditemukan");

      if (action === 'approve') {
        const { error: insertError } = await supabase.from('anggota').insert([{
          id_auth: item.raw_data.id_auth,
          nama_lengkap: item.raw_data.nama_lengkap,
          email: item.raw_data.email,
          no_telp: item.raw_data.no_telp,
          tanggal_lahir: item.raw_data.tanggal_lahir,
          alamat: item.raw_data.alamat,
          id_wijk: item.raw_data.id_wijk,
          is_verified: true
        }]);
        if (insertError) throw insertError;
      }

      const { error: updateError } = await supabase
        .from('quarantine_anggota')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id_quarantine', id_quarantine);

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_log').insert({
        actor_id: user?.id,
        action: action === 'approve' ? 'APPROVE_QUARANTINE' : 'REJECT_QUARANTINE',
        entity: 'quarantine_anggota',
        entity_id: id_quarantine,
        new_data: { status: action }
      });

      // ── FITUR: Cinematic Exit Animation ──
      const cardEl = document.getElementById(`queue-card-${id_quarantine}`);
      if (cardEl) {
        // Animasikan kartu mengecil dan terlempar keluar sebelum dihapus dari state
        animate(cardEl, {
          scale: 0.8,
          x: action === 'approve' ? 100 : -100, // Terlempar ke kanan jika approve, ke kiri jika reject
          opacity: 0,
          duration: 500,
          ease: 'inExpo'
        });
        
        // Tunggu animasi selesai (500ms) sebelum menghapus dari array
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setItems(prev => prev.filter(i => i.id_quarantine !== id_quarantine));
      setStats(prev => ({ pending: prev.pending - 1 }));

    } catch (err: any) {
      alert(`Gagal memproses data: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
        <Loader2 className="animate-spin text-[#C5A059]" size={40} />
        <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px] animate-pulse">
          Mengakses Karantina Data...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#051122] font-sans text-left relative overflow-hidden">
      
      {/* WAAPI Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-start">
        <div 
          ref={bgAmbientRef} 
          className="w-[120vmax] h-[120vmax] -translate-y-1/2 rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header Setup */}
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6" style={{ opacity: 0 }}>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] flex items-center gap-2">
              <ShieldCheck size={14} className="animate-pulse" /> Security Control
            </p>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2">
              <h1 ref={titleRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                Data Vetting Queue
              </h1>
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
              Verifikasi & Integritas Registrasi Jemaat
            </p>
          </div>
          
          <button 
            onClick={fetchQueue}
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#0a192f] border border-[#C5A059]/30 text-[#C5A059] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059]/10 transition-colors shadow-lg"
          >
            <RefreshCw size={16} /> Segarkan Antrean
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3 text-red-400 text-[10px] font-bold uppercase tracking-widest animate-in fade-in">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QueueMetric 
            className="anim-metric" 
            label="Menunggu Verifikasi" 
            value={stats.pending} 
            icon={<Clock size={28} className="text-[#C5A059]" />} 
          />
          <QueueMetric 
            className="anim-metric" 
            label="Integritas Sistem" 
            value="Terjaga" 
            icon={<ShieldCheck size={28} className="text-emerald-400" />} 
          />
          <QueueMetric 
            className="anim-metric" 
            label="Hak Akses Aktif" 
            value={userRole} 
            icon={<User size={28} className="text-blue-400" />} 
          />
        </div>

        {/* Queue List */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-[#0a192f]/40 backdrop-blur-xl p-20 rounded-[3rem] border border-[#C5A059]/10 text-center flex flex-col items-center justify-center space-y-4">
              <CheckCircle size={64} className="text-[#C5A059]/20" />
              <div>
                <p className="text-xl font-black text-white uppercase italic tracking-widest">Karantina Bersih</p>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-2">Tidak ada data baru yang membutuhkan verifikasi Anda.</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id_quarantine} 
                id={`queue-card-${item.id_quarantine}`} // ID ditambahkan untuk target Exit Animation
                className="anim-queue-card bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row gap-8 justify-between items-start transition-all hover:border-[#C5A059]/50"
              >
                
                {/* Info Identitas */}
                <div className="flex-1 w-full space-y-6">
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
                    <DataPoint icon={<MapPin size={14}/>} label="Wijk / Wilayah" value={wijkList.find(w => w.id_wijk === item.raw_data.id_wijk)?.nama_wijk || 'Belum dipilih'} />
                  </div>
                </div>

                {/* Aksi Verifikasi */}
                <div className="w-full lg:w-72 flex flex-col gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 shrink-0">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] text-center mb-1">Tindakan SSOT</p>
                  
                  <button
                    onClick={() => handleAction(item.id_quarantine, 'approve')}
                    disabled={loadingId === item.id_quarantine}
                    onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                    onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C5A059] text-[#051122] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#d4b46a] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)] hover:shadow-[0_0_25px_rgba(197,160,89,0.4)]"
                  >
                    {loadingId === item.id_quarantine ? <Loader2 className="animate-spin" size={16} /> : <><Merge size={16} /> Approve & Merge</>}
                  </button>

                  <button
                    onClick={() => handleAction(item.id_quarantine, 'reject')}
                    disabled={loadingId === item.id_quarantine}
                    onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                    onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-900/50 hover:text-white transition-all disabled:opacity-50"
                  >
                    {loadingId === item.id_quarantine ? <Loader2 className="animate-spin" size={16} /> : <><X size={16} /> Reject Data</>}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-komponen ──
function QueueMetric({ label, value, icon, className = '' }: any) {
  return (
    <div className={`${className} bg-[#0a192f]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 shadow-2xl flex items-center justify-between group hover:border-[#C5A059]/40 transition-colors`}>
      <div className="text-left space-y-1">
        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">{label}</p>
        <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
      </div>
      <div className="p-4 bg-[#C5A059]/10 rounded-[1.5rem] border border-[#C5A059]/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </div>
  );
}

function DataPoint({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 bg-[#051122]/50 p-4 rounded-2xl border border-white/5">
      <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-lg shadow-inner">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xs font-bold text-white tracking-wide truncate">{value || '-'}</p>
      </div>
    </div>
  );
}