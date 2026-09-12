import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ClinicUser, UserRole } from '@/lib/types';

export const ADMIN_EMAILS = ['sidtomoon@gmail.com', 'drvarunsinglapgi@gmail.com'];
export const ADMIN_EMAIL = 'sidtomoon@gmail.com';

/**
 * Retrieves the currently authenticated clinic user with their resolved role.
 * Includes graceful fallback if migration 0008 hasn't been applied yet.
 */
export async function getCurrentUser(): Promise<ClinicUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email || '';
  const metadata = user.user_metadata || {};

  // 1. Try querying the user_roles table
  try {
    const { data: roleRow, error } = await supabase
      .from('user_roles')
      .select('role, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && roleRow) {
      return {
        id: user.id,
        email,
        role: roleRow.role as UserRole,
        displayName:
          roleRow.display_name ||
          metadata.display_name ||
          (roleRow.role === 'admin' ? 'Dr. Varun' : 'Clinic Staff'),
      };
    }
  } catch {
    // Migration 0008 may not have been run yet in Supabase
  }

  // 2. Fallback based on metadata or hardcoded admin email
  const isAdmin =
    ADMIN_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase()) ||
    metadata.role === 'admin';

  const role: UserRole = isAdmin ? 'admin' : 'data_entry';
  const displayName: string =
    metadata.display_name ||
    (isAdmin ? 'Dr. Varun Singla' : email.split('@')[0] || 'Data Entry Staff');

  return {
    id: user.id,
    email,
    role,
    displayName,
  };
}

/**
 * Guard for server components and actions: ensures the user is logged in.
 */
export async function requireAuth(): Promise<ClinicUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Guard for server components and actions: ensures the user has 'admin' privileges.
 */
export async function requireAdmin(): Promise<ClinicUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    redirect('/patients');
  }
  return user;
}
