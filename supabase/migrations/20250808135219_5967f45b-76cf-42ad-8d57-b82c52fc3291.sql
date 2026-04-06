-- Reinstall pg_net in the correct schema to satisfy security linter
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;