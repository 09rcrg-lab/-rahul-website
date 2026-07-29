// ================= LOADING SCREEN =================

window.addEventListener("load", function(){

    let loading = document.getElementById("loading-screen");

    if(loading){

        loading.style.display = "none";

    }

});



// ================= REGISTER SYSTEM =================

let registerBtn = document.getElementById("registerBtn");


if(registerBtn){

registerBtn.onclick = async function(){


let username = document.getElementById("regUsername").value.trim();

let email = document.getElementById("regEmail").value.trim();

let password = document.getElementById("regPassword").value.trim();

let confirm = document.getElementById("regConfirm").value.trim();



if(username=="" || email=="" || password==""){

alert("Please fill all details");

return;

}



if(password !== confirm){

alert("Password not match");

return;

}



try{


let response = await fetch(

"https://rahulsocialhub-db.09rcrg.workers.dev/api/register",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

username:username,

email:email,

password:password

})

}

);



let data = await response.json();



if(data.success){


localStorage.setItem(

"rahulUser",

JSON.stringify({

username:username,

email:email

})

);



localStorage.setItem(

"loginStatus",

"false"

);



alert("Account Created Successfully");


}

else{

alert(data.message);

}



}

catch(error){

alert("Server Error");

console.log(error);

}



};


}// ================= LOGIN SYSTEM =================

let loginBtn = document.getElementById("loginBtn");


if(loginBtn){

loginBtn.onclick = async function(){


let email = document.getElementById("loginEmail").value.trim();

let password = document.getElementById("loginPassword").value.trim();



if(email=="" || password==""){

alert("Please fill all details");

return;

}



try{


let response = await fetch(

"https://rahulsocialhub-db.09rcrg.workers.dev/api/login",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email:email,

password:password

})

}

);



let data = await response.json();



if(data.success){


localStorage.setItem(

"rahulUser",

JSON.stringify(data.user)

);



localStorage.setItem(

"loginStatus",

"true"

);



openDashboard(data.user.username);



}

else{


alert(data.message);


}



}

catch(error){

console.log(error);

alert("Server Error");

}



};


}




// ================= OPEN DASHBOARD =================


function openDashboard(username){


let authPage = document.getElementById("auth-page");

let dashboard = document.getElementById("dashboard");



if(authPage){

authPage.style.display="none";

}



if(dashboard){

dashboard.style.display="block";

}



let userNameBox = document.getElementById("username");


if(userNameBox){

userNameBox.innerHTML = username;

}



}// ================= AUTO LOGIN CHECK =================

window.addEventListener("DOMContentLoaded", function(){


let status = localStorage.getItem("loginStatus");

let user = JSON.parse(localStorage.getItem("rahulUser"));



if(status === "true" && user){


openDashboard(user.username);


}


});




// ================= LOGOUT SYSTEM =================


let logoutBtn = document.getElementById("logoutBtn");


if(logoutBtn){


logoutBtn.onclick = function(){


localStorage.removeItem("loginStatus");

localStorage.removeItem("rahulUser");


location.reload();


};


}// ================= PROFILE DATA =================

document.addEventListener("DOMContentLoaded", function(){


let user = JSON.parse(localStorage.getItem("rahulUser"));



let profileUsername = document.getElementById("profileUsername");

let profileEmail = document.getElementById("profileEmail");



if(user){


if(profileUsername){

profileUsername.innerHTML = user.username;

}



if(profileEmail){

profileEmail.innerHTML = user.email;

}



}



});




// ================= SIDEBAR PAGE SWITCH =================


let menuButtons = document.querySelectorAll(".menu");

let pages = document.querySelectorAll(".page");



menuButtons.forEach(function(button){


button.onclick = function(){


let pageName = this.getAttribute("data-page");



pages.forEach(function(page){

page.classList.remove("active");

});



let openPage = document.getElementById(pageName);



if(openPage){

openPage.classList.add("active");

}



menuButtons.forEach(function(btn){

btn.classList.remove("active");

});



this.classList.add("active");



};



});// ================= SERVICES SYSTEM =================

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
}

];



