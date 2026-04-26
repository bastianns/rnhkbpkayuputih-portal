import { createClient } from './supabaseServer';

/**
 * Audit Log untuk sisi Server (Server Actions / Server Components).
 * Fungsi ini harus dipanggil di lingkungan server saja.
 */
export async function createServerAuditLog(
  action: string,
  entity: string,
  entityId: string | null = null,
  oldData: any = null,
  newData: any = null,
  explicitActorId: string | null = null
) {
  try {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    const user = data.user;
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
    console.error('Server Audit Log Error:', err);
  }
}
