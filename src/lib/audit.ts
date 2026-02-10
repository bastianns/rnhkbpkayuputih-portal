import { supabase } from './supabase';

export async function createAuditLog(
  action: string,   // Contoh: 'INSERT', 'UPDATE_STATUS'
  entity: string,   // Contoh: 'kegiatan', 'wijk'
  entityId: string | null = null,
  oldData: any = null,
  newData: any = null
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Memasukkan data sesuai skema database asli Anda
    await supabase.from('audit_log').insert({
      actor_id: user?.id || null,
      action,
      entity,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}