let serviceList = document.getElementById("serviceList");


if(serviceList){


services.forEach(function(service){


let div = document.createElement("div");


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


}




// ================= ORDER SYSTEM =================


function orderService(serviceName){


let service = services.find(function(item){

return item.name === serviceName;

});



if(!service){

return;

}



let pages = document.querySelectorAll(".page");


pages.forEach(function(page){

page.classList.remove("active");

});



let payment = document.getElementById("payment");


if(payment){

payment.classList.add("active");

}



let paymentService = document.getElementById("paymentService");

let paymentQuantity = document.getElementById("paymentQuantity");

let paymentAmount = document.getElementById("paymentAmount");



if(paymentService){

paymentService.innerHTML = service.name;

}


if(paymentQuantity){

paymentQuantity.innerHTML = service.quantity;

}


if(paymentAmount){

paymentAmount.innerHTML = service.amount;

}


}// ================= PAYMENT SYSTEM =================

function generateQR(){


let upi = "yourupi@upi";


let qrCode = document.getElementById("paymentQr");


if(qrCode){


let qrImage =
"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="
+
encodeURIComponent(upi);



qrCode.innerHTML = `

<img src="${qrImage}" width="200">

<p>Scan करके Payment करें</p>

`;

}


}




// ================= WHATSAPP ORDER =================


let whatsappOrderBtn = document.getElementById("whatsappOrderBtn");


if(whatsappOrderBtn){


whatsappOrderBtn.onclick = function(){



let user = JSON.parse(
localStorage.getItem("rahulUser")
);



let service =
document.getElementById("paymentService").innerHTML;



let quantity =
document.getElementById("paymentQuantity").innerHTML;



let amount =
document.getElementById("paymentAmount").innerHTML;



let orderLink =
document.getElementById("orderLink").value;



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

+

encodeURIComponent(message);



window.open(url,"_blank");



};


}// ================= WALLET SYSTEM =================


let coins = Number(localStorage.getItem("coins")) || 0;



function updateCoins(){


let coinBalance = document.getElementById("coinBalance");


if(coinBalance){

coinBalance.innerHTML = "🪙 Coins: " + coins;

}


localStorage.setItem(
"coins",
coins
);


}




// ================= DAILY TASK =================


function completeTask(){


coins += 10;


updateCoins();


alert("🎉 Congratulations! You earned 10 Coins.");


}




// ================= FOLLOW TASK =================


function followTask(){


let done = localStorage.getItem("followTaskDone");



if(done === "yes"){


alert("✅ You already completed today's task.");

return;


}



coins += 10;


updateCoins();



localStorage.setItem(
"followTaskDone",
"yes"
);



alert("🎉 Follow Task Completed +10 Coins");


}




document.addEventListener("DOMContentLoaded",function(){


updateCoins();


});// ================= REFERRAL SYSTEM =================


let referralCode = localStorage.getItem("referralCode");


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

referralBox.innerHTML = referralCode;

}





let copyReferralBtn =
document.getElementById("copyReferralBtn");



if(copyReferralBtn){


copyReferralBtn.onclick = function(){


navigator.clipboard.writeText(referralCode);


alert("Referral Code Copied");


};


}





// ================= HISTORY SYSTEM =================


function addHistory(text){


let history = JSON.parse(
localStorage.getItem("history")
) || [];



history.unshift(text);



localStorage.setItem(
"history",
JSON.stringify(history)
);



showHistory();


}





function showHistory(){


let box =
document.getElementById("historyBox");



if(!box){

return;

}



let history = JSON.parse(
localStorage.getItem("history")
) || [];



if(history.length === 0){


box.innerHTML = "No Requests Yet";


return;


}



box.innerHTML =
history.join("<br><br>");



}




document.addEventListener("DOMContentLoaded",function(){


showHistory();


});// ================= FREE REWARDS SYSTEM =================


function claimFollowers(){


if(coins < 100){


let msg = document.getElementById("claimMessage");


if(msg){

msg.innerHTML = "❌ You need 100 Coins.";

}


return;


}



coins -= 100;


updateCoins();



addHistory("👥 Followers Request Submitted");



let msg = document.getElementById("claimMessage");


if(msg){

msg.innerHTML =
"✅ Your Free Followers request has been submitted.";

}


}





function claimLikes(){


if(coins < 50){


let msg = document.getElementById("claimMessage");


if(msg){

msg.innerHTML = "❌ You need 50 Coins.";

}


return;


}



coins -= 50;


updateCoins();



addHistory("❤️ Likes Request Submitted");



let msg = document.getElementById("claimMessage");


if(msg){

msg.innerHTML =
"✅ Your Free Likes request has been submitted.";

}


}





// ================= SELECT FOLLOWERS =================


function claimSelectedFollowers(){


let amount =
Number(document.getElementById("followersAmount").value);



let requiredCoins = amount * 10;



if(coins < requiredCoins){


let result =
document.getElementById("followersResult");


if(result){

result.innerHTML =
"❌ You need " + requiredCoins + " Coins.";

}


return;


}



coins -= requiredCoins;


updateCoins();



addHistory(
"👥 " + amount + " Followers Requested"
);



let result =
document.getElementById("followersResult");


if(result){

result.innerHTML =
"✅ Request Submitted for " + amount + " Followers.";

}


}// ================= SAVE INSTAGRAM USERNAME =================


async function saveInstagram(){


let instagram =
document.getElementById("instagramUsername").value.trim();



let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(!instagram){

alert("Enter Instagram Username");

return;

}



if(!user){

alert("Please Login First");

return;

}



let response = await fetch(

"https://rahulsocialhub-db.09rcrg.workers.dev/api/save-instagram",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email:user.email,

instagram:instagram

})

}

);



