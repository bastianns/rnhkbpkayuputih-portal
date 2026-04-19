'use client';

import { useState, useEffect, useRef } from 'react';
import { createNewEvent } from '@/actions/eventController';
import { X, Calendar, Tag, FileText, Loader2, Plus, Check, Undo2 } from 'lucide-react';
import { animate, spring } from 'animejs';
import { useCategoryManager } from '@/hooks/useCategoryManager';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefixCls?: string;
}

export default function AddEventModal({ isOpen, onClose, onSuccess, prefixCls = 'rc-modal' }: AddEventModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    id_kategori_kegiatan: '',
    tanggal_mulai: ''
  });

  const {
    categories, isAddingNewCat, setIsAddingNewCat, newCategoryName,
    setNewCategoryName, creatingCat, fetchCategories, handleQuickAddCategory
  } = useCategoryManager();

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      
      if (overlayRef.current) {
        animate(overlayRef.current, { opacity: [0, 1], duration: 400, ease: 'outExpo' });
      }

      const timer = setTimeout(() => {
        if (modalRef.current) {
          animate(modalRef.current, {
            opacity: [0, 1],
            scale: [0.75, 1],
            y: [30, 0],
            duration: 800,
            ease: spring({ bounce: 0.55 })
          });
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.4 })
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await createNewEvent(formData);
    
    if (result.success) {
      setFormData({ nama_kegiatan: '', id_kategori_kegiatan: '', tanggal_mulai: '' });
      onSuccess();
      handleClose();
    } else {
      alert("Gagal menambah kegiatan: " + result.error);
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      animate(modalRef.current, { scale: 0.9, opacity: 0, duration: 200, ease: 'inExpo' });
      animate(overlayRef.current, { opacity: 0, duration: 300, ease: 'inExpo', onComplete: onClose });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      style={{ opacity: 0 }}
      className={`${prefixCls}-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#051122]/80 backdrop-blur-md font-sans`}
    >
      <div 
        ref={modalRef}
        style={{ opacity: 0, transform: 'scale(0.75)' }}
        className={`${prefixCls}-content bg-[#0a192f]/70 backdrop-blur-2xl w-full max-w-md rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden border border-[#C5A059]/30`}
      >
        <div className={`${prefixCls}-header p-8 border-b border-[#C5A059]/10 flex justify-between items-center bg-white/5`}>
          <div className="text-left">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Tambah Kegiatan</h2>
            <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-[0.2em] mt-1">Penjadwalan Operasional Baru</p>
          </div>
          <button onClick={handleClose} className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`${prefixCls}-body p-8 space-y-6 relative z-10`}>
          <div className="space-y-5">
            <div className="space-y-2 text-left">
              <label className={`${prefixCls}-label text-[9px] font-black text-[#C5A059] uppercase tracking-widest flex items-center gap-2`}>
                <FileText size={14} className="text-white/30" /> Nama Kegiatan
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Ibadah Pemuda"
                className="w-full px-4 py-4 bg-[#051122]/50 border border-[#C5A059]/20 focus:border-[#C5A059] rounded-xl text-sm font-bold text-white outline-none transition-all placeholder:text-white/20 shadow-inner"
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({...formData, nama_kegiatan: e.target.value})}
              />
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <label className={`${prefixCls}-label text-[9px] font-black text-[#C5A059] uppercase tracking-widest flex items-center gap-2`}>
                  <Tag size={14} className="text-white/30" /> Kategori
                </label>
                {!isAddingNewCat ? (
                  <button type="button" onClick={() => setIsAddingNewCat(true)} className="text-[9px] font-bold text-[#C5A059] hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
                    <Plus size={12} /> Buat Baru
                  </button>
                ) : (
                   <button type="button" onClick={() => setIsAddingNewCat(false)} className="text-[9px] font-bold text-white/40 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
                    <Undo2 size={12} /> Batal
                  </button>
                )}
              </div>

              {isAddingNewCat ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nama Kategori Baru..."
                    className="flex-1 px-4 py-4 bg-[#C5A059]/10 border border-[#C5A059]/40 focus:border-[#C5A059] rounded-xl text-sm font-bold text-[#C5A059] outline-none transition-all placeholder:text-[#C5A059]/40 shadow-inner"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickAddCategory((id) => setFormData({ ...formData, id_kategori_kegiatan: id }))}
                    disabled={creatingCat || !newCategoryName}
                    onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                    onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                    className="px-5 bg-[#C5A059] text-[#051122] rounded-xl hover:bg-[#d4b46a] transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-[#C5A059]/20"
                  >
                    {creatingCat ? <Loader2 className="animate-spin" size={18}/> : <Check size={20} />}
                  </button>
                </div>
              ) : (
                <select
                  required
                  className="w-full px-4 py-4 bg-[#051122]/50 border border-[#C5A059]/20 focus:border-[#C5A059] rounded-xl text-sm font-bold text-white outline-none transition-all appearance-none shadow-inner"
                  value={formData.id_kategori_kegiatan}
                  onChange={(e) => setFormData({...formData, id_kategori_kegiatan: e.target.value})}
                >
                  <option value="" disabled hidden className="bg-[#051122] text-white/50">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id_kategori_kegiatan} value={cat.id_kategori_kegiatan} className="bg-[#051122]">
                      {cat.nama_kategori}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2 text-left">
              <label className={`${prefixCls}-label text-[9px] font-black text-[#C5A059] uppercase tracking-widest flex items-center gap-2`}>
                <Calendar size={14} className="text-white/30" /> Waktu Mulai
              </label>
              <input
                required
                type="datetime-local"
                className="w-full px-4 py-4 bg-[#051122]/50 border border-[#C5A059]/20 focus:border-[#C5A059] rounded-xl text-sm font-bold text-white outline-none transition-all [color-scheme:dark] shadow-inner"
                value={formData.tanggal_mulai}
                onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isAddingNewCat}
            onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
            onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
            className="w-full bg-[#C5A059] text-[#051122] py-4 mt-6 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-[#C5A059]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d4b46a]"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Simpan ke SSOT'}
          </button>
        </form>
      </div>
    </div>
  );
}
