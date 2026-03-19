'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// Import Anime.js V4 Utilities
import { createTimeline, stagger, splitText, animate, spring, waapi, svg } from 'animejs'; 
import { 
  User, Calendar, Star, Trophy, Crown, Loader2, LogOut, 
  ShieldCheck, MapPin, AlertCircle
} from 'lucide-react';

import AnimatedCounter from '@/components/AnimatedCounter';
import AnimatedCheckmark from '@/components/AnimatedCheckmark';

export default function MemberMobileDashboard() {
  const { id } = useParams();
  const router = useRouter();
  
  // Refs untuk target animasi spesifik
  const nameRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);
  
  const [member, setMember] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [perans, setPerans] = useState<any[]>([]);
  const [selectedPeran, setSelectedPeran] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Sesi tidak valid");

      const { data: memberData } = await supabase
        .from('anggota')
        .select('*, wijk(nama_wijk)')
        .eq('email', user.email)
        .single();
      
      if (memberData) setMember(memberData);

      if (memberData) {
        const { data: historyData } = await supabase
          .from('riwayat_partisipasi')
          .select(`*, katalog_peran (bobot_kontribusi)`)
          .eq('id_anggota', memberData.id_anggota);
        if (historyData) setActivities(historyData);
      }

      const { data: liveEvent } = await supabase
        .from('kegiatan')
        .select('*, kategori_kegiatan(nama_kategori)')
        .eq('is_open', true)
        .order('tanggal_mulai', { ascending: false })
        .limit(1)
        .single();
      
      if (liveEvent) setActiveEvent(liveEvent);

      const { data: peranData } = await supabase.from('katalog_peran').select('*');
      if (peranData) setPerans(peranData);
    } catch (error) {
      console.error("Gagal memuat dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- KOREOGRAFI UTAMA (Timeline, SplitText, WAAPI, & Drawable SVG) ---
  useEffect(() => {
    if (!loading && member) {
      const timer = setTimeout(() => {
        const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });

        // 1. Drawable SVG: Menggambar garis lingkaran foto profil
        const profileDrawable = svg.createDrawable('.profile-ring-path');

        // 2. SplitText: Pecah nama menjadi karakter
        if (nameRef.current) {
          nameRef.current.innerText = member?.nama_lengkap?.split(' ')[0] || 'Member';
          const { chars } = splitText(nameRef.current, { chars: true });
          
          tl.add('.anim-header', { opacity: [0, 1], y: [-20, 0] })
            .add('.welcome-static', { opacity: [0, 1], x: [-20, 0] }, '<-=800')
            .add(chars, { opacity: [0, 1], y: [15, 0], delay: stagger(40) }, '<-=700')
            .add('.anim-banner', { opacity: [0, 1], scale: [0.96, 1] }, '<-=800')
            .add('.anim-stat', { opacity: [0, 1], y: [30, 0], delay: stagger(120) }, '<-=850')
            .add('.anim-sidebar', { opacity: [0, 1], x: [30, 0] }, '<-=900')
            .add(profileDrawable, { pathLength: [0, 1], duration: 1500 }, '<-=1000');
        }

        // 3. WAAPI Pulse: Denyut Live Event (Hemat Baterai)
        if (pulseRef.current) {
          waapi.animate(pulseRef.current, {
            scale: [1, 1.5],
            opacity: [0.6, 0],
            duration: 1500,
            loop: true,
            ease: 'out(2)'
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, member]);

  // --- INTERAKSI EVENT HANDLERS ---

  // Tactile Feedback untuk Tombol
  const handleBtnFeedback = (e: React.MouseEvent<HTMLButtonElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.45 })
    });
  };

  // Konfirmasi Kehadiran
  const handleConfirmAttendance = async () => {
    if (!selectedPeran || !activeEvent || !member) return;
    setIsCheckingIn(true);
    setCheckInMessage(null);
    try {
      const { data: existing } = await supabase.from('riwayat_partisipasi').select('id_partisipasi').eq('id_anggota', member.id_anggota).eq('id_kegiatan', activeEvent.id_kegiatan).single();
      if (existing) { setCheckInMessage({ type: 'error', text: 'Sudah absen di kegiatan ini.'}); setIsCheckingIn(false); return; }
      const { error } = await supabase.from('riwayat_partisipasi').insert({ id_anggota: member.id_anggota, id_kegiatan: activeEvent.id_kegiatan, id_peran: selectedPeran, status_kehadiran: 'Hadir', waktu_check_in: new Date().toISOString() });
      if (error) throw error;
      setCheckInMessage({ type: 'success', text: 'Kehadiran berhasil dicatat!'});
      fetchDashboardData(); 
    } catch (error: any) { setCheckInMessage({ type: 'error', text: error.message }); } 
    finally { setIsCheckingIn(false); }
  };

  // Logout Handler (Solusi Error handleLogout is not defined)
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-[#0a1628] flex items-center justify-center"><Loader2 className="animate-spin text-[#d4af37]" size={48} /></div>;

  const totalPoin = activities.reduce((sum, item) => sum + (item.katalog_peran?.bobot_kontribusi || 0), 0);
  let levelName = totalPoin > 150 ? "Teladan Pelayanan" : totalPoin > 50 ? "Jemaat Aktif" : "Anggota Baru";

  return (
    <main className="min-h-screen bg-mesh bg-pattern p-4 md:p-8 flex flex-col items-center overflow-x-hidden text-white selection:bg-[#d4af37]/30 font-sans">
      <header className="anim-header w-full max-w-7xl flex justify-center md:justify-start items-center mb-8 border-b border-[#d4af37]/20 pb-6 relative z-10" style={{ opacity: 0 }}>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#d4af37] w-8 h-8 gold-glow" />
          <h1 className="text-xl md:text-2xl tracking-[0.15em] text-[#f1e5ac] serif uppercase font-bold">RNHKBP KAYU PUTIH</h1>
        </div>
      </header>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-baseline gap-3 mb-6 overflow-hidden">
            <h2 className="welcome-static text-3xl md:text-4xl text-white/90 serif font-light tracking-wide" style={{ opacity: 0 }}>Welcome,</h2>
            <span ref={nameRef} className="welcome-name text-3xl md:text-4xl text-[#d4af37] italic serif font-bold"></span>
          </div>
            
          <div className="anim-banner card-border rounded-xl overflow-hidden mb-8 relative min-h-[300px] md:aspect-[21/9] flex flex-col justify-end bg-[#0a1628]" style={{ opacity: 0 }}>
            <img src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop" alt="Event" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay grayscale-[20%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/80 to-transparent"></div>
            
            <div className="relative z-10 p-6 md:p-10 w-full md:w-2/3">
              {activeEvent ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/40 border border-red-500/50 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest relative overflow-visible">
                    <span ref={pulseRef} className="absolute w-2 h-2 rounded-full bg-red-500 left-3"></span>
                    <span className="w-2 h-2 rounded-full bg-red-500 z-10"></span> Live Event
                  </div>
                  <h3 className="serif italic text-3xl md:text-4xl text-[#f1e5ac] gold-glow leading-tight">{activeEvent.nama_kegiatan}</h3>
                  <div className="pt-4 space-y-3">
                    {checkInMessage?.type === 'success' ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 rounded-xl border border-emerald-500/30 backdrop-blur-md">
                        <AnimatedCheckmark size={64} color="#34d399" />
                        <p className="text-emerald-400 font-black uppercase tracking-widest text-xs mt-4">{checkInMessage.text}</p>
                      </div>
                    ) : (
                      <>
                        <select value={selectedPeran} onChange={(e) => setSelectedPeran(e.target.value)} className="w-full md:w-3/4 p-4 bg-[#162a45]/80 border border-[#d4af37]/30 rounded-lg font-bold text-xs uppercase text-white appearance-none backdrop-blur-sm cursor-pointer outline-none focus:border-[#d4af37]"><option value="">-- PILIH PERAN ANDA --</option>{perans.map(p => (<option key={p.id_peran} value={p.id_peran}>{p.nama_peran}</option>))}</select>
                        <button onMouseDown={(e) => handleBtnFeedback(e, 'down')} onMouseUp={(e) => handleBtnFeedback(e, 'up')} onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })} onClick={handleConfirmAttendance} disabled={isCheckingIn || !selectedPeran} className="w-full md:w-3/4 bg-[#d4af37] text-[#0a1628] py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 flex items-center justify-center gap-2">
                          {isCheckingIn ? <Loader2 className="animate-spin" size={16} /> : 'Konfirmasi Kehadiran'}
                        </button>
                        {checkInMessage?.type === 'error' && <div className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-2"><AlertCircle size={14}/> {checkInMessage.text}</div>}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2"><h3 className="serif italic text-3xl md:text-4xl text-white/50">Tidak ada kegiatan aktif.</h3></div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[ { icon: <Star />, label: "Total Points", val: totalPoin }, { icon: <Calendar />, label: "Activities Logged", val: activities.length, click: () => router.push(`/dashboard/${id}/history`) }, { icon: <Trophy />, label: "Wijk Standing", val: "Top 10" } ].map((item, i) => (
              <div key={i} onClick={item.click} className={`anim-stat card-border bg-[#162a45]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-sm transition-all duration-300 hover:bg-[#162a45]/50 ${item.click ? 'cursor-pointer group' : ''}`} style={{ opacity: 0 }}>
                <div className="text-[#d4af37] gold-glow group-hover:scale-110 transition-transform w-10 h-10">{item.icon}</div>
                <div className="space-y-1">
                  {typeof item.val === 'number' ? <AnimatedCounter value={item.val} className="block text-3xl md:text-4xl font-serif text-[#f1e5ac] gold-glow" /> : <span className="block text-xl font-serif text-[#f1e5ac]">{item.val}</span>}
                  <span className="block text-[10px] tracking-[0.2em] text-[#d4af37]/60 uppercase font-bold">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="anim-sidebar lg:col-span-1" style={{ opacity: 0 }}>
          <div className="card-border bg-[#162a45]/20 rounded-2xl p-8 h-full flex flex-col items-center text-center backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#d4af37]/50 rounded-tl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#d4af37]/50 rounded-br-2xl"></div>
            <div className="relative w-32 h-32 mb-6 group cursor-pointer">
              <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
                <circle className="profile-ring-path" cx="64" cy="64" r="62" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 rounded-full border border-[#d4af37]/10 p-1">
                <div className="w-full h-full rounded-full bg-[#0a1628] flex items-center justify-center border border-[#d4af37]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-transform group-hover:scale-105 duration-500">
                  <User className="w-14 h-14 text-[#d4af37]/50" />
                </div>
              </div>
            </div>
            <h3 className="text-xl md:text-2xl text-[#f1e5ac] serif uppercase tracking-widest mb-1 gold-glow">{member?.nama_lengkap || 'Member'}</h3>
            <p className="text-[9px] font-bold tracking-[0.3em] text-[#d4af37]/60 uppercase mb-10 flex items-center gap-1 justify-center"><MapPin size={10} /> {member?.wijk?.nama_wijk || 'General'}</p>
            <div className="w-full space-y-5 text-[10px] tracking-widest text-[#d4af37]/60 uppercase font-bold mb-auto text-left">
              <div className="flex justify-between border-b border-[#d4af37]/10 pb-2"><span>Status</span><span className={member?.is_verified ? 'text-green-400' : 'text-amber-500'}>{member?.is_verified ? 'Verified' : 'Pending'}</span></div>
              <div className="flex justify-between border-b border-[#d4af37]/10 pb-2"><span>Rank</span><span className="text-[#f1e5ac] italic serif tracking-normal text-xs">{levelName}</span></div>
              <div className="flex justify-between border-b border-[#d4af37]/10 pb-2"><span>Sejak</span><span className="text-white/80">{member?.created_at ? new Date(member.created_at).getFullYear() : '2026'}</span></div>
            </div>
            {/* Tombol Logout Sekarang Terhubung dengan handleLogout di baris 150 */}
            <button onClick={handleLogout} disabled={isLoggingOut} className="mt-12 flex items-center justify-center gap-3 w-full py-4 border border-[#d4af37]/20 rounded-lg text-[#d4af37]/60 hover:text-red-400 hover:border-red-900/50 transition-all uppercase tracking-widest text-[10px] font-bold group disabled:opacity-50">
              {isLoggingOut ? <Loader2 className="animate-spin w-4 h-4" /> : <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}<span>Portal Sign Out</span>
            </button>
          </div>
        </aside>
      </div>
      <footer className="mt-20 w-full max-w-7xl flex flex-col items-center opacity-30 pb-8"><p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">© 2026 RNHKBP KAYU PUTIH</p></footer>
    </main>
  );
}