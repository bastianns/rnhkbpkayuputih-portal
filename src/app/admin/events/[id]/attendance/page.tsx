'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Clock, 
  ArrowLeft, 
  Power, 
  Unlock, 
  Lock, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAttendanceMonitor() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false); // State untuk status absensi
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // 1. Ambil Data Awal & List Hadir
  const fetchStatusAndAttendees = async () => {
    // Ambil data kegiatan (termasuk is_open)
    const { data: ev } = await supabase
      .from('kegiatan')
      .select('*, kategori_kegiatan(nama_kategori)')
      .eq('id_kegiatan', id)
      .single();
    
    if (ev) {
      setEvent(ev);
      setIsOpen(ev.is_open);
    }

    // Ambil list jemaat yang sudah hadir
    const { data: logs } = await supabase
      .from('riwayat_partisipasi')
      .select('*, anggota(nama_lengkap)')
      .eq('id_kegiatan', id)
      .order('waktu_check_in', { ascending: false });
    
    if (logs) setAttendees(logs);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatusAndAttendees();

    // REAL-TIME: Pantau absen masuk dan perubahan status kegiatan
    const attendanceChannel = supabase
      .channel('attendance_live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'riwayat_partisipasi',
        filter: `id_kegiatan=eq.${id}`
      }, () => fetchStatusAndAttendees())
      .subscribe();

    return () => { supabase.removeChannel(attendanceChannel); };
  }, [id]);

  // 2. Fungsi Toggle Buka/Tutup Absensi
  const handleToggleAttendance = async () => {
    setToggling(true);
    const { error } = await supabase
      .from('kegiatan')
      .update({ is_open: !isOpen })
      .eq('id_kegiatan', id);

    if (!error) {
      setIsOpen(!isOpen);
      // Logika Audit Log bisa ditambahkan di sini
    }
    setToggling(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
      <Loader2 className="animate-spin text-[#197fe6] mb-4" size={48} />
      <p className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.3em]">Menyiapkan Monitor Kehadiran...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex flex-col lg:flex-row font-sans overflow-hidden">
      
      {/* KIRI: CONTROL PANEL (PENGGANTI QR CODE) */}
      <div className={`flex-1 p-12 flex flex-col items-center justify-center transition-colors duration-700 ${isOpen ? 'bg-white' : 'bg-slate-100'}`}>
        
        <div className="absolute top-8 left-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#4e7397] font-black text-[10px] uppercase tracking-widest hover:text-[#197fe6]">
            <ArrowLeft size={16} /> Kembali ke Event
          </button>
        </div>

        <div className="text-center space-y-6 mb-12">
          <div className="flex flex-col items-center gap-2 mb-4">
            <ShieldCheck size={40} className="text-[#197fe6]" />
            <span className="text-[10px] font-black text-[#197fe6] uppercase tracking-[0.4em]">Control Center</span>
          </div>
          <h1 className="text-5xl font-black text-[#0e141b] tracking-tighter uppercase leading-tight">{event?.nama_kegiatan}</h1>
          <p className="text-sm font-bold text-[#4e7397] uppercase tracking-widest italic opacity-60">
            {event?.kategori_kegiatan?.nama_kategori} • HKBP Kayu Putih
          </p>
        </div>

        {/* STATUS BANNER & TOGGLE */}
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col items-center gap-8 w-full max-w-md">
          <div className={`size-32 rounded-full flex items-center justify-center transition-all shadow-inner ${isOpen ? 'bg-green-50 text-green-500 animate-pulse' : 'bg-red-50 text-red-400'}`}>
            {isOpen ? <Unlock size={60} /> : <Lock size={60} />}
          </div>
          
          <div className="text-center">
            <h2 className={`text-2xl font-black uppercase tracking-widest ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
              Absensi {isOpen ? 'Terbuka' : 'Tertutup'}
            </h2>
            <p className="text-xs text-[#4e7397] font-medium mt-2 leading-relaxed px-6">
              {isOpen 
                ? "Jemaat sekarang dapat menekan tombol 'Hadir' di HP mereka." 
                : "Akses tombol absensi di aplikasi jemaat dinonaktifkan."}
            </p>
          </div>

          <button 
            onClick={handleToggleAttendance}
            disabled={toggling}
            className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
              isOpen 
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' 
                : 'bg-[#0f172a] text-white hover:bg-[#197fe6] shadow-slate-300'
            }`}
          >
            {toggling ? <Loader2 className="animate-spin" /> : <Power size={20} />}
            {isOpen ? 'Tutup Absensi Sekarang' : 'Buka Absensi Sekarang'}
          </button>
        </div>
      </div>

      {/* KANAN: LIVE FEED (TETAP SAMA SEPERTI SEBELUMNYA) */}
      <div className="w-full lg:w-[500px] p-12 bg-white border-l border-slate-200 overflow-y-auto">
        <div className="flex justify-between items-end mb-12">
          <div className="text-left">
            <h2 className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.4em] mb-2">Live Participation</h2>
            <div className="flex items-baseline gap-2">
              <p className="text-7xl font-black text-[#197fe6] tracking-tighter leading-none">{attendees.length}</p>
              <span className="text-sm font-black text-slate-300 uppercase">Hadir</span>
            </div>
          </div>
          <Users size={48} className="text-slate-100" />
        </div>

        <div className="space-y-4">
          {attendees.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-3xl">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Menunggu partisipan pertama...</p>
            </div>
          ) : attendees.map((log) => (
            <div key={log.id_partisipasi} className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-[2rem] border border-white shadow-sm animate-in slide-in-from-bottom-4">
              <div className="size-12 bg-white text-[#197fe6] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Users size={20} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-black text-[#0e141b] uppercase text-xs truncate leading-none mb-1.5">{log.anggota?.nama_lengkap}</p>
                <div className="flex items-center gap-2 text-[9px] font-black text-[#4e7397] uppercase tracking-tighter opacity-60">
                  <Clock size={10} /> {new Date(log.waktu_check_in).toLocaleTimeString('id-ID')} WIB
                </div>
              </div>
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}