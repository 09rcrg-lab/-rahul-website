/* =========================================
   RAHUL LIVE — SCRIPT.JS
   PART 1
   Core App + Authentication Foundation
   ========================================= */

"use strict";

/* =========================================
   CONFIGURATION
   ========================================= */

const API_BASE_URL = window.RAHUL_API_BASE_URL || "";

const APP_NAME = "Rahul Live";

const STORAGE_KEYS = {
    token: "rahul_live_token",
    user: "rahul_live_user",
    settings: "rahul_live_settings",
    currentRoom: "rahul_live_current_room"
};


/* =========================================
   APP STATE
   ========================================= */

const AppState = {
    initialized: false,
    authenticated: false,
    token: null,
    user: null,
    currentScreen: null,
    currentRoom: null,
    selectedUser: null,
    selectedChat: null,
    selectedProfile: null,
    notifications: [],
    friends: [],
    following: [],
    liveRooms: [],
    messages: [],
    isAdmin: false
};


/* =========================================
   DOM HELPERS
   ========================================= */

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

function showElement(element) {
    if (!element) return;
    element.classList.remove("hidden");
}

function hideElement(element) {
    if (!element) return;
    element.classList.add("hidden");
}

function setText(element, text) {
    if (!element) return;
    element.textContent = text ?? "";
}

function safeJsonParse(value, fallback = null) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}


/* =========================================
   LOCAL STORAGE
   ========================================= */

function saveStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            typeof value === "string"
                ? value
                : JSON.stringify(value)
        );
    } catch (error) {
        console.error("Storage save error:", error);
    }
}

function getStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error("Storage read error:", error);
        return null;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Storage remove error:", error);
    }
}


/* =========================================
   TOAST
   ========================================= */

function showToast(message, duration = 2500) {

    let toast = $("appToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "appToast";
        toast.className = "toast hidden";

        document.body.appendChild(toast);
    }

    setText(toast, message);
    showElement(toast);

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        hideElement(toast);
    }, duration);
}


/* =========================================
   API REQUEST
   ========================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (AppState.token) {
        headers.Authorization =
            `Bearer ${AppState.token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = {
            success: response.ok
        };
    }

    if (!response.ok) {

        const message =
            data?.message ||
            data?.error ||
            `Request failed (${response.status})`;

        throw new Error(message);
    }

    return data;
}


/* =========================================
   AUTH STORAGE
   ========================================= */

function loadAuthentication() {

    const token =
        getStorage(STORAGE_KEYS.token);

    const userRaw =
        getStorage(STORAGE_KEYS.user);

    const user =
        safeJsonParse(userRaw, null);

    if (token && user) {

        AppState.token = token;
        AppState.user = user;
        AppState.authenticated = true;

        AppState.isAdmin =
            user.role === "admin";

        return true;
    }

    return false;
}

function saveAuthentication(token, user) {

    AppState.token = token;
    AppState.user = user;
    AppState.authenticated = true;

    AppState.isAdmin =
        user?.role === "admin";

    saveStorage(
        STORAGE_KEYS.token,
        token
    );

    saveStorage(
        STORAGE_KEYS.user,
        user
    );
}

function clearAuthentication() {

    AppState.token = null;
    AppState.user = null;
    AppState.authenticated = false;
    AppState.isAdmin = false;

    removeStorage(STORAGE_KEYS.token);
    removeStorage(STORAGE_KEYS.user);
}


/* =========================================
   SCREEN MANAGEMENT
   ========================================= */

function getScreens() {

    return document.querySelectorAll(
        ".screen"
    );
}

function showScreen(screenId) {

    const screen = $(screenId);

    if (!screen) {
        console.warn(
            `Screen not found: ${screenId}`
        );
        return;
    }

    getScreens().forEach(
        screenElement => {
            screenElement.classList.add("hidden");
        }
    );

    screen.classList.remove("hidden");

    AppState.currentScreen =
        screenId;

    window.scrollTo(0, 0);
}

function requireAuthentication() {

    if (!AppState.authenticated) {

        showScreen("authScreen");

        return false;
    }

    return true;
}

function openAppHome() {

    if (!requireAuthentication()) {
        return;
    }

    showScreen("homeScreen");

    loadHomeData();
}


/* =========================================
   SPLASH
   ========================================= */

function hideSplash() {

    const splash =
        $("splashScreen");

    if (!splash) return;

    hideElement(splash);
}

function initializeSplash() {

    setTimeout(() => {

        hideSplash();

        if (loadAuthentication()) {

            openAppHome();

        } else {

            showScreen("authScreen");
        }

    }, 700);
}


/* =========================================
   AUTH UI
   ========================================= */

function setAuthMode(mode) {

    const loginForm =
        $("loginForm");

    const registerForm =
        $("registerForm");

    const loginTab =
        $("loginTab");

    const registerTab =
        $("registerTab");

    if (mode === "register") {

        hideElement(loginForm);
        showElement(registerForm);

        if (loginTab) {
            loginTab.classList.remove(
                "active"
            );
        }

        if (registerTab) {
            registerTab.classList.add(
                "active"
            );
        }

    } else {

        showElement(loginForm);
        hideElement(registerForm);

        if (loginTab) {
            loginTab.classList.add(
                "active"
            );
        }

        if (registerTab) {
            registerTab.classList.remove(
                "active"
            );
        }
    }
}


/* =========================================
   LOGIN
   ========================================= */

async function loginUser() {

    const identifier =
        $("loginIdentifier")?.value.trim();

    const password =
        $("loginPassword")?.value;

    const status =
        $("loginStatus");

    if (!identifier || !password) {

        setText(
            status,
            "Username/email aur password bharna zaroori hai."
        );

        return;
    }

    setText(
        status,
        "Login ho raha hai..."
    );

    try {

        const result =
            await apiRequest(
                "/api/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        identifier,
                        password
                    })
                }
            );

        if (
            !result?.success ||
            !result?.token ||
            !result?.user
        ) {

            throw new Error(
                result?.message ||
                "Login failed."
            );
        }

        saveAuthentication(
            result.token,
            result.user
        );

        setText(
            status,
            ""
        );

        showToast(
            "Login successful."
        );

        openAppHome();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        setText(
            status,
            error.message ||
            "Login failed."
        );
    }
}


/* =========================================
   REGISTER
   ========================================= */

async function registerUser() {

    const username =
        $("registerUsername")?.value.trim();

    const email =
        $("registerEmail")?.value.trim();

    const password =
        $("registerPassword")?.value;

    const confirmPassword =
        $("registerConfirmPassword")?.value;

    const status =
        $("registerStatus");

    if (
        !username ||
        !email ||
        !password ||
        !confirmPassword
    ) {

        setText(
            status,
            "Sabhi fields bharna zaroori hai."
        );

        return;
    }

    if (password.length < 6) {

        setText(
            status,
            "Password kam se kam 6 characters ka hona chahiye."
        );

        return;
    }

    if (password !== confirmPassword) {

        setText(
            status,
            "Passwords match nahi kar rahe."
        );

        return;
    }

    setText(
        status,
        "Account create ho raha hai..."
    );

    try {

        const result =
            await apiRequest(
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

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Registration failed."
            );
        }

        if (
            result.token &&
            result.user
        ) {

            saveAuthentication(
                result.token,
                result.user
            );

            showToast(
                "Account successfully created."
            );

            openAppHome();

            return;
        }

        setText(
            status,
            "Account ban gaya. Ab Login karein."
        );

        setAuthMode("login");

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        setText(
            status,
            error.message ||
            "Registration failed."
        );
    }
}


/* =========================================
   LOGOUT
   ========================================= */

function logoutUser() {

    clearAuthentication();

    AppState.currentRoom = null;
    AppState.selectedUser = null;
    AppState.selectedChat = null;

    removeStorage(
        STORAGE_KEYS.currentRoom
    );

    showScreen("authScreen");

    setAuthMode("login");

    showToast(
        "You have been logged out."
    );
}


/* =========================================
   PROFILE DATA
   ========================================= */

function updateCurrentUserUI() {

    const user =
        AppState.user;

    if (!user) return;

    const name =
        user.name ||
        user.username ||
        "User";

    const username =
        user.username ||
        "";

    const avatar =
        user.avatar ||
        user.profile_photo ||
        "";

    const elements = [
        "currentUserName",
        "profileName",
        "viewProfileName"
    ];

    elements.forEach(id => {

        const element = $(id);

        if (element) {
            setText(
                element,
                name
            );
        }
    });

    const usernameElements = [
        "profileUsername",
        "viewProfileUsername"
    ];

    usernameElements.forEach(id => {

        const element = $(id);

        if (element) {

            setText(
                element,
                username
                    ? `@${username}`
                    : ""
            );
        }
    });

    const avatarElements = [
        "profileAvatar",
        "viewProfileAvatar"
    ];

    avatarElements.forEach(id => {

        const element = $(id);

        if (
            element &&
            avatar
        ) {
            element.src = avatar;
        }
    });
}


/* =========================================
   HOME
   ========================================= */

async function loadHomeData() {

    if (!AppState.authenticated) {
        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/home",
                {
                    method: "GET"
                }
            );

        if (
            result?.rooms &&
            Array.isArray(result.rooms)
        ) {

            AppState.liveRooms =
                result.rooms;

            renderLiveRooms();
        }

    } catch (error) {

        console.warn(
            "Home API unavailable:",
            error.message
        );
    }

    updateCurrentUserUI();
}


/* =========================================
   LIVE ROOMS RENDER
   ========================================= */

