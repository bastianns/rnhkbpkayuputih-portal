"use server";

import { createClient } from '@/lib/supabaseServer';
import { getMemberDashboardData, processCheckinTransaction, getMemberHistoryByEmail } from '@/lib/models/dashboardModel';

export async function initializeDashboard() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return { success: false, error: "Sesi tidak valid" };

    const data = await getMemberDashboardData(user.email, user.id);
    return { success: true, ...data, authId: user.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitDashboardCheckin(memberId: string, eventId: string, roleId: string, authId: string) {
  try {
    await processCheckinTransaction(memberId, eventId, roleId, authId);
    return { success: true, message: 'Kehadiran berhasil dicatat!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function fetchMemberHistory() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return { success: false, error: "Sesi tidak valid" };

    const data = await getMemberHistoryByEmail(user.email);
    return { success: true, member: data.member, history: data.history };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
