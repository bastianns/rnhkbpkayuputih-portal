'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter,
  ChevronRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import AddEventModal from './AddEventModal';

export default function EventsAttendancePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dibuat useCallback agar bisa dipanggil ulang setelah penambahan data
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kegiatan')
      .select(`
        *,
        kategori_kegiatan (
          nama_kategori
        )
      `)
      .order('tanggal_mulai', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter(event => 
    event.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen font-sans text-left">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">Events & Attendance</h1>
          <p className="text-[#4e7397] font-medium">Manajemen partisipasi jemaat dan riwayat kegiatan RNHKBP Kayu Putih.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#197fe6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          Tambah Kegiatan
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EventStat 
          icon={<Calendar className="text-blue-600" />} 
          label="Kegiatan Mendatang" 
          value={events.filter(e => new Date(e.tanggal_mulai) > new Date()).length} 
        />
        <EventStat 
          icon={<Users className="text-green-600" />} 
          label="Total Database" 
          value={events.length} 
        />
        <EventStat 
          icon={<CheckCircle2 className="text-amber-600" />} 
          label="Integritas" 
          value="Verified" 
        />
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama kegiatan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#4e7397] hover:bg-slate-50 transition-all border-b-2 active:translate-y-[1px]">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Tabel Utama */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 italic font-medium">Sinkronisasi data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-[#4e7397] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Nama Kegiatan & Kategori</th>
                  <th className="px-6 py-4">Waktu Pelaksanaan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">Tidak ada data.</td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id_kegiatan} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-sm text-[#0e141b] group-hover:text-[#197fe6] transition-colors">{event.nama_kegiatan}</span>
                          <span className="text-[10px] font-black text-[#197fe6] uppercase tracking-tighter">{event.kategori_kegiatan?.nama_kategori || 'Umum'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#4e7397] font-medium">
                          <Clock size={14} className="text-slate-300" />
                          {new Date(event.tanggal_mulai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${new Date(event.tanggal_mulai) > new Date() ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          {new Date(event.tanggal_mulai) > new Date() ? 'Upcoming' : 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/events/${event.id_kegiatan}/attendance`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#197fe6] hover:underline bg-blue-50/0 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Buka Absensi <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Kegiatan */}
      <AddEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchEvents} 
      />
    </div>
  );
}

function EventStat({ icon, label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md border-b-4 border-b-transparent hover:border-b-[#197fe6]">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <div className="text-left">
        <p className="text-[10px] font-black text-[#4e7397] uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-[#0e141b] leading-tight tracking-tight">{value}</p>
      </div>
    </div>
  );
}