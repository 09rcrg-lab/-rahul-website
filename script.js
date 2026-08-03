const API =
  "https://rahulsocialhub-db.09rcrg.workers.dev";

const TOKEN_KEY =
  "rahul_live_token";


const state = {

  user: null,

  roomId: null,

  room: null,

  seat: null,

  micOn: false,

  refreshTimer: null,

  currentPage: "login"

};


/* =====================================================
   BASIC HELPERS
===================================================== */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}


function setToken(token) {

  if (token) {

    localStorage.setItem(
      TOKEN_KEY,
      token
    );

  } else {

    localStorage.removeItem(
      TOKEN_KEY
    );
  }
}


function showLoading(show = true) {

  const overlay =
    $("loadingOverlay");

  if (!overlay) return;

  overlay.classList.toggle(
    "hidden",
    !show
  );
}


function showMessage(message) {

  alert(message);
}


async function api(
  path,
  options = {}
) {

  const headers = {
    "Content-Type":
      "application/json",
    ...(options.headers || {})
  };


  const token =
    getToken();


  if (token) {

    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      API + path,
      {
        ...options,
        headers
      }
    );


  let data;

  try {

    data =
      await response.json();

  } catch {

    data = {
      success: false,
      message:
        "Server ने invalid response दिया।"
    };
  }


  if (!response.ok || data.success === false) {

    throw new Error(
      data.message ||
      `Request failed (${response.status})`
    );
  }


  return data;
}


/* =====================================================
   PAGE CONTROL
===================================================== */

function hideAllPages() {

  document
    .querySelectorAll(".page")
    .forEach(
      page => {
        page.classList.add(
          "hidden"
        );
      }
    );
}


function openPage(id) {

  hideAllPages();

  const page =
    $(id);

  if (page) {

    page.classList.remove(
      "hidden"
    );
  }
}


window.showPage =
  function(page) {

    if (
      page === "login"
    ) {

      openPage(
        "loginPage"
      );

      state.currentPage =
        "login";

      return;
    }


    if (
      page === "register"
    ) {

      openPage(
        "registerPage"
      );

      state.currentPage =
        "register";

      return;
    }


    if (
      page === "home"
    ) {

      openPage(
        "homePage"
      );

      state.currentPage =
        "home";

      loadRooms();

      return;
    }


    if (
      page === "room"
    ) {

      openPage(
        "roomPage"
      );

      state.currentPage =
        "room";

      renderRoom();

      return;
    }


    if (
      page === "support"
    ) {

      openPage(
        "supportPage"
      );

      state.currentPage =
        "support";

      return;
    }
  };


/* =====================================================
   USER UI
===================================================== */

function updateUserUI() {

  const user =
    state.user;


  if (!user) return;


  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(
      element => {

        element.textContent =
          user.name ||
          "User";
      }
    );


  document
    .querySelectorAll(
      "[data-user-username]"
    )
    .forEach(
      element => {

        element.textContent =
          user.username
            ? "@" + user.username
            : "";
      }
    );


  document
    .querySelectorAll(
      "[data-user-coins]"
    )
    .forEach(
      element => {

        element.textContent =
          Number(user.coins || 0)
            .toLocaleString("en-IN");
      }
    );


  document
    .querySelectorAll(
      "[data-user-avatar]"
    )
    .forEach(
      element => {

        if (
          user.avatar_url
        ) {

          element.innerHTML =
            `<img
              src="${escapeHTML(user.avatar_url)}"
              alt=""
            >`;

        } else {

          element.textContent =
            "👤";
        }
      }
    );
}


/* =====================================================
   REGISTER
===================================================== */

async function registerUser(
  event
) {

  if (event) {
    event.preventDefault();
  }


  const name =
    $("registerName")
      ?.value
      .trim();


  const email =
    $("registerEmail")
      ?.value
      .trim();


  const password =
    $("registerPassword")
      ?.value;


  if (
    !name ||
    !email ||
    !password
  ) {

    showMessage(
      "सभी fields भरें।"
    );

    return;
  }


  try {

    showLoading(true);


    const result =
      await api(
        "/api/register",
        {
          method: "POST",

          body:
            JSON.stringify({
              name,
              email,
              password
            })
        }
      );


    showMessage(
      result.message ||
      "Registration successful."
    );


    $("registerForm")
      ?.reset();


    openPage(
      "loginPage"
    );


    state.currentPage =
      "login";


    if ($("loginEmail")) {

      $("loginEmail")
        .value =
        email;
    }


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    showLoading(false);
  }
}


