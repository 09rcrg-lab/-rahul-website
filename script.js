const API = "https://rahulsocialhub-db.09rcrg.workers.dev";

let authToken = localStorage.getItem("rahul_live_token") || "";
let currentUser = null;
let currentRoom = null;
let currentSeat = null;
let messageTimer = null;
let seatTimer = null;


/* =====================================================
   BASIC HELPERS
===================================================== */

const $ = (id) => document.getElementById(id);

function show(id) {
  const el = $(id);
  if (el) el.classList.remove("hidden");
}

function hide(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

function toast(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.remove("hidden");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.add("hidden");
  }, 3000);
}


async function api(path, options = {}) {

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(
    API + path,
    {
      ...options,
      headers
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Server ने invalid response दिया।");
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}


/* =====================================================
   AUTH SCREEN
===================================================== */

function openLogin() {
  show("loginForm");
  hide("registerForm");
}

function openRegister() {
  hide("loginForm");
  show("registerForm");
}


$("showRegisterBtn")?.addEventListener(
  "click",
  openRegister
);

$("showLoginBtn")?.addEventListener(
  "click",
  openLogin
);


/* =====================================================
   REGISTER
===================================================== */

$("registerBtn")?.addEventListener(
  "click",
  async () => {

    const name =
      $("registerName").value.trim();

    const email =
      $("registerEmail").value.trim();

    const password =
      $("registerPassword").value;

    const confirm =
      $("registerPasswordConfirm").value;


    if (!name || !email || !password) {
      toast("सभी details भरें।");
      return;
    }


    if (password !== confirm) {
      toast("दोनों password समान नहीं हैं।");
      return;
    }


    const button = $("registerBtn");

    button.disabled = true;
    button.textContent = "Creating...";


    try {

      const result =
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
        result.message ||
        "Account बन गया।"
      );


      $("registerPassword").value = "";
      $("registerPasswordConfirm").value = "";


      $("loginEmail").value = email;

      openLogin();

    } catch (error) {

      toast(error.message);

    } finally {

      button.disabled = false;
      button.textContent = "Create Account";

    }

  }
);


/* =====================================================
   LOGIN
===================================================== */

$("loginBtn")?.addEventListener(
  "click",
  login
);


$("loginPassword")?.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {
      login();
    }

  }
);


async function login() {

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  if (!email || !password) {
    toast("Email और password डालें।");
    return;
  }


  const button = $("loginBtn");

  button.disabled = true;
  button.textContent = "Logging in...";


  try {

    const result =
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


    authToken = result.token;

    currentUser = result.user;

    localStorage.setItem(
      "rahul_live_token",
      authToken
    );


    showApp();

    await loadRooms();

    await loadProfile();


    toast("Login successful.");

  } catch (error) {

    toast(error.message);

  } finally {

    button.disabled = false;
    button.textContent = "Login";

  }

}


/* =====================================================
   APP
===================================================== */

function showApp() {

  hide("authScreen");
  show("mainApp");
  hide("roomPage");

  showPage("homePage");

}


function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.add("hidden");
    });


  const page = $(pageId);

  if (page) {
    page.classList.remove("hidden");
  }


  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.classList.remove("active");
    });


  const active =
    document.querySelector(
      `.nav-item[data-page="${pageId}"]`
    );

  active?.classList.add("active");

}


document
  .querySelectorAll(".nav-item[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

        if (
          button.dataset.page ===
          "homePage"
        ) {
          loadRooms();
        }

      }
    );

  });


/* =====================================================
   LOGOUT
===================================================== */

$("logoutBtn")?.addEventListener(
  "click",
  async () => {

    try {
      await api(
        "/api/logout",
        {
          method: "POST"
        }
      );
    } catch {}

    stopRoomTimers();

    authToken = "";
    currentUser = null;
    currentRoom = null;

    localStorage.removeItem(
      "rahul_live_token"
    );

    hide("mainApp");
    hide("roomPage");
    show("authScreen");

    openLogin();

  }
);


/* =====================================================
   ROOMS
===================================================== */

