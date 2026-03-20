"use server";

import { getVerifiedMembers, logExportAction } from '@/lib/models/recordsModel';

// Fungsi 1: Mengambil data untuk tabel UI
export async function fetchMasterRecords() {
  try {
    return await getVerifiedMembers();
  } catch (error) {
    console.error("Gagal memuat Master Records:", error);
    throw new Error("Gagal mengambil data dari SSOT");
  }
}

// Fungsi 2: Menghasilkan data CSV dan mencatat ke log (Fungsi Ekspor)
export async function generateExportPackage(filteredData: any[]) {
  try {
    if (!filteredData || filteredData.length === 0) {
      return { success: false, error: "Tidak ada data untuk diekspor." };
    }

    // A. Menyusun Header CSV
    const headers = [
      'ID Anggota', 'Nama Lengkap', 'Tanggal Lahir', 'Email', 
      'No Telp', 'Status', 'Wilayah (Wijk)', 'Kode Wijk', 'Integritas'
    ];
    
    // B. Memetakan baris data
    const rows = filteredData.map(record => [
      record.id_anggota,
      `"${record.nama_lengkap}"`, // Kutip ganda mencegah error jika ada koma di nama
      record.tanggal_lahir,
      record.email || '-',
      record.no_telp ? `'${record.no_telp}` : '-', // Kutip tunggal agar Excel tidak mengubah nomor HP jadi rumus matematika
      record.status_keanggotaan || '-',
      `"${record.wijk?.nama_wijk || 'Belum Terklasifikasi'}"`,
      record.wijk?.kode_wijk || '-',
      'VERIFIED_SSOT'
    ]);

    // C. Menggabungkan Header dan Baris menjadi string CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // D. Catat aktivitas ekspor ke Audit Log
    await logExportAction(filteredData.length);

    // E. Kembalikan string CSV ke Client (View)
    return { success: true, csvData: csvContent };

  } catch (error) {
    console.error("Gagal menghasilkan paket ekspor:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat dokumen ekspor." };
  }
}