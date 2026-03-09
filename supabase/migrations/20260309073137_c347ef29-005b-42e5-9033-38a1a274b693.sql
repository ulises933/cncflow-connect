
-- Update handle_new_user to use text role instead of enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario');
  
  RETURN NEW;
END;
$function$;

-- Add unique constraint on role+module_key for upsert to work
ALTER TABLE public.module_permissions DROP CONSTRAINT IF EXISTS module_permissions_role_module_key_key;
ALTER TABLE public.module_permissions ADD CONSTRAINT module_permissions_role_module_key_key UNIQUE (role, module_key);
