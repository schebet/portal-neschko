
CREATE POLICY "Lektors can read published articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (is_published = true AND has_role(auth.uid(), 'lektor'::app_role));

CREATE POLICY "Lektors can update published articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (is_published = true AND has_role(auth.uid(), 'lektor'::app_role));
