function checkSecret(request, env) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  return secret && secret === env.ADMIN_SECRET;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkSecret(request, env)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  try {
    const list = await env.ORDERS_KV.list({ prefix: "order:" });
    const orders = await Promise.all(
      list.keys.map(async (k) => {
        const value = await env.ORDERS_KV.get(k.name);
        return value ? JSON.parse(value) : null;
      })
    );

    const cleaned = orders
      .filter(Boolean)
      .sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));

    return new Response(JSON.stringify(cleaned), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error listando pedidos:", err);
    return new Response(JSON.stringify({ error: "Error obteniendo pedidos" }), { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  if (!checkSecret(request, env)) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const { id, estado } = body;
  if (!id || !estado) {
    return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400 });
  }

  try {
    const key = `order:${id}`;
    const existing = await env.ORDERS_KV.get(key);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Pedido no encontrado" }), { status: 404 });
    }
    const order = JSON.parse(existing);
    order.estado = estado;
    await env.ORDERS_KV.put(key, JSON.stringify(order));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error actualizando pedido:", err);
    return new Response(JSON.stringify({ error: "Error actualizando pedido" }), { status: 500 });
  }
}
