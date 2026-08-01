/* =========================================================
   RAHUL LIVE
   script.js
========================================================= */

const API_BASE =
    "https://rahulsocialhub-db.09rcrg.workers.dev";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser =
    JSON.parse(
        localStorage.getItem("rahulLiveUser") || "null"
    );

let currentLiveId = null;

let liveStream = null;


/* =========================================================
   DOM
========================================================= */

const authScreen =
    document.getElementById("authScreen");

const appScreen =
    document.getElementById("appScreen");

const loginTab =
    document.getElementById("loginTab");

const registerTab =
    document.getElementById("registerTab");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const authMessage =
    document.getElementById("authMessage");

const videoFeed =
    document.getElementById("videoFeed");

const liveGrid =
    document.getElementById("liveGrid");

const uploadMessage =
    document.getElementById("uploadMessage");

const videoFile =
    document.getElementById("videoFile");

const uploadPreview =
    document.getElementById("uploadPreview");

const selectedVideo =
    document.getElementById("selectedVideo");


/* =========================================================
   START APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupAuth();

        setupNavigation();

        setupUpload();

        setupLive();

        setupProfile();

        if (currentUser) {

            showApp();

        } else {

            showAuth();

        }

    }
);


/* =========================================================
   AUTH UI
========================================================= */

function setupAuth() {

    loginTab?.addEventListener(
        "click",
        () => {

            loginTab.classList.add("active");

            registerTab.classList.remove("active");

            loginForm.style.display = "block";

            registerForm.style.display = "none";

            setAuthMessage("");

        }
    );


    registerTab?.addEventListener(
        "click",
        () => {

            registerTab.classList.add("active");

            loginTab.classList.remove("active");

            registerForm.style.display = "block";

            loginForm.style.display = "none";

            setAuthMessage("");

        }
    );


    loginForm?.addEventListener(
        "submit",
        loginUser
    );


    registerForm?.addEventListener(
        "submit",
        registerUser
    );

}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(event) {

    event.preventDefault();

    const username =
        document
            .getElementById("registerUsername")
            .value
            .trim();

    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("registerPassword")
            .value;


    if (
        !username ||
        !email ||
        !password
    ) {

        setAuthMessage(
            "सभी fields भरें।",
            true
        );

        return;

    }


    if (password.length < 6) {

        setAuthMessage(
            "Password कम से कम 6 characters का होना चाहिए।",
            true
        );

        return;

    }


    setAuthMessage(
        "Account बनाया जा रहा है..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/api/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
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


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Registration failed."
            );

        }


        setAuthMessage(
            "✅ Account बन गया। अब Login करें।"
        );


        loginTab.click();


        document
            .getElementById("loginUsername")
            .value = username;


        document
            .getElementById("loginPassword")
            .value = password;


    } catch (error) {

        setAuthMessage(
            error.message,
            true
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(event) {

    event.preventDefault();


    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;


    if (
        !username ||
        !password
    ) {

        setAuthMessage(
            "Username/Email और Password भरें।",
            true
        );

        return;

    }


    setAuthMessage(
        "Login हो रहा है..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/api/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Login failed."
            );

        }


        currentUser =
            data.user;


        localStorage.setItem(
            "rahulLiveUser",
            JSON.stringify(currentUser)
        );


        setAuthMessage("");


        showApp();


    } catch (error) {

        setAuthMessage(
            error.message,
            true
        );

    }

}


/* =========================================================
   SHOW AUTH
========================================================= */

