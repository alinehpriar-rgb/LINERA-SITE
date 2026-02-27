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

  // LICENÇA DE TESTE (temporária, só pra validar o fluxo do download)
  const hoje = new Date();
  const validade = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias

  const conteudo = [
    "LINERA-NEST LICENSE FILE",
    `email=${email}`,
    `pcs=${pcs}`,
    "status=ATIVA_TESTE",
    `emitido_em=${hoje.toISOString()}`,
    `validade_ate=${validade.toISOString()}`,
    "issuer=linera-site.pages.dev"
  ].join("\n");

  return new Response(conteudo, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="LINERA_${pcs}PCS.lic"`
    }
  });
}
