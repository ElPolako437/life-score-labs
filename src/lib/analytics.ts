// Fire-and-forget analytics — localStorage only (no backend tables needed)
export async function track(event: string, properties?: Record<string, unknown>) {
  try {
    const logs = JSON.parse(localStorage.getItem('reset_analytics') || '[]');
    logs.push({ event, properties: properties ?? {}, ts: Date.now() });
    localStorage.setItem('reset_analytics', JSON.stringify(logs.slice(-200)));
  } catch {
    // analytics must never crash the app
  }
}

export async function captureLead(email: string, name?: string | null) {
  if (!email.trim()) return;
  try {
    const leads = JSON.parse(localStorage.getItem('reset_leads') || '[]');
    leads.push({ email: email.trim().toLowerCase(), name: name?.trim() || null, ts: Date.now() });
    localStorage.setItem('reset_leads', JSON.stringify(leads.slice(-50)));
  } catch {
    // fail silently
  }
}
