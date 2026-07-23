// Rahul Social Hub - Script

document.addEventListener("DOMContentLoaded", () => {

  console.log("Rahul Social Hub Loaded");


  // Welcome Message
  setTimeout(() => {
    alert("👋 Welcome to Rahul Social Hub!");
  }, 1000);


  // Button Click Animation
  document.querySelectorAll("button").forEach(btn => {

    btn.addEventListener("click", () => {

      btn.style.transform = "scale(0.95)";

      setTimeout(() => {
        btn.style.transform = "scale(1)";
      }, 150);

    });

  });

});


// Daily Bonus
function claimBonus(){

  alert("🎁 Daily Bonus feature will be available soon!");

}


// Register
function register(){

  alert("✅ Registration system will be connected soon!");

}


// Login
function login(){

  alert("🔐 Login system will be connected soon!");

}


// Referral Copy
function copyReferral(){

  navigator.clipboard.writeText("RAHUL2026");

  alert("📋 Referral Code Copied!");

}