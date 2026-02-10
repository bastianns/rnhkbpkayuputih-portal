'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; //
import { Search, UserCircle, MapPin, ChevronRight } from 'lucide-react';

export default function RecordsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchMembers() {
      // Mengambil data anggota dari tabel anggota
      const { data } = await supabase
        .from('anggota')
        .select('id_anggota, nama_lengkap, tanggal_lahir, wijk(nama_wijk)')
        .order('nama_lengkap', { ascending: true });
      if (data) setMembers(data);
    }
    fetchMembers();
  }, []);

  // Filter sederhana untuk demonstrasi search
  const filteredMembers = members.filter(m => 
    m.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">Master Records (SSOT)</h1>
          <p className="text-[#4e7397] text-base">Database terpusat anggota RNHKBP Kayu Putih yang telah tervalidasi.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari nama anggota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-[#4e7397]">
              <tr>
                <th className="px-8 py-5">Identitas Anggota</th>
                <th className="px-8 py-5">Wilayah (Wijk)</th>
                <th className="px-8 py-5">Status Validasi</th>
                <th className="px-8 py-5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => (
                <tr key={m.id_anggota} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <UserCircle size={20} />
                      </div>
                      <div className="flex flex-col">
                        <Link 
                          href={`/admin/records/${m.id_anggota}`} 
                          className="font-bold text-[#0e141b] hover:text-blue-600 transition-colors"
                        >
                          {m.nama_lengkap}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">UID: {m.id_anggota.split('-')[0]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm text-[#4e7397] font-bold">
                      <MapPin size={14} className="text-blue-400" />
                      {m.wijk?.nama_wijk || 'General'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-tighter">
                      Verified SSOT
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link 
                      href={`/admin/records/${m.id_anggota}`}
                      className="inline-flex items-center justify-center p-2 text-slate-300 group-hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic text-sm">
              Tidak ditemukan data anggota dengan nama "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}