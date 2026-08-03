const API = "https://rahulsocialhub-db.09rcrg.workers.dev";
let token = localStorage.getItem("rahul_live_token");
let currentUser = null;
let currentRoom = null;
let roomTimer = null;
let messageTimer = null;
/* =====================================================
   HELPERS
   ===================================================== */
const $ = (id) => document.getElementById(id);
function show(id) {
  $(id)?.classList.remove("hidden");
}
function hide(id) {
  $(id)?.classList.add("hidden");
}
function toast(message) {
  const box = $("toast");
  if (!box) {
    alert(message);
    return;
  }
  box.textContent = message;
  box.classList.remove("hidden");
  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.classList.add("hidden");
  }, 2500);
}
async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(API + path, {
    ...options,
    headers
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Server response सही नहीं है।");
  }
  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Request failed."
    );
  }
  return data;
}
/* =====================================================
   AUTH SCREEN
   ===================================================== */
function showLogin() {
  show("loginForm");
  hide("registerForm");
}
function showRegister() {
  hide("loginForm");
  show("registerForm");
}
async function login() {
  const email =
    $("loginEmail")?.value.trim();
  const password =
    $("loginPassword")?.value;
  if (!email || !password) {
    toast("Email और password डालें।");
    return;
  }
  const button = $("loginBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Login...";
  }
  try {
    const data = await api(
      "/api/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      }
    );
    token = data.token;
    localStorage.setItem(
      "rahul_live_token",
      token
    );
    currentUser = data.user;
    await openApp();
  } catch (error) {
    toast(error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Login";
    }
  }
}
async function register() {
  const name =
    $("registerName")?.value.trim();
  const email =
    $("registerEmail")?.value.trim();
  const password =
    $("registerPassword")?.value;
  const confirm =
    $("registerPasswordConfirm")?.value;
  if (!name || !email || !password) {
    toast("सभी जानकारी भरें।");
    return;
  }
  if (password !== confirm) {
    toast("Password match नहीं है।");
    return;
  }
  if (password.length < 6) {
    toast(
      "Password कम से कम 6 characters का रखें।"
    );
    return;
  }
  const button = $("registerBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Creating...";
  }
  try {
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
      "Account बन गया। अब Login करें।"
    );
    showLogin();
    $("loginEmail").value = email;
  } catch (error) {
    toast(error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Create Account";
    }
  }
}
async function logout() {
  try {
    await api(
      "/api/logout",
      {
        method: "POST"
      }
    );
  } catch {}
  stopRoomTimers();
  token = null;
  currentUser = null;
  currentRoom = null;
  localStorage.removeItem(
    "rahul_live_token"
  );
  hide("mainApp");
  hide("roomPage");
  show("authScreen");
  showLogin();
}
/* =====================================================
   APP
   ===================================================== */
async function openApp() {
  hide("authScreen");
  show("mainApp");
  await loadMe();
  await loadRooms();
}
async function loadMe() {
  try {
    const data =
      await api("/api/me");
    currentUser = data.user;
    updateProfile();
  } catch {
    token = null;
    localStorage.removeItem(
      "rahul_live_token"
    );
    hide("mainApp");
    show("authScreen");
    showLogin();
  }
}
function updateProfile() {
  const card = $("profileCard");
  if (!card || !currentUser) {
    return;
  }
  const avatar =
    currentUser.avatar_url
      ? `<img src="${escapeHTML(currentUser.avatar_url)}" alt="">`
      : "👤";
  card.innerHTML = `
    <div class="avatar">
      ${avatar}
    </div>
    <div>
      <h2>${escapeHTML(currentUser.name || "")}</h2>
      <p>
        @${escapeHTML(currentUser.username || "")}
      </p>
      <p>
        ${escapeHTML(currentUser.bio || "")}
      </p>
    </div>
  `;
}
/* =====================================================
   NAVIGATION
   ===================================================== */
function openPage(pageId) {
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
      `[data-page="${pageId}"]`
    );
  active?.classList.add("active");
}
/* =====================================================
   ROOMS
   ===================================================== */
