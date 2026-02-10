'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Calendar, Tag, FileText, Loader2 } from 'lucide-react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEventModal({ isOpen, onClose, onSuccess }: AddEventModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    id_kategori_kegiatan: '',
    tanggal_mulai: ''
  });

  // Ambil kategori dari database saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      async function fetchCategories() {
        const { data } = await supabase
          .from('kategori_kegiatan')
          .select('*')
          .order('nama_kategori');
        if (data) setCategories(data);
      }
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Insert ke tabel 'kegiatan' sesuai skema SQL
    const { error } = await supabase
      .from('kegiatan')
      .insert([{
        nama_kegiatan: formData.nama_kegiatan,
        id_kategori_kegiatan: formData.id_kategori_kegiatan,
        tanggal_mulai: new Date(formData.tanggal_mulai).toISOString()
      }]);

    if (!error) {
      setFormData({ nama_kegiatan: '', id_kategori_kegiatan: '', tanggal_mulai: '' });
      onSuccess();
      onClose();
    } else {
      alert("Gagal menambah kegiatan: " + error.message);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 scale-in-center transition-all">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="text-left">
            <h2 className="text-lg font-black text-[#0e141b] uppercase tracking-tighter">Tambah Kegiatan</h2>
            <p className="text-[10px] font-bold text-[#4e7397] uppercase tracking-widest">Penjadwalan Baru</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Input Nama Kegiatan */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Nama Kegiatan
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Ibadah Minggu Raya"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#197fe6] focus:bg-white rounded-xl text-sm font-bold outline-none transition-all"
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({...formData, nama_kegiatan: e.target.value})}
              />
            </div>

            {/* Select Kategori */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} /> Kategori
              </label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#197fe6] focus:bg-white rounded-xl text-sm font-bold outline-none transition-all appearance-none"
                value={formData.id_kategori_kegiatan}
                onChange={(e) => setFormData({...formData, id_kategori_kegiatan: e.target.value})}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id_kategori_kegiatan} value={cat.id_kategori_kegiatan}>
                    {cat.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Tanggal & Waktu */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Waktu Mulai
              </label>
              <input
                required
                type="datetime-local"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#197fe6] focus:bg-white rounded-xl text-sm font-bold outline-none transition-all"
                value={formData.tanggal_mulai}
                onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#197fe6] hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Simpan Kegiatan'}
          </button>
        </form>
      </div>
    </div>
  );
}