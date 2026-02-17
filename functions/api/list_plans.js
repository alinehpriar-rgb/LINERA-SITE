export async function onRequestGet(context) {
  const token = context.env.MP_ACCESS_TOKEN;

  const url = "https://api.mercadopago.com/preapproval_plan/search?limit=50&offset=0";

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const dataText = await resp.text();

  if (!resp.ok) {
    return new Response("ERRO ao buscar planos:\n\n" + dataText, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  // Só pra ficar fácil de ler no navegador:
  let data;
  try { data = JSON.parse(dataText); } catch { data = dataText; }

  const results = (data?.results || []).map(p => ({
    id: p.id,
    reason: p.reason,
    frequency: p.auto_recurring?.frequency,
    frequency_type: p.auto_recurring?.frequency_type,
    transaction_amount: p.auto_recurring?.transaction_amount,
    currency_id: p.auto_recurring?.currency_id,
    status: p.status
  }));

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