async function loadRooms() {
  const container =
    $("roomsContainer");
  if (!container) return;
  try {
    const data =
      await api("/api/rooms");
    renderRooms(data.rooms || []);
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Rooms load नहीं हुए</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}
function renderRooms(rooms) {
  const container =
    $("roomsContainer");
  if (!container) return;
  const search =
    $("roomSearch")?.value
      .trim()
      .toLowerCase() || "";
  const filtered =
    rooms.filter(room => {
      const text =
        `${room.name || ""}
         ${room.description || ""}
         ${room.owner_name || ""}`
          .toLowerCase();
      return text.includes(search);
    });
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>कोई Live Room नहीं मिला</h3>
        <p>अपना पहला room बनाइए।</p>
      </div>
    `;
    return;
  }
  container.innerHTML =
    filtered.map(room => {
      const avatar =
        room.owner_avatar
          ? `<img src="${escapeHTML(room.owner_avatar)}" alt="">`
          : "👤";
      return `
        <article
          class="room-card"
          data-room-id="${room.id}"
        >
          <div class="room-card-avatar">
            ${avatar}
          </div>
          <div class="room-card-content">
            <h3>
              ${escapeHTML(room.name || "Live Room")}
            </h3>
            <p>
              ${escapeHTML(
                room.description || "Live conversation"
              )}
            </p>
            <div class="room-meta">
              <span>
                👤 ${Number(room.viewer_count || 0)}
              </span>
              <span>
                ${
                  room.room_type === "private"
                    ? "🔒 Private"
                    : "🌐 Public"
                }
              </span>
            </div>
          </div>
          <button
            type="button"
            class="join-room-button"
            data-join-room="${room.id}"
          >
            Join
          </button>
        </article>
      `;
    }).join("");
}
/* =====================================================
   CREATE ROOM
   ===================================================== */
function openCreateRoom() {
  show("createRoomModal");
  $("roomName")?.focus();
}
function closeCreateRoom() {
  hide("createRoomModal");
}
async function createRoom() {
  const name =
    $("roomName")?.value.trim();
  const description =
    $("roomDescription")?.value.trim();
  const type =
    $("roomType")?.value === "private"
      ? "private"
      : "public";
  if (!name) {
    toast("Room name डालें।");
    return;
  }
  const button =
    $("saveRoomBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Creating...";
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
            room_type: type
          })
        }
      );
    closeCreateRoom();
    $("roomName").value = "";
    $("roomDescription").value = "";
    await loadRooms();
    await openRoom(
      data.room_id
    );
  } catch (error) {
    toast(error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Create Room";
    }
  }
}
/* =====================================================
   OPEN ROOM
   ===================================================== */
async function openRoom(roomId) {
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
    currentRoom = data.room;
    hide("mainApp");
    show("roomPage");
    updateRoomHeader();
    renderRoomSeats(
      data.seats || []
    );
    renderRoomMembers(
      data.members || []
    );
    await loadMessages();
    startRoomTimers();
  } catch (error) {
    toast(error.message);
  }
}
function updateRoomHeader() {
  if (!currentRoom) return;
  const title =
    document.querySelector(
      ".room-title"
    );
  if (title) {
    title.textContent =
      currentRoom.name ||
      "Live Room";
  }
}
/* =====================================================
   ROOM REFRESH
   ===================================================== */
function startRoomTimers() {
  stopRoomTimers();
  roomTimer =
    setInterval(
      refreshRoom,
      3000
    );
  messageTimer =
    setInterval(
      loadMessages,
      2500
    );
}
function stopRoomTimers() {
  if (roomTimer) {
    clearInterval(roomTimer);
    roomTimer = null;
  }
  if (messageTimer) {
    clearInterval(messageTimer);
    messageTimer = null;
  }
}
async function refreshRoom() {
  if (!currentRoom) return;
  try {
    const data =
      await api(
        `/api/rooms/${currentRoom.id}`
      );
    renderRoomSeats(
      data.seats || []
    );
    renderRoomMembers(
      data.members || []
    );
  } catch {}
}
/* =====================================================
   SEATS
   ===================================================== */
function renderRoomSeats(seats) {
  const area =
    document.querySelector(
      ".voice-area"
    );
  if (!area) return;
  const byNumber = {};
  seats.forEach(seat => {
    byNumber[
      Number(seat.seat_number)
    ] = seat;
  });
  let html = "";
  for (
    let number = 1;
    number <= 8;
    number++
  ) {
    const seat =
      byNumber[number];
    const occupied =
      seat &&
      Number(seat.is_occupied) === 1;
    if (occupied) {
      const isMe =
        Number(seat.user_id) ===
        Number(currentUser?.id);
      const avatar =
        seat.avatar_url
          ? `<img src="${escapeHTML(seat.avatar_url)}" alt="">`
          : "👤";
      html += `
        <div
          class="voice-seat occupied-seat"
          data-seat="${number}"
        >
          <div class="seat-avatar">
            ${avatar}
          </div>
          <strong>
            ${escapeHTML(
              seat.name ||
              seat.username ||
              "User"
            )}
          </strong>
          <small>
            ${
              Number(seat.mic_on)
                ? "🎙️ Live"
                : "🔇 Muted"
            }
          </small>
          ${
            isMe
              ? `
                <button
                  type="button"
                  class="seat-action"
                  data-leave-seat="${number}"
                >
                  Leave Seat
                </button>
              `
              : ""
          }
        </div>
      `;
    } else {
      html += `
        <button
          type="button"
          class="voice-seat empty-seat"
          data-join-seat="${number}"
        >
          <div class="seat-avatar">
            +
          </div>
          <strong>
            Seat ${number}
          </strong>
          <small>
            Join
          </small>
        </button>
      `;
    }
  }
  area.innerHTML = html;
}
async function joinSeat(seatNumber) {
  if (!currentRoom) return;
  try {
    await api(
      `/api/rooms/${currentRoom.id}/seats/${seatNumber}/join`,
      {
        method: "POST"
      }
    );
    toast(
      `Seat ${seatNumber} join हो गई।`
    );
    await refreshRoom();
  } catch (error) {
    toast(error.message);
  }
}
async function leaveSeat(seatNumber) {
  if (!currentRoom) return;
  try {
    await api(
      `/api/rooms/${currentRoom.id}/seats/${seatNumber}/leave`,
      {
        method: "POST"
      }
    );
    await refreshRoom();
  } catch (error) {
    toast(error.message);
  }
}
/* =====================================================
   REAL MICROPHONE
   ===================================================== */
let localAudioStream = null;
let microphoneOn = false;
async function startMicrophone() {
  if (!currentRoom) {
    toast("पहले room join करें।");
    return;
  }
  const mySeat =
    await getMySeat();
  if (!mySeat) {
    toast(
      "पहले voice seat join करें।"
    );
    return;
  }
  try {
    if (!localAudioStream) {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "इस browser में microphone उपलब्ध नहीं है।"
        );
      }
      localAudioStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
    }
    microphoneOn = !microphoneOn;
    localAudioStream
      .getAudioTracks()
      .forEach(track => {
        track.enabled =
          microphoneOn;
      });
    await api(
      `/api/rooms/${currentRoom.id}/seats/${mySeat.seat_number}/mic`,
      {
        method: "POST",
        body: JSON.stringify({
          mic_on: microphoneOn
        })
      }
    );
    updateMicButton();
    await refreshRoom();
  } catch (error) {
    microphoneOn = false;
    toast(
      error.message ||
      "Microphone access नहीं मिला।"
    );
  }
}
function updateMicButton() {
  const button =
    document.querySelector(
      ".room-controls button[data-action='mic']"
    );
  if (!button) return;
  button.innerHTML =
    microphoneOn
      ? "🔊<span>Mic On</span>"
      : "🎙️<span>Mic</span>";
}
async function getMySeat() {
  if (!currentRoom || !currentUser) {
    return null;
  }
  try {
    const data =
      await api(
        `/api/rooms/${currentRoom.id}/seats`
      );
    return (
      data.seats || []
    ).find(
      seat =>
        Number(seat.user_id) ===
        Number(currentUser.id)
    ) || null;
  } catch {
    return null;
  }
}
/* =====================================================
   CHAT
   ===================================================== */
async function loadMessages() {
  if (!currentRoom) return;
  try {
    const data =
      await api(
        `/api/rooms/${currentRoom.id}/messages`
      );
    renderMessages(
      data.messages || []
    );
  } catch {}
}
function renderMessages(messages) {
  const box =
    $("roomMessages");
  if (!box) return;
  if (!messages.length) {
    box.innerHTML = `
      <div class="empty-chat">
        अभी कोई message नहीं है।
      </div>
    `;
    return;
  }
  box.innerHTML =
    messages.map(message => {
      const mine =
        Number(message.user_id) ===
        Number(currentUser?.id);
      return `
        <div
          class="chat-message ${mine ? "mine" : ""}"
        >
          <div class="chat-avatar">
            ${
              message.avatar_url
                ? `<img src="${escapeHTML(message.avatar_url)}" alt="">`
                : "👤"
            }
          </div>
          <div class="chat-message-content">
            <strong>
              ${escapeHTML(
                message.name ||
                message.username ||
                "User"
              )}
            </strong>
            <p>
              ${escapeHTML(
                message.message
              )}
            </p>
          </div>
        </div>
      `;
    }).join("");
  box.scrollTop =
    box.scrollHeight;
}
async function sendMessage() {
  if (!currentRoom) return;
  const input =
    $("roomMessageInput");
  const message =
    input?.value.trim();
  if (!message) return;
  const button =
    $("sendRoomMessageBtn");
  if (button) {
    button.disabled = true;
  }
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
    if (button) {
      button.disabled = false;
    }
  }
}
/* =====================================================
   MEMBERS
   ===================================================== */
function renderRoomMembers(members) {
  const info =
    document.querySelector(
      ".room-info-card"
    );
  if (!info) return;
  const count =
    members.length;
  const old =
    info.querySelector(
      ".room-member-count"
    );
  if (old) {
    old.textContent =
      `${count} member${count === 1 ? "" : "s"}`;
  } else {
    const counter =
      document.createElement("span");
    counter.className =
      "room-member-count";
    counter.textContent =
      `${count} member${count === 1 ? "" : "s"}`;
    info.appendChild(counter);
  }
}
/* =====================================================
   REACTIONS
   ===================================================== */
async function sendReaction(emoji) {
  if (!currentRoom) return;
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
    showFloatingReaction(emoji);
  } catch (error) {
    toast(error.message);
  }
}
function showFloatingReaction(emoji) {
  const item =
    document.createElement("div");
  item.className =
    "floating-reaction";
  item.textContent =
    emoji;
  document.body.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 1800);
}
/* =====================================================
   LEAVE ROOM
   ===================================================== */
async function leaveRoom() {
  if (!currentRoom) return;
  stopRoomTimers();
  try {
    await api(
      `/api/rooms/${currentRoom.id}/leave`,
      {
        method: "POST"
      }
    );
  } catch {}
  if (localAudioStream) {
    localAudioStream
      .getTracks()
      .forEach(track =>
        track.stop()
      );
    localAudioStream = null;
  }
  microphoneOn = false;
  currentRoom = null;
  hide("roomPage");
  show("mainApp");
  openPage("homePage");
  await loadRooms();
}
/* =====================================================
   SUPPORT
   ===================================================== */
function openSupport() {
  openPage("helpPage");
}
/* =====================================================
   SEARCH
   ===================================================== */
let cachedRooms = [];
/* =====================================================
   SAFE HTML
   ===================================================== */
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
/* =====================================================
   EVENTS
   ===================================================== */
document.addEventListener(
  "click",
  async event => {
    const target =
      event.target.closest(
        "button"
      );
    if (!target) return;
    if (
      target.id ===
      "showRegisterBtn"
    ) {
      showRegister();
      return;
    }
    if (
      target.id ===
      "showLoginBtn"
    ) {
      showLogin();
      return;
    }
    if (
      target.id ===
      "loginBtn"
    ) {
      await login();
      return;
    }
    if (
      target.id ===
      "registerBtn"
    ) {
      await register();
      return;
    }
    if (
      target.id ===
      "logoutBtn"
    ) {
      await logout();
      return;
    }
    if (
      target.id ===
      "createRoomBtn" ||
      target.id ===
      "bottomCreateRoomBtn"
    ) {
      openCreateRoom();
      return;
    }
    if (
      target.id ===
      "closeCreateRoomBtn"
    ) {
      closeCreateRoom();
      return;
    }
    if (
      target.id ===
      "saveRoomBtn"
    ) {
      await createRoom();
      return;
    }
    if (
      target.id ===
      "leaveRoomBtn"
    ) {
      await leaveRoom();
      return;
    }
    if (
      target.id ===
      "sendRoomMessageBtn"
    ) {
      await sendMessage();
      return;
    }
    if (
      target.id ===
      "openSupportBtn"
    ) {
      openSupport();
      return;
    }
    if (
      target.dataset.joinRoom
    ) {
      await openRoom(
        Number(
          target.dataset.joinRoom
        )
      );
      return;
    }
    if (
      target.dataset.joinSeat
    ) {
      await joinSeat(
        Number(
          target.dataset.joinSeat
        )
      );
      return;
    }
    if (
      target.dataset.leaveSeat
    ) {
      await leaveSeat(
        Number(
          target.dataset.leaveSeat
        )
      );
      return;
    }
    if (
      target.dataset.action ===
      "mic"
    ) {
      await startMicrophone();
      return;
    }
    if (
      target.dataset.reaction
    ) {
      await sendReaction(
        target.dataset.reaction
      );
      return;
    }
    if (
      target.dataset.page
    ) {
      openPage(
        target.dataset.page
      );
      return;
    }
  }
);
/* =====================================================
   CHAT ENTER KEY
   ===================================================== */
$("roomMessageInput")
  ?.addEventListener(
    "keydown",
    async event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        await sendMessage();
      }
    }
  );
/* =====================================================
   SEARCH
   ===================================================== */
$("roomSearch")
  ?.addEventListener(
    "input",
    async () => {
      await loadRooms();
    }
  );
/* =====================================================
   INIT
   ===================================================== */
async function init() {
  if (!token) {
    show("authScreen");
    hide("mainApp");
    hide("roomPage");
    showLogin();
    return;
  }
  try {
    await openApp();
  } catch {
    token = null;
    localStorage.removeItem(
      "rahul_live_token"
    );
    show("authScreen");
    hide("mainApp");
    hide("roomPage");
    showLogin();
  }
}
init();