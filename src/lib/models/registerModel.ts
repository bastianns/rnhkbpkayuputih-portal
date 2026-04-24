import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mengambil data referensi master untuk keperluan dropdown pendaftaran.
 * @param supabase Instance Supabase Client (Server/Browser)
 */
export async function getReferenceData(supabase: SupabaseClient) {
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
