import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client with service role for database access
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Fallback webhook in case database query fails or returns no webhooks
const FALLBACK_WEBHOOK = 'https://zaytoven.app.n8n.cloud/webhook/hd-operator';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateCode, message, system_prompt, chat_id, user_id } = await req.json();

    console.log("Processing chat request:", { 
      dateCode, 
      message, 
      chat_id, 
      user_id,
      has_system_prompt: !!system_prompt 
    });

    // Try to fetch active webhooks from database
    let webhooks: any[] = [];
    let useFallback = false;

    try {
      const { data, error: fetchError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (fetchError) {
        console.warn("⚠️ Error fetching webhooks from database:", fetchError.message);
        console.log("→ Falling back to hardcoded webhook");
        useFallback = true;
      } else if (!data || data.length === 0) {
        console.warn("⚠️ No active webhooks found in database");
        console.log("→ Falling back to hardcoded webhook");
        useFallback = true;
      } else {
        webhooks = data;
        console.log(`✓ Using ${webhooks.length} webhook(s) from database`);
      }
    } catch (dbError) {
      console.error("⚠️ Database query exception:", dbError);
      console.log("→ Falling back to hardcoded webhook");
      useFallback = true;
    }

    // Use fallback if database approach failed
    if (useFallback) {
      webhooks = [{
        id: 'fallback',
        name: 'Fallback Webhook',
        url: FALLBACK_WEBHOOK,
        is_active: true,
        priority: 1,
      }];
      console.log(`→ Using fallback webhook: ${FALLBACK_WEBHOOK}`);
    }

    // Try each webhook in priority order until one succeeds
    let lastError: Error | null = null;

    for (const webhook of webhooks) {
      try {
        console.log(`Trying webhook: ${webhook.name} (${webhook.url}) [Priority: ${webhook.priority}]`);

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateCode,
            message,
            system_prompt: system_prompt || "You are HD-Physique AI assistant.",
            chat_id: chat_id || null,
            user_id: user_id || null,
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        // Read response body once as text to avoid "Body already consumed" error
        const responseText = await response.text();
        console.log(`Raw response from "${webhook.name}":`, responseText.substring(0, 200) + '...');
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`✓ Webhook "${webhook.name}" succeeded with valid JSON`);
          console.log("Parsed webhook response:", data);
        } catch (jsonError) {
          // JSON parsing failed - log the error and use raw text as fallback
          console.error(`⚠️ JSON parsing failed for webhook "${webhook.name}"`);
          console.error("JSON parse error:", jsonError instanceof Error ? jsonError.message : String(jsonError));
          console.error("Raw response body:", responseText);
          
          // Check if we got any text
          if (responseText && responseText.trim()) {
            // Wrap raw text in proper format
            console.log("→ Using raw text response as fallback");
            data = [{
              output: responseText.substring(0, 5000) // Limit to 5000 chars
            }];
          } else {
            throw new Error("Empty response from webhook");
          }
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`✗ Webhook "${webhook.name}" failed:`, lastError.message);
        // Continue to next webhook
      }
    }

    // If we got here, all webhooks failed
    console.error("❌ All webhooks failed to respond");
    throw new Error(`All AI services are currently unavailable. Please try again in a moment. (Last error: ${lastError?.message || 'Unknown error'})`);
  } catch (error) {
    console.error("Error in chat-proxy:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Failed to communicate with n8n webhook",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
