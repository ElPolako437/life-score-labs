/**
 * Central Access Control for CALINESS Premium System
 * 
 * All premium checks in the app should use these functions.
 * Never scatter premium checks directly — always use hasPremiumAccess().
 */

export interface AccessProfile {
  is_premium?: boolean;
  premium_source?: string;
  premium_until?: string | null;
  role?: string;
}

const PREMIUM_SOURCES = ['stripe', 'manual', 'beta', 'founder', 'developer'];

/**
 * Central premium access check.
 * Returns true if the user has premium access through any valid source.
 */
export function hasPremiumAccess(profile: AccessProfile): boolean {
  // Direct premium flag
  if (profile.is_premium) return true;

  // Valid premium source
  if (profile.premium_source && PREMIUM_SOURCES.includes(profile.premium_source)) {
    // Check expiry if set
    if (profile.premium_until) {
      return new Date(profile.premium_until) > new Date();
    }
    return true;
  }

  // Admin always has access
  if (profile.role === 'admin') return true;

  return false;
}

/**
 * Check if user is an admin.
 */
export function isAdmin(profile: AccessProfile): boolean {
  return profile.role === 'admin';
}

/**
 * Check if user can access developer preview features.
 */
export function canDevPreview(profile: AccessProfile): boolean {
  return profile.role === 'admin' || profile.premium_source === 'developer';
}

/**
 * Get a human-readable label for the premium source.
 */
export function getPremiumSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    none: 'Kein Premium',
    stripe: 'CALINESS Premium · €39/Monat',
    manual: 'Manuell freigeschaltet',
    beta: 'Beta-Zugang',
    founder: 'Founder-Zugang',
    developer: 'Entwickler-Zugang',
  };
  return labels[source] || source;
}

/**
 * Get a human-readable label for the user role.
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    user: 'User',
    admin: 'Admin',
    tester: 'Tester',
    founding_member: 'Founding Member',
  };
  return labels[role] || role;
}
