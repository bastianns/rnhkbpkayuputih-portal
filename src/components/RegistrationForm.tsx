'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, Calendar, MapPin, Phone, 
  ChevronRight, ArrowLeft, ShieldCheck, CheckCircle2,
  Briefcase, Loader2, Database, AlertCircle,
  Home, Mail, Lock, Info
} from 'lucide-react';
// INTEGRASI POIN 3: Import helper audit log
import { createAuditLog } from '@/lib/audit';

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  
  const [wijkList, setWijkList] = useState<any[]>([]);
  const [kesibukanList, setKesibukanList] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'flagged' | 'error', msg: string } | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    tgl_lahir: '',
    wijk: '',
    telp: '',
    alamat: '',
    kesibukan: '',
    consent: false
  });

  // 1. DYNAMIC METADATA FETCHING (LOGIKA ASLI DIPERTAHANKAN)
  useEffect(() => {
    async function getMetadata() {
      setMetaLoading(true);
      try {
        const { data: wijk } = await supabase.from('wijk').select('id_wijk, nama_wijk').order('nama_wijk');
        const { data: kesibukan } = await supabase.from('ref_kategori_kesibukan').select('id_kategori_kesibukan, nama_kategori').order('nama_kategori');
        
        if (wijk) setWijkList(wijk);
        if (kesibukan) setKesibukanList(kesibukan);
      } catch (err) {
        console.error("Gagal mengambil metadata:", err);
      } finally {
        setMetaLoading(false);
      }
    }
    getMetadata();
  }, []);

  const canGoNext = () => {
    if (step === 1) return formData.nama.length > 2 && formData.email.includes('@') && formData.password.length >= 6;
    if (step === 2) return formData.tgl_lahir !== '' && formData.wijk !== '' && formData.telp.length >= 10;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) return;
    
    setLoading(true);
    setFeedback(null);

    try {
      // 1. TAHAP AUTH: Daftarkan akun ke Supabase Auth (LOGIKA ASLI DIPERTAHANKAN)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.nama,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Gagal membuat akun autentikasi.");

      // 2. TAHAP VETTING: Kirim data ke Stored Procedure (RPC) (LOGIKA ASLI DIPERTAHANKAN)
      const payload = {
        p_id_anggota: authData.user.id,
        p_nama_lengkap: formData.nama,
        p_email: formData.email,
        p_tanggal_lahir: formData.tgl_lahir,
        p_id_wijk: formData.wijk,
        p_no_telp: formData.telp,
        p_alamat: formData.alamat,
        p_id_kesibukan: formData.kesibukan,
        p_consent: formData.consent
      };

      const { data: vettingResult, error: rpcError } = await supabase.rpc('fn_portal_register_anggota', payload);

      if (rpcError) throw rpcError;

      // 3. INTEGRASI POIN 3: CATAT AUDIT LOG PENDAFTARAN
      // Mencatat pendaftaran jemaat baru ke tabel audit agar Admin dapat memantau
      await createAuditLog(
        vettingResult.status === 'success' ? 'SELF_REGISTER' : 'SELF_REGISTER_FLAGGED',
        'anggota',
        authData.user.id,
        null,
        { nama: formData.nama, email: formData.email, id_wijk: formData.wijk }
      );

      // 4. LOGIKA FEEDBACK (LOGIKA ASLI DIPERTAHANKAN)
      if (vettingResult.status === 'success') {
        setFeedback({ 
          type: 'success', 
          msg: 'Registrasi Berhasil! Identitas Anda telah tervalidasi sebagai data unik. Akun Anda kini aktif.' 
        });
      } else if (vettingResult.status === 'flagged') {
        setFeedback({ 
          type: 'flagged', 
          msg: 'Data Anda ditahan di Quarantine untuk peninjauan Admin karena deteksi kemiripan identitas. Mohon tunggu verifikasi.' 
        });
      }
      setStep(4);
    } catch (error: any) {
      setFeedback({ type: 'error', msg: "Kegagalan Sistem: " + error.message });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden text-left font-sans">
      
      {/* Progress Header Premium (Visual Update) */}
      <div className="p-8 pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <div className="text-left">
            <h2 className="text-[#0e141b] text-xl font-black tracking-tight uppercase leading-none">Registrasi Portal</h2>
            <p className="text-[#4e7397] text-[10px] font-bold uppercase tracking-widest mt-2 italic leading-none">Identity Vetting System</p>
          </div>
          <div className="flex items-center gap-1.5 font-black text-[#1e40af] text-sm">
            {Math.round((Math.min(step, 3) / 3) * 100)}% <span className="text-slate-300 text-[9px] uppercase tracking-widest ml-1">Selesai</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1e40af] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(30,64,175,0.3)]" 
            style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="p-8 md:p-10 text-left">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
            <InputGroup label="Nama Lengkap (Sesuai KTP)" icon={<User size={18}/>}>
              <input required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full bg-transparent outline-none font-bold placeholder:text-slate-300 text-[#0f172a] uppercase" placeholder="Contoh: Bastian Natanael" />
            </InputGroup>
            <InputGroup label="Email Address" icon={<Mail size={18}/>}>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-transparent outline-none font-bold placeholder:text-slate-300 text-[#0f172a]" placeholder="nama@email.com" />
            </InputGroup>
            <InputGroup label="Password Portal" icon={<Lock size={18}/>}>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-transparent outline-none font-bold placeholder:text-slate-300 text-[#0f172a]" placeholder="Minimal 6 Karakter" />
            </InputGroup>
            <button disabled={!canGoNext()} onClick={() => setStep(2)} className="w-full py-5 bg-[#1e40af] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
              Lanjut ke Data Wilayah <ChevronRight size={18}/>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
            <InputGroup label="Tanggal Lahir" icon={<Calendar size={18}/>}>
              <input required type="date" value={formData.tgl_lahir} onChange={e => setFormData({...formData, tgl_lahir: e.target.value})} className="w-full bg-transparent outline-none font-bold text-[#0f172a]" />
            </InputGroup>
            <InputGroup label="Wilayah (Wijk)" icon={<MapPin size={18}/>}>
              <select required value={formData.wijk} onChange={e => setFormData({...formData, wijk: e.target.value})} className="w-full bg-transparent outline-none font-bold appearance-none text-[#0f172a] cursor-pointer">
                <option value="">{metaLoading ? 'Sinkronisasi...' : 'Pilih Wijk'}</option>
                {wijkList.map(w => <option key={w.id_wijk} value={w.id_wijk}>Wijk {w.nama_wijk}</option>)}
              </select>
            </InputGroup>
            <InputGroup label="Nomor Telepon (WhatsApp)" icon={<Phone size={18}/>}>
              <input required value={formData.telp} onChange={e => setFormData({...formData, telp: e.target.value})} className="w-full bg-transparent outline-none font-bold placeholder:text-slate-300 text-[#0f172a]" placeholder="0812..." />
            </InputGroup>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="p-5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"><ArrowLeft size={18}/></button>
              <button disabled={!canGoNext()} onClick={() => setStep(3)} className="flex-1 py-5 bg-[#1e40af] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/10 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95">Lanjut ke Finalisasi</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
            <InputGroup label="Alamat Domisili" icon={<Home size={18}/>}>
              <textarea required value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full bg-transparent outline-none font-bold py-1 min-h-[60px] placeholder:text-slate-300 text-[#0f172a] resize-none" placeholder="Jl. Kayu Putih Tengah No..." />
            </InputGroup>
            <InputGroup label="Status Kesibukan" icon={<Briefcase size={18}/>}>
              <select required value={formData.kesibukan} onChange={e => setFormData({...formData, kesibukan: e.target.value})} className="w-full bg-transparent outline-none font-bold appearance-none text-[#0f172a] cursor-pointer">
                <option value="">Pilih Status</option>
                {kesibukanList.map(k => <option key={k.id_kategori_kesibukan} value={k.id_kategori_kesibukan}>{k.nama_kategori}</option>)}
              </select>
            </InputGroup>
            
            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 text-left">
              <div className="flex items-start gap-4">
                <input 
                  type="checkbox" required checked={formData.consent} 
                  onChange={e => setFormData({...formData, consent: e.target.checked})}
                  className="mt-1 size-5 rounded border-blue-200 text-[#1e40af] focus:ring-[#1e40af] cursor-pointer" 
                />
                <div className="text-left">
                  <p className="text-[10px] font-black text-[#1e40af] uppercase tracking-widest flex items-center gap-1.5 mb-2 leading-none">
                    <ShieldCheck size={14}/> UU PDP Compliance
                  </p>
                  <p className="text-[10px] text-blue-900 leading-relaxed font-bold italic">
                    Saya menyetujui data identitas saya diproses sesuai standar keamanan organisasi untuk keperluan integrasi sistem anggota (SSOT) sesuai kebijakan organisasi.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="p-5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"><ArrowLeft size={18}/></button>
              <button 
                type="submit" 
                disabled={loading || !formData.consent} 
                className="flex-1 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-black transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <><Database size={18}/> Selesaikan Pendaftaran</>}
              </button>
            </div>
          </form>
        )}

        {step === 4 && feedback && (
          <div className="py-12 space-y-8 animate-in zoom-in duration-500 text-center">
            <div className={`size-24 mx-auto rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl ${
              feedback.type === 'success' ? 'bg-green-600 shadow-green-100' : 
              feedback.type === 'flagged' ? 'bg-[#f59e0b] shadow-amber-100' : 'bg-red-600 shadow-red-100'
            }`}>
              {feedback.type === 'error' ? <AlertCircle size={48}/> : feedback.type === 'flagged' ? <Info size={48}/> : <CheckCircle2 size={48} />}
            </div>
            <div className="space-y-3 px-6 text-center">
              <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight leading-none text-center">
                {feedback.type === 'error' ? 'Gagal Terdaftar' : 'Proses Selesai'}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-xs mx-auto uppercase tracking-tighter italic text-center">
                {feedback.msg}
              </p>
            </div>
            <div className="pt-6 flex flex-col items-center gap-4 text-center">
              <button onClick={() => window.location.href = '/login'} className="px-10 py-4 bg-[#1e40af] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-50 hover:bg-blue-700 transition-all active:scale-95">Ke Halaman Login</button>
              <button onClick={() => window.location.reload()} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-[#1e40af] transition-colors">Daftarkan Anggota Lain</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-komponen InputGroup yang telah diperhalus agar konsisten (VISUAL UPDATE)
function InputGroup({ label, icon, children }: any) {
  return (
    <div className="flex flex-col gap-2 group text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">{label}</label>
      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus-within:bg-white focus-within:border-[#1e40af] focus-within:shadow-xl transition-all duration-300">
        <div className="text-slate-200 mr-4 group-focus-within:text-[#1e40af] shrink-0 transition-colors duration-300">{icon}</div>
        <div className="flex-1 text-left">
          {children}
        </div>
      </div>
    </div>
  );
}