-- Run this in Supabase SQL Editor if listen_history isn't recording Jamendo plays.
-- Allows any signed-in user to cache Jamendo tracks in the tracks table.

CREATE POLICY "Tracks: authenticated can cache jamendo"
  ON public.tracks FOR INSERT
  WITH CHECK (
    source = 'jamendo' AND auth.role() = 'authenticated'
  );