function showAuth() {

    authScreen.style.display =
        "flex";

    appScreen.style.display =
        "none";

}


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    authScreen.style.display =
        "none";

    appScreen.style.display =
        "block";


    updateProfileUI();

    loadVideos();

    loadLiveStreams();

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function setAuthMessage(
    message,
    error = false
) {

    authMessage.textContent =
        message;

    authMessage.style.color =
        error
            ? "#ff3158"
            : "#20ff68";

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navButtons =
        document.querySelectorAll(
            ".navBtn"
        );


    navButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const pageId =
                        button.dataset.page;


                    document
                        .querySelectorAll(".page")
                        .forEach(
                            page => {

                                page.classList.remove(
                                    "active"
                                );

                            }
                        );


                    document
                        .querySelectorAll(".navBtn")
                        .forEach(
                            nav => {

                                nav.classList.remove(
                                    "active"
                                );

                            }
                        );


                    const page =
                        document.getElementById(
                            pageId
                        );


                    page?.classList.add(
                        "active"
                    );


                    button.classList.add(
                        "active"
                    );


                    if (
                        pageId === "homePage"
                    ) {

                        loadVideos();

                    }


                    if (
                        pageId === "livePage"
                    ) {

                        loadLiveStreams();

                    }


                    if (
                        pageId === "profilePage"
                    ) {

                        updateProfileUI();

                    }

                }
            );

        }
    );


    document
        .getElementById("topLiveBtn")
        ?.addEventListener(
            "click",
            () => {

                openLiveStudio();

            }
        );

}


/* =========================================================
   LOAD VIDEOS
========================================================= */

async function loadVideos() {

    if (!videoFeed) return;


    videoFeed.innerHTML = `
        <div style="
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#777;
        ">
            Videos loading...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/videos`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Videos could not be loaded."
            );

        }


        const videos =
            data.videos || [];


        if (!videos.length) {

            videoFeed.innerHTML = `
                <div style="
                    height:100%;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    gap:10px;
                    color:#777;
                    text-align:center;
                    padding:25px;
                ">
                    <div style="font-size:45px;">
                        🎬
                    </div>

                    <div>
                        अभी कोई Short Video नहीं है।
                    </div>

                    <div style="
                        font-size:12px;
                        color:#555;
                    ">
                        पहला video Upload करें।
                    </div>
                </div>
            `;

            return;

        }


        videoFeed.innerHTML =
            "";


        videos.forEach(
            video => {

                videoFeed.appendChild(
                    createVideoCard(video)
                );

            }
        );


        setupVideoAutoPlay();


    } catch (error) {

        videoFeed.innerHTML = `
            <div style="
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#ff3158;
                padding:25px;
                text-align:center;
            ">
                ${escapeHTML(error.message)}
            </div>
        `;

    }

}


/* =========================================================
   CREATE VIDEO CARD
========================================================= */

function createVideoCard(video) {

    const card =
        document.createElement("article");


    card.className =
        "videoCard";


    const videoUrl =
        safeUrl(video.video_url);


    const username =
        escapeHTML(
            video.username ||
            "User"
        );


    const caption =
        escapeHTML(
            video.caption ||
            ""
        );


    card.innerHTML = `

        <video
            src="${videoUrl}"
            playsinline
            loop
            preload="metadata"
        ></video>


        <div class="videoOverlay">

            <div class="videoInfo">

                <div class="username">
                    @${username}
                </div>

                <div class="caption">
                    ${caption}
                </div>

            </div>


            <div class="videoActions">

                <button
                    class="actionBtn likeBtn"
                    type="button"
                    data-id="${video.id}"
                >
                    ❤️
                </button>

                <div class="actionCount">
                    ${formatNumber(video.likes_count)}
                </div>


                <button
                    class="actionBtn commentBtn"
                    type="button"
                    data-id="${video.id}"
                >
                    💬
                </button>

                <div class="actionCount">
                    ${formatNumber(video.comments_count)}
                </div>


                <button
                    class="actionBtn shareBtn"
                    type="button"
                    data-id="${video.id}"
                >
                    ↗️
                </button>

                <div class="actionCount">
                    ${formatNumber(video.views_count)}
                </div>

            </div>

        </div>

    `;


    const videoElement =
        card.querySelector("video");


    card
        .querySelector(".likeBtn")
        ?.addEventListener(
            "click",
            () => likeVideo(video.id)
        );


    card
        .querySelector(".commentBtn")
        ?.addEventListener(
            "click",
            () => commentOnVideo(video.id)
        );


    card
        .querySelector(".shareBtn")
        ?.addEventListener(
            "click",
            () => shareVideo(video)
        );


    videoElement?.addEventListener(
        "play",
        () => {

            recordVideoView(
                video.id
            );

        },
        {
            once: true
        }
    );


    return card;

}


