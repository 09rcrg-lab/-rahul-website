export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "Rahul Social Hub API Running",
          message: "Backend connected successfully"
        }),
        {
          headers:{
            "Content-Type":"application/json"
          }
        }
      );
    }


    if (url.pathname === "/api/test") {

      return new Response(
        JSON.stringify({
          message:"API Working 🚀"
        }),
        {
          headers:{
            "Content-Type":"application/json"
          }
        }
      );

    }


    return new Response(
      "Rahul Social Hub Server"
    );

  }
};