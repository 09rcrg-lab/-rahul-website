export default {
  async fetch(request) {

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

      return new Response(
        JSON.stringify({
          message: "API Working Successfully ✅"
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