let result = await response.json();



alert(result.message);



}




// ================= SEARCH USER =================


async function searchUser(){


let username =
document.getElementById("searchUser").value.trim();



if(!username){


document.getElementById("searchResult").innerHTML =
"❌ Enter Username";


return;


}



let response = await fetch(

"https://rahulsocialhub-db.09rcrg.workers.dev/api/search-user",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

username:username

})

}

);



let result = await response.json();



if(result.success){


document.getElementById("searchResult").innerHTML =

"✅ User Found: @" + result.user.username;


}
else{


document.getElementById("searchResult").innerHTML =

"❌ User Not Found";


}


}// ================= FIRST PAGE CHECK =================


document.addEventListener("DOMContentLoaded", function(){


let authPage =
document.getElementById("auth-page");


let dashboard =
document.getElementById("dashboard");



let status =
localStorage.getItem("loginStatus");



let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(status === "true" && user){



if(authPage){

authPage.style.display="none";

}



if(dashboard){

dashboard.style.display="block";

}



openDashboard(user.username);



}
else{


if(authPage){

authPage.style.display="flex";

}



if(dashboard){

dashboard.style.display="none";

}


}


});// ================= ADMIN SYSTEM =================


document.addEventListener("DOMContentLoaded", function(){



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



});// ================= SYSTEM CHECK =================


window.addEventListener("load", function(){


console.log("Rahul SMM Panel Script Loaded ✅");



let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(user){

console.log(
"Logged User:",
user.username
);


}
else{


console.log(
"No User Login"
);


}



});// ================= USER SESSION CHECK =================


function getCurrentUser(){


let user =
localStorage.getItem("rahulUser");



if(user){

return JSON.parse(user);

}


return null;


}




function isLogin(){


return localStorage.getItem("loginStatus") === "true";


}




// ================= KEEP SESSION =================


window.addEventListener("load",function(){



let user = getCurrentUser();



if(isLogin() && user){


console.log(
"Session Active:",
user.username
);


}
else{


console.log(
"Please Login"
);


}



});// ================= DASHBOARD USER INFO =================


