'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, Calendar, MapPin, Phone, Home, 
  ArrowLeft, BadgeCheck, ShieldCheck, Clock,
  Loader2, Activity, CheckCircle2, Star
} from 'lucide-react';

export default function MemberDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [journey, setJourney] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemberFullData() {
      // 1. Fetch Data Profil Utama
      const { data: memberData } = await supabase
        .from('anggota')
        .select('*, wijk:id_wijk (nama_wijk, kode_wijk)')
        .eq('id_anggota', id)
        .single();

      // 2. Fetch Data Perjalanan (Partisipasi & Kegiatan)
      const { data: participationData } = await supabase
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

      if (memberData) setMember(memberData);
      if (participationData) setJourney(participationData);
      
      setLoading(false);
    }

    if (id) fetchMemberFullData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f7f8]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-500 font-bold uppercase tracking-widest">Data anggota tidak ditemukan.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 font-black text-xs uppercase">Kembali</button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#f6f7f8] min-h-screen text-left">
      {/* Navigation */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-black text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Kembali ke Master Records
      </button>

      {/* Header Profil */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="size-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <User size={40} />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">{member.nama_lengkap}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                <BadgeCheck size={12} /> {member.status_keanggotaan || 'Aktif'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic font-sans">Verified Member</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Detail & Status */}
        <div className="lg:col-span-1 space-y-8">
          {/* Informasi Personal */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8">
            <h3 className="font-black text-[#0e141b] text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <User size={16} className="text-blue-600" /> Profil Detail
            </h3>
            <div className="space-y-6">
              <DetailItem icon={<Calendar size={18}/>} label="Tanggal Lahir" value={member.tanggal_lahir} />
              <DetailItem icon={<MapPin size={18}/>} label="Wilayah (Wijk)" value={member.wijk?.nama_wijk || 'N/A'} />
              <DetailItem icon={<Phone size={18}/>} label="Nomor Telepon" value={member.no_telp || 'N/A'} />
              <DetailItem icon={<Home size={18}/>} label="Alamat" value={member.alamat || 'N/A'} />
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
            <h3 className="font-black text-[#0e141b] text-xs uppercase tracking-[0.2em] mb-4">Integritas Data</h3>
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
              <ShieldCheck className="text-blue-600 shrink-0" size={24} />
              <div className="text-left">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">PDP Compliant</p>
                <p className="text-xs text-blue-900 font-bold italic">Persetujuan digital aktif.</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 text-left">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Terdaftar Sejak</p>
              <p className="text-sm font-bold text-[#0e141b]">
                {new Date(member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Journey Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-[#0e141b] text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={18} className="text-blue-600" /> Member Journey Timeline
              </h3>
              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">
                {journey.length} Kegiatan
              </span>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-slate-200 before:to-transparent">
              {/* Event Terdaftar (Paling Bawah/Awal) */}
              {journey.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 italic text-sm">Belum ada riwayat aktivitas yang tercatat.</p>
                </div>
              ) : (
                journey.map((item, idx) => (
                  <div key={item.id_partisipasi} className="relative flex items-start gap-6 group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Icon Node */}
                    <div className="absolute left-0 size-10 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={16} className="text-blue-600" />
                    </div>
                    
                    {/* Content */}
                    <div className="ml-14 flex-1 text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#0e141b] group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                            {item.kegiatan?.nama_kegiatan}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <Star size={10} /> {item.peran?.nama_peran || 'Peserta'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                              {item.status_kehadiran}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(item.waktu_check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] font-bold text-slate-300 italic uppercase">
                            {new Date(item.waktu_check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Titik Awal: Registrasi */}
              <div className="relative flex items-start gap-6 opacity-60">
                <div className="absolute left-0 size-10 bg-slate-100 border-4 border-white rounded-full flex items-center justify-center z-10 shadow-sm">
                  <Clock size={16} className="text-slate-400" />
                </div>
                <div className="ml-14 text-left">
                  <p className="text-sm font-black text-slate-500 uppercase tracking-tight">Anggota Terdaftar di Portal</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awal Perjalanan Data SSOT</p>
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
    <div className="flex items-start gap-4 group">
      <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">{label}</p>
        <p className="text-sm font-black text-[#0e141b] tracking-tight">{value}</p>
      </div>
    </div>
  );
}