/* =========================================================
   AUTO PLAY SHORT VIDEOS
========================================================= */

function setupVideoAutoPlay() {

    const cards =
        document.querySelectorAll(
            ".videoCard"
        );


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        const video =
                            entry
                                .target
                                .querySelector(
                                    "video"
                                );


                        if (!video) return;


                        if (
                            entry.isIntersecting
                        ) {

                            video.play()
                                .catch(
                                    () => {}
                                );

                        } else {

                            video.pause();

                        }

                    }
                );

            },
            {
                threshold: 0.65
            }
        );


    cards.forEach(
        card => {

            observer.observe(card);

        }
    );

}


/* =========================================================
   LIKE VIDEO
========================================================= */

async function likeVideo(videoId) {

    if (!currentUser) {

        alert("पहले Login करें।");

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/videos/like`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        video_id:
                            Number(videoId),

                        user_id:
                            Number(
                                currentUser.id
                            )
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Like failed."
            );

        }


        loadVideos();


    } catch (error) {

        alert(error.message);

    }

}


/* =========================================================
   COMMENT VIDEO
========================================================= */

async function commentOnVideo(
    videoId
) {

    if (!currentUser) {

        alert("पहले Login करें।");

        return;

    }


    const comment =
        prompt(
            "Comment लिखें:"
        );


    if (!comment) return;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/videos/comment`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        video_id:
                            Number(videoId),

                        user_id:
                            Number(
                                currentUser.id
                            ),

                        comment:
                            comment.trim()
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Comment failed."
            );

        }


        alert("Comment added ✅");

        loadVideos();


    } catch (error) {

        alert(error.message);

    }

}


/* =========================================================
   SHARE VIDEO
========================================================= */

async function shareVideo(video) {

    const shareUrl =
        `${window.location.origin}/?video=${video.id}`;


    if (
        navigator.share
    ) {

        try {

            await navigator.share({
                title:
                    "Rahul Live Video",

                text:
                    video.caption ||
                    "Watch this Short Video",

                url:
                    shareUrl
            });

        } catch {

            // User cancelled share.

        }

        return;

    }


    try {

        await navigator.clipboard.writeText(
            shareUrl
        );

        alert(
            "Video link copied ✅"
        );

    } catch {

        alert(
            shareUrl
        );

    }

}


/* =========================================================
   VIDEO VIEW
========================================================= */

async function recordVideoView(
    videoId
) {

    try {

        await fetch(
            `${API_BASE}/api/videos/view`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    video_id:
                        Number(videoId),

                    user_id:
                        currentUser
                            ? Number(
                                currentUser.id
                            )
                            : null
                })
            }
        );

    } catch {

        // View tracking failure should
        // not stop video playback.

    }

}


/* =========================================================
   UPLOAD UI
========================================================= */

function setupUpload() {

    videoFile?.addEventListener(
        "change",
        () => {

            const file =
                videoFile.files?.[0];


            if (!file) {

                selectedVideo.textContent =
                    "No video selected";

                uploadPreview.style.display =
                    "none";

                return;

            }


            if (
                !file.type.startsWith(
                    "video/"
                )
            ) {

                selectedVideo.textContent =
                    "Please select a video file.";

                return;

            }


            selectedVideo.textContent =
                file.name;


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            uploadPreview.src =
                objectUrl;


            uploadPreview.style.display =
                "block";

        }
    );


    document
        .getElementById(
            "uploadVideoBtn"
        )
        ?.addEventListener(
            "click",
            uploadVideo
        );

}


/* =========================================================
   UPLOAD VIDEO
========================================================= */

