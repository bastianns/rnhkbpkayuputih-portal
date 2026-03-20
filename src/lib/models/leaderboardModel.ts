import { supabase } from "@/lib/supabase";

export async function getGlobalLeaderboardData() {
  const { data, error } = await supabase
    .from('view_global_wijk_leaderboard')
    .select('*')
    .order('total_poin_wilayah', { ascending: false });
  
  if (error) throw error;
  return data || [];
}