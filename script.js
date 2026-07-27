// Rahul Social Hub Script

const API = "https://rahulsocialhub-db.09rcrg.workers.dev";// Register User
async function registerUser() {

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    document.getElementById("message").innerHTML = "❌ Please fill all fields.";
    return;
  }

  try {

    const response = await fetch(API + "/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        email,
        password
      })
    });

    const result = await response.json();

    document.getElementById("message").innerHTML = result.message;

if (result.success) {

  localStorage.setItem("userEmail", email);

  document.getElementById("message").innerHTML =
    "✅ Registration Successful... Redirecting...";

  setTimeout(() => {

    window.location.href = "#dashboard";

  }, 1500);

}
  } catch (err) {

    document.getElementById("message").innerHTML =
      "❌ Connection Error";

    console.error(err);
  }

}// Login User
async function loginUser() {

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("❌ Please enter Email and Password");
    return;
  }

  try {

    const response = await fetch(API + "/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const result = await response.json();

    if (result.success) {

      alert("✅ " + result.message);

      localStorage.setItem("user", JSON.stringify(result.user));

      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPassword").value = "";

    } else {

      alert("❌ " + result.message);

    }

  } catch (err) {

    alert("❌ Connection Error");
    console.error(err);

  }

}// Copy Referral Code
function copyReferral() {

  const code = document.getElementById("referralCode");

  if (!code) {
    alert("Referral code not found.");
    return;
  }

  navigator.clipboard.writeText(code.innerText);

  alert("✅ Referral Code Copied!");

}


// Daily Bonus
function claimBonus() {

  alert("🎁 Daily Bonus feature will be available soon!");

}


// Show Notification
function showNotification(message) {

  alert(message);

}


// Page Loaded
document.addEventListener("DOMContentLoaded", () => {

  console.log("Rahul Social Hub Loaded ✅");

});