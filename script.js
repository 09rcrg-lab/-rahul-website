// Loading Screen

window.addEventListener("load", function(){

    setTimeout(function(){

        let loading = document.getElementById("loading-screen");

        if(loading){

            loading.style.display = "none";

        }

    },1500);

});



// Login Register Switch

let loginBox = document.getElementById("login-box");

let registerBox = document.getElementById("register-box");


let showRegister = document.getElementById("showRegister");


if(showRegister){

    showRegister.onclick = function(){

        loginBox.style.display = "none";

        registerBox.style.display = "block";

    };

}


let showLogin = document.getElementById("showLogin");


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



        let user =
        JSON.parse(localStorage.getItem("rahulUser"));



        if(!user){

            alert("Please create account first");

            return;

        }



        if(email === user.email && password === user.password){


            localStorage.setItem(
                "loginStatus",
                "true"
            );


            openDashboard(user.username);


        }
        else{

            alert("Wrong Email or Password");

        }


    };

}



// Open Dashboard

function openDashboard(name){


    let auth =
    document.getElementById("auth-page");


    let dashboard =
    document.getElementById("dashboard");



    if(auth){

        auth.style.display="none";

    }



    if(dashboard){

        dashboard.style.display="block";

    }



    let username =
    document.getElementById("username");


    let profileUsername =
    document.getElementById("profileUsername");



    if(username){

        username.innerHTML=name;

    }



    if(profileUsername){

        profileUsername.innerHTML=name;

    }



    let user =
    JSON.parse(localStorage.getItem("rahulUser"));



    let profileEmail =
    document.getElementById("profileEmail");



    if(profileEmail && user){

        profileEmail.innerHTML=user.email;

    }


}// Auto Login Check

window.addEventListener("load",()=>{


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

}



// Sidebar Page Switching

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



        let openPage =
        document.getElementById(pageName);



        if(openPage){

            openPage.classList.add("active");

        }



        menuButtons.forEach(btn=>{

            btn.classList.remove("active");

        });



        this.classList.add("active");


    };


});// Referral System

let referralCode =
localStorage.getItem("referralCode");


if(!referralCode){


    referralCode =
    "RAHUL" + Math.floor(Math.random()*99999);


    localStorage.setItem(
        "referralCode",
        referralCode
    );


}



let referralBox =
document.getElementById("referralCode");


if(referralBox){

    referralBox.innerHTML =
    referralCode;

}




let copyReferralBtn =
document.getElementById("copyReferralBtn");


if(copyReferralBtn){


    copyReferralBtn.onclick=function(){


        navigator.clipboard.writeText(
            referralCode
        );


        alert("Referral Code Copied");


    };


}



// Copy UPI ID

let copyUpiBtn =
document.getElementById("copyUpiBtn");


if(copyUpiBtn){


    copyUpiBtn.onclick=function(){


        navigator.clipboard.writeText(
            "9131922170@ybl"
        );


        alert("UPI ID Copied");


    };


}// QR Code System

let qrCode =
document.getElementById("qrCode");


if(qrCode){


    let upi =
    "upi://pay?pa=9131922170@ybl&pn=Rahul%20SMM%20Panel";


    let qrImage =
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="
    + encodeURIComponent(upi);



    qrCode.innerHTML = `

    <img src="${qrImage}" width="200">

    <p>Scan करके Payment करें</p>

    `;


}



// Services System

let services = [


{
name:"Instagram Followers",
price:"₹50 / 1000 Followers",
amount:50,
quantity:"1000 Followers"
},


{
name:"Instagram Likes",
price:"₹20 / 1000 Likes",
amount:20,
quantity:"1000 Likes"
},


{
name:"Instagram Comments",
price:"₹100 / 100 Comments",
amount:100,
quantity:"100 Comments"
},


{
name:"YouTube Subscribers",
price:"₹200 / 1000 Subscribers",
amount:200,
quantity:"1000 Subscribers"
},


{
name:"Instagram Views",
price:"₹10 / 10000 Views",
amount:10,
quantity:"10000 Views"
}


];



let serviceList =
document.getElementById("serviceList");