/* =====================================================
   LOGIN
===================================================== */

async function loginUser(
  event
) {

  if (event) {
    event.preventDefault();
  }


  const email =
    $("loginEmail")
      ?.value
      .trim();


  const password =
    $("loginPassword")
      ?.value;


  if (
    !email ||
    !password
  ) {

    showMessage(
      "Email और password भरें।"
    );

    return;
  }


  try {

    showLoading(true);


    const result =
      await api(
        "/api/login",
        {
          method: "POST",

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );


    setToken(
      result.token
    );


    state.user =
      result.user ||
      null;


    updateUserUI();


    openPage(
      "homePage"
    );


    state.currentPage =
      "home";


    await loadRooms();


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    showLoading(false);
  }
}


/* =====================================================
   CHECK LOGIN
===================================================== */

async function checkLogin() {

  const token =
    getToken();


  if (!token) {

    openPage(
      "loginPage"
    );

    state.currentPage =
      "login";

    return false;
  }


  try {

    const result =
      await api(
        "/api/me"
      );


    state.user =
      result.user;


    updateUserUI();


    openPage(
      "homePage"
    );


    state.currentPage =
      "home";


    await loadRooms();


    return true;


  } catch {

    setToken("");


    openPage(
      "loginPage"
    );


    state.currentPage =
      "login";


    return false;
  }
}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

  try {

    if (getToken()) {

      await api(
        "/api/logout",
        {
          method: "POST"
        }
      );
    }

  } catch {
    // Local logout will continue.
  }


  stopRoomRefresh();


  setToken("");


  state.user = null;
  state.roomId = null;
  state.room = null;
  state.seat = null;
  state.micOn = false;


  openPage(
    "loginPage"
  );


  state.currentPage =
    "login";
}


/* =====================================================
   ROOMS
===================================================== */

async function loadRooms() {

  const container =
    $("roomsList");


  if (!container) return;


  if (!getToken()) {

    return;
  }


  try {

    container.innerHTML =
      `<div class="empty-state">
        Rooms loading...
      </div>`;


    const result =
      await api(
        "/api/rooms"
      );


    const rooms =
      result.rooms || [];


    if (!rooms.length) {

      container.innerHTML =
        `<div class="empty-state">
          अभी कोई Live Room नहीं है।
        </div>`;

      return;
    }


    container.innerHTML =
      rooms
        .map(
          room => {

            return `
              <div
                class="room-card"
              >

                <div
                  class="room-card-title"
                >
                  ${escapeHTML(
                    room.name
                  )}
                </div>

                <div
                  class="room-card-description"
                >
                  ${escapeHTML(
                    room.description ||
                    "Live conversation"
                  )}
                </div>

                <div
                  class="room-card-footer"
                >

                  <span>
                    👤
                    ${Number(
                      room.viewer_count || 0
                    )}
                    viewers
                  </span>

                  <button
                    type="button"
                    class="join-room-btn"
                    onclick="joinRoom(${Number(room.id)})"
                  >
                    Join Room
                  </button>

                </div>

              </div>
            `;
          }
        )
        .join("");


  } catch (error) {

    container.innerHTML =
      `<div class="empty-state">
        ${escapeHTML(
          error.message
        )}
      </div>`;
  }
}


/* =====================================================
   CREATE ROOM
===================================================== */

async function createRoom(
  event
) {

  event.preventDefault();


  const name =
    $("roomName")
      ?.value
      .trim();


  const description =
    $("roomDescription")
      ?.value
      .trim();


  const roomType =
    $("roomType")
      ?.value ||
      "public";


  if (!name) {

    showMessage(
      "Room का नाम डालें।"
    );

    return;
  }


  try {

    showLoading(true);


    const result =
      await api(
        "/api/rooms",
        {
          method: "POST",

          body:
            JSON.stringify({
              name,
              description,
              room_type:
                roomType
            })
        }
      );


    $("createRoomForm")
      ?.reset();


    await joinRoom(
      result.room_id
    );


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    showLoading(false);
  }
}


