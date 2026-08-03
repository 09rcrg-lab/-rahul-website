"use strict";

/* =========================================================
   RAHUL LIVE — REAL API CONNECTION
   ========================================================= */

const API_URL =
  "https://rahulsocialhub-db.09rcrg.workers.dev";

const state = {
  currentUser: null,
  token: localStorage.getItem("rahul_live_token") || "",
  currentRoom: null,
  rooms: []
};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function show(element) {
  if (element) element.classList.remove("hidden");
}

function hide(element) {
  if (element) element.classList.add("hidden");
}

function toast(message) {

  const element = $("toast");

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  show(element);

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    hide(element);
  }, 3000);
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization =
      `Bearer ${state.token}`;
  }

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers
      }
    );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Server ने valid response नहीं दिया।"
    );
  }

  if (!response.ok || data.success === false) {

    throw new Error(
      data.message ||
      data.error ||
      "Request failed."
    );
  }

  return data;
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
   REGISTER
   ========================================================= */

async function registerUser() {

  const name =
    $("registerName")?.value.trim();

  const email =
    $("registerEmail")?.value.trim();

  const password =
    $("registerPassword")?.value;

  const confirmPassword =
    $("registerPasswordConfirm")?.value;


  if (!name) {
    toast("अपना नाम लिखें।");
    return;
  }

  if (!email) {
    toast("अपना email लिखें।");
    return;
  }

  if (!password) {
    toast("Password लिखें।");
    return;
  }

  if (password.length < 6) {
    toast(
      "Password कम से कम 6 characters का होना चाहिए।"
    );
    return;
  }

  if (password !== confirmPassword) {
    toast("दोनों passwords समान नहीं हैं।");
    return;
  }


  try {

    const data =
      await api(
        "/api/register",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );


    toast(
      data.message ||
      "Registration successful."
    );


    $("registerName").value = "";
    $("registerEmail").value = "";
    $("registerPassword").value = "";
    $("registerPasswordConfirm").value = "";


    showLoginForm();

    if ($("loginEmail")) {
      $("loginEmail").value = email;
    }


  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {

  const email =
    $("loginEmail")?.value.trim();

  const password =
    $("loginPassword")?.value;


  if (!email) {
    toast("Email लिखें।");
    return;
  }

  if (!password) {
    toast("Password लिखें।");
    return;
  }


  try {

    const data =
      await api(
        "/api/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password
          })
        }
      );


    state.token =
      data.token;

    state.currentUser =
      data.user;


    localStorage.setItem(
      "rahul_live_token",
      state.token
    );


    showMainApp();

    await loadRooms();

    toast(
      data.message ||
      "Login successful."
    );


  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   CHECK EXISTING LOGIN
   ========================================================= */

async function checkLogin() {

  if (!state.token) {
    showAuth();
    return;
  }


  try {

    const data =
      await api("/api/me");


    state.currentUser =
      data.user;


    showMainApp();

    await loadRooms();


  } catch {

    state.token = "";
    state.currentUser = null;

    localStorage.removeItem(
      "rahul_live_token"
    );

    showAuth();

  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    if (state.token) {
      await api(
        "/api/logout",
        {
          method: "POST"
        }
      );
    }

  } catch {
    // Local logout still happens.
  }


  state.token = "";
  state.currentUser = null;
  state.currentRoom = null;

  localStorage.removeItem(
    "rahul_live_token"
  );


  showAuth();

  toast("Logout हो गया।");
}


/* =========================================================
   AUTH / MAIN APP
   ========================================================= */

function showAuth() {

  show($("authScreen"));
  hide($("mainApp"));

  showLoginForm();
}


function showMainApp() {

  hide($("authScreen"));
  show($("mainApp"));
}


/* =========================================================
   ROOMS
   ========================================================= */

async function loadRooms() {

  try {

    const data =
      await api("/api/rooms");


    state.rooms =
      data.rooms || [];


    renderRooms();


  } catch (error) {

    toast(
      "Rooms load नहीं हुए: " +
      error.message
    );

  }
}


function renderRooms() {

  const container =
    $("roomsContainer");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (!state.rooms.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>अभी कोई Live Room नहीं है</h3>
        <p>अपना पहला room बनाइए।</p>
      </div>
    `;

    return;
  }


  state.rooms.forEach((room) => {

    const card =
      document.createElement("div");


    card.className =
      "room-card";


    card.dataset.roomName =
      room.name.toLowerCase();


    card.innerHTML = `
      <div class="room-card-content">

        <h3>
          ${escapeHTML(room.name)}
        </h3>

        <p>
          ${escapeHTML(
            room.description || ""
          )}
        </p>

        <small>
          Host:
          ${escapeHTML(
            room.owner_name || ""
          )}
        </small>

        <button
          type="button"
          class="join-room-btn"
          data-room-id="${room.id}"
        >
          Join Room
        </button>

      </div>
    `;


    container.appendChild(card);

  });


  container
    .querySelectorAll(".join-room-btn")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {
          joinRoom(
            Number(
              button.dataset.roomId
            )
          );
        }
      );

    });
}


/* =========================================================
   CREATE ROOM
   ========================================================= */

async function createRoom() {

  const name =
    $("roomName")?.value.trim();

  const description =
    $("roomDescription")?.value.trim() || "";

  const roomType =
    $("roomType")?.value || "public";


  if (!name) {

    toast(
      "Room का नाम लिखें।"
    );

    return;
  }


  try {

    const data =
      await api(
        "/api/rooms",
        {
          method: "POST",

          body: JSON.stringify({
            name,
            description,
            room_type: roomType
          })
        }
      );


    closeCreateRoomModal();

    if ($("roomName")) {
      $("roomName").value = "";
    }

    if ($("roomDescription")) {
      $("roomDescription").value = "";
    }


    await loadRooms();


    toast(
      data.message ||
      "Room created."
    );


  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   JOIN ROOM
   ========================================================= */

async function joinRoom(roomId) {

  try {

    const data =
      await api(
        `/api/rooms/${roomId}/join`,
        {
          method: "POST"
        }
      );


    state.currentRoom =
      roomId;


    toast(
      data.message ||
      "Room joined."
    );


    await loadRoomMessages(
      roomId
    );


    openPage("roomPage");


  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   LEAVE ROOM
   ========================================================= */

async function leaveRoom() {

  if (!state.currentRoom) {
    return;
  }


  try {

    await api(
      `/api/rooms/${state.currentRoom}/leave`,
      {
        method: "POST"
      }
    );


    state.currentRoom = null;

    openPage("homePage");


  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   ROOM CHAT
   ========================================================= */

async function loadRoomMessages(roomId) {

  try {

    const data =
      await api(
        `/api/rooms/${roomId}/messages`
      );


    renderMessages(
      data.messages || []
    );


  } catch (error) {

    toast(
      "Chat load नहीं हुई: " +
      error.message
    );

  }
}


function renderMessages(messages) {

  const container =
    $("roomMessages");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  messages.forEach((message) => {

    const item =
      document.createElement("div");


    item.className =
      "chat-message";


    item.innerHTML = `
      <strong>
        ${escapeHTML(
          message.name || ""
        )}
      </strong>

      <span>
        ${escapeHTML(
          message.message
        )}
      </span>
    `;


    container.appendChild(item);

  });


  container.scrollTop =
    container.scrollHeight;
}


async function sendRoomMessage() {

  if (!state.currentRoom) {

    toast(
      "पहले room join करें।"
    );

    return;
  }


  const input =
    $("roomMessageInput");


  if (!input) {
    return;
  }


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  try {

    await api(
      `/api/rooms/${state.currentRoom}/messages`,
      {
        method: "POST",

        body: JSON.stringify({
          message
        })
      }
    );


    input.value = "";


    await loadRoomMessages(
      state.currentRoom
    );


  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   SEARCH ROOMS
   ========================================================= */

function searchRooms() {

  const input =
    $("roomSearch");


  if (!input) {
    return;
  }


  const query =
    input.value
      .trim()
      .toLowerCase();


  document
    .querySelectorAll(".room-card")
    .forEach((card) => {

      const name =
        card.dataset.roomName || "";


      card.style.display =
        !query ||
        name.includes(query)
          ? ""
          : "none";

    });
}


/* =========================================================
   MODAL
   ========================================================= */

function openCreateRoomModal() {

  show(
    $("createRoomModal")
  );
}


function closeCreateRoomModal() {

  hide(
    $("createRoomModal")
  );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function openPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach((page) => {
      hide(page);
    });


  const page =
    $(pageId);


  if (!page) {
    return;
  }


  show(page);


  document
    .querySelectorAll(".nav-item")
    .forEach((item) => {
      item.classList.remove(
        "active"
      );
    });


  const active =
    document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );


  if (active) {
    active.classList.add(
      "active"
    );
  }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {

  $("showRegisterBtn")
    ?.addEventListener(
      "click",
      showRegisterForm
    );


  $("showLoginBtn")
    ?.addEventListener(
      "click",
      showLoginForm
    );


  $("registerBtn")
    ?.addEventListener(
      "click",
      registerUser
    );


  $("loginBtn")
    ?.addEventListener(
      "click",
      loginUser
    );


  $("logoutBtn")
    ?.addEventListener(
      "click",
      logoutUser
    );


  $("createRoomBtn")
    ?.addEventListener(
      "click",
      openCreateRoomModal
    );


  $("emptyCreateRoomBtn")
    ?.addEventListener(
      "click",
      openCreateRoomModal
    );


  $("bottomCreateRoomBtn")
    ?.addEventListener(
      "click",
      openCreateRoomModal
    );


  $("closeCreateRoomBtn")
    ?.addEventListener(
      "click",
      closeCreateRoomModal
    );


  $("saveRoomBtn")
    ?.addEventListener(
      "click",
      createRoom
    );


  $("roomSearch")
    ?.addEventListener(
      "input",
      searchRooms
    );


  $("sendRoomMessageBtn")
    ?.addEventListener(
      "click",
      sendRoomMessage
    );


  $("leaveRoomBtn")
    ?.addEventListener(
      "click",
      leaveRoom
    );


  $("roomMessageInput")
    ?.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          sendRoomMessage();

        }

      }
    );


  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          openPage(
            button.dataset.page
          );

        }
      );

    });

}


/* =========================================================
   APP START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupEvents();

    checkLogin();

  }
);