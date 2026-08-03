const API =
  "https://rahulsocialhub-db.09rcrg.workers.dev";
let token =
  localStorage.getItem("rahul_live_token") || "";
let currentUser = null;
let currentRoom = null;
let roomRefreshTimer = null;
let messageRefreshTimer = null;
/* =====================================================
   BASIC HELPERS
   ===================================================== */
function $(id) {
  return document.getElementById(id);
}
function show(element) {
  if (element) {
    element.classList.remove("hidden");
  }
}
function hide(element) {
  if (element) {
    element.classList.add("hidden");
  }
}
function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  show(toast);
  clearTimeout(
    window.__toastTimer
  );
  window.__toastTimer =
    setTimeout(() => {
      hide(toast);
    }, 3000);
}
async function api(
  path,
  options = {}
) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
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
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: "Server response invalid."
    };
  }
  if (
    response.status === 401 &&
    path !== "/api/login"
  ) {
    logout(false);
  }
  if (!response.ok || data.success === false) {
    throw new Error(
      data.message ||
      "Request failed."
    );
  }
  return data;
}
/* =====================================================
   AUTH SCREEN
   ===================================================== */
function showLoginForm() {
  show($("loginForm"));
  hide($("registerForm"));
}
function showRegisterForm() {
  hide($("loginForm"));
  show($("registerForm"));
}
function showMainApp() {
  hide($("authScreen"));
  show($("mainApp"));
  hide($("roomPage"));
  openPage("homePage");
}
function showAuth() {
  show($("authScreen"));
  hide($("mainApp"));
  hide($("roomPage"));
}
/* =====================================================
   REGISTER
   ===================================================== */
async function registerUser() {
  const name =
    $("registerName")?.value.trim();
  const email =
    $("registerEmail")?.value.trim();
  const password =
    $("registerPassword")?.value || "";
  const confirmPassword =
    $("registerPasswordConfirm")?.value || "";
  if (!name) {
    showToast("नाम डालिए।");
    return;
  }
  if (!email) {
    showToast("Email डालिए।");
    return;
  }
  if (password.length < 6) {
    showToast(
      "Password कम से कम 6 characters का होना चाहिए।"
    );
    return;
  }
  if (password !== confirmPassword) {
    showToast(
      "दोनों password समान नहीं हैं।"
    );
    return;
  }
  const button =
    $("registerBtn");
  if (button) {
    button.disabled = true;
    button.textContent =
      "Creating...";
  }
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
    showToast(
      result.message ||
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
    showToast(
      error.message
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        "Create Account";
    }
  }
}
/* =====================================================
   LOGIN
   ===================================================== */
async function loginUser() {
  const email =
    $("loginEmail")?.value.trim();
  const password =
    $("loginPassword")?.value || "";
  if (!email || !password) {
    showToast(
      "Email और password डालिए।"
    );
    return;
  }
  const button =
    $("loginBtn");
  if (button) {
    button.disabled = true;
    button.textContent =
      "Logging in...";
  }
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
    token =
      result.token;
    localStorage.setItem(
      "rahul_live_token",
      token
    );
    currentUser =
      result.user;
    showToast(
      "Login successful."
    );
    showMainApp();
    await loadRooms();
  } catch (error) {
    showToast(
      error.message
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        "Login";
    }
  }
}
/* =====================================================
   SESSION RESTORE
   ===================================================== */
async function restoreSession() {
  if (!token) {
    showAuth();
    return;
  }
  try {
    const result =
      await api(
        "/api/me"
      );
    currentUser =
      result.user;
    showMainApp();
    await loadRooms();
  } catch {
    token = "";
    localStorage.removeItem(
      "rahul_live_token"
    );
    showAuth();
  }
}
/* =====================================================
   LOGOUT
   ===================================================== */
async function logout(
  showMessage = true
) {
  clearRoomTimers();
  try {
    if (token) {
      await api(
        "/api/logout",
        {
          method: "POST"
        }
      );
    }
  } catch {
    // Token may already be expired.
  }
  token = "";
  currentUser = null;
  currentRoom = null;
  localStorage.removeItem(
    "rahul_live_token"
  );
  showAuth();
  if (showMessage) {
    showToast(
      "Logout successful."
    );
  }
}
/* =====================================================
   PAGE NAVIGATION
   ===================================================== */
