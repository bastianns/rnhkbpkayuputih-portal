'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, splitText, stagger, waapi } from 'animejs';
import { 
  User, Calendar, MapPin, Phone, Home, 
  ArrowLeft, BadgeCheck, ShieldCheck, Clock,
  Loader2, Activity, CheckCircle2, Star,
  History, Mail
} from 'lucide-react';

export default function MemberDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [member, setMember] = useState<any>(null);
  const [journey, setJourney] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Refs untuk Animasi Premium ──
  const nameRef = useRef<HTMLHeadingElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const bgAmbientRef = useRef<HTMLDivElement>(null);

  const fetchMemberFullData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: memberData, error: mError } = await supabase
        .from('anggota')
        .select('*, wijk:id_wijk (nama_wijk, kode_wijk)')
        .eq('id_anggota', id)
        .single();

      if (mError) throw mError;

      const { data: participationData, error: pError } = await supabase
        .from('riwayat_partisipasi')
        .select(`
          id_partisipasi,
          waktu_check_in,
          status_kehadiran,
          kegiatan:id_kegiatan (nama_kegiatan, tanggal_mulai),
          peran:id_peran (nama_peran)
        `)
        .eq('id_anggota', id)
        .order('waktu_check_in', { ascending: false });

      if (pError) throw pError;

      setMember(memberData);
      setJourney(participationData || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data anggota.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchMemberFullData();
  }, [id, fetchMemberFullData]);

  // ── FITUR 1: WAAPI Ambient Background (Opera Gold) ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.02, 0.06, 0.02],
      scale: [1, 1.15, 1],
      duration: 40000,
      iterations: Infinity,
      easing: 'linear'
    });
    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── FITUR 2: 3D SplitText & Elastic Choreography ──
  useEffect(() => {
    if (loading || !member) return;

    // Persiapan sebelum animasi (Hidden State)
    if (headerCardRef.current) headerCardRef.current.style.opacity = '0';
    const detailCards = Array.from(document.querySelectorAll('.anim-detail-card'));
    detailCards.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    const journeyItems = Array.from(document.querySelectorAll('.anim-journey-item'));
    journeyItems.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const nameNode = nameRef.current;
      const headerNode = headerCardRef.current;
      if (!nameNode || !headerNode) return;

      // Anti-Crash 3D SplitText Initialization
      let splitChars: any[] = [];
      if (!nameNode.dataset.split) {
        const split = splitText(nameNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        nameNode.dataset.split = "true";
      } else {
        splitChars = Array.from(nameNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });
      
      // Card Induk Masuk
      tl.add(headerNode, { opacity: [0, 1], y: [-30, 0] });

      // TRUE 3D SplitText Effect (Seperti mekanik jam / koin)
      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity: [0, 1], 
          translateZ: [-100, 0], 
          rotateX: [-90, 0], 
          ease: 'outElastic(1, 0.5)', 
          delay: stagger(40)
        }, '<-=700');
      }

      // Detail Profile Masuk
      if (detailCards.length > 0) {
        tl.add(detailCards, { 
          opacity: [0, 1], 
          x: [-30, 0], 
          delay: stagger(100) 
        }, '<-=600');
      }

      // Elastic Timeline Journey Masuk
      if (journeyItems.length > 0) {
        tl.add(journeyItems, { 
          opacity: [0, 1], 
          x: [50, 0], 
          ease: 'outElastic(1, 0.6)', 
          delay: stagger(80) 
        }, '<-=500');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [loading, member]);

  // ── FITUR 3: Tactile Spring Feedback ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#051122]">
      <Loader2 className="animate-spin text-[#C5A059] mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]/60 animate-pulse">Membuka Brankas Identitas...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#051122] min-h-screen text-left relative overflow-hidden font-sans">
      
      {/* WAAPI Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-start">
        <div 
          ref={bgAmbientRef} 
          className="w-[150vmax] h-[150vmax] -translate-y-1/2 rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} 
        />
      </div>

      <div className="relative z-10 space-y-8 max-w-7xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="flex items-center gap-2 text-[#C5A059]/60 hover:text-[#C5A059] transition-colors font-black text-[10px] uppercase tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Master Records
          </button>
          
          <Link 
            href={`/admin/logs?search=${member.nama_lengkap}`}
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#0a192f]/80 backdrop-blur-xl border border-[#C5A059]/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:bg-[#C5A059] hover:text-[#051122] transition-all shadow-[0_0_15px_rgba(197,160,89,0.15)] hover:shadow-[0_0_25px_rgba(197,160,89,0.4)]"
          >
            <History size={14} /> Audit Trail
          </Link>
        </div>

        {/* Profile Header Card */}
        <div ref={headerCardRef} className="bg-[#0a192f]/60 backdrop-blur-xl rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#C5A059]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-8">
            <div className="size-24 shrink-0 bg-[#C5A059] rounded-[2.5rem] flex items-center justify-center text-[#051122] shadow-[0_0_30px_rgba(197,160,89,0.3)]">
              <User size={48} />
            </div>
            <div className="text-left">
              {/* Prespektif 3D yang sangat kuat */}
              <div style={{ perspective: '1200px' }} className="overflow-hidden pb-1">
                <h1 ref={nameRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                  {member.nama_lengkap}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="px-4 py-1.5 bg-[#C5A059]/10 text-[#C5A059] rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-[#C5A059]/20 shadow-inner">
                  <BadgeCheck size={14} /> {member.status_keanggotaan || 'Aktif'}
                </span>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#C5A059]" /> SSOT Verified
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-8 border-l border-white/10 pl-10 hidden md:flex">
            <div className="text-right">
              <p className="text-[10px] font-black text-[#C5A059]/60 uppercase tracking-widest mb-1">Total Partisipasi</p>
              <p className="text-5xl font-black text-white tracking-tighter">{journey.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: Detail Profil */}
          <div className="lg:col-span-1 space-y-8">
            <div className="anim-detail-card bg-[#0a192f]/60 backdrop-blur-xl rounded-[2.5rem] border border-[#C5A059]/20 shadow-2xl p-8">
              <h3 className="font-black text-[#C5A059] text-[10px] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                 <Activity size={16} /> Identitas Terintegrasi
              </h3>
              <div className="space-y-8">
                <DetailItem icon={<Calendar size={18}/>} label="Tanggal Lahir" value={member.tanggal_lahir || '-'} />
                <DetailItem icon={<MapPin size={18}/>} label="Wijk (Wilayah)" value={member.wijk?.nama_wijk || '-'} />
                <DetailItem icon={<Phone size={18}/>} label="Kontak Telepon" value={member.no_telp || '-'} />
                <DetailItem icon={<Mail size={18}/>} label="Email Terdaftar" value={member.email || '-'} />
                <DetailItem icon={<Home size={18}/>} label="Domisili" value={member.alamat || '-'} />
              </div>
            </div>

            <div className="anim-detail-card bg-[#C5A059]/5 rounded-[2.5rem] border border-[#C5A059]/10 p-8 shadow-inner">
              <h3 className="font-black text-white/40 text-[10px] uppercase tracking-[0.3em] mb-6">Integritas Data</h3>
              <div className="flex items-start gap-4 p-5 bg-[#C5A059]/10 rounded-2xl border border-[#C5A059]/30 mb-8">
                <ShieldCheck className="text-[#C5A059] shrink-0 mt-1" size={20} />
                <div className="text-left">
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Digital Compliance</p>
                  <p className="text-xs text-white/60 font-bold italic mt-0.5">UU PDP Consented</p>
                </div>
              </div>
              <div className="space-y-6 pt-6 border-t border-white/5 text-left">
                <div>
                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1.5">Record Created</p>
                  <p className="text-xs font-bold text-white uppercase tracking-tight">
                    {new Date(member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1.5">Last Calibration</p>
                  <p className="text-xs font-bold text-[#C5A059] uppercase tracking-tight">
                    {member.updated_at ? new Date(member.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Initial Seed'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Member Journey */}
          <div className="lg:col-span-2">
            <div className="anim-detail-card bg-[#0a192f]/60 backdrop-blur-xl rounded-[2.5rem] border border-[#C5A059]/20 shadow-2xl p-10 min-h-full">
              <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
                <h3 className="font-black text-white text-xs uppercase tracking-[0.3em] flex items-center gap-3 italic">
                  <Clock size={20} className="text-[#C5A059]" /> Member Journey Timeline
                </h3>
                <span className="text-[9px] font-black bg-[#C5A059]/10 text-[#C5A059] px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-[#C5A059]/20 shadow-inner">
                  {journey.length} Rekam Jejak
                </span>
              </div>

              <div className="relative space-y-10 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-[#C5A059] before:via-white/5 before:to-transparent">
                {journey.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-white/20 italic text-sm font-medium tracking-widest uppercase">Belum ada riwayat aktivitas tercatat.</p>
                  </div>
                ) : (
                  journey.map((item) => (
                    <div key={item.id_partisipasi} className="anim-journey-item relative flex items-start gap-8 group">
                      <div className="absolute left-0 size-10 bg-[#051122] border-[3px] border-[#C5A059] rounded-full flex items-center justify-center z-10 shadow-[0_0_20px_rgba(197,160,89,0.3)] group-hover:scale-110 transition-transform duration-500">
                        <CheckCircle2 size={16} className="text-[#C5A059]" />
                      </div>
                      <div className="ml-14 flex-1 text-left bg-white/5 p-6 rounded-3xl border border-white/5 group-hover:border-[#C5A059]/40 group-hover:bg-[#C5A059]/5 group-hover:shadow-xl transition-all duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <p className="text-lg font-black text-white uppercase italic tracking-tight mb-2.5">
                              {item.kegiatan?.nama_kegiatan}
                            </p>
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] font-black text-[#C5A059] bg-[#C5A059]/10 px-3 py-1.5 rounded-lg uppercase flex items-center gap-1.5 border border-[#C5A059]/20">
                                <Star size={12} className="fill-[#C5A059]/20" /> {item.peran?.nama_peran || 'Peserta'}
                              </span>
                              <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">
                                Status: {item.status_kehadiran}
                              </span>
                            </div>
                          </div>
                          <div className="text-left md:text-right shrink-0 bg-[#051122]/50 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-white tracking-widest uppercase">
                              {new Date(item.waktu_check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] font-bold text-[#C5A059]/60 italic uppercase mt-1">
                              {new Date(item.waktu_check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Seed Data Point */}
                <div className="anim-journey-item relative flex items-start gap-8 opacity-40">
                  <div className="absolute left-0 size-10 bg-[#051122] border-[3px] border-white/20 rounded-full flex items-center justify-center z-10">
                    <Activity size={16} className="text-white/40" />
                  </div>
                  <div className="ml-14 text-left p-6">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Inisialisasi Golden Record</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase italic mt-1.5 leading-relaxed max-w-xs">Data identitas pertama kali diverifikasi & dikunci ke sistem SSOT.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-5 group cursor-default">
      <div className="p-3 bg-white/5 text-[#C5A059]/50 rounded-[1rem] group-hover:bg-[#C5A059]/10 group-hover:text-[#C5A059] group-hover:shadow-[0_0_15px_rgba(197,160,89,0.2)] border border-white/5 group-hover:border-[#C5A059]/30 transition-all duration-300 shrink-0">
        {icon}
      </div>
      <div className="text-left pt-0.5">
        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1.5">{label}</p>
        <p className="text-sm font-black text-white tracking-wide italic uppercase">{value}</p>
      </div>
    </div>
  );
}