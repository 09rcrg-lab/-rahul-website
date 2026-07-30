const API = "YOUR_WORKER_URL";


// Loading Remove

window.addEventListener("load",()=>{

document.getElementById("loading-screen").style.display="none";

});// Page Load

document.addEventListener("DOMContentLoaded",()=>{


document.getElementById("dashboard").style.display="none";

document.getElementById("register-box").style.display="none";


// Show Register

document.getElementById("showRegister").onclick=()=>{

document.getElementById("login-box").style.display="none";

document.getElementById("register-box").style.display="block";

};


// Show Login

document.getElementById("showLogin").onclick=()=>{

document.getElementById("register-box").style.display="none";

document.getElementById("login-box").style.display="block";

};


});// Register API

document.getElementById("registerBtn").onclick=async()=>{


let username =
document.getElementById("regUsername").value;


let email =
document.getElementById("regEmail").value;


let password =
document.getElementById("regPassword").value;


let confirm =
document.getElementById("regConfirm").value;



if(password !== confirm){

alert("Password match nahi hai");

return;

}



let response = await fetch(API+"/api/register",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

username,

email,

password

})

});


let data = await response.json();


alert(data.message);


};// Login API

document.getElementById("loginBtn").onclick=async()=>{


let email =
document.getElementById("loginEmail").value;


let password =
document.getElementById("loginPassword").value;



let response = await fetch(API+"/api/login",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email,

password

})

});


let data = await response.json();



if(data.success){


localStorage.setItem(
"user",
JSON.stringify(data.user)
);



document.getElementById("auth-page").style.display="none";


document.getElementById("dashboard").style.display="block";



document.getElementById("username").innerText =
data.user.username;



document.getElementById("profileUsername").innerText =
data.user.username;



document.getElementById("profileEmail").innerText =
data.user.email;



}

else{

alert(data.message);

}


};// Logout

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem("user");

location.reload();

};