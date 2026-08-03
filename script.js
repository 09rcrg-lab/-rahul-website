"use strict";

// =========================
// Rahul Live
// App Version
// =========================

const APP = {
    name: "Rahul Live",
    version: "1.0.0",
    api: "/api",
    user: null,
    token: null,
    room: null
};

// =========================
// Screens
// =========================

const screens = {
    splash: document.getElementById("splashScreen"),
    login: document.getElementById("loginScreen"),
    register: document.getElementById("registerScreen"),
    home: document.getElementById("homeScreen"),
    live: document.getElementById("liveRoomScreen"),
    chat: document.getElementById("chatScreen"),
    wallet: document.getElementById("walletScreen"),
    profile: document.getElementById("profileScreen"),
    settings: document.getElementById("settingsScreen"),
    admin: document.getElementById("adminScreen")
};

// =========================
// Hide All Screens
// =========================

function hideAllScreens() {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add("hidden");
    });
}

// =========================
// Show Screen
// =========================

function showScreen(name) {
    hideAllScreens();

    if (screens[name]) {
        screens[name].classList.remove("hidden");
    }
}

// =========================
// Start App
// =========================

function startApp() {

    const token = localStorage.getItem("token");

    if (token) {

        APP.token = token;
        showScreen("home");

    } else {

        showScreen("login");

    }

}

// =========================
// Logout
// =========================

function logout() {

    localStorage.removeItem("token");
    APP.token = null;
    APP.user = null;

    showScreen("login");

}

// =========================
// App Start
// =========================

window.addEventListener("load", () => {

    startApp();

});