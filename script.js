/* =========================================================
   RAHUL LIVE — SCRIPT.JS
   ========================================================= */

const API_BASE =
  "https://rahulsocialhub-db.09rcrg.workers.dev";

let authToken =
  localStorage.getItem("rahul_token") || "";

let currentUser =
  JSON.parse(localStorage.getItem("rahul_user") || "null");

let currentRoomId = null;
let currentRoom = null;
let currentSeat = null;
let heartbeatTimer = null;
let roomRefreshTimer = null;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function show(id) {
  const el = $(id);
  if (el) el.classList.remove("hidden");
}

function hide(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

function toast(message) {
  const box = $("toast");

  if (box) {
    box.textContent = message;
    box.classList.remove("hidden");

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {
      box.classList.add("hidden");
    }, 2500);

    return;
  }

  alert(message);
}

function saveAuth(user, token) {
  currentUser = user;
  authToken = token;

  localStorage.setItem(
    "rahul_user",
    JSON.stringify(user)
  );

  localStorage.setItem(
    "rahul_token",
    token
  );
}

function clearAuth() {
  currentUser = null;
  authToken = "";

  localStorage.removeItem("rahul_user");
  localStorage.removeItem("rahul_token");
}

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (authToken) {
    headers.Authorization =
      `Bearer ${authToken}`;
  }

  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers
      }
    );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: "Server ने invalid response दिया।"
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    bindEvents();

    if (currentUser && authToken) {
      openApp();
    } else {
      openAuth();
    }

  }
);


/* =========================================================
   AUTH SCREEN
   ========================================================= */

function openAuth() {

  hide("homeScreen");
  hide("roomScreen");
  hide("appScreen");

  show("authScreen");

  const username =
    $("regUsername");

  if (username) {
    username.focus();
  }
}

function openApp() {

  hide("authScreen");
  hide("roomScreen");

  show("appScreen");

  updateUserUI();

  loadRooms();
}

function updateUserUI() {

  if (!currentUser) return;

  const name =
    currentUser.username || "User";

  const avatar =
    currentUser.avatar || "";

  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(el => {
      el.textContent = name;
    });

  document
    .querySelectorAll(
      "[data-user-avatar]"
    )
    .forEach(el => {

      if (avatar) {
        el.src = avatar;
      }
    });
}


/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser() {

  const username =
    String(
      $("regUsername")?.value || ""
    ).trim();

  const email =
    String(
      $("regEmail")?.value || ""
    ).trim();

  const password =
    String(
      $("regPassword")?.value || ""
    );

  if (!username || !email || !password) {
    toast(
      "Username, email और password भरें।"
    );
    return;
  }

  try {

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

    saveAuth(
      result.user,
      result.token
    );

    toast("Registration successful.");

    openApp();

  } catch (error) {

    toast(
      error.message ||
      "Registration failed."
    );
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {

  const identifier =
    String(
      $("loginIdentifier")?.value || ""
    ).trim();

  const password =
    String(
      $("loginPassword")?.value || ""
    );

  if (!identifier || !password) {
    toast(
      "Username/email और password भरें।"
    );
    return;
  }

  try {

    const result =
      await api(
        "/api/login",
        {
          method: "POST",
          body: JSON.stringify({
            identifier,
            password
          })
        }
      );

    saveAuth(
      result.user,
      result.token
    );

    toast("Login successful.");

    openApp();

  } catch (error) {

    toast(
      error.message ||
      "Login failed."
    );
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

  stopRoomTimers();

  clearAuth();

  currentRoomId = null;
  currentRoom = null;
  currentSeat = null;

  openAuth();
}


/* =========================================================
   ROOMS
   ========================================================= */

async function loadRooms() {

  try {

    const result =
      await api(
        "/api/rooms",
        {
          method: "GET"
        }
      );

    renderRooms(
      result.rooms || []
    );

  } catch (error) {

    toast(
      error.message ||
      "Rooms load नहीं हो पाए।"
    );
  }
}

function renderRooms(rooms) {

  const container =
    $("roomsList") ||
    $("roomList") ||
    document.querySelector(
      ".rooms-list"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!rooms.length) {

    container.innerHTML = `
      <div class="empty-state">
        अभी कोई LIVE room नहीं है।
      </div>
    `;

    return;
  }

  rooms.forEach(room => {

    const card =
      document.createElement("div");

    card.className = "room-card";

    card.innerHTML = `
      <div class="room-card-cover">
        ${
          room.cover
            ? `<img src="${escapeAttribute(room.cover)}" alt="">`
            : `<div class="room-placeholder">LIVE</div>`
        }
      </div>

      <div class="room-card-info">

        <div class="room-card-title">
          ${escapeHTML(room.name)}
        </div>

        <div class="room-card-host">
          ${escapeHTML(room.host_name || "Host")}
        </div>

        <div class="room-card-viewers">
          👁 ${Number(room.viewers || 0)}
        </div>

        <button
          type="button"
          class="join-room-btn"
          data-room-id="${Number(room.id)}"
        >
          JOIN LIVE
        </button>

      </div>
    `;

    const button =
      card.querySelector(
        ".join-room-btn"
      );

    button.addEventListener(
      "click",
      () => {
        joinRoom(
          Number(room.id)
        );
      }
    );

    container.appendChild(card);
  });
}


/* =========================================================
   CREATE ROOM
   ========================================================= */

async function createRoom() {

  const name =
    String(
      $("roomName")?.value || ""
    ).trim();

  const announcement =
    String(
      $("roomAnnouncement")?.value || ""
    ).trim();

  if (!name) {
    toast("Room name भरें।");
    return;
  }

  try {

    const result =
      await api(
        "/api/rooms",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            announcement
          })
        }
      );

    toast("Room बन गया।");

    if ($("roomName")) {
      $("roomName").value = "";
    }

    if ($("roomAnnouncement")) {
      $("roomAnnouncement").value = "";
    }

    await loadRooms();

    if (result.room?.id) {
      joinRoom(
        Number(result.room.id)
      );
    }

  } catch (error) {

    toast(
      error.message ||
      "Room create नहीं हुआ।"
    );
  }
}


