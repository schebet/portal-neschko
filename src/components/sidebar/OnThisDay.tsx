import { Calendar } from "lucide-react";
import { useDialect } from "@/contexts/DialectContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HistoricalEvent {
  year: string;
  text: string;
  textDialect: string | null;
}

const fallbackEvents: HistoricalEvent[] = [
  { year: "XIX век", text: "Заплањски крај чува богату традицију", textDialect: "Заплањски крај чува богату традицију" },
];

function getTodayKey(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function getTodayLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long" });
}

export function OnThisDay() {
  const { dialect } = useDialect();
  const isDialect = dialect === "Заплањски дијалект";
  const key = getTodayKey();
  const [events, setEvents] = useState<HistoricalEvent[]>(fallbackEvents);

  useEffect(() => {
    supabase
      .from("on_this_day")
      .select("year, event_text, event_text_dialect")
      .eq("day_key", key)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEvents(data.map(d => ({
            year: d.year,
            text: d.event_text,
            textDialect: d.event_text_dialect,
          })));
        }
      });
  }, [key]);

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Calendar className="h-4 w-4 text-accent" />
        <h3 className="font-serif font-bold text-sm text-foreground">На данашњи дан</h3>
        <span className="ml-auto text-xs text-muted-foreground">{getTodayLabel()}</span>
      </div>
      <ul className="space-y-3">
        {events.map((event, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-xs font-bold text-accent whitespace-nowrap mt-0.5">
              {event.year}
            </span>
            <p className="text-sm text-foreground leading-snug">
              {isDialect ? (event.textDialect || event.text) : event.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
