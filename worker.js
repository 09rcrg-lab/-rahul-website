export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname === "/") {

      return new Response(
        JSON.stringify({
          status: "online",
          message: "Rahul Social Hub API Running 🚀"
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }


    if (url.pathname === "/api/test") {

      const result = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      return new Response(
        JSON.stringify({
          message: "D1 Database Connected ✅",
          tables: result.results
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }


    return new Response(
      "Rahul Social Hub Server"
    );

  }
};