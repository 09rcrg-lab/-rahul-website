export default {

async fetch(request, env, ctx) {

const url = new URL(request.url);

const headers = {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Headers":"*",
"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
"Content-Type":"application/json"
};

if(request.method==="OPTIONS"){
return new Response(null,{headers});
}

// =========================
// HOME
// =========================

if(url.pathname==="/"){

return new Response(JSON.stringify({

success:true,

name:"Rahul Live API",

version:"1.0.0",

status:"online",

database:"Cloudflare D1",

server_time:new Date().toISOString()

}),{headers});

}

// =========================
// HEALTH
// =========================

if(url.pathname==="/api/health"){

try{

const db=await env.DB.prepare(
"SELECT COUNT(*) total FROM users"
).first();

return new Response(JSON.stringify({

success:true,

api:"running",

database:"connected",

users:db.total

}),{headers});

}catch(e){

return new Response(JSON.stringify({

success:false,

error:e.message

}),{status:500,headers});

}

}

// =========================
// REGISTER
// =========================

if(
url.pathname==="/api/register"
&&
request.method==="POST"
){

try{

const body=await request.json();

let{

username,
email,
phone,
password

}=body;

username=(username||"").trim();
email=(email||"").trim();
phone=(phone||"").trim();
password=(password||"").trim();

if(
!username||
!password
){

return new Response(JSON.stringify({

success:false,

message:"Username and Password Required"

}),{status:400,headers});

}

const check=await env.DB.prepare(

`SELECT id FROM users
WHERE username=?
OR email=?
OR phone=?`

)

.bind(
username,
email,
phone
)

.first();

if(check){

return new Response(JSON.stringify({

success:false,

message:"User Already Exists"

}),{status:400,headers});

}const created=await env.DB.prepare(

`INSERT INTO users(

username,
email,
phone,
password

)

VALUES(

?,
?,
?,
?

)`

)

.bind(

username,
email,
phone,
password

)

.run();

return new Response(

JSON.stringify({

success:true,

message:"Registration Successful",

user_id:created.meta.last_row_id

}),

{headers}

);

}catch(e){

return new Response(

JSON.stringify({

success:false,

error:e.message

}),

{

status:500,

headers

}

);

}

}

// =========================
// LOGIN
// =========================

if(

url.pathname==="/api/login"

&&

request.method==="POST"

){

try{

const body=await request.json();

const{

username,

password

}=body;

const user=

await env.DB.prepare(

`SELECT *

FROM users

WHERE

username=?

AND

password=?`

)

.bind(

username,

password

)

.first();

if(!user){

return new Response(

JSON.stringify({

success:false,

message:"Invalid Login"

}),

{

status:401,

headers

}

);

}const token=crypto.randomUUID();

await env.DB.prepare(

`INSERT INTO sessions(

user_id,
token

)

VALUES(

?,
?

)`

)

.bind(

user.id,

token

)

.run();

return new Response(

JSON.stringify({

success:true,

message:"Login Successful",

token,

user:{

id:user.id,

username:user.username,

name:user.name,

avatar:user.avatar,

coins:user.coins,

diamonds:user.diamonds,

level:user.level,

vip:user.vip

}

}),

{

headers

}

);

}catch(e){

return new Response(

JSON.stringify({

success:false,

error:e.message

}),

{

status:500,

headers

}

);

}

}

// =========================
// PROFILE
// =========================

if(

url.pathname==="/api/profile"

&&

request.method==="GET"

){

const token=request.headers.get("Authorization");

if(!token){

return new Response(

JSON.stringify({

success:false,

message:"Unauthorized"

}),

{

status:401,

headers

}

);

}

const session=

await env.DB.prepare(

`SELECT user_id

FROM sessions

WHERE token=?`

)

.bind(token)

.first();

if(!session){

return new Response(

JSON.stringify({

success:false,

message:"Session Expired"

}),

{

status:401,

headers

}

);

}

const user=

await env.DB.prepare(

`SELECT *

FROM users

WHERE id=?`

)

.bind(session.user_id)

.first();

return new Response(

JSON.stringify({

success:true,

user

}),

{

headers

}

);

}// =========================
// UPDATE PROFILE
// =========================

if(
url.pathname==="/api/profile/update"
&&
request.method==="POST"
){

try{

const token=request.headers.get("Authorization");

if(!token){

return new Response(

JSON.stringify({

success:false,

message:"Unauthorized"

}),

{

status:401,

headers

}

);

}

const session=

await env.DB.prepare(

`SELECT user_id
FROM sessions
WHERE token=?`

)

.bind(token)

.first();

if(!session){

return new Response(

JSON.stringify({

success:false,

message:"Invalid Session"

}),

{

status:401,

headers

}

);

}

const body=await request.json();

const{

name,
bio,
gender,
country,
avatar,
cover

}=body;

await env.DB.prepare(

`UPDATE users

SET

name=?,
bio=?,
gender=?,
country=?,
avatar=?,
cover=?

WHERE id=?`

)

.bind(

name,
bio,
gender,
country,
avatar,
cover,
session.user_id

)

.run();

return new Response(

JSON.stringify({

success:true,

message:"Profile Updated"

}),

{

headers

}

);

}catch(e){

return new Response(

JSON.stringify({

success:false,

error:e.message

}),

{

status:500,

headers

}

);

}

}

// =========================
// LOGOUT
// =========================

if(

url.pathname==="/api/logout"

&&

request.method==="POST"

){

const token=request.headers.get("Authorization");

if(token){

await env.DB.prepare(

`DELETE FROM sessions
WHERE token=?`

)

.bind(token)

.run();

}

return new Response(

JSON.stringify({

success:true,

message:"Logout Successful"

}),

{

headers

}

);

}// =========================
// 404
// =========================

return new Response(

JSON.stringify({

success:false,

message:"API Not Found"

}),

{

status:404,

headers

}

);

} // fetch end

}; // export default