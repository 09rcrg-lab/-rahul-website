/* =========================================================
   RAHUL LIVE
   script.js
========================================================= */

const API_BASE =
    "https://rahulsocialhub-db.09rcrg.workers.dev";

let currentUser =
    JSON.parse(
        localStorage.getItem("rahulLiveUser") || "null"
    );

let liveStream = null;
let currentLiveId = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function showAuthMessage(message, success = false) {

    const box = $("authMessage");

    if (!box) return;

    box.textContent = message;

    box.style.color =
        success ? "#19ff68" : "#ff526f";
}


function showUploadMessage(message, success = false) {

    const box = $("uploadMessage");

    if (!box) return;

    box.textContent = message;

    box.style.color =
        success ? "#19ff68" : "#ff526f";
}


async function api(path, options = {}) {

    try {

        const response =
            await fetch(
                API_BASE + path,
                {
                    ...options,
                    headers: {
                        "Content-Type": "application/json",
                        ...(options.headers || {})
                    }
                }
            );


        let data;

        try {

            data = await response.json();

        } catch {

            data = {
                success: false,
                error: "Invalid server response."
            };

        }


        if (!response.ok && !data.error) {

            data.error =
                "Request failed.";

        }


        return data;

    } catch (error) {

        return {
            success: false,
            error: "Server connection failed."
        };

    }
}


/* =========================================================
   AUTH TABS
========================================================= */

function showLogin() {

    if ($("loginForm"))
        $("loginForm").style.display = "block";

    if ($("registerForm"))
        $("registerForm").style.display = "none";


    $("loginTab")
        ?.classList.add("active");

    $("registerTab")
        ?.classList.remove("active");


    showAuthMessage("");
}


