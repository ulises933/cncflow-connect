import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: corsHeaders });
    }

    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden gestionar usuarios" }), { status: 403, headers: corsHeaders });
    }

    const { action, user_id, email, password, nombre } = await req.json();

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: "user_id y action son requeridos" }), { status: 400, headers: corsHeaders });
    }

    if (action === "update") {
      const updatePayload: any = {};
      if (email) updatePayload.email = email;
      if (password) updatePayload.password = password;
      if (nombre) updatePayload.user_metadata = { nombre };

      if (Object.keys(updatePayload).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(user_id, updatePayload);
        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders });
        }
      }

      // Update profile if nombre or email changed
      const profileUpdate: any = {};
      if (nombre) profileUpdate.nombre = nombre;
      if (email) profileUpdate.email = email;
      if (Object.keys(profileUpdate).length > 0) {
        await supabase.from("profiles").update(profileUpdate).eq("id", user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // Prevent self-delete
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "No puedes eliminarte a ti mismo" }), { status: 400, headers: corsHeaders });
      }

      // Delete user roles and profile first, then auth user
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      await supabase.from("profiles").delete().eq("id", user_id);
      
      const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
