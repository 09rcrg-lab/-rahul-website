// Rahul Social Hub Script

async function registerUser() {

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    document.getElementById("message").innerHTML =
      "❌ Please fill all fields.";
    return;
  }  try {

    const response = await fetch(
      "https://rahulsocialhub-db.09rcrg.workers.dev/api/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      }
    );


    const data = await response.json();


    if (data.success) {

      document.getElementById("message").innerHTML =
        "✅ Registration successful!";


      localStorage.setItem("user", JSON.stringify({
        username: username,
        email: email
      }));


      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);


    } else {

      document.getElementById("message").innerHTML =
        "❌ " + data.error;

    }


  } catch (error) {

    console.log(error);

    document.getElementById("message").innerHTML =
      "❌ Server connection error.";

  }

}// Login Function

async function loginUser(){

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const message = document.getElementById("loginMessage");


  if(!email || !password){

    message.innerHTML = "❌ Please fill all fields.";
    return;

  }


  try{

    const response = await fetch(
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


    const data = await response.json();


    if(data.success){


      localStorage.setItem("user", JSON.stringify(data.user));


      message.innerHTML =
      "✅ Login successful";


      setTimeout(()=>{

        window.location.href="dashboard.html";

      },1000);


    }else{


      message.innerHTML =
      "❌ " + (data.error || "Login failed");


    }


  }catch(error){


    console.log(error);

    message.innerHTML =
    "❌ Server error";


  }


}// Dashboard Load Function

function loadDashboard(){

  const user = localStorage.getItem("user");


  if(!user){

    window.location.href = "login.html";
    return;

  }


  const userData = JSON.parse(user);


  const name = document.getElementById("userName");
  const email = document.getElementById("userEmail");


  if(name){

    name.innerHTML = userData.username;

  }


  if(email){

    email.innerHTML = userData.email;

  }

}



// Logout Function

function logoutUser(){

  localStorage.removeItem("user");

  window.location.href = "index.html";

}



// Auto Run On Page Load

document.addEventListener("DOMContentLoaded", function(){

  if(window.location.pathname.includes("dashboard")){

    loadDashboard();

  }

});