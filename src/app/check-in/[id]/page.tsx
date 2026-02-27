'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  User, 
  LogOut,
  MapPin,
  UserCheck // <-- Ditambahkan untuk icon peran
} from 'lucide-react';

export default function MemberAuthenticatedCheckIn() {
  const { id } = useParams(); // ID Kegiatan dari URL
  const router = useRouter();
  const pathname = usePathname(); // Mengambil path saat ini (misal: /check-in/123)
  
  const [user, setUser] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [status, setStatus] = useState<'loading' | 'idle' | 'success' | 'error' | 'processing'>('loading');
  const [msg, setMsg] = useState('');

  // --- STATE BARU UNTUK DATA PERAN ---
  const [perans, setPerans] = useState<any[]>([]);
  const [selectedPeran, setSelectedPeran] = useState('');

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Verifikasi Sesi Login (Identity Vetting)
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // PERBAIKAN: Menyertakan parameter 'next' agar setelah login kembali ke sini
      const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    setUser(session.user);
    // Langsung panggil fetch dengan email dari session agar lebih cepat
    fetchMemberProfile(session.user.email || '');
    fetchAvailablePeran(); // Memanggil data peran dari database
  };

  // --- FUNGSI BARU: Ambil Daftar Peran ---
  const fetchAvailablePeran = async () => {
    const { data } = await supabase
      .from('katalog_peran')
      .select('id_peran, nama_peran')
      .order('nama_peran');
    if (data) setPerans(data);
  };

  // 2. Ambil Profil dari SSOT berdasarkan Email (Identity Linking)
  const fetchMemberProfile = async (email: string) => {
    const { data, error } = await supabase
      .from('anggota')
      .select('id_anggota, nama_lengkap, email, wijk(nama_wijk)')
      .eq('email', email)
      .single();

    if (error || !data) {
      setStatus('error');
      setMsg('Identitas Anda tidak ditemukan dalam sistem SSOT RNHKBP. Silakan hubungi admin.');
      return;
    }

    setMemberData(data);
    checkPreviousConsent(data.id_anggota);
  };

  // 3. Cek apakah sudah pernah memberikan persetujuan (UU PDP)
  const checkPreviousConsent = async (memberId: string) => {
    const { data } = await supabase
      .from('anggota_consent')
      .select('id_consent')
      .eq('id_anggota', memberId)
      .is('consent_withdrawn_at', null)
      .limit(1);

    if (data && data.length > 0) {
      setHasConsented(true);
    }
    setStatus('idle');
  };

  const handleCheckIn = async () => {
    if (!hasConsented) {
      setStatus('error');
      setMsg('Anda harus menyetujui pernyataan privasi sebelum melanjutkan.');
      return;
    }

    // Validasi agar peran tidak boleh kosong
    if (!selectedPeran) {
      setStatus('error');
      setMsg('Silakan pilih peran Anda dalam kegiatan ini!');
      return;
    }

    setStatus('processing');

    // Pencatatan Check-In ke Tabel Riwayat Partisipasi (Menggunakan Insert langsung agar bisa passing id_peran)
    const { error } = await supabase.from('riwayat_partisipasi').insert([{
      id_anggota: memberData.id_anggota,
      id_kegiatan: id,
      id_peran: selectedPeran,
      status_kehadiran: 'Hadir',
      waktu_check_in: new Date().toISOString()
    }]);

    if (error) {
      setStatus('error');
      setMsg(error.message);
    } else {
      // Catat Audit Log untuk integritas data
      await supabase.from('audit_log').insert({
        actor_id: memberData.id_anggota,
        action: 'MEMBER_CHECKIN',
        entity: 'kegiatan',
        entity_id: id as string,
        new_data: { status: 'success', method: 'portal_verified', role_id: selectedPeran }
      });
      setStatus('success');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 min-h-screen bg-[#f8fafc] text-left font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            Verified <span className="text-blue-600">Check-In</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">RNHKBP Identity Portal</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* MEMBER CARD */}
      <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <User size={120} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex px-3 py-1 bg-blue-50 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest">
            Identity Verified
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 uppercase leading-tight">{memberData?.nama_lengkap}</p>
            <div className="flex items-center gap-2 mt-2 text-slate-400">
              <MapPin size={14} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Wijk: {memberData?.wijk?.nama_wijk || 'Umum'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PRIVACY CONSENT (UU PDP) */}
      {!hasConsented && status !== 'success' && (
        <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="text-blue-600" size={20} />
            <h2 className="font-black text-xs uppercase text-blue-700">Digital Privacy Consent</h2>
          </div>
          <p className="text-[10px] leading-relaxed font-medium text-slate-600 mb-4 uppercase">
            Sesuai <span className="font-bold underline">UU PDP No. 27 Tahun 2022</span>, kehadiran Anda akan dicatat untuk pemetaan pelayanan RNHKBP Kayu Putih.
          </p>
          <label className="flex items-center gap-3 p-4 bg-white rounded-2xl cursor-pointer shadow-sm active:scale-95 transition-transform">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-200"
              onChange={(e) => setHasConsented(e.target.checked)}
            />
            <span className="text-[10px] font-black text-slate-700 uppercase">I Consent & Continue</span>
          </label>
        </div>
      )}

      {/* SELECTION PERAN & ACTION BUTTON */}
      {status === 'success' ? (
        <div className="p-8 bg-emerald-500 text-white rounded-[2.5rem] flex flex-col items-center text-center gap-4 animate-in zoom-in">
          <CheckCircle size={48} />
          <div>
            <p className="font-black uppercase text-lg leading-none">Berhasil Teratat!</p>
            <p className="text-[10px] font-bold opacity-80 uppercase mt-2">Data kehadiran telah disimpan secara aman di SSOT.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* --- BAGIAN DROPDOWN PERAN --- */}
          <div className="space-y-3 animate-in fade-in duration-700">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              <UserCheck size={14} className="text-blue-600" /> Pilih Peran Pelayanan
            </label>
            <div className="relative">
              <select 
                value={selectedPeran}
                onChange={(e) => setSelectedPeran(e.target.value)}
                className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="">-- TENTUKAN PERAN ANDA --</option>
                {perans.map(p => (
                  <option key={p.id_peran} value={p.id_peran}>{p.nama_peran}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckIn}
            disabled={status === 'processing' || (!hasConsented && status !== 'idle')}
            className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
          >
            {status === 'processing' ? <Loader2 className="animate-spin" /> : 'Confirm Attendance'}
          </button>
        </div>
      )}

      {/* ERROR FEEDBACK */}
      {status === 'error' && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-[10px] font-black border border-red-100 uppercase tracking-tighter">
          <AlertTriangle size={16} className="shrink-0" /> {msg}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center gap-3 px-4 text-slate-400">
        <Info size={14} />
        <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed text-center mx-auto italic">
          Setiap aktivitas akses akan dicatat dalam audit log organisasi.
        </p>
      </div>
    </div>
  );
}