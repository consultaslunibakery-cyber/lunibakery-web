const TORTA_CATS = ["tortas-trad", "tortas-veg", "sin-azucar"];
const DAILY_TORTA_LIMIT = 2; // fijo por ahora, se puede subir más adelante

function tortaQtyFromItems(items) {
  return (items || []).reduce((sum, it) => (TORTA_CATS.includes(it.cat) ? sum + (it.qty || 0) : sum), 0);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const { items, payer, deliveryCost, discountAmt, orderNote, fechaISO } = body;

  if (!items || items.length === 0) {
    return new Response(JSON.stringify({ error: "Carrito vacío" }), { status: 400 });
  }

  // Límite de tortas por día de entrega
  const requestedTortaQty = tortaQtyFromItems(items);
  if (fechaISO && requestedTortaQty > 0) {
    const kvKey = `torta-count:${fechaISO}`;
    const currentRaw = await env.ORDERS_KV.get(kvKey);
    const current = currentRaw ? parseInt(currentRaw, 10) : 0;
    if (current + requestedTortaQty > DAILY_TORTA_LIMIT) {
      const disponibles = Math.max(0, DAILY_TORTA_LIMIT - current);
      return new Response(
        JSON.stringify({
          error: `Lo sentimos, ya no hay cupo de tortas para el ${fechaISO}. Quedan ${disponibles} disponibles ese día. Elige otra fecha.`,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    // Reservar el cupo de inmediato para evitar sobreventa
    await env.ORDERS_KV.put(kvKey, String(current + requestedTortaQty));
  }

  const mpItems = items.map((item) => ({
    id: item.id,
    title: `${item.name} (${item.size})`,
    description: item.customNames?.length
      ? "Personalización: " + item.customNames.join(", ")
      : undefined,
    quantity: item.qty,
    unit_price: item.basePrice + item.customPrice,
    currency_id: "CLP",
  }));

  if (deliveryCost > 0) {
    mpItems.push({ id: "despacho", title: "Despacho a domicilio", quantity: 1, unit_price: deliveryCost, currency_id: "CLP" });
  }
  if (discountAmt > 0) {
    mpItems.push({ id: "descuento", title: "Descuento aplicado", quantity: 1, unit_price: -discountAmt, currency_id: "CLP" });
  }

  const siteUrl = env.URL || "https://lunibakery.cl";
  const orderId = `LUNI-${Date.now()}`;

  const preference = {
    items: mpItems,
    payer: {
      name: payer?.name || "",
      email: payer?.email || "",
      phone: { number: payer?.phone || "" },
    },
    back_urls: {
      success: `${siteUrl}/success.html`,
      failure: `${siteUrl}/failure.html`,
      pending: `${siteUrl}/pending.html`,
    },
    auto_return: "approved",
    statement_descriptor: "LuniBakery",
    external_reference: orderId,
    metadata: { order_note: orderNote || "" },
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  };

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      return new Response(JSON.stringify({ error: "Error al crear preferencia", detail: mpData }), { status: 500 });
    }

    // Guardar pedido (intento no bloqueante)
    try {
      const subtotal = items.reduce((a, i) => a + (i.basePrice + i.customPrice) * i.qty, 0);
      const total = subtotal + (deliveryCost || 0) - (discountAmt || 0);

      const order = {
        id: orderId,
        fecha_pedido: new Date().toISOString(),
        cliente: {
          nombre: payer?.name || "",
          email: payer?.email || "",
          telefono: payer?.phone || "",
        },
        productos: items.map((i) => `${i.name} (${i.size}) x${i.qty}`).join(", "),
        nota: orderNote || "",
        subtotal,
        despacho: deliveryCost || 0,
        descuento: discountAmt || 0,
        total,
        metodo_pago: "Mercado Pago",
        estado: "Pendiente",
        preference_id: mpData.id,
      };

      await env.ORDERS_KV.put(`order:${order.id}`, JSON.stringify(order));
    } catch (saveErr) {
      console.error("Error guardando pedido:", saveErr);
    }

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        preference_id: mpData.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error de conexión con Mercado Pago" }), { status: 500 });
  }
}