function showRegister() {

    if ($("loginForm"))
        $("loginForm").style.display = "none";

    if ($("registerForm"))
        $("registerForm").style.display = "block";


    $("loginTab")
        ?.classList.remove("active");

    $("registerTab")
        ?.classList.add("active");


    showAuthMessage("");
}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(event) {

    event.preventDefault();


    const username =
        $("registerUsername")
            .value
            .trim();

    const email =
        $("registerEmail")
            .value
            .trim();

    const password =
        $("registerPassword")
            .value;


    if (
        !username ||
        !email ||
        !password
    ) {

        showAuthMessage(
            "सभी जानकारी भरना जरूरी है।"
        );

        return;
    }


    showAuthMessage(
        "Account बनाया जा रहा है...",
        true
    );


    const result =
        await api(
            "/api/register",
            {
                method: "POST",

                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            }
        );


    if (!result.success) {

        showAuthMessage(
            result.error ||
            "Registration failed."
        );

        return;
    }


    showAuthMessage(
        "Account successfully बन गया। अब Login करें।",
        true
    );


    $("registerForm").reset();


    setTimeout(
        () => showLogin(),
        1000
    );
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(event) {

    event.preventDefault();


    const username =
        $("loginUsername")
            .value
            .trim();

    const password =
        $("loginPassword")
            .value;


    if (
        !username ||
        !password
    ) {

        showAuthMessage(
            "Username/Email और Password डालें।"
        );

        return;
    }


    showAuthMessage(
        "Login हो रहा है...",
        true
    );


    const result =
        await api(
            "/api/login",
            {
                method: "POST",

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );


    if (!result.success) {

        showAuthMessage(
            result.error ||
            "Login failed."
        );

        return;
    }


    currentUser =
        result.user;


    localStorage.setItem(
        "rahulLiveUser",
        JSON.stringify(currentUser)
    );


    openApp();
}


/* =========================================================
   OPEN APP
========================================================= */

function openApp() {

    if ($("authScreen"))
        $("authScreen").style.display = "none";


    if ($("appScreen"))
        $("appScreen").style.display = "block";


    loadProfile();
    loadVideos();
    loadLiveStreams();

    showPage("homePage");
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    stopCamera();


    currentUser = null;

    currentLiveId = null;


    localStorage.removeItem(
        "rahulLiveUser"
    );


    if ($("appScreen"))
        $("appScreen").style.display = "none";


    if ($("authScreen"))
        $("authScreen").style.display = "flex";


    $("loginForm")
        ?.reset();


    showLogin();
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const page =
        $(pageId);


    if (page)
        page.classList.add("active");


    document
        .querySelectorAll(".navBtn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );

        });


    if (pageId === "homePage")
        loadVideos();


    if (pageId === "livePage")
        loadLiveStreams();


    if (pageId === "profilePage")
        loadProfile();
}


/* =========================================================
   LOAD SHORT VIDEOS
========================================================= */

async function loadVideos() {

    const feed =
        $("videoFeed");


    if (!feed)
        return;


    feed.innerHTML = `
        <div style="
            min-height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#777;
        ">
            Videos loading...
        </div>
    `;


    const result =
        await api("/api/videos");


    if (!result.success) {

        feed.innerHTML = `
            <div style="
                padding:40px 20px;
                text-align:center;
                color:#ff526f;
            ">
                ${escapeHtml(
                    result.error ||
                    "Videos load नहीं हो पाए।"
                )}
            </div>
        `;

        return;
    }


    const videos =
        result.videos || [];


    if (!videos.length) {

        feed.innerHTML = `
            <div style="
                min-height:100%;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                text-align:center;
                color:#777;
                padding:30px;
            ">

                <div style="
                    font-size:50px;
                    margin-bottom:15px;
                ">
                    🎬
                </div>

                <strong>
                    अभी कोई Short Video नहीं है।
                </strong>

                <span style="
                    margin-top:8px;
                ">
                    पहला Short Video upload करें।
                </span>

            </div>
        `;

        return;
    }


    feed.innerHTML = "";


    videos.forEach(
        video => {

            feed.appendChild(
                createVideoCard(video)
            );

        }
    );


    setupVideoObserver();
}


/* =========================================================
   VIDEO CARD
========================================================= */

function createVideoCard(video) {

    const card =
        document.createElement("article");


    card.className =
        "videoCard";


    const videoElement =
        document.createElement("video");


    videoElement.src =
        video.video_url || "";


    videoElement.playsInline = true;
    videoElement.loop = true;
    videoElement.preload = "metadata";
    videoElement.muted = true;


    if (video.thumbnail_url) {

        videoElement.poster =
            video.thumbnail_url;

    }


    const overlay =
        document.createElement("div");

    overlay.className =
        "videoOverlay";


    const info =
        document.createElement("div");

    info.className =
        "videoInfo";


    info.innerHTML = `
        <div class="username">
            @${escapeHtml(
                video.username || "user"
            )}
        </div>

        <div class="caption">
            ${escapeHtml(
                video.caption || ""
            )}
        </div>
    `;


    const actions =
        document.createElement("div");

    actions.className =
        "videoActions";


    /* LIKE */

    const likeButton =
        document.createElement("button");


    likeButton.className =
        "actionBtn";

    likeButton.type =
        "button";

    likeButton.innerHTML =
        "❤️";


    const likeCount =
        document.createElement("div");


    likeCount.className =
        "actionCount";


    likeCount.textContent =
        formatCount(
            video.likes_count || 0
        );


    likeButton.onclick =
        async event => {

            event.stopPropagation();


            if (!currentUser) {

                alert(
                    "पहले Login करें।"
                );

                return;
            }


            const result =
                await api(
                    "/api/videos/like",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            video_id:
                                video.id,

                            user_id:
                                currentUser.id
                        })
                    }
                );


            if (!result.success) {

                alert(
                    result.error ||
                    "Like failed."
                );

                return;
            }


            let count =
                Number(
                    video.likes_count || 0
                );


            if (result.liked) {

                count++;

            } else {

                count =
                    Math.max(
                        0,
                        count - 1
                    );

            }


            video.likes_count =
                count;


            likeCount.textContent =
                formatCount(count);
        };


    /* COMMENT */

    const commentButton =
        document.createElement("button");


    commentButton.className =
        "actionBtn";

    commentButton.type =
        "button";

    commentButton.innerHTML =
        "💬";


    const commentCount =
        document.createElement("div");


    commentCount.className =
        "actionCount";


    commentCount.textContent =
        formatCount(
            video.comments_count || 0
        );


    commentButton.onclick =
        async event => {

            event.stopPropagation();


            if (!currentUser) {

                alert(
                    "पहले Login करें।"
                );

                return;
            }


            const text =
                prompt(
                    "Comment लिखें:"
                );


            if (
                !text ||
                !text.trim()
            )
                return;


            const result =
                await api(
                    "/api/videos/comment",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            video_id:
                                video.id,

                            user_id:
                                currentUser.id,

                            comment:
                                text.trim()
                        })
                    }
                );


            if (!result.success) {

                alert(
                    result.error ||
                    "Comment failed."
                );

                return;
            }


            video.comments_count =
                Number(
                    video.comments_count || 0
                ) + 1;


            commentCount.textContent =
                formatCount(
                    video.comments_count
                );
        };


    /* SHARE */

    const shareButton =
        document.createElement("button");


    shareButton.className =
        "actionBtn";

    shareButton.type =
        "button";

    shareButton.innerHTML =
        "↗️";


    const shareCount =
        document.createElement("div");


    shareCount.className =
        "actionCount";


    shareCount.textContent =
        formatCount(
            video.shares_count || 0
        );


    shareButton.onclick =
        async event => {

            event.stopPropagation();


            const shareData = {
                title:
                    "Rahul Live",

                text:
                    video.caption ||
                    "Watch this Short Video",

                url:
                    window.location.href
            };


            try {

                if (
                    navigator.share
                ) {

                    await navigator.share(
                        shareData
                    );

                } else if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        window.location.href
                    );

                    alert(
                        "Link copied."
                    );

                }

            } catch {

                // Share cancelled.

            }
        };


    actions.appendChild(likeButton);
    actions.appendChild(likeCount);

    actions.appendChild(commentButton);
    actions.appendChild(commentCount);

    actions.appendChild(shareButton);
    actions.appendChild(shareCount);


    overlay.appendChild(info);
    overlay.appendChild(actions);


    card.appendChild(videoElement);
    card.appendChild(overlay);


    let viewed = false;


    videoElement.addEventListener(
        "play",
        () => {

            if (
                viewed ||
                !currentUser
            )
                return;


            viewed = true;


            api(
                "/api/videos/view",
                {
                    method: "POST",

                    body: JSON.stringify({
                        video_id:
                            video.id,

                        user_id:
                            currentUser.id
                    })
                }
            );

        }
    );


    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".videoActions"
                )
            )
                return;


            videoElement.muted =
                !videoElement.muted;
        }
    );


    return card;
}