async function loadRooms() {

  const container =
    $("roomsContainer");

  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      <h3>Loading rooms...</h3>
      <p>Please wait.</p>
    </div>
  `;


  try {

    const result =
      await api("/api/rooms");


    renderRooms(
      result.rooms || []
    );

  } catch (error) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>Rooms load नहीं हुए</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;

  }

}


function renderRooms(rooms) {

  const container =
    $("roomsContainer");

  if (!container) return;


  if (!rooms.length) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No live rooms</h3>
        <p>अपना पहला room बनाइए।</p>
      </div>
    `;

    return;
  }


  container.innerHTML =
    rooms.map(room => `

      <article class="room-card">

        <div class="room-card-avatar">
          ${room.owner_avatar
            ? `<img src="${escapeAttr(room.owner_avatar)}">`
            : "🎙️"}
        </div>

        <div class="room-card-content">

          <h3>
            ${escapeHtml(room.name)}
          </h3>

          <p>
            ${escapeHtml(
              room.description || ""
            )}
          </p>

          <small>
            👤 ${escapeHtml(
              room.owner_name || "User"
            )}

            ·

            🔴 ${
              Number(room.viewer_count || 0)
            }
          </small>

        </div>

        <button
          type="button"
          class="join-room-button"
          data-room-id="${room.id}"
        >
          Join
        </button>

      </article>

    `).join("");


  container
    .querySelectorAll(
      ".join-room-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          enterRoom(
            Number(
              button.dataset.roomId
            )
          );

        }
      );

    });

}


$("roomSearch")?.addEventListener(
  "input",
  async event => {

    const value =
      event.target.value
        .trim()
        .toLowerCase();


    try {

      const result =
        await api("/api/rooms");


      const rooms =
        (result.rooms || [])
          .filter(room =>
            !value ||
            String(room.name)
              .toLowerCase()
              .includes(value) ||
            String(room.owner_name || "")
              .toLowerCase()
              .includes(value)
          );


      renderRooms(rooms);

    } catch {}

  }
);


/* =====================================================
   CREATE ROOM
===================================================== */

function openCreateRoom() {
  show("createRoomModal");
}

function closeCreateRoom() {
  hide("createRoomModal");
}


$("createRoomBtn")?.addEventListener(
  "click",
  openCreateRoom
);

$("bottomCreateRoomBtn")?.addEventListener(
  "click",
  openCreateRoom
);

$("closeCreateRoomBtn")?.addEventListener(
  "click",
  closeCreateRoom
);


$("saveRoomBtn")?.addEventListener(
  "click",
  async () => {

    const name =
      $("roomName").value.trim();

    const description =
      $("roomDescription").value.trim();

    const room_type =
      $("roomType").value;


    if (!name) {
      toast("Room name डालें।");
      return;
    }


    const button =
      $("saveRoomBtn");

    button.disabled = true;
    button.textContent = "Creating...";


    try {

      const result =
        await api(
          "/api/rooms",
          {
            method: "POST",
            body: JSON.stringify({
              name,
              description,
              room_type
            })
          }
        );


      closeCreateRoom();

      $("roomName").value = "";
      $("roomDescription").value = "";


      toast("Room बन गया।");


      await loadRooms();


      if (result.room_id) {
        await enterRoom(
          Number(result.room_id)
        );
      }

    } catch (error) {

      toast(error.message);

    } finally {

      button.disabled = false;
      button.textContent = "Create Room";

    }

  }
);


/* =====================================================
   ENTER ROOM
===================================================== */

async function enterRoom(roomId) {

  try {

    await api(
      `/api/rooms/${roomId}/join`,
      {
        method: "POST"
      }
    );


    const result =
      await api(
        `/api/rooms/${roomId}`
      );


    currentRoom = result.room;

    currentSeat = null;


    hide("mainApp");
    show("roomPage");


    renderRoom(
      result
    );


    startRoomTimers();


  } catch (error) {

    toast(error.message);

  }

}


/* =====================================================
   ROOM
===================================================== */