async function uploadVideo() {

    if (!currentUser) {

        alert("पहले Login करें।");

        return;

    }


    const file =
        videoFile?.files?.[0];


    if (!file) {

        setUploadMessage(
            "पहले video select करें।",
            true
        );

        return;

    }


    /*
       IMPORTANT:
       D1 database में बड़ी video files store नहीं करनी चाहिए.
       अभी frontend selected video को verify करता है.
       Actual permanent video storage endpoint अगले
       storage implementation में connect किया जाएगा.
    */


    setUploadMessage(
        "Video selected है। Permanent upload storage अभी connect होना बाकी है।",
        true
    );

}


/* =========================================================
   UPLOAD MESSAGE
========================================================= */

function setUploadMessage(
    message,
    error = false
) {

    if (!uploadMessage) return;


    uploadMessage.textContent =
        message;


    uploadMessage.style.color =
        error
            ? "#ff3158"
            : "#20ff68";

}


/* =========================================================
   LIVE SETUP
========================================================= */

function setupLive() {

    document
        .getElementById(
            "startLiveBtn"
        )
        ?.addEventListener(
            "click",
            openLiveStudio
        );


    document
        .getElementById(
            "goLiveConfirmBtn"
        )
        ?.addEventListener(
            "click",
            startLive
        );


    document
        .getElementById(
            "endLiveBtn"
        )
        ?.addEventListener(
            "click",
            endLive
        );


    document
        .getElementById(
            "closeLiveStudio"
        )
        ?.addEventListener(
            "click",
            closeLiveStudio
        );

}


/* =========================================================
   OPEN LIVE STUDIO
========================================================= */

async function openLiveStudio() {

    if (!currentUser) {

        alert("पहले Login करें।");

        return;

    }


    const studio =
        document.getElementById(
            "liveStudio"
        );


    studio.style.display =
        "block";


    try {

        liveStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: true,
                    audio: true
                }
            );


        const preview =
            document.getElementById(
                "livePreview"
            );


        preview.srcObject =
            liveStream;


    } catch (error) {

        studio.style.display =
            "none";


        alert(
            "Camera और microphone की permission दें।"
        );

    }

}


/* =========================================================
   START LIVE
========================================================= */

async function startLive() {

    if (!currentUser) {

        alert("पहले Login करें।");

        return;

    }


    const titleInput =
        document.getElementById(
            "liveTitle"
        );


    const title =
        titleInput.value.trim() ||
        "Rahul Live";


    try {

        const response =
            await fetch(
                `${API_BASE}/api/live/start`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        user_id:
                            Number(
                                currentUser.id
                            ),

                        title
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "LIVE start failed."
            );

        }


        currentLiveId =
            data.live_id;


        document
            .getElementById(
                "goLiveConfirmBtn"
            )
            .style.display =
                "none";


        document
            .getElementById(
                "endLiveBtn"
            )
            .style.display =
                "block";


        alert(
            "🔴 LIVE session शुरू हो गई।"
        );


        loadLiveStreams();


    } catch (error) {

        alert(error.message);

    }

}


/* =========================================================
   END LIVE
========================================================= */

