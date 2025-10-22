// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Content-Type": "application/json",
  } as Record<string, string>;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders(origin),
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders(origin),
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders(origin),
      });
    }

    // Ensure only admins can create users
    const { data: isAdmin, error: roleErr } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders(origin),
      });
    }

    const body = await req.json();
    const { email, password, fullName, role } = body as {
      email: string;
      password: string;
      fullName: string;
      role: "tecnico" | "supervisor" | "admin";
    };

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!(["tecnico", "supervisor", "admin"] as const).includes(role)) {
      return new Response(JSON.stringify({ error: "Papel inválido" }), {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    // Admin client with elevated privileges
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create the user without affecting the admin session
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createErr) {
      const msg = (createErr as any)?.message || "Erro ao criar usuário";
      const status = msg?.toLowerCase().includes("already") ? 409 : 400;
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: corsHeaders(origin),
      });
    }

    const createdUser = created.user;
    if (!createdUser) {
      return new Response(JSON.stringify({ error: "Usuário não retornado" }), {
        status: 500,
        headers: corsHeaders(origin),
      });
    }

    // Ensure profile exists/updated
    await supabaseAdmin.from("profiles").upsert({
      id: createdUser.id,
      full_name: fullName,
    });

    // Set role: remove any previous roles for the user then insert the selected role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", createdUser.id);

    const { error: insertRoleErr } = await supabaseAdmin
      .from("user_roles")
      .insert([{ user_id: createdUser.id, role }]);

    if (insertRoleErr) {
      return new Response(
        JSON.stringify({ error: "Erro ao atribuir papel ao usuário" }),
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: createdUser.id }),
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error)?.message || "Erro interno" }),
      { status: 500, headers: corsHeaders(null) }
    );
  }
});