export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // =========================================
    // HOME
    // =========================================
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "online",
          message: "Rahul Social Hub API Running 🚀"
        }),
        { headers: corsHeaders }
      );
    }

    // =========================================
    // TEST DATABASE
    // =========================================
    if (url.pathname === "/api/test" && request.method === "GET") {
      try {
        const result = await env.DB
          .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
          .all();

        return new Response(
          JSON.stringify({
            success: true,
            tables: result.results
          }),
          { headers: corsHeaders }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );
      }
    }

    // =========================================
    // CREATE ORDER
    // POST /api/orders
    // =========================================
    if (url.pathname === "/api/orders" && request.method === "POST") {
      try {
        const data = await request.json();

        if (!data.id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Order ID missing"
            }),
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        if (!data.serviceName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Service name missing"
            }),
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const createdAt =
          data.createdAt || new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO orders (
            id,
            customer_name,
            username,
            service_id,
            service_name,
            quantity,
            units,
            amount,
            referral,
            lifetime_refill,
            status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            String(data.id),
            data.customerName || "",
            data.username || "",
            String(data.serviceId || ""),
            data.serviceName,
            Number(data.quantity || 1),
            Number(data.units || 0),
            Number(data.amount || 0),
            data.referral ? 1 : 0,
            data.lifetimeRefill ? 1 : 0,
            data.status || "Pending",
            createdAt,
            createdAt
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: "Order saved successfully",
            orderId: data.id
          }),
          {
            status: 201,
            headers: corsHeaders
          }
        );

      } catch (error) {

        // Duplicate Order ID
        if (
          error.message &&
          error.message.toLowerCase().includes("unique")
        ) {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Order already exists",
              duplicate: true
            }),
            {
              status: 200,
              headers: corsHeaders
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );
      }
    }

    // =========================================
    // GET SINGLE ORDER
    // GET /api/orders/ORDER_ID
    // =========================================
    if (
      url.pathname.startsWith("/api/orders/") &&
      request.method === "GET"
    ) {
      try {
        const orderId = decodeURIComponent(
          url.pathname.replace("/api/orders/", "")
        );

        if (!orderId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Order ID missing"
            }),
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const order = await env.DB
          .prepare(`
            SELECT
              id,
              service_name,
              quantity,
              units,
              amount,
              referral,
              lifetime_refill,
              status,
              created_at,
              updated_at
            FROM orders
            WHERE id = ?
            LIMIT 1
          `)
          .bind(orderId)
          .first();

        if (!order) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Order not found"
            }),
            {
              status: 404,
              headers: corsHeaders
            }
          );
        }

        // Customer-safe information only
        return new Response(
          JSON.stringify({
            success: true,
            order: {
              id: order.id,
              serviceName: order.service_name,
              quantity: order.quantity,
              units: order.units,
              amount: order.amount,
              referral: Boolean(order.referral),
              lifetimeRefill: Boolean(order.lifetime_refill),
              status: order.status,
              createdAt: order.created_at,
              updatedAt: order.updated_at
            }
          }),
          {
            status: 200,
            headers: corsHeaders
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );
      }
    }

    // =========================================
    // 404
    // =========================================
    return new Response(
      JSON.stringify({
        success: false,
        error: "API endpoint not found"
      }),
      {
        status: 404,
        headers: corsHeaders
      }
    );
  }
};