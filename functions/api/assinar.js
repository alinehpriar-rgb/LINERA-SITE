const PLANS = {
  "2":  "405cae16df8940b4b27cf57b8fc64f45", // Plano Oficina (2 PCs)
  "5":  "618b087942934ef0aec938e95511296f", // Plano Equipe (5 PCs)
  "10": "ee70016158bf412fadce55f3d580d5fd", // Plano Produção (10 PCs)
  "50": "eee8e3f49d6e4a59b11ee60fe5197f65"  // Plano Fábrica (50 PCs)
};

function txt(s) {
  return new Response(String(s || ""), {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

function err(status, s) {
  return new Response(String(s || ""), {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

export async function onRequestGet(context) {
  const token = context.env.MP_ACCESS_TOKEN;
  if (!token) return err(500, "ERRO: MP_ACCESS_TOKEN não existe no Cloudflare Pages.");

  const reqUrl = new URL(context.request.url);
  const origin = reqUrl.origin;

  const email = (reqUrl.searchParams.get("email") || "").trim().toLowerCase();
  const pcs = (reqUrl.searchParams.get("pcs") || "").trim();

  if (!email) return err(400, "Faltou o parâmetro email. Ex: ?email=voce@gmail.com&pcs=2");
  if (!PLANS[pcs]) return err(400, "pcs inválido. Use 2, 5, 10 ou 50.");

  // IMPORTANTE:
  // Não colocamos status "authorized".
  // Deixamos o Mercado Pago criar e devolver o init_point (checkout).
  const body = {
    preapproval_plan_id: PLANS[pcs],
    payer_email: email,

    // para onde o Mercado Pago manda o usuário depois que ele terminar no checkout
    back_url: `${origin}/sucesso.html`,

    // referência interna sua
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

  const raw = await resp.text();

  if (!resp.ok) {
    return err(500, "ERRO criando assinatura (resposta do Mercado Pago):\n\n" + raw);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return err(500, "ERRO: não consegui ler o JSON do Mercado Pago:\n\n" + raw);
  }

  // init_point é o link do checkout
  if (!data.init_point) {
    return err(500, "ERRO: o Mercado Pago não devolveu init_point.\n\n" + JSON.stringify(data, null, 2));
  }

  // devolve só o que interessa
  return new Response(JSON.stringify({
    ok: true,
    init_point: data.init_point,
    id: data.id,
    status: data.status,
    plan_id: PLANS[pcs],
    pcs
  }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
