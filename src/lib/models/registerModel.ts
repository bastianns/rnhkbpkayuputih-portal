import { supabase } from '@/lib/supabase';

export async function getReferenceData() {
  const [wRes, sRes, oRes] = await Promise.all([
    supabase.from('wijk').select('*').order('nama_wijk'),
    supabase.from('ref_keahlian').select('*').order('nama_keahlian'),
    supabase.from('ref_kategori_kesibukan').select('*').order('nama_kategori')
  ]);
  
  return {
    wijks: wRes.data || [],
    skills: sRes.data || [],
    occupations: oRes.data || []
  };
}

export async function insertQuarantineData(rawData: any, authId: string | undefined) {
  // ✅ MEMANGGIL FELLEGI-SUNTER ENGINE VIA RPC
  // Payload otomatis di-cast menjadi JSONB oleh Supabase
  const { data, error } = await supabase.rpc('fn_portal_register_anggota', {
    p_raw_data: { ...rawData, id_auth: authId }
  });
  
  if (error) {
    console.error('Database Error (Fellegi-Sunter Engine):', error.message);
    throw error;
  }

  return data; // Mengembalikan UUID dari record karantina
}