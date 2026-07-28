export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("Rahul Social Hub API Running 🚀");
    }

    return new Response("API Not Found", {
      status: 404
    });

  }
}