'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requestCode(_prevState: unknown, formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  if (!email) return { status: 'error' as const, message: 'Enter an email address.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) return { status: 'error' as const, message: error.message };
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
