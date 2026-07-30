export default {

async fetch(request, env) {

const url = new URL(request.url);


// Home API
if(url.pathname === "/"){

return Response.json({

success:true,

message:"Rahul SMM Panel API Running 🚀"

});

}


// Register API

if(url.pathname === "/api/register" && request.method === "POST"){


try{


const {

username,

email,

password

} = await request.json();



const check = await env.DB.prepare(

"SELECT * FROM users WHERE email=?"

)

.bind(email)

.all();



if(check.results.length > 0){

return Response.json({

success:false,

message:"Email already registered"

});

}



const referral = 
"RAHUL" + Math.floor(Math.random()*99999);



await env.DB.prepare(

`INSERT INTO users 
(username,email,password,referral_code)
VALUES (?,?,?,?)`

)

.bind(

username,

email,

password,

referral

)

.run();



return Response.json({

success:true,

message:"Registration Successful"

});


}

catch(e){

return Response.json({

success:false,

error:e.message

});

}


}



// Login API

if(url.pathname === "/api/login" && request.method === "POST"){


try{


const {

email,

password

}= await request.json();



const user = await env.DB.prepare(

"SELECT * FROM users WHERE email=? AND password=?"

)

.bind(

email,

password

)

.all();



if(user.results.length === 0){


return Response.json({

success:false,

message:"Wrong Email or Password"

});


}



return Response.json({

success:true,

user:user.results[0]

});


}

catch(e){

return Response.json({

success:false,

error:e.message

});

}


}



return Response.json({

success:false,

message:"API Not Found"

});


}

};