function renderLiveRooms() {

    const container =
        $("liveRoomsContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(
            AppState.liveRooms
        ) ||
        AppState.liveRooms.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎙️</div>
                <strong>No live rooms</strong>
                <p>Abhi koi live room available nahi hai.</p>
            </div>
        `;

        return;
    }

    AppState.liveRooms.forEach(
        room => {

            const card =
                document.createElement("button");

            card.type = "button";
            card.className =
                "live-room-card";

            card.dataset.roomId =
                room.id;

            card.innerHTML = `
                <div class="live-badge">LIVE</div>

                <div class="viewer-badge">
                    👁 ${Number(room.viewers || 0)}
                </div>

                ${
                    room.cover
                        ? `<img src="${escapeHtml(room.cover)}" alt="">`
                        : ""
                }

                <div class="live-room-card-content">

                    <div class="live-room-card-title">
                        ${escapeHtml(
                            room.title ||
                            "Live Room"
                        )}
                    </div>

                    <div class="live-room-card-meta">

                        <span>
                            ${
                                escapeHtml(
                                    room.host_name ||
                                    "Host"
                                )
                            }
                        </span>

                        <span>
                            🎙️
                            ${
                                Number(
                                    room.seats || 0
                                )
                            }
                        </span>

                    </div>

                </div>
            `;

            card.addEventListener(
                "click",
                () => {
                    joinLiveRoom(
                        room.id
                    );
                }
            );

            container.appendChild(card);
        }
    );
}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================
   INITIALIZATION
   ========================================= */

function initializeApp() {

    if (AppState.initialized) {
        return;
    }

    AppState.initialized = true;

    bindAuthenticationEvents();

    bindNavigationEvents();

    updateCurrentUserUI();

    initializeSplash();
}


/* =========================================
   AUTH EVENTS
   ========================================= */

function bindAuthenticationEvents() {

    $("loginButton")
        ?.addEventListener(
            "click",
            loginUser
        );

    $("registerButton")
        ?.addEventListener(
            "click",
            registerUser
        );

    $("showRegisterButton")
        ?.addEventListener(
            "click",
            () => setAuthMode("register")
        );

    $("showLoginButton")
        ?.addEventListener(
            "click",
            () => setAuthMode("login")
        );

    $("loginTab")
        ?.addEventListener(
            "click",
            () => setAuthMode("login")
        );

    $("registerTab")
        ?.addEventListener(
            "click",
            () => setAuthMode("register")
        );

    $("logoutButton")
        ?.addEventListener(
            "click",
            logoutUser
        );
}


/* =========================================
   NAVIGATION EVENTS
   ========================================= */

function bindNavigationEvents() {

    $all("[data-screen]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.screen;

                    if (!target) {
                        return;
                    }

                    if (
                        target !==
                        "authScreen" &&
                        !requireAuthentication()
                    ) {
                        return;
                    }

                    showScreen(target);
                }
            );
        });
}


/* =========================================
   LIVE ROOM PLACEHOLDER ENTRY
   ========================================= */

async function joinLiveRoom(roomId) {

    if (!requireAuthentication()) {
        return;
    }

    if (!roomId) {
        showToast(
            "Room ID missing."
        );
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/join`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Room join failed."
            );
        }

        AppState.currentRoom =
            result.room ||
            { id: roomId };

        saveStorage(
            STORAGE_KEYS.currentRoom,
            AppState.currentRoom
        );

        showScreen(
            "liveRoomScreen"
        );

    } catch (error) {

        console.error(
            "Join room error:",
            error
        );

        showToast(
            error.message ||
            "Room join nahi ho paya."
        );
    }
}


/* =========================================
   START
   ========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
}/* =========================================
   RAHUL LIVE — SCRIPT.JS
   PART 2
   Navigation + Profile + Settings + Search
   ========================================= */


/* =========================================
   GENERIC AUTH CHECK
   ========================================= */

function openProtectedScreen(screenId) {

    if (!AppState.authenticated) {
        showScreen("authScreen");
        return false;
    }

    showScreen(screenId);
    return true;
}


/* =========================================
   HOME / DISCOVER / FRIENDS
   ========================================= */

function openHome() {

    if (!openProtectedScreen("homeScreen")) {
        return;
    }

    loadHomeData();
}

function openDiscover() {

    if (!openProtectedScreen("discoverScreen")) {
        return;
    }

    searchUsers("");
}

function openFriends() {

    if (!openProtectedScreen("friendsScreen")) {
        return;
    }

    loadFriends();
}


/* =========================================
   PROFILE SCREEN
   ========================================= */

async function openMyProfile() {

    if (!openProtectedScreen("profileScreen")) {
        return;
    }

    updateCurrentUserUI();

    try {

        const result =
            await apiRequest(
                "/api/profile",
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            result?.user
        ) {

            AppState.user =
                result.user;

            saveStorage(
                STORAGE_KEYS.user,
                result.user
            );

            updateCurrentUserUI();
        }

    } catch (error) {

        console.warn(
            "Profile API:",
            error.message
        );
    }
}


/* =========================================
   PUBLIC USER PROFILE
   ========================================= */

async function openUserProfile(userId) {

    if (!openProtectedScreen("userProfileScreen")) {
        return;
    }

    if (!userId) {
        showToast("User ID missing.");
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}`,
                {
                    method: "GET"
                }
            );

        if (
            !result?.success ||
            !result?.user
        ) {

            throw new Error(
                result?.message ||
                "Profile load failed."
            );
        }

        AppState.selectedProfile =
            result.user;

        renderUserProfile(
            result.user
        );

    } catch (error) {

        console.error(
            "User profile:",
            error
        );

        showToast(
            error.message ||
            "Profile load nahi hua."
        );
    }
}


/* =========================================
   RENDER USER PROFILE
   ========================================= */

function renderUserProfile(user) {

    const name =
        user.name ||
        user.username ||
        "User";

    const username =
        user.username ||
        "";

    const avatar =
        user.avatar ||
        user.profile_photo ||
        "";

    const bio =
        user.bio ||
        "";

    setText(
        $("userProfileName"),
        name
    );

    setText(
        $("userProfileUsername"),
        username
            ? `@${username}`
            : ""
    );

    setText(
        $("userProfileBio"),
        bio
    );

    const avatarElement =
        $("userProfileAvatar");

    if (
        avatarElement &&
        avatar
    ) {
        avatarElement.src =
            avatar;
    }

    setText(
        $("userFollowers"),
        Number(
            user.followers || 0
        ).toLocaleString()
    );

    setText(
        $("userFollowing"),
        Number(
            user.following || 0
        ).toLocaleString()
    );

    setText(
        $("userFriends"),
        Number(
            user.friends || 0
        ).toLocaleString()
    );

    const followButton =
        $("followUserButton");

    if (followButton) {

        const following =
            Boolean(
                user.is_following
            );

        followButton.textContent =
            following
                ? "Following"
                : "Follow";

        followButton.classList.toggle(
            "active",
            following
        );
    }
}


/* =========================================
   EDIT PROFILE
   ========================================= */

function openEditProfile() {

    if (!openProtectedScreen(
        "editProfileScreen"
    )) {
        return;
    }

    const user =
        AppState.user;

    if (!user) return;

    const name =
        user.name ||
        user.username ||
        "";

    const username =
        user.username ||
        "";

    const bio =
        user.bio ||
        "";

    if ($("editName")) {
        $("editName").value =
            name;
    }

    if ($("editUsername")) {
        $("editUsername").value =
            username;
    }

    if ($("editBio")) {
        $("editBio").value =
            bio;
    }

    const avatar =
        user.avatar ||
        user.profile_photo ||
        "";

    if (
        avatar &&
        $("editProfileAvatar")
    ) {
        $("editProfileAvatar").src =
            avatar;
    }
}


/* =========================================
   SAVE PROFILE
   ========================================= */

async function saveProfileChanges() {

    if (!requireAuthentication()) {
        return;
    }

    const name =
        $("editName")?.value.trim();

    const username =
        $("editUsername")?.value.trim();

    const bio =
        $("editBio")?.value.trim();

    if (!name) {

        showToast(
            "Name required hai."
        );

        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/profile",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        name,
                        username,
                        bio
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Profile update failed."
            );
        }

        if (result.user) {

            AppState.user =
                result.user;

            saveStorage(
                STORAGE_KEYS.user,
                result.user
            );
        }

        updateCurrentUserUI();

        showToast(
            "Profile updated."
        );

        showScreen(
            "profileScreen"
        );

    } catch (error) {

        console.error(
            "Profile update:",
            error
        );

        showToast(
            error.message ||
            "Profile update nahi hua."
        );
    }
}


/* =========================================
   PROFILE PHOTO
   ========================================= */

async function uploadProfilePhoto(file) {

    if (!requireAuthentication()) {
        return;
    }

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        showToast(
            "Sirf image file upload karein."
        );

        return;
    }

    const maxSize =
        5 * 1024 * 1024;

    if (file.size > maxSize) {

        showToast(
            "Image 5MB se chhoti honi chahiye."
        );

        return;
    }

    try {

        const formData =
            new FormData();

        formData.append(
            "avatar",
            file
        );

        const headers = {};

        if (AppState.token) {
            headers.Authorization =
                `Bearer ${AppState.token}`;
        }

        const response =
            await fetch(
                `${API_BASE_URL}/api/profile/avatar`,
                {
                    method: "POST",
                    headers,
                    body: formData
                }
            );

        const result =
            await response.json();

        if (!response.ok ||
            !result?.success) {

            throw new Error(
                result?.message ||
                "Photo upload failed."
            );
        }

        if (result.user) {

            AppState.user =
                result.user;

            saveStorage(
                STORAGE_KEYS.user,
                result.user
            );
        }

        updateCurrentUserUI();

        const avatar =
            result.avatar ||
            result.user?.avatar ||
            result.user?.profile_photo;

        if (
            avatar &&
            $("editProfileAvatar")
        ) {
            $("editProfileAvatar").src =
                avatar;
        }

        showToast(
            "Profile photo updated."
        );

    } catch (error) {

        console.error(
            "Avatar upload:",
            error
        );

        showToast(
            error.message ||
            "Photo upload nahi hua."
        );
    }
}


/* =========================================
   SEARCH USERS
   ========================================= */

let userSearchTimer = null;

async function searchUsers(query = "") {

    if (!requireAuthentication()) {
        return;
    }

    const cleanQuery =
        String(query).trim();

    clearTimeout(
        userSearchTimer
    );

    userSearchTimer =
        setTimeout(
            async () => {

                try {

                    const result =
                        await apiRequest(
                            `/api/users/search?q=${encodeURIComponent(cleanQuery)}`,
                            {
                                method: "GET"
                            }
                        );

                    if (
                        result?.success &&
                        Array.isArray(
                            result.users
                        )
                    ) {

                        renderUserSearchResults(
                            result.users
                        );
                    }

                } catch (error) {

                    console.warn(
                        "User search:",
                        error.message
                    );
                }

            },
            250
        );
}


/* =========================================
   SEARCH RESULTS
   ========================================= */

function renderUserSearchResults(
    users
) {

    const container =
        $("userSearchResults");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !users ||
        users.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔎</div>
                <strong>User nahi mila</strong>
                <p>Dusra username search karein.</p>
            </div>
        `;

        return;
    }

    users.forEach(user => {

        const item =
            document.createElement("button");

        item.type = "button";
        item.className =
            "search-user-item";

        const avatar =
            user.avatar ||
            user.profile_photo ||
            "";

        item.innerHTML = `

            ${
                avatar
                    ? `<img src="${escapeHtml(avatar)}" alt="">`
                    : `<div class="search-user-avatar">👤</div>`
            }

            <div class="search-user-info">

                <strong>
                    ${escapeHtml(
                        user.name ||
                        user.username ||
                        "User"
                    )}
                </strong>

                <small>
                    ${
                        user.username
                            ? `@${escapeHtml(user.username)}`
                            : ""
                    }
                </small>

            </div>

            <span>›</span>
        `;

        item.addEventListener(
            "click",
            () => {
                openUserProfile(
                    user.id
                );
            }
        );

        container.appendChild(item);
    });
}


