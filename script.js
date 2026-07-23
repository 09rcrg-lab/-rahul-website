// Rahul Social Hub - Script

document.addEventListener("DOMContentLoaded", () => {

    console.log("Rahul Social Hub Loaded");


    // Button Click Animation
    document.querySelectorAll("button").forEach(btn => {

        btn.addEventListener("click", () => {

            btn.style.transform = "scale(0.95)";

            setTimeout(() => {
                btn.style.transform = "scale(1)";
            },150);

        });

    });

});


// Daily Bonus
function claimBonus(){

    alert("🎁 Daily Bonus feature will be available soon!");

}


// Register System
function register(){

    let username = document.querySelector('input[placeholder="Username"]');

    if(username && username.value){

        alert("✅ Welcome " + username.value + "! Registration coming soon.");

    }else{

        alert("Please enter your details.");

    }

}


// Login System
function login(){

    alert("🔐 Login system will be connected soon!");

}


// Copy Referral Code
function copyReferral(){

    navigator.clipboard.writeText("RAHUL2026");

    alert("📋 Referral Code Copied!");

}


// Notification Function
function showNotification(message){

    alert(message);

}