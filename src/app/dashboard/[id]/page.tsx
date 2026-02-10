'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Award, 
  Calendar, 
  History, 
  Star, 
  Zap, 
  CheckCircle2, 
  Trophy, 
  Crown, 
  Medal,
  Loader2,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Verified,
  TrendingUp,
  Mail,
  Share2,
  Lock,
  LayoutDashboard,
  MapPin,
  Check
} from 'lucide-react';
// INTEGRASI POIN 3: Import helper audit log
import { createAuditLog } from '@/lib/audit';

export default function MemberMobileDashboard() {
  const { id } = useParams();
  const router = useRouter();
  
  const [member, setMember] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null); // State untuk kegiatan yang sedang buka absen
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fungsi untuk menentukan level jemaat berdasarkan poin
  const getMemberLevel = (points: number) => {
    if (points >= 150) return { label: 'Jemaat Pilar', color: 'bg-purple-50 text-purple-600', icon: <Crown size={12} /> };
    if (points >= 50) return { label: 'Jemaat Teladan', color: 'bg-amber-50 text-amber-600', icon: <Award size={12} /> };
    return { label: 'Jemaat Aktif', color: 'bg-emerald-50 text-emerald-600', icon: <Star size={12} /> };
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh(); 
    } catch (error) {
      console.error("Logout gagal:", error);
      setIsLoggingOut(false);
    }
  };

  // Fungsi pengambilan data terpusat
  const fetchDashboardData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Ambil Profil & Wijk menggunakan maybeSingle agar tidak error jika kosong
      const { data: profile } = await supabase
        .from('anggota')
        .select('*, wijk(id_wijk, nama_wijk)')
        .eq('id_anggota', id)
        .maybeSingle();

      // 2. Ambil Riwayat Partisipasi
      const { data: history } = await supabase
        .from('riwayat_partisipasi')
        .select(`
          id_partisipasi,
          id_kegiatan,
          waktu_check_in,
          kegiatan:id_kegiatan (nama_kegiatan),
          peran:id_peran (nama_peran)
        `)
        .eq('id_anggota', id)
        .order('waktu_check_in', { ascending: false });

      // 3. Cek apakah ada kegiatan yang sedang OPEN (maybeSingle fix)
      const { data: liveEvent } = await supabase
        .from('kegiatan')
        .select('*')
        .eq('is_open', true)
        .maybeSingle();

      // 4. Ambil Leaderboard Top 3 di Wijk yang sama
      if (profile?.id_wijk) {
        const { data: topList } = await supabase
          .from('view_leaderboard_aktif')
          .select('*')
          .eq('id_wijk', profile.id_wijk)
          .limit(3);
        if (topList) setLeaderboard(topList);
      }

      // Validasi tombol absen
      if (liveEvent) {
        const hasJoined = history?.some(h => h.id_kegiatan === liveEvent.id_kegiatan);
        if (!hasJoined) setActiveEvent(liveEvent);
        else setActiveEvent(null);
      } else {
        setActiveEvent(null);
      }

      if (profile) setMember(profile);
      if (history) setActivities(history || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fungsi Absensi Sekali Klik (Pencarian Peran Dinamis + Audit Log)
  const handleConfirmAttendance = async () => {
    if (!activeEvent || isCheckingIn) return;
    setIsCheckingIn(true);

    try {
      // Cari ID Peran "Jemaat" secara dinamis di database
      const { data: roleData, error: roleError } = await supabase
        .from('katalog_peran')
        .select('id_peran')
        .ilike('nama_peran', '%Jemaat%')
        .limit(1)
        .maybeSingle();

      if (roleError || !roleData) {
        alert("Sistem Error: Peran 'Jemaat' tidak ditemukan. Pastikan sudah ditambahkan di Settings Admin.");
        setIsCheckingIn(false);
        return;
      }

      // Masukkan riwayat kehadiran
      const { error } = await supabase
        .from('riwayat_partisipasi')
        .insert({
          id_anggota: id,
          id_kegiatan: activeEvent.id_kegiatan,
          waktu_check_in: new Date().toISOString(),
          id_peran: roleData.id_peran 
        });

      if (error) throw error;

      // INTEGRASI POIN 3: CATAT AUDIT LOG KEHADIRAN
      await createAuditLog(
        'MEMBER_SELF_CHECKIN',
        'riwayat_partisipasi',
        activeEvent.id_kegiatan,
        null,
        { member_id: id, event_name: activeEvent.nama_kegiatan }
      );
      
      setActiveEvent(null);
      fetchDashboardData();
    } catch (err) {
      console.error("Gagal melakukan absensi:", err);
      alert("Terjadi kesalahan sistem saat konfirmasi kehadiran.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const totalPoints = (activities?.length || 0) * 10;
  const currentLevel = getMemberLevel(totalPoints);

  if (loading || isLoggingOut) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
      <Loader2 className="animate-spin text-[#1e40af] mb-4" size={48} />
      <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.3em]">
        {isLoggingOut ? 'MENGAKHIRI SESI AMAN...' : 'SINKRONISASI DATA SSOT...'}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-sans antialiased selection:bg-amber-500/20">
      
      {/* --- PREMIUM HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#f59e0b]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-[#f59e0b]/20 rounded-lg blur-sm"></div>
              <div className="relative bg-[#1e40af] p-2 rounded-lg">
                <ShieldCheck className="text-white" size={24} />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-2xl tracking-tighter text-[#0f172a]">SSOT</span>
              <span className="text-[9px] font-bold text-[#f59e0b] tracking-[0.3em] uppercase text-left">Member Portal</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 border border-[#f59e0b] px-6 py-2 rounded-[16px] font-bold text-[11px] tracking-widest transition-all hover:bg-[#f59e0b] hover:text-white uppercase"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              PORTAL SIGN OUT
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full space-y-8">
        
        {/* --- LIVE ATTENDANCE SECTION --- */}
        {activeEvent && (
          <section className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-[16px] p-8 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 text-center md:text-left text-left">
                <span className="inline-flex items-center px-3 py-1 bg-amber-400 text-[#0f172a] text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">
                  Live Now
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{activeEvent.nama_kegiatan}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-white/70 text-[10px] font-bold uppercase tracking-wider">
                  <MapPin size={14} className="text-amber-400" /> <span>Gereja HKBP Kayu Putih</span>
                </div>
              </div>
              <button 
                onClick={handleConfirmAttendance}
                disabled={isCheckingIn}
                className="w-full md:w-auto bg-white text-[#1e40af] px-10 py-4 rounded-[16px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-400 hover:text-[#0f172a] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isCheckingIn ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                KONFIRMASI KEHADIRAN
              </button>
            </div>
          </section>
        )}

        {/* --- HERO SECTION --- */}
        <section className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[16px] p-8 md:p-12 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1e40af]/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 text-left">
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
                <User size={64} className="text-slate-300 font-light" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#f59e0b] p-1.5 rounded-full border-4 border-white">
                <Verified size={16} className="text-white fill-current" />
              </div>
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-[#1e40af]/10 text-[#1e40af] text-[10px] font-bold uppercase tracking-wider">
                  Wijk {member?.wijk?.nama_wijk || 'Lokasi Belum Terdata'}
                </span>
                <span className={`px-3 py-1 rounded-full ${currentLevel.color} text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {currentLevel.label}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tighter mb-2 uppercase text-left">
                {member?.nama_lengkap?.split(' ').slice(0, 2).join(' ')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] to-[#1e40af]/60">{member?.nama_lengkap?.split(' ').slice(2).join(' ')}</span>
              </h1>
              <p className="text-[#64748b] text-sm font-medium italic">Integritas Data Keanggotaan Terverifikasi — SSOT Records.</p>
            </div>
          </div>
        </section>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-12 gap-8 text-left">
          <section className="col-span-12 md:col-span-6 text-left">
            <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[16px] p-8 h-full group hover:border-[#f59e0b]/30 transition-all text-left">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em] mb-1">Status Akumulasi</p>
                  <h3 className="text-xl font-bold text-[#0f172a]">Total Poin</h3>
                </div>
                <div className="bg-[#f59e0b]/5 p-3 rounded-xl">
                  <Zap size={32} className="text-[#f59e0b]" />
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-7xl font-extrabold text-[#f59e0b] tracking-tighter">{totalPoints}</span>
                <span className="text-lg font-bold text-slate-300 tracking-widest uppercase">Points</span>
              </div>
              <div className="space-y-4">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#f59e0b] h-full transition-all duration-1000" style={{ width: `${Math.min((totalPoints / 200) * 100, 100)}%` }}></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748b] font-medium italic">
                  <Star size={14} className="text-amber-500" /> {totalPoints < 50 ? 'Kumpulkan 50 poin untuk level Teladan.' : 'Poin Anda terus meningkat!'}
                </div>
              </div>
            </div>
          </section>

          <section className="col-span-12 md:col-span-6 text-left">
            <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[16px] p-8 h-full group hover:border-[#1e40af]/30 transition-all text-left">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em] mb-1">Metrik Partisipasi</p>
                  <h3 className="text-xl font-bold text-[#0f172a]">Kehadiran</h3>
                </div>
                <div className="bg-[#1e40af]/5 p-3 rounded-xl">
                  <CheckCircle2 size={32} className="text-[#1e40af]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-6 text-left">
                <span className="text-7xl font-extrabold text-[#1e40af] tracking-tighter">{activities?.length || 0}</span>
                <span className="text-4xl font-bold text-slate-200 tracking-widest ml-2 uppercase">Events</span>
              </div>
              <div className="space-y-4">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#1e40af] h-full transition-all duration-1000" style={{ width: `${Math.min(((activities?.length || 0) / 10) * 100, 100)}%` }}></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748b] font-medium">
                  <TrendingUp size={14} /> Berdasarkan data partisipasi aktif Anda.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* --- LEADERBOARD & ACTIVITY GRID --- */}
        <div className="grid grid-cols-12 gap-8 text-left">
          <section className="col-span-12 lg:col-span-8 text-left">
            <div className="bg-[#0f172a] rounded-[16px] overflow-hidden h-full flex flex-col shadow-2xl text-left">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-2 mb-1 text-[#f59e0b]">
                  <Trophy size={20} />
                  <h3 className="font-bold text-lg text-white uppercase tracking-wider text-left">Wijk Leaderboard</h3>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase text-left">UPDATE: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
              </div>
              
              <div className="flex-grow p-8 bg-[#0a0f1c] space-y-4 text-left">
                {leaderboard.length > 0 ? leaderboard.map((user, index) => (
                  <div key={user.id_anggota} className={`flex items-center gap-4 p-5 rounded-2xl transition-all ${user.id_anggota === id ? 'bg-blue-600/20 ring-1 ring-blue-500/50' : 'bg-white/5 hover:bg-white/10'}`}>
                    <div className="shrink-0 text-left">
                      {index === 0 && <Crown className="text-[#f59e0b]" size={28} />}
                      {index === 1 && <Medal className="text-slate-300" size={28} />}
                      {index === 2 && <Medal className="text-amber-700" size={28} />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-white uppercase truncate text-left">
                        {user.nama_lengkap} {user.id_anggota === id && <span className="text-[10px] text-[#1e40af] ml-2">(ANDA)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter text-left">
                        {user.total_kehadiran} Kegiatan Diikuti
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#f59e0b] leading-none">{user.total_poin}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Pts</p>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <TrendingUp className="text-white/10 mb-4" size={48} />
                    <h4 className="text-slate-400 font-bold text-sm">Belum ada data peringkat wilayah.</h4>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 text-left">
            <div className="bg-white border border-slate-100 rounded-[16px] p-8 h-full flex flex-col shadow-sm text-left">
              <div className="flex items-center gap-3 mb-8 text-left">
                <div className="w-8 h-8 rounded bg-[#1e40af]/5 flex items-center justify-center text-[#1e40af]">
                  <History size={18} />
                </div>
                <h3 className="font-bold text-[#0f172a] text-sm uppercase tracking-widest text-left text-left">Aktivitas</h3>
              </div>
              <div className="flex-grow space-y-6 text-left">
                {activities.length > 0 ? activities.slice(0, 5).map((act) => (
                  <div key={act.id_partisipasi} className="flex gap-4 group text-left">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="size-2 rounded-full bg-[#1e40af] mt-1.5"></div>
                      <div className="flex-grow w-px bg-slate-100 my-1"></div>
                    </div>
                    <div className="flex-1 text-left pb-4 border-b border-slate-50 min-w-0">
                      <p className="text-xs font-black text-[#0f172a] uppercase leading-tight truncate text-left">
                        {act.kegiatan?.nama_kegiatan}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-left">
                        <span className="text-[8px] font-bold text-[#1e40af] bg-[#1e40af]/5 px-1.5 py-0.5 rounded uppercase text-left">
                          {act.peran?.nama_peran || 'Jemaat'}
                        </span>
                        <span className="text-[9px] text-[#64748b] font-medium italic text-left">
                          {new Date(act.waktu_check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex-grow flex flex-col items-center justify-center space-y-4 opacity-30 text-center">
                    <History size={48} />
                    <p className="text-[11px] font-bold uppercase italic text-center">Belum ada riwayat aktivitas</p>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 text-left">
                <button 
                  onClick={() => router.push(`/dashboard/${id}/history`)}
                  className="w-full text-[10px] font-bold text-[#1e40af] uppercase tracking-widest hover:text-[#f59e0b] transition-colors text-left"
                >
                  Lihat Semua Riwayat
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* --- PREMIUM FOOTER --- */}
      <footer className="bg-[#0f172a] text-slate-400 mt-20 border-t border-white/5 py-16 px-6 text-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 text-left">
            <div className="md:col-span-5 text-left text-left">
              <div className="flex items-center gap-3 mb-6 text-left">
                <div className="bg-[#f59e0b] p-1.5 rounded-lg text-left">
                  <ShieldCheck className="text-[#0f172a]" size={24} />
                </div>
                <span className="font-extrabold text-xl tracking-tighter text-white uppercase text-left">SSOT Portal</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-8 text-left text-left">
                Sistem Satu Orang Terpadu (SSOT) untuk manajemen data partisipasi dan keanggotaan RNHKP Kayu Putih yang profesional dan transparan.
              </p>
              <div className="flex gap-4 text-left">
                <div className="w-10 h-10 rounded-[12px] border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer transition-colors text-white">
                  <Share2 size={18} />
                </div>
                <div className="w-10 h-10 rounded-[12px] border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer transition-colors text-white">
                  <Mail size={18} />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 text-left text-left">
              <div className="bg-white/5 p-6 rounded-[16px] border border-white/5 text-left">
                <div className="flex items-center gap-3 mb-4 text-[#f59e0b] text-left">
                  <Verified size={20} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest text-left">Kepatuhan Data</h4>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 text-left">
                  Seluruh sistem penyimpanan data mematuhi standar keamanan sesuai UU Perlindungan Data Pribadi (PDP) Nasional.
                </p>
              </div>
              <div className="bg-white/5 p-6 rounded-[16px] border border-white/5 text-left">
                <div className="flex items-center gap-3 mb-4 text-[#1e40af] text-left">
                  <Lock size={20} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest text-left text-left">Integritas Sistem</h4>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 text-left">
                  Keamanan berlapis dengan enkripsi tingkat lanjut untuk memastikan integritas data setiap anggota tetap terjaga.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center text-center">
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] text-center">© 2024-2026 SSOT PORTAL. RNHKP KAYU PUTIH.</p>
            <div className="flex gap-8 text-center text-center">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] cursor-pointer hover:text-[#f59e0b] text-center">Kebijakan Privasi</span>
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] cursor-pointer hover:text-[#f59e0b] text-center">Bantuan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}