/* =========================================
   FOLLOW / UNFOLLOW
   ========================================= */

async function toggleFollowUser(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        return;
    }

    const button =
        $("followUserButton");

    if (button) {
        button.disabled = true;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}/follow`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Follow action failed."
            );
        }

        if (
            AppState.selectedProfile &&
            String(
                AppState.selectedProfile.id
            ) === String(userId)
        ) {

            AppState.selectedProfile.is_following =
                Boolean(
                    result.following
                );

            AppState.selectedProfile.followers =
                Number(
                    result.followers ??
                    AppState.selectedProfile.followers ??
                    0
                );

            renderUserProfile(
                AppState.selectedProfile
            );
        }

        showToast(
            result.following
                ? "Following"
                : "Unfollowed"
        );

    } catch (error) {

        console.error(
            "Follow:",
            error
        );

        showToast(
            error.message ||
            "Action failed."
        );

    } finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================
   FRIENDS
   ========================================= */

async function loadFriends() {

    if (!requireAuthentication()) {
        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/friends",
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            Array.isArray(result.friends)
        ) {

            AppState.friends =
                result.friends;

            renderFriends(
                result.friends
            );
        }

    } catch (error) {

        console.warn(
            "Friends:",
            error.message
        );

        renderFriends([]);
    }
}


/* =========================================
   RENDER FRIENDS
   ========================================= */

function renderFriends(
    friends
) {

    const container =
        $("friendsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !friends ||
        friends.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <strong>No friends yet</strong>
                <p>Users ko follow karke connect karein.</p>
            </div>
        `;

        return;
    }

    friends.forEach(friend => {

        const item =
            document.createElement("button");

        item.type = "button";
        item.className =
            "room-member";

        const avatar =
            friend.avatar ||
            friend.profile_photo ||
            "";

        item.innerHTML = `

            ${
                avatar
                    ? `<img src="${escapeHtml(avatar)}" alt="">`
                    : `<div class="search-user-avatar">👤</div>`
            }

            <div class="room-member-info">

                <strong>
                    ${escapeHtml(
                        friend.name ||
                        friend.username ||
                        "User"
                    )}
                </strong>

                <small>
                    ${
                        friend.online
                            ? "Online"
                            : "Offline"
                    }
                </small>

            </div>

            <span>
                ${friend.online ? "🟢" : "⚪"}
            </span>
        `;

        item.addEventListener(
            "click",
            () => {
                openUserProfile(
                    friend.id
                );
            }
        );

        container.appendChild(item);
    });
}


/* =========================================
   SETTINGS
   ========================================= */

function openSettings() {

    if (!openProtectedScreen(
        "settingsScreen"
    )) {
        return;
    }

    const saved =
        safeJsonParse(
            getStorage(
                STORAGE_KEYS.settings
            ),
            {}
        );

    if ($("settingNotifications")) {
        $("settingNotifications").checked =
            saved.notifications !== false;
    }

    if ($("settingSound")) {
        $("settingSound").checked =
            saved.sound !== false;
    }
}


/* =========================================
   SAVE SETTINGS
   ========================================= */

function saveSettings() {

    const settings = {

        notifications:
            $("settingNotifications")
                ?.checked !== false,

        sound:
            $("settingSound")
                ?.checked !== false
    };

    saveStorage(
        STORAGE_KEYS.settings,
        settings
    );

    showToast(
        "Settings saved."
    );
}


/* =========================================
   NOTIFICATIONS
   ========================================= */

async function loadNotifications() {

    if (!requireAuthentication()) {
        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/notifications",
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            Array.isArray(
                result.notifications
            )
        ) {

            AppState.notifications =
                result.notifications;

            renderNotifications(
                result.notifications
            );
        }

    } catch (error) {

        console.warn(
            "Notifications:",
            error.message
        );
    }
}


/* =========================================
   RENDER NOTIFICATIONS
   ========================================= */

function renderNotifications(
    notifications
) {

    const container =
        $("notificationsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !notifications ||
        notifications.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔔</div>
                <strong>No notifications</strong>
                <p>Abhi koi notification nahi hai.</p>
            </div>
        `;

        return;
    }

    notifications.forEach(notification => {

        const item =
            document.createElement("div");

        item.className =
            "notification-item";

        item.innerHTML = `

            <div class="notification-icon">
                ${notification.icon || "🔔"}
            </div>

            <div class="notification-content">

                <strong>
                    ${escapeHtml(
                        notification.title ||
                        "Notification"
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        notification.message ||
                        ""
                    )}
                </p>

                <small>
                    ${escapeHtml(
                        notification.created_at ||
                        ""
                    )}
                </small>

            </div>
        `;

        container.appendChild(item);
    });
}


/* =========================================
   GLOBAL EVENT BINDINGS — PART 2
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.action;

        switch (action) {

            case "home":
                openHome();
                break;

            case "discover":
                openDiscover();
                break;

            case "friends":
                openFriends();
                break;

            case "profile":
                openMyProfile();
                break;

            case "edit-profile":
                openEditProfile();
                break;

            case "save-profile":
                saveProfileChanges();
                break;

            case "settings":
                openSettings();
                break;

            case "save-settings":
                saveSettings();
                break;

            case "notifications":
                openProtectedScreen(
                    "notificationsScreen"
                );
                loadNotifications();
                break;

            case "logout":
                logoutUser();
                break;

            case "back":
                history.back();
                break;
        }
    }
);


/* =========================================
   SEARCH INPUT
   ========================================= */

document.addEventListener(
    "input",
    event => {

        const input =
            event.target.closest(
                "[data-user-search]"
            );

        if (!input) {
            return;
        }

        searchUsers(
            input.value
        );
    }
);


/* =========================================
   PROFILE PHOTO INPUT
   ========================================= */

document.addEventListener(
    "change",
    event => {

        const input =
            event.target.closest(
                "[data-profile-photo]"
            );

        if (!input) {
            return;
        }

        const file =
            input.files?.[0];

        if (file) {
            uploadProfilePhoto(file);
        }
    }
);/* =========================================
   RAHUL LIVE — SCRIPT.JS
   PART 3
   Personal Messages + Live Chat
   ========================================= */


/* =========================================
   CHAT STATE
   ========================================= */

const ChatState = {
    conversations: [],
    activeConversation: null,
    activeMessages: [],
    pollingTimer: null,
    typingTimer: null,
    sending: false
};


/* =========================================
   OPEN PERSONAL CHAT
   ========================================= */

async function openPersonalChat(userId) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        showToast("User ID missing.");
        return;
    }

    try {

        const result = await apiRequest(
            `/api/chats/${encodeURIComponent(userId)}`,
            {
                method: "GET"
            }
        );

        if (!result?.success) {
            throw new Error(
                result?.message ||
                "Chat open nahi hua."
            );
        }

        ChatState.activeConversation =
            result.conversation || {
                user_id: userId
            };

        ChatState.activeMessages =
            Array.isArray(result.messages)
                ? result.messages
                : [];

        renderPersonalChat();

        showScreen("personalChatScreen");

        startPersonalChatPolling();

    } catch (error) {

        console.error(
            "Open personal chat:",
            error
        );

        showToast(
            error.message ||
            "Chat open nahi hua."
        );
    }
}


/* =========================================
   LOAD CONVERSATIONS
   ========================================= */

async function loadConversations() {

    if (!requireAuthentication()) {
        return;
    }

    try {

        const result = await apiRequest(
            "/api/chats",
            {
                method: "GET"
            }
        );

        if (
            result?.success &&
            Array.isArray(result.conversations)
        ) {

            ChatState.conversations =
                result.conversations;

            renderConversations(
                result.conversations
            );
        }

    } catch (error) {

        console.warn(
            "Conversations:",
            error.message
        );

        renderConversations([]);
    }
}


/* =========================================
   RENDER CONVERSATIONS
   ========================================= */

function renderConversations(
    conversations
) {

    const container =
        $("conversationsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !conversations ||
        conversations.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <strong>No messages</strong>
                <p>Abhi koi personal conversation nahi hai.</p>
            </div>
        `;

        return;
    }

    conversations.forEach(
        conversation => {

            const item =
                document.createElement("button");

            item.type = "button";
            item.className =
                "conversation-item";

            const avatar =
                conversation.avatar ||
                conversation.profile_photo ||
                "";

            item.innerHTML = `

                ${
                    avatar
                        ? `
                            <img
                                src="${escapeHtml(avatar)}"
                                alt=""
                            >
                        `
                        : `
                            <div class="conversation-avatar">
                                👤
                            </div>
                        `
                }

                <div class="conversation-info">

                    <strong>
                        ${escapeHtml(
                            conversation.name ||
                            conversation.username ||
                            "User"
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            conversation.last_message ||
                            ""
                        )}
                    </p>

                </div>

                <div class="conversation-meta">

                    ${
                        conversation.unread
                            ? `
                                <span class="unread-count">
                                    ${Number(
                                        conversation.unread
                                    )}
                                </span>
                            `
                            : ""
                    }

                    <small>
                        ${escapeHtml(
                            conversation.updated_at ||
                            ""
                        )}
                    </small>

                </div>
            `;

            item.addEventListener(
                "click",
                () => {
                    openPersonalChat(
                        conversation.user_id ||
                        conversation.id
                    );
                }
            );

            container.appendChild(item);
        }
    );
}


