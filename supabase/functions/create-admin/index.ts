import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Create admin user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "mirsa@admin.com",
    password: "0601x-2L",
    email_confirm: true,
    user_metadata: { nombre: "Super Admin" },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
  }

  const userId = authData.user.id;

  // Update profile
  await supabase.from("profiles").update({ nombre: "Super Admin", rol: "admin" }).eq("id", userId);

  // Assign admin role
  await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return new Response(JSON.stringify({ success: true, user_id: userId }), { status: 200 });
});