/* =========================================================
   JOIN ROOM
   ========================================================= */

async function joinRoom(roomId) {

  if (!authToken) {
    toast("पहले login करें।");
    openAuth();
    return;
  }

  try {

    await api(
      `/api/rooms/${roomId}/join`,
      {
        method: "POST"
      }
    );

    currentRoomId =
      Number(roomId);

    await loadRoom();

    hide("appScreen");
    hide("authScreen");

    show("roomScreen");

    startRoomTimers();

  } catch (error) {

    toast(
      error.message ||
      "Room join नहीं हुआ।"
    );
  }
}


/* =========================================================
   LOAD ROOM
   ========================================================= */

async function loadRoom() {

  if (!currentRoomId) return;

  try {

    const result =
      await api(
        `/api/rooms/${currentRoomId}`,
        {
          method: "GET"
        }
      );

    currentRoom =
      result.room || null;

    renderRoom(
      currentRoom
    );

    await loadMessages();

  } catch (error) {

    toast(
      error.message ||
      "Room load नहीं हुआ।"
    );
  }
}


/* =========================================================
   RENDER ROOM
   ========================================================= */

function renderRoom(room) {

  if (!room) return;

  const title =
    $("roomTitle");

  if (title) {
    title.textContent =
      room.name || "LIVE ROOM";
  }

  const announcement =
    $("roomAnnouncementDisplay");

  if (announcement) {
    announcement.textContent =
      room.announcement || "";
  }

  const viewers =
    $("viewerCount");

  if (viewers) {
    viewers.textContent =
      Number(room.viewers || 0);
  }

  renderSeats(
    room.seats || []
  );
}


/* =========================================================
   RENDER 12 SEATS
   ========================================================= */

function renderSeats(seats) {

  const container =
    $("voiceSeats") ||
    $("seats") ||
    document.querySelector(
      ".voice-seats"
    );

  if (!container) return;

  container.innerHTML = "";

  for (
    let number = 1;
    number <= 12;
    number++
  ) {

    const seat =
      seats.find(
        item =>
          Number(item.seat_number) ===
          number
      );

    const occupied =
      Boolean(
        seat?.user_id
      );

    const div =
      document.createElement("div");

    div.className =
      "voice-seat" +
      (occupied
        ? " occupied"
        : " empty");

    div.dataset.seat =
      String(number);

    if (occupied) {

      div.innerHTML = `
        <div class="seat-avatar">
          ${
            seat.avatar
              ? `<img src="${escapeAttribute(seat.avatar)}" alt="">`
              : `<span>👤</span>`
          }
        </div>

        <div class="seat-name">
          ${escapeHTML(
            seat.username || "User"
          )}
        </div>

        <div class="seat-number">
          ${number}
        </div>

        <div class="seat-mic">
          ${
            Number(seat.mic_on)
              ? "🎙️"
              : "🔇"
          }
        </div>
      `;

    } else {

      div.innerHTML = `
        <div class="seat-avatar empty-avatar">
          +
        </div>

        <div class="seat-name">
          Seat ${number}
        </div>

        <div class="seat-number">
          ${number}
        </div>
      `;
    }

    div.addEventListener(
      "click",
      () => {

        if (occupied) {

          if (
            Number(seat.user_id) ===
            Number(currentUser?.id)
          ) {
            leaveSeat();
          } else {
            toast("यह seat occupied है।");
          }

        } else {

          takeSeat(number);
        }

      }
    );

    container.appendChild(div);
  }

  const mine =
    seats.find(
      seat =>
        Number(seat.user_id) ===
        Number(currentUser?.id)
    );

  currentSeat =
    mine
      ? Number(mine.seat_number)
      : null;
}