/* =========================================
   RENDER PERSONAL CHAT
   ========================================= */

function renderPersonalChat() {

    const conversation =
        ChatState.activeConversation;

    const messages =
        ChatState.activeMessages;

    if (conversation) {

        setText(
            $("personalChatName"),
            conversation.name ||
            conversation.username ||
            "Chat"
        );

        setText(
            $("personalChatUsername"),
            conversation.username
                ? `@${conversation.username}`
                : ""
        );

        const avatar =
            conversation.avatar ||
            conversation.profile_photo ||
            "";

        if (
            avatar &&
            $("personalChatAvatar")
        ) {
            $("personalChatAvatar").src =
                avatar;
        }
    }

    const container =
        $("personalMessages");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !messages ||
        messages.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <strong>Start a conversation</strong>
                <p>Message bhej kar conversation shuru karein.</p>
            </div>
        `;

        return;
    }

    messages.forEach(
        message => {

            appendPersonalMessage(
                message,
                container
            );
        }
    );

    scrollChatToBottom(
        container
    );
}


/* =========================================
   APPEND PERSONAL MESSAGE
   ========================================= */

function appendPersonalMessage(
    message,
    container = $("personalMessages")
) {

    if (!container || !message) {
        return;
    }

    const currentUserId =
        AppState.user?.id;

    const isMine =
        String(message.sender_id) ===
        String(currentUserId);

    const wrapper =
        document.createElement("div");

    wrapper.className =
        isMine
            ? "message-row mine"
            : "message-row";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    if (message.text) {

        const text =
            document.createElement("div");

        text.textContent =
            message.text;

        bubble.appendChild(text);
    }

    if (message.image) {

        const image =
            document.createElement("img");

        image.src =
            message.image;

        image.alt =
            "Message image";

        image.loading =
            "lazy";

        bubble.appendChild(image);
    }

    if (message.created_at) {

        const time =
            document.createElement("small");

        time.textContent =
            formatMessageTime(
                message.created_at
            );

        bubble.appendChild(time);
    }

    wrapper.appendChild(
        bubble
    );

    container.appendChild(
        wrapper
    );
}


/* =========================================
   SEND PERSONAL MESSAGE
   ========================================= */

async function sendPersonalMessage() {

    if (!requireAuthentication()) {
        return;
    }

    if (ChatState.sending) {
        return;
    }

    const input =
        $("personalMessageInput");

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    const conversation =
        ChatState.activeConversation;

    const receiverId =
        conversation?.user_id ||
        conversation?.id;

    if (!receiverId) {

        showToast(
            "Receiver missing."
        );

        return;
    }

    ChatState.sending = true;

    try {

        const result =
            await apiRequest(
                "/api/messages",
                {
                    method: "POST",
                    body: JSON.stringify({
                        receiver_id:
                            receiverId,
                        message:
                            text
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Message send failed."
            );
        }

        input.value = "";

        if (result.message) {

            ChatState.activeMessages.push(
                result.message
            );

            renderPersonalChat();
        } else {

            await refreshPersonalChat();
        }

    } catch (error) {

        console.error(
            "Send message:",
            error
        );

        showToast(
            error.message ||
            "Message send nahi hua."
        );

    } finally {

        ChatState.sending = false;
    }
}


/* =========================================
   REFRESH PERSONAL CHAT
   ========================================= */

async function refreshPersonalChat() {

    const conversation =
        ChatState.activeConversation;

    const userId =
        conversation?.user_id ||
        conversation?.id;

    if (!userId) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/chats/${encodeURIComponent(userId)}`,
                {
                    method: "GET"
                }
            );

        if (!result?.success) {
            return;
        }

        ChatState.activeConversation =
            result.conversation ||
            ChatState.activeConversation;

        ChatState.activeMessages =
            Array.isArray(result.messages)
                ? result.messages
                : [];

        renderPersonalChat();

    } catch (error) {

        console.warn(
            "Chat refresh:",
            error.message
        );
    }
}


/* =========================================
   PERSONAL CHAT POLLING
   ========================================= */

function startPersonalChatPolling() {

    stopPersonalChatPolling();

    ChatState.pollingTimer =
        setInterval(
            () => {

                if (
                    AppState.currentScreen ===
                    "personalChatScreen"
                ) {

                    refreshPersonalChat();
                }

            },
            3000
        );
}

function stopPersonalChatPolling() {

    if (
        ChatState.pollingTimer
    ) {

        clearInterval(
            ChatState.pollingTimer
        );

        ChatState.pollingTimer =
            null;
    }
}


/* =========================================
   MESSAGE TIME
   ========================================= */

