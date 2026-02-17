export async function onRequestGet(context) {
  return new Response("VERSAO NOVA ASSINAR OK", { status: 200 });
  const url = new URL(context.request.url);

  const email = (url.searchParams.get("email") || "").trim();
  const pcs = Number(url.searchParams.get("pcs") || "0");

  if (!email || !email.includes("@")) {
    return new Response("ERRO: informe ?email=seuemail@gmail.com", { status: 400 });
  }
  if (![2, 5, 10, 50].includes(pcs)) {
    return new Response("ERRO: informe ?pcs=2 ou 5 ou 10 ou 50", { status: 400 });
  }

  // PEGUE seus IDs de plano (os que você já tem)
  // e cole aqui:
  const PLANOS = {
    2:  "405cae16df8940b4b27cf57b8fc64f45",
    5:  "618b087942934ef0aec938e95511296f",
    10: "ee70016158bf412fadce55f3d580d5fd",
    50: "eee8e3f49d6e4a59b11ee60fe5197f65",
  };

  const preapproval_plan_id = PLANOS[pcs];

  // URL que o Mercado Pago vai voltar depois do pagamento
  // (pode ser uma página simples por enquanto)
  const back_url_ok = `${url.origin}/obrigado?email=${encodeURIComponent(email)}&pcs=${pcs}`;

  // Token secreto do Mercado Pago (ACCESS TOKEN)
  // Você vai colocar isso como "secret" no Cloudflare (não no código)
  const MP_ACCESS_TOKEN = context.env.MP_ACCESS_TOKEN;

  if (!MP_ACCESS_TOKEN) {
    return new Response("ERRO: MP_ACCESS_TOKEN não configurado no Cloudflare.", { status: 500 });
  }

  // Isso cria uma assinatura PENDENTE e gera um link (init_point) pro checkout do MP.
  const body = {
    preapproval_plan_id,
    payer_email: email,
    back_url: back_url_ok,
    status: "pending",

    // opcional, mas ajuda a você identificar depois:
    external_reference: `LINERA|${pcs}|${email}|${Date.now()}`
  };

  let mpResp;
  try {
    mpResp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return new Response("ERRO chamando Mercado Pago: " + String(e), { status: 500 });
  }

  const txt = await mpResp.text();
  let data = null;
  try { data = JSON.parse(txt); } catch (_) {}

  if (!mpResp.ok) {
    return new Response(
      "ERRO criando assinatura (resposta do Mercado Pago):\n\n" + (data ? JSON.stringify(data) : txt),
      { status: 500 }
    );
  }

  // Em assinatura "pending", o MP costuma devolver init_point para você mandar o cliente pagar.
  const initPoint = data?.init_point;

  if (!initPoint) {
    return new Response(
      "Criou assinatura, mas não veio init_point.\n\nResposta:\n" + JSON.stringify(data, null, 2),
      { status: 500 }
    );
  }

  // REDIRECIONA o navegador direto pro checkout do Mercado Pago
  return Response.redirect(initPoint, 302);
}
