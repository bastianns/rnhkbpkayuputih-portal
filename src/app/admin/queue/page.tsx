'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, ShieldCheck, RefreshCw, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

// MVC Imports
import { fetchVettingQueue, resolveQuarantineAction } from '@/actions/queueController';
import { QueueCard } from '@/components/ui/QueueCard';

export default function QueuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [wijkList, setWijkList] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const fetchQueue = useCallback(async () => {
    setIsInitialLoading(true);
    const { items: qData, wijkList: wData } = await fetchVettingQueue();
    setItems(qData);
    setWijkList(wData);
    setIsInitialLoading(false);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // ── Animasi Background & Entry ──
  useEffect(() => {
    if (isInitialLoading || !bgAmbientRef.current) return;
    waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'], opacity: [0.03, 0.08, 0.03], scale: [1, 1.2, 1], duration: 40000, iterations: Infinity, easing: 'linear'
    });
  }, [isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading) return;
    const timer = setTimeout(() => {
      if (!headerRef.current || !titleRef.current) return;
      if (!titleRef.current.dataset.split) {
        titleRef.current.innerText = "Data Vetting Queue";
        splitText(titleRef.current, { chars: true });
        titleRef.current.dataset.split = "true";
      }
      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });
      tl.add(headerRef.current, { opacity: [0, 1], y: [-20, 0] });
      tl.add(titleRef.current.querySelectorAll('span'), { opacity: [0, 1], y: [20, 0], rotateX: [90, 0], delay: stagger(30) }, '<-=600');
      tl.add(document.querySelectorAll('.anim-metric'), { opacity: [0, 1], y: [20, 0], delay: stagger(100) }, '<-=500');
      tl.add(document.querySelectorAll('.anim-queue-card'), { opacity: [0, 1], x: [80, 0], ease: 'outElastic(1, 0.6)', delay: stagger(100, { start: 200 }) }, '<-=600');
    }, 150);
    return () => clearTimeout(timer);
  }, [isInitialLoading, items]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Apakah Anda yakin ingin melakukan ${action.toUpperCase()} pada data ini?`)) return;
    
    setLoadingId(id);
    const targetItem = items.find(i => i.id_quarantine === id);
    const result = await resolveQuarantineAction(id, action, targetItem);

    if (result.success) {
      const cardEl = document.getElementById(`queue-card-${id}`);
      if (cardEl) {
        animate(cardEl, { scale: 0.8, x: action === 'approve' ? 100 : -100, opacity: 0, duration: 500, ease: 'inExpo' });
        await new Promise(r => setTimeout(r, 500));
      }
      setItems(prev => prev.filter(i => i.id_quarantine !== id));
    } else {
      alert(`Gagal: ${result.error}`);
    }
    setLoadingId(null);
  };

  if (isInitialLoading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
      <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px]">Mengakses Karantina Data...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#051122] font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden flex justify-center items-start">
        <div ref={bgAmbientRef} className="w-[120vmax] h-[120vmax] -translate-y-1/2 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6" style={{ opacity: 0 }}>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck size={14} /> Security Control</p>
            <h1 ref={titleRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Data Vetting Queue</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1 text-left">Verifikasi & Integritas Registrasi Jemaat</p>
          </div>
          <button onClick={fetchQueue} onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')} className="flex items-center gap-2 px-6 py-4 bg-[#0a192f] border border-[#C5A059]/30 text-[#C5A059] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-colors hover:bg-[#C5A059]/10"><RefreshCw size={16} /> Segarkan Antrean</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard className="anim-metric" label="Menunggu Verifikasi" value={items.length} icon={<Clock size={28} className="text-[#C5A059]" />} />
          <MetricCard className="anim-metric" label="Integritas Sistem" value="Terjaga" icon={<ShieldCheck size={28} className="text-emerald-400" />} />
          <MetricCard className="anim-metric" label="Status Vetting" value="Online" icon={<RefreshCw size={28} className="text-blue-400" />} />
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-[#0a192f]/40 backdrop-blur-xl p-20 rounded-[3rem] border border-[#C5A059]/10 text-center flex flex-col items-center justify-center space-y-4">
              <CheckCircle size={64} className="text-[#C5A059]/20" />
              <p className="text-xl font-black text-white uppercase italic tracking-widest">Karantina Bersih</p>
            </div>
          ) : (
            items.map((item) => (
              <QueueCard 
                key={item.id_quarantine} 
                item={item} 
                wijkName={wijkList.find(w => w.id_wijk === item.raw_data.id_wijk)?.nama_wijk || 'Belum dipilih'} 
                loadingId={loadingId} 
                onAction={handleAction} 
                onSpring={handleSpringBtn} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, className = '' }: any) {
  return (
    <div className={`${className} bg-[#0a192f]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 flex items-center justify-between group`}>
      <div className="text-left space-y-1">
        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">{label}</p>
        <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
      </div>
      <div className="p-4 bg-[#C5A059]/10 rounded-[1.5rem] border border-[#C5A059]/20 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
  );
}