function formatMessageTime(
    value
) {

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================
   SCROLL CHAT
   ========================================= */

function scrollChatToBottom(
    container
) {

    if (!container) {
        return;
    }

    requestAnimationFrame(
        () => {

            container.scrollTop =
                container.scrollHeight;
        }
    );
}


/* =========================================
   LIVE ROOM CHAT
   ========================================= */

const LiveChatState = {
    messages: [],
    pollingTimer: null,
    sending: false
};


/* =========================================
   LOAD LIVE CHAT
   ========================================= */

async function loadLiveChat(
    roomId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!roomId) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/messages`,
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            Array.isArray(result.messages)
        ) {

            LiveChatState.messages =
                result.messages;

            renderLiveChat();
        }

    } catch (error) {

        console.warn(
            "Live chat:",
            error.message
        );
    }
}


/* =========================================
   RENDER LIVE CHAT
   ========================================= */

function renderLiveChat() {

    const container =
        $("roomChatMessages");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    LiveChatState.messages.forEach(
        message => {

            const item =
                document.createElement("div");

            item.className =
                "room-message";

            const author =
                document.createElement("span");

            author.className =
                "message-author";

            author.textContent =
                message.username ||
                message.name ||
                "User";

            const text =
                document.createElement("span");

            text.textContent =
                message.message ||
                message.text ||
                "";

            item.appendChild(
                author
            );

            item.appendChild(
                text
            );

            container.appendChild(
                item
            );
        }
    );

    scrollChatToBottom(
        container
    );
}


/* =========================================
   SEND LIVE CHAT MESSAGE
   ========================================= */

async function sendLiveChatMessage() {

    if (!requireAuthentication()) {
        return;
    }

    if (LiveChatState.sending) {
        return;
    }

    const room =
        AppState.currentRoom;

    const roomId =
        room?.id;

    const input =
        $("roomChatInput");

    if (!roomId || !input) {
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    LiveChatState.sending = true;

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        message
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Message send failed."
            );
        }

        input.value = "";

        if (result.message) {

            LiveChatState.messages.push(
                result.message
            );

            renderLiveChat();

        } else {

            await loadLiveChat(
                roomId
            );
        }

    } catch (error) {

        console.error(
            "Live message:",
            error
        );

        showToast(
            error.message ||
            "Message send nahi hua."
        );

    } finally {

        LiveChatState.sending = false;
    }
}


/* =========================================
   LIVE CHAT POLLING
   ========================================= */

function startLiveChatPolling() {

    stopLiveChatPolling();

    LiveChatState.pollingTimer =
        setInterval(
            () => {

                const roomId =
                    AppState.currentRoom?.id;

                if (
                    roomId &&
                    AppState.currentScreen ===
                    "liveRoomScreen"
                ) {

                    loadLiveChat(
                        roomId
                    );
                }

            },
            2500
        );
}

function stopLiveChatPolling() {

    if (
        LiveChatState.pollingTimer
    ) {

        clearInterval(
            LiveChatState.pollingTimer
        );

        LiveChatState.pollingTimer =
            null;
    }
}


/* =========================================
   OPEN CHAT LIST
   ========================================= */

async function openMessages() {

    if (!openProtectedScreen(
        "messagesScreen"
    )) {
        return;
    }

    await loadConversations();
}


/* =========================================
   BACK FROM CHAT
   ========================================= */

function closePersonalChat() {

    stopPersonalChatPolling();

    ChatState.activeConversation =
        null;

    ChatState.activeMessages =
        [];

    showScreen(
        "messagesScreen"
    );

    loadConversations();
}


/* =========================================
   CHAT IMAGE PREVIEW
   ========================================= */

function previewChatImage(
    file
) {

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        showToast(
            "Sirf image file select karein."
        );

        return;
    }

    const reader =
        new FileReader();

    reader.onload = () => {

        const preview =
            $("chatImagePreview");

        if (!preview) {
            return;
        }

        preview.src =
            reader.result;

        showElement(
            preview
        );
    };

    reader.readAsDataURL(
        file
    );
}


/* =========================================
   SEND CHAT IMAGE
   ========================================= */

async function sendChatImage(
    file
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!file) {
        return;
    }

    const receiverId =
        ChatState.activeConversation
            ?.user_id ||
        ChatState.activeConversation
            ?.id;

    if (!receiverId) {
        return;
    }

    try {

        const formData =
            new FormData();

        formData.append(
            "receiver_id",
            receiverId
        );

        formData.append(
            "image",
            file
        );

        const headers = {};

        if (AppState.token) {
            headers.Authorization =
                `Bearer ${AppState.token}`;
        }

        const response =
            await fetch(
                `${API_BASE_URL}/api/messages/image`,
                {
                    method: "POST",
                    headers,
                    body: formData
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                "Image send failed."
            );
        }

        if (result.message) {

            ChatState.activeMessages.push(
                result.message
            );

            renderPersonalChat();
        }

    } catch (error) {

        console.error(
            "Chat image:",
            error
        );

        showToast(
            error.message ||
            "Image send nahi hui."
        );
    }
}


/* =========================================
   TYPING STATUS
   ========================================= */

async function sendTypingStatus(
    isTyping
) {

    const receiverId =
        ChatState.activeConversation
            ?.user_id ||
        ChatState.activeConversation
            ?.id;

    if (!receiverId) {
        return;
    }

    try {

        await apiRequest(
            "/api/messages/typing",
            {
                method: "POST",
                body: JSON.stringify({
                    receiver_id:
                        receiverId,
                    typing:
                        Boolean(isTyping)
                })
            }
        );

    } catch {
        /* Typing status failure
           must not break chat. */
    }
}


/* =========================================
   CHAT INPUT EVENTS
   ========================================= */

document.addEventListener(
    "input",
    event => {

        const input =
            event.target.closest(
                "#personalMessageInput"
            );

        if (!input) {
            return;
        }

        sendTypingStatus(true);

        clearTimeout(
            ChatState.typingTimer
        );

        ChatState.typingTimer =
            setTimeout(
                () => {
                    sendTypingStatus(false);
                },
                1200
            );
    }
);


/* =========================================
   CHAT KEYBOARD
   ========================================= */

document.addEventListener(
    "keydown",
    event => {

        const personalInput =
            event.target.closest(
                "#personalMessageInput"
            );

        if (
            personalInput &&
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendPersonalMessage();

            return;
        }

        const liveInput =
            event.target.closest(
                "#roomChatInput"
            );

        if (
            liveInput &&
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendLiveChatMessage();
        }
    }
);


/* =========================================
   CHAT BUTTON EVENTS
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-chat-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.chatAction;

        switch (action) {

            case "messages":
                openMessages();
                break;

            case "send-personal":
                sendPersonalMessage();
                break;

            case "send-live":
                sendLiveChatMessage();
                break;

            case "close-personal":
                closePersonalChat();
                break;

            case "load-live-chat":
                loadLiveChat(
                    AppState.currentRoom?.id
                );
                break;
        }
    }
);


/* =========================================
   LIVE ROOM HOOK
   ========================================= */

const originalJoinLiveRoom =
    window.joinLiveRoom;

window.joinLiveRoom =
    async function(roomId) {

        if (
            typeof originalJoinLiveRoom ===
            "function"
        ) {

            await originalJoinLiveRoom(
                roomId
            );
        }

        if (
            AppState.currentRoom?.id
        ) {

            await loadLiveChat(
                AppState.currentRoom.id
            );

            startLiveChatPolling();
        }
    };


/* =========================================
   SCREEN CHANGE CLEANUP
   ========================================= */

const originalShowScreen =
    window.showScreen;

window.showScreen =
    function(screenId) {

        if (
            AppState.currentScreen ===
            "personalChatScreen" &&
            screenId !==
            "personalChatScreen"
        ) {

            stopPersonalChatPolling();
        }

        if (
            AppState.currentScreen ===
            "liveRoomScreen" &&
            screenId !==
            "liveRoomScreen"
        ) {

            stopLiveChatPolling();
        }

        if (
            typeof originalShowScreen ===
            "function"
        ) {

            originalShowScreen(
                screenId
            );
        }
    };/* =========================================
   RAHUL LIVE — SCRIPT.JS
   PART 4
   LIVE ROOM — SEATS / MIC / VIEWERS /
   REACTIONS / GIFTS / ROOM CONTROLS
   ========================================= */


/* =========================================
   LIVE ROOM STATE
   ========================================= */

const LiveRoomState = {

    room: null,

    seats: [],

    mySeat: null,

    micEnabled: false,

    speakerEnabled: true,

    cameraEnabled: false,

    reactions: [],

    gifts: [],

    viewers: [],

    pollingTimer: null,

    actionBusy: false
};


/* =========================================
   ROOM DATA
   ========================================= */

async function loadLiveRoom(roomId) {

    if (!requireAuthentication()) {
        return;
    }

    if (!roomId) {
        showToast("Room ID missing.");
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}`,
                {
                    method: "GET"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Room load failed."
            );
        }

        LiveRoomState.room =
            result.room || {
                id: roomId
            };

        LiveRoomState.seats =
            Array.isArray(result.seats)
                ? result.seats
                : [];

        LiveRoomState.viewers =
            Array.isArray(result.viewers)
                ? result.viewers
                : [];

        AppState.currentRoom =
            LiveRoomState.room;

        saveStorage(
            STORAGE_KEYS.currentRoom,
            LiveRoomState.room
        );

        renderLiveRoom();

        await loadLiveChat(roomId);

        startLiveRoomPolling();

    } catch (error) {

        console.error(
            "Load live room:",
            error
        );

        showToast(
            error.message ||
            "Live room load nahi hua."
        );
    }
}


/* =========================================
   RENDER LIVE ROOM
   ========================================= */

function renderLiveRoom() {

    const room =
        LiveRoomState.room;

    if (!room) {
        return;
    }

    setText(
        $("liveRoomTitle"),
        room.title ||
        "Live Room"
    );

    setText(
        $("liveRoomHostName"),
        room.host_name ||
        "Host"
    );

    setText(
        $("liveViewerCount"),
        Number(
            room.viewer_count ??
            LiveRoomState.viewers.length ??
            0
        ).toLocaleString()
    );

    const hostAvatar =
        room.host_avatar ||
        room.avatar ||
        "";

    if (
        hostAvatar &&
        $("liveRoomHostAvatar")
    ) {

        $("liveRoomHostAvatar").src =
            hostAvatar;
    }

    renderVoiceSeats(
        LiveRoomState.seats
    );

    renderRoomViewers(
        LiveRoomState.viewers
    );
}


/* =========================================
   FIXED VOICE SEATS
   ========================================= */

function renderVoiceSeats(
    seats
) {

    const container =
        $("voiceSeats");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    /*
       Backend se seats aaye to unko use karo.
       Agar backend ne seats nahi bheje,
       tab UI ko fixed numbered slots
       ke saath render kiya jayega.
    */

    const totalSeats =
        Math.max(
            Number(
                LiveRoomState.room?.seat_count ||
                12
            ),
            1
        );

    const seatMap = {};

    if (Array.isArray(seats)) {

        seats.forEach(seat => {

            seatMap[
                String(
                    seat.seat_number ??
                    seat.position ??
                    seat.number
                )
            ] = seat;

        });
    }

    for (
        let number = 1;
        number <= totalSeats;
        number++
    ) {

        const seat =
            seatMap[String(number)] ||
            {
                seat_number: number,
                occupied: false
            };

        const element =
            createVoiceSeat(
                seat,
                number
            );

        container.appendChild(
            element
        );
    }
}


/* =========================================
   CREATE VOICE SEAT
   ========================================= */

