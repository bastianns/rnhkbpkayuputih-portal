"use server";

import { 
  getVerifiedAnggotaCount, 
  getPendingQuarantineCount, 
  getWijkDistributionData 
} from "@/lib/models/reportModel";

export async function fetchAggregatedReportStats() {
  try {
    // 1. Ambil data mentah dari Model
    const uniqueCount = await getVerifiedAnggotaCount();
    const quarantineCount = await getPendingQuarantineCount();
    const wijkData = await getWijkDistributionData();

    // 2. Kalkulasi Logika Bisnis (Akurasi & Total)
    const totalAttempts = uniqueCount + quarantineCount;
    const accuracyRate = totalAttempts > 0
      ? ((uniqueCount / totalAttempts) * 100).toFixed(1)
      : "100";

    // 3. Format Data untuk Grafik (Recharts)
    const formattedWijk = wijkData?.map((w: any) => ({
      name: w.nama_wijk,
      total: w.anggota[0]?.count || 0,
    })) || [];

    // 4. Return data yang sudah "matang" ke View
    return {
      totalUnique: uniqueCount,
      totalPendingVetting: quarantineCount,
      dynamicAccuracy: accuracyRate,
      wijkDistribution: formattedWijk,
      matchQuality: [
        { name: "Verified (Clean)", value: uniqueCount },
        { name: "Pending Review", value: quarantineCount },
      ],
    };
  } catch (error) {
    console.error("Gagal mengagregasi analitik:", error);
    throw new Error("Gagal memuat data laporan");
  }
}