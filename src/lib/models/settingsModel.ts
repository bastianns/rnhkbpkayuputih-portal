import { createClient } from '@/lib/supabaseServer';

// --- ENGINE PARAMETERS ---
export async function fetchParameters() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dedup_parameter')
    .select('*')
    .order('field_name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateParameter(fieldName: string, m: number, u: number, wa: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('dedup_parameter')
    .update({ 
      match_probability_m: m, 
      unmatch_probability_u: u,
      agreement_weight_wa: wa // Sesuai Post-condition UC 
    })
    .eq('field_name', fieldName);
  if (error) throw error;
}

// --- MASTER DICTIONARY ---
export async function fetchMasterTable(table: string, orderCol: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select('*').order(orderCol, { ascending: true });
  if (error) throw error;
  return data;
}

export async function insertMasterRow(table: string, payload: any) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
}

export async function deleteMasterRow(table: string, idCol: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq(idCol, id);
  if (error) throw error;
}
