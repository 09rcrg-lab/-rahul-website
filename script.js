/* =========================================================
   RAHUL LIVE COMMUNITY
   FINAL SCRIPT.JS
========================================================= */

const API =
  "https://rahulsocialhub-db.09rcrg.workers.dev";

let authToken =
  localStorage.getItem("rahul_live_token") || "";

let currentUser =
  JSON.parse(
    localStorage.getItem("rahul_live_user") || "null"
  );

let currentRoom = null;

let currentSeat = null;

let micOn = false;

let roomTimer = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function showPage(page) {

  const pages = [
    "loginPage",
    "registerPage",
    "homePage",
    "roomPage",
    "supportPage"
  ];

  pages.forEach(id => {

    const element = $(id);

    if (!element) return;

    element.classList.toggle(
      "hidden",
      id !== page + "Page"
    );

  });

}


function loading(show) {

  const element =
    $("loadingOverlay");

  if (!element) return;

  element.classList.toggle(
    "hidden",
    !show
  );

}


function message(text) {

  alert(text);

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

  if (authToken) {

    headers.Authorization =
      `Bearer ${authToken}`;

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
        "Server ने सही response नहीं दिया।"
    };

  }

  if (!response.ok) {

    throw new Error(
      data.message ||
      "Request failed."
    );

  }

  return data;

}


/* =========================================================
   LOCAL USER
========================================================= */

function saveUser(
  user,
  token = authToken
) {

  currentUser =
    user;

  authToken =
    token || "";

  localStorage.setItem(
    "rahul_live_user",
    JSON.stringify(user)
  );

  localStorage.setItem(
    "rahul_live_token",
    authToken
  );

}


