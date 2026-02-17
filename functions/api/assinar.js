const PLANS = {
  "2":  "405cae16df8940b4b27cf57b8fc64f45", // Plano Oficina (2 PCs)
  "5":  "618b087942934ef0aec938e95511296f", // Plano Equipe (5 PCs)
  "10": "ee70016158bf412fadce55f3d580d5fd", // Plano Produção (10 PCs)
  "50": "eee8e3f49d6e4a59b11ee60fe5197f65"  // Plano Fábrica (50 PCs)
};

export async function onRequestGet(context) {
  const token = context.env.MP_ACCESS_TOKEN;
  const url = new URL(context.request.url);

  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const pcs = (url.searchParams.get("pcs") || "").trim();

  if (!email) return new Response("Faltou email", { status: 400 });
  if (!PLANS[pcs]) return new Response("pcs inválido. Use 2, 5, 10 ou 50", { status: 400 });

  // URL do seu próprio site (pra voltar depois do pagamento)
  const origin = url.origin;

  // Cria uma assinatura ligada a um PLANO
  const body = {
  preapproval_plan_id: PLANS[pcs],
  payer_email: email,
  back_url: `${origin}/sucesso.html`,
  external_reference: `linera|${email}|pcs${pcs}|${Date.now()}`
};


  const resp = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    return new Response("ERRO criando assinatura:\n\n" + JSON.stringify(data, null, 2), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  // O Mercado Pago devolve a URL do checkout em "init_point"
  return new Response(JSON.stringify({
    ok: true,
    init_point: data.init_point,
    id: data.id,
    status: data.status
  }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