function renderRoom(data) {

  const room =
    data.room || {};

  const title =
    document.querySelector(
      ".room-title"
    );

  if (title) {
    title.textContent =
      room.name || "Live Room";
  }


  renderSeats(
    data.seats || []
  );


  loadMessages();

}


async function refreshRoom() {

  if (!currentRoom) return;


  try {

    const result =
      await api(
        `/api/rooms/${currentRoom.id}`
      );


    renderSeats(
      result.seats || []
    );

  } catch {}

}


function startRoomTimers() {

  stopRoomTimers();


  loadMessages();

  refreshRoom();


  messageTimer =
    setInterval(
      loadMessages,
      2500
    );


  seatTimer =
    setInterval(
      refreshRoom,
      2000
    );

}


function stopRoomTimers() {

  if (messageTimer) {
    clearInterval(messageTimer);
    messageTimer = null;
  }


  if (seatTimer) {
    clearInterval(seatTimer);
    seatTimer = null;
  }

}


/* =====================================================
   SEATS
===================================================== */

function renderSeats(seats) {

  const seatButtons =
    document.querySelectorAll(
      ".voice-seat"
    );


  seatButtons.forEach(button => {

    const number =
      Number(
        button.dataset.joinSeat
      );


    const seat =
      seats.find(
        item =>
          Number(item.seat_number) ===
          number
      );


    if (!seat || !seat.user_id) {

      button.classList.add(
        "empty-seat"
      );


      button.innerHTML = `
        <div class="seat-avatar">+</div>
        <strong>Seat ${number}</strong>
        <small>Join</small>
      `;

      return;
    }


    button.classList.remove(
      "empty-seat"
    );


    const isMe =
      Number(seat.user_id) ===
      Number(currentUser?.id);


    button.innerHTML = `

      <div class="seat-avatar">

        ${
          seat.avatar_url
            ? `<img src="${escapeAttr(
                seat.avatar_url
              )}">`
            : "👤"
        }

      </div>

      <strong>
        ${escapeHtml(
          seat.name || "User"
        )}
      </strong>

      <small>
        ${
          Number(seat.is_muted)
            ? "🔇 Muted"
            : "🎙️ Live"
        }
      </small>

      ${
        isMe
          ? `<em>YOU</em>`
          : ""
      }

    `;

  });

}


document
  .querySelectorAll(
    ".voice-seat"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        if (!currentRoom) {
          return;
        }


        const seatNumber =
          Number(
            button.dataset.joinSeat
          );


        const isMine =
          button.querySelector(
            "em"
          );


        try {

          if (isMine) {

            await api(
              `/api/rooms/${currentRoom.id}/seats/${seatNumber}/leave`,
              {
                method: "POST"
              }
            );

            currentSeat = null;

            toast("Seat छोड़ दी।");

          } else {

            await api(
              `/api/rooms/${currentRoom.id}/seats/${seatNumber}/join`,
              {
                method: "POST"
              }
            );

            currentSeat = seatNumber;

            toast(
              `Seat ${seatNumber} join हो गई।`
            );

          }


          await refreshRoom();

        } catch (error) {

          toast(error.message);

        }

      }
    );

  });


/* =====================================================
   LEAVE ROOM
===================================================== */

$("leaveRoomBtn")?.addEventListener(
  "click",
  leaveRoom
);


async function leaveRoom() {

  if (!currentRoom) return;


  try {

    await api(
      `/api/rooms/${currentRoom.id}/leave`,
      {
        method: "POST"
      }
    );

  } catch {}


  stopRoomTimers();

  currentRoom = null;
  currentSeat = null;


  hide("roomPage");
  show("mainApp");

  showPage("homePage");

  await loadRooms();

}


/* =====================================================
   CHAT
===================================================== */

async function loadMessages() {

  if (!currentRoom) return;


  try {

    const result =
      await api(
        `/api/rooms/${currentRoom.id}/messages`
      );


    renderMessages(
      result.messages || []
    );

  } catch {}

}


function renderMessages(messages) {

  const container =
    $("roomMessages");

  if (!container) return;


  if (!messages.length) {

    container.innerHTML = `
      <div class="empty-chat">
        अभी कोई message नहीं है।
      </div>
    `;

    return;
  }


  container.innerHTML =
    messages.map(message => `

      <div class="chat-message">

        <div class="chat-avatar">

          ${
            message.avatar_url
              ? `<img src="${escapeAttr(
                  message.avatar_url
                )}">`
              : "👤"
          }

        </div>

        <div>

          <strong>
            ${escapeHtml(
              message.name ||
              message.username ||
              "User"
            )}
          </strong>

          <p>
            ${escapeHtml(
              message.message
            )}
          </p>

        </div>

      </div>

    `).join("");


  container.scrollTop =
    container.scrollHeight;

}


async function sendMessage() {

  if (!currentRoom) return;


  const input =
    $("roomMessageInput");

  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  const button =
    $("sendRoomMessageBtn");

  button.disabled = true;


  try {

    await api(
      `/api/rooms/${currentRoom.id}/messages`,
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

    toast(error.message);

  } finally {

    button.disabled = false;

  }

}


$("sendRoomMessageBtn")?.addEventListener(
  "click",
  sendMessage
);


$("roomMessageInput")?.addEventListener(
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


/* =====================================================
   ROOM CONTROLS
===================================================== */

document
  .querySelectorAll(
    ".room-controls button[data-action]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const action =
          button.dataset.action;


        if (!currentRoom) {
          return;
        }


        if (action === "mic") {
          await toggleMic();
        }


        if (action === "music") {
          await openMusic();
        }


        if (action === "invite") {
          await inviteFriend();
        }


        if (action === "gift") {
          await sendGift();
        }

      }
    );

  });


/* =====================================================
   MIC
===================================================== */

async function toggleMic() {

  if (!currentSeat) {

    toast(
      "पहले किसी खाली seat पर बैठें।"
    );

    return;
  }


  try {

    const result =
      await api(
        `/api/rooms/${currentRoom.id}/seats`,
        {
          method: "GET"
        }
      );


    const seat =
      (result.seats || [])
        .find(
          s =>
            Number(s.seat_number) ===
            Number(currentSeat)
        );


    if (!seat) {
      toast("Seat नहीं मिली।");
      return;
    }


    const micOn =
      Number(seat.is_muted) === 1;


    await api(
      `/api/rooms/${currentRoom.id}/seats/${currentSeat}/mic`,
      {
        method: "POST",
        body: JSON.stringify({
          mic_on: micOn
        })
      }
    );


    toast(
      micOn
        ? "Mic ON"
        : "Mic OFF"
    );


    await refreshRoom();

  } catch (error) {

    toast(error.message);

  }

}


/* =====================================================
   MUSIC
===================================================== */

async function openMusic() {

  try {

    const result =
      await api("/api/music");


    const tracks =
      result.tracks || [];


    if (!tracks.length) {

      toast(
        "अभी music tracks उपलब्ध नहीं हैं।"
      );

      return;
    }


    const names =
      tracks
        .slice(0, 10)
        .map(
          (track, index) =>
            `${index + 1}. ${track.title} - ${track.artist || ""}`
        )
        .join("\n");


    const answer =
      prompt(
        `Music चुनें:\n\n${names}\n\nNumber डालें:`
      );


    if (answer === null) {
      return;
    }


    const index =
      Number(answer) - 1;


    if (
      !Number.isInteger(index) ||
      !tracks[index]
    ) {

      toast("गलत music number।");

      return;
    }


    const track =
      tracks[index];


    await api(
      `/api/rooms/${currentRoom.id}/music`,
      {
        method: "POST",
        body: JSON.stringify({
          track_id: track.id
        })
      }
    );


    toast(
      `${track.title} room music में set है।`
    );

  } catch (error) {

    toast(error.message);

  }

}


/* =====================================================
   INVITE
===================================================== */

async function inviteFriend() {

  if (!currentRoom) return;


  const shareUrl =
    `${location.origin}${location.pathname}?room=${currentRoom.id}`;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title:
          currentRoom.name ||
          "Rahul Live Room",
        text:
          "मेरे Rahul Live room में join करो।",
        url: shareUrl
      });

      return;

    } catch {}

  }


  try {

    await navigator.clipboard.writeText(
      shareUrl
    );

    toast(
      "Room invite link copy हो गया।"
    );

  } catch {

    prompt(
      "Room invite link:",
      shareUrl
    );

  }

}


/* =====================================================
   GIFT
===================================================== */

async function sendGift() {

  try {

    const result =
      await api("/api/gifts");


    const gifts =
      result.gifts || [];


    if (!gifts.length) {

      toast(
        "अभी gifts उपलब्ध नहीं हैं।"
      );

      return;
    }


    const list =
      gifts
        .slice(0, 10)
        .map(
          (gift, index) =>
            `${index + 1}. ${gift.name} — ${gift.coin_cost} coins`
        )
        .join("\n");


    const answer =
      prompt(
        `Gift चुनें:\n\n${list}\n\nNumber डालें:`
      );


    if (answer === null) {
      return;
    }


    const index =
      Number(answer) - 1;


    if (
      !Number.isInteger(index) ||
      !gifts[index]
    ) {

      toast("गलत gift number।");
      return;

    }


    toast(
      "Gift system के लिए recipient और wallet transaction API अगली backend layer में जोड़ी जाएगी।"
    );

  } catch (error) {

    toast(error.message);

  }

}


/* =====================================================
   REACTION
===================================================== */

document
  .querySelectorAll(
    "[data-reaction]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        if (!currentRoom) return;


        const emoji =
          button.dataset.reaction;


        try {

          await api(
            `/api/rooms/${currentRoom.id}/reactions`,
            {
              method: "POST",
              body: JSON.stringify({
                emoji
              })
            }
          );


          toast(`${emoji} भेजा गया।`);

        } catch (error) {

          toast(error.message);

        }

      }
    );

  });


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

  try {

    const result =
      await api("/api/me");


    currentUser =
      result.user;


    const card =
      $("profileCard");

    if (!card) return;


    card.innerHTML = `

      <div class="avatar">

        ${
          currentUser.avatar_url
            ? `<img src="${escapeAttr(
                currentUser.avatar_url
              )}">`
            : "👤"
        }

      </div>

      <div>

        <h2>
          ${escapeHtml(
            currentUser.name || ""
          )}
        </h2>

        <p>
          @${escapeHtml(
            currentUser.username || ""
          )}
        </p>

        <small>
          ${escapeHtml(
            currentUser.email || ""
          )}
        </small>

        <p>
          🪙 ${
            Number(
              currentUser.coins || 0
            )
          } coins
        </p>

      </div>

    `;

  } catch (error) {

    if (authToken) {
      toast(error.message);
    }

  }

}


/* =====================================================
   SUPPORT
===================================================== */

$("openSupportBtn")?.addEventListener(
  "click",
  async () => {

    const subject =
      prompt(
        "Problem का subject:"
      );

    if (!subject) return;


    const message =
      prompt(
        "अपनी problem पूरी तरह लिखें:"
      );

    if (!message) return;


    try {

      const result =
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


      toast(
        result.message ||
        "Support request भेज दी गई।"
      );

    } catch (error) {

      toast(error.message);

    }

  }
);


/* =====================================================
   AUTO LOGIN
===================================================== */

async function start() {

  if (!authToken) {

    show("authScreen");
    hide("mainApp");
    hide("roomPage");

    return;
  }


  try {

    const result =
      await api("/api/me");


    currentUser =
      result.user;


    showApp();

    await loadRooms();

    await loadProfile();

  } catch {

    authToken = "";

    localStorage.removeItem(
      "rahul_live_token"
    );

    show("authScreen");
    hide("mainApp");
    hide("roomPage");

  }

}


/* =====================================================
   URL ROOM JOIN
===================================================== */

async function checkRoomLink() {

  const params =
    new URLSearchParams(
      location.search
    );

  const roomId =
    Number(
      params.get("room")
    );


  if (
    roomId &&
    authToken
  ) {

    await enterRoom(roomId);

  }

}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttr(value) {

  return escapeHtml(value);

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await start();

    await checkRoomLink();

  }
);