function loadUserProfile(){


let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(!user){

return;

}



let usernameBox =
document.getElementById("username");


let profileUsername =
document.getElementById("profileUsername");


let profileEmail =
document.getElementById("profileEmail");



if(usernameBox){

usernameBox.innerHTML = user.username;

}



if(profileUsername){

profileUsername.innerHTML = user.username;

}



if(profileEmail){

profileEmail.innerHTML = user.email;

}



}




document.addEventListener(
"DOMContentLoaded",
function(){

loadUserProfile();

});// ================= LOGOUT SYSTEM =================


let logoutButton = document.getElementById("logoutBtn");


if(logoutButton){


logoutButton.onclick = function(){


localStorage.removeItem("loginStatus");

localStorage.removeItem("rahulUser");

localStorage.removeItem("email");



let authPage =
document.getElementById("auth-page");


let dashboard =
document.getElementById("dashboard");



if(authPage){

authPage.style.display="flex";

}



if(dashboard){

dashboard.style.display="none";

}



alert("Logged Out Successfully");


};


}// ================= ORDER HISTORY SAVE =================


function saveOrderHistory(service, amount, quantity){


let orders =
JSON.parse(localStorage.getItem("orders")) || [];



let order = {

service: service,

amount: amount,

quantity: quantity,

date: new Date().toLocaleString()

};



orders.unshift(order);



localStorage.setItem(
"orders",
JSON.stringify(orders)
);



}




// ================= SHOW ORDER HISTORY =================


function showOrders(){


let box =
document.getElementById("orderHistory");



if(!box){

return;

}



let orders =
JSON.parse(localStorage.getItem("orders")) || [];



if(orders.length === 0){


box.innerHTML = "No Orders Yet";


return;


}



box.innerHTML = "";



orders.forEach(function(order){


box.innerHTML += `

<div class="order-card">

<h4>${order.service}</h4>

<p>Quantity: ${order.quantity}</p>

<p>Amount: ₹${order.amount}</p>

<p>${order.date}</p>

</div>

`;


});


}



document.addEventListener(
"DOMContentLoaded",
function(){

showOrders();

});// ================= CONNECT ORDER WITH HISTORY =================


function confirmOrder(){


let service =
document.getElementById("paymentService");

let quantity =
document.getElementById("paymentQuantity");

let amount =
document.getElementById("paymentAmount");



if(!service || !quantity || !amount){

alert("Order details missing");

return;

}



saveOrderHistory(

service.innerHTML,

amount.innerHTML,

quantity.innerHTML

);



alert("✅ Order Saved Successfully");


}// ================= PAYMENT QR SYSTEM =================


function generatePaymentQR(){


let qrBox =
document.getElementById("paymentQr");



if(!qrBox){

return;

}


// बाद में यहाँ अपना UPI ID डालना

let upiId = "yourupi@upi";



let qrImage =

"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="

+

encodeURIComponent(

"upi://pay?pa=" + upiId

);



qrBox.innerHTML = `

<img src="${qrImage}" width="200">

<p>Scan करके Payment करें</p>

`;



}// ================= WALLET SYSTEM =================


function loadWallet(){


let balance =
localStorage.getItem("walletBalance") || "0";



let walletBalance =
document.getElementById("walletBalance");

let walletAmount =
document.getElementById("walletAmount");



if(walletBalance){

walletBalance.innerHTML =
"₹" + balance;

}



if(walletAmount){

walletAmount.innerHTML =
"₹" + balance;

}


}




function addWallet(amount){


let oldBalance =
Number(localStorage.getItem("walletBalance")) || 0;



let newBalance =
oldBalance + Number(amount);



localStorage.setItem(
"walletBalance",
newBalance
);



loadWallet();



alert("₹" + amount + " Added Successfully");


}




document.addEventListener(
"DOMContentLoaded",
function(){

loadWallet();

});// ================= WITHDRAW SYSTEM =================


