"use server";

import { createClient } from '@/lib/supabaseServer';
import { 
  getEventsList, getCategoriesList, getEventAndAttendance, 
  insertCategory, insertEventData, updateEventStatus, logAuditData 
} from '@/lib/models/eventModel';

export async function fetchAllEvents() {
  try { return await getEventsList(); } 
  catch (error) { console.error(error); return []; }
}

export async function fetchAllCategories() {
  try { return await getCategoriesList(); } 
  catch (error) { console.error(error); return []; }
}

export async function fetchMonitorData(eventId: string) {
  try { return await getEventAndAttendance(eventId); } 
  catch (error) { console.error(error); throw new Error("Gagal memuat data monitor"); }
}

export async function toggleGateStatus(eventId: string, currentStatus: boolean) {
  try {
    await updateEventStatus(eventId, !currentStatus);
    return { success: true, newStatus: !currentStatus };
  } catch (error) { return { success: false, error: "Gagal mengubah status gerbang." }; }
}

export async function createQuickCategory(namaKategori: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const newCat = await insertCategory(namaKategori);
    
    // Log Audit Otomatis
    await logAuditData(user?.id || null, 'INSERT_MASTER_DATA', 'kategori_kegiatan', newCat.id_kategori_kegiatan, { nama_kategori: newCat.nama_kategori, source: 'Quick Add from Modal' });
    
    return { success: true, category: newCat };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createNewEvent(formData: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      nama_kegiatan: formData.nama_kegiatan,
      id_kategori_kegiatan: formData.id_kategori_kegiatan,
      tanggal_mulai: new Date(formData.tanggal_mulai).toISOString()
    };
    
    const newEvent = await insertEventData(payload);
    
    // Log Audit Otomatis
    await logAuditData(user?.id || null, 'INSERT_EVENT', 'kegiatan', newEvent.id_kegiatan, { nama_kegiatan: newEvent.nama_kegiatan, waktu: newEvent.tanggal_mulai });
    
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}
