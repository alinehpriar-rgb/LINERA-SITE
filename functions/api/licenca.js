export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const pcs = (url.searchParams.get("pcs") || "").trim();

  if (!email || !email.includes("@")) {
    return new Response("E-mail inválido.", { status: 400 });
  }

  if (!["2", "5", "10", "50"].includes(pcs)) {
    return new Response("Plano inválido (pcs).", { status: 400 });
  }

  // Busca no KV: chave = email
  const raw = await context.env.LICENCIAS.get(email);

  if (!raw) {
    return new Response(
      "Nenhuma assinatura encontrada para este e-mail.",
      { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  let lic;
  try {
    lic = JSON.parse(raw);
  } catch {
    return new Response(
      "Cadastro de licença inválido no servidor.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  // Esperado no KV (exemplo):
  // {
  //   "email":"cliente@x.com",
  //   "pcs":"2",
  //   "status":"active",
  //   "valid_until":"2026-03-27T23:59:59.000Z"
  // }

  if ((lic.status || "").toLowerCase() !== "active") {
    return new Response(
      "Sua assinatura está inativa no momento.",
      { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  if (String(lic.pcs || "") !== pcs) {
    return new Response(
      "O plano informado não corresponde ao plano ativo deste e-mail.",
      { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  if (lic.valid_until) {
    const venc = new Date(lic.valid_until);
    if (!isNaN(venc.getTime()) && venc.getTime() < Date.now()) {
      return new Response(
        "Sua assinatura está expirada.",
        { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }
  }

  // Se passou nas validações, gera a licença
  const hoje = new Date();
  const conteudo = [
    "LINERA-NEST LICENSE FILE",
    `email=${email}`,
    `pcs=${pcs}`,
    "status=ATIVA",
    `emitido_em=${hoje.toISOString()}`,
    `validade_ate=${lic.valid_until || ""}`,
    `source=kv`,
    `plano_nome=${lic.plan_name || ""}`,
    `subscription_id=${lic.subscription_id || ""}`
  ].join("\n");

  return new Response(conteudo, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="LINERA_${pcs}PCS.lic"`
    }
  });
}
