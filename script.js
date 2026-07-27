// Rahul Social Hub - Script Part 1
// Register System

const API_URL = "https://rahulsocialhub-db.09rcrg.workers.dev";


// Register Function
async function registerUser(){

    let username = document.getElementById("username").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    let message = document.getElementById("message");


    if(username === "" || email === "" || password === ""){
        message.innerHTML = "❌ सभी जानकारी भरें";
        return;
    }


    try{

        let response = await fetch(API_URL + "/api/register", {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                username:username,
                email:email,
                password:password
            })

        });


        let data = await response.json();


        if(data.success){

            message.innerHTML = "✅ Registration सफल हुआ";

            localStorage.setItem("user", JSON.stringify({
                username:username,
                email:email
            }));

            setTimeout(()=>{
                window.location.href="dashboard.html";
            },1000);


        }else{

            message.innerHTML = "❌ " + (data.error || "Registration failed");

        }


    }catch(error){

        console.log(error);
        message.innerHTML = "❌ Server से connection नहीं हुआ";

    }

}// Login Function
async function loginUser(){

    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value.trim();

    let message = document.getElementById("loginMessage");


    if(email === "" || password === ""){
        message.innerHTML = "❌ Email और Password डालें";
        return;
    }


    try{

        let response = await fetch(API_URL + "/api/login",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                email:email,
                password:password
            })

        });


        let data = await response.json();


        if(data.success){

            message.innerHTML = "✅ Login सफल हुआ";


            localStorage.setItem("user", JSON.stringify({

                username:data.user.username,
                email:data.user.email

            }));


            setTimeout(()=>{

                window.location.href="dashboard.html";

            },1000);


        }else{

            message.innerHTML = "❌ " + (data.error || "Login failed");

        }


    }catch(error){

        console.log(error);

        message.innerHTML="❌ Server error";

    }

}// Dashboard System

function loadDashboard(){

    let user = localStorage.getItem("user");

    if(!user){

        window.location.href="login.html";
        return;

    }


    let userData = JSON.parse(user);


    let nameBox = document.getElementById("userName");
    let emailBox = document.getElementById("userEmail");


    if(nameBox){

        nameBox.innerHTML = userData.username;

    }


    if(emailBox){

        emailBox.innerHTML = userData.email;

    }

}



// Logout Function

function logoutUser(){

    localStorage.removeItem("user");

    window.location.href="index.html";

}



// Page Load Check

document.addEventListener("DOMContentLoaded",()=>{

    loadDashboard();

});