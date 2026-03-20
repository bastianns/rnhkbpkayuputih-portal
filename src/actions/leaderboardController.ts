"use server";

import { getGlobalLeaderboardData } from "@/lib/models/leaderboardModel";

export async function fetchComprehensiveLeaderboard() {
  try {
    // Memanggil fungsi dari Model
    const leaderboardData = await getGlobalLeaderboardData();
    
    return leaderboardData;
  } catch (error) {
    console.error("Gagal menyusun leaderboard:", error);
    throw new Error("Gagal memuat data leaderboard wilayah");
  }
}