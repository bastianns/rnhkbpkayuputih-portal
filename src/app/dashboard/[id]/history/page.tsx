'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Search, 
  ArrowLeft, 
  Star, 
  Calendar, 
  ShieldCheck, 
  Award,
  Loader2
} from 'lucide-react';

export default function MemberHistoryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [member, setMember] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistoryData();
  }, [id]);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan Sesi User Aktif
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak valid");

      // 2. Tarik Data Anggota
      const { data: memberData } = await supabase
        .from('anggota')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (memberData) setMember(memberData);

      // 3. Tarik Riwayat Partisipasi (Join tabel kegiatan & peran)
      if (memberData) {
        const { data: historyData, error } = await supabase
          .from('riwayat_partisipasi')
          .select(`
            *,
            kegiatan (nama_kegiatan, tanggal_mulai),
            katalog_peran (nama_peran, bobot_kontribusi)
          `)
          .eq('id_anggota', memberData.id_anggota)
          .order('waktu_check_in', { ascending: false });

        if (error) throw error;
        if (historyData) setHistory(historyData);
      }
    } catch (error) {
      console.error("Gagal menarik data riwayat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter pencarian berdasarkan nama kegiatan
  const filteredHistory = history.filter(item => 
    item.kegiatan?.nama_kegiatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d4af37]" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6 md:p-12 relative overflow-hidden bg-[#050b18] font-sans selection:bg-[#d4af37]/30">
      
      {/* Background Cross & Rays (Sesuai Desain Baru) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">
        <div className="w-1 h-full bg-white/20 blur-sm" />
        <div className="h-1 w-full bg-white/20 blur-sm absolute" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full light-ray rotate-12 pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full light-ray -rotate-12 pointer-events-none z-0" />

      <div className="w-full max-w-5xl z-10">
        
        {/* Navigasi Kembali */}
        <button 
          onClick={() => router.push(`/dashboard/${id}`)}
          className="flex items-center gap-2 text-[#d4af37]/70 hover:text-[#d4af37] font-bold text-[10px] uppercase tracking-[0.2em] mb-12 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </button>

        {/* Header Judul */}
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-serif tracking-widest text-[#f9e29c] gold-glow mb-2">LOG PELAYANAN</h2>
          <p className="text-xs md:text-sm tracking-[0.4em] text-[#d4af37]/60 font-bold uppercase">Personal Journey</p>
        </div>

        {/* Statistik Ringkas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#1a2a4a]/40 backdrop-blur-md border border-[#d4af37]/20 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 font-bold mb-1">Total Poin Terkumpul</p>
              <h3 className="text-3xl font-serif italic text-[#f9e29c] gold-glow">{member?.total_poin || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#050b18]">
              <Star className="text-[#d4af37]" size={20} />
            </div>
          </div>
          <div className="bg-[#1a2a4a]/40 backdrop-blur-md border border-[#d4af37]/20 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 font-bold mb-1">Total Kehadiran</p>
              <h3 className="text-3xl font-serif italic text-[#f9e29c] gold-glow">{history.length} <span className="text-sm text-[#d4af37]/50 not-italic font-sans tracking-widest">EVENTS</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#050b18]">
              <Calendar className="text-[#d4af37]" size={20} />
            </div>
          </div>
        </div>

        {/* Kotak Pencarian */}
        <div className="relative mb-12 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="CARI RIWAYAT KEGIATAN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a2a4a]/30 backdrop-blur-sm border border-[#d4af37]/20 rounded-full pl-16 pr-8 py-5 text-xs font-bold text-white uppercase tracking-widest focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all placeholder:text-[#d4af37]/30"
          />
        </div>

        {/* KONTEN UTAMA (Kondisional: Kosong atau Ada Data) */}
        {filteredHistory.length === 0 ? (
          /* STATE KOSONG: Desain Notebook Klasik */
          <div className="relative p-6 md:p-12 min-h-[400px] flex items-center justify-center">
            {/* Frame Borders */}
            <div className="absolute inset-0 border-2 border-[#d4af37]/40 rounded-sm m-2 md:m-4" />
            <div className="absolute inset-0 border border-[#d4af37]/20 rounded-sm m-4 md:m-6 hidden md:block" />

            {/* Ornate Corners (SVG) */}
            <OrnateCorner className="top-0 left-0" />
            <OrnateCorner className="top-0 right-0 rotate-90" />
            <OrnateCorner className="bottom-0 left-0 -rotate-90" />
            <OrnateCorner className="bottom-0 right-0 rotate-180" />

            {/* Central Notebook */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-72 h-96 bg-[#f9f7f2] rounded-r-lg notebook-shadow flex flex-col items-center justify-center p-8 border-l-8 border-[#d4af37]/30 z-10"
            >
              {/* Notebook Rings */}
              <div className="absolute left-[-12px] top-0 bottom-0 flex flex-col justify-around py-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-6 h-1.5 bg-gradient-to-r from-gray-400 to-gray-200 rounded-full shadow-sm" />
                ))}
              </div>

              {/* Notebook Content */}
              <div className="w-full h-full border-[3px] border-[#d4af37]/20 rounded flex flex-col items-center justify-center text-center p-4 border-dashed">
                <div className="w-16 h-16 rounded-full border-2 border-[#d4af37]/40 flex items-center justify-center mb-6 bg-[#d4af37]/5">
                  <Clock className="w-8 h-8 text-[#8b6b23]" />
                </div>
                <p className="text-[#8b6b23] font-serif tracking-widest text-xs md:text-sm leading-relaxed font-bold">
                  {searchTerm ? 'PENCARIAN TIDAK\nDITEMUKAN' : 'BELUM ADA\nRIWAYAT AKTIVITAS'}
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* STATE ADA DATA: Daftar Kartu Riwayat Elegan */
          <div className="space-y-4">
            <AnimatePresence>
              {filteredHistory.map((item, index) => (
                <motion.div 
                  key={item.id_partisipasi}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1a2a4a]/20 backdrop-blur-sm border border-[#d4af37]/20 hover:border-[#d4af37]/50 rounded-2xl p-6 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 shrink-0 rounded-full border border-[#d4af37]/40 bg-[#050b18] flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif italic text-xl md:text-2xl text-[#f9e29c] mb-1">{item.kegiatan?.nama_kegiatan}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-widest font-bold text-[#d4af37]/60">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(item.waktu_check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="flex items-center gap-1"><Award size={12}/> {item.katalog_peran?.nama_peran || 'Partisipan'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto bg-[#050b18]/50 px-4 py-3 rounded-xl border border-[#d4af37]/10">
                    <Star size={14} className="text-[#d4af37]" />
                    <span className="text-sm font-black text-[#d4af37] tracking-widest">+{item.katalog_peran?.bobot_kontribusi || 0} POIN</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Bottom Logo Simulated */}
      <div className="absolute bottom-8 right-8 opacity-20 pointer-events-none z-0">
        <div className="w-12 h-12 border-2 border-[#d4af37] rounded-full flex items-center justify-center">
          <span className="text-xl text-[#d4af37]">✝</span>
        </div>
      </div>
    </main>
  );
}

// Sub-komponen Ornamen Sudut SVG
function OrnateCorner({ className }: { className?: string }) {
  return (
    <div className={`absolute w-16 h-16 md:w-24 md:h-24 ${className} p-2 opacity-60`}>
      <svg viewBox="0 0 100 100" className="w-full h-full text-[#d4af37] fill-none stroke-current stroke-[1.5]">
        <path d="M10,10 Q40,10 40,40 Q10,40 10,10" />
        <path d="M10,10 Q10,40 40,40" />
        <path d="M5,5 L20,5 M5,5 L5,20" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
        <path d="M15,15 C25,5 45,5 55,15" />
        <path d="M15,15 C5,25 5,45 15,55" />
      </svg>
    </div>
  );
}