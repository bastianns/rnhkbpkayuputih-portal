"use server";

import { fetchParameters, updateParameter, fetchMasterTable, insertMasterRow, deleteMasterRow } from '@/lib/models/settingsModel';

export async function getEngineSettings() {
  try { return await fetchParameters(); } 
  catch (error) { throw new Error("Gagal memuat parameter"); }
}

export async function saveEngineSettings(parameters: any[]) {
  try {
    for (const param of parameters) {
      // 1. Logika Inti Fellegi-Sunter [cite: 58]
      if (param.match_probability_m <= param.unmatch_probability_u) {
        return { 
          success: false, 
          error: `Logika Ditolak pada ${param.field_name}: Nilai (m) harus lebih besar dari (u).` 
        };
      }

      // 2. Kalkulasi Agreement Weight (wa) via Logaritma Natural 
      // Rumus: wa = ln(m/u)
      const wa = Math.log(param.match_probability_m / param.unmatch_probability_u);

      // 3. Simpan ke Model
      await updateParameter(
        param.field_name, 
        param.match_probability_m, 
        param.unmatch_probability_u,
        wa
      );
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan parameter" };
  }
}

export async function getMasterDictionary(tab: string) {
  const tableMap: any = { wijk: 'wijk', kegiatan: 'kategori_kegiatan', peran: 'katalog_peran', keahlian: 'ref_keahlian', kesibukan: 'ref_kategori_kesibukan' };
  const orderMap: any = { wijk: 'nama_wijk', kegiatan: 'nama_kategori', peran: 'nama_peran', keahlian: 'nama_keahlian', kesibukan: 'nama_kategori' };
  return await fetchMasterTable(tableMap[tab], orderMap[tab] || 'created_at');
}

export async function addMasterDictionary(tab: string, name: string, weight: number) {
  if (!name) return { success: false, error: "Nama tidak boleh kosong" };
  
  let payload: any = {};
  let table = '';
  switch(tab) {
    case 'wijk': table = 'wijk'; payload = { nama_wijk: name }; break;
    case 'kegiatan': table = 'kategori_kegiatan'; payload = { nama_kategori: name, bobot_dasar: weight }; break;
    case 'peran': table = 'katalog_peran'; payload = { nama_peran: name, bobot_kontribusi: weight }; break;
    case 'keahlian': table = 'ref_keahlian'; payload = { nama_keahlian: name, bobot_keahlian: weight }; break;
    case 'kesibukan': table = 'ref_kategori_kesibukan'; payload = { nama_kategori: name, bobot_kesibukan: weight }; break;
    default: return { success: false, error: "Tab tidak valid" };
  }

  try {
    await insertMasterRow(table, payload);
    return { success: true };
  } catch (error) { return { success: false, error: "Gagal menambah data referensi" }; }
}

export async function removeMasterDictionary(tab: string, id: string) {
  const tableMap: any = { wijk: 'wijk', kegiatan: 'kategori_kegiatan', peran: 'katalog_peran', keahlian: 'ref_keahlian', kesibukan: 'ref_kategori_kesibukan' };
  const idMap: any = { wijk: 'id_wijk', kegiatan: 'id_kategori_kegiatan', peran: 'id_peran', keahlian: 'id_keahlian', kesibukan: 'id_kategori_kesibukan' };
  
  try {
    await deleteMasterRow(tableMap[tab], idMap[tab], id);
    return { success: true };
  } catch (error) { return { success: false, error: "Data sedang digunakan, tidak bisa dihapus." }; }
}