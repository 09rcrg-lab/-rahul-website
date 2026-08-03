export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        success: true,
        message: "Rahul Live API Running 🚀"
      });
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        database: !!env.DB
      });
    }

    return Response.json(
      {
        success: false,
        message: "API route not found"
      },
      { status: 404 }
    );
  }
};