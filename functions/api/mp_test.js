export async function onRequestGet(context) {
  const token = context.env.MP_ACCESS_TOKEN;

  if (!token) {
    return new Response("ERRO: MP_ACCESS_TOKEN não foi encontrado no Cloudflare Pages.", {
      status: 500,
    });
  }

  const resp = await fetch("https://api.mercadopago.com/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await resp.text();

  if (!resp.ok) {
    return new Response(
      "ERRO ao consultar Mercado Pago.\n\n" + text,
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  return new Response(
    "MP OK ✅\n\n" + text,
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
  );
}
