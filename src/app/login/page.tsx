'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

/**
 * LoginPage: Gerbang utama SSOT RNHKBP Kayu Putih.
 * Memisahkan alur login Admin (@rnhkbp.com) dan Anggota biasa.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Autentikasi melalui Supabase Auth Service
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email atau Password salah.");
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    const userEmail = authData.user?.email || '';
    const isSystemAdmin = userEmail.endsWith('@rnhkbp.com');

    try {
      // 2. ALUR LOGIN A: ADMINISTRATOR (@rnhkbp.com)
      if (isSystemAdmin) {
        // Menetapkan role default (Admin Internal mendapatkan Full Control)
        const role = 'ADMIN_INTERNAL'; 
        localStorage.setItem('user_role', role);

        // Pencatatan Audit Trail untuk pertanggungjawaban akses
        await supabase.from('audit_log').insert({
          actor_id: userId,
          action: 'ADMIN_LOGIN',
          entity: 'system_access',
          entity_id: userId,
          new_data: { 
            login_at: new Date().toISOString(), 
            role: role,
            access_type: 'FULL_CONTROL' 
          }
        });

        router.push('/admin');
        return;
      }

      // 3. ALUR LOGIN B: ANGGOTA (Jemaat)
      // Mencari data di Master Records (tabel anggota)
      const { data: member, error: dbError } = await supabase
        .from('anggota')
        .select('id_anggota, nama_lengkap, is_verified, role')
        .eq('id_anggota', userId)
        .single();

      // Penanganan error jika profil tidak ditemukan
      if (dbError || !member) {
        setError("Profil Anda tidak ditemukan di Master Records.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Validasi Vetting Status (Mencegah akses jika masih dalam Quarantine)
      if (member.is_verified === false) {
        setError("Akun Anda dalam status Quarantine (Menunggu verifikasi).");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Menyimpan role Member dan mencatat aktivitas
      localStorage.setItem('user_role', 'MEMBER');
      await supabase.from('audit_log').insert({
        actor_id: member.id_anggota,
        action: 'MEMBER_LOGIN',
        entity: 'anggota',
        entity_id: member.id_anggota,
        new_data: { name: member.nama_lengkap, status: 'verified' }
      });

      router.push(`/dashboard/${member.id_anggota}`);

    } catch (err) {
      setError("Terjadi kesalahan sinkronisasi sistem.");
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f6f7f8] flex items-center justify-center p-6 font-sans overflow-hidden">
      
      {/* Ornamen Latar Belakang */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#d0dbe7_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#197fe6] rounded-2xl shadow-xl shadow-blue-100 mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#0e141b] uppercase tracking-tighter leading-none">
            SSOT <span className="text-[#197fe6]">Access</span>
          </h1>
          <p className="text-[10px] font-bold text-[#4e7397] uppercase tracking-widest italic leading-relaxed">
            RNHKBP Kayu Putih — Identity Vetting Portal
          </p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.2em] ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#197fe6] transition-colors" size={18} />
                  <input 
                    required 
                    type="email" 
                    placeholder="nama@email.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#197fe6] transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.2em] ml-1">
                  Secure Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#197fe6] transition-colors" size={18} />
                  <input 
                    required 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#197fe6] transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-red-500 shrink-0" size={16} />
                <p className="text-[10px] font-black text-red-500 uppercase leading-tight tracking-tight">
                  {error}
                </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#197fe6] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>Masuk ke Portal <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] text-[#4e7397] font-black uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} RNHKBP Kayu Putih
          </p>
        </div>
      </div>
    </div>
  );
}