function closeAllPages() {
  const pages = [
    "homePage",
    "discoverPage",
    "friendsPage",
    "musicPage",
    "profilePage",
    "notificationsPage",
    "helpPage"
  ];
  pages.forEach(
    page => hide($(page))
  );
}
function openPage(pageId) {
  if (pageId === "helpPage") {
    closeAllPages();
    show($("helpPage"));
    document
      .querySelectorAll(".nav-item")
      .forEach(
        button =>
          button.classList.remove("active")
      );
    return;
  }
  closeAllPages();
  show($(pageId));
  document
    .querySelectorAll(".nav-item")
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.page === pageId
        );
      }
    );
  if (pageId === "homePage") {
    loadRooms();
  }
}
/* =====================================================
   ROOMS
   ===================================================== */
async function loadRooms() {
  const container =
    $("roomsContainer");
  if (!container) return;
  try {
    const result =
      await api(
        "/api/rooms"
      );
    renderRooms(
      result.rooms || []
    );
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Rooms load नहीं हुए</h3>
        <p>${escapeHtml(
          error.message
        )}</p>
      </div>
    `;
  }
}
function renderRooms(rooms) {
  const container =
    $("roomsContainer");
  if (!container) return;
  const search =
    $("roomSearch")
      ?.value
      .trim()
      .toLowerCase() || "";
  const filtered =
    rooms.filter(
      room =>
        !search ||
        String(room.name || "")
          .toLowerCase()
          .includes(search) ||
        String(room.owner_name || "")
          .toLowerCase()
          .includes(search)
    );
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>कोई Live Room नहीं मिला</h3>
        <p>आप अपना पहला room बना सकते हैं।</p>
      </div>
    `;
    return;
  }
  container.innerHTML =
    filtered.map(
      room => `
        <article
          class="room-card"
        >
          <div
            class="room-card-content"
          >
            <h3>
              ${escapeHtml(
                room.name
              )}
            </h3>
            <p>
              ${escapeHtml(
                room.description || ""
              )}
            </p>
            <small>
              👤 ${Number(
                room.viewer_count || 0
              )}
              &nbsp; • &nbsp;
              Host:
              ${escapeHtml(
                room.owner_name || ""
              )}
            </small>
            <button
              class="join-room-btn"
              type="button"
              data-room-id="${room.id}"
            >
              Join Room
            </button>
          </div>
        </article>
      `
    )
    .join("");
}
/* =====================================================
   CREATE ROOM
   ===================================================== */
function openCreateRoom() {
  show(
    $("createRoomModal")
  );
}
function closeCreateRoom() {
  hide(
    $("createRoomModal")
  );
}
async function createRoom() {
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
      ?.value || "public";
  if (!name) {
    showToast(
      "Room name डालिए।"
    );
    return;
  }
  const button =
    $("saveRoomBtn");
  if (button) {
    button.disabled = true;
    button.textContent =
      "Creating...";
  }
  try {
    const result =
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
    closeCreateRoom();
    $("roomName").value = "";
    $("roomDescription").value = "";
    showToast(
      "Room successfully बनाया गया।"
    );
    await loadRooms();
    if (result.room_id) {
      await joinRoom(
        result.room_id
      );
    }
  } catch (error) {
    showToast(
      error.message
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        "Create Room";
    }
  }
}
/* =====================================================
   JOIN ROOM
   ===================================================== */
async function joinRoom(
  roomId
) {
  try {
    const result =
      await api(
        `/api/rooms/${roomId}/join`,
        {
          method: "POST"
        }
      );
    currentRoom = {
      id: Number(roomId),
      ...(
        result.room || {}
      )
    };
    hide(
      $("mainApp")
    );
    show(
      $("roomPage")
    );
    const title =
      document.querySelector(
        ".room-title"
      );
    if (title) {
      title.textContent =
        currentRoom.name ||
        "Live Room";
    }
    await loadRoomMessages();
    startRoomRefresh(
      roomId
    );
  } catch (error) {
    showToast(
      error.message
    );
  }
}
/* =====================================================
   LEAVE ROOM
   ===================================================== */
async function leaveRoom() {
  if (!currentRoom) {
    showMainApp();
    return;
  }
  const roomId =
    currentRoom.id;
  clearRoomTimers();
  try {
    await api(
      `/api/rooms/${roomId}/leave`,
      {
        method: "POST"
      }
    );
  } catch (error) {
    showToast(
      error.message
    );
  }
  currentRoom = null;
  showMainApp();
  await loadRooms();
}
/* =====================================================
   ROOM MESSAGES
   ===================================================== */
