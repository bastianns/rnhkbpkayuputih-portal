import { createClient } from '@/lib/supabaseServer';

export async function getGlobalLeaderboardData() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('view_global_wijk_leaderboard')
    .select('*')
    .order('total_poin_wilayah', { ascending: false });
  
  if (error) throw error;
  return data || [];
}