function createVoiceSeat(
    seat,
    number
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "voice-seat";

    button.dataset.seatNumber =
        number;

    const occupied =
        Boolean(
            seat.occupied ||
            seat.user_id
        );

    if (occupied) {

        button.classList.add(
            "occupied"
        );
    } else {

        button.classList.add(
            "empty"
        );
    }

    const avatar =
        seat.avatar ||
        seat.profile_photo ||
        "";

    const username =
        seat.username ||
        seat.name ||
        "";

    button.innerHTML = `

        <div class="voice-seat-number">
            ${number}
        </div>

        <div class="voice-seat-avatar">

            ${
                avatar
                    ? `
                        <img
                            src="${escapeHtml(avatar)}"
                            alt=""
                        >
                    `
                    : `
                        <span>
                            ${
                                occupied
                                    ? "👤"
                                    : "＋"
                            }
                        </span>
                    `
            }

            ${
                seat.mic_enabled
                    ? `
                        <span class="seat-mic">
                            🎙️
                        </span>
                    `
                    : ""
            }

        </div>

        <div class="voice-seat-name">

            ${
                occupied
                    ? escapeHtml(
                        username ||
                        "User"
                    )
                    : "Empty"
            }

        </div>
    `;

    button.addEventListener(
        "click",
        () => {

            if (occupied) {

                openUserProfile(
                    seat.user_id
                );

            } else {

                requestVoiceSeat(
                    number
                );
            }
        }
    );

    return button;
}


/* =========================================
   REQUEST VOICE SEAT
   ========================================= */

async function requestVoiceSeat(
    seatNumber
) {

    if (!requireAuthentication()) {
        return;
    }

    const roomId =
        LiveRoomState.room?.id ||
        AppState.currentRoom?.id;

    if (!roomId) {
        return;
    }

    if (LiveRoomState.actionBusy) {
        return;
    }

    LiveRoomState.actionBusy = true;

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/seats/${encodeURIComponent(seatNumber)}/join`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Seat join failed."
            );
        }

        LiveRoomState.mySeat =
            result.seat ||
            {
                seat_number:
                    seatNumber
            };

        await loadLiveRoom(
            roomId
        );

        showToast(
            "Aap voice seat par aa gaye."
        );

    } catch (error) {

        console.error(
            "Voice seat:",
            error
        );

        showToast(
            error.message ||
            "Seat join nahi hua."
        );

    } finally {

        LiveRoomState.actionBusy =
            false;
    }
}


/* =========================================
   LEAVE VOICE SEAT
   ========================================= */

async function leaveVoiceSeat() {

    if (!requireAuthentication()) {
        return;
    }

    const roomId =
        LiveRoomState.room?.id ||
        AppState.currentRoom?.id;

    const seatNumber =
        LiveRoomState.mySeat?.seat_number;

    if (
        !roomId ||
        !seatNumber
    ) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/seats/${encodeURIComponent(seatNumber)}/leave`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Seat leave failed."
            );
        }

        LiveRoomState.mySeat =
            null;

        LiveRoomState.micEnabled =
            false;

        await loadLiveRoom(
            roomId
        );

        updateMicUI();

    } catch (error) {

        console.error(
            "Leave seat:",
            error
        );

        showToast(
            error.message ||
            "Seat leave nahi hua."
        );
    }
}


/* =========================================
   MICROPHONE
   ========================================= */

async function toggleMicrophone() {

    if (!requireAuthentication()) {
        return;
    }

    if (
        !LiveRoomState.mySeat
    ) {

        showToast(
            "Pehle voice seat join karein."
        );

        return;
    }

    const nextState =
        !LiveRoomState.micEnabled;

    const roomId =
        LiveRoomState.room?.id;

    const seatNumber =
        LiveRoomState.mySeat
            ?.seat_number;

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/seats/${encodeURIComponent(seatNumber)}/mic`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        enabled:
                            nextState
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Microphone update failed."
            );
        }

        LiveRoomState.micEnabled =
            Boolean(
                result.enabled ??
                nextState
            );

        updateMicUI();

        await loadLiveRoom(
            roomId
        );

    } catch (error) {

        console.error(
            "Microphone:",
            error
        );

        showToast(
            error.message ||
            "Microphone update nahi hua."
        );
    }
}


/* =========================================
   MICROPHONE UI
   ========================================= */

function updateMicUI() {

    const button =
        $("roomMicButton");

    if (!button) {
        return;
    }

    button.classList.toggle(
        "active",
        LiveRoomState.micEnabled
    );

    setText(
        button.querySelector(
            "[data-mic-label]"
        ),
        LiveRoomState.micEnabled
            ? "Mute"
            : "Mic"
    );

    const icon =
        button.querySelector(
            "[data-mic-icon]"
        );

    if (icon) {

        icon.textContent =
            LiveRoomState.micEnabled
                ? "🎙️"
                : "🔇";
    }
}


/* =========================================
   SPEAKER
   ========================================= */

async function toggleSpeaker() {

    LiveRoomState.speakerEnabled =
        !LiveRoomState.speakerEnabled;

    const button =
        $("roomSpeakerButton");

    if (button) {

        button.classList.toggle(
            "active",
            LiveRoomState.speakerEnabled
        );
    }

    showToast(
        LiveRoomState.speakerEnabled
            ? "Speaker on"
            : "Speaker off"
    );
}


/* =========================================
   ROOM VIEWERS
   ========================================= */

function renderRoomViewers(
    viewers
) {

    const container =
        $("roomViewers");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(viewers)
    ) {
        return;
    }

    viewers
        .slice(0, 30)
        .forEach(viewer => {

            const item =
                document.createElement("button");

            item.type = "button";

            item.className =
                "room-viewer";

            item.innerHTML = `

                ${
                    viewer.avatar ||
                    viewer.profile_photo
                        ? `
                            <img
                                src="${escapeHtml(
                                    viewer.avatar ||
                                    viewer.profile_photo
                                )}"
                                alt=""
                            >
                        `
                        : `
                            <span>
                                👤
                            </span>
                        `
                }

                <small>
                    ${escapeHtml(
                        viewer.username ||
                        viewer.name ||
                        "User"
                    )}
                </small>
            `;

            item.addEventListener(
                "click",
                () => {

                    if (viewer.id) {

                        openUserProfile(
                            viewer.id
                        );
                    }
                }
            );

            container.appendChild(
                item
            );
        });
}


/* =========================================
   REACTION
   ========================================= */

async function sendReaction(
    reaction
) {

    if (!requireAuthentication()) {
        return;
    }

    const roomId =
        LiveRoomState.room?.id;

    if (!roomId || !reaction) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/reactions`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        reaction
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Reaction failed."
            );
        }

        showFloatingReaction(
            reaction
        );

    } catch (error) {

        console.error(
            "Reaction:",
            error
        );

        showToast(
            error.message ||
            "Reaction nahi bheja gaya."
        );
    }
}


/* =========================================
   FLOATING REACTION
   ========================================= */

function showFloatingReaction(
    reaction
) {

    const container =
        $("liveReactionLayer") ||
        $("liveRoomScreen");

    if (!container) {
        return;
    }

    const element =
        document.createElement("div");

    element.className =
        "floating-reaction";

    element.textContent =
        reaction;

    element.style.left =
        `${20 + Math.random() * 60}%`;

    element.style.bottom =
        "100px";

    container.appendChild(
        element
    );

    setTimeout(
        () => {
            element.remove();
        },
        1800
    );
}


/* =========================================
   GIFT LIST
   ========================================= */

async function loadGifts() {

    if (!requireAuthentication()) {
        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/gifts",
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            Array.isArray(result.gifts)
        ) {

            LiveRoomState.gifts =
                result.gifts;

            renderGiftList(
                result.gifts
            );
        }

    } catch (error) {

        console.warn(
            "Gift list:",
            error.message
        );
    }
}


/* =========================================
   RENDER GIFTS
   ========================================= */

function renderGiftList(
    gifts
) {

    const container =
        $("giftList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    gifts.forEach(
        gift => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "gift-item";

            button.innerHTML = `

                <div class="gift-icon">

                    ${
                        gift.image
                            ? `
                                <img
                                    src="${escapeHtml(
                                        gift.image
                                    )}"
                                    alt=""
                                >
                            `
                            : (
                                gift.emoji ||
                                "🎁"
                            )
                    }

                </div>

                <strong>
                    ${escapeHtml(
                        gift.name ||
                        "Gift"
                    )}
                </strong>

                <small>
                    ${Number(
                        gift.coins || 0
                    ).toLocaleString()}
                    🪙
                </small>
            `;

            button.addEventListener(
                "click",
                () => {

                    sendGift(
                        gift.id
                    );
                }
            );

            container.appendChild(
                button
            );
        }
    );
}


/* =========================================
   SEND GIFT
   ========================================= */