async function loadRoomMessages() {
  if (!currentRoom) return;
  try {
    const result =
      await api(
        `/api/rooms/${currentRoom.id}/messages`
      );
    renderMessages(
      result.messages || []
    );
  } catch (error) {
    showToast(
      error.message
    );
  }
}
function renderMessages(messages) {
  const box =
    $("roomMessages");
  if (!box) return;
  if (!messages.length) {
    box.innerHTML = `
      <div
        style="
          text-align:center;
          color:#777;
          padding:30px 10px;
        "
      >
        अभी कोई message नहीं है।
      </div>
    `;
    return;
  }
  box.innerHTML =
    messages.map(
      message => `
        <div
          class="chat-message"
        >
          <strong>
            ${escapeHtml(
              message.name ||
              message.username ||
              "User"
            )}
          </strong>
          <span>
            ${escapeHtml(
              message.message
            )}
          </span>
        </div>
      `
    )
    .join("");
  box.scrollTop =
    box.scrollHeight;
}
async function sendRoomMessage() {
  if (!currentRoom) {
    showToast(
      "Room join नहीं हुआ है।"
    );
    return;
  }
  const input =
    $("roomMessageInput");
  const message =
    input?.value
      .trim();
  if (!message) {
    return;
  }
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
    await loadRoomMessages();
  } catch (error) {
    showToast(
      error.message
    );
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}
/* =====================================================
   ROOM AUTO REFRESH
   ===================================================== */
function startRoomRefresh(
  roomId
) {
  clearRoomTimers();
  messageRefreshTimer =
    setInterval(
      () => {
        if (
          currentRoom &&
          currentRoom.id ===
            Number(roomId)
        ) {
          loadRoomMessages();
        }
      },
      2500
    );
  roomRefreshTimer =
    setInterval(
      () => {
        loadRooms();
      },
      10000
    );
}
function clearRoomTimers() {
  if (roomRefreshTimer) {
    clearInterval(
      roomRefreshTimer
    );
  }
  if (messageRefreshTimer) {
    clearInterval(
      messageRefreshTimer
    );
  }
  roomRefreshTimer = null;
  messageRefreshTimer = null;
}
/* =====================================================
   SEARCH
   ===================================================== */
async function searchRooms() {
  await loadRooms();
}
/* =====================================================
   HTML ESCAPE
   ===================================================== */
function escapeHtml(value) {
  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
/* =====================================================
   EVENT LISTENERS
   ===================================================== */
document.addEventListener(
  "DOMContentLoaded",
  () => {
    /* -----------------------------
       AUTH
       ----------------------------- */
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
    $("loginBtn")
      ?.addEventListener(
        "click",
        loginUser
      );
    $("registerBtn")
      ?.addEventListener(
        "click",
        registerUser
      );
    $("logoutBtn")
      ?.addEventListener(
        "click",
        () => logout(true)
      );
    $("loginPassword")
      ?.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter"
          ) {
            loginUser();
          }
        }
      );
    $("registerPasswordConfirm")
      ?.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter"
          ) {
            registerUser();
          }
        }
      );
    /* -----------------------------
       NAVIGATION
       ----------------------------- */
    document
      .querySelectorAll(
        ".nav-item[data-page]"
      )
      .forEach(
        button => {
          button.addEventListener(
            "click",
            () => {
              openPage(
                button.dataset.page
              );
            }
          );
        }
      );
    /* -----------------------------
       CREATE ROOM
       ----------------------------- */
    $("createRoomBtn")
      ?.addEventListener(
        "click",
        openCreateRoom
      );
    $("bottomCreateRoomBtn")
      ?.addEventListener(
        "click",
        openCreateRoom
      );
    $("closeCreateRoomBtn")
      ?.addEventListener(
        "click",
        closeCreateRoom
      );
    $("saveRoomBtn")
      ?.addEventListener(
        "click",
        createRoom
      );
    $("createRoomModal")
      ?.addEventListener(
        "click",
        event => {
          if (
            event.target ===
            $("createRoomModal")
          ) {
            closeCreateRoom();
          }
        }
      );
    /* -----------------------------
       ROOM LIST
       ----------------------------- */
    $("roomsContainer")
      ?.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              ".join-room-btn"
            );
          if (!button) {
            return;
          }
          const roomId =
            Number(
              button.dataset.roomId
            );
          if (roomId) {
            joinRoom(roomId);
          }
        }
      );
    $("roomSearch")
      ?.addEventListener(
        "input",
        searchRooms
      );
    /* -----------------------------
       ROOM
       ----------------------------- */
    $("leaveRoomBtn")
      ?.addEventListener(
        "click",
        leaveRoom
      );
    $("sendRoomMessageBtn")
      ?.addEventListener(
        "click",
        sendRoomMessage
      );
    $("roomMessageInput")
      ?.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter"
          ) {
            event.preventDefault();
            sendRoomMessage();
          }
        }
      );
    /* -----------------------------
       START
       ----------------------------- */
    restoreSession();
  }
);