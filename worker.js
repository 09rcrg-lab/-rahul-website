export default {

async fetch(request, env) {


const url = new URL(request.url);


// ================= HOME API =================


if(url.pathname === "/"){


return Response.json({

success:true,

message:"Rahul Social Hub API Running 🚀"

});


}


// ================= REGISTER API =================


if(url.pathname === "/api/register" && request.method === "POST"){


try{


const {

username,

email,

password

} = await request.json();



await env.DB.prepare(

`INSERT INTO users
(username,email,password,coins,instagram_username,followers_requested,followers_completed,request_status)
VALUES (?,?,?,?,?,?,?,?)`

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



}

catch(error){


return Response.json({

success:false,

message:"Email already registered"

});


}



}// ================= LOGIN API =================


if(url.pathname === "/api/login" && request.method === "POST"){


try{


const {

email,

password

} = await request.json();



const user = await env.DB.prepare(

"SELECT * FROM users WHERE email = ? AND password = ?"

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

message:"Login Successful",

user:user

});



}

catch(error){


return Response.json({

success:false,

message:"Login Error"

});


}



}// ================= SAVE INSTAGRAM API =================


if(url.pathname === "/api/save-instagram" && request.method === "POST"){


try{


const {

email,

instagram

} = await request.json();



await env.DB.prepare(

"UPDATE users SET instagram_username = ? WHERE email = ?"

)

.bind(

instagram,

email

)

.run();



return Response.json({

success:true,

message:"Instagram Username Saved"

});



}

catch(error){


return Response.json({

success:false,

message:"Save Error"

});


}



}// ================= SEARCH USER API =================


if(url.pathname === "/api/search-user" && request.method === "POST"){


try{


const {

username

} = await request.json();



const user = await env.DB.prepare(

"SELECT username FROM users WHERE username = ?"

)

.bind(

username

)

.first();



if(!user){


return Response.json({

success:false,

message:"User Not Found"

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

message:"Search Error"

});


}



}// ================= FOLLOWERS REQUEST API =================


if(url.pathname === "/api/request-followers" && request.method === "POST"){


try{


const {

email,

followers

} = await request.json();



const user = await env.DB.prepare(

"SELECT coins FROM users WHERE email = ?"

)

.bind(

email

)

.first();



if(!user){


return Response.json({

success:false,

message:"User Not Found"

});


}



if(user.coins < followers){


return Response.json({

success:false,

message:"Not Enough Coins"

});


}



await env.DB.prepare(

`UPDATE users
SET coins = coins - ?,
followers_requested = ?,
request_status = 'pending'
WHERE email = ?`

)

.bind(

followers,

followers,

email

)

.run();



return Response.json({

success:true,

message:"Followers Request Submitted"

});



}

catch(error){


return Response.json({

success:false,

message:"Request Error"

});


}



}// ================= USER PROFILE API =================


if(url.pathname === "/api/profile" && request.method === "POST"){


try{


const {

email

} = await request.json();



const user = await env.DB.prepare(

"SELECT username,email,coins,instagram_username,followers_requested,followers_completed,request_status FROM users WHERE email = ?"

)

.bind(

email

)

.first();



if(!user){


return Response.json({

success:false,

message:"User Not Found"

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

message:"Profile Error"

});


}



}// ================= ADD COINS API =================


if(url.pathname === "/api/add-coins" && request.method === "POST"){


try{


const {

email,

coins

} = await request.json();



await env.DB.prepare(

"UPDATE users SET coins = coins + ? WHERE email = ?"

)

.bind(

coins,

email

)

.run();



return Response.json({

success:true,

message:"Coins Added Successfully"

});



}

catch(error){


return Response.json({

success:false,

message:"Coins Add Error"

});


}



}// ================= CHECK USER API =================


if(url.pathname === "/api/check-user" && request.method === "POST"){


try{


const {

email

} = await request.json();



const user = await env.DB.prepare(

"SELECT username,email FROM users WHERE email = ?"

)

.bind(

email

)

.first();



if(!user){


return Response.json({

success:false,

message:"User Not Found"

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

message:"Check User Error"

});


}



}// ================= WALLET BALANCE API =================


if(url.pathname === "/api/wallet" && request.method === "POST"){


try{


const {

email

} = await request.json();



const user = await env.DB.prepare(

"SELECT coins FROM users WHERE email = ?"

)

.bind(

email

)

.first();



if(!user){


return Response.json({

success:false,

message:"User Not Found"

});


}



return Response.json({

success:true,

coins:user.coins

});



}

catch(error){


return Response.json({

success:false,

message:"Wallet Error"

});


}



}// ================= WITHDRAW REQUEST API =================


if(url.pathname === "/api/withdraw" && request.method === "POST"){


try{


const {

email,

amount

} = await request.json();



const user = await env.DB.prepare(

"SELECT coins FROM users WHERE email = ?"

)

.bind(

email

)

.first();



if(!user){


return Response.json({

success:false,

message:"User Not Found"

});


}



if(user.coins < amount){


return Response.json({

success:false,

message:"Insufficient Balance"

});


}



await env.DB.prepare(

`UPDATE users
SET coins = coins - ?
WHERE email = ?`

)

.bind(

amount,

email

)

.run();



return Response.json({

success:true,

message:"Withdraw Request Submitted"

});



}

catch(error){


return Response.json({

success:false,

message:"Withdraw Error"

});


}



}