async function sendGift(
    giftId
) {

    if (!requireAuthentication()) {
        return;
    }

    const roomId =
        LiveRoomState.room?.id;

    if (
        !roomId ||
        !giftId
    ) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/gifts`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        gift_id:
                            giftId
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Gift send failed."
            );
        }

        showGiftAnimation(
            result.gift
        );

        if (
            result.balance !==
            undefined
        ) {

            setText(
                $("walletBalance"),
                Number(
                    result.balance
                ).toLocaleString()
            );
        }

    } catch (error) {

        console.error(
            "Gift:",
            error
        );

        showToast(
            error.message ||
            "Gift send nahi hua."
        );
    }
}


/* =========================================
   GIFT ANIMATION
   ========================================= */

function showGiftAnimation(
    gift
) {

    const container =
        $("liveGiftLayer") ||
        $("liveRoomScreen");

    if (!container) {
        return;
    }

    const element =
        document.createElement("div");

    element.className =
        "gift-animation";

    element.innerHTML = `

        <div>
            ${
                gift?.image
                    ? `
                        <img
                            src="${escapeHtml(
                                gift.image
                            )}"
                            alt=""
                        >
                    `
                    : (
                        gift?.emoji ||
                        "🎁"
                    )
            }
        </div>

        <strong>
            ${
                escapeHtml(
                    gift?.name ||
                    "Gift"
                )
            }
        </strong>
    `;

    container.appendChild(
        element
    );

    setTimeout(
        () => {
            element.remove();
        },
        2200
    );
}


/* =========================================
   ROOM REPORT
   ========================================= */

async function reportLiveRoom(
    reason
) {

    if (!requireAuthentication()) {
        return;
    }

    const roomId =
        LiveRoomState.room?.id;

    if (!roomId) {
        return;
    }

    const cleanReason =
        String(
            reason || ""
        ).trim();

    if (!cleanReason) {

        showToast(
            "Report reason select karein."
        );

        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/rooms/${encodeURIComponent(roomId)}/report`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        reason:
                            cleanReason
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Report submit failed."
            );
        }

        showToast(
            "Report submit ho gayi."
        );

        closeRoomReport();

    } catch (error) {

        console.error(
            "Room report:",
            error
        );

        showToast(
            error.message ||
            "Report submit nahi hui."
        );
    }
}


/* =========================================
   REPORT MODAL
   ========================================= */

function openRoomReport() {

    if (!requireAuthentication()) {
        return;
    }

    showElement(
        $("roomReportModal")
    );
}

function closeRoomReport() {

    hideElement(
        $("roomReportModal")
    );
}


/* =========================================
   LEAVE LIVE ROOM
   ========================================= */

async function leaveLiveRoom() {

    if (!requireAuthentication()) {
        return;
    }

    const roomId =
        LiveRoomState.room?.id;

    if (!roomId) {
        return;
    }

    try {

        await apiRequest(
            `/api/rooms/${encodeURIComponent(roomId)}/leave`,
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.warn(
            "Leave room:",
            error.message
        );
    }

    stopLiveRoomPolling();
    stopLiveChatPolling();

    LiveRoomState.room =
        null;

    LiveRoomState.seats =
        [];

    LiveRoomState.mySeat =
        null;

    AppState.currentRoom =
        null;

    removeStorage(
        STORAGE_KEYS.currentRoom
    );

    showScreen(
        "homeScreen"
    );

    loadHomeData();
}


/* =========================================
   ROOM POLLING
   ========================================= */

function startLiveRoomPolling() {

    stopLiveRoomPolling();

    LiveRoomState.pollingTimer =
        setInterval(
            async () => {

                const roomId =
                    LiveRoomState.room?.id;

                if (
                    roomId &&
                    AppState.currentScreen ===
                    "liveRoomScreen"
                ) {

                    try {

                        const result =
                            await apiRequest(
                                `/api/rooms/${encodeURIComponent(roomId)}/state`,
                                {
                                    method: "GET"
                                }
                            );

                        if (
                            result?.success
                        ) {

                            if (
                                Array.isArray(
                                    result.seats
                                )
                            ) {

                                LiveRoomState.seats =
                                    result.seats;
                            }

                            if (
                                Array.isArray(
                                    result.viewers
                                )
                            ) {

                                LiveRoomState.viewers =
                                    result.viewers;
                            }

                            if (
                                result.room
                            ) {

                                LiveRoomState.room =
                                    result.room;
                            }

                            renderLiveRoom();
                        }

                    } catch (error) {

                        console.warn(
                            "Room polling:",
                            error.message
                        );
                    }
                }

            },
            3000
        );
}

function stopLiveRoomPolling() {

    if (
        LiveRoomState.pollingTimer
    ) {

        clearInterval(
            LiveRoomState.pollingTimer
        );

        LiveRoomState.pollingTimer =
            null;
    }
}


/* =========================================
   ROOM ACTION EVENTS
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-room-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.roomAction;

        switch (action) {

            case "mic":
                toggleMicrophone();
                break;

            case "speaker":
                toggleSpeaker();
                break;

            case "leave-seat":
                leaveVoiceSeat();
                break;

            case "leave-room":
                leaveLiveRoom();
                break;

            case "report":
                openRoomReport();
                break;

            case "close-report":
                closeRoomReport();
                break;

            case "load-gifts":
                loadGifts();
                break;

            case "send-reaction":

                sendReaction(
                    target.dataset.reaction ||
                    "❤️"
                );

                break;
        }
    }
);


/* =========================================
   REACTION BUTTONS
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const reactionButton =
            event.target.closest(
                "[data-reaction]"
            );

        if (!reactionButton) {
            return;
        }

        sendReaction(
            reactionButton.dataset.reaction
        );
    }
);


/* =========================================
   REPORT FORM
   ========================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "#roomReportForm"
            );

        if (!form) {
            return;
        }

        event.preventDefault();

        const reason =
            form.querySelector(
                "[name='reason']"
            )?.value;

        reportLiveRoom(
            reason
        );
    }
);


/* =========================================
   ROOM SCREEN OPEN HOOK
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const roomButton =
            event.target.closest(
                "[data-open-room]"
            );

        if (!roomButton) {
            return;
        }

        const roomId =
            roomButton.dataset.openRoom;

        if (!roomId) {
            return;
        }

        loadLiveRoom(
            roomId
        );

        showScreen(
            "liveRoomScreen"
        );
    }
);/* =========================================
   RAHUL LIVE — SCRIPT.JS
   PART 5
   HELPLINE / REPORT / BLOCK / MUTE /
   PERSONAL CHAT ACTIONS / SAFETY
   ========================================= */


/* =========================================
   SUPPORT STATE
   ========================================= */

const SupportState = {
    tickets: [],
    activeTicket: null,
    loading: false
};


/* =========================================
   OPEN HELPLINE
   ========================================= */

async function openHelpline() {

    if (!requireAuthentication()) {
        return;
    }

    showScreen("helplineScreen");

    await loadHelplineInfo();
}


/* =========================================
   LOAD HELPLINE INFO
   ========================================= */

async function loadHelplineInfo() {

    const container =
        $("helplineContent");

    if (!container) {
        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/support",
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            result.support
        ) {

            renderHelplineInfo(
                result.support
            );

        } else {

            renderHelplineInfo({
                title: "Rahul Live Support",
                message:
                    "Support ke liye ticket submit karein."
            });
        }

    } catch (error) {

        console.warn(
            "Helpline:",
            error.message
        );

        renderHelplineInfo({
            title: "Rahul Live Support",
            message:
                "Support temporarily unavailable hai."
        });
    }
}


/* =========================================
   RENDER HELPLINE
   ========================================= */

function renderHelplineInfo(
    support
) {

    const container =
        $("helplineContent");

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="support-card">

            <div class="support-icon">
                🆘
            </div>

            <h3>
                ${escapeHtml(
                    support.title ||
                    "Rahul Live Support"
                )}
            </h3>

            <p>
                ${escapeHtml(
                    support.message ||
                    "Hum aapki madad ke liye available hain."
                )}
            </p>

            ${
                support.email
                    ? `
                        <div class="support-row">
                            <span>Email</span>
                            <strong>
                                ${escapeHtml(
                                    support.email
                                )}
                            </strong>
                        </div>
                    `
                    : ""
            }

            ${
                support.phone
                    ? `
                        <div class="support-row">
                            <span>Helpline</span>
                            <strong>
                                ${escapeHtml(
                                    support.phone
                                )}
                            </strong>
                        </div>
                    `
                    : ""
            }

        </div>

        <button
            type="button"
            class="primary-button"
            data-support-action="new-ticket"
        >
            New Support Ticket
        </button>
    `;
}


/* =========================================
   CREATE SUPPORT TICKET
   ========================================= */

async function createSupportTicket() {

    if (!requireAuthentication()) {
        return;
    }

    const subject =
        $("supportSubject")
            ?.value.trim();

    const message =
        $("supportMessage")
            ?.value.trim();

    if (!subject) {

        showToast(
            "Subject likhna zaroori hai."
        );

        return;
    }

    if (!message) {

        showToast(
            "Message likhna zaroori hai."
        );

        return;
    }

    if (SupportState.loading) {
        return;
    }

    SupportState.loading = true;

    try {

        const result =
            await apiRequest(
                "/api/support/tickets",
                {
                    method: "POST",
                    body: JSON.stringify({
                        subject,
                        message
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Ticket create failed."
            );
        }

        showToast(
            "Support ticket submit ho gaya."
        );

        if ($("supportSubject")) {
            $("supportSubject").value = "";
        }

        if ($("supportMessage")) {
            $("supportMessage").value = "";
        }

        await loadSupportTickets();

    } catch (error) {

        console.error(
            "Support ticket:",
            error
        );

        showToast(
            error.message ||
            "Ticket submit nahi hua."
        );

    } finally {

        SupportState.loading = false;
    }
}


/* =========================================
   LOAD SUPPORT TICKETS
   ========================================= */

async function loadSupportTickets() {

    if (!requireAuthentication()) {
        return;
    }

    try {

        const result =
            await apiRequest(
                "/api/support/tickets",
                {
                    method: "GET"
                }
            );

        if (
            result?.success &&
            Array.isArray(result.tickets)
        ) {

            SupportState.tickets =
                result.tickets;

            renderSupportTickets(
                result.tickets
            );
        }

    } catch (error) {

        console.warn(
            "Support tickets:",
            error.message
        );

        renderSupportTickets([]);
    }
}


/* =========================================
   RENDER SUPPORT TICKETS
   ========================================= */

function renderSupportTickets(
    tickets
) {

    const container =
        $("supportTickets");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !tickets ||
        tickets.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎫</div>
                <strong>No support tickets</strong>
                <p>Abhi koi support ticket nahi hai.</p>
            </div>
        `;

        return;
    }

    tickets.forEach(
        ticket => {

            const item =
                document.createElement("button");

            item.type = "button";
            item.className =
                "support-ticket";

            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHtml(
                            ticket.subject ||
                            "Support Ticket"
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            ticket.message ||
                            ""
                        )}
                    </p>

                </div>

                <span class="ticket-status">
                    ${escapeHtml(
                        ticket.status ||
                        "open"
                    )}
                </span>
            `;

            item.addEventListener(
                "click",
                () => {
                    openSupportTicket(
                        ticket.id
                    );
                }
            );

            container.appendChild(
                item
            );
        }
    );
}


/* =========================================
   OPEN SUPPORT TICKET
   ========================================= */

async function openSupportTicket(
    ticketId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!ticketId) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/support/tickets/${encodeURIComponent(ticketId)}`,
                {
                    method: "GET"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Ticket load failed."
            );
        }

        SupportState.activeTicket =
            result.ticket;

        renderSupportTicket(
            result.ticket
        );

        showScreen(
            "supportTicketScreen"
        );

    } catch (error) {

        console.error(
            "Support ticket:",
            error
        );

        showToast(
            error.message ||
            "Ticket open nahi hua."
        );
    }
}


