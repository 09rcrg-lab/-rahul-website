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

  if (loader) {
    setTimeout(() => {
      loader.style.display = "none";
    }, 1000);
  }
});

// ===================================
// Notification
// ===================================
function showNotification(message) {

  const box = document.getElementById("notificationBox");

  if (!box) return;

  box.innerHTML = message;

  setTimeout(() => {
    box.innerHTML = "";
  }, 3000);

}// ===================================
// Register System
// ===================================

const registerButton = document.getElementById("registerSubmit");

if (registerButton) {

  registerButton.onclick = async () => {

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!username || !email || !password) {
      showNotification("Please fill all details");
      return;
    }

    try {

      const response = await fetch(API_URL + "/api/register", {
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

      const data = await response.json();

      if (data.success) {

        showNotification("Registration Successful");

        document.getElementById("registerUsername").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";

      } else {

        showNotification(data.message);

      }

    } catch (error) {

      showNotification("Server Error");

    }

  };

}// ===================================
// Login System
// ===================================

const loginButton = document.getElementById("loginSubmit");

if (loginButton) {

  loginButton.onclick = async () => {

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showNotification("Enter Email and Password");
      return;
    }

    try {

      const response = await fetch(API_URL + "/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (data.success) {

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        currentUser = data.user;

        showNotification("Login Successful");

        loadUserProfile();

      } else {

        showNotification(data.message);

      }

    } catch (error) {

      showNotification("Login Server Error");

    }

  };

}// ===================================
// Load User Profile
// ===================================

function loadUserProfile() {

  if (!currentUser) return;

  const username = document.getElementById("profileUsername");
  const email = document.getElementById("profileEmail");
  const wallet = document.getElementById("profileWallet");
  const coins = document.getElementById("profileCoins");

  if (username) {
    username.innerHTML = "Username: " + currentUser.username;
  }

  if (email) {
    email.innerHTML = "Email: " + currentUser.email;
  }

  if (wallet) {
    wallet.innerHTML = "Wallet: ₹" + (currentUser.wallet || 0);
  }

  if (coins) {
    coins.innerHTML = "Coins: " + (currentUser.coins || 0);
  }

}

// ===================================
// Auto Load Profile
// ===================================

window.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
});// ===================================
// Logout System
// ===================================

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {

  logoutButton.onclick = () => {

    localStorage.removeItem("user");

    currentUser = null;

    showNotification("Logged Out Successfully");

    setTimeout(() => {

      location.reload();

    }, 1000);

  };

}

// ===================================
// App Start
// ===================================

window.addEventListener("load", () => {

  if (currentUser) {

    loadUserProfile();

  }

});