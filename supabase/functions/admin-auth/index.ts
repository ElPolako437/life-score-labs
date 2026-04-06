// Admin authentication edge function with secure PBKDF2 hashing (Deno-compatible)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex string to ArrayBuffer
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// Secure password hashing with PBKDF2 (Web Crypto API - Deno compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  // Format: salt:hash (both as hex)
  return `${bufferToHex(salt.buffer)}:${bufferToHex(derivedBits)}`;
}

// Secure password verification with PBKDF2
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = storedHash.split(":");
    if (!saltHex || !hashHex) return false;
    
    const encoder = new TextEncoder();
    const salt = new Uint8Array(hexToBuffer(saltHex));
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    
    const derivedHex = bufferToHex(derivedBits);
    
    // Timing-safe comparison
    if (derivedHex.length !== hashHex.length) return false;
    let result = 0;
    for (let i = 0; i < derivedHex.length; i++) {
      result |= derivedHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
    }
    return result === 0;
  } catch (e) {
    console.error("Password verification error:", e);
    return false;
  }
}

// Password complexity validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 12) {
    return { valid: false, error: "Passwort muss mindestens 12 Zeichen lang sein" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Passwort muss mindestens einen Großbuchstaben enthalten" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Passwort muss mindestens einen Kleinbuchstaben enthalten" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Passwort muss mindestens eine Zahl enthalten" };
  }
  return { valid: true };
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, password, sessionToken } = await req.json();

    if (action === "login") {
      if (!password) {
        return new Response(JSON.stringify({ error: "Passwort erforderlich" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if admin password exists
      const { data: adminData, error: adminError } = await supabase
        .from("admin_access")
        .select("password_hash")
        .maybeSingle();

      if (adminError) {
        console.error("Admin check error:", adminError);
        return new Response(JSON.stringify({ error: "Datenbankfehler" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no admin exists, create one with this password (with validation)
      if (!adminData) {
        const validation = validatePassword(password);
        if (!validation.valid) {
          return new Response(JSON.stringify({ error: validation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const passwordHash = await hashPassword(password);
        const { error: insertError } = await supabase
          .from("admin_access")
          .insert({ password_hash: passwordHash });

        if (insertError) {
          console.error("Admin creation error:", insertError);
          return new Response(JSON.stringify({ error: "Admin-Erstellung fehlgeschlagen" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("First admin password set with PBKDF2");
      } else {
        // Verify password with PBKDF2
        const isValid = await verifyPassword(password, adminData.password_hash);
        if (!isValid) {
          return new Response(JSON.stringify({ error: "Ungültiges Passwort" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create session
      const newSessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Clean up expired sessions
      await supabase
        .from("admin_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString());

      // Insert new session
      const { error: sessionError } = await supabase
        .from("admin_sessions")
        .insert({
          session_token: newSessionToken,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        return new Response(JSON.stringify({ error: "Session-Erstellung fehlgeschlagen" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Admin login successful");
      return new Response(
        JSON.stringify({ success: true, sessionToken: newSessionToken }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "verify") {
      if (!sessionToken) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: session } = await supabase
        .from("admin_sessions")
        .select("expires_at")
        .eq("session_token", sessionToken)
        .maybeSingle();

      const valid = session && new Date(session.expires_at) > new Date();

      return new Response(JSON.stringify({ valid }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "logout") {
      if (sessionToken) {
        await supabase
          .from("admin_sessions")
          .delete()
          .eq("session_token", sessionToken);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ungültige Aktion" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Admin auth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
