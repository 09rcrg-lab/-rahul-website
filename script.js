const API = "https://rahulsocialhub-db.09rcrg.workers.dev";


// Loading Screen Remove

window.addEventListener("load",()=>{

let loading = document.getElementById("loading-screen");

if(loading){

loading.style.display="none";

}

});// Page Load

document.addEventListener("DOMContentLoaded",()=>{


let dashboard = document.getElementById("dashboard");

let auth = document.getElementById("auth-page");



if(dashboard){

dashboard.style.display="none";

}



if(auth){

auth.style.display="flex";

}



let registerBox = document.getElementById("register-box");

if(registerBox){

registerBox.style.display="none";

}



});// Show Register

document.getElementById("showRegister").onclick=()=>{


document.getElementById("login-box").style.display="none";


document.getElementById("register-box").style.display="block";


};



// Show Login

document.getElementById("showLogin").onclick=()=>{


document.getElementById("register-box").style.display="none";


document.getElementById("login-box").style.display="block";


};// Register Button

document.getElementById("registerBtn").onclick = async()=>{


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


};// Login Button

document.getElementById("loginBtn").onclick = async()=>{


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


};// Logout Button

document.getElementById("logoutBtn").onclick=()=>{


localStorage.removeItem("user");


location.reload();


};// Sidebar Menu Change

let menus = document.querySelectorAll(".menu");


menus.forEach(menu=>{


menu.onclick=()=>{


let pages = document.querySelectorAll(".page");


pages.forEach(page=>{

page.classList.remove("active");

});



let target = menu.getAttribute("data-page");

let section = document.getElementById(target);


if(section){

section.classList.add("active");

}


};


});// Copy UPI

let copyBtn = document.getElementById("copyUpiBtn");


if(copyBtn){


copyBtn.onclick=()=>{


navigator.clipboard.writeText("9131922170@ybl");


alert("UPI ID Copied");


};


}// Save Instagram Username

let saveIgBtn = document.getElementById("saveInstagramBtn");


if(saveIgBtn){


saveIgBtn.onclick=()=>{


let username = 
document.getElementById("igUsername").value;


document.getElementById("igMessage").innerText =
"Instagram Username Saved: " + username;


};


}// Daily Task Coins

let coins = 0;


let taskBtn = document.getElementById("completeTaskBtn");


if(taskBtn){


taskBtn.onclick=()=>{


coins += 10;


document.getElementById("coinBalance").innerText =
"🪙 Coins: " + coins;


};


}// Claim Rewards

let claimFollowersBtn = document.getElementById("claimFollowersBtn");


if(claimFollowersBtn){


claimFollowersBtn.onclick=()=>{


if(coins >= 100){


coins -= 100;


document.getElementById("claimMessage").innerText =
"Followers Request Submitted";


}
else{


document.getElementById("claimMessage").innerText =
"Not Enough Coins";


}


};


}



let claimLikesBtn = document.getElementById("claimLikesBtn");


if(claimLikesBtn){


claimLikesBtn.onclick=()=>{


if(coins >= 50){


coins -= 50;


document.getElementById("claimMessage").innerText =
"Likes Request Submitted";


}
else{


document.getElementById("claimMessage").innerText =
"Not Enough Coins";


}


};


}// Referral Code Generate


let referralBox = document.getElementById("referralCode");


if(referralBox){


let code = "RAHUL" + Math.floor(Math.random()*99999);


referralBox.innerText = code;


}


// Copy Referral Code


let copyReferral = document.getElementById("copyReferralBtn");


if(copyReferral){


copyReferral.onclick=()=>{


let code =
document.getElementById("referralCode").innerText;


navigator.clipboard.writeText(code);


alert("Referral Code Copied");


};


}// Save Selected Instagram Username


let saveInstagram = document.getElementById("saveInstagram");


if(saveInstagram){


saveInstagram.onclick=()=>{


let username = 
document.getElementById("instagramUsername").value;


localStorage.setItem(
"instagramUsername",
username
);


document.getElementById("followersResult").innerText =
"Username Saved: " + username;


};


}// Search User


let searchBtn = document.getElementById("searchUserBtn");


if(searchBtn){


searchBtn.onclick=()=>{


let user = document.getElementById("searchUser").value;


if(user){


document.getElementById("searchResult").innerText =
"User Found: @" + user;


}
else{


document.getElementById("searchResult").innerText =
"Enter Username";


}


};


}// Followers Claim


let claimBtn = document.getElementById("claimFollowersBtn2");


if(claimBtn){


claimBtn.onclick=()=>{


let amount = 
document.getElementById("followersAmount").value;



document.getElementById("followersResult").innerText =

"Request Submitted for " + amount + " Followers";


};


}// Auto Login Check


window.addEventListener("load",()=>{


let user = localStorage.getItem("user");


if(user){


let data = JSON.parse(user);


let auth = document.getElementById("auth-page");

let dashboard = document.getElementById("dashboard");


if(auth){

auth.style.display="none";

}


if(dashboard){

dashboard.style.display="block";

}


if(document.getElementById("username")){

document.getElementById("username").innerText=data.username;

}


}


});