/* =========================================================
   RAHUL LIVE — MAIN JAVASCRIPT
   Login / Register / Home / Live Room / Chat / Seats
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "";

const API = {
  register: `${API_BASE}/api/register`,
  login: `${API_BASE}/api/login`,
  rooms: `${API_BASE}/api/rooms`,
  room: (id) => `${API_BASE}/api/rooms/${encodeURIComponent(id)}`,
  messages: (id) =>
    `${API_BASE}/api/rooms/${encodeURIComponent(id)}/messages`,
  join: (id) =>
    `${API_BASE}/api/rooms/${encodeURIComponent(id)}/join`,
  leave: (id) =>
    `${API_BASE}/api/rooms/${encodeURIComponent(id)}/leave`
};


/* =========================================================
   STATE
========================================================= */

const state = {
  user: null,
  token: localStorage.getItem("rahul_live_token") || "",
  currentRoom: null,
  currentSeat: null,
  micOn: false,
  soundOn: true,
  messageTimer: null,
  roomTimer: null,
  messages: [],
  rooms: [],
  selectedTab: "popular"
};


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function show(id) {
  const el = $(id);
  if (el) el.hidden = false;
}

function hide(id) {
  const el = $(id);
  if (el) el.hidden = true;
}

function text(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showMessage(id, message, type = "normal") {
  const el = $(id);

  if (!el) return;

  el.textContent = message;

  if (type === "error") {
    el.style.color = "#ff647c";
  } else if (type === "success") {
    el.style.color = "#25dfc8";
  } else {
    el.style.color = "#aaa";
  }
}

function toast(message) {
  const old = document.querySelector(".toast");

  if (old) old.remove();

  const el = document.createElement("div");

  el.className = "toast";
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 2500);
}

