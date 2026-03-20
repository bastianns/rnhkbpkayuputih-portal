"use server";

import { supabase } from '@/lib/supabase';
import { 
  getPendingQuarantine, getAllWijk, 
  approveQuarantineMember, rejectQuarantineMember, logQueueResolution 
} from '@/lib/models/queueModel';

export async function fetchVettingQueue() {
  try {
    const [items, wijkList] = await Promise.all([
      getPendingQuarantine(),
      getAllWijk()
    ]);
    return { items, wijkList };
  } catch (error) {
    console.error("Gagal memuat antrean:", error);
    return { items: [], wijkList: [] };
  }
}

export async function resolveQuarantineAction(id: string, action: 'approve' | 'reject', itemData?: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (action === 'approve') {
      if (!itemData) throw new Error("Data anggota diperlukan untuk approval.");
      await approveQuarantineMember(itemData);
    } else {
      await rejectQuarantineMember(id);
    }

    // Catat ke Audit Log
    await logQueueResolution(user?.id, action, id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}