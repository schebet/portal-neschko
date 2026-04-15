import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dayKey } = await req.json(); // format "MM-DD"
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Convert day key to a readable date
    const [mm, dd] = dayKey.split("-");
    const months = ["јануара","фебруара","марта","априла","маја","јуна","јула","августа","септембра","октобра","новембра","децембра"];
    const dateStr = `${parseInt(dd)}. ${months[parseInt(mm) - 1]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Ti si istoričar specijalizovan za region Niša i Zaplanja u Srbiji. Odgovaraš ISKLJUČIVO na srpskom jeziku (ćirilica). Vraćaš JSON niz istorijskih događaja.`,
          },
          {
            role: "user",
            content: `Navedi 2-3 istorijska događaja koji su se desili na datum ${dateStr} u niškom regionu, Zaplanju ili Srbiji. Za svaki daj godinu i kratak opis (jedna rečenica). Odgovori SAMO kao JSON niz objekata sa poljima "year" (string) i "event_text" (string na ćirilici) i "event_text_dialect" (string na zaplanjanskom dijalektu, koristi pravila Zone I - npr. "ал" umesto "ао", "ел" umesto "ео", nastavak "-ја" za prisvojne pridevе itd.). Primer: [{"year":"1878","event_text":"Ослобођење Ниша од турске власти","event_text_dialect":"Ослобођење Ниш од турску власт"}]`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_events",
              description: "Return historical events for the given date",
              parameters: {
                type: "object",
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "string" },
                        event_text: { type: "string" },
                        event_text_dialect: { type: "string" },
                      },
                      required: ["year", "event_text", "event_text_dialect"],
                    },
                  },
                },
                required: ["events"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_events" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI error: " + t);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let events = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      events = parsed.events || [];
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-on-this-day error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
