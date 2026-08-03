const API_BASE = "https://rahulsocialhub-db.09rcrg.workers.dev";

const state = {
  token: localStorage.getItem("rahul_live_token") || "",
  user: null,
  roomId: null,
  seat: null,
  messageTimer: null,
  seatTimer: null
};


/* =====================================================
   API
===================================================== */

async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(
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
    throw new Error("Server ने valid response नहीं दिया।");
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Request failed."
    );
  }

  return data;
}


/* =====================================================
   HELPERS
===================================================== */

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showMessage(message) {

  alert(message);
}


function saveToken(token) {

  state.token = token;

  localStorage.setItem(
    "rahul_live_token",
    token
  );
}


function clearSession() {

  state.token = "";
  state.user = null;

  localStorage.removeItem(
    "rahul_live_token"
  );
}


function authRequired() {

  if (!state.token) {

    showMessage(
      "पहले Login करें।"
    );

    return false;
  }

  return true;
}


/* =====================================================
   REGISTER
===================================================== */

async function registerUser(event) {

  if (event) {
    event.preventDefault();
  }

  const name =
    $("#registerName")?.value.trim() ||
    $("#name")?.value.trim() ||
    "";

  const email =
    $("#registerEmail")?.value.trim() ||
    $("#email")?.value.trim() ||
    "";

  const password =
    $("#registerPassword")?.value ||
    $("#password")?.value ||
    "";


  if (!name || !email || !password) {

    showMessage(
      "Name, email और password भरें।"
    );

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


    showMessage(
      data.message ||
      "Registration successful."
    );


    const emailInput =
      $("#loginEmail");

    if (emailInput) {
      emailInput.value = email;
    }


    const passwordInput =
      $("#loginPassword");

    if (passwordInput) {
      passwordInput.value = password;
    }


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(event) {

  if (event) {
    event.preventDefault();
  }


  const email =
    $("#loginEmail")?.value.trim() ||
    $("#email")?.value.trim() ||
    "";

  const password =
    $("#loginPassword")?.value ||
    $("#password")?.value ||
    "";


  if (!email || !password) {

    showMessage(
      "Email और password भरें।"
    );

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


    saveToken(
      data.token
    );


    state.user =
      data.user;


    showMessage(
      "Login successful."
    );


    await loadCurrentUser();

    await loadRooms();


    if (
      typeof window.showPage ===
      "function"
    ) {
      window.showPage("home");
    }


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   CURRENT USER
===================================================== */

async function loadCurrentUser() {

  if (!state.token) {
    return null;
  }


  try {

    const data =
      await api(
        "/api/me"
      );


    state.user =
      data.user;


    updateUserUI();

    return data.user;


  } catch {

    clearSession();

    return null;
  }
}


function updateUserUI() {

  if (!state.user) {
    return;
  }


  $all(
    "[data-user-name]"
  ).forEach(
    element => {
      element.textContent =
        state.user.name;
    }
  );


  $all(
    "[data-user-username]"
  ).forEach(
    element => {
      element.textContent =
        state.user.username || "";
    }
  );


  $all(
    "[data-user-avatar]"
  ).forEach(
    element => {

      if (
        element.tagName ===
        "IMG"
      ) {

        element.src =
          state.user.avatar_url ||
          "https://placehold.co/100x100";

      } else {

        element.style.backgroundImage =
          `url("${state.user.avatar_url || "https://placehold.co/100x100"}")`;

      }
    }
  );


  $all(
    "[data-user-coins]"
  ).forEach(
    element => {
      element.textContent =
        Number(state.user.coins || 0);
    }
  );
}


/* =====================================================
   LOGOUT
===================================================== */

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
    // Session will still be cleared locally.
  }


  clearSession();


  if (
    typeof window.showPage ===
    "function"
  ) {
    window.showPage("login");
  } else {
    location.reload();
  }
}


/* =====================================================
   ROOMS
===================================================== */

async function loadRooms() {

  if (!authRequired()) {
    return;
  }


  try {

    const data =
      await api(
        "/api/rooms"
      );


    renderRooms(
      data.rooms || []
    );


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


function renderRooms(rooms) {

  const container =
    $("#roomsList") ||
    $("#roomList") ||
    $("[data-rooms]");


  if (!container) {
    return;
  }


  if (!rooms.length) {

    container.innerHTML =
      `<div class="empty-state">
        अभी कोई room नहीं है।
      </div>`;

    return;
  }


  container.innerHTML =
    rooms.map(room => `

      <div class="room-card"
           data-room-id="${room.id}">

        <div class="room-card-title">
          ${escapeHTML(room.name)}
        </div>

        <div class="room-card-owner">
          ${escapeHTML(room.owner_name || "")}
        </div>

        <div class="room-card-viewers">
          👁 ${Number(room.viewer_count || 0)}
        </div>

        <button
          type="button"
          onclick="joinRoom(${room.id})">
          Join Room
        </button>

      </div>

    `).join("");
}


/* =====================================================
   CREATE ROOM
===================================================== */

async function createRoom(event) {

  if (event) {
    event.preventDefault();
  }


  if (!authRequired()) {
    return;
  }


  const name =
    $("#roomName")?.value.trim() ||
    $("#createRoomName")?.value.trim() ||
    "";


  const description =
    $("#roomDescription")?.value.trim() ||
    "";


  const roomType =
    $("#roomType")?.value ||
    "public";


  if (!name) {

    showMessage(
      "Room name डालें।"
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


    state.roomId =
      Number(data.room_id);


    showMessage(
      "Room बन गया।"
    );


    await loadRooms();

    await openRoom(
      state.roomId
    );


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   JOIN ROOM
===================================================== */

async function joinRoom(roomId) {

  if (!authRequired()) {
    return;
  }


  try {

    await api(
      `/api/rooms/${roomId}/join`,
      {
        method: "POST"
      }
    );


    await openRoom(
      roomId
    );


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   OPEN ROOM
===================================================== */

async function openRoom(roomId) {

  if (!authRequired()) {
    return;
  }


  state.roomId =
    Number(roomId);


  try {

    const data =
      await api(
        `/api/rooms/${state.roomId}`
      );


    renderRoom(
      data.room,
      data.seats || []
    );


    await loadRoomMessages();

    await loadRoomSeats();

    startRoomPolling();


    if (
      typeof window.showPage ===
      "function"
    ) {
      window.showPage("room");
    }


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   RENDER ROOM
===================================================== */

function renderRoom(room, seats) {

  $all(
    "[data-room-name]"
  ).forEach(
    element => {
      element.textContent =
        room.name;
    }
  );


  $all(
    "[data-room-description]"
  ).forEach(
    element => {
      element.textContent =
        room.description || "";
    }
  );


  renderSeats(
    seats
  );
}


/* =====================================================
   SEATS
===================================================== */

async function loadRoomSeats() {

  if (!state.roomId) {
    return;
  }


  try {

    const data =
      await api(
        `/api/rooms/${state.roomId}/seats`
      );


    renderSeats(
      data.seats || []
    );


  } catch (error) {

    console.error(
      "Seat loading error:",
      error
    );
  }
}


function renderSeats(seats) {

  const container =
    $("#voiceSeats") ||
    $("#roomSeats") ||
    $("[data-seats]");


  if (!container) {
    return;
  }


  const seatMap =
    new Map();


  seats.forEach(
    seat => {
      seatMap.set(
        Number(seat.seat_number),
        seat
      );
    }
  );


  let html = "";


  for (
    let number = 1;
    number <= 8;
    number++
  ) {

    const seat =
      seatMap.get(number);


    if (seat) {

      const avatar =
        seat.avatar_url ||
        "https://placehold.co/100x100";


      const muted =
        Number(seat.is_muted) === 1;


      html += `

        <div class="voice-seat occupied"
             data-seat="${number}">

          <img
            src="${escapeHTML(avatar)}"
            alt=""
            class="seat-avatar"
          >

          <div class="seat-number">
            Seat ${number}
          </div>

          <div class="seat-name">
            ${escapeHTML(seat.name || "User")}
          </div>

          <div class="seat-mic">
            ${muted ? "🔇" : "🎙️"}
          </div>

        </div>

      `;

    } else {

      html += `

        <button
          type="button"
          class="voice-seat empty"
          data-seat="${number}"
          onclick="joinSeat(${number})">

          <div class="seat-plus">
            +
          </div>

          <div class="seat-number">
            Seat ${number}
          </div>

          <div class="seat-empty">
            Empty
          </div>

        </button>

      `;
    }
  }


  container.innerHTML =
    html;
}


/* =====================================================
   JOIN SEAT
===================================================== */

async function joinSeat(seatNumber) {

  if (!authRequired()) {
    return;
  }


  if (!state.roomId) {
    return;
  }


  try {

    await api(
      `/api/rooms/${state.roomId}/seats/${seatNumber}/join`,
      {
        method: "POST"
      }
    );


    state.seat =
      Number(seatNumber);


    await loadRoomSeats();


    /*
      IMPORTANT:
      Seat join सिर्फ server state है.
      Real browser voice के लिए नीचे WebRTC
      signaling connection भी जरूरी है.
    */

    await startVoiceConnection();


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   LEAVE SEAT
===================================================== */

async function leaveSeat() {

  if (
    !state.roomId ||
    !state.seat
  ) {
    return;
  }


  try {

    await api(
      `/api/rooms/${state.roomId}/seats/${state.seat}/leave`,
      {
        method: "POST"
      }
    );


    await stopVoiceConnection();


    state.seat =
      null;


    await loadRoomSeats();


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   MIC STATE
===================================================== */

async function setMicState(enabled) {

  if (
    !state.roomId ||
    !state.seat
  ) {
    showMessage(
      "पहले voice seat join करें।"
    );

    return;
  }


  try {

    await api(
      `/api/rooms/${state.roomId}/seats/${state.seat}/mic`,
      {
        method: "POST",
        body: JSON.stringify({
          mic_on: Boolean(enabled)
        })
      }
    );


    if (enabled) {
      await enableLocalMicrophone();
    } else {
      disableLocalMicrophone();
    }


    await loadRoomSeats();


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   CHAT
===================================================== */

async function loadRoomMessages() {

  if (!state.roomId) {
    return;
  }


  try {

    const data =
      await api(
        `/api/rooms/${state.roomId}/messages`
      );


    renderMessages(
      data.messages || []
    );


  } catch (error) {

    console.error(
      "Chat error:",
      error
    );
  }
}


function renderMessages(messages) {

  const container =
    $("#roomMessages") ||
    $("#chatMessages") ||
    $("[data-room-messages]");


  if (!container) {
    return;
  }


  container.innerHTML =
    messages.map(message => `

      <div class="chat-message">

        <div class="chat-avatar">

          ${
            message.avatar_url
              ? `<img src="${escapeHTML(message.avatar_url)}" alt="">`
              : "👤"
          }

        </div>

        <div class="chat-content">

          <div class="chat-name">
            ${escapeHTML(message.name || "User")}
          </div>

          <div class="chat-text">
            ${escapeHTML(message.message)}
          </div>

        </div>

      </div>

    `).join("");


  container.scrollTop =
    container.scrollHeight;
}


/* =====================================================
   SEND MESSAGE
===================================================== */

async function sendRoomMessage(event) {

  if (event) {
    event.preventDefault();
  }


  if (!authRequired()) {
    return;
  }


  if (!state.roomId) {
    return;
  }


  const input =
    $("#roomMessage") ||
    $("#messageInput") ||
    $("#chatInput");


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
      `/api/rooms/${state.roomId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          message
        })
      }
    );


    input.value =
      "";


    await loadRoomMessages();


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   REACTIONS
===================================================== */

async function sendReaction(emoji) {

  if (!authRequired()) {
    return;
  }


  if (!state.roomId) {
    return;
  }


  try {

    await api(
      `/api/rooms/${state.roomId}/reactions`,
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

    showMessage(
      error.message
    );
  }
}


function showFloatingReaction(emoji) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "floating-reaction";


  element.textContent =
    emoji;


  document.body.appendChild(
    element
  );


  setTimeout(
    () => element.remove(),
    1800
  );
}


/* =====================================================
   MUSIC
===================================================== */

async function loadMusic() {

  if (!authRequired()) {
    return;
  }


  try {

    const data =
      await api(
        "/api/music"
      );


    renderMusic(
      data.tracks || []
    );


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


function renderMusic(tracks) {

  const container =
    $("#musicList") ||
    $("[data-music-list]");


  if (!container) {
    return;
  }


  if (!tracks.length) {

    container.innerHTML =
      `<div class="empty-state">
        अभी music available नहीं है।
      </div>`;

    return;
  }


  container.innerHTML =
    tracks.map(track => `

      <div class="music-item">

        <div>
          <strong>
            ${escapeHTML(track.title)}
          </strong>

          <small>
            ${escapeHTML(track.artist || "")}
          </small>
        </div>

        <button
          type="button"
          onclick="playRoomMusic(${track.id})">
          ▶
        </button>

      </div>

    `).join("");
}


/* =====================================================
   PLAY ROOM MUSIC
===================================================== */

async function playRoomMusic(trackId) {

  if (!state.roomId) {
    return;
  }


  try {

    const data =
      await api(
        `/api/rooms/${state.roomId}/music`,
        {
          method: "POST",
          body: JSON.stringify({
            track_id: Number(trackId)
          })
        }
      );


    if (data.track) {

      playAudioTrack(
        data.track
      );
    }


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


let roomAudio = null;


function playAudioTrack(track) {

  if (!track.audio_url) {

    showMessage(
      "इस track की audio file उपलब्ध नहीं है।"
    );

    return;
  }


  if (roomAudio) {

    roomAudio.pause();

    roomAudio =
      null;
  }


  roomAudio =
    new Audio(
      track.audio_url
    );


  roomAudio.loop =
    false;


  roomAudio.play()
    .catch(
      () => {
        showMessage(
          "Music चलाने के लिए Play दबाएँ।"
        );
      }
    );
}


/* =====================================================
   GIFTS
===================================================== */

async function loadGifts() {

  if (!authRequired()) {
    return;
  }


  try {

    const data =
      await api(
        "/api/gifts"
      );


    renderGifts(
      data.gifts || []
    );


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


function renderGifts(gifts) {

  const container =
    $("#giftList") ||
    $("[data-gift-list]");


  if (!container) {
    return;
  }


  container.innerHTML =
    gifts.map(gift => `

      <button
        type="button"
        class="gift-item"
        onclick="sendGift(${gift.id})">

        ${
          gift.image_url
            ? `<img src="${escapeHTML(gift.image_url)}" alt="">`
            : "🎁"
        }

        <span>
          ${escapeHTML(gift.name)}
        </span>

        <small>
          ${Number(gift.coin_cost)} coins
        </small>

      </button>

    `).join("");
}


/*
  Gift transaction endpoint अभी Worker में
  payment/coin deduction के साथ अलग से secure
  करना जरूरी है। इसलिए fake success नहीं दिखाएँगे.
*/

async function sendGift() {

  showMessage(
    "Gift transaction API अभी secure coin-deduction endpoint के बिना execute नहीं किया जाएगा।"
  );
}


/* =====================================================
   SUPPORT / PERSONAL HELP
===================================================== */

async function sendSupport(event) {

  if (event) {
    event.preventDefault();
  }


  if (!authRequired()) {
    return;
  }


  const subject =
    $("#supportSubject")?.value.trim() ||
    "";


  const message =
    $("#supportMessage")?.value.trim() ||
    "";


  if (!subject || !message) {

    showMessage(
      "Subject और problem दोनों लिखें।"
    );

    return;
  }


  try {

    const data =
      await api(
        "/api/support",
        {
          method: "POST",
          body: JSON.stringify({
            subject,
            message
          })
        }
      );


    showMessage(
      data.message ||
      "Support request भेज दी गई।"
    );


    const form =
      $("#supportForm");


    if (form) {
      form.reset();
    }


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   INVITE
===================================================== */

async function inviteUser(userId) {

  if (!authRequired()) {
    return;
  }


  if (!state.roomId) {
    return;
  }


  /*
    Invite endpoint के लिए Worker में dedicated
    secure implementation अभी जोड़ना बाकी है।
    Fake invitation नहीं बनाया गया है.
  */

  showMessage(
    "Invite भेजने के लिए friends/invitation API का secure endpoint जोड़ना बाकी है।"
  );
}


/* =====================================================
   LEAVE ROOM
===================================================== */

async function leaveRoom() {

  if (!state.roomId) {
    return;
  }


  try {

    if (state.seat) {

      await leaveSeat();
    }


    await api(
      `/api/rooms/${state.roomId}/leave`,
      {
        method: "POST"
      }
    );


  } catch (error) {

    console.error(
      error
    );
  }


  stopRoomPolling();


  state.roomId =
    null;

  state.seat =
    null;


  if (
    typeof window.showPage ===
    "function"
  ) {
    window.showPage("home");
  }
}


/* =====================================================
   POLLING
===================================================== */

function startRoomPolling() {

  stopRoomPolling();


  state.messageTimer =
    setInterval(
      () => {

        if (state.roomId) {

          loadRoomMessages();
        }

      },
      2000
    );


  state.seatTimer =
    setInterval(
      () => {

        if (state.roomId) {

          loadRoomSeats();
        }

      },
      2000
    );
}


function stopRoomPolling() {

  if (state.messageTimer) {

    clearInterval(
      state.messageTimer
    );

    state.messageTimer =
      null;
  }


  if (state.seatTimer) {

    clearInterval(
      state.seatTimer
    );

    state.seatTimer =
      null;
  }
}


/* =====================================================
   WEBRTC
===================================================== */

let localStream = null;

const peerConnections =
  new Map();


async function startVoiceConnection() {

  if (!state.seat) {
    return;
  }


  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    showMessage(
      "इस browser में microphone access उपलब्ध नहीं है।"
    );

    return;
  }


  try {

    localStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });


    /*
      यहाँ actual WebRTC peer connection बनेगा।

      IMPORTANT:
      केवल D1 API से दो अलग browsers के बीच
      real-time audio stream नहीं भेजा जा सकता।

      Production voice के लिए signaling server/
      WebSocket layer जरूरी है।
    */


    localStream
      .getAudioTracks()
      .forEach(
        track => {
          track.enabled = false;
        }
      );


  } catch (error) {

    console.error(
      "Microphone:",
      error
    );


    showMessage(
      "Microphone permission allow करें।"
    );
  }
}


async function enableLocalMicrophone() {

  if (!localStream) {

    await startVoiceConnection();
  }


  if (!localStream) {
    return;
  }


  localStream
    .getAudioTracks()
    .forEach(
      track => {
        track.enabled = true;
      }
    );
}


function disableLocalMicrophone() {

  if (!localStream) {
    return;
  }


  localStream
    .getAudioTracks()
    .forEach(
      track => {
        track.enabled = false;
      }
    );
}


async function stopVoiceConnection() {

  if (localStream) {

    localStream
      .getTracks()
      .forEach(
        track => track.stop()
      );

    localStream =
      null;
  }


  for (
    const connection
    of peerConnections.values()
  ) {

    try {
      connection.close();
    } catch {}
  }


  peerConnections.clear();
}


/* =====================================================
   BUTTON AUTO-BINDING
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
      Login form
    */

    const loginForm =
      $("#loginForm");


    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        loginUser
      );
    }


    /*
      Register form
    */

    const registerForm =
      $("#registerForm");


    if (registerForm) {

      registerForm.addEventListener(
        "submit",
        registerUser
      );
    }


    /*
      Chat form
    */

    const chatForm =
      $("#roomChatForm");


    if (chatForm) {

      chatForm.addEventListener(
        "submit",
        sendRoomMessage
      );
    }


    /*
      Support form
    */

    const supportForm =
      $("#supportForm");


    if (supportForm) {

      supportForm.addEventListener(
        "submit",
        sendSupport
      );
    }


    /*
      Create room
    */

    const roomForm =
      $("#createRoomForm");


    if (roomForm) {

      roomForm.addEventListener(
        "submit",
        createRoom
      );
    }


    /*
      Existing login session
    */

    if (state.token) {

      const user =
        await loadCurrentUser();


      if (user) {

        await loadRooms();

      }
    }
  }
);


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.registerUser =
  registerUser;

window.loginUser =
  loginUser;

window.logoutUser =
  logoutUser;

window.createRoom =
  createRoom;

window.joinRoom =
  joinRoom;

window.openRoom =
  openRoom;

window.joinSeat =
  joinSeat;

window.leaveSeat =
  leaveSeat;

window.leaveRoom =
  leaveRoom;

window.setMicState =
  setMicState;

window.sendRoomMessage =
  sendRoomMessage;

window.sendReaction =
  sendReaction;

window.loadMusic =
  loadMusic;

window.playRoomMusic =
  playRoomMusic;

window.loadGifts =
  loadGifts;

window.sendGift =
  sendGift;

window.sendSupport =
  sendSupport;

window.inviteUser =
  inviteUser;

window.loadRooms =
  loadRooms;