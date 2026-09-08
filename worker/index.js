import { onRequestPost as createPreference } from "../functions/api/create-preference.js";
import { onRequestPost as mpWebhook } from "../functions/api/mp-webhook.js";
import { onRequestPost as notifyTransfer } from "../functions/api/notify-transfer.js";
import { onRequestPost as saveOrder } from "../functions/api/save-order.js";
import {
  onRequestGet as getOrdersGet,
  onRequestPut as getOrdersPut,
} from "../functions/api/get-orders.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const context = { request, env, ctx };

    if (path === "/api/create-preference" && request.method === "POST") {
      return createPreference(context);
    }
    if (path === "/api/mp-webhook" && request.method === "POST") {
      return mpWebhook(context);
    }
    if (path === "/api/notify-transfer" && request.method === "POST") {
      return notifyTransfer(context);
    }
    if (path === "/api/save-order" && request.method === "POST") {
      return saveOrder(context);
    }
    if (path === "/api/get-orders") {
      if (request.method === "GET") return getOrdersGet(context);
      if (request.method === "PUT") return getOrdersPut(context);
    }

    // Cualquier otra ruta: servir el archivo estático correspondiente
    return env.ASSETS.fetch(request);
  },
};
