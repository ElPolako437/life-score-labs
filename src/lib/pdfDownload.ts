// ═══════════════════════════════════════════════════════════════════════════
// SAFE PDF DOWNLOAD UTILITY – CALINESS ACADEMY
// Ensures downloads never redirect to Lovable/editor URLs
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from "@/integrations/supabase/client";

// Map of friendly keys to file identifiers used by the edge function
export const PDF_FILE_KEYS = {
  foundation: "grundlagen-guide",
  awakening: "prioritaeten-framework",
  mastery: "gespraech-onepager",
  longevity: "longevity-framework",
} as const;

export type PdfFileKey = keyof typeof PDF_FILE_KEYS;

// Direct public paths (for opening in new tab - print to PDF)
export const PDF_DIRECT_PATHS = {
  foundation: "/pdfs/caliness-grundlagen-guide.html",
  awakening: "/pdfs/caliness-prioritaeten-framework.html",
  mastery: "/pdfs/caliness-gespraech-onepager.html",
  longevity: "/pdfs/caliness-longevity-framework.html",
} as const;

/**
 * Validates that a URL is safe (not pointing to Lovable editor/preview)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block any Lovable-related domains
    const blockedPatterns = [
      'lovable.dev',
      'lovable.app',
      'lovableproject.com',
      'gptengineer.app',
    ];
    
    return !blockedPatterns.some(pattern => hostname.includes(pattern));
  } catch {
    // Relative URLs are safe
    return true;
  }
}

/**
 * Opens a PDF in a new tab for viewing/printing
 * Uses relative paths to avoid Lovable redirects
 */
export function openPdfForPrinting(pdfKey: PdfFileKey): boolean {
  const path = PDF_DIRECT_PATHS[pdfKey];
  if (!path) {
    console.error(`Unknown PDF key: ${pdfKey}`);
    return false;
  }

  // Always use relative path - works on any domain
  const url = path;
  
  // Validate current origin is safe
  if (!isSafeUrl(window.location.origin)) {
    console.error("Blocked: Current origin appears to be Lovable editor");
    return false;
  }

  try {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      console.warn("Popup blocked - falling back to location change");
      window.location.href = url;
    }
    return true;
  } catch (error) {
    console.error("Failed to open PDF:", error);
    return false;
  }
}

/**
 * Triggers a download via the edge function (forces attachment download)
 */
export async function downloadPdfViaEdge(pdfKey: PdfFileKey): Promise<boolean> {
  const fileKey = PDF_FILE_KEYS[pdfKey];
  if (!fileKey) {
    console.error(`Unknown PDF key: ${pdfKey}`);
    return false;
  }

  try {
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('download-pdf', {
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // The edge function returns the file directly, so we need a different approach
    // We'll use a direct URL to the edge function instead
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const downloadUrl = `${supabaseUrl}/functions/v1/download-pdf?file=${fileKey}`;
    
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
}

/**
 * Gets the direct relative URL for a PDF (safest option)
 */
export function getPdfUrl(pdfKey: PdfFileKey): string {
  return PDF_DIRECT_PATHS[pdfKey] || PDF_DIRECT_PATHS.foundation;
}

/**
 * Gets the absolute URL for a PDF (for emails)
 * Only call this when you need an absolute URL (e.g., in emails)
 */
export function getAbsolutePdfUrl(pdfKey: PdfFileKey, baseUrl?: string): string {
  const path = PDF_DIRECT_PATHS[pdfKey];
  const base = baseUrl || window.location.origin;
  
  // Validate base URL is safe
  if (!isSafeUrl(base)) {
    console.error("Blocked: Base URL appears to be Lovable domain");
    return path; // Return relative path as fallback
  }
  
  return `${base}${path}`;
}