/* =====================================================
   JOIN ROOM
===================================================== */

async function joinRoom(
  roomId
) {

  if (!roomId) return;


  try {

    showLoading(true);


    await api(
      `/api/rooms/${Number(roomId)}/join`,
      {
        method: "POST"
      }
    );


    state.roomId =
      Number(roomId);


    state.seat =
      null;


    state.micOn =
      false;


    await loadRoom();


    openPage(
      "roomPage"
    );


    state.currentPage =
      "room";


    startRoomRefresh();


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    showLoading(false);
  }
}


/* =====================================================
   LOAD ROOM
===================================================== */

async function loadRoom() {

  if (!state.roomId) {
    return;
  }


  const result =
    await api(
      `/api/rooms/${state.roomId}`
    );


  state.room =
    result.room;


  renderRoom(
    result.seats || []
  );


  await loadMessages();


  return result;
}


/* =====================================================
   RENDER ROOM
===================================================== */

function renderRoom(
  seats = []
) {

  const room =
    state.room;


  if (!room) return;


  document
    .querySelectorAll(
      "[data-room-name]"
    )
    .forEach(
      element => {

        element.textContent =
          room.name ||
          "Live Room";
      }
    );


  document
    .querySelectorAll(
      "[data-room-description]"
    )
    .forEach(
      element => {

        element.textContent =
          room.description ||
          "You are included in this room.";
      }
    );


  renderSeats(
    seats
  );
}


/* =====================================================
   RENDER 8 SEATS
===================================================== */

function renderSeats(
  occupiedSeats = []
) {

  const container =
    $("voiceSeats");


  if (!container) return;


  const map =
    new Map();


  occupiedSeats.forEach(
    seat => {

      map.set(
        Number(seat.seat_number),
        seat
      );
    }
  );


  container.innerHTML =
    "";


  for (
    let number = 1;
    number <= 8;
    number++
  ) {

    const seat =
      map.get(number);


    const element =
      document.createElement(
        "div"
      );


    element.className =
      "voice-seat" +
      (
        seat
          ? " occupied"
          : ""
      );


    if (seat) {

      const avatar =
        seat.avatar_url
          ? `
            <img
              src="${escapeHTML(
                seat.avatar_url
              )}"
              alt=""
            >
          `
          : "👤";


      const muted =
        Number(
          seat.is_muted
        ) === 1;


      element.innerHTML = `

        <div
          class="voice-seat-avatar"
        >

          ${avatar}

          <div
            class="seat-mic"
          >
            ${muted ? "🔇" : "🎙️"}
          </div>

        </div>


        <div
          class="voice-seat-name"
        >
          ${escapeHTML(
            seat.name ||
            seat.username ||
            "User"
          )}
        </div>


        <div
          class="voice-seat-number"
        >
          Seat ${number}
        </div>

      `;


      if (
        state.user &&
        Number(seat.user_id) ===
        Number(state.user.id)
      ) {

        state.seat =
          number;

        state.micOn =
          !muted;
      }


    } else {

      element.innerHTML = `

        <button
          type="button"
          class="empty-seat-btn"
          onclick="joinSeat(${number})"
        >
          +
        </button>

        <div
          class="voice-seat-avatar"
        >
          👤
        </div>

        <div
          class="voice-seat-name"
        >
          Empty
        </div>

        <div
          class="voice-seat-number"
        >
          Seat ${number}
        </div>

      `;
    }


    container.appendChild(
      element
    );
  }


  updateMicButton();
}


/* =====================================================
   JOIN SEAT
===================================================== */

async function joinSeat(
  seatNumber
) {

  if (!state.roomId) {
    return;
  }


  try {

    showLoading(true);


    const result =
      await api(
        `/api/rooms/${state.roomId}/seats/${Number(seatNumber)}/join`,
        {
          method: "POST"
        }
      );


    state.seat =
      Number(
        result.seat_number ||
        seatNumber
      );


    state.micOn =
      false;


    await refreshRoom();


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    showLoading(false);
  }
}


/* =====================================================
   LEAVE SEAT
===================================================== */

