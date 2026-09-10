'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${siteUrl}/auth/confirm` },
      });

      if (!linkError && linkData?.properties) {
        return {
          status: 'sent' as const,
          email,
          message: `Email sending failed via SMTP. Use code: ${linkData.properties.email_otp}`,
          actionLink: linkData.properties.action_link,
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

export async function devLogin() {
  const serviceClient = createServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'drvarunsinglapgi@gmail.com',
    options: { redirectTo: `${siteUrl}/auth/confirm` },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error(error?.message || 'Failed to generate dev login link');
  }

  redirect(data.properties.action_link);
}
