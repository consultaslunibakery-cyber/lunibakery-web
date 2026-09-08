export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Body inválido", { status: 400 });
  }

  if (body.type !== "payment") {
    return new Response("OK", { status: 200 });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return new Response("Sin payment id", { status: 400 });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return new Response("Pago no aprobado, ignorado", { status: 200 });
    }

    const orderId = payment.external_reference;
    const payer = payment.payer;
    const nota = payment.metadata?.order_note || "";

    const notaPartes = nota.split(" | ");
    const entrega = notaPartes[0] || "—";
    const fecha = notaPartes[1] || "—";

    const fmt = (n) => `$${Number(n).toLocaleString("es-CL")}`;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0dce5;">
        <div style="background:linear-gradient(135deg,#e8809a,#c96a82);padding:28px 32px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🎂 Nuevo pedido confirmado</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Pago aprobado por Mercado Pago</p>
        </div>
        <div style="padding:28px 32px;">
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;width:140px;">📋 N° Pedido</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;font-weight:700;">${orderId}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">👤 Cliente</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${payer?.first_name || "—"} ${payer?.last_name || ""}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">📧 Email</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${payer?.email || "—"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">📅 Fecha entrega</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${fecha}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">🚚 Entrega</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${entrega}</td></tr>
            <tr><td style="padding:14px 0 0;color:#7a5a68;font-weight:700;">💰 Total pagado</td><td style="padding:14px 0 0;font-size:20px;font-weight:700;color:#e8809a;">${fmt(payment.transaction_amount)}</td></tr>
          </table>
        </div>
        <div style="background:#fce4ec;padding:16px 32px;text-align:center;font-size:13px;color:#e8809a;">LuniBakery · consultaslunibakery@gmail.com</div>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LuniBakery <noreply@lunibakery.cl>",
        to: ["consultaslunibakery@gmail.com"],
        subject: `🎂 Nuevo pedido ${orderId} — Mercado Pago`,
        html: emailHtml,
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error webhook:", err);
    return new Response("Error interno", { status: 500 });
  }
}
