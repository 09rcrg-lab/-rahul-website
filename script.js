/* =========================================================
   RAHUL LIVE - SCRIPT.JS
   Short Video + LIVE Application
========================================================= */

"use strict";


/* =========================================================
   APP CONFIG
========================================================= */

const APP_NAME = "Rahul Live";


/*
   आगे backend लगाते समय केवल यही API URL बदला जाएगा.
*/
const API_BASE_URL = "";


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   AUTH UI
========================================================= */

function showLogin() {

    $("loginForm").style.display = "block";
    $("registerForm").style.display = "none";

    $("loginTab").classList.add("active");
    $("registerTab").classList.remove("active");

    $("authMessage").innerText = "";
}


function showRegister() {

    $("loginForm").style.display = "none";
    $("registerForm").style.display = "block";

    $("loginTab").classList.remove("active");
    $("registerTab").classList.add("active");

    $("authMessage").innerText = "";
}


/* =========================================================
   MESSAGE
========================================================= */

function showAuthMessage(message, success = false) {

    const box = $("authMessage");

    if (!box) return;

    box.innerText = message;

    box.style.color = success
        ? "#19ff68"
        : "#ff6b6b";
}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser() {

    const username =
        $("registerUsername").value.trim();

    const email =
        $("registerEmail").value.trim();

    const password =
        $("registerPassword").value;


    if (!username || !email || !password) {

        showAuthMessage(
            "Please fill all fields."
        );

        return;
    }


    if (username.length < 3) {

        showAuthMessage(
            "Username must contain at least 3 characters."
        );

        return;
    }


    if (password.length < 6) {

        showAuthMessage(
            "Password must contain at least 6 characters."
        );

        return;
    }


    /*
       Backend API available hone par registration
       server par jayega.
    */

    if (API_BASE_URL) {

        try {

            const response = await fetch(
                API_BASE_URL + "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok || data.success === false) {

                showAuthMessage(
                    data.error ||
                    data.message ||
                    "Registration failed."
                );

                return;
            }

        } catch (error) {

            showAuthMessage(
                "Server connection failed."
            );

            return;
        }
    }


    /*
       Temporary local account storage.
       Backend connect hone ke baad server account
       primary authentication hoga.
    */

    const user = {

        username: username,

        email: email,

        password: password,

        createdAt: new Date().toISOString()
    };


    localStorage.setItem(
        "rahul_user",
        JSON.stringify(user)
    );


    showAuthMessage(
        "Account created successfully.",
        true
    );


    setTimeout(function() {

        $("loginUsername").value =
            username;

        $("loginPassword").value =
            "";

        showLogin();

    }, 700);
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser() {

    const usernameOrEmail =
        $("loginUsername").value.trim();

    const password =
        $("loginPassword").value;


    if (!usernameOrEmail || !password) {

        showAuthMessage(
            "Please enter username/email and password."
        );

        return;
    }


    /*
       Future API login support.
    */

    if (API_BASE_URL) {

        try {

            const response = await fetch(
                API_BASE_URL + "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: usernameOrEmail,
                        email: usernameOrEmail,
                        password: password
                    })
                }
            );


            const data =
                await response.json();


            if (response.ok && data.success) {

                const user =
                    data.user || {
                        username: usernameOrEmail
                    };


                localStorage.setItem(
                    "rahul_user",
                    JSON.stringify(user)
                );

                localStorage.setItem(
                    "rahul_logged_in",
                    "true"
                );


                openApp(
                    user.username ||
                    usernameOrEmail
                );

                return;
            }

        } catch (error) {

            console.log(
                "API login unavailable, using local login."
            );
        }
    }


    /*
       Local login fallback.
    */

    const saved =
        localStorage.getItem("rahul_user");


    if (!saved) {

        showAuthMessage(
            "Account not found. Please register first."
        );

        return;
    }


    let user;

    try {

        user = JSON.parse(saved);

    } catch (error) {

        showAuthMessage(
            "Account data is corrupted. Please register again."
        );

        localStorage.removeItem(
            "rahul_user"
        );

        return;
    }


    const validUsername =
        usernameOrEmail === user.username ||
        usernameOrEmail === user.email;


    const validPassword =
        password === user.password;


    if (!validUsername || !validPassword) {

        showAuthMessage(
            "Invalid username/email or password."
        );

        return;
    }


    localStorage.setItem(
        "rahul_logged_in",
        "true"
    );


    openApp(
        user.username
    );
}


