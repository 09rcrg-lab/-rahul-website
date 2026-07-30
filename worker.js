export default {

async fetch(request, env) {


const url = new URL(request.url);


// HOME API

if(url.pathname === "/"){


return Response.json({

success:true,

message:"Rahul SMM Panel API Running 🚀"

});


}// REGISTER API


if(url.pathname === "/api/register" && request.method === "POST"){


try{


const {

username,

email,

password


} = await request.json();



await env.DB.prepare(

`
INSERT INTO users

(username,email,password)

VALUES

(?,?,?)

`

)

.bind(

username,

email,

password

)

.run();



return Response.json({

success:true,

message:"Register Successful"

});


}

catch(error){


return Response.json({

success:false,

message:error.message

});


}


}// LOGIN API


if(url.pathname === "/api/login" && request.method === "POST"){


try{


const {

email,

password


} = await request.json();



const user = await env.DB.prepare(

`

SELECT * FROM users

WHERE email = ?

AND password = ?

`

)

.bind(

email,

password

)

.first();



if(!user){


return Response.json({

success:false,

message:"Invalid Email or Password"

});


}



return Response.json({

success:true,

user:user

});


}


catch(error){


return Response.json({

success:false,

message:error.message

});


}


}// TEST DATABASE CONNECTION


if(url.pathname === "/api/test"){


try{


const result = await env.DB.prepare(

"SELECT name FROM sqlite_master WHERE type='table'"

)

.all();



return Response.json({

success:true,

tables:result.results

});


}

catch(error){


return Response.json({

success:false,

error:error.message

});


}


}// CORS SETTINGS


return new Response(

"Not Found",

{

status:404,

headers:{

"Access-Control-Allow-Origin":"*"

}

}

);


}

};