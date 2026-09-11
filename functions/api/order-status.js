export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim();

  if (!id) {
    return new Response(JSON.stringify({ error: "Falta el número de pedido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await env.ORDERS_KV.get(`order:${id}`);
    if (!raw) {
      return new Response(JSON.stringify({ error: "No encontramos un pedido con ese número" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const order = JSON.parse(raw);

    // Solo se expone información no sensible (sin datos de contacto del cliente)
    return new Response(
      JSON.stringify({
        id: order.id,
        estado: order.estado,
        productos: order.productos,
        total: order.total,
        metodo_pago: order.metodo_pago,
        fecha_pedido: order.fecha_pedido,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error consultando pedido:", err);
    return new Response(JSON.stringify({ error: "Error interno al consultar el pedido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
