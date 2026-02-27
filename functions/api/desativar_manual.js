export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const key = (url.searchParams.get("key") || "").trim();
  const ADMIN_KEY = context.env.ADMIN_KEY || "";

  if (!ADMIN_KEY) {
    return new Response("ADMIN_KEY não configurada no servidor.", { status: 500 });
  }

  if (key !== ADMIN_KEY) {
    return new Response("Acesso negado.", { status: 403 });
  }

  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return new Response("E-mail inválido.", { status: 400 });
  }

  const raw = await context.env.LICENCIAS.get(email);

  if (!raw) {
    return new Response("Nenhuma licença encontrada para este e-mail.", { status: 404 });
  }

  let lic;
  try {
    lic = JSON.parse(raw);
  } catch {
    return new Response("Registro inválido no KV.", { status: 500 });
  }

  lic.status = "inactive";
  lic.updated_at = new Date().toISOString();

  await context.env.LICENCIAS.put(email, JSON.stringify(lic));

  return new Response(
    "OK ✅ Licença desativada\n\n" + JSON.stringify(lic, null, 2),
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
  );
}
