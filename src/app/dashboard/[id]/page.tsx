'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  Star, 
  Trophy, 
  Crown, 
  Loader2,
  LogOut,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function MemberMobileDashboard() {
  const { id } = useParams();
  const router = useRouter();
  
  // State Logika Aplikasi
  const [member, setMember] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State Modal/Pilih Peran
  const [perans, setPerans] = useState<any[]>([]);
  const [selectedPeran, setSelectedPeran] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan email dari sesi autentikasi user saat ini
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error("Sesi tidak valid");
      }

      // 2. Cari data anggota berdasarkan EMAIL, bukan id_auth
      const { data: memberData, error: memberError } = await supabase
        .from('anggota')
        .select('*, wijk(nama_wijk)')
        .eq('email', user.email)
        .single();
      
      if (memberData) setMember(memberData);
      if (memberError) console.error("Data anggota tidak ditemukan:", memberError);

      // 3. Ambil Riwayat Partisipasi (Untuk Hitung Total Event)
      if (memberData) {
        const { data: historyData } = await supabase
          .from('riwayat_partisipasi')
          .select('*')
          .eq('id_anggota', memberData.id_anggota);
        if (historyData) setActivities(historyData);
      }

      // 4. Cek Kegiatan Aktif (Live Event)
      const { data: liveEvent } = await supabase
        .from('kegiatan')
        .select('*, kategori_kegiatan(nama_kategori)')
        .eq('is_open', true)
        .order('tanggal_mulai', { ascending: false })
        .limit(1)
        .single();
      
      if (liveEvent) setActiveEvent(liveEvent);

      // 5. Ambil Katalog Peran
      const { data: peranData } = await supabase.from('katalog_peran').select('*');
      if (peranData) setPerans(peranData);

    } catch (error) {
      console.error("Gagal memuat dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!selectedPeran || !activeEvent || !member) return;
    setIsCheckingIn(true);
    setCheckInMessage(null);

    try {
      // Cek apakah sudah absen
      const { data: existing } = await supabase
        .from('riwayat_partisipasi')
        .select('id_partisipasi')
        .eq('id_anggota', member.id_anggota)
        .eq('id_kegiatan', activeEvent.id_kegiatan)
        .single();

      if (existing) {
        setCheckInMessage({ type: 'error', text: 'Anda sudah mengisi daftar hadir untuk kegiatan ini.'});
        setIsCheckingIn(false);
        return;
      }

      // Insert Kehadiran
      const { error } = await supabase.from('riwayat_partisipasi').insert({
        id_anggota: member.id_anggota,
        id_kegiatan: activeEvent.id_kegiatan,
        id_peran: selectedPeran,
        status_kehadiran: 'Hadir',
        waktu_check_in: new Date().toISOString()
      });

      if (error) throw error;
      
      // Log Audit Self-CheckIn
      await supabase.from('audit_log').insert({
        actor_id: member.id_anggota,
        action: 'MEMBER_SELF_CHECKIN',
        entity: 'riwayat_partisipasi',
        new_data: { kegiatan: activeEvent.nama_kegiatan }
      });

      setCheckInMessage({ type: 'success', text: 'Kehadiran berhasil dicatat! Selamat melayani.'});
      fetchDashboardData(); // Refresh data untuk update poin/events
    } catch (error: any) {
      setCheckInMessage({ type: 'error', text: error.message });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d4af37]" size={48} />
      </div>
    );
  }

  // Kalkulasi Level Berdasarkan Poin (Contoh Logika)
  const totalPoin = member?.total_poin || 0;
  let levelName = "Anggota Baru";
  if (totalPoin > 50) levelName = "Jemaat Aktif";
  if (totalPoin > 150) levelName = "Teladan Pelayanan";

  return (
    <main className="min-h-screen bg-mesh bg-pattern p-4 md:p-8 flex flex-col items-center overflow-x-hidden text-white selection:bg-[#d4af37]/30">
      
      {/* Header (Hanya Logo, Tanpa Logout Ganda) */}
      <header className="w-full max-w-7xl flex justify-center md:justify-start items-center mb-8 border-b border-[#d4af37]/20 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#d4af37] w-8 h-8 gold-glow" />
          <h1 className="text-2xl md:text-3xl tracking-[0.2em] text-[#f1e5ac] serif uppercase">
            SSOT Portal
          </h1>
        </div>
      </header>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        
        {/* AREA KONTEN UTAMA */}
        <div className="lg:col-span-3 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl text-white/90 mb-6 serif font-light tracking-wide">
              Welcome, <span className="text-[#d4af37] italic">{member?.nama_lengkap?.split(' ')[0] || 'Member'}</span>
            </h2>
            
            {/* WADAH GAMBAR / BANNER LIVE CHECK-IN */}
            <div className="card-border rounded-xl overflow-hidden mb-8 relative min-h-[300px] md:aspect-[21/9] flex flex-col justify-end bg-[#0a1628]">
              {/* Perbaikan Gambar: Menggunakan img standar agar terhindar dari error konfigurasi next/image */}
              <img 
                src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop" 
                alt="Church Event"
                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay grayscale-[20%]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/80 to-transparent"></div>
              
              <div className="relative z-10 p-6 md:p-10 w-full md:w-2/3">
                {activeEvent ? (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/40 border border-red-500/50 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Event
                    </div>
                    <h3 className="serif italic text-3xl md:text-4xl text-[#f1e5ac] gold-glow leading-tight">
                      {activeEvent.nama_kegiatan}
                    </h3>
                    
                    {/* Logika Form Check-In di Dalam Banner */}
                    <div className="pt-4 space-y-3">
                      <select 
                        value={selectedPeran}
                        onChange={(e) => setSelectedPeran(e.target.value)}
                        className="w-full md:w-3/4 p-4 bg-[#162a45]/80 border border-[#d4af37]/30 rounded-lg font-bold text-xs uppercase tracking-widest outline-none focus:border-[#d4af37] text-white appearance-none backdrop-blur-sm"
                      >
                        <option value="">-- PILIH PERAN ANDA --</option>
                        {perans.map(p => (
                          <option key={p.id_peran} value={p.id_peran}>{p.nama_peran}</option>
                        ))}
                      </select>
                      
                      <button 
                        onClick={handleConfirmAttendance}
                        disabled={isCheckingIn || !selectedPeran}
                        className="w-full md:w-3/4 bg-[#d4af37] text-[#0a1628] py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:bg-[#f1e5ac] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isCheckingIn ? <Loader2 className="animate-spin" size={16} /> : 'Konfirmasi Kehadiran'}
                      </button>

                      {/* Notifikasi Hasil Absen */}
                      <AnimatePresence>
                        {checkInMessage && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold mt-2 ${checkInMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {checkInMessage.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                            {checkInMessage.text}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="serif italic text-3xl md:text-4xl text-white/50">
                      Tidak ada kegiatan aktif.
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Silakan periksa kembali jadwal pelayanan Anda.</p>
                  </div>
                )}
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Points Card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="card-border bg-[#162a45]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-sm"
              >
                <Star className="w-10 h-10 text-[#d4af37] gold-glow" />
                <div className="space-y-1">
                  <span className="block text-3xl md:text-4xl font-serif text-[#f1e5ac] gold-glow">{totalPoin}</span>
                  <span className="block text-[10px] tracking-[0.2em] text-[#d4af37]/60 uppercase font-bold">Total Points</span>
                </div>
              </motion.div>

              {/* Events Card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push(`/dashboard/${id}/history`)}
                className="card-border bg-[#162a45]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-sm cursor-pointer group"
              >
                <Calendar className="w-10 h-10 text-[#d4af37] gold-glow group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <span className="block text-3xl md:text-4xl font-serif text-[#f1e5ac] gold-glow">{activities.length}</span>
                  <span className="block text-[10px] tracking-[0.2em] text-[#d4af37]/60 uppercase font-bold">Activities Logged</span>
                </div>
              </motion.div>

              {/* Leaderboard Card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="card-border bg-[#162a45]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-sm"
              >
                <Trophy className="w-10 h-10 text-[#d4af37] gold-glow" />
                <div className="space-y-2">
                  <span className="block text-[10px] tracking-widest text-[#d4af37]/80 uppercase serif font-bold">Wijk Standing</span>
                  <div className="flex gap-4 justify-center items-center">
                    <Crown className="w-6 h-6 text-[#d4af37] gold-glow" />
                    <span className="font-serif italic text-xl text-[#f1e5ac]">Top 10</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* SIDEBAR PROFIL & LOGOUT */}
        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="card-border bg-[#162a45]/20 rounded-2xl p-8 h-full flex flex-col items-center text-center backdrop-blur-md relative overflow-hidden">
            
            {/* Aksen Sudut Emas */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#d4af37]/50 rounded-tl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#d4af37]/50 rounded-br-2xl"></div>

            {/* Profile Picture */}
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 rounded-full border border-[#d4af37]/40 p-1">
                <div className="w-full h-full rounded-full bg-[#0a1628] flex items-center justify-center overflow-hidden border border-[#d4af37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                  <User className="w-14 h-14 text-[#d4af37]/50" />
                </div>
              </div>
              <div className="absolute -inset-4 border border-[#d4af37]/10 rounded-full pointer-events-none border-dashed"></div>
            </div>

            {/* Identitas */}
            <h3 className="text-xl md:text-2xl text-[#f1e5ac] serif uppercase tracking-widest mb-1 gold-glow">
              {member?.nama_lengkap || 'Member'}
            </h3>
            <p className="text-[9px] font-bold tracking-[0.3em] text-[#d4af37]/60 uppercase mb-10 flex items-center gap-1 justify-center">
              <MapPin size={10} /> {member?.wijk?.nama_wijk || 'General'}
            </p>

            {/* Atribut Profil */}
            <div className="w-full space-y-5 text-[10px] tracking-widest text-[#d4af37]/60 uppercase font-bold mb-auto">
              <div className="flex justify-between border-b border-[#d4af37]/10 pb-2">
                <span>Status</span>
                <span className={member?.is_verified ? 'text-green-400' : 'text-amber-500'}>
                  {member?.is_verified ? 'SSOT Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#d4af37]/10 pb-2">
                <span>Rank</span>
                <span className="text-[#f1e5ac] italic serif tracking-normal text-xs">{levelName}</span>
              </div>
              <div className="flex justify-between border-b border-[#d4af37]/10 pb-2">
                <span>Anggota Sejak</span>
                <span className="text-white/80">{new Date(member?.created_at || Date.now()).getFullYear()}</span>
              </div>
            </div>

            {/* TOMBOL LOGOUT TUNGGAL */}
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-12 flex items-center justify-center gap-3 w-full py-4 border border-[#d4af37]/20 rounded-lg text-[#d4af37]/60 hover:text-red-400 hover:border-red-900/50 hover:bg-red-900/20 transition-all uppercase tracking-widest text-[10px] font-bold disabled:opacity-50 group"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
              <span>{isLoggingOut ? 'Signing Out...' : 'Portal Sign Out'}</span>
            </button>
          </div>
        </motion.aside>
      </div>

      {/* Footer Decoration */}
      <footer className="mt-20 w-full max-w-7xl flex flex-col items-center opacity-30 pb-8">
        <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mb-4"></div>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">© 2026 RNHKBP Kayu Putih</p>
      </footer>
    </main>
  );
}