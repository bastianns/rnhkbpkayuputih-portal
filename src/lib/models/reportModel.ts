import { createClient } from '@/lib/supabaseServer';

export async function getVerifiedAnggotaCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("anggota")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true);
  
  if (error) throw error;
  return count || 0;
}

export async function getPendingQuarantineCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("quarantine_anggota")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw error;
  return count || 0;
}

export async function getWijkDistributionData() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wijk")
    .select(`
      nama_wijk,
      anggota:anggota(count)
    `);

  if (error) throw error;
  return data;
}