async function leaveMySeat() {

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


    state.seat =
      null;

    state.micOn =
      false;


    await refreshRoom();


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


/* =====================================================
   MIC STATE
===================================================== */

async function setMicState(
  micOn
) {

  if (
    !state.roomId ||
    !state.seat
  ) {

    showMessage(
      "पहले एक seat join करें।"
    );

    return;
  }


  try {

    await api(
      `/api/rooms/${state.roomId}/seats/${state.seat}/mic`,
      {
        method: "POST",

        body:
          JSON.stringify({
            mic_on:
              Boolean(micOn)
          })
      }
    );


    state.micOn =
      Boolean(micOn);


    updateMicButton();


    await refreshRoom();


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


function updateMicButton() {

  const button =
    $("micButton");


  if (!button) return;


  button.dataset.micOn =
    String(
      state.micOn
    );


  button.innerHTML =
    state.micOn
      ? "🔊<span>Mic ON</span>"
      : "🎙️<span>Mic</span>";
}


window.setMicState =
  setMicState;


/* =====================================================
   TOGGLE MIC
===================================================== */

window.toggleMic =
  async function() {

    if (!state.seat) {

      showMessage(
        "पहले खाली seat पर + दबाकर seat join करें।"
      );

      return;
    }


    await setMicState(
      !state.micOn
    );
  };


/* =====================================================
   LEAVE ROOM
===================================================== */

async function leaveRoom() {

  if (!state.roomId) {

    openPage(
      "homePage"
    );

    return;
  }


  try {

    showLoading(true);


    if (state.seat) {

      try {

        await api(
          `/api/rooms/${state.roomId}/seats/${state.seat}/leave`,
          {
            method: "POST"
          }
        );

      } catch {}
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

  } finally {

    stopRoomRefresh();


    state.roomId =
      null;

    state.room =
      null;

    state.seat =
      null;

    state.micOn =
      false;


    closePanels();


    showLoading(false);


    openPage(
      "homePage"
    );


    state.currentPage =
      "home";


    await loadRooms();
  }
}


window.leaveRoom =
  leaveRoom;


/* =====================================================
   REFRESH ROOM
===================================================== */

async function refreshRoom() {

  if (!state.roomId) {
    return;
  }


  try {

    const result =
      await api(
        `/api/rooms/${state.roomId}`
      );


    state.room =
      result.room;


    renderRoom(
      result.seats || []
    );


  } catch (error) {

    console.error(
      "Room refresh:",
      error
    );
  }
}


/* =====================================================
   ROOM AUTO REFRESH
===================================================== */

function startRoomRefresh() {

  stopRoomRefresh();


  state.refreshTimer =
    setInterval(
      async () => {

        if (
          state.currentPage ===
          "room" &&
          state.roomId
        ) {

          await refreshRoom();

          await loadMessages();
        }

      },
      3000
    );
}


function stopRoomRefresh() {

  if (
    state.refreshTimer
  ) {

    clearInterval(
      state.refreshTimer
    );

    state.refreshTimer =
      null;
  }
}


/* =====================================================
   CHAT LOAD
===================================================== */

async function loadMessages() {

  if (!state.roomId) {
    return;
  }


  const container =
    $("roomMessages");


  if (!container) {
    return;
  }


  try {

    const result =
      await api(
        `/api/rooms/${state.roomId}/messages`
      );


    const messages =
      result.messages || [];


    if (!messages.length) {

      container.innerHTML =
        `<div class="empty-chat">
          Chat शुरू करें...
        </div>`;

      return;
    }


    container.innerHTML =
      messages
        .map(
          message => {

            const avatar =
              message.avatar_url
                ? `
                  <img
                    src="${escapeHTML(
                      message.avatar_url
                    )}"
                    alt=""
                  >
                `
                : "👤";


            return `

              <div
                class="chat-message"
              >

                <div
                  class="chat-avatar"
                >
                  ${avatar}
                </div>

                <div
                  class="chat-content"
                >

                  <div
                    class="chat-name"
                  >
                    ${escapeHTML(
                      message.name ||
                      message.username ||
                      "User"
                    )}
                  </div>

                  <div
                    class="chat-text"
                  >
                    ${escapeHTML(
                      message.message
                    )}
                  </div>

                </div>

              </div>

            `;
          }
        )
        .join("");


    container.scrollTop =
      container.scrollHeight;


  } catch (error) {

    console.error(
      "Messages:",
      error
    );
  }
}


/* =====================================================
   SEND CHAT MESSAGE
===================================================== */

async function sendChatMessage(
  event
) {

  event.preventDefault();


  if (!state.roomId) {
    return;
  }


  const input =
    $("roomMessage");


  const message =
    input
      ?.value
      .trim();


  if (!message) {
    return;
  }


  try {

    input.disabled =
      true;


    await api(
      `/api/rooms/${state.roomId}/messages`,
      {
        method: "POST",

        body:
          JSON.stringify({
            message
          })
      }
    );


    input.value =
      "";


    await loadMessages();


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    input.disabled =
      false;

    input.focus();
  }
}


/* =====================================================
   REACTIONS
===================================================== */

async function sendReaction(
  emoji
) {

  if (!state.roomId) {
    return;
  }


  try {

    await api(
      `/api/rooms/${state.roomId}/reactions`,
      {
        method: "POST",

        body:
          JSON.stringify({
            emoji
          })
      }
    );


  } catch (error) {

    console.error(
      "Reaction:",
      error
    );
  }
}


window.sendReaction =
  sendReaction;


/* =====================================================
   MUSIC
===================================================== */

async function loadMusic() {

  const container =
    $("musicList");


  if (!container) {
    return;
  }


  try {

    const result =
      await api(
        "/api/music"
      );


    const tracks =
      result.tracks || [];


    if (!tracks.length) {

      container.innerHTML =
        `<div class="empty-state">
          अभी Music उपलब्ध नहीं है।
        </div>`;

      return;
    }


    container.innerHTML =
      tracks
        .map(
          track => {

            return `

              <div
                class="music-item"
              >

                <div
                  class="music-item-info"
                >

                  <div
                    class="music-item-title"
                  >
                    ${escapeHTML(
                      track.title
                    )}
                  </div>

                  <div
                    class="music-item-artist"
                  >
                    ${escapeHTML(
                      track.artist ||
                      "Unknown Artist"
                    )}
                  </div>

                </div>

                <button
                  type="button"
                  class="music-play-btn"
                  onclick="playRoomMusic(${Number(track.id)})"
                >
                  ▶
                </button>

              </div>

            `;
          }
        )
        .join("");


  } catch (error) {

    container.innerHTML =
      `<div class="empty-state">
        ${escapeHTML(
          error.message
        )}
      </div>`;
  }
}


async function playRoomMusic(
  trackId
) {

  if (!state.roomId) {
    return;
  }


  try {

    const result =
      await api(
        `/api/rooms/${state.roomId}/music`,
        {
          method: "POST",

          body:
            JSON.stringify({
              track_id:
                Number(trackId)
            })
        }
      );


    const track =
      result.track;


    /*
      अगर audio_url उपलब्ध है,
      तो browser में music चलाने की कोशिश।
    */

    if (
      track &&
      track.audio_url
    ) {

      const audio =
        new Audio(
          track.audio_url
        );

      audio.play()
        .catch(
          () => {}
        );
    }


    showMessage(
      `Music selected: ${track.title}`
    );


  } catch (error) {

    showMessage(
      error.message
    );
  }
}


window.loadMusic =
  loadMusic;

window.playRoomMusic =
  playRoomMusic;


/* =====================================================
   GIFTS
===================================================== */

async function loadGifts() {

  const container =
    $("giftList");


  if (!container) {
    return;
  }


  try {

    const result =
      await api(
        "/api/gifts"
      );


    const gifts =
      result.gifts || [];


    if (!gifts.length) {

      container.innerHTML =
        `<div class="empty-state">
          अभी Gifts उपलब्ध नहीं हैं।
        </div>`;

      return;
    }


    container.innerHTML =
      gifts
        .map(
          gift => {

            const image =
              gift.image_url
                ? `
                  <img
                    src="${escapeHTML(
                      gift.image_url
                    )}"
                    alt=""
                    style="
                      width:42px;
                      height:42px;
                      object-fit:contain;
                    "
                  >
                `
                : "🎁";


            return `

              <button
                type="button"
                class="gift-item"
                onclick="sendGift(${Number(gift.id)})"
              >

                <div
                  class="gift-image"
                >
                  ${image}
                </div>

                <div
                  class="gift-name"
                >
                  ${escapeHTML(
                    gift.name
                  )}
                </div>

                <div
                  class="gift-cost"
                >
                  🪙
                  ${Number(
                    gift.coin_cost || 0
                  )}
                </div>

              </button>

            `;
          }
        )
        .join("");


  } catch (error) {

    container.innerHTML =
      `<div class="empty-state">
        ${escapeHTML(
          error.message
        )}
      </div>`;
  }
}


/*
  Gift transaction endpoint अभी
  worker में अलग endpoint नहीं है।
  इसलिए UI में gift उपलब्ध होने के
  बाद अगला backend step जोड़ा जा सकता है।
*/

async function sendGift(
  giftId
) {

  showMessage(
    "Gift चुना गया। Gift transaction API अगले backend step में जोड़ा जाएगा।"
  );
}


window.loadGifts =
  loadGifts;

window.sendGift =
  sendGift;


/* =====================================================
   SUPPORT
===================================================== */

async function submitSupport(
  event
) {

  event.preventDefault();


  const subject =
    $("supportSubject")
      ?.value
      .trim();


  const message =
    $("supportMessage")
      ?.value
      .trim();


  if (
    !subject ||
    !message
  ) {

    showMessage(
      "Subject और message भरें।"
    );

    return;
  }


  try {

    showLoading(true);


    const result =
      await api(
        "/api/support",
        {
          method: "POST",

          body:
            JSON.stringify({
              subject,
              message
            })
        }
      );


    showMessage(
      result.message ||
      "Help request भेज दी गई।"
    );


    $("supportForm")
      ?.reset();


    openPage(
      "homePage"
    );


    state.currentPage =
      "home";


  } catch (error) {

    showMessage(
      error.message
    );

  } finally {

    showLoading(false);
  }
}


/* =====================================================
   PANELS
===================================================== */

function closePanels() {

  [
    "musicPanel",
    "giftPanel",
    "invitePanel"
  ]
  .forEach(
    id => {

      const element =
        $(id);

      if (element) {

        element.classList.add(
          "hidden"
        );
      }
    }
  );
}


function openMusicPanel() {

  closePanels();


  $("musicPanel")
    ?.classList
    .remove("hidden");


  loadMusic();
}


function openGiftPanel() {

  closePanels();


  $("giftPanel")
    ?.classList
    .remove("hidden");


  loadGifts();
}


function openInvitePanel() {

  closePanels();


  $("invitePanel")
    ?.classList
    .remove("hidden");
}


window.closePanels =
  closePanels;

window.openMusicPanel =
  openMusicPanel;

window.openGiftPanel =
  openGiftPanel;

window.openInvitePanel =
  openInvitePanel;


/* =====================================================
   SUPPORT PAGE
===================================================== */

function goBackFromSupport() {

  closePanels();


  if (
    state.roomId &&
    state.currentPage ===
    "support"
  ) {

    openPage(
      "roomPage"
    );

    state.currentPage =
      "room";

    return;
  }


  openPage(
    "homePage"
  );

  state.currentPage =
    "home";
}


window.goBackFromSupport =
  goBackFromSupport;


/* =====================================================
   EVENT LISTENERS
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* Login */

    $("loginForm")
      ?.addEventListener(
        "submit",
        loginUser
      );


    /* Register */

    $("registerForm")
      ?.addEventListener(
        "submit",
        registerUser
      );


    /* Create Room */

    $("createRoomForm")
      ?.addEventListener(
        "submit",
        createRoom
      );


    /* Chat */

    $("roomChatForm")
      ?.addEventListener(
        "submit",
        sendChatMessage
      );


    /* Support */

    $("supportForm")
      ?.addEventListener(
        "submit",
        submitSupport
      );


    /* Initial authentication */

    checkLogin();

  }
);


/* =====================================================
   CLEANUP
===================================================== */

window.addEventListener(
  "beforeunload",
  () => {

    stopRoomRefresh();

  }
);


/* =====================================================
   GLOBALS
===================================================== */

window.state =
  state;

window.loadRooms =
  loadRooms;

window.createRoom =
  createRoom;

window.joinRoom =
  joinRoom;

window.joinSeat =
  joinSeat;

window.leaveMySeat =
  leaveMySeat;

window.loadMessages =
  loadMessages;

window.sendChatMessage =
  sendChatMessage;

window.loginUser =
  loginUser;

window.registerUser =
  registerUser;

window.logoutUser =
  logoutUser;