/* =========================================================
   VIDEO AUTO PLAY
========================================================= */

function setupVideoObserver() {

    const videos =
        document.querySelectorAll(
            ".videoCard video"
        );


    if (!videos.length)
        return;


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        const video =
                            entry.target;


                        if (
                            entry.isIntersecting
                        ) {

                            videos.forEach(
                                other => {

                                    if (
                                        other !== video
                                    ) {

                                        other.pause();

                                    }

                                }
                            );


                            video
                                .play()
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
                threshold: 0.75
            }
        );


    videos.forEach(
        video => {

            observer.observe(video);

        }
    );
}


/* =========================================================
   VIDEO FILE SELECT
========================================================= */

function setupVideoSelection() {

    const input =
        $("videoFile");


    if (!input)
        return;


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            if (!file) {

                $("selectedVideo")
                    .textContent =
                    "No video selected";


                $("uploadPreview")
                    .style.display =
                    "none";


                return;
            }


            $("selectedVideo")
                .textContent =
                file.name;


            const preview =
                $("uploadPreview");


            preview.src =
                URL.createObjectURL(file);


            preview.style.display =
                "block";
        }
    );
}


/* =========================================================
   UPLOAD VIDEO
========================================================= */

async function uploadVideo() {

    const input =
        $("videoFile");


    const file =
        input?.files?.[0];


    if (!file) {

        showUploadMessage(
            "पहले video select करें।"
        );

        return;
    }


    /*
     * D1 database में actual video file
     * store नहीं करनी चाहिए।
     *
     * Actual video storage/streaming service
     * connect करने के बाद यहां real upload
     * होगा।
     */

    showUploadMessage(
        "Video storage अभी connect करना बाकी है।",
        false
    );
}


