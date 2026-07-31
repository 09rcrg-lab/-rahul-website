// ===================================
// InstaBoost Hub
// Main JavaScript
// ===================================


// Cloudflare Worker API URL

const API_URL = "https://rahulsocialhub-db.09rcrg.workers.dev";


// Current User

let currentUser = JSON.parse(
    localStorage.getItem("user")
) || null;



// ===================================
// Loading Screen
// ===================================

window.addEventListener("load", () => {

    const loader = document.getElementById("loadingScreen");

    if(loader){

        setTimeout(() => {

            loader.style.display = "none";

        },1000);

    }

});



// ===================================
// Notification
// ===================================

function showNotification(message){

    const box = document.getElementById(
        "notificationBox"
    );

    if(!box) return;


    box.innerHTML = message;


    setTimeout(()=>{

        box.innerHTML = "";

    },3000);

}



// ===================================
// Register
// ===================================

const registerButton =
document.getElementById("registerSubmit");


if(registerButton){


registerButton.onclick = async ()=>{


const username =
document.getElementById("registerUsername").value;


const email =
document.getElementById("registerEmail").value;


const password =
document.getElementById("registerPassword").value;



if(!username || !email || !password){

showNotification(
"Please fill all details"
);

return;

}



try{


const response = await fetch(
API_URL + "/api/register",
{

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


const data =
await response.json();



if(data.success){

showNotification(
"Registration Successful"
);


}else{


showNotification(
data.message
);


}



}catch(error){


showNotification(
"Server Error"
);


}



};


}// ===================================
// Login System
// ===================================


const loginButton =
document.getElementById("loginSubmit");


if(loginButton){


loginButton.onclick = async ()=>{


const email =
document.getElementById("loginEmail").value;


const password =
document.getElementById("loginPassword").value;



if(!email || !password){

showNotification(
"Enter Email and Password"
);

return;

}



try{


const response = await fetch(

API_URL + "/api/login",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email,
password

})

}

);



const data =
await response.json();



if(data.success){


localStorage.setItem(

"user",

JSON.stringify(data.user)

);



currentUser = data.user;



showNotification(
"Login Successful"
);



loadUserProfile();



}else{


showNotification(
data.message
);


}



}catch(error){


showNotification(
"Login Server Error"
);


}



};


}




// ===================================
// Load User Profile
// ===================================


function loadUserProfile(){


if(!currentUser)
return;



const username =
document.getElementById(
"profileUsername"
);


const email =
document.getElementById(
"profileEmail"
);



const wallet =
document.getElementById(
"profileWallet"
);



const coins =
document.getElementById(
"profileCoins"
);



if(username)
username.innerHTML =
"Username: " + currentUser.username;



if(email)
email.innerHTML =
"Email: " + currentUser.email;



if(wallet)
wallet.innerHTML =
"Wallet: ₹" + (currentUser.wallet || 0);



if(coins)
coins.innerHTML =
"Coins: " + (currentUser.coins || 0);



}



window.addEventListener(
"DOMContentLoaded",
()=>{

loadUserProfile();

});// ===================================
// Login System
// ===================================


const loginButton =
document.getElementById("loginSubmit");


if(loginButton){


loginButton.onclick = async ()=>{


const email =
document.getElementById("loginEmail").value;


const password =
document.getElementById("loginPassword").value;



if(!email || !password){

showNotification(
"Enter Email and Password"
);

return;

}



try{


const response = await fetch(

API_URL + "/api/login",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email,
password

})

}

);



const data =
await response.json();



if(data.success){


localStorage.setItem(

"user",

JSON.stringify(data.user)

);



currentUser = data.user;



showNotification(
"Login Successful"
);



loadUserProfile();



}else{


showNotification(
data.message
);


}



}catch(error){


showNotification(
"Login Server Error"
);


}



};


}




// ===================================
// Load User Profile
// ===================================


function loadUserProfile(){


if(!currentUser)
return;



const username =
document.getElementById(
"profileUsername"
);


const email =
document.getElementById(
"profileEmail"
);



const wallet =
document.getElementById(
"profileWallet"
);



const coins =
document.getElementById(
"profileCoins"
);



if(username)
username.innerHTML =
"Username: " + currentUser.username;



if(email)
email.innerHTML =
"Email: " + currentUser.email;



if(wallet)
wallet.innerHTML =
"Wallet: ₹" + (currentUser.wallet || 0);



if(coins)
coins.innerHTML =
"Coins: " + (currentUser.coins || 0);



}