function requestWithdraw(){


let amount =
document.getElementById("withdrawAmount").value.trim();



if(amount === ""){

alert("Enter Withdraw Amount");

return;

}



let balance =
Number(localStorage.getItem("walletBalance")) || 0;



if(Number(amount) > balance){

alert("Insufficient Balance");

return;

}



let withdraws =
JSON.parse(localStorage.getItem("withdraws")) || [];



withdraws.unshift({

amount: amount,

status:"Pending",

date:new Date().toLocaleString("en-IN")

});



localStorage.setItem(
"withdraws",
JSON.stringify(withdraws)
);



alert("✅ Withdraw Request Submitted");



}// ================= WITHDRAW HISTORY =================


function showWithdrawHistory(){


let box =
document.getElementById("withdrawHistory");



if(!box){

return;

}



let withdraws =
JSON.parse(localStorage.getItem("withdraws")) || [];



if(withdraws.length === 0){


box.innerHTML = "No Withdraw Requests";


return;


}



box.innerHTML = "";



withdraws.forEach(function(item){


box.innerHTML += `

<div class="withdraw-card">

<p>Amount: ₹${item.amount}</p>

<p>Status: ${item.status}</p>

<p>Date: ${item.date}</p>

</div>

`;


});



}




document.addEventListener(
"DOMContentLoaded",
function(){

showWithdrawHistory();

});// ================= REFERRAL COUNT SYSTEM =================


function addReferral(){


let count =
Number(localStorage.getItem("referralCount")) || 0;



count = count + 1;



localStorage.setItem(
"referralCount",
count
);



showReferralCount();


}




function showReferralCount(){


let box =
document.getElementById("referralCount");



if(!box){

return;

}



let count =
localStorage.getItem("referralCount") || 0;



box.innerHTML =
"👥 Referrals: " + count;



}



document.addEventListener(
"DOMContentLoaded",
function(){

showReferralCount();

});// ================= TASK HISTORY SYSTEM =================


function saveTaskHistory(taskName){


let tasks =
JSON.parse(localStorage.getItem("taskHistory")) || [];



tasks.unshift({

task: taskName,

date: new Date().toLocaleString("en-IN")

});



localStorage.setItem(
"taskHistory",
JSON.stringify(tasks)
);



showTaskHistory();


}





function showTaskHistory(){


let box =
document.getElementById("taskHistory");



if(!box){

return;

}



let tasks =
JSON.parse(localStorage.getItem("taskHistory")) || [];



if(tasks.length === 0){


box.innerHTML = "No Tasks Completed";


return;


}



box.innerHTML = "";



tasks.forEach(function(item){


box.innerHTML += `

<div class="task-card">

<p>✅ ${item.task}</p>

<small>${item.date}</small>

</div>

`;


});


}




document.addEventListener(
"DOMContentLoaded",
function(){

showTaskHistory();

});// ================= INSTAGRAM PROFILE SAVE =================


function saveInstagramLocal(){


let input =
document.getElementById("igUsername");



if(!input){

return;

}



let username =
input.value.trim();



if(username === ""){


alert("Enter Instagram Username");


return;


}



localStorage.setItem(
"instagramUsername",
username
);



showInstagramUsername();



alert("✅ Instagram Username Saved");


}




function showInstagramUsername(){


let box =
document.getElementById("savedInstagram");



if(!box){

return;

}



let username =
localStorage.getItem("instagramUsername");



if(username){


box.innerHTML =
"Instagram: @" + username;


}
else{


box.innerHTML =
"No Instagram Saved";


}



}



document.addEventListener(
"DOMContentLoaded",
function(){

showInstagramUsername();

});// ================= NOTIFICATION SYSTEM =================


function showNotification(message){


let box =
document.getElementById("notificationBox");



if(!box){

alert(message);

return;

}



box.innerHTML = message;



setTimeout(function(){


box.innerHTML = "";


},3000);



}// ================= MOBILE MENU SYSTEM =================


let menuBtn =
document.getElementById("menuBtn");


let sidebar =
document.getElementById("sidebar");



if(menuBtn && sidebar){


menuBtn.onclick = function(){


if(sidebar.style.display === "block"){


sidebar.style.display = "none";


}
else{


sidebar.style.display = "block";


}


};


}// ================= BUTTON SAFETY SYSTEM =================


