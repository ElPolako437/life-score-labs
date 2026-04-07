import { supabase } from '@/integrations/supabase/client';

// Fire-and-forget — never throws, never blocks the UI
export async function track(event: string, properties?: Record<string, unknown>) {
  try {
    await supabase.from('reset_events').insert({
      event,
      properties: properties ?? {},
    });
  } catch {
    // analytics must never crash the app
  }
}

export async function captureLead(email: string, name?: string | null) {
  if (!email.trim()) return;
  try {
    await supabase.from('reset_leads').insert({
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
    });
  } catch {
    // fail silently
  }
}