function clearUser() {

  currentUser = null;

  authToken = "";

  localStorage.removeItem(
    "rahul_live_user"
  );

  localStorage.removeItem(
    "rahul_live_token"
  );

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

  if (!currentUser) return;


  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(element => {

      element.textContent =
        currentUser.name ||
        "User";

    });


  document
    .querySelectorAll(
      "[data-user-username]"
    )
    .forEach(element => {

      element.textContent =
        currentUser.username
          ? "@" +
            currentUser.username
          : "";

    });


  document
    .querySelectorAll(
      "[data-user-coins]"
    )
    .forEach(element => {

      element.textContent =
        Number(
          currentUser.coins || 0
        ).toLocaleString();

    });


  document
    .querySelectorAll(
      "[data-user-avatar]"
    )
    .forEach(element => {

      if (
        currentUser.avatar_url
      ) {

        element.innerHTML = "";

        const img =
          document.createElement(
            "img"
          );

        img.src =
          currentUser.avatar_url;

        img.alt =
          currentUser.name ||
          "User";

        element.appendChild(
          img
        );

      } else {

        element.textContent =
          "👤";

      }

    });

}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(
  email,
  password
) {

  loading(true);

  try {

    const data =
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

    if (!data.success) {

      throw new Error(
        data.message ||
        "Login failed."
      );

    }

    saveUser(
      data.user,
      data.token
    );

    updateUserUI();

    showPage("home");

    await loadRooms();

  } catch (error) {

    message(
      error.message
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(
  name,
  email,
  password
) {

  loading(true);

  try {

    const data =
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

    if (!data.success) {

      throw new Error(
        data.message ||
        "Registration failed."
      );

    }

    message(
      "Registration successful. अब Login करें।"
    );

    showPage("login");

    const emailInput =
      $("loginEmail");

    if (emailInput) {

      emailInput.value =
        email;

    }

  } catch (error) {

    message(
      error.message
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  try {

    await api(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch {

    // Local logout continues.
  }


  stopRoomPolling();

  currentRoom = null;

  currentSeat = null;

  micOn = false;

  clearUser();

  showPage("login");

}


/* =========================================================
   CREATE ROOM
========================================================= */

async function createRoom(
  name,
  description,
  roomType
) {

  loading(true);

  try {

    const data =
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

    if (!data.success) {

      throw new Error(
        data.message ||
        "Room create नहीं हुआ।"
      );

    }

    await openRoom(
      data.room_id
    );

  } catch (error) {

    message(
      error.message
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   LOAD ROOMS
========================================================= */

async function loadRooms() {

  const container =
    $("roomsList");

  if (!container) return;


  container.innerHTML =
    `<div class="empty-state">
       Rooms loading...
     </div>`;


  try {

    const data =
      await api(
        "/api/rooms"
      );

    const rooms =
      data.rooms || [];


    if (!rooms.length) {

      container.innerHTML =
        `<div class="empty-state">
           अभी कोई Live Room नहीं है।
         </div>`;

      return;

    }


    container.innerHTML = "";


    rooms.forEach(
      room => {

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "room-card";


        const title =
          document.createElement(
            "strong"
          );

        title.textContent =
          room.name;


        const description =
          document.createElement(
            "p"
          );

        description.textContent =
          room.description ||
          "Live Room";


        const viewers =
          document.createElement(
            "span"
          );

        viewers.textContent =
          "👁️ " +
          Number(
            room.viewer_count || 0
          );


        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "primary-btn";

        button.textContent =
          "Join Room";


        button.onclick =
          () => openRoom(
            room.id
          );


        card.appendChild(
          title
        );

        card.appendChild(
          description
        );

        card.appendChild(
          viewers
        );

        card.appendChild(
          button
        );


        container.appendChild(
          card
        );

      }
    );


  } catch (error) {

    container.innerHTML =
      `<div class="empty-state">
         Rooms load नहीं हो सके।
       </div>`;

  }

}


/* =========================================================
   OPEN ROOM
========================================================= */

async function openRoom(
  roomId
) {

  loading(true);

  try {

    await api(
      `/api/rooms/${roomId}/join`,
      {
        method: "POST"
      }
    );


    const data =
      await api(
        `/api/rooms/${roomId}`
      );


    currentRoom =
      data.room;


    currentSeat =
      null;


    micOn =
      false;


    showPage("room");


    renderRoomInfo();

    renderSeats(
      data.seats || []
    );

    await loadMessages();

    await loadMusic();

    await loadGifts();


    startRoomPolling();

  } catch (error) {

    message(
      error.message
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   ROOM INFO
========================================================= */

function renderRoomInfo() {

  if (!currentRoom) return;


  document
    .querySelectorAll(
      "[data-room-name]"
    )
    .forEach(element => {

      element.textContent =
        currentRoom.name ||
        "Live Room";

    });


  document
    .querySelectorAll(
      "[data-room-description]"
    )
    .forEach(element => {

      element.textContent =
        currentRoom.description ||
        "You are included in this room.";

    });

}


/* =========================================================
   RENDER 8 SEATS
========================================================= */

function renderSeats(
  seats
) {

  const container =
    $("voiceSeats");

  if (!container) return;


  const seatData = [];

  for (
    let number = 1;
    number <= 8;
    number++
  ) {

    const found =
      seats.find(
        seat =>
          Number(
            seat.seat_number
          ) === number
      );


    seatData.push(
      found || {
        seat_number:
          number,
        user_id:
          null,
        is_muted:
          1
      }
    );

  }


  container.innerHTML = "";


  seatData.forEach(
    seat => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "voice-seat";


      const avatar =
        document.createElement(
          "div"
        );

      avatar.className =
        "voice-seat-avatar";


      const name =
        document.createElement(
          "div"
        );

      name.className =
        "voice-seat-name";


      const number =
        document.createElement(
          "div"
        );

      number.className =
        "voice-seat-number";

      number.textContent =
        `Seat ${seat.seat_number}`;


      if (seat.user_id) {

        if (
          seat.avatar_url
        ) {

          const img =
            document.createElement(
              "img"
            );

          img.src =
            seat.avatar_url;

          img.alt =
            seat.name ||
            "User";

          avatar.appendChild(
            img
          );

        } else {

          avatar.textContent =
            "👤";

        }


        name.textContent =
          seat.name ||
          seat.username ||
          "User";


        if (
          Number(
            seat.user_id
          ) ===
          Number(
            currentUser?.id
          )
        ) {

          currentSeat =
            Number(
              seat.seat_number
            );

        }


        const micStatus =
          document.createElement(
            "span"
          );

        micStatus.className =
          "seat-mic-status";

        micStatus.textContent =
          Number(
            seat.is_muted
          ) === 1
            ? "🔇"
            : "🎙️";


        card.appendChild(
          avatar
        );

        card.appendChild(
          name
        );

        card.appendChild(
          micStatus
        );

        card.appendChild(
          number
        );


      } else {

        avatar.textContent =
          "👤";

        name.textContent =
          "Empty";


        const joinButton =
          document.createElement(
            "button"
          );

        joinButton.type =
          "button";

        joinButton.className =
          "empty-seat-btn";

        joinButton.textContent =
          "+";

        joinButton.onclick =
          () =>
            joinSeat(
              seat.seat_number
            );


        card.appendChild(
          joinButton
        );

        card.appendChild(
          avatar
        );

        card.appendChild(
          name
        );

        card.appendChild(
          number
        );

      }


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   JOIN SEAT
========================================================= */

async function joinSeat(
  seatNumber
) {

  if (!currentRoom) return;


  if (currentSeat) {

    message(
      "पहले अपनी current seat छोड़ें।"
    );

    return;

  }


  try {

    const data =
      await api(
        `/api/rooms/${currentRoom.id}/seats/${seatNumber}/join`,
        {
          method: "POST"
        }
      );


    if (!data.success) {

      throw new Error(
        data.message ||
        "Seat join नहीं हुई।"
      );

    }


    currentSeat =
      Number(
        seatNumber
      );

    micOn =
      false;


    await refreshRoom();

  } catch (error) {

    message(
      error.message
    );

  }

}


/* =========================================================
   LEAVE SEAT
========================================================= */

async function leaveMySeat() {

  if (
    !currentRoom ||
    !currentSeat
  ) {

    message(
      "आप किसी seat पर नहीं हैं।"
    );

    return;

  }


  try {

    await api(
      `/api/rooms/${currentRoom.id}/seats/${currentSeat}/leave`,
      {
        method: "POST"
      }
    );


    currentSeat =
      null;

    micOn =
      false;


    await refreshRoom();

  } catch (error) {

    message(
      error.message
    );

  }

}


/* =========================================================
   MIC
========================================================= */

async function toggleMic() {

  if (
    !currentRoom ||
    !currentSeat
  ) {

    message(
      "पहले किसी voice seat पर join करें।"
    );

    return;

  }


  const newState =
    !micOn;


  try {

    const data =
      await api(
        `/api/rooms/${currentRoom.id}/seats/${currentSeat}/mic`,
        {
          method: "POST",
          body:
            JSON.stringify({
              mic_on:
                newState
            })
        }
      );


    micOn =
      Boolean(
        data.mic_on
      );


    const button =
      $("micButton");

    if (button) {

      button.classList.toggle(
        "active",
        micOn
      );

    }


    await refreshRoom();

  } catch (error) {

    message(
      error.message
    );

  }

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

  if (!currentRoom) return;


  const container =
    $("roomMessages");

  if (!container) return;


  try {

    const data =
      await api(
        `/api/rooms/${currentRoom.id}/messages`
      );


    const messages =
      data.messages || [];


    if (!messages.length) {

      container.innerHTML =
        `<div class="empty-chat">
           Chat शुरू करें...
         </div>`;

      return;

    }


    container.innerHTML = "";


    messages.forEach(
      item => {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "chat-message";


        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          item.name ||
          item.username ||
          "User";


        const text =
          document.createElement(
            "span"
          );

        text.textContent =
          item.message;


        row.appendChild(
          name
        );

        row.appendChild(
          text
        );


        container.appendChild(
          row
        );

      }
    );


    container.scrollTop =
      container.scrollHeight;


  } catch {

    // Polling error silently ignored.
  }

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(
  text
) {

  if (
    !currentRoom ||
    !text.trim()
  ) return;


  try {

    await api(
      `/api/rooms/${currentRoom.id}/messages`,
      {
        method: "POST",
        body:
          JSON.stringify({
            message:
              text.trim()
          })
      }
    );


    await loadMessages();

  } catch (error) {

    message(
      error.message
    );

  }

}


/* =========================================================
   REACTION
========================================================= */

async function sendReaction(
  emoji
) {

  if (!currentRoom) return;


  try {

    await api(
      `/api/rooms/${currentRoom.id}/reactions`,
      {
        method: "POST",
        body:
          JSON.stringify({
            emoji
          })
      }
    );


    showFloatingReaction(
      emoji
    );

  } catch (error) {

    message(
      error.message
    );

  }

}


/* =========================================================
   FLOATING REACTION
========================================================= */

function showFloatingReaction(
  emoji
) {

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
    1500
  );

}


/* =========================================================
   MUSIC
========================================================= */

async function loadMusic() {

  const container =
    $("musicList");

  if (!container) return;


  try {

    const data =
      await api(
        "/api/music"
      );


    const tracks =
      data.tracks || [];


    if (!tracks.length) {

      container.innerHTML =
        `<div class="empty-state">
           अभी कोई music track उपलब्ध नहीं है।
         </div>`;

      return;

    }


    container.innerHTML = "";


    tracks.forEach(
      track => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "music-item";


        const title =
          document.createElement(
            "strong"
          );

        title.textContent =
          track.title;


        const artist =
          document.createElement(
            "small"
          );

        artist.textContent =
          track.artist || "";


        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.textContent =
          "Play";


        button.onclick =
          () =>
            playMusic(
              track
            );


        item.appendChild(
          title
        );

        item.appendChild(
          artist
        );

        item.appendChild(
          button
        );


        container.appendChild(
          item
        );

      }
    );


  } catch {

    container.innerHTML =
      `<div class="empty-state">
         Music load नहीं हुआ।
       </div>`;

  }

}


/* =========================================================
   PLAY MUSIC
========================================================= */

async function playMusic(
  track
) {

  if (!currentRoom) return;


  try {

    await api(
      `/api/rooms/${currentRoom.id}/music`,
      {
        method: "POST",
        body:
          JSON.stringify({
            track_id:
              track.id
          })
      }
    );


    if (
      track.audio_url
    ) {

      let audio =
        document.getElementById(
          "roomAudio"
        );


      if (!audio) {

        audio =
          document.createElement(
            "audio"
          );

        audio.id =
          "roomAudio";

        audio.controls =
          true;

        audio.style.width =
          "100%";

        document.body.appendChild(
          audio
        );

      }


      audio.src =
        track.audio_url;

      await audio.play();

    } else {

      message(
        "इस music की audio file उपलब्ध नहीं है।"
      );

    }

  } catch (error) {

    message(
      error.message
    );

  }

}


/* =========================================================
   GIFTS
========================================================= */

async function loadGifts() {

  const container =
    $("giftList");

  if (!container) return;


  try {

    const data =
      await api(
        "/api/gifts"
      );


    const gifts =
      data.gifts || [];


    if (!gifts.length) {

      container.innerHTML =
        `<div class="empty-state">
           अभी कोई gift उपलब्ध नहीं है।
         </div>`;

      return;

    }


    container.innerHTML = "";


    gifts.forEach(
      gift => {

        const item =
          document.createElement(
            "button"
          );

        item.type =
          "button";

        item.className =
          "gift-item";


        item.innerHTML =
          `
            <span>
              🎁
            </span>

            <strong>
              ${escapeHTML(
                gift.name
              )}
            </strong>

            <small>
              🪙 ${Number(
                gift.coin_cost || 0
              )}
            </small>
          `;


        item.onclick =
          () =>
            sendGift(
              gift
            );


        container.appendChild(
          item
        );

      }
    );


  } catch {

    container.innerHTML =
      `<div class="empty-state">
         Gifts load नहीं हुए।
       </div>`;

  }

}


/* =========================================================
   SEND GIFT
========================================================= */

async function sendGift(
  gift
) {

  message(
    `${gift.name} gift selected.`
  );

}


/* =========================================================
   PANELS
========================================================= */

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

  const panel =
    $("musicPanel");

  if (panel) {

    panel.classList.remove(
      "hidden"
    );

  }

}


function openGiftPanel() {

  closePanels();

  const panel =
    $("giftPanel");

  if (panel) {

    panel.classList.remove(
      "hidden"
    );

  }

}


function openInvitePanel() {

  closePanels();

  const panel =
    $("invitePanel");

  if (panel) {

    panel.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   LEAVE ROOM
========================================================= */

async function leaveRoom() {

  if (!currentRoom) {

    showPage("home");

    return;

  }


  try {

    await api(
      `/api/rooms/${currentRoom.id}/leave`,
      {
        method: "POST"
      }
    );

  } catch {

    // Continue leaving locally.
  }


  stopRoomPolling();

  closePanels();

  currentRoom = null;

  currentSeat = null;

  micOn = false;

  showPage("home");

  await loadRooms();

}


/* =========================================================
   ROOM REFRESH
========================================================= */

async function refreshRoom() {

  if (!currentRoom) return;


  try {

    const data =
      await api(
        `/api/rooms/${currentRoom.id}`
      );


    currentRoom =
      data.room;


    renderRoomInfo();

    renderSeats(
      data.seats || []
    );

  } catch {

    // Ignore temporary refresh errors.
  }

}


/* =========================================================
   ROOM POLLING
========================================================= */

function startRoomPolling() {

  stopRoomPolling();


  roomTimer =
    setInterval(
      async () => {

        if (!currentRoom)
          return;


        await refreshRoom();

        await loadMessages();

      },
      3000
    );

}


function stopRoomPolling() {

  if (roomTimer) {

    clearInterval(
      roomTimer
    );

    roomTimer =
      null;

  }

}


/* =========================================================
   SUPPORT
========================================================= */

async function sendSupport(
  subject,
  messageText
) {

  loading(true);

  try {

    const data =
      await api(
        "/api/support",
        {
          method: "POST",
          body:
            JSON.stringify({
              subject,
              message:
                messageText
            })
        }
      );


    if (!data.success) {

      throw new Error(
        data.message ||
        "Support request failed."
      );

    }


    message(
      "Support request भेज दी गई।"
    );


    $("supportSubject").value =
      "";

    $("supportMessage").value =
      "";


    showPage("home");


  } catch (error) {

    message(
      error.message
    );

  } finally {

    loading(false);

  }

}


/* =========================================================
   SUPPORT BACK
========================================================= */

function goBackFromSupport() {

  if (currentRoom) {

    showPage("room");

  } else {

    showPage("home");

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(value)
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
   FORM EVENTS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* LOGIN */

    const loginForm =
      $("loginForm");


    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();


          const email =
            $("loginEmail")
              ?.value
              .trim();


          const password =
            $("loginPassword")
              ?.value;


          loginUser(
            email,
            password
          );

        }
      );

    }


    /* REGISTER */

    const registerForm =
      $("registerForm");


    if (registerForm) {

      registerForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();


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


          registerUser(
            name,
            email,
            password
          );

        }
      );

    }


    /* CREATE ROOM */

    const createRoomForm =
      $("createRoomForm");


    if (createRoomForm) {

      createRoomForm.addEventListener(
        "submit",
        event => {

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


          createRoom(
            name,
            description,
            roomType
          );

        }
      );

    }


    /* CHAT */

    const chatForm =
      $("roomChatForm");


    if (chatForm) {

      chatForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();


          const input =
            $("roomMessage");


          if (!input) return;


          const text =
            input.value.trim();


          if (!text) return;


          input.value =
            "";


          sendMessage(
            text
          );

        }
      );

    }


    /* SUPPORT */

    const supportForm =
      $("supportForm");


    if (supportForm) {

      supportForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();


          const subject =
            $("supportSubject")
              ?.value
              .trim();


          const messageText =
            $("supportMessage")
              ?.value
              .trim();


          sendSupport(
            subject,
            messageText
          );

        }
      );

    }


    /* ESC KEY */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          closePanels();

        }

      }
    );


    /* INITIAL PAGE */

    if (authToken && currentUser) {

      updateUserUI();

      showPage("home");

      loadRooms();

    } else {

      showPage("login");

    }

  }
);


/* =========================================================
   PAGE CLOSE
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    stopRoomPolling();

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.showPage =
  showPage;

window.loginUser =
  loginUser;

window.registerUser =
  registerUser;

window.logoutUser =
  logoutUser;

window.createRoom =
  createRoom;

window.loadRooms =
  loadRooms;

window.openRoom =
  openRoom;

window.joinSeat =
  joinSeat;

window.leaveMySeat =
  leaveMySeat;

window.toggleMic =
  toggleMic;

window.sendReaction =
  sendReaction;

window.openMusicPanel =
  openMusicPanel;

window.openGiftPanel =
  openGiftPanel;

window.openInvitePanel =
  openInvitePanel;

window.closePanels =
  closePanels;

window.leaveRoom =
  leaveRoom;

window.goBackFromSupport =
  goBackFromSupport;