function safeClick(id, callback){


let element =
document.getElementById(id);



if(element){


element.onclick = callback;


}


}



// Example usage

safeClick("dailyBonusBtn", function(){


let coins =
Number(localStorage.getItem("coins")) || 0;



coins += 5;



localStorage.setItem(
"coins",
coins
);



alert("🎁 Daily Bonus +5 Coins Added");


});// ================= DAILY BONUS SYSTEM =================


function claimDailyBonus(){


let lastBonus =
localStorage.getItem("lastBonusDate");



let today =
new Date().toLocaleDateString("en-IN");



if(lastBonus === today){


alert("🎁 Daily Bonus Already Claimed");


return;


}



let coins =
Number(localStorage.getItem("coins")) || 0;



coins += 5;



localStorage.setItem(
"coins",
coins
);



localStorage.setItem(
"lastBonusDate",
today
);



if(typeof updateCoins === "function"){

updateCoins();

}



alert("🎉 Daily Bonus +5 Coins Added");


}// ================= COIN DISPLAY SYSTEM =================


function showCoinBalance(){


let coinBox =
document.getElementById("coinBalance");



if(!coinBox){

return;

}



let coins =
localStorage.getItem("coins") || "0";



coinBox.innerHTML =
"🪙 Coins: " + coins;



}




document.addEventListener(
"DOMContentLoaded",
function(){

showCoinBalance();

});// ================= USER ACTIVITY SYSTEM =================


function saveActivity(text){


let activities =
JSON.parse(localStorage.getItem("activities")) || [];



activities.unshift({

text:text,

date:new Date().toLocaleString("en-IN")

});



localStorage.setItem(
"activities",
JSON.stringify(activities)
);



showActivity();


}




function showActivity(){


let box =
document.getElementById("activityBox");



if(!box){

return;

}



let activities =
JSON.parse(localStorage.getItem("activities")) || [];



if(activities.length === 0){


box.innerHTML = "No Activity Yet";


return;


}



box.innerHTML = "";



activities.slice(0,10).forEach(function(item){


box.innerHTML += `

<div class="activity-item">

<p>${item.text}</p>

<small>${item.date}</small>

</div>

`;



});


}




document.addEventListener(
"DOMContentLoaded",
function(){

showActivity();

});// ================= ACTIVITY HELPER =================


function addUserActivity(message){


if(typeof saveActivity === "function"){


saveActivity(message);


}


}




// Example functions


function activityRegister(){


addUserActivity(
"✅ Account Created"
);


}




function activityOrder(service){


addUserActivity(
"🛒 Order Placed: " + service
);


}




function activityTask(){


addUserActivity(
"🎯 Task Completed"
);


}// ================= APP START CHECK =================


window.addEventListener("load", function(){


let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(user){


console.log(
"Welcome Back: " + user.username
);


}
else{


console.log(
"Guest User"
);


}



});// ================= DASHBOARD REFRESH SYSTEM =================


function refreshDashboard(){


let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(!user){

return;

}



let nameBox =
document.getElementById("username");


let emailBox =
document.getElementById("profileEmail");



if(nameBox){

nameBox.innerHTML = user.username;

}



if(emailBox){

emailBox.innerHTML = user.email;

}



}




document.addEventListener(
"DOMContentLoaded",
function(){

refreshDashboard();

});// ================= AUTH GUARD SYSTEM =================


function checkAuth(){


let status =
localStorage.getItem("loginStatus");


let user =
JSON.parse(localStorage.getItem("rahulUser"));



let authPage =
document.getElementById("auth-page");


let dashboard =
document.getElementById("dashboard");



if(status === "true" && user){


if(authPage){

authPage.style.display="none";

}


if(dashboard){

dashboard.style.display="block";

}



}
else{


if(authPage){

authPage.style.display="flex";

}


if(dashboard){

dashboard.style.display="none";

}


}


}



document.addEventListener(
"DOMContentLoaded",
function(){

checkAuth();

});// ================= LAST LOGIN SYSTEM =================


