
-- Music tracks table
CREATE TABLE public.music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_dialect text,
  description text,
  description_dialect text,
  audio_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Music tracks are public" ON public.music_tracks FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins manage music tracks" ON public.music_tracks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_music_tracks_updated_at BEFORE UPDATE ON public.music_tracks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- On this day table
CREATE TABLE public.on_this_day (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key text NOT NULL, -- format MM-DD
  year text NOT NULL,
  event_text text NOT NULL,
  event_text_dialect text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.on_this_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "On this day events are public" ON public.on_this_day FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage on this day" ON public.on_this_day FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_on_this_day_updated_at BEFORE UPDATE ON public.on_this_day
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for music files
INSERT INTO storage.buckets (id, name, public) VALUES ('music-files', 'music-files', true);

CREATE POLICY "Music files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'music-files');
CREATE POLICY "Admins can upload music" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'music-files' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can delete music" ON storage.objects FOR DELETE USING (bucket_id = 'music-files' AND auth.role() = 'authenticated');
