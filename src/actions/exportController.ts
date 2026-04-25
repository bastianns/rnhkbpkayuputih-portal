"use server";

import { fetchComprehensiveLeaderboard } from "./leaderboardController";

/**
 * Menghasilkan data untuk ekspor Excel dari Leaderboard Wijk.
 */
export async function generateLeaderboardExcelData() {
  try {
    const data = await fetchComprehensiveLeaderboard();
    
    if (!data || data.length === 0) {
      throw new Error("Tidak ada data untuk diekspor.");
    }

    // Format data untuk Excel agar rapi
    const formattedData = data.map((item: any, index: number) => ({
      "Peringkat": index + 1,
      "Nama Wilayah (Wijk)": item.nama_wijk,
      "Total Poin Wilayah": item.total_poin_wilayah,
      "Indeks Keaktifan": item.indeks_keaktifan,
      "Jumlah Anggota Berkontribusi": item.jumlah_anggota,
      "Status Wilayah": item.indeks_keaktifan >= 0.7 ? "Sangat Aktif" : (item.indeks_keaktifan >= 0.4 ? "Aktif" : "Perlu Perhatian")
    }));

    return { success: true, data: formattedData };
  } catch (error: any) {
    console.error("Excel Export Error:", error.message);
    return { success: false, error: error.message };
  }
}
