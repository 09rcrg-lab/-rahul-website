// Loading Screen

window.onload = function(){

    setTimeout(function(){

        let loading = document.getElementById("loading-screen");

        if(loading){
            loading.style.display = "none";
        }

    },1500);

};


// Login Register Switch

let loginBox = document.getElementById("login-box");
let registerBox = document.getElementById("register-box");


let showRegister = document.getElementById("showRegister");
let showLogin = document.getElementById("showLogin");


if(showRegister){

showRegister.onclick = function(){

    loginBox.style.display = "none";
    registerBox.style.display = "block";

};

}


if(showLogin){

showLogin.onclick = function(){

    registerBox.style.display = "none";
    loginBox.style.display = "block";

};

}// Register System

let registerBtn = document.getElementById("registerBtn");


if(registerBtn){

registerBtn.onclick = function(){

let username =
document.getElementById("regUsername").value;

let email =
document.getElementById("regEmail").value;

let password =
document.getElementById("regPassword").value;

let confirmPassword =
document.getElementById("regConfirm").value;


if(username=="" || email=="" || password==""){

alert("Please fill all details");
return;

}


if(password !== confirmPassword){

alert("Password not match");
return;

}


let user = {

username: username,
email: email,
password: password

};


localStorage.setItem(
"rahulUser",
JSON.stringify(user)
);


alert("Account Created Successfully");


registerBox.style.display="none";
loginBox.style.display="block";


};

}// Login System

let loginBtn = document.getElementById("loginBtn");


if(loginBtn){

loginBtn.onclick = function(){

let email =
document.getElementById("loginEmail").value;


let password =
document.getElementById("loginPassword").value;



let savedUser =
JSON.parse(localStorage.getItem("rahulUser"));



if(!savedUser){

alert("Please create account first");
return;

}



if(
email === savedUser.email &&
password === savedUser.password
){


localStorage.setItem(
"loginStatus",
"true"
);


openDashboard(savedUser.username);


}
else{


alert("Wrong Email or Password");


}


};

}// Open Dashboard

function openDashboard(name){


let authPage =
document.getElementById("auth-page");


let dashboard =
document.getElementById("dashboard");



if(authPage){

authPage.style.display="none";

}



if(dashboard){

dashboard.style.display="block";

}



let userName =
document.getElementById("username");


if(userName){

userName.innerHTML = name;

}



let profileName =
document.getElementById("profileUsername");


if(profileName){

profileName.innerHTML = name;

}



let user =
JSON.parse(localStorage.getItem("rahulUser"));



let email =
document.getElementById("profileEmail");


if(email && user){

email.innerHTML = user.email;

}


}// Auto Login Check

window.addEventListener("load", function(){

let status =
localStorage.getItem("loginStatus");


let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(status=="true" && user){

openDashboard(user.username);

}

});



// Logout System

let logoutBtn =
document.getElementById("logoutBtn");


if(logoutBtn){

logoutBtn.onclick=function(){

localStorage.removeItem("loginStatus");

location.reload();

};

}// Sidebar Page Switching

let menuButtons =
document.querySelectorAll(".menu");


let pages =
document.querySelectorAll(".page");


menuButtons.forEach(function(button){


button.onclick = function(){


let pageName =
this.getAttribute("data-page");



pages.forEach(function(page){

page.classList.remove("active");

});



let openPage =
document.getElementById(pageName);


if(openPage){

openPage.classList.add("active");

}



menuButtons.forEach(function(btn){

btn.classList.remove("active");

});


this.classList.add("active");


};


});// Services System

let services = [

{
name:"Instagram Followers",
price:"₹50 / 1000 Followers"
},

{
name:"Instagram Likes",
price:"₹20 / 1000 Likes"
},

{
name:"Instagram Comments",
price:"₹100 / 100 Comments"
},

{
name:"YouTube Subscribers",
price:"₹200 / 1000 Subscribers"
},

{
name:"Instagram Views",
price:"₹10 / 10000 Views"
}

];



let serviceList =
document.getElementById("serviceList");


if(serviceList){


services.forEach(function(service){


let div =
document.createElement("div");


div.className="service-card";


div.innerHTML = `

<h3>${service.name}</h3>

<p>${service.price}</p>

<button onclick="orderService('${service.name}')">
Order Now
</button>

`;



serviceList.appendChild(div);


});


}// Order Payment

function orderService(serviceName){

let amount=0;
let quantity="";

if(serviceName=="Instagram Followers"){
amount=50;
quantity="1000 Followers";
}

else if(serviceName=="Instagram Likes"){
amount=20;
quantity="1000 Likes";
}

else if(serviceName=="Instagram Comments"){
amount=100;
quantity="100 Comments";
}

else if(serviceName=="YouTube Subscribers"){
amount=200;
quantity="1000 Subscribers";
}

else if(serviceName=="Instagram Views"){
amount=10;
quantity="10000 Views";
}document.querySelectorAll(".page").forEach(function(page){
page.classList.remove("active");
});


document.getElementById("payment").classList.add("active");


document.getElementById("paymentService").innerHTML=serviceName;

document.getElementById("paymentQuantity").innerHTML=quantity;

document.getElementById("paymentAmount").innerHTML=amount;let whatsappBtn =
document.getElementById("whatsappOrderBtn");


if(whatsappBtn){

whatsappBtn.onclick=function(){

let msg =
"Rahul SMM Panel Order\n"+
"Service: "+serviceName+
"\nQuantity: "+quantity+
"\nAmount: ₹"+amount;


window.open(
"https://wa.me/919131922170?text="+
encodeURIComponent(msg),
"_blank"
);

};

}

}