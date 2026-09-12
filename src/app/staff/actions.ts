'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-roles';
import { createServiceClient } from '@/lib/supabase/service';
import type { UserRole } from '@/lib/types';

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function createStaffMember(formData: FormData) {
  const admin = await requireAdmin();

  const name = str(formData, 'name');
  const email = str(formData, 'email');
  const password = str(formData, 'password');
  const role = (str(formData, 'role') || 'data_entry') as UserRole;

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const serviceClient = createServiceClient();

  // Create user in Supabase Auth
  const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      display_name: name || email.split('@')[0],
      created_by_admin: admin.email,
    },
  });

  if (createError) {
    throw new Error(createError.message);
  }

  if (userData?.user) {
    // Record in user_roles table if migration 0008 exists
    try {
      await serviceClient.from('user_roles').upsert({
        user_id: userData.user.id,
        email,
        role,
        display_name: name || email.split('@')[0],
      });
    } catch {
      // Graceful fallback if table is pending in Supabase cloud
    }
  }

  revalidatePath('/staff');
}

export async function deleteStaffMember(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    throw new Error('Cannot delete your own admin account.');
  }

  const serviceClient = createServiceClient();

  // Delete from Auth
  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);
  if (authError) {
    throw new Error(authError.message);
  }

  // Delete from user_roles
  try {
    await serviceClient.from('user_roles').delete().eq('user_id', userId);
  } catch {
    // ignore
  }

  revalidatePath('/staff');
}