if(serviceList){


    services.forEach(service=>{


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


}// Order System

function orderService(serviceName){


    let service =
    services.find(
        item=>item.name==serviceName
    );


    if(!service){

        return;

    }



    let pages =
    document.querySelectorAll(".page");



    pages.forEach(page=>{

        page.classList.remove("active");

    });



    let payment =
    document.getElementById("payment");



    if(payment){

        payment.classList.add("active");

    }



    let paymentService =
    document.getElementById("paymentService");


    let paymentQuantity =
    document.getElementById("paymentQuantity");


    let paymentAmount =
    document.getElementById("paymentAmount");



    if(paymentService){

        paymentService.innerHTML =
        service.name;

    }



    if(paymentQuantity){

        paymentQuantity.innerHTML =
        service.quantity;

    }



    if(paymentAmount){

        paymentAmount.innerHTML =
        service.amount;

    }


}



// WhatsApp Order System


let whatsappOrderBtn =
document.getElementById("whatsappOrderBtn");



if(whatsappOrderBtn){


    whatsappOrderBtn.onclick=function(){



        let service =
        document.getElementById("paymentService").innerHTML;



        let quantity =
        document.getElementById("paymentQuantity").innerHTML;



        let amount =
        document.getElementById("paymentAmount").innerHTML;



        let orderLink =
        document.getElementById("orderLink").value;

        let user =
JSON.parse(localStorage.getItem("rahulUser"));


let message =
"Rahul SMM Panel Order\n\n"+
"Name: "+user.username+
"\nEmail: "+user.email+
"\nService: "+service+
"\nLink: "+orderLink+
"\nQuantity: "+quantity+
"\nAmount: ₹"+amount+
"\n\nPayment Screenshot Attached";
        
        



        let url =
        "https://wa.me/919131922170?text="
        +encodeURIComponent(message);



        window.open(
            url,
            "_blank"
        );


    };


}// Wallet and Admin Data


document.addEventListener("DOMContentLoaded",()=>{


    let walletBalance =
    document.getElementById("walletBalance");


    let walletAmount =
    document.getElementById("walletAmount");



    let balance =
    localStorage.getItem("walletBalance") || "0";



    if(walletBalance){

        walletBalance.innerHTML =
        "₹" + balance;

    }



    if(walletAmount){

        walletAmount.innerHTML =
        "₹" + balance;

    }




    // Admin Total Users


    let totalUsers =
    document.getElementById("totalUsers");


    let user =
    JSON.parse(localStorage.getItem("rahulUser"));



    if(totalUsers && user){

        totalUsers.innerHTML="1";

    }




    // Admin Buttons


    let viewOrdersBtn =
    document.getElementById("viewOrdersBtn");



    if(viewOrdersBtn){

        viewOrdersBtn.onclick=function(){

            alert("Orders feature coming soon.");

        };

    }




    let viewUsersBtn =
    document.getElementById("viewUsersBtn");



    if(viewUsersBtn){

        viewUsersBtn.onclick=function(){


            let user =
            JSON.parse(localStorage.getItem("rahulUser"));



            if(user){

                alert(
                    "Username: "+user.username+
                    "\nEmail: "+user.email
                );

            }
            else{

                alert("No User Found");

            }


        };

    }




    let viewWithdrawBtn =
    document.getElementById("viewWithdrawBtn");



    if(viewWithdrawBtn){

        viewWithdrawBtn.onclick=function(){

            alert("Withdraw Requests feature coming soon.");

        };

    }


});// Initial Page Check

window.addEventListener("DOMContentLoaded",()=>{

    let status = localStorage.getItem("loginStatus");

    let auth = document.getElementById("auth-page");

    let dashboard = document.getElementById("dashboard");


    if(status === "true"){

        let user = JSON.parse(localStorage.getItem("rahulUser"));

        if(user){

            auth.style.display="none";

            dashboard.style.display="block";

            openDashboard(user.username);

        }

    }
    else{

        auth.style.display="flex";

        dashboard.style.display="none";

    }

});// First Open Website

document.addEventListener("DOMContentLoaded", function(){

    let auth = document.getElementById("auth-page");
    let dashboard = document.getElementById("dashboard");

    let status = localStorage.getItem("loginStatus");
    let user = JSON.parse(localStorage.getItem("rahulUser"));


    if(status === "true" && user){

        auth.style.display = "none";

        dashboard.style.display = "block";

        openDashboard(user.username);

    }else{

        auth.style.display = "flex";

        dashboard.style.display = "none";

    }

});// ================= FREE SERVICES =================

function startFreeFollowers() {

    alert("🎉 Free Followers system is being prepared.");

}

function startFreeLikes() {

    alert("❤️ Free Likes system is being prepared.");

}// ================= SAVE INSTAGRAM USERNAME =================

function saveInstagramUsername() {

    const username = document.getElementById("igUsername").value.trim();

    if (username === "") {
        document.getElementById("igMessage").innerHTML =
        "❌ Enter Instagram Username";
        return;
    }

    localStorage.setItem("instagramUsername", username);

    document.getElementById("igMessage").innerHTML =
    "✅ Username Saved Successfully";

}// ================= DAILY TASK & COINS =================

let coins = Number(localStorage.getItem("coins")) || 0;

function updateCoins() {

    const coinText = document.getElementById("coinBalance");

    if (coinText) {
        coinText.innerHTML = "🪙 Coins: " + coins;
    }

    localStorage.setItem("coins", coins);

}

function completeTask() {

    coins += 10;

    updateCoins();

    alert("🎉 Congratulations! You earned 10 Coins.");

}

document.addEventListener("DOMContentLoaded", function () {

    updateCoins();

});// ================= CLAIM REWARDS =================

function claimFollowers() {

    if (coins < 100) {

        document.getElementById("claimMessage").innerHTML =
        "❌ You need 100 Coins.";

        return;
    }

    coins -= 100;

    updateCoins();

    document.getElementById("claimMessage").innerHTML =
    "✅ Your Free Followers request has been submitted.";
addHistory("👥 Followers Request Submitted");
}

function claimLikes() {

    if (coins < 50) {

        document.getElementById("claimMessage").innerHTML =
        "❌ You need 50 Coins.";

        return;
    }

    coins -= 50;

    updateCoins();

    document.getElementById("claimMessage").innerHTML =
    "✅ Your Free Likes request has been submitted.";
addHistory("❤️ Likes Request Submitted");
}// ================= REQUEST HISTORY =================

function addHistory(text) {

    let history = JSON.parse(localStorage.getItem("history")) || [];

    history.unshift(text);

    localStorage.setItem("history", JSON.stringify(history));

    showHistory();

}

function showHistory() {

    const box = document.getElementById("historyBox");

    if (!box) return;

    let history = JSON.parse(localStorage.getItem("history")) || [];

    if (history.length === 0) {

        box.innerHTML = "No Requests Yet";

        return;

    }

    box.innerHTML = history.join("<br><br>");

}

document.addEventListener("DOMContentLoaded", function () {

    showHistory();

});// ================= FOLLOW & EARN =================

function followTask() {

    let followed = localStorage.getItem("followTaskDone");

    if (followed === "yes") {

        alert("✅ You already completed today's Follow Task.");

        return;

    }

    coins += 10;

    updateCoins();

    localStorage.setItem("followTaskDone", "yes");

    addHistory("📢 Follow Task Completed (+10 Coins)");

    alert("🎉 Task Completed! +10 Coins Added.");

}// ================= SELECT FOLLOWERS =================

function claimSelectedFollowers() {

    const amount = Number(document.getElementById("followersAmount").value);

    const requiredCoins = amount * 10;

    if (coins < requiredCoins) {

        document.getElementById("followersResult").innerHTML =
        "❌ You need " + requiredCoins + " Coins.";

        return;

    }

    coins -= requiredCoins;

    updateCoins();

    addHistory("👥 " + amount + " Followers Requested");

    document.getElementById("followersResult").innerHTML =
    "✅ Request Submitted for " + amount + " Followers.";

async function searchUser() {

    let username = document.getElementById("searchUser").value.trim();

    if (!username) {
        document.getElementById("searchResult").innerHTML =
        "❌ Enter Username";
        return;
    }

    const response = await fetch(
        "https://rahulsocialhub-db.09rcrg.workers.dev/api/search-user",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        }
    );

    const result = await response.json();

    if (result.success) {
        document.getElementById("searchResult").innerHTML =
        "✅ User Found: @" + result.user.username;
    } else {
        document.getElementById("searchResult").innerHTML =
        "❌ User Not Found";
    }

}

    let user = document.getElementById("searchUser").value;

    if(user.trim() === ""){
        document.getElementById("searchResult").innerHTML =
        "❌ Enter Username";
        return;
    }

    document.getElementById("searchResult").innerHTML =
    "🔍 Searching: @" + user;
}function searchUser() {

    let username = document.getElementById("searchUser").value.trim();

    if (username === "") {
        document.getElementById("searchResult").innerHTML =
        "❌ Please enter a username";
        return;
    }

    document.getElementById("searchResult").innerHTML =
    "✅ User Found: @" + username;
}