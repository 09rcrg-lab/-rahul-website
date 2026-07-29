// Loading Screen Remove

window.addEventListener("load", function(){

    let loading = document.getElementById("loading-screen");

    if(loading){

        loading.style.display = "none";

    }

});// ================= REGISTER =================

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

username,

email,

password

})

);


localStorage.setItem(
"email",
email
);



alert("Account Created Successfully");


}

else{


alert(data.message);


}



};


}