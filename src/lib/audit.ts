import { supabase as browserSupabase } from './supabase';

/**
 * Audit Log untuk sisi Client (Browser).
 * Menggunakan browser client untuk mencatat aktivitas.
 */
export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string | null = null,
  oldData: any = null,
  newData: any = null,
  explicitActorId: string | null = null
) {
  try {
    const { data } = await browserSupabase.auth.getUser();
    const user = data.user;
    const actor_id = explicitActorId || user?.id || null;

    await browserSupabase.from('audit_log').insert({
      actor_id,
      action,
      entity,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData
    });
  } catch (err) {
    console.error('Client Audit Log Error:', err);
  }
}

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
  // Impor dinamis untuk mencegah next/headers bocor ke client bundle
  const { createClient } = await import('./supabaseServer');
  
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