async function endLive() {

    if (!currentLiveId) {

        closeLiveStudio();

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/live/end`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        live_id:
                            Number(
                                currentLiveId
                            )
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Could not end LIVE."
            );

        }


        currentLiveId =
            null;


        document
            .getElementById(
                "goLiveConfirmBtn"
            )
            .style.display =
                "block";


        document
            .getElementById(
                "endLiveBtn"
            )
            .style.display =
                "none";


        closeLiveCamera();


        alert(
            "LIVE ended."
        );


        loadLiveStreams();


    } catch (error) {

        alert(error.message);

    }

}


/* =========================================================
   CLOSE LIVE STUDIO
========================================================= */

function closeLiveStudio() {

    if (currentLiveId) {

        alert(
            "पहले LIVE End करें।"
        );

        return;

    }


    closeLiveCamera();


    const studio =
        document.getElementById(
            "liveStudio"
        );


    studio.style.display =
        "none";

}


/* =========================================================
   CLOSE CAMERA
========================================================= */

function closeLiveCamera() {

    if (!liveStream) return;


    liveStream
        .getTracks()
        .forEach(
            track => track.stop()
        );


    liveStream =
        null;


    const preview =
        document.getElementById(
            "livePreview"
        );


    if (preview) {

        preview.srcObject =
            null;

    }

}


/* =========================================================
   LOAD LIVE STREAMS
========================================================= */

async function loadLiveStreams() {

    if (!liveGrid) return;


    liveGrid.innerHTML = `
        <div style="
            grid-column:1/-1;
            text-align:center;
            color:#777;
            padding:25px;
        ">
            LIVE loading...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/live`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "LIVE could not be loaded."
            );

        }


        const streams =
            data.live_streams || [];


        if (!streams.length) {

            liveGrid.innerHTML = `
                <div style="
                    grid-column:1/-1;
                    text-align:center;
                    color:#777;
                    padding:30px;
                ">
                    अभी कोई LIVE नहीं है।
                </div>
            `;

            return;

        }


        liveGrid.innerHTML =
            "";


        streams.forEach(
            stream => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "liveCard";


                card.innerHTML = `

                    <div class="liveThumb">
                        🔴
                    </div>

                    <div class="liveBadge">
                        LIVE
                    </div>

                    <div class="liveName">

                        ${escapeHTML(
                            stream.title ||
                            "Rahul Live"
                        )}

                        <br>

                        <span style="
                            color:#777;
                            font-size:11px;
                        ">
                            @${escapeHTML(
                                stream.username ||
                                "User"
                            )}
                        </span>

                    </div>

                `;


                liveGrid.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        liveGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                color:#ff3158;
                padding:25px;
            ">
                ${escapeHTML(error.message)}
            </div>
        `;

    }

}


/* =========================================================
   PROFILE
========================================================= */

function setupProfile() {

    document
        .getElementById(
            "logoutBtn"
        )
        ?.addEventListener(
            "click",
            logoutUser
        );

}


/* =========================================================
   UPDATE PROFILE
========================================================= */

function updateProfileUI() {

    if (!currentUser) return;


    const username =
        currentUser.username ||
        "User";


    const profileName =
        document.getElementById(
            "profileName"
        );


    const profileUsername =
        document.getElementById(
            "profileUsername"
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    const profileBio =
        document.getElementById(
            "profileBio"
        );


    const profileVideos =
        document.getElementById(
            "profileVideos"
        );


    const profileFollowers =
        document.getElementById(
            "profileFollowers"
        );


    const profileFollowing =
        document.getElementById(
            "profileFollowing"
        );


    if (profileName) {

        profileName.textContent =
            username;

    }


    if (profileUsername) {

        profileUsername.textContent =
            `@${username}`;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            username
                .charAt(0)
                .toUpperCase();

    }


    if (profileBio) {

        profileBio.textContent =
            currentUser.bio ||
            "";

    }


    if (profileVideos) {

        profileVideos.textContent =
            formatNumber(
                currentUser.videos_count || 0
            );

    }


    if (profileFollowers) {

        profileFollowers.textContent =
            formatNumber(
                currentUser.followers_count || 0
            );

    }


    if (profileFollowing) {

        profileFollowing.textContent =
            formatNumber(
                currentUser.following_count || 0
            );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {

    if (
        currentLiveId
    ) {

        alert(
            "पहले अपना LIVE End करें।"
        );

        return;

    }


    localStorage.removeItem(
        "rahulLiveUser"
    );


    currentUser =
        null;


    showAuth();


    loginForm?.reset();

    registerForm?.reset();

}


/* =========================================================
   SAFE URL
========================================================= */

function safeUrl(url) {

    if (!url) return "";


    try {

        const parsed =
            new URL(
                url,
                window.location.origin
            );


        if (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        ) {

            return parsed.href;

        }


        return "";


    } catch {

        return "";

    }

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {

    const number =
        Number(value || 0);


    if (
        number >= 1000000
    ) {

        return (
            number / 1000000
        )
            .toFixed(1)
            .replace(".0", "") +
            "M";

    }


    if (
        number >= 1000
    ) {

        return (
            number / 1000
        )
            .toFixed(1)
            .replace(".0", "") +
            "K";

    }


    return String(number);

}