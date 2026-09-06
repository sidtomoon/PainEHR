import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client for background jobs (cron, webhooks) that run with no
// signed-in user session, so there's no auth.uid() for RLS to key off of.
// Never expose this client or the service-role key to the browser.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