/* =========================================
   RENDER SUPPORT TICKET
   ========================================= */

function renderSupportTicket(
    ticket
) {

    if (!ticket) {
        return;
    }

    setText(
        $("ticketSubject"),
        ticket.subject ||
        "Support Ticket"
    );

    setText(
        $("ticketStatus"),
        ticket.status ||
        "open"
    );

    setText(
        $("ticketMessage"),
        ticket.message ||
        ""
    );

    setText(
        $("ticketCreatedAt"),
        ticket.created_at ||
        ""
    );
}


/* =========================================
   REPORT USER
   ========================================= */

async function reportUser(
    userId,
    reason
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        showToast("User ID missing.");
        return;
    }

    const cleanReason =
        String(
            reason || ""
        ).trim();

    if (!cleanReason) {

        showToast(
            "Report reason select karein."
        );

        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}/report`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        reason:
                            cleanReason
                    })
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Report submit failed."
            );
        }

        showToast(
            "Report submit ho gayi."
        );

        closeUserReport();

    } catch (error) {

        console.error(
            "User report:",
            error
        );

        showToast(
            error.message ||
            "Report submit nahi hui."
        );
    }
}


/* =========================================
   USER REPORT MODAL
   ========================================= */

function openUserReport(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    const modal =
        $("userReportModal");

    if (!modal) {
        return;
    }

    modal.dataset.userId =
        userId;

    showElement(
        modal
    );
}

function closeUserReport() {

    hideElement(
        $("userReportModal")
    );
}


/* =========================================
   BLOCK USER
   ========================================= */

async function blockUser(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        return;
    }

    const confirmed =
        window.confirm(
            "Kya aap is user ko block karna chahte hain?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}/block`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Block failed."
            );
        }

        showToast(
            "User block ho gaya."
        );

        if (
            AppState.selectedProfile &&
            String(
                AppState.selectedProfile.id
            ) === String(userId)
        ) {

            showScreen(
                "homeScreen"
            );
        }

    } catch (error) {

        console.error(
            "Block user:",
            error
        );

        showToast(
            error.message ||
            "User block nahi hua."
        );
    }
}


/* =========================================
   UNBLOCK USER
   ========================================= */

async function unblockUser(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}/unblock`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Unblock failed."
            );
        }

        showToast(
            "User unblock ho gaya."
        );

    } catch (error) {

        console.error(
            "Unblock user:",
            error
        );

        showToast(
            error.message ||
            "User unblock nahi hua."
        );
    }
}


/* =========================================
   MUTE USER
   ========================================= */

async function muteUser(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}/mute`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Mute failed."
            );
        }

        showToast(
            "User mute ho gaya."
        );

    } catch (error) {

        console.error(
            "Mute user:",
            error
        );

        showToast(
            error.message ||
            "User mute nahi hua."
        );
    }
}


/* =========================================
   UNMUTE USER
   ========================================= */

async function unmuteUser(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/users/${encodeURIComponent(userId)}/unmute`,
                {
                    method: "POST"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Unmute failed."
            );
        }

        showToast(
            "User unmute ho gaya."
        );

    } catch (error) {

        console.error(
            "Unmute user:",
            error
        );

        showToast(
            error.message ||
            "User unmute nahi hua."
        );
    }
}


/* =========================================
   DELETE PERSONAL MESSAGE
   ========================================= */

async function deletePersonalMessage(
    messageId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!messageId) {
        return;
    }

    const confirmed =
        window.confirm(
            "Kya aap is message ko delete karna chahte hain?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/messages/${encodeURIComponent(messageId)}`,
                {
                    method: "DELETE"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Message delete failed."
            );
        }

        ChatState.activeMessages =
            ChatState.activeMessages.filter(
                message =>
                    String(message.id) !==
                    String(messageId)
            );

        renderPersonalChat();

    } catch (error) {

        console.error(
            "Delete message:",
            error
        );

        showToast(
            error.message ||
            "Message delete nahi hua."
        );
    }
}


/* =========================================
   CLEAR CONVERSATION
   ========================================= */

async function clearConversation(
    userId
) {

    if (!requireAuthentication()) {
        return;
    }

    if (!userId) {
        return;
    }

    const confirmed =
        window.confirm(
            "Kya aap poori conversation clear karna chahte hain?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const result =
            await apiRequest(
                `/api/chats/${encodeURIComponent(userId)}`,
                {
                    method: "DELETE"
                }
            );

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Conversation clear failed."
            );
        }

        ChatState.activeMessages =
            [];

        renderPersonalChat();

        showToast(
            "Conversation clear ho gayi."
        );

    } catch (error) {

        console.error(
            "Clear conversation:",
            error
        );

        showToast(
            error.message ||
            "Conversation clear nahi hui."
        );
    }
}


/* =========================================
   REPORT FORM EVENT
   ========================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "#userReportForm"
            );

        if (!form) {
            return;
        }

        event.preventDefault();

        const modal =
            $("userReportModal");

        const userId =
            modal?.dataset.userId;

        const reason =
            form.querySelector(
                "[name='reason']"
            )?.value;

        reportUser(
            userId,
            reason
        );
    }
);


/* =========================================
   SUPPORT / SAFETY EVENTS
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-support-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.supportAction;

        switch (action) {

            case "helpline":
                openHelpline();
                break;

            case "new-ticket":
                showScreen(
                    "newSupportTicketScreen"
                );
                break;

            case "submit-ticket":
                createSupportTicket();
                break;

            case "tickets":
                showScreen(
                    "helplineScreen"
                );
                loadSupportTickets();
                break;

            case "close-ticket":
                showScreen(
                    "helplineScreen"
                );
                break;
        }
    }
);


/* =========================================
   USER SAFETY EVENTS
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-user-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.userAction;

        const userId =
            target.dataset.userId ||
            AppState.selectedProfile?.id;

        switch (action) {

            case "message":
                openPersonalChat(
                    userId
                );
                break;

            case "follow":
                toggleFollowUser(
                    userId
                );
                break;

            case "report":
                openUserReport(
                    userId
                );
                break;

            case "block":
                blockUser(
                    userId
                );
                break;

            case "unblock":
                unblockUser(
                    userId
                );
                break;

            case "mute":
                muteUser(
                    userId
                );
                break;

            case "unmute":
                unmuteUser(
                    userId
                );
                break;
        }
    }
);


/* =========================================
   PERSONAL CHAT MENU
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-personal-chat-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.personalChatAction;

        const userId =
            ChatState.activeConversation
                ?.user_id ||
            ChatState.activeConversation
                ?.id;

        switch (action) {

            case "report":
                openUserReport(
                    userId
                );
                break;

            case "block":
                blockUser(
                    userId
                );
                break;

            case "mute":
                muteUser(
                    userId
                );
                break;

            case "clear":
                clearConversation(
                    userId
                );
                break;

            case "close":
                closePersonalChat();
                break;
        }
    }
);


/* =========================================
   OPEN SAFETY MENU
   ========================================= */

function openSafetyMenu() {

    const menu =
        $("safetyMenu");

    if (!menu) {
        return;
    }

    showElement(menu);
}

function closeSafetyMenu() {

    hideElement(
        $("safetyMenu")
    );
}


/* =========================================
   SAFETY MENU OUTSIDE CLICK
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const menu =
            $("safetyMenu");

        if (!menu) {
            return;
        }

        const button =
            event.target.closest(
                "[data-safety-menu]"
            );

        if (
            !button &&
            !menu.contains(event.target)
        ) {

            closeSafetyMenu();
        }
    }
);


/* =========================================
   HELPLINE ON PAGE LOAD
   ========================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-open-helpline]"
            );

        if (!button) {
            return;
        }

        openHelpline();
    }
);


/* =========================================
   SUPPORT INITIALIZATION
   ========================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopPersonalChatPolling();
        stopLiveChatPolling();
        stopLiveRoomPolling();
    }
);