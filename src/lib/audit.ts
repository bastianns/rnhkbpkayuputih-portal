import { supabase as browserSupabase } from './supabase';
import { createClient as createServerSupabase } from './supabaseServer';

export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string | null = null,
  oldData: any = null,
  newData: any = null,
  explicitActorId: string | null = null
) {
  try {
    let user;
    let client;

    // Tentukan client dan user berdasarkan environment
    if (typeof window === 'undefined') {
      client = await createServerSupabase();
      const { data } = await client.auth.getUser();
      user = data.user;
    } else {
      client = browserSupabase;
      const { data } = await client.auth.getUser();
      user = data.user;
    }

    const actor_id = explicitActorId || user?.id || null;

    await client.from('audit_log').insert({
      actor_id,
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