/* =========================================================
   OPEN APP
========================================================= */

function openApp(username) {

    $("authScreen").style.display =
        "none";

    $("appScreen").style.display =
        "block";


    if ($("profileUsername")) {

        $("profileUsername").innerText =
            username || "User";
    }


    openPage(
        "homePage"
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {

    /*
       Stop all videos before leaving.
    */

    stopAllVideos();


    localStorage.removeItem(
        "rahul_logged_in"
    );


    $("appScreen").style.display =
        "none";

    $("authScreen").style.display =
        "flex";


    $("loginUsername").value =
        "";

    $("loginPassword").value =
        "";


    showLogin();

    showAuthMessage(
        "You have been logged out.",
        true
    );
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function openPage(pageId, button = null) {

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(function(page) {

        page.classList.remove(
            "active"
        );
    });


    const page =
        $(pageId);


    if (!page) return;


    page.classList.add(
        "active"
    );


    const navButtons =
        document.querySelectorAll(".navBtn");


    navButtons.forEach(function(btn) {

        btn.classList.remove(
            "active"
        );
    });


    if (button) {

        button.classList.add(
            "active"
        );
    }


    /*
       Page-specific actions.
    */

    if (pageId === "homePage") {

        prepareVideoFeed();
    }


    if (pageId === "livePage") {

        prepareLivePage();
    }


    window.scrollTo(
        0,
        0
    );
}


/* =========================================================
   VIDEO SELECT / UPLOAD PREVIEW
========================================================= */

function setupVideoSelector() {

    const input =
        $("videoInput");

    if (!input) return;


    input.addEventListener(
        "change",
        function() {

            const file =
                this.files &&
                this.files[0];


            const output =
                $("selectedVideo");


            if (!file) {

                if (output) {
                    output.innerText = "";
                }

                return;
            }


            if (!file.type.startsWith("video/")) {

                if (output) {

                    output.innerText =
                        "Please select a video file.";

                    output.style.color =
                        "#ff6b6b";
                }

                this.value = "";

                return;
            }


            if (output) {

                output.innerText =
                    "Selected: " +
                    file.name;

                output.style.color =
                    "#19ff68";
            }


            /*
               Local preview is created here.
               Actual server upload will be connected
               with the video API later.
            */

            createVideoPreview(
                file
            );
        }
    );
}


/* =========================================================
   VIDEO PREVIEW
========================================================= */

function createVideoPreview(file) {

    const oldPreview =
        $("uploadVideoPreview");


    if (oldPreview) {

        oldPreview.remove();
    }


    const url =
        URL.createObjectURL(file);


    const video =
        document.createElement("video");


    video.id =
        "uploadVideoPreview";

    video.src =
        url;

    video.controls =
        true;

    video.playsInline =
        true;

    video.style.width =
        "100%";

    video.style.maxHeight =
        "400px";

    video.style.marginTop =
        "15px";

    video.style.borderRadius =
        "12px";


    const box =
        document.querySelector(
            ".uploadBox"
        );


    if (box) {

        box.appendChild(
            video
        );
    }
}


/* =========================================================
   VIDEO FEED
========================================================= */

function prepareVideoFeed() {

    const videos =
        document.querySelectorAll(
            ".videoCard video"
        );


    videos.forEach(function(video) {

        video.pause();

    });


    /*
       Current feed video remains ready.
       Future API will dynamically load
       uploaded short videos here.
    */
}


/* =========================================================
   STOP ALL VIDEOS
========================================================= */

function stopAllVideos() {

    const videos =
        document.querySelectorAll(
            "video"
        );


    videos.forEach(function(video) {

        try {

            video.pause();

        } catch (error) {

            console.log(
                "Video stop error",
                error
            );
        }
    });
}


/* =========================================================
   LIVE PAGE
========================================================= */

function prepareLivePage() {

    /*
       Future:
       - Load active live streams
       - Connect WebRTC/stream server
       - Show live viewers
       - Live chat
    */

    console.log(
        "LIVE page ready."
    );
}


/* =========================================================
   START LIVE
========================================================= */

async function startLive() {

    /*
       Browser camera/microphone permission test.
       Actual broadcasting server connection will be
       added in the LIVE streaming backend file.
    */

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "Camera and microphone are not supported in this browser."
        );

        return;
    }


    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });


        /*
           Store the stream temporarily.
           The next LIVE implementation will use
           this stream for actual broadcasting.
        */

        window.rahulLiveStream =
            stream;


        openLiveStudio(
            stream
        );

    } catch (error) {

        console.error(
            "Camera/Microphone error:",
            error
        );


        alert(
            "Camera aur microphone permission allow karo."
        );
    }
}


