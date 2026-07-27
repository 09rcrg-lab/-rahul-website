// Rahul Social Hub Script

async function registerUser() {

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    document.getElementById("message").innerHTML =
      "❌ Please fill all fields.";
    return;
  }try {

 const response = await fetch("https://rahulsocialhub-db.09rcrg.workers.dev/api/register", {
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

  const result = await response.json();  if (result.success) {

    localStorage.setItem("userEmail", email);
    localStorage.setItem("username", username);
const welcome = document.getElementById("welcomeUser");

if (welcome) {
    welcome.innerText = username;
}
    document.getElementById("message").innerHTML =
      "✅ Registration Successful... Redirecting...";

    setTimeout(() => {

      document.getElementById("register").style.display = "none";
      document.getElementById("dashboard").style.display = "block";

      const welcome = document.getElementById("welcomeUser");

      if (welcome) {
        welcome.innerText = username;
      }
localStorage.setItem("userEmail", email);
localStorage.setItem("username", username);
    }, 1500);

  } else {

    document.getElementById("message").innerHTML =
      "❌ " + result.message;

  }  } catch (error) {

    console.error(error);

    document.getElementById("message").innerHTML =
      "❌ Server Error";

  }

}document.addEventListener("DOMContentLoaded", () => {

    const savedName = localStorage.getItem("username");

    if (savedName) {

        const welcome = document.getElementById("welcomeUser");

        if (welcome) {
            welcome.innerText = savedName;
        }

    }

});function logoutUser() {

    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");

    location.reload();

}function logoutUser() {

    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");

    document.getElementById("dashboard").style.display = "none";
    document.getElementById("register").style.display = "block";

    location.reload();

}// Login User
async function loginUser() {

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("❌ Please enter Email and Password");
    return;
  }

  try {

    const response = await fetch("https://rahulsocialhub-db.09rcrg.workers.dev/api/login", {
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

      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("username", result.user.username);
      localStorage.setItem("userEmail", result.user.email);

      document.getElementById("register").style.display = "none";
      document.getElementById("dashboard").style.display = "block";

      const welcome = document.getElementById("welcomeUser");

      if (welcome) {
        welcome.innerText = result.user.username;
      }

      alert("✅ Login Successful");

    } else {

      alert("❌ " + result.message);

    }

  } catch (err) {

    alert("❌ Connection Error");

  }

}