/* =========================================================
   TAKE SEAT
   ========================================================= */

async function takeSeat(seatNumber) {

  if (!currentRoomId) return;

  try {

    const result =
      await api(
        `/api/rooms/${currentRoomId}/seat`,
        {
          method: "POST",
          body: JSON.stringify({
            seat_number:
              Number(seatNumber)
          })
        }
      );

    currentSeat =
      Number(seatNumber);

    toast(
      `Seat ${seatNumber} join हो गई।`
    );

    await loadRoom();

  } catch (error) {

    toast(
      error.message ||
      "Seat join नहीं हुई।"
    );
  }
}


/* =========================================================
   LEAVE SEAT
   ========================================================= */

async function leaveSeat() {

  if (!currentRoomId) return;

  try {

    await api(
      `/api/rooms/${currentRoomId}/seat/leave`,
      {
        method: "POST"
      }
    );

    currentSeat = null;

    toast("Seat छोड़ दी गई।");

    await loadRoom();

  } catch (error) {

    toast(
      error.message ||
      "Seat छोड़ने में समस्या हुई।"
    );
  }
}


/* =========================================================
   MIC
   ========================================================= */

async function toggleMic() {

  if (!currentRoomId) return;

  if (!currentSeat) {
    toast(
      "पहले voice seat join करें।"
    );
    return;
  }

  const current =
    getCurrentSeatData();

  const newState =
    !Boolean(
      Number(current?.mic_on || 0)
    );

  try {

    await api(
      `/api/rooms/${currentRoomId}/mic`,
      {
        method: "POST",
        body: JSON.stringify({
          mic_on: newState
        })
      }
    );

    await loadRoom();

  } catch (error) {

    toast(
      error.message ||
      "Mic status update नहीं हुआ।"
    );
  }
}

function getCurrentSeatData() {

  if (!currentRoom?.seats) {
    return null;
  }

  return currentRoom.seats.find(
    seat =>
      Number(seat.user_id) ===
      Number(currentUser?.id)
  ) || null;
}


/* =========================================================
   CHAT LOAD
   ========================================================= */

async function loadMessages() {

  if (!currentRoomId) return;

  try {

    const result =
      await api(
        `/api/rooms/${currentRoomId}/messages`,
        {
          method: "GET"
        }
      );

    renderMessages(
      result.messages || []
    );

  } catch (error) {

    console.error(
      "Messages:",
      error
    );
  }
}