/* =========================================================
   LIVE STUDIO
========================================================= */

function openLiveStudio(stream) {

    let studio =
        $("liveStudio");


    if (!studio) {

        studio =
            document.createElement("div");

        studio.id =
            "liveStudio";


        studio.style.position =
            "fixed";

        studio.style.inset =
            "0";

        studio.style.zIndex =
            "9999";

        studio.style.background =
            "#000";

        studio.style.display =
            "flex";

        studio.style.flexDirection =
            "column";

        studio.style.alignItems =
            "center";

        studio.style.justifyContent =
            "center";


        studio.innerHTML = `
            <div style="
                width:100%;
                height:100%;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                padding:20px;
            ">

                <div style="
                    position:absolute;
                    top:20px;
                    left:20px;
                    color:#ff1744;
                    font-weight:bold;
                    font-size:18px;
                ">
                    🔴 LIVE STUDIO
                </div>

                <video
                    id="livePreview"
                    autoplay
                    playsinline
                    muted
                    style="
                        width:100%;
                        max-width:500px;
                        max-height:70vh;
                        object-fit:cover;
                        border-radius:15px;
                        background:#111;
                    ">
                </video>

                <div style="
                    margin-top:20px;
                    display:flex;
                    gap:10px;
                ">

                    <button
                        id="endLiveBtn"
                        style="
                            padding:14px 25px;
                            border:0;
                            border-radius:25px;
                            background:#ff1744;
                            color:#fff;
                            font-weight:bold;
                        ">
                        End LIVE
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            studio
        );
    }


    const preview =
        $("livePreview");


    if (preview) {

        preview.srcObject =
            stream;
    }


    const endButton =
        $("endLiveBtn");


    if (endButton) {

        endButton.onclick =
            stopLive;
    }
}


/* =========================================================
   STOP LIVE
========================================================= */

function stopLive() {

    const stream =
        window.rahulLiveStream;


    if (stream) {

        stream.getTracks()
            .forEach(function(track) {

                track.stop();

            });

        window.rahulLiveStream =
            null;
    }


    const studio =
        $("liveStudio");


    if (studio) {

        studio.remove();
    }
}


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (document.hidden) {

            /*
               Background mein camera/live stream
               accidentally continue na ho.
            */

            const activePage =
                document.querySelector(
                    ".page.active"
                );


            if (
                activePage &&
                activePage.id !== "livePage"
            ) {

                stopAllVideos();
            }
        }
    }
);


/* =========================================================
   INITIALIZE APP
========================================================= */

function initializeApp() {

    setupVideoSelector();


    const loggedIn =
        localStorage.getItem(
            "rahul_logged_in"
        );


    const savedUser =
        localStorage.getItem(
            "rahul_user"
        );


    if (
        loggedIn === "true" &&
        savedUser
    ) {

        try {

            const user =
                JSON.parse(
                    savedUser
                );


            openApp(
                user.username
            );

        } catch (error) {

            localStorage.removeItem(
                "rahul_logged_in"
            );

            localStorage.removeItem(
                "rahul_user"
            );


            $("authScreen").style.display =
                "flex";

            $("appScreen").style.display =
                "none";
        }

    } else {

        $("authScreen").style.display =
            "flex";

        $("appScreen").style.display =
            "none";
    }
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeApp();

    }
);


/* =========================================================
   GLOBAL EXPORTS
   Required because index.html uses onclick=""
========================================================= */

window.showLogin =
    showLogin;

window.showRegister =
    showRegister;

window.registerUser =
    registerUser;

window.loginUser =
    loginUser;

window.logoutUser =
    logoutUser;

window.openApp =
    openApp;

window.openPage =
    openPage;

window.startLive =
    startLive;

window.stopLive =
    stopLive;