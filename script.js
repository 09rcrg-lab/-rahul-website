// Register User
async function registerUser() {

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    document.getElementById("message").innerHTML = "❌ Please fill all fields.";
    return;
  }

  const response = await fetch("/api/register", {
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
    document.getElementById("username").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  }

}// Login User
async function loginUser() {

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("❌ Please enter Email and Password");
    return;
  }

  const response = await fetch("/api/login", {
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

  } else {
    alert("❌ " + result.message);
  }

}