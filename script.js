"use strict";

/* =========================================================
   RAHUL LIVE — FRONTEND CORE
   ========================================================= */

const $ = (id) => document.getElementById(id);

const state = {
  currentUser: null,
  currentPage: "homePage",
  rooms: [],
  friends: [],
  coinBalance: 0
};


/* =========================================================
   HELPERS
   ========================================================= */

function show(element) {
  if (element) element.classList.remove("hidden");
}

function hide(element) {
  if (element) element.classList.add("hidden");
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;
  show(toast);

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    hide(toast);
  }, 3000);
}


/* =========================================================
   AUTH SCREEN
   ========================================================= */

function showLoginForm() {
  show($("loginForm"));
  hide($("registerForm"));
}

function showRegisterForm() {
  hide($("loginForm"));
  show($("registerForm"));
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function openPage(pageId) {

  document.querySelectorAll(".page").forEach((page) => {
    hide(page);
  });

  const page = $(pageId);

  if (!page) return;

  show(page);

  state.currentPage = pageId;

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  const activeNav = document.querySelector(
    `.nav-item[data-page="${pageId}"]`
  );

  if (activeNav) {
    activeNav.classList.add("active");
  }
}


/* =========================================================
   LOGIN / REGISTER UI
   ========================================================= */

function validateRegisterForm() {

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  const confirmPassword = $("registerPasswordConfirm").value;

  if (!name) {
    showToast("अपना नाम लिखें।");
    return false;
  }

  if (!email) {
    showToast("अपना email लिखें।");
    return false;
  }

  if (!password) {
    showToast("Password लिखें।");
    return false;
  }

  if (password.length < 6) {
    showToast("Password कम से कम 6 characters का होना चाहिए।");
    return false;
  }

  if (password !== confirmPassword) {
    showToast("दोनों passwords समान नहीं हैं।");
    return false;
  }

  return true;
}

function validateLoginForm() {

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email) {
    showToast("Email लिखें।");
    return false;
  }

  if (!password) {
    showToast("Password लिखें।");
    return false;
  }

  return true;
}


/*
  IMPORTANT:

  Login/Register की वास्तविक request अभी backend/API
  से जोड़ी जाएगी।

  यहाँ कोई fake successful login नहीं बनाया गया है।
*/

async function registerUser() {

  if (!validateRegisterForm()) return;

  showToast(
    "Register API अभी backend से connect होना बाकी है।"
  );
}

async function loginUser() {

  if (!validateLoginForm()) return;

  showToast(
    "Login API अभी backend से connect होना बाकी है।"
  );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

  state.currentUser = null;

  hide($("mainApp"));
  show($("authScreen"));

  showLoginForm();

  showToast("आप logout हो गए हैं।");
}


/* =========================================================
   CREATE ROOM MODAL
   ========================================================= */

function openCreateRoomModal() {

  const modal = $("createRoomModal");

  if (!modal) return;

  show(modal);

  $("roomName").focus();
}

function closeCreateRoomModal() {

  const modal = $("createRoomModal");

  if (!modal) return;

  hide(modal);
}

function validateRoomForm() {

  const roomName = $("roomName").value.trim();

  if (!roomName) {
    showToast("Room का नाम लिखें।");
    return false;
  }

  return true;
}


/*
  Room creation की वास्तविक database/API functionality
  backend आने के बाद जोड़ी जाएगी।

  Fake room यहाँ create नहीं किया गया है।
*/

async function createRoom() {

  if (!validateRoomForm()) return;

  showToast(
    "Room Create API अभी backend से connect होना बाकी है।"
  );
}


/* =========================================================
   ROOM SEARCH
   ========================================================= */

