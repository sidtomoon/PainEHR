'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

import { headers } from 'next/headers';

async function getOrigin(): Promise<string> {
  try {
    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') || headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // fallback
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://painehr.vercel.app';
}

export async function requestCode(_prevState: unknown, formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  if (!email) return { status: 'error' as const, message: 'Enter an email address.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    // If Supabase's default mailer fails (rate-limiting or SMTP error on free tier),
    // generate an admin magic link/OTP so testing is never blocked.
    try {
      const serviceClient = createServiceClient();
      const origin = await getOrigin();
      const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${origin}/auth/confirm` },
      });

      if (!linkError && linkData?.properties) {
        const directConfirmUrl = linkData.properties.hashed_token
          ? `/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=email`
          : linkData.properties.action_link;

        return {
          status: 'sent' as const,
          email,
          message: `Email sending failed via SMTP. Use code: ${linkData.properties.email_otp}`,
          actionLink: directConfirmUrl,
          emailOtp: linkData.properties.email_otp,
        };
      }
    } catch {
      // ignore
    }
    return { status: 'error' as const, message: error.message };
  }
  return { status: 'sent' as const, email, message: `Enter the code sent to ${email}.` };
}

export async function verifyCode(_prevState: unknown, formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const token = String(formData.get('token') || '').trim();
  if (!email || !token) return { status: 'error' as const, email, message: 'Enter the code from your email.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

  if (error) return { status: 'error' as const, email, message: error.message };
  redirect('/patients');
}

/**
 * 1-Click Login for Lead Doctor / Admin (sidtomoon@gmail.com)
 */
export async function devLogin() {
  const serviceClient = createServiceClient();
  const origin = await getOrigin();
  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'sidtomoon@gmail.com',
    options: { redirectTo: `${origin}/auth/confirm` },
  });

  if (error || !data?.properties) {
    throw new Error(error?.message || 'Failed to generate admin login link');
  }

  // Use relative internal token_hash redirect so it never redirects to localhost across devices
  if (data.properties.hashed_token) {
    redirect(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=email`);
  }

  redirect(data.properties.action_link);
}

/**
 * 1-Click Login for Data Entry Staff accounts (Operator 1, Operator 2)
 */
export async function devStaffLogin(staffNumber: number = 1) {
  const serviceClient = createServiceClient();
  const origin = await getOrigin();
  const staffEmail = `dataentry${staffNumber}@painehr.com`;
  const staffName = `Data Entry Staff ${staffNumber}`;

  // Ensure staff user is registered in Supabase auth
  try {
    await serviceClient.auth.admin.createUser({
      email: staffEmail,
      email_confirm: true,
      user_metadata: { role: 'data_entry', display_name: staffName },
    });
  } catch {
    // User already created
  }

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: staffEmail,
    options: { redirectTo: `${origin}/auth/confirm` },
  });

  if (error || !data?.properties) {
    throw new Error(error?.message || 'Failed to generate staff login link');
  }

  // Use relative internal token_hash redirect so it never redirects to localhost across devices
  if (data.properties.hashed_token) {
    redirect(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=email`);
  }

  redirect(data.properties.action_link);
}

/**
 * Standard Email & Password sign-in for staff or admin accounts
 */
export async function signInWithPassword(_prevState: unknown, formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();
  if (!email || !password) {
    return { status: 'error' as const, message: 'Both email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: 'error' as const, message: error.message };
  }

  redirect('/patients');
}

/**
 * Set or change password for currently logged-in user
 */
export async function updateUserPassword(_prevState: unknown, formData: FormData) {
  const newPassword = String(formData.get('password') || '').trim();
  if (!newPassword || newPassword.length < 6) {
    return { status: 'error' as const, message: 'Password must be at least 6 characters.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { status: 'error' as const, message: error.message };
  }
  return { status: 'success' as const, message: 'Password updated successfully!' };
}
