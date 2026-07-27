// Rahul SMM Panel - script.js Part 1


// Loading Screen

window.onload = function(){

    setTimeout(()=>{
        document.getElementById("loading-screen").style.display="none";
    },1500);

};


// Login/Register Switch

const loginBox = document.getElementById("login-box");
const registerBox = document.getElementById("register-box");


document.getElementById("showRegister").onclick=function(){

    loginBox.style.display="none";
    registerBox.style.display="block";

};


document.getElementById("showLogin").onclick=function(){

    registerBox.style.display="none";
    loginBox.style.display="block";

};



// Register

document.getElementById("registerBtn").onclick=function(){

    let username =
    document.getElementById("regUsername").value;

    let email =
    document.getElementById("regEmail").value;

    let password =
    document.getElementById("regPassword").value;

    let confirm =
    document.getElementById("regConfirm").value;


    if(username=="" || email=="" || password==""){

        alert("Please fill all details");
        return;

    }


    if(password !== confirm){

        alert("Password not match");
        return;

    }


    let user={
        username:username,
        email:email,
        password:password
    };


    localStorage.setItem(
        "rahulUser",
        JSON.stringify(user)
    );


    alert("Account Created Successfully");


    registerBox.style.display="none";
    loginBox.style.display="block";

};// Login System


document.getElementById("loginBtn").onclick=function(){

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



// Open Dashboard

function openDashboard(name){

    document.getElementById("auth-page").style.display="none";

    document.getElementById("dashboard").style.display="block";


    document.getElementById("username").innerHTML=name;

    document.getElementById("profileUsername").innerHTML=name;


    let user =
    JSON.parse(localStorage.getItem("rahulUser"));


    document.getElementById("profileEmail").innerHTML=
    user.email;

}



// Logout

document.getElementById("logoutBtn").onclick=function(){

    localStorage.removeItem("loginStatus");

    location.reload();

};



// Auto Login Check

window.addEventListener("load",()=>{

    let status =
    localStorage.getItem("loginStatus");


    let user =
    JSON.parse(localStorage.getItem("rahulUser"));


    if(status=="true" && user){

        openDashboard(user.username);

    }

});// Sidebar Page Switching


let menuButtons =
document.querySelectorAll(".menu");


let pages =
document.querySelectorAll(".page");


menuButtons.forEach(button=>{


    button.onclick=function(){


        let pageName =
        this.getAttribute("data-page");


        pages.forEach(page=>{

            page.classList.remove("active");

        });


        document.getElementById(pageName)
        .classList.add("active");


        menuButtons.forEach(btn=>{

            btn.classList.remove("active");

        });


        this.classList.add("active");


    };


});



// Copy UPI ID


let copyUpi =
document.getElementById("copyUpiBtn");


if(copyUpi){

copyUpi.onclick=function(){


    navigator.clipboard.writeText(
        "9131922170@ybl"
    );


    alert("UPI ID Copied");


};

}



// Copy Referral Code


let referral =
localStorage.getItem("referralCode");


if(!referral){

    referral =
    "RAHUL" + Math.floor(Math.random()*99999);

    localStorage.setItem(
        "referralCode",
        referral
    );

}


let referralBox =
document.getElementById("referralCode");


if(referralBox){

    referralBox.innerHTML=referral;

}



let copyReferral =
document.getElementById("copyReferralBtn");


if(copyReferral){

copyReferral.onclick=function(){


    navigator.clipboard.writeText(referral);


    alert("Referral Code Copied");


};

}// Services System


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
}

];



let serviceList =
document.getElementById("serviceList");


if(serviceList){


services.forEach((service)=>{


let div=document.createElement("div");

div.className="service-card";


div.innerHTML=`

<h3>${service.name}</h3>

<p>${service.price}</p>

<button onclick="orderService('${service.name}')">
Order Now
</button>

`;


serviceList.appendChild(div);


});


}



// Order Function

// New Order Payment System

function orderService(serviceName){

let amount = 0;
let quantity = "";


if(serviceName=="Instagram Followers"){
    amount = 50;
    quantity = "1000 Followers";
}

else if(serviceName=="Instagram Likes"){
    amount = 20;
    quantity = "1000 Likes";
}

else if(serviceName=="Instagram Comments"){
    amount = 100;
    quantity = "100 Comments";
}

else if(serviceName=="YouTube Subscribers"){
    amount = 200;
    quantity = "1000 Subscribers";
}

else if(serviceName=="Instagram Views"){
    amount = 10;
    quantity = "10000 Views";
}


// Open Payment Page

document.querySelectorAll(".page").forEach(page=>{
    page.classList.remove("active");
});


document.getElementById("payment")
.classList.add("active");


// Show Details

document.getElementById("paymentService").innerHTML =
serviceName;


document.getElementById("paymentQuantity").innerHTML =
quantity;


document.getElementById("paymentAmount").innerHTML =
amount;



// WhatsApp Button

document.getElementById("whatsappOrderBtn").onclick=function(){


let msg =
"Rahul SMM Panel Order\n\n"+
"Service: "+serviceName+
"\nQuantity: "+quantity+
"\nAmount: ₹"+amount+
"\n\nPayment Screenshot Attached";


window.open(
"https://wa.me/919131922170?text="+
encodeURIComponent(msg),
"_blank"
);


};


}


alert(
"Selected Service: " + serviceName
);


// आगे इसमें payment + WhatsApp screenshot system जोड़ेंगे


}// Order + Payment System


function orderService(serviceName){


let message =
"Hello Rahul, I want to order: " 
+ serviceName;


let whatsapp =
"https://wa.me/919131922170?text="
+ encodeURIComponent(message);



let confirmOrder =
confirm(
"Order ke liye WhatsApp par payment screenshot bhejna hoga. Continue?"
);



if(confirmOrder){

window.open(
whatsapp,
"_blank"
);

}


}



// Withdraw Request


let withdrawBtn =
document.getElementById("withdrawBtn");


if(withdrawBtn){


withdrawBtn.onclick=function(){


let amount =
document.getElementById("withdrawAmount").value;



if(amount==""){

alert("Enter Amount");

return;

}


alert(
"Withdraw request received: ₹"+amount
);



};


}// QR Code Generate


let qrBox = document.getElementById("qrCode");


if(qrBox){


let upi =
"upi://pay?pa=9131922170@ybl&pn=Rahul%20SMM%20Panel";


let qrImage =
"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="
+ encodeURIComponent(upi);



qrBox.innerHTML = `

<img 
src="${qrImage}"
width="200"
height="200">

<p>
Scan करके Payment करें
</p>

`;

}



// Save Login User State

document.addEventListener("DOMContentLoaded",()=>{


let user =
JSON.parse(localStorage.getItem("rahulUser"));


if(user){

let profileEmail =
document.getElementById("profileEmail");


if(profileEmail){

profileEmail.innerHTML=user.email;

}

}

});