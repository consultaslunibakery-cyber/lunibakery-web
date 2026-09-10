export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Body inválido", { status: 400 });
  }

  const { nombre, email, telefono, productos, total, fecha, entrega } = body;

  const fmt = (n) => `$${Number(n).toLocaleString("es-CL")}`;
  const orderId = `LUNI-TF-${Date.now()}`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0dce5;">
      <div style="background:linear-gradient(135deg,#e8809a,#c96a82);padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0;">🏦 Pedido por Transferencia</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">El cliente ya fue a WhatsApp a enviar el comprobante</p>
      </div>
      <div style="padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;width:140px;">📋 N° Pedido</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;font-weight:700;">${orderId}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">👤 Cliente</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${nombre}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">📧 Email</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${email}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">📞 Teléfono</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${telefono}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">🎂 Productos</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;font-weight:600;">${productos}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">📅 Fecha entrega</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${fecha}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">🚚 Entrega</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${entrega}</td></tr>
          <tr><td style="padding:14px 0 0;color:#7a5a68;font-weight:700;">💰 Total a recibir</td><td style="padding:14px 0 0;font-size:20px;font-weight:700;color:#e8809a;">${fmt(total)}</td></tr>
        </table>
        <div style="background:#fff3e0;border:1.5px solid #ffb74d;border-radius:10px;padding:14px;margin-top:20px;font-size:13px;color:#e65100;">
          ⚠️ Recuerda confirmar la transferencia antes de preparar el pedido.
        </div>
      </div>
      <div style="background:#fce4ec;padding:16px 32px;text-align:center;font-size:13px;color:#e8809a;">LuniBakery · consultaslunibakery@gmail.com</div>
    </div>
  `;

  const customerEmailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0dce5;">
      <div style="background:linear-gradient(135deg,#e8809a,#c96a82);padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0;">🎂 ¡Recibimos tu pedido!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Gracias por tu compra en LuniBakery</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="font-size:15px;color:#4a3540;margin:0 0 16px;">Hola ${nombre}, ya recibimos tu pedido y está pendiente de confirmación una vez recibamos tu comprobante de transferencia.</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;width:140px;">📋 N° Pedido</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;font-weight:700;">${orderId}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">🎂 Productos</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;font-weight:600;">${productos}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">📅 Fecha entrega</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${fecha}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f0dce5;color:#7a5a68;">🚚 Entrega</td><td style="padding:10px 0;border-bottom:1px solid #f0dce5;">${entrega}</td></tr>
          <tr><td style="padding:14px 0 0;color:#7a5a68;font-weight:700;">💰 Total</td><td style="padding:14px 0 0;font-size:20px;font-weight:700;color:#e8809a;">${fmt(total)}</td></tr>
        </table>
        <div style="background:#fff3e0;border:1.5px solid #ffb74d;border-radius:10px;padding:14px;margin-top:20px;font-size:13px;color:#e65100;">
          ⚠️ Recuerda enviarnos el comprobante de la transferencia por WhatsApp para confirmar tu pedido.
        </div>
      </div>
      <div style="background:#fce4ec;padding:16px 32px;text-align:center;font-size:13px;color:#e8809a;">LuniBakery · consultaslunibakery@gmail.com</div>
    </div>
  `;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LuniBakery <noreply@lunibakery.cl>",
        to: ["consultaslunibakery@gmail.com"],
        subject: `🏦 Pedido por transferencia ${orderId} — ${nombre}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json();
      console.error("Error Resend:", err);
      return new Response(JSON.stringify({ error: "Error enviando email" }), { status: 500 });
    }

    // Guardar pedido en el panel de administración (directo en KV, sin salir a internet)
    try {
      const order = {
        id: orderId,
        fecha_pedido: new Date().toISOString(),
        cliente: { nombre: nombre || "", email: email || "", telefono: telefono || "" },
        productos: productos || "",
        nota: entrega || "",
        total: total || 0,
        metodo_pago: "Transferencia",
        estado: "Esperando comprobante",
      };
      await env.ORDERS_KV.put(`order:${order.id}`, JSON.stringify(order));
    } catch (saveErr) {
      console.error("Error guardando pedido en KV:", saveErr);
    }

    // Enviar correo de confirmación al cliente (no bloqueante)
    if (email) {
      try {
        const customerRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "LuniBakery <noreply@lunibakery.cl>",
            to: [email],
            subject: `🎂 Recibimos tu pedido ${orderId} — LuniBakery`,
            html: customerEmailHtml,
          }),
        });
        if (!customerRes.ok) {
          const customerErrBody = await customerRes.text();
          console.error("Error enviando correo al cliente:", customerRes.status, customerErrBody);
        }
      } catch (customerErr) {
        console.error("Error enviando correo al cliente:", customerErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, orderId }), { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
  }
}
