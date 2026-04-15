import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ти си лингвистички стручњак за говор Заплања по монографији Јордане Марковић (2000).

ПРАВИЛА ЗА ЗОНУ I (Горње Заплање):
- х отпада на почетку и крају речи (хлеб→леб, одмах→одма), медијално х→в (сухо→суво)
- Финално л се ЧУВА (радио→работел, дошао→дошњл) — НИКАД Тимочке форме!
- Вокално л после с,д → ла/ле (сунце→сланце, суза→слаза)
- није→неје, нисам→несам
- где→куде, овде→овдека, као→ко, много→млого
- говорити→вреви, радити→работи, шта→кво
- Инфинитив → да + презент (доћи→да дојде)

ПРАВИЛА ЗА ЗОНУ II (Доње Заплање):
- Исте х-промене и чување финалног л
- Вокално л после с,д → лу (сунце→слунце, суза→слузе)
- Разлике: горе→гор, доле→дол, пшеница→пченица
- није→неје, нисам→несам, где→куде

Врати САМО JSON без објашњења, у формату:
{
  "zone1": { "title": "...", "excerpt": "...", "content": "..." },
  "zone2": { "title": "...", "excerpt": "...", "content": "..." }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Преведи следећи текст на заплањски дијалект (обе зоне):

НАСЛОВ: ${title}
ИЗВОД: ${excerpt}
САДРЖАЈ: ${content || ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превише захтева, покушајте поново касније." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Потребно је допунити кредите." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const translations = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(translations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-dialect error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