window.addEventListener(
"DOMContentLoaded",
()=>{

loadUserProfile();

});// ===================================
// Confirm Order
// ===================================


const orderButton =
document.getElementById(
"confirmOrder"
);



if(orderButton){


orderButton.onclick = async ()=>{


if(!currentUser){

showNotification(
"Please Login First"
);

return;

}



const instagramUsername =
document.getElementById(
"instagramUsername"
).value;



const quantity =
document.getElementById(
"serviceQuantity"
).value;



if(!instagramUsername || !quantity){

showNotification(
"Fill Order Details"
);

return;

}



try{


const response =
await fetch(

API_URL + "/api/order",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

user_id: currentUser.id,

instagram_username:
instagramUsername,

service_id:
selectedService,

quantity:
quantity,

amount:
0

})

}

);



const data =
await response.json();



if(data.success){


showNotification(
"Order Created Successfully"
);



document.getElementById(
"orderPopup"
).style.display="none";



}else{


showNotification(
data.message
);


}



}catch(error){


showNotification(
"Order Error"
);


}



};


}





// ===================================
// Wallet Load
// ===================================


async function loadWallet(){


if(!currentUser)
return;



try{


const response =
await fetch(

API_URL +
"/api/wallet?user_id=" +
currentUser.id

);



const data =
await response.json();



if(data.success){


const wallet =
document.getElementById(
"walletBalance"
);



const coins =
document.getElementById(
"coinBalance"
);



if(wallet)
wallet.innerHTML =
"₹"+data.wallet;



if(coins)
coins.innerHTML =
data.coins;



}



}catch(error){


console.log(error);


}


}



window.addEventListener(
"DOMContentLoaded",
()=>{

loadWallet();

});// ===================================
// WhatsApp Payment Button
// ===================================


const whatsappBtn =
document.getElementById(
"whatsappOrderBtn"
);



if(whatsappBtn){


whatsappBtn.onclick = ()=>{


const message =
encodeURIComponent(
"Hello InstaBoost Hub, I have completed payment. Here is my screenshot."
);



window.open(

"https://wa.me/?text=" + message,

"_blank"

);


};


}





// ===================================
// Referral Code
// ===================================


function generateReferral(){


if(!currentUser)
return;



const box =
document.getElementById(
"referralCode"
);



if(box){


box.value =
"REF" + currentUser.id + "HUB";


}


}



const copyReferral =
document.getElementById(
"copyReferral"
);



if(copyReferral){


copyReferral.onclick = ()=>{


const code =
document.getElementById(
"referralCode"
);



if(code){


navigator.clipboard.writeText(
code.value
);


showNotification(
"Referral Code Copied"
);


}


};


}





// ===================================
// Daily Reward
// ===================================


const dailyBtn =
document.getElementById(
"claimDaily"
);



if(dailyBtn){


dailyBtn.onclick = async ()=>{


if(!currentUser){

showNotification(
"Login Required"
);

return;

}



try{


const response =
await fetch(

API_URL +
"/api/daily-reward",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

user_id:
currentUser.id

})

}

);



const data =
await response.json();



showNotification(
data.message
);



}catch(error){


showNotification(
"Reward Error"
);


}



};


}



window.addEventListener(
"DOMContentLoaded",
()=>{

generateReferral();

});// ===================================
// Start Button Scroll
// ===================================

const startBtn =
document.getElementById("startBtn");


if(startBtn){

    startBtn.onclick = ()=>{

        document.getElementById(
            "services"
        ).scrollIntoView({
            behavior:"smooth"
        });

    };

}



// ===================================
// Add Funds Button
// ===================================

const addFundsBtn =
document.getElementById("addFundsBtn");


if(addFundsBtn){

    addFundsBtn.onclick = ()=>{

        const payment =
        document.getElementById(
            "paymentSection"
        );

        if(payment){

            payment.scrollIntoView({
                behavior:"smooth"
            });

        }

    };

}



// ===================================
// WhatsApp Support
// ===================================

const supportBtn =
document.getElementById(
"contactWhatsapp"
);


if(supportBtn){

    supportBtn.onclick = ()=>{

        window.open(
        "https://wa.me/?text=Hello InstaBoost Hub Support",
        "_blank"
        );

    };

}



// ===================================
// Logout
// ===================================

function logout(){

    localStorage.removeItem("user");

    currentUser = null;

    showNotification(
        "Logged Out"
    );

}



// ===================================
// Auto Refresh User
// ===================================

setInterval(()=>{

    if(currentUser){

        loadWallet();

    }

},30000);