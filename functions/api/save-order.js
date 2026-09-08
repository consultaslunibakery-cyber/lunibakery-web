export async function onRequestPost(context) {
  const { request, env } = context;

  // Solo el propio sitio (create-preference / notify-transfer) puede guardar pedidos
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  let order;
  try {
    order = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  if (!order.id) {
    return new Response(JSON.stringify({ error: "Pedido sin id" }), { status: 400 });
  }

  try {
    await env.ORDERS_KV.put(`order:${order.id}`, JSON.stringify(order));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error guardando en KV:", err);
    return new Response(JSON.stringify({ error: "Error guardando pedido" }), { status: 500 });
  }
}