function loading(showLoading = true) {
  let overlay = document.getElementById("loadingOverlay");

  if (!overlay) {
    overlay = document.createElement("div");

    overlay.id = "loadingOverlay";
    overlay.className = "loading-overlay";

    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    `;

    document.body.appendChild(overlay);
  }

  overlay.hidden = !showLoading;
}

async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function showScreen(screen) {

  [
    "authScreen",
    "homeScreen",
    "liveRoomScreen",
    "profileScreen"
  ].forEach(hide);

  show(screen);
}


/* =========================================================
   AUTH — LOGIN / REGISTER
========================================================= */

function setupAuth() {

  $("showRegister")?.addEventListener("click", () => {

    hide("loginForm");
    show("registerForm");

    showMessage("loginMessage", "");
    showMessage("registerMessage", "");

  });


  $("showLogin")?.addEventListener("click", () => {

    hide("registerForm");
    show("loginForm");

    showMessage("loginMessage", "");
    showMessage("registerMessage", "");

  });


  $("registerForm")?.addEventListener("submit", registerUser);

  $("loginForm")?.addEventListener("submit", loginUser);
}


async function registerUser(event) {

  event.preventDefault();

  const username =
    $("registerUsername").value.trim();

  const email =
    $("registerEmail").value.trim();

  const password =
    $("registerPassword").value;

  if (username.length < 3) {
    showMessage(
      "registerMessage",
      "Username कम से कम 3 characters का होना चाहिए।",
      "error"
    );
    return;
  }

  if (password.length < 6) {
    showMessage(
      "registerMessage",
      "Password कम से कम 6 characters का होना चाहिए।",
      "error"
    );
    return;
  }

  const button = $("registerButton");

  button.disabled = true;
  button.textContent = "Registering...";

  showMessage("registerMessage", "Account बनाया जा रहा है...");

  try {

    const data = await apiRequest(API.register, {
      method: "POST",
      body: JSON.stringify({
        username,
        email,
        password
      })
    });

    if (data.token) {
      state.token = data.token;
      localStorage.setItem(
        "rahul_live_token",
        data.token
      );
    }

    if (data.user) {
      state.user = data.user;
      saveUser();
    }

    showMessage(
      "registerMessage",
      "Account successfully बन गया।",
      "success"
    );

    setTimeout(() => {
      if (state.user) {
        enterApplication();
      } else {
        hide("registerForm");
        show("loginForm");
      }
    }, 500);

  } catch (error) {

    showMessage(
      "registerMessage",
      error.message || "Registration failed.",
      "error"
    );

  } finally {

    button.disabled = false;
    button.textContent = "Register";

  }
}


async function loginUser(event) {

  event.preventDefault();

  const identifier =
    $("loginIdentifier").value.trim();

  const password =
    $("loginPassword").value;

  if (!identifier || !password) {
    showMessage(
      "loginMessage",
      "Username/Email और Password भरें।",
      "error"
    );
    return;
  }

  const button = $("loginButton");

  button.disabled = true;
  button.textContent = "Logging in...";

  showMessage("loginMessage", "Login हो रहा है...");

  try {

    const data = await apiRequest(API.login, {
      method: "POST",
      body: JSON.stringify({
        identifier,
        password
      })
    });

    if (!data.user) {
      throw new Error("Server ने user information नहीं भेजी।");
    }

    state.user = data.user;

    if (data.token) {
      state.token = data.token;

      localStorage.setItem(
        "rahul_live_token",
        data.token
      );
    }

    saveUser();

    showMessage(
      "loginMessage",
      "Login successful.",
      "success"
    );

    setTimeout(() => {
      enterApplication();
    }, 300);

  } catch (error) {

    showMessage(
      "loginMessage",
      error.message || "Login failed.",
      "error"
    );

  } finally {

    button.disabled = false;
    button.textContent = "Login";

  }
}


/* =========================================================
   LOCAL USER CACHE
========================================================= */

function saveUser() {

  if (!state.user) return;

  localStorage.setItem(
    "rahul_live_user",
    JSON.stringify(state.user)
  );
}


function loadUser() {

  try {

    const saved =
      localStorage.getItem("rahul_live_user");

    if (saved) {
      state.user = JSON.parse(saved);
    }

  } catch {

    state.user = null;

  }
}


/* =========================================================
   APPLICATION START
========================================================= */

async function enterApplication() {

  if (!state.user) {
    showScreen("authScreen");
    return;
  }

  updateUserUI();

  showScreen("homeScreen");

  await loadRooms();
}


function updateUserUI() {

  const user = state.user;

  if (!user) return;

  const username =
    user.username ||
    user.name ||
    "Rahul";

  const email =
    user.email ||
    "";

  const userId =
    user.id ||
    user.user_id ||
    generateUserId(username);

  const avatar =
    user.avatar ||
    user.profile_photo ||
    defaultAvatar(username);

  text("homeUsername", username);

  text(
    "homeUserId",
    `ID: ${userId}`
  );

  text(
    "profileName",
    username
  );

  text(
    "profileEmail",
    email
  );

  const homeAvatar =
    $("homeUserAvatar");

  if (homeAvatar) {
    homeAvatar.src = avatar;
  }

  const profileAvatar =
    $("profileAvatar");

  if (profileAvatar) {
    profileAvatar.src = avatar;
  }

  text(
    "hostName",
    username
  );

  const hostAvatar =
    $("hostAvatar");

  if (hostAvatar) {
    hostAvatar.src = avatar;
  }
}


function generateUserId(username) {

  let hash = 0;

  for (let i = 0; i < username.length; i++) {
    hash =
      ((hash << 5) - hash) +
      username.charCodeAt(i);

    hash |= 0;
  }

  return String(
    Math.abs(hash)
  ).slice(0, 6)
    .padStart(6, "0");
}


function defaultAvatar(name) {

  const letter =
    String(name || "R")
      .charAt(0)
      .toUpperCase();

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    letter
  )}&background=7c3cff&color=ffffff&size=256`;
}


/* =========================================================
   HOME
========================================================= */

function setupHome() {

  document.querySelectorAll(".home-tab")
    .forEach(button => {

      button.addEventListener("click", () => {

        document.querySelectorAll(".home-tab")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        state.selectedTab =
          button.dataset.tab || "popular";

        renderRooms();

      });

    });


  $("refreshRoomsButton")
    ?.addEventListener(
      "click",
      loadRooms
    );


  $("homeProfileButton")
    ?.addEventListener(
      "click",
      openProfile
    );


  $("navProfile")
    ?.addEventListener(
      "click",
      openProfile
    );


  $("navHome")
    ?.addEventListener(
      "click",
      () => showScreen("homeScreen")
    );


  $("navDiscover")
    ?.addEventListener(
      "click",
      () => {
        toast("Discover जल्द उपलब्ध होगा।");
      }
    );


  $("navMessages")
    ?.addEventListener(
      "click",
      () => {
        toast("Messages जल्द उपलब्ध होंगे।");
      }
    );


  $("rankingButton")
    ?.addEventListener(
      "click",
      () => toast("Ranking खोल रहा है...")
    );


  $("matchingButton")
    ?.addEventListener(
      "click",
      () => toast("Voice Matching शुरू किया जा सकता है।")
    );


  $("partyButton")
    ?.addEventListener(
      "click",
      () => toast("Party Square जल्द उपलब्ध होगा।")
    );


  $("createRoomButton")
    ?.addEventListener(
      "click",
      createRoom
    );


  $("searchButton")
    ?.addEventListener(
      "click",
      searchRooms
    );
}


/* =========================================================
   LOAD ROOMS
========================================================= */

async function loadRooms() {

  loading(true);

  try {

    const data =
      await apiRequest(API.rooms);

    state.rooms =
      Array.isArray(data.rooms)
        ? data.rooms
        : [];

    renderRooms();

  } catch (error) {

    state.rooms = [];

    renderRooms();

    toast(
      error.message ||
      "Rooms load नहीं हो सके।"
    );

  } finally {

    loading(false);

  }
}


/* =========================================================
   RENDER ROOMS
========================================================= */

function renderRooms() {

  const list =
    $("roomList");

  if (!list) return;

  list.innerHTML = "";

  let rooms =
    [...state.rooms];

  if (state.selectedTab === "following") {
    rooms = rooms.filter(
      room => room.following === true
    );
  }

  if (!rooms.length) {

    show("roomsEmpty");

    return;

  }

  hide("roomsEmpty");

  rooms.forEach(room => {

    const card =
      document.createElement("article");

    card.className = "room-card";

    const cover =
      room.cover ||
      defaultRoomCover();

    const name =
      room.name ||
      "Rahul Live Room";

    const host =
      room.host_name ||
      room.host ||
      "Host";

    const viewers =
      Number(room.viewers || 0);

    card.innerHTML = `

      <div class="room-cover">

        <img
          src="${escapeHTML(cover)}"
          alt="${escapeHTML(name)}"
          loading="lazy"
        >

        <span class="room-live-badge">
          LIVE
        </span>

        <span class="room-viewers-badge">
          👁 ${viewers}
        </span>

      </div>

      <div class="room-card-info">

        <strong>
          ${escapeHTML(name)}
        </strong>

        <small>
          ${escapeHTML(host)}
        </small>

      </div>

    `;

    card.addEventListener(
      "click",
      () => openRoom(room)
    );

    list.appendChild(card);

  });
}


function defaultRoomCover() {

  return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg"
           width="600"
           height="700"
           viewBox="0 0 600 700">

        <defs>
          <linearGradient
            id="g"
            x1="0"
            y1="0"
            x2="1"
            y2="1">

            <stop offset="0"
                  stop-color="#5125b8"/>

            <stop offset="1"
                  stop-color="#ec3e98"/>

          </linearGradient>
        </defs>

        <rect
          width="600"
          height="700"
          fill="url(#g)"
        />

        <text
          x="300"
          y="350"
          fill="white"
          font-size="55"
          text-anchor="middle"
          font-family="Arial">

          RAHUL LIVE

        </text>

      </svg>
    `);
}


/* =========================================================
   CREATE ROOM
========================================================= */

async function createRoom() {

  const roomName =
    prompt("Live Room का नाम लिखें:");

  if (!roomName) return;

  const cleanName =
    roomName.trim();

  if (!cleanName) return;

  loading(true);

  try {

    const data =
      await apiRequest(API.rooms, {
        method: "POST",
        body: JSON.stringify({
          name: cleanName
        })
      });

    toast("Room successfully बनाया गया।");

    if (data.room) {
      await openRoom(data.room);
    } else {
      await loadRooms();
    }

  } catch (error) {

    toast(
      error.message ||
      "Room create नहीं हो सका।"
    );

  } finally {

    loading(false);

  }
}


/* =========================================================
   SEARCH
========================================================= */

function searchRooms() {

  const keyword =
    prompt("Room या Host का नाम लिखें:");

  if (keyword === null) return;

  const search =
    keyword.trim().toLowerCase();

  if (!search) {
    renderRooms();
    return;
  }

  const list =
    $("roomList");

  list.innerHTML = "";

  const matches =
    state.rooms.filter(room => {

      const name =
        String(room.name || "")
          .toLowerCase();

      const host =
        String(room.host_name || room.host || "")
          .toLowerCase();

      return (
        name.includes(search) ||
        host.includes(search)
      );

    });

  if (!matches.length) {
    show("roomsEmpty");
    return;
  }

  hide("roomsEmpty");

  matches.forEach(room => {

    const original =
      state.rooms;

    state.rooms =
      [room];

    renderRooms();

    state.rooms =
      original;

  });
}


/* =========================================================
   OPEN LIVE ROOM
========================================================= */

async function openRoom(room) {

  if (!room || !room.id) {

    toast("Room ID नहीं मिला।");

    return;
  }

  state.currentRoom =
    room;

  state.messages = [];

  updateRoomUI();

  showScreen("liveRoomScreen");

  await joinRoom(room.id);

  await loadRoomMessages(room.id);

  startRoomPolling();
}


/* =========================================================
   ROOM UI
========================================================= */

function updateRoomUI() {

  const room =
    state.currentRoom;

  if (!room) return;

  text(
    "liveRoomName",
    room.name || "Live Room"
  );

  text(
    "liveRoomId",
    `ID: ${room.id}`
  );

  text(
    "viewerCount",
    room.viewers || 0
  );

  text(
    "roomAnnouncement",
    room.announcement ||
    "Welcome to Rahul Live. Please chat in a decent manner."
  );

  const host =
    room.host_name ||
    room.host ||
    state.user?.username ||
    "Host";

  text(
    "hostName",
    host
  );

  const hostAvatar =
    $("hostAvatar");

  if (hostAvatar) {

    hostAvatar.src =
      room.host_avatar ||
      state.user?.avatar ||
      defaultAvatar(host);

  }

  renderSeats(
    room.seats ||
    []
  );
}


/* =========================================================
   12 VOICE SEATS
========================================================= */

function renderSeats(seats) {

  const grid =
    $("voiceSeatGrid");

  if (!grid) return;

  grid.innerHTML = "";

  for (let number = 1; number <= 12; number++) {

    const user =
      seats.find(
        seat =>
          Number(seat.seat_number || seat.number) === number
      );

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "voice-seat";

    const circle =
      document.createElement("div");

    circle.className =
      "seat-circle";

    if (!user) {

      circle.classList.add("empty");

      circle.addEventListener(
        "click",
        () => requestSeat(number)
      );

    } else {

      const avatar =
        document.createElement("img");

      avatar.className =
        "seat-avatar";

      avatar.src =
        user.avatar ||
        defaultAvatar(
          user.username || "U"
        );

      avatar.alt =
        user.username || "User";

      circle.appendChild(avatar);

      if (user.mic_on) {

        const mic =
          document.createElement("span");

        mic.className =
          "seat-mic";

        mic.textContent =
          "🎙️";

        circle.appendChild(mic);

      }

    }

    const seatNumber =
      document.createElement("span");

    seatNumber.className =
      "seat-number";

    seatNumber.textContent =
      number;

    wrapper.appendChild(circle);
    wrapper.appendChild(seatNumber);

    if (user) {

      const name =
        document.createElement("span");

      name.className =
        "seat-name";

      name.textContent =
        user.username || "User";

      wrapper.appendChild(name);

    }

    grid.appendChild(wrapper);

  }
}


/* =========================================================
   REQUEST SEAT
========================================================= */

async function requestSeat(number) {

  if (!state.currentRoom) return;

  if (state.currentSeat) {

    toast(
      `आप पहले से Seat ${state.currentSeat} पर हैं।`
    );

    return;
  }

  loading(true);

  try {

    const data =
      await apiRequest(
        `${API.room(state.currentRoom.id)}/seat`,
        {
          method: "POST",
          body: JSON.stringify({
            seat_number: number
          })
        }
      );

    state.currentSeat =
      number;

    toast(
      `Seat ${number} join हो गई।`
    );

    if (data.room) {

      state.currentRoom =
        data.room;

      updateRoomUI();

    }

  } catch (error) {

    toast(
      error.message ||
      "Seat join नहीं हो सकी।"
    );

  } finally {

    loading(false);

  }
}


/* =========================================================
   JOIN / LEAVE ROOM
========================================================= */

async function joinRoom(roomId) {

  try {

    const data =
      await apiRequest(
        API.join(roomId),
        {
          method: "POST"
        }
      );

    if (data.room) {

      state.currentRoom =
        data.room;

      updateRoomUI();

    }

  } catch (error) {

    toast(
      error.message ||
      "Room join नहीं हो सका।"
    );

  }
}


async function leaveRoom() {

  stopRoomPolling();

  if (state.currentRoom?.id) {

    try {

      await apiRequest(
        API.leave(state.currentRoom.id),
        {
          method: "POST"
        }
      );

    } catch {
      // Room छोड़ने के बाद UI फिर भी बंद करना है।
    }

  }

  state.currentRoom = null;
  state.currentSeat = null;
  state.messages = [];

  showScreen("homeScreen");

  await loadRooms();
}


/* =========================================================
   ROOM POLLING
========================================================= */

function startRoomPolling() {

  stopRoomPolling();

  state.roomTimer =
    setInterval(async () => {

      if (!state.currentRoom) return;

      try {

        const data =
          await apiRequest(
            API.room(
              state.currentRoom.id
            )
          );

        if (data.room) {

          state.currentRoom =
            data.room;

          updateRoomUI();

        }

        await loadRoomMessages(
          state.currentRoom.id,
          true
        );

      } catch {
        // Temporary network error:
        // current UI remains visible.
      }

    }, 2500);
}


function stopRoomPolling() {

  if (state.roomTimer) {

    clearInterval(
      state.roomTimer
    );

    state.roomTimer = null;
  }

  if (state.messageTimer) {

    clearInterval(
      state.messageTimer
    );

    state.messageTimer = null;
  }
}


/* =========================================================
   CHAT
========================================================= */

function setupChat() {

  $("roomMessageForm")
    ?.addEventListener(
      "submit",
      sendMessage
    );


  $("chatOpenButton")
    ?.addEventListener(
      "click",
      () => {
        $("roomMessageInput")?.focus();
      }
    );
}


async function sendMessage(event) {

  event.preventDefault();

  if (!state.currentRoom) return;

  const input =
    $("roomMessageInput");

  const message =
    input.value.trim();

  if (!message) return;

  if (message.length > 300) {

    toast(
      "Message बहुत लंबा है।"
    );

    return;
  }

  input.disabled = true;

  try {

    const data =
      await apiRequest(
        API.messages(
          state.currentRoom.id
        ),
        {
          method: "POST",
          body: JSON.stringify({
            message
          })
        }
      );

    input.value = "";

    if (data.message) {

      state.messages.push(
        data.message
      );

      renderMessages();

    } else {

      await loadRoomMessages(
        state.currentRoom.id
      );

    }

  } catch (error) {

    toast(
      error.message ||
      "Message send नहीं हुआ।"
    );

  } finally {

    input.disabled = false;

    input.focus();

  }
}


async function loadRoomMessages(
  roomId,
  silent = false
) {

  try {

    const data =
      await apiRequest(
        API.messages(roomId)
      );

    if (Array.isArray(data.messages)) {

      state.messages =
        data.messages;

      renderMessages();

    }

  } catch (error) {

    if (!silent) {

      toast(
        error.message ||
        "Chat load नहीं हो सकी।"
      );

    }

  }
}


function renderMessages() {

  const container =
    $("chatMessages");

  if (!container) return;

  container.innerHTML = "";

  state.messages
    .slice(-100)
    .forEach(message => {

      const row =
        document.createElement("div");

      row.className =
        "chat-message";

      if (message.type === "system") {
        row.classList.add("system");
      }

      if (message.type === "gift") {
        row.classList.add("gift");
      }

      const username =
        message.username ||
        message.user_name ||
        "User";

      row.innerHTML = `

        <span class="chat-user">
          ${escapeHTML(username)}
        </span>

        <span>
          ${escapeHTML(message.message)}
        </span>

      `;

      container.appendChild(row);

    });

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   MICROPHONE
========================================================= */

async function toggleMicrophone() {

  if (!state.currentRoom) return;

  if (!state.micOn) {

    try {

      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      state.micOn = true;

      text(
        "micButton",
        "🎙️"
      );

      toast(
        "Microphone ON"
      );

      await updateMicStatus(true);

    } catch {

      toast(
        "Microphone permission नहीं मिली।"
      );

    }

  } else {

    state.micOn = false;

    text(
      "micButton",
      "🔇"
    );

    toast(
      "Microphone OFF"
    );

    await updateMicStatus(false);

  }
}


async function updateMicStatus(on) {

  if (!state.currentRoom) return;

  try {

    await apiRequest(
      `${API.room(state.currentRoom.id)}/mic`,
      {
        method: "POST",
        body: JSON.stringify({
          mic_on: on
        })
      }
    );

  } catch {
    // UI remains responsive.
  }
}


/* =========================================================
   SOUND
========================================================= */

function toggleSound() {

  state.soundOn =
    !state.soundOn;

  text(
    "muteButton",
    state.soundOn
      ? "🔊"
      : "🔇"
  );

  toast(
    state.soundOn
      ? "Sound ON"
      : "Sound OFF"
  );
}


/* =========================================================
   EMOJIS
========================================================= */

function showEmojiPanel() {

  const existing =
    document.querySelector(
      ".emoji-panel"
    );

  if (existing) {

    existing.remove();

    return;
  }

  const panel =
    document.createElement("div");

  panel.className =
    "emoji-panel";

  [
    "❤️",
    "😂",
    "😍",
    "🔥",
    "👏",
    "🎉",
    "😘",
    "🥰",
    "😎",
    "👍",
    "💯",
    "✨"
  ].forEach(emoji => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent =
      emoji;

    button.addEventListener(
      "click",
      () => {

        sendReaction(emoji);

        panel.remove();

      }
    );

    panel.appendChild(button);

  });

  document.body.appendChild(panel);
}


async function sendReaction(emoji) {

  if (!state.currentRoom) return;

  createFloatingReaction(
    emoji
  );

  try {

    await apiRequest(
      `${API.room(state.currentRoom.id)}/reaction`,
      {
        method: "POST",
        body: JSON.stringify({
          emoji
        })
      }
    );

  } catch {
    // Animation still works.
  }
}


function createFloatingReaction(emoji) {

  const layer =
    $("giftAnimationLayer") ||
    $("liveRoomMain");

  const item =
    document.createElement("div");

  item.className =
    "floating-reaction";

  item.textContent =
    emoji;

  item.style.left =
    `${15 + Math.random() * 70}%`;

  layer.appendChild(item);

  setTimeout(
    () => item.remove(),
    1800
  );
}


/* =========================================================
   GIFTS
========================================================= */

function showGiftPanel() {

  const old =
    document.querySelector(
      ".bottom-panel"
    );

  if (old) {

    old.remove();

    return;
  }

  const panel =
    document.createElement("div");

  panel.className =
    "bottom-panel";

  panel.innerHTML = `

    <div class="panel-header">

      <strong>
        🎁 Send Gift
      </strong>

      <button
        type="button"
        id="closeGiftPanel"
      >
        ✕
      </button>

    </div>

    <div class="gift-list">

      <button class="gift-item"
              data-gift="❤️">
        ❤️
        <span>Heart</span>
      </button>

      <button class="gift-item"
              data-gift="🌹">
        🌹
        <span>Rose</span>
      </button>

      <button class="gift-item"
              data-gift="🎉">
        🎉
        <span>Party</span>
      </button>

      <button class="gift-item"
              data-gift="👑">
        👑
        <span>Crown</span>
      </button>

      <button class="gift-item"
              data-gift="💎">
        💎
        <span>Diamond</span>
      </button>

      <button class="gift-item"
              data-gift="🚀">
        🚀
        <span>Rocket</span>
      </button>

      <button class="gift-item"
              data-gift="🔥">
        🔥
        <span>Fire</span>
      </button>

      <button class="gift-item"
              data-gift="🏆">
        🏆
        <span>Trophy</span>
      </button>

    </div>

  `;

  document.body.appendChild(panel);

  $("closeGiftPanel")
    ?.addEventListener(
      "click",
      () => panel.remove()
    );

  panel
    .querySelectorAll("[data-gift]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          sendGift(
            button.dataset.gift
          );

          panel.remove();

        }
      );

    });
}


async function sendGift(gift) {

  if (!state.currentRoom) return;

  createFloatingReaction(
    gift
  );

  try {

    await apiRequest(
      `${API.room(state.currentRoom.id)}/gift`,
      {
        method: "POST",
        body: JSON.stringify({
          gift
        })
      }
    );

    toast(
      `${gift} Gift sent`
    );

  } catch (error) {

    toast(
      error.message ||
      "Gift send नहीं हुआ।"
    );

  }
}


/* =========================================================
   SHARE
========================================================= */

async function shareRoom() {

  if (!state.currentRoom) return;

  const room =
    state.currentRoom;

  const url =
    `${location.origin}${location.pathname}?room=${encodeURIComponent(room.id)}`;

  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title: room.name || "Rahul Live",
        text: "Join my Rahul Live room",
        url
      });

    } catch {
      // User cancelled share.
    }

    return;
  }

  try {

    await navigator.clipboard.writeText(
      url
    );

    toast(
      "Room link copied."
    );

  } catch {

    toast(
      url
    );

  }
}


/* =========================================================
   MUSIC
========================================================= */

function roomMusic() {

  toast(
    "Room music feature तैयार है। Audio source बाद में room owner set करेगा।"
  );
}


/* =========================================================
   PROFILE
========================================================= */

function setupProfile() {

  $("profileBackButton")
    ?.addEventListener(
      "click",
      () => showScreen("homeScreen")
    );


  $("logoutButton")
    ?.addEventListener(
      "click",
      logout
    );


  $("changeAvatarButton")
    ?.addEventListener(
      "click",
      changeAvatar
    );
}


function openProfile() {

  updateUserUI();

  showScreen(
    "profileScreen"
  );
}


function changeAvatar() {

  const url =
    prompt(
      "अपनी profile photo का image URL डालें:"
    );

  if (!url) return;

  const clean =
    url.trim();

  if (!/^https?:\/\//i.test(clean)) {

    toast(
      "सही image URL डालें।"
    );

    return;
  }

  state.user.avatar =
    clean;

  saveUser();

  updateUserUI();

  toast(
    "Profile photo update हो गई।"
  );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  stopRoomPolling();

  state.user = null;
  state.token = "";
  state.currentRoom = null;
  state.currentSeat = null;

  localStorage.removeItem(
    "rahul_live_token"
  );

  localStorage.removeItem(
    "rahul_live_user"
  );

  $("loginForm")?.reset();
  $("registerForm")?.reset();

  showScreen(
    "authScreen"
  );

  hide("registerForm");
  show("loginForm");

  toast(
    "Logout successful."
  );
}


/* =========================================================
   ROOM BUTTONS
========================================================= */

function setupRoomControls() {

  $("leaveRoomButton")
    ?.addEventListener(
      "click",
      leaveRoom
    );


  $("shareRoomButton")
    ?.addEventListener(
      "click",
      shareRoom
    );


  $("roomPowerButton")
    ?.addEventListener(
      "click",
      leaveRoom
    );


  $("muteButton")
    ?.addEventListener(
      "click",
      toggleSound
    );


  $("micButton")
    ?.addEventListener(
      "click",
      toggleMicrophone
    );


  $("emojiButton")
    ?.addEventListener(
      "click",
      showEmojiPanel
    );


  $("giftButton")
    ?.addEventListener(
      "click",
      showGiftPanel
    );


  $("roomMusicButton")
    ?.addEventListener(
      "click",
      roomMusic
    );


  $("seatMenuButton")
    ?.addEventListener(
      "click",
      () => {

        const seat =
          prompt(
            "किस seat पर जाना है? 1 से 12"
          );

        if (seat === null) return;

        const number =
          Number(seat);

        if (
          !Number.isInteger(number) ||
          number < 1 ||
          number > 12
        ) {

          toast(
            "Seat number 1 से 12 के बीच होना चाहिए।"
          );

          return;
        }

        requestSeat(number);

      }
    );


  $("roomMailButton")
    ?.addEventListener(
      "click",
      () => {
        toast(
          "Messages panel जल्द खुलेगा।"
        );
      }
    );
}


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden
    ) {
      return;
    }

    if (
      state.currentRoom
    ) {
      loadRoomMessages(
        state.currentRoom.id,
        true
      );
    }

  }
);


/* =========================================================
   URL ROOM JOIN
========================================================= */

function checkRoomURL() {

  const params =
    new URLSearchParams(
      location.search
    );

  const roomId =
    params.get("room");

  if (!roomId) return;

  const room =
    state.rooms.find(
      item =>
        String(item.id) ===
        String(roomId)
    );

  if (room) {
    openRoom(room);
  }
}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeApp() {

  setupAuth();

  setupHome();

  setupChat();

  setupProfile();

  setupRoomControls();

  loadUser();

  if (state.user) {

    updateUserUI();

    showScreen(
      "homeScreen"
    );

    await loadRooms();

    checkRoomURL();

  } else {

    showScreen(
      "authScreen"
    );

    hide("registerForm");

    show("loginForm");

  }
}


/* =========================================================
   START
========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();

}