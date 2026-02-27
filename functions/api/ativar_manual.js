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
  const pcs = (url.searchParams.get("pcs") || "").trim();
  const dias = Number(url.searchParams.get("dias") || "30");

  if (!email || !email.includes("@")) {
    return new Response("E-mail inválido.", { status: 400 });
  }

  if (!["2", "5", "10", "50"].includes(pcs)) {
    return new Response("pcs inválido. Use 2, 5, 10 ou 50.", { status: 400 });
  }

  if (!Number.isFinite(dias) || dias <= 0) {
    return new Response("dias inválido.", { status: 400 });
  }

  const now = new Date();
  const validUntil = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

  const planNames = {
    "2": "Plano Oficina",
    "5": "Plano Equipe",
    "10": "Plano Produção",
    "50": "Plano Fábrica"
  };

  const registro = {
    email,
    pcs,
    status: "active",
    valid_until: validUntil.toISOString(),
    plan_name: planNames[pcs],
    subscription_id: "MANUAL-" + Date.now()
  };

  await context.env.LICENCIAS.put(email, JSON.stringify(registro));

  return new Response(
    "OK ✅\n\n" + JSON.stringify(registro, null, 2),
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
  );
}
