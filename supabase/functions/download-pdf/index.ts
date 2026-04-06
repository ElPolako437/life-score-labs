// ═══════════════════════════════════════════════════════════════════════════
// SECURE PDF DOWNLOAD ENDPOINT – CALINESS ACADEMY
// Forces browser download with proper Content-Disposition headers
// No Lovable login, no redirects, pure file delivery
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Whitelisted PDF files (filename -> actual path in public folder)
const ALLOWED_FILES: Record<string, { path: string; displayName: string }> = {
  "grundlagen-guide": {
    path: "/pdfs/caliness-grundlagen-guide.html",
    displayName: "CALINESS-Grundlagen-Guide.html",
  },
  "prioritaeten-framework": {
    path: "/pdfs/caliness-prioritaeten-framework.html",
    displayName: "CALINESS-Prioritaeten-Framework.html",
  },
  "gespraech-onepager": {
    path: "/pdfs/caliness-gespraech-onepager.html",
    displayName: "CALINESS-Das-Gespraech.html",
  },
  "longevity-framework": {
    path: "/pdfs/caliness-longevity-framework.html",
    displayName: "CALINESS-Longevity-Framework.html",
  },
};

// Blocked domains that must NEVER be used
const BLOCKED_DOMAINS = [
  'lovable.dev',
  'lovable.app', 
  'lovableproject.com',
  'gptengineer.app',
  'localhost',
  '127.0.0.1',
];

function isBlockedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked));
  } catch {
    return url.split('/').some(part => BLOCKED_DOMAINS.some(blocked => part.includes(blocked)));
  }
}

function getPublicBaseUrl(req: Request): string {
  // PRIORITY 1: Always prefer the configured PUBLIC_BASE_URL secret
  const env = Deno.env.get("PUBLIC_BASE_URL");
  if (env && !isBlockedDomain(env)) {
    console.log(`Using PUBLIC_BASE_URL: ${env}`);
    return env;
  }

  // PRIORITY 2: Check Origin header (but BLOCK lovable.* domains)
  const origin = req.headers.get("origin");
  if (origin && !isBlockedDomain(origin)) {
    console.log(`Using Origin header: ${origin}`);
    return origin;
  }

  // PRIORITY 3: Check Referer header (but BLOCK lovable.* domains)
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isBlockedDomain(refOrigin)) {
        console.log(`Using Referer header: ${refOrigin}`);
        return refOrigin;
      }
    } catch {
      // ignore
    }
  }

  // PRIORITY 4: Forwarded host headers (but BLOCK lovable.* domains)
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && !BLOCKED_DOMAINS.some(blocked => host.includes(blocked))) {
    const constructedUrl = `${proto}://${host}`;
    console.log(`Using forwarded host: ${constructedUrl}`);
    return constructedUrl;
  }

  console.error("CRITICAL: No safe base URL found! Set PUBLIC_BASE_URL secret!");
  return "";
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileKey = url.searchParams.get("file");

    // Validate file parameter
    if (!fileKey) {
      return new Response(
        JSON.stringify({ 
          error: "Missing file parameter",
          available: Object.keys(ALLOWED_FILES),
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if file is whitelisted
    const fileConfig = ALLOWED_FILES[fileKey];
    if (!fileConfig) {
      return new Response(
        JSON.stringify({ 
          error: "File not found",
          available: Object.keys(ALLOWED_FILES),
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get the base URL for fetching the file
    const baseUrl = getPublicBaseUrl(req);
    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: "Could not determine base URL" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Fetch the actual file
    const fileUrl = `${baseUrl}${fileConfig.path}`;
    console.log(`Fetching file from: ${fileUrl}`);

    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      console.error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: "File could not be retrieved",
          status: fileResponse.status,
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const fileContent = await fileResponse.text();

    // Return the file with download headers
    return new Response(fileContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileConfig.displayName}"`,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error) {
    console.error("Download error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
