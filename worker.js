export default {

  async fetch(request, env) {

    const url = new URL(request.url);


    // Test API
    if (url.pathname === "/") {

      return Response.json({
        status: "online",
        message: "Rahul Social Hub API Running 🚀"
      });

    }



    // Register API

    if (url.pathname === "/api/register" && request.method === "POST") {


      const {
        username,
        email,
        password
      } = await request.json();



      try {


        await env.DB.prepare(
`
INSERT INTO users
(
username,
email,
password,
coins,
instagram_username,
followers_requested,
followers_completed,
request_status
)
VALUES (?,?,?,?,?,?,?,?)
`
        )
        .bind(
          username,
          email,
          password,
          0,
          "",
          0,
          0,
          "none"
        )
        .run();



        return Response.json({

          success:true,

          message:"User Registered Successfully"

        });



      } catch(error) {


        return Response.json({

          success:false,

          message:error.message

        });


      }


    }



    return Response.json({

      success:false,

      message:"API Not Found"

    });


  }

};