function searchRooms() {

  const search = $("roomSearch");

  if (!search) return;

  const query = search.value.trim().toLowerCase();

  document.querySelectorAll(".room-card").forEach((card) => {

    const text = card.textContent.toLowerCase();

    card.style.display =
      !query || text.includes(query)
        ? ""
        : "none";
  });
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

function setupCategories() {

  document.querySelectorAll(".category").forEach((button) => {

    button.addEventListener("click", () => {

      document.querySelectorAll(".category").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      /*
        Actual category filtering बाद में
        database room type के साथ जोड़ा जाएगा।
      */
    });

  });
}


/* =========================================================
   FRIENDS
   ========================================================= */

function addFriend() {

  showToast(
    "Friend system backend से connect होने के बाद काम करेगा।"
  );
}


/* =========================================================
   WALLET
   ========================================================= */

function addCoins() {

  showToast(
    "Coins purchase system backend/payment integration के बाद काम करेगा।"
  );
}

function giftHistory() {

  showToast(
    "Gift history database से load होगी।"
  );
}

function transactionHistory() {

  showToast(
    "Transactions database से load होंगे।"
  );
}


/* =========================================================
   SUPPORT
   ========================================================= */

function createSupportRequest() {

  showToast(
    "Support system backend से connect होने के बाद ticket बनेगा।"
  );
}


/* =========================================================
   PROFILE
   ========================================================= */

function openProfile() {
  openPage("profilePage");
}

function editProfile() {

  showToast(
    "Profile editing backend/profile storage से connect होगा।"
  );
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function openNotifications() {

  showToast(
    "Notifications system backend से connect होने के बाद दिखेंगी।"
  );
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

  /* Auth */

  $("showRegisterBtn")?.addEventListener(
    "click",
    showRegisterForm
  );

  $("showLoginBtn")?.addEventListener(
    "click",
    showLoginForm
  );

  $("loginBtn")?.addEventListener(
    "click",
    loginUser
  );

  $("registerBtn")?.addEventListener(
    "click",
    registerUser
  );


  /* Profile */

  $("profileBtn")?.addEventListener(
    "click",
    openProfile
  );

  $("editProfileBtn")?.addEventListener(
    "click",
    editProfile
  );

  $("logoutBtn")?.addEventListener(
    "click",
    logoutUser
  );


  /* Notifications */

  $("notificationBtn")?.addEventListener(
    "click",
    openNotifications
  );


  /* Room */

  $("createRoomBtn")?.addEventListener(
    "click",
    openCreateRoomModal
  );

  $("emptyCreateRoomBtn")?.addEventListener(
    "click",
    openCreateRoomModal
  );

  $("bottomCreateRoomBtn")?.addEventListener(
    "click",
    openCreateRoomModal
  );

  $("closeCreateRoomBtn")?.addEventListener(
    "click",
    closeCreateRoomModal
  );

  $("saveRoomBtn")?.addEventListener(
    "click",
    createRoom
  );


  /* Search */

  $("roomSearch")?.addEventListener(
    "input",
    searchRooms
  );


  /* Friends */

  $("addFriendBtn")?.addEventListener(
    "click",
    addFriend
  );


  /* Wallet */

  $("addCoinsBtn")?.addEventListener(
    "click",
    addCoins
  );

  $("giftHistoryBtn")?.addEventListener(
    "click",
    giftHistory
  );

  $("transactionHistoryBtn")?.addEventListener(
    "click",
    transactionHistory
  );


  /* Help */

  $("createSupportBtn")?.addEventListener(
    "click",
    createSupportRequest
  );


  /* Bottom navigation */

  document.querySelectorAll(".nav-item[data-page]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const pageId =
          button.getAttribute("data-page");

        openPage(pageId);
      });

    });


  /* Modal background */

  $("createRoomModal")?.addEventListener(
    "click",
    (event) => {

      if (event.target.id === "createRoomModal") {
        closeCreateRoomModal();
      }

    }
  );

}


/* =========================================================
   APP START
   ========================================================= */

function initApp() {

  show($("authScreen"));
  hide($("mainApp"));

  showLoginForm();

  setupCategories();
  setupEventListeners();

  console.log(
    "Rahul Live frontend loaded successfully."
  );
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initApp
);