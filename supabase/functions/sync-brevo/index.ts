import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncBrevoRequest {
  email: string;
  firstname?: string;
  newsletterOptIn?: boolean;  // If true, also add to newsletter list (#2)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const BREVO_LIST_ID_BIOAGE = Deno.env.get('BREVO_LIST_ID_BIOAGE') || '3';
    const BREVO_LIST_ID_NEWSLETTER = Deno.env.get('BREVO_LIST_ID_NEWSLETTER') || '2';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!BREVO_API_KEY) {
      console.error('[sync-brevo] FATAL: Missing BREVO_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Brevo API key configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email: rawEmail, firstname, newsletterOptIn = false }: SyncBrevoRequest = await req.json();

    // Sanitize email: trim and lowercase
    const email = rawEmail?.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('[sync-brevo] Invalid email format:', rawEmail);
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-brevo] BREVO_SYNC_START email=${email} newsletterOptIn=${newsletterOptIn}`);

    // Build list IDs array - ALWAYS include BioAge list (#3)
    const listIds: number[] = [parseInt(BREVO_LIST_ID_BIOAGE, 10)];
    
    // ONLY add to newsletter list (#2) if explicit opt-in
    if (newsletterOptIn) {
      listIds.push(parseInt(BREVO_LIST_ID_NEWSLETTER, 10));
    }

    // Build contact payload with listIds for single API call
    const contactPayload: Record<string, unknown> = {
      email: email,
      listIds: listIds,
      updateEnabled: true,
    };

    // Only include FIRSTNAME if non-empty
    if (firstname && firstname.trim()) {
      contactPayload.attributes = { FIRSTNAME: firstname.trim() };
    }

    console.log(`[sync-brevo] Sending to Brevo: listIds=${JSON.stringify(listIds)}`);

    // Single API call to create/update contact AND add to lists
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(contactPayload),
    });

    const responseText = await response.text();
    
    // Success: 201 (created) or 204 (updated)
    // Acceptable: 400 with "Contact already exist" (we still need to add to list)
    if (response.ok) {
      console.log(`[sync-brevo] BREVO_SYNC_SUCCESS status=${response.status} email=${email} listIds=${JSON.stringify(listIds)}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contact synced to Brevo',
          addedToLists: listIds,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle "contact already exists" - need to add to list separately
    if (response.status === 400 && responseText.includes('Contact already exist')) {
      console.log(`[sync-brevo] Contact exists, adding to list(s) separately...`);
      
      // Update contact attributes if firstname provided
      if (firstname && firstname.trim()) {
        const updateResponse = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': BREVO_API_KEY,
          },
          body: JSON.stringify({
            attributes: { FIRSTNAME: firstname.trim() },
          }),
        });
        
        if (!updateResponse.ok) {
          const updateText = await updateResponse.text();
          console.warn(`[sync-brevo] Failed to update contact attributes: ${updateResponse.status} ${updateText}`);
        }
      }
      
      // Add to BioAge list (#3)
      const addToBioAgeResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID_BIOAGE}/contacts/add`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({ emails: [email] }),
      });
      
      if (!addToBioAgeResponse.ok) {
        const addText = await addToBioAgeResponse.text();
        console.error(`[sync-brevo] Failed to add to BioAge list: ${addToBioAgeResponse.status} ${addText}`);
      } else {
        console.log(`[sync-brevo] Added existing contact to BioAge list #${BREVO_LIST_ID_BIOAGE}`);
      }
      
      // Add to Newsletter list (#2) only if opt-in
      if (newsletterOptIn) {
        const addToNewsletterResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID_NEWSLETTER}/contacts/add`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': BREVO_API_KEY,
          },
          body: JSON.stringify({ emails: [email] }),
        });
        
        if (!addToNewsletterResponse.ok) {
          const addText = await addToNewsletterResponse.text();
          console.error(`[sync-brevo] Failed to add to Newsletter list: ${addToNewsletterResponse.status} ${addText}`);
        } else {
          console.log(`[sync-brevo] Added existing contact to Newsletter list #${BREVO_LIST_ID_NEWSLETTER}`);
        }
      }
      
      console.log(`[sync-brevo] BREVO_SYNC_SUCCESS (existing contact) email=${email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Existing contact updated and added to lists',
          addedToLists: listIds,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real error - log and store for retry
    console.error(`[sync-brevo] BREVO_SYNC_ERROR status=${response.status} body=${responseText} email=${email}`);
    
    // Store failure for retry (if Supabase is configured)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('brevo_sync_failures').insert({
          email: email,
          firstname: firstname?.trim() || null,
          error_message: responseText,
          error_status: response.status,
          newsletter_optin: newsletterOptIn,
        });
        console.log(`[sync-brevo] Stored failure for retry: ${email}`);
      } catch (dbError) {
        console.error(`[sync-brevo] Failed to store retry record:`, dbError);
      }
    }

    // Still return success to not block user flow
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Brevo sync failed, stored for retry',
        error: responseText,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-brevo] BREVO_SYNC_EXCEPTION:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
