/* eslint-disable */
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const FALLBACK_WEBHOOK = "https://zaytoven.app.n8n.cloud/webhook/hd-operator";

const payloadSchema = z.object({
  dateCode: z.string().trim().max(32).optional(),
  message: z.string().trim().min(1).max(4000),
  system_prompt: z.string().trim().min(1).max(4000).optional(),
  chat_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
});

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(401, { error: "Missing or invalid authorization header." });
    }

    const accessToken = authHeader.slice("Bearer ".length).trim();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData?.user) {
      console.warn(`[chat-proxy] [${requestId}] Failed to validate JWT`, authError?.message);
      return jsonResponse(401, { error: "Invalid authentication token." });
    }

    const parsedBody = payloadSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      console.warn(`[chat-proxy] [${requestId}] Payload validation failed`, parsedBody.error.issues);
      return jsonResponse(400, { error: "Invalid request payload." });
    }

    const { dateCode, message, system_prompt, chat_id, user_id } = parsedBody.data;

    if (authData.user.id !== user_id) {
      console.warn(`[chat-proxy] [${requestId}] User mismatch. Token user: ${authData.user.id}, payload user: ${user_id}`);
      return jsonResponse(403, { error: "Forbidden." });
    }

    if (chat_id) {
      const { data: chatRecord, error: chatError } = await supabase
        .from("chats")
        .select("id, user_id")
        .eq("id", chat_id)
        .single();

      if (chatError || !chatRecord) {
        console.warn(`[chat-proxy] [${requestId}] Chat not found or inaccessible. chat_id=${chat_id}`);
        return jsonResponse(404, { error: "Chat not found." });
      }

      if (chatRecord.user_id !== user_id) {
        console.warn(`[chat-proxy] [${requestId}] Chat ownership mismatch. chat_id=${chat_id}, owner=${chatRecord.user_id}`);
        return jsonResponse(403, { error: "Forbidden." });
      }
    }

    let webhooks: Array<{ id: string; name: string; url: string; priority: number }> = [];
    let useFallback = false;

    try {
      const { data, error } = await supabase
        .from("webhooks")
        .select("id, name, url, priority")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (error) {
        console.warn(`[chat-proxy] [${requestId}] Error fetching webhooks`, error.message);
        useFallback = true;
      } else if (!data || data.length === 0) {
        console.warn(`[chat-proxy] [${requestId}] No active webhooks found; using fallback`);
        useFallback = true;
      } else {
        webhooks = data;
      }
    } catch (fetchErr) {
      console.error(`[chat-proxy] [${requestId}] Exception fetching webhooks`, fetchErr);
      useFallback = true;
    }

    if (useFallback) {
      webhooks = [
        {
          id: "fallback",
          name: "Fallback Webhook",
          url: FALLBACK_WEBHOOK,
          priority: 1,
        },
      ];
    }

    console.log(
      `[chat-proxy] [${requestId}] Processing request for user ${user_id} with ${webhooks.length} webhook(s)`,
    );

    let lastError: Error | null = null;

    for (const webhook of webhooks) {
      try {
        console.log(
          `[chat-proxy] [${requestId}] Invoking webhook ${webhook.id} (priority ${webhook.priority})`,
        );

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateCode,
            message,
            system_prompt: system_prompt ?? "You are HD-Physique AI assistant.",
            chat_id: chat_id ?? null,
            user_id,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const responseText = await response.text();
        let payload;

        try {
          payload = JSON.parse(responseText);
        } catch {
          if (responseText.trim()) {
            payload = [{ output: responseText.substring(0, 5000) }];
          } else {
            throw new Error("Empty response body");
          }
        }

        console.log(`[chat-proxy] [${requestId}] Webhook ${webhook.id} succeeded`);
        return jsonResponse(200, payload);
      } catch (webhookError) {
        lastError = webhookError instanceof Error ? webhookError : new Error(String(webhookError));
        console.error(
          `[chat-proxy] [${requestId}] Webhook ${webhook.id} failed`,
          lastError.message,
        );
      }
    }

    console.error(`[chat-proxy] [${requestId}] All webhooks failed`);
    throw lastError ?? new Error("All AI services are currently unavailable.");
  } catch (error) {
    console.error(`[chat-proxy] [${requestId}] Fatal error`, error instanceof Error ? error.message : error);
    return jsonResponse(500, {
      error: "AI service is temporarily unavailable.",
      request_id: requestId,
    });
  }
});
