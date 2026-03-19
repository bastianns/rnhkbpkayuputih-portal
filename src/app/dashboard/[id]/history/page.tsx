'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { animate, createTimeline, createDrawable, waapi, stagger, splitText } from 'animejs';
import { Clock, Search, ArrowLeft, Star, Calendar, ShieldCheck, Award, Loader2 } from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';

// ─────────────────────────────────────────────────────────
// Helper: double requestAnimationFrame
// Menjamin eksekusi SETELAH browser menyelesaikan paint pertama,
// sehingga semua elemen DOM sudah benar-benar tersedia.
// ─────────────────────────────────────────────────────────
function afterPaint(callback: () => void): () => void {
  let id1: number;
  let id2: number;
  id1 = requestAnimationFrame(() => {
    id2 = requestAnimationFrame(callback);
  });
  return () => {
    cancelAnimationFrame(id1);
    cancelAnimationFrame(id2);
  };
}

// ─────────────────────────────────────────────────────────
// OrnateCorner — menggunakan afterPaint, bukan setTimeout
// ─────────────────────────────────────────────────────────
function OrnateCorner({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const cancel = afterPaint(() => {
      const elements = svgRef.current?.querySelectorAll<SVGElement>('path, circle');
      if (!elements || elements.length === 0) return;

      Array.from(elements).forEach((el, i) => {
        const d = createDrawable(el);
        if (!d) return;

        // @ts-ignore
        d.draw = '0 0';

        animate(d, {
          // @ts-ignore
          draw    : ['0 0', '0 1'],
          duration: 1800,
          ease    : 'inOutCubic',
          delay   : 300 + i * 120,
        });
      });
    });

    return cancel;
  }, []);

  return (
    <div className={`absolute w-24 h-24 ${className} p-4 opacity-30 pointer-events-none`}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full h-full text-[#d4af37] fill-none stroke-current stroke-[1.5]"
      >
        <path d="M5,5 Q50,5 50,50 Q5,50 5,5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15,5 L5,5 L5,15"            strokeLinecap="round" />
        <path d="M5,35 Q35,35 35,5"            strokeLinecap="round" opacity="0.5" />
        <circle cx="5"  cy="5"  r="2.5" fill="currentColor" />
        <circle cx="50" cy="50" r="1.5" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────
export default function MemberHistoryPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [member,     setMember]  = useState<any>(null);
  const [history,    setHistory] = useState<any[]>([]);
  const [loading,    setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const titleRef     = useRef<HTMLHeadingElement>(null);
  const lightRayRef  = useRef<HTMLDivElement>(null);
  const lightRay2Ref = useRef<HTMLDivElement>(null);

  const calculatedTotalPoints = history.reduce(
    (sum, item) => sum + (item.katalog_peran?.bobot_kontribusi || 0), 0
  );

  useEffect(() => { fetchHistoryData(); }, [id]);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi tidak valid');

      const { data: memberData } = await supabase
        .from('anggota').select('*').eq('email', user.email).single();
      if (memberData) setMember(memberData);

      if (memberData) {
        const { data: historyData, error } = await supabase
          .from('riwayat_partisipasi')
          .select('*, kegiatan (nama_kegiatan, tanggal_mulai), katalog_peran (nama_peran, bobot_kontribusi)')
          .eq('id_anggota', memberData.id_anggota)
          .order('waktu_check_in', { ascending: false });

        if (error) throw error;
        if (historyData) setHistory(historyData);
      }
    } catch (err) {
      console.error('Gagal menarik data riwayat:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.kegiatan?.nama_kegiatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── FITUR 1: waapi.animate() — Light Rays ────────────────────────────
  // Menggunakan afterPaint agar ref sudah terhubung ke DOM yang ter-paint
  useEffect(() => {
    if (loading) return;

    const cancel = afterPaint(() => {
      if (!lightRayRef.current || !lightRay2Ref.current) return;

      waapi.animate(lightRayRef.current, {
        rotate    : ['0deg', '360deg'],
        opacity   : [0.04, 0.10, 0.04],
        scale     : [1, 1.15, 1],
        duration  : 12000,
        iterations: Infinity,
        easing    : 'linear',
      });

      waapi.animate(lightRay2Ref.current, {
        rotate    : ['180deg', '-180deg'],
        opacity   : [0.03, 0.08, 0.03],
        scale     : [1.1, 0.95, 1.1],
        duration  : 18000,
        iterations: Infinity,
        easing    : 'linear',
      });
    });

    return cancel;
  }, [loading]);

  // ── FITUR 2: splitText() — Title Animation ───────────────────────────
  // Double rAF memastikan titleRef.current sudah di-paint sebelum splitText dipanggil
  useEffect(() => {
    if (loading) return;

    const cancel = afterPaint(() => {
      if (!titleRef.current) return;

      const split = splitText(titleRef.current);
      // Guard: pastikan splitText berhasil menghasilkan chars
      if (!split?.chars?.length) return;

      animate(split.chars, {
        opacity : [0, 1],
        y       : ['110%', '0%'],
        rotateX : [90, 0],
        duration: 900,
        ease    : 'outExpo',
        delay   : stagger(55, { start: 200 }),
      });
    });

    return cancel;
  }, [loading]);

  // ── FITUR 3: createTimeline — Entry Animations ───────────────────────
  // Guard ketat: cek semua selector ada di DOM sebelum timeline dibuat
  useEffect(() => {
    if (loading) return;

    const cancel = afterPaint(() => {
      const selectors = ['.anim-back', '.anim-subtitle', '.anim-summary', '.anim-search'];

      // Batalkan jika ada satu saja elemen yang belum ada
      const allExist = selectors.every((sel) => document.querySelector(sel));
      if (!allExist) return;

      createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } })
        .add('.anim-back',     { opacity: [0, 1], x: [-20, 0] })
        .add('.anim-subtitle', { opacity: [0, 1], y: [10, 0]  }, '<+=600')
        .add('.anim-summary',  { opacity: [0, 1], scale: [0.95, 1], delay: stagger(120) }, '<+=400')
        .add('.anim-search',   { opacity: [0, 1], y: [10, 0]  }, '<+=300');
    });

    return cancel;
  }, [loading]);

  // ── Intersection Observer — History Cards ────────────────────────────
  useEffect(() => {
    // Jalankan setelah paint agar kartu sudah ada di DOM
    const cancel = afterPaint(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animate(entry.target, {
                opacity : [0, 1],
                y       : [30, 0],
                duration: 800,
                ease    : 'outExpo',
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll<HTMLElement>('.history-card').forEach((card) => {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(30px)';
        observer.observe(card);
      });

      // Simpan referensi observer agar bisa di-disconnect saat cleanup
      return () => observer.disconnect();
    });

    // cancel() di sini hanya membatalkan rAF jika komponen unmount
    // sebelum callback sempat berjalan
    return cancel;
  }, [filteredHistory]);

  // ─────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d4af37]" size={48} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center p-6 md:p-12 relative overflow-hidden bg-[#050b18] font-sans selection:bg-[#d4af37]/30">

      {/* ── Light Rays Background ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div
          ref={lightRayRef}
          className="absolute"
          style={{
            width       : '150vmax',
            height      : '150vmax',
            borderRadius: '50%',
            background  : 'conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.06) 20deg, transparent 40deg, transparent 180deg, rgba(212,175,55,0.04) 200deg, transparent 220deg)',
            willChange  : 'transform, opacity',
          }}
        />
        <div
          ref={lightRay2Ref}
          className="absolute"
          style={{
            width       : '120vmax',
            height      : '120vmax',
            borderRadius: '50%',
            background  : 'conic-gradient(from 90deg, transparent 0deg, rgba(249,226,156,0.05) 15deg, transparent 30deg, transparent 200deg, rgba(249,226,156,0.03) 215deg, transparent 230deg)',
            willChange  : 'transform, opacity',
          }}
        />
      </div>

      <div className="w-full max-w-5xl z-10">

        {/* ── Back Button ── */}
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="anim-back flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] font-bold text-[10px] uppercase tracking-[0.2em] mb-12 transition-colors group"
          style={{ opacity: 0 }}
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </button>

        {/* ── Title ── */}
        <div className="mb-12 text-center md:text-left">
          <div className="overflow-hidden">
            <h2
              ref={titleRef}
              className="text-4xl md:text-5xl font-serif tracking-widest text-[#f9e29c] gold-glow mb-2 uppercase"
              style={{ perspective: '800px' }}
            >
              LOG PELAYANAN
            </h2>
          </div>
          <p
            className="anim-subtitle text-xs md:text-sm tracking-[0.4em] text-[#d4af37]/60 font-bold uppercase italic"
            style={{ opacity: 0 }}
          >
            Personal Journey
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            {
              label: 'Total Poin Terkumpul',
              value: <AnimatedCounter value={calculatedTotalPoints} padLength={4} />,
              icon : <Star className="text-[#d4af37]" size={20} />,
            },
            {
              label: 'Total Kehadiran',
              value: (
                <span className="flex items-baseline gap-2">
                  <AnimatedCounter value={history.length} padLength={4} />
                  <span className="text-sm text-[#d4af37]/50 not-italic font-sans tracking-widest">
                    EVENTS
                  </span>
                </span>
              ),
              icon: <Calendar className="text-[#d4af37]" size={20} />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="anim-summary bg-[#1a2a4a]/40 backdrop-blur-md border border-[#d4af37]/20 rounded-2xl p-6 flex items-center justify-between shadow-lg"
              style={{ opacity: 0 }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 font-bold mb-1">
                  {label}
                </p>
                <h3 className="text-3xl font-serif italic text-[#f9e29c] gold-glow">{value}</h3>
              </div>
              <div className="w-12 h-12 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#050b18]">
                {icon}
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="anim-search relative mb-12 group" style={{ opacity: 0 }}>
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="CARI RIWAYAT KEGIATAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a2a4a]/30 backdrop-blur-sm border border-[#d4af37]/20 rounded-full pl-16 pr-8 py-5 text-xs font-bold text-white uppercase tracking-widest focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder:text-[#d4af37]/30"
          />
        </div>

        {/* ── History List / Empty State ── */}
        {filteredHistory.length === 0 ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-72 h-96 bg-[#f9f7f2] rounded-r-lg flex flex-col items-center justify-center p-8 border-l-8 border-[#d4af37]/30 shadow-xl">
              <div className="w-full h-full border-[3px] border-[#d4af37]/20 rounded flex flex-col items-center justify-center text-center p-4 border-dashed">
                <Clock className="w-10 h-10 text-[#8b6b23] mb-4 opacity-40" />
                <p className="text-[#8b6b23] font-serif tracking-widest text-xs leading-relaxed font-bold whitespace-pre-line opacity-60">
                  {searchTerm
                    ? 'PENCARIAN TIDAK\nDITEMUKAN'
                    : 'BELUM ADA\nRIWAYAT AKTIVITAS'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div
                key={item.id_partisipasi}
                className="history-card bg-[#1a2a4a]/20 backdrop-blur-sm border border-[#d4af37]/20 hover:border-[#d4af37]/50 rounded-2xl p-6 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 shrink-0 rounded-full border border-[#d4af37]/40 bg-[#050b18] flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif italic text-xl md:text-2xl text-[#f9e29c] mb-1">
                      {item.kegiatan?.nama_kegiatan}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-widest font-bold text-[#d4af37]/60">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.waktu_check_in).toLocaleDateString('id-ID', {
                          day  : 'numeric',
                          month: 'long',
                          year : 'numeric',
                        })}
                      </span>
                      <span className="hidden md:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Award size={12} />
                        {item.katalog_peran?.nama_peran || 'Partisipan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto bg-[#050b18]/50 px-4 py-3 rounded-xl border border-[#d4af37]/10 shrink-0">
                  <Star size={14} className="text-[#d4af37]" />
                  <span className="text-sm font-black text-[#d4af37] tracking-widest">
                    +{item.katalog_peran?.bobot_kontribusi || 0} POIN
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ornate Corners ── */}
      <OrnateCorner className="top-0 left-0" />
      <OrnateCorner className="top-0 right-0 rotate-90" />
      <OrnateCorner className="bottom-0 left-0 -rotate-90" />
      <OrnateCorner className="bottom-0 right-0 rotate-180" />
    </main>
  );
}