function renderMessages(messages) {

  const container =
    $("chatMessages") ||
    $("messages") ||
    document.querySelector(
      ".chat-messages"
    );

  if (!container) return;

  container.innerHTML = "";

  messages.forEach(message => {

    const item =
      document.createElement("div");

    item.className =
      "chat-message";

    item.innerHTML = `
      <strong>
        ${escapeHTML(
          message.username || "User"
        )}
      </strong>

      <span>
        ${escapeHTML(
          message.message || ""
        )}
      </span>
    `;

    container.appendChild(item);
  });

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   SEND CHAT
   ========================================================= */

async function sendMessage() {

  if (!currentRoomId) return;

  const input =
    $("chatInput") ||
    $("messageInput");

  if (!input) return;

  const message =
    String(input.value || "").trim();

  if (!message) return;

  try {

    await api(
      `/api/rooms/${currentRoomId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          message
        })
      }
    );

    input.value = "";

    await loadMessages();

  } catch (error) {

    toast(
      error.message ||
      "Message send नहीं हुआ।"
    );
  }
}


/* =========================================================
   REACTION
   ========================================================= */

async function sendReaction(emoji) {

  if (!currentRoomId) return;

  try {

    await api(
      `/api/rooms/${currentRoomId}/reaction`,
      {
        method: "POST",
        body: JSON.stringify({
          emoji
        })
      }
    );

    showFloatingReaction(
      emoji
    );

  } catch (error) {

    toast(
      error.message ||
      "Reaction नहीं भेजा गया।"
    );
  }
}

function showFloatingReaction(emoji) {

  const el =
    document.createElement("div");

  el.className =
    "floating-reaction";

  el.textContent =
    emoji;

  document.body.appendChild(el);

  setTimeout(
    () => el.remove(),
    1800
  );
}


/* =========================================================
   GIFT
   ========================================================= */

async function sendGift(gift) {

  if (!currentRoomId) return;

  try {

    await api(
      `/api/rooms/${currentRoomId}/gift`,
      {
        method: "POST",
        body: JSON.stringify({
          gift
        })
      }
    );

    toast(
      `Gift ${gift} भेज दिया गया।`
    );

  } catch (error) {

    toast(
      error.message ||
      "Gift send नहीं हुआ।"
    );
  }
}


/* =========================================================
   AVATAR
   ========================================================= */

async function uploadAvatar(file) {

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("सिर्फ image upload करें।");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toast("Image 2MB से छोटी होनी चाहिए।");
    return;
  }

  try {

    const reader =
      new FileReader();

    reader.onload = async () => {

      try {

        const result =
          await api(
            "/api/rooms/0/avatar",
            {
              method: "POST",
              body: JSON.stringify({
                avatar:
                  reader.result
              })
            }
          );

        currentUser.avatar =
          result.avatar;

        localStorage.setItem(
          "rahul_user",
          JSON.stringify(currentUser)
        );

        updateUserUI();

        if (currentRoomId) {
          await loadRoom();
        }

        toast(
          "Profile photo update हो गई।"
        );

      } catch (error) {

        toast(
          error.message ||
          "Avatar update नहीं हुआ।"
        );
      }
    };

    reader.readAsDataURL(file);

  } catch {

    toast(
      "Image process नहीं हो सकी।"
    );
  }
}


/* =========================================================
   LEAVE ROOM
   ========================================================= */

async function leaveRoom() {

  if (!currentRoomId) return;

  try {

    await api(
      `/api/rooms/${currentRoomId}/leave`,
      {
        method: "POST"
      }
    );

  } catch (error) {

    console.error(
      "Leave room:",
      error
    );

  } finally {

    stopRoomTimers();

    currentRoomId = null;
    currentRoom = null;
    currentSeat = null;

    hide("roomScreen");

    show("appScreen");

    await loadRooms();
  }
}


/* =========================================================
   HEARTBEAT
   ========================================================= */

async function heartbeat() {

  if (!currentRoomId) return;

  try {

    await api(
      `/api/rooms/${currentRoomId}/heartbeat`,
      {
        method: "POST"
      }
    );

  } catch (error) {

    console.error(
      "Heartbeat:",
      error
    );
  }
}


/* =========================================================
   ROOM AUTO REFRESH
   ========================================================= */

function startRoomTimers() {

  stopRoomTimers();

  heartbeatTimer =
    setInterval(
      heartbeat,
      20000
    );

  roomRefreshTimer =
    setInterval(
      async () => {

        if (!currentRoomId) return;

        await loadRoom();

      },
      5000
    );

  heartbeat();
}

function stopRoomTimers() {

  if (heartbeatTimer) {
    clearInterval(
      heartbeatTimer
    );
    heartbeatTimer = null;
  }

  if (roomRefreshTimer) {
    clearInterval(
      roomRefreshTimer
    );
    roomRefreshTimer = null;
  }
}


/* =========================================================
   EVENT BINDINGS
   ========================================================= */

function bindEvents() {

  document.addEventListener(
    "click",
    event => {

      const target =
        event.target.closest(
          "[data-action]"
        );

      if (!target) return;

      const action =
        target.dataset.action;

      if (action === "register") {
        registerUser();
      }

      if (action === "login") {
        loginUser();
      }

      if (action === "logout") {
        logoutUser();
      }

      if (action === "create-room") {
        createRoom();
      }

      if (action === "leave-room") {
        leaveRoom();
      }

      if (action === "toggle-mic") {
        toggleMic();
      }

      if (action === "send-message") {
        sendMessage();
      }

      if (action === "reaction") {
        sendReaction(
          target.dataset.emoji ||
          "❤️"
        );
      }

      if (action === "gift") {
        sendGift(
          target.dataset.gift ||
          "🎁"
        );
      }

      if (action === "show-login") {
        showLoginForm();
      }

      if (action === "show-register") {
        showRegisterForm();
      }

    }
  );

  const chatInput =
    $("chatInput") ||
    $("messageInput");

  if (chatInput) {

    chatInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          sendMessage();
        }

      }
    );
  }

  const avatarInput =
    $("avatarInput") ||
    $("profilePhotoInput");

  if (avatarInput) {

    avatarInput.addEventListener(
      "change",
      event => {

        uploadAvatar(
          event.target.files?.[0]
        );

      }
    );
  }
}


/* =========================================================
   LOGIN / REGISTER FORM SWITCH
   ========================================================= */

function showLoginForm() {

  const login =
    $("loginForm");

  const register =
    $("registerForm");

  if (login) {
    login.classList.remove(
      "hidden"
    );
  }

  if (register) {
    register.classList.add(
      "hidden"
    );
  }
}

function showRegisterForm() {

  const login =
    $("loginForm");

  const register =
    $("registerForm");

  if (login) {
    login.classList.add(
      "hidden"
    );
  }

  if (register) {
    register.classList.remove(
      "hidden"
    );
  }
}


/* =========================================================
   SAFE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    stopRoomTimers();
  }
);