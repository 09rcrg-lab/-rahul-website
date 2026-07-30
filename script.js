window.addEventListener("load", function(){

    document.getElementById("loading-screen").style.display="none";

});window.onload = function(){window.addEventListener("load", function(){

    document.getElementById("loading-screen").style.display = "none";

});

document.getElementById("loading-screen").style.display="none";

};
const API = "YOUR_WORKER_URL";


// Page Load

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



});




// Register

document.getElementById("registerBtn").onclick=async()=>{


let username=document.getElementById("regUsername").value;

let email=document.getElementById("regEmail").value;

let password=document.getElementById("regPassword").value;

let confirm=document.getElementById("regConfirm").value;



if(password!==confirm){

alert("Password not match");

return;

}



let res=await fetch(API+"/api/register",{

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


let data=await res.json();



alert(data.message);



};




// Login


document.getElementById("loginBtn").onclick=async()=>{


let email=document.getElementById("loginEmail").value;

let password=document.getElementById("loginPassword").value;



let res=await fetch(API+"/api/login",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email,

password

})


});



let data=await res.json();



if(data.success){


localStorage.setItem(
"user",
JSON.stringify(data.user)
);



document.getElementById("auth-page").style.display="none";

document.getElementById("dashboard").style.display="block";


document.getElementById("username").innerText=
data.user.username;


document.getElementById("profileUsername").innerText=
data.user.username;


document.getElementById("profileEmail").innerText=
data.user.email;



}

else{


alert(data.message);


}


};




// Logout


document.getElementById("logoutBtn").onclick=()=>{


localStorage.removeItem("user");

location.reload();


};