function saveLastLogin(){


let time =
new Date().toLocaleString("en-IN");


localStorage.setItem(
"lastLogin",
time
);


}



function showLastLogin(){


let box =
document.getElementById("lastLogin");



if(!box){

return;

}



let time =
localStorage.getItem("lastLogin");



if(time){

box.innerHTML =
"Last Login: " + time;

}
else{

box.innerHTML =
"Last Login: First Time";

}


}




document.addEventListener(
"DOMContentLoaded",
function(){

showLastLogin();

});// ================= LOGIN ACTIVITY SYSTEM =================


function saveLoginActivity(){


let time =
new Date().toLocaleString("en-IN");



localStorage.setItem(
"lastLogin",
time
);



if(typeof addUserActivity === "function"){


addUserActivity(
"🔐 User Logged In"
);


}


}// ================= LOGIN SUCCESS HANDLER =================


function afterLoginSuccess(){


saveLoginActivity();



let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(user && typeof openDashboard === "function"){


openDashboard(user.username);


}


}// ================= USER SETTINGS SYSTEM =================


function saveUserSetting(key, value){


let settings =
JSON.parse(localStorage.getItem("userSettings")) || {};



settings[key] = value;



localStorage.setItem(
"userSettings",
JSON.stringify(settings)
);



}




function getUserSetting(key){


let settings =
JSON.parse(localStorage.getItem("userSettings")) || {};



return settings[key] || null;



}// ================= NOTIFICATION HISTORY SYSTEM =================


function saveNotification(message){


let notifications =
JSON.parse(localStorage.getItem("notifications")) || [];



notifications.unshift({

message: message,

date: new Date().toLocaleString("en-IN")

});



localStorage.setItem(
"notifications",
JSON.stringify(notifications)
);



showNotifications();


}




function showNotifications(){


let box =
document.getElementById("notificationList");



if(!box){

return;

}



let notifications =
JSON.parse(localStorage.getItem("notifications")) || [];



if(notifications.length === 0){


box.innerHTML = "No Notifications";


return;


}



box.innerHTML = "";



notifications.slice(0,10).forEach(function(item){


box.innerHTML += `

<div class="notification-item">

<p>${item.message}</p>

<small>${item.date}</small>

</div>

`;


});


}




document.addEventListener(
"DOMContentLoaded",
function(){

showNotifications();

});// ================= NOTIFICATION COUNT SYSTEM =================


function updateNotificationCount(){


let box =
document.getElementById("notificationCount");



if(!box){

return;

}



let notifications =
JSON.parse(localStorage.getItem("notifications")) || [];



box.innerHTML =
notifications.length;



}




function markNotificationsRead(){


localStorage.setItem(
"notificationsRead",
"true"
);



let count =
document.getElementById("notificationCount");



if(count){

count.innerHTML = "0";

}



}




document.addEventListener(
"DOMContentLoaded",
function(){

updateNotificationCount();

});// ================= PROFILE IMAGE SYSTEM =================


function saveProfileImage(imageUrl){


localStorage.setItem(
"profileImage",
imageUrl
);


showProfileImage();


}




function showProfileImage(){


let img =
document.getElementById("profileImage");



if(!img){

return;

}



let image =
localStorage.getItem("profileImage");



if(image){


img.src = image;


}



}




document.addEventListener(
"DOMContentLoaded",
function(){

showProfileImage();

});// ================= PROFILE NAME UPDATE =================


function updateProfileName(){


let input =
document.getElementById("newProfileName");



if(!input){

return;

}



let newName =
input.value.trim();



if(newName === ""){

alert("Enter Profile Name");

return;

}



let user =
JSON.parse(localStorage.getItem("rahulUser"));



if(user){


user.username = newName;



localStorage.setItem(
"rahulUser",
JSON.stringify(user)
);



if(typeof refreshDashboard === "function"){

refreshDashboard();

}



alert("✅ Profile Updated");


}


}// ================= USER DATA BACKUP SYSTEM =================


function exportUserData(){


let user =
JSON.parse(localStorage.getItem("rahulUser"));

let orders =
JSON.parse(localStorage.getItem("orders")) || [];

let history =
JSON.parse(localStorage.getItem("history")) || [];

let coins =
localStorage.getItem("coins") || "0";



let data = {

user:user,

orders:orders,

history:history,

coins:coins

};



let file = new Blob(
[
JSON.stringify(data,null,2)
],
{
type:"application/json"
}
);



let link = document.createElement("a");


link.href =
URL.createObjectURL(file);


link.download =
"rahul-user-data.json";


link.click();


}// ================= USER DATA RESTORE SYSTEM =================


function importUserData(event){


let file =
event.target.files[0];



if(!file){

return;

}



let reader =
new FileReader();



reader.onload = function(e){



try{


let data =
JSON.parse(e.target.result);



if(data.user){


localStorage.setItem(

"rahulUser",

JSON.stringify(data.user)

);


}



if(data.orders){


localStorage.setItem(

"orders",

JSON.stringify(data.orders)

);


}



if(data.history){


localStorage.setItem(

"history",

JSON.stringify(data.history)

);


}



if(data.coins){


localStorage.setItem(

"coins",

data.coins

);


}



alert("✅ Data Restored Successfully");

location.reload();



}

catch(error){


alert("❌ Invalid Backup File");


}



};



reader.readAsText(file);



}// ================= APP INFO SYSTEM =================


function showAppInfo(){


let box =
document.getElementById("appInfo");



if(!box){

return;

}



box.innerHTML = `

<p>Rahul SMM Panel</p>

<p>Version: 1.0</p>

<p>Status: Online 🚀</p>

`;



}// ================= SUPPORT SYSTEM =================


function sendSupportMessage(){


let messageBox =
document.getElementById("supportMessage");



if(!messageBox){

return;

}



let message =
messageBox.value.trim();



if(message === ""){


alert("Enter Your Message");

return;


}



let user =
JSON.parse(localStorage.getItem("rahulUser"));



let support =
JSON.parse(localStorage.getItem("supportMessages")) || [];



support.unshift({

username: user ? user.username : "Guest",

message: message,

date: new Date().toLocaleString("en-IN")

});



localStorage.setItem(
"supportMessages",
JSON.stringify(support)
);



messageBox.value = "";


alert("✅ Message Sent Successfully");


}// ================= SUPPORT HISTORY SYSTEM =================


function showSupportMessages(){


let box =
document.getElementById("supportHistory");



if(!box){

return;

}



let messages =
JSON.parse(localStorage.getItem("supportMessages")) || [];



if(messages.length === 0){


box.innerHTML = "No Messages";


return;


}



box.innerHTML = "";



messages.forEach(function(item){


box.innerHTML += `

<div class="support-card">

<p><b>${item.username}</b></p>

<p>${item.message}</p>

<small>${item.date}</small>

</div>

`;


});


}




document.addEventListener(
"DOMContentLoaded",
function(){

showSupportMessages();

});// ================= CONNECTION STATUS SYSTEM =================


async function checkConnection(){


let box =
document.getElementById("connectionStatus");



try{


let response = await fetch(
"https://rahulsocialhub-db.09rcrg.workers.dev/"
);



if(response.ok){


if(box){

box.innerHTML =
"🟢 Server Online";

}


}
else{


if(box){

box.innerHTML =
"🔴 Server Error";

}


}



}

catch(error){


if(box){

box.innerHTML =
"🔴 Offline";

}


}



}



document.addEventListener(
"DOMContentLoaded",
function(){

checkConnection();

});// ================= UPDATE NOTICE SYSTEM =================


function showUpdateNotice(message){


let box =
document.getElementById("updateNotice");



if(!box){

return;

}



box.innerHTML = message;



box.style.display = "block";



setTimeout(function(){


box.style.display = "none";


},5000);



}




document.addEventListener(
"DOMContentLoaded",
function(){


let notice =
localStorage.getItem("updateNotice");



if(notice){


showUpdateNotice(notice);


}



});