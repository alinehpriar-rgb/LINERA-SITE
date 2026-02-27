export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const pcs = (url.searchParams.get("pcs") || "").trim();

  if (!email || !email.includes("@")) {
    return json({ ok: false, error: "email_invalido" }, 400);
  }

  if (!["2", "5", "10", "50"].includes(pcs)) {
    return json({ ok: false, error: "pcs_invalido" }, 400);
  }

  const raw = await context.env.LICENCIAS.get(email);

  if (!raw) {
    return json({ ok: false, status: "not_found" }, 404);
  }

  let lic;
  try {
    lic = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "registro_invalido" }, 500);
  }

  if ((lic.status || "").toLowerCase() !== "active") {
    return json({ ok: false, status: "inactive" }, 403);
  }

  if (String(lic.pcs || "") !== pcs) {
    return json({ ok: false, status: "plan_mismatch" }, 403);
  }

  if (lic.valid_until) {
    const venc = new Date(lic.valid_until);
    if (!isNaN(venc.getTime()) && venc.getTime() < Date.now()) {
      return json({ ok: false, status: "expired", valid_until: lic.valid_until }, 403);
    }
  }

  return json({
    ok: true,
    status: "active",
    email: lic.email || email,
    pcs: String(lic.pcs || pcs),
    plan_name: lic.plan_name || "",
    valid_until: lic.valid_until || null,
    subscription_id: lic.subscription_id || ""
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
