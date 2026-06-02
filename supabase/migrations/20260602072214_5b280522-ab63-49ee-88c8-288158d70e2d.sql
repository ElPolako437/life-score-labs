
CREATE OR REPLACE FUNCTION public.prevent_user_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_source IS DISTINCT FROM OLD.premium_source
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
  THEN
    IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Not allowed to modify role or premium fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_user_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