/* =========================================================
   LIVE LIST
========================================================= */

async function loadLiveStreams() {

    const grid =
        $("liveGrid");


    if (!grid)
        return;


    grid.innerHTML = `
        <div style="
            grid-column:1/-1;
            padding:30px;
            text-align:center;
            color:#777;
        ">
            LIVE loading...
        </div>
    `;


    const result =
        await api("/api/live");


    if (!result.success) {

        grid.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:30px;
                text-align:center;
                color:#ff526f;
            ">
                ${escapeHtml(
                    result.error ||
                    "LIVE load नहीं हुआ।"
                )}
            </div>
        `;

        return;
    }


    const streams =
        result.live_streams || [];


    if (!streams.length) {

        grid.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:40px 20px;
                text-align:center;
                color:#777;
            ">
                🔴<br><br>
                अभी कोई LIVE नहीं है।
            </div>
        `;

        return;
    }


    grid.innerHTML = "";


    streams.forEach(
        stream => {

            const card =
                document.createElement("div");


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
                    ${escapeHtml(
                        stream.title ||
                        "Live Stream"
                    )}

                    <br>

                    <span style="
                        color:#888;
                        font-size:11px;
                    ">
                        @${escapeHtml(
                            stream.username ||
                            "user"
                        )}
                    </span>
                </div>
            `;


            card.onclick =
                () => {

                    alert(
                        "Real LIVE playback को streaming provider से connect करना बाकी है।"
                    );

                };


            grid.appendChild(card);

        }
    );
}


/* =========================================================
   OPEN LIVE STUDIO
========================================================= */

async function openLiveStudio() {

    if (!currentUser) {

        alert(
            "पहले Login करें।"
        );

        return;
    }


    $("liveStudio")
        ?.classList.add("active");


    try {

        liveStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: {
                        facingMode: "user"
                    },

                    audio: true
                }
            );


        $("livePreview").srcObject =
            liveStream;


    } catch (error) {

        $("liveStudio")
            ?.classList.remove("active");


        alert(
            "Camera और Microphone permission जरूरी है।"
        );
    }
}


/* =========================================================
   START LIVE
========================================================= */

async function startLive() {

    if (!currentUser) {

        alert(
            "पहले Login करें।"
        );

        return;
    }


    const title =
        $("liveTitle")
            .value
            .trim() ||
        "Rahul Live";


    const result =
        await api(
            "/api/live/start",
            {
                method: "POST",

                body: JSON.stringify({
                    user_id:
                        currentUser.id,

                    title
                })
            }
        );


    if (!result.success) {

        alert(
            result.error ||
            "LIVE start नहीं हुआ।"
        );

        return;
    }


    currentLiveId =
        result.live_id;


    $("goLiveConfirmBtn")
        .style.display =
        "none";


    $("endLiveBtn")
        .style.display =
        "block";


    alert(
        "LIVE session शुरू हो गई है।"
    );
}


/* =========================================================
   END LIVE
========================================================= */

async function endLive() {

    if (!currentLiveId) {

        closeLiveStudio();

        return;
    }


    const result =
        await api(
            "/api/live/end",
            {
                method: "POST",

                body: JSON.stringify({
                    live_id:
                        currentLiveId
                })
            }
        );


    if (!result.success) {

        alert(
            result.error ||
            "LIVE बंद नहीं हुआ।"
        );

        return;
    }


    currentLiveId =
        null;


    $("goLiveConfirmBtn")
        .style.display =
        "block";


    $("endLiveBtn")
        .style.display =
        "none";


    stopCamera();


    $("liveStudio")
        .classList.remove("active");


    loadLiveStreams();
}


/* =========================================================
   CLOSE LIVE STUDIO
========================================================= */

function closeLiveStudio() {

    if (currentLiveId) {

        const answer =
            confirm(
                "LIVE चालू है। क्या LIVE बंद करना है?"
            );


        if (answer) {

            endLive();

        }

        return;
    }


    stopCamera();


    $("liveStudio")
        ?.classList.remove("active");
}


/* =========================================================
   STOP CAMERA
========================================================= */

function stopCamera() {

    if (!liveStream)
        return;


    liveStream
        .getTracks()
        .forEach(
            track => track.stop()
        );


    liveStream =
        null;


    if ($("livePreview")) {

        $("livePreview")
            .srcObject =
            null;
    }
}


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser)
        return;


    const result =
        await api(
            "/api/profile?username=" +
            encodeURIComponent(
                currentUser.username
            )
        );


    if (
        !result.success ||
        !result.user
    )
        return;


    const user =
        result.user;


    currentUser = {
        ...currentUser,
        ...user
    };


    localStorage.setItem(
        "rahulLiveUser",
        JSON.stringify(currentUser)
    );


    $("profileName")
        .textContent =
        user.username ||
        "User";


    $("profileUsername")
        .textContent =
        "@" +
        (
            user.username ||
            "user"
        );


    $("profileVideos")
        .textContent =
        user.videos_count || 0;


    $("profileFollowers")
        .textContent =
        user.followers_count || 0;


    $("profileFollowing")
        .textContent =
        user.following_count || 0;


    $("profileBio")
        .textContent =
        user.bio || "";


    $("profileAvatar")
        .textContent =
        (
            user.username ||
            "R"
        )
        .charAt(0)
        .toUpperCase();
}


/* =========================================================
   HTML SECURITY
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatCount(value) {

    const number =
        Number(value || 0);


    if (number >= 1000000) {

        return (
            number / 1000000
        )
        .toFixed(1)
        .replace(
            ".0",
            ""
        ) + "M";
    }


    if (number >= 1000) {

        return (
            number / 1000
        )
        .toFixed(1)
        .replace(
            ".0",
            ""
        ) + "K";
    }


    return String(number);
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* LOGIN / REGISTER */

        $("loginTab")
            ?.addEventListener(
                "click",
                showLogin
            );


        $("registerTab")
            ?.addEventListener(
                "click",
                showRegister
            );


        $("loginForm")
            ?.addEventListener(
                "submit",
                loginUser
            );


        $("registerForm")
            ?.addEventListener(
                "submit",
                registerUser
            );


        /* NAVIGATION */

        document
            .querySelectorAll(".navBtn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );

                    }
                );

            });


        /* TOP LIVE */

        $("topLiveBtn")
            ?.addEventListener(
                "click",
                () => {

                    showPage(
                        "livePage"
                    );

                }
            );


        /* LIVE */

        $("startLiveBtn")
            ?.addEventListener(
                "click",
                openLiveStudio
            );


        $("goLiveConfirmBtn")
            ?.addEventListener(
                "click",
                startLive
            );


        $("endLiveBtn")
            ?.addEventListener(
                "click",
                endLive
            );


        $("closeLiveStudio")
            ?.addEventListener(
                "click",
                closeLiveStudio
            );


        /* VIDEO */

        setupVideoSelection();


        $("uploadVideoBtn")
            ?.addEventListener(
                "click",
                uploadVideo
            );


        /* LOGOUT */

        $("logoutBtn")
            ?.addEventListener(
                "click",
                logout
            );


        /* EXISTING SESSION */

        if (currentUser) {

            openApp();

        } else {

            $("authScreen")
                .style.display =
                "flex";


            $("appScreen")
                .style.display =
                "none";


            showLogin();

        }

    }
);