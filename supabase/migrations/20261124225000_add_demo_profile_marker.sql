ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_demo_idx
  ON public.profiles (id)
  WHERE is_demo = true;
