
-- 1) Prevent privilege escalation on user_profiles
CREATE OR REPLACE FUNCTION public.prevent_user_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / postgres bypass
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_source IS DISTINCT FROM OLD.premium_source
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
  THEN
    RAISE EXCEPTION 'Not allowed to modify role or premium fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_profile_privilege_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_user_profile_privilege_escalation
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_profile_privilege_escalation();

-- 2) Lock down badges table — explicitly deny UPDATE, allow self DELETE
CREATE POLICY "Users delete own badges"
ON public.badges
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "No updates on badges"
ON public.badges
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);
