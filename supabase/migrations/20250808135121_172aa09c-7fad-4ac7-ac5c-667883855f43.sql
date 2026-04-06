-- Ensure pg_net extension is installed in the correct schema
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;
-- If extension exists in public, move it to extensions schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_net SET SCHEMA extensions;
  END IF;
END $$;