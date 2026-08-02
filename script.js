"use strict";
/* =========================================================
   RAHUL LIVE
   Cloudflare Worker + D1 Connected Frontend
   ========================================================= */
const API_BASE =
  "https://rahulsocialhub-db.09rcrg.workers.dev";
let state = {
  token: localStorage.getItem("rahulLiveToken") || "",
  user: null,
  roomId: null,
  isHost: false,
  joined: false,
  muted: false,
  blocked: false,
  pollTimer: null
};
/* =========================================================
   ELEMENTS
   ========================================================= */
const authScreen = document.getElementById("authScreen");
const liveApp = document.getElementById("liveApp");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const showRegisterBtn =
  document.getElementById("showRegisterBtn");
const showLoginBtn =
  document.getElementById("showLoginBtn");
const authMessage =
  document.getElementById("authMessage");
const logoutBtn =
  document.getElementById("logoutBtn");
const onlineStatus =
  document.getElementById("onlineStatus");
const liveTitle =
  document.getElementById("liveTitle");
const viewerCount =
  document.getElementById("viewerCount");
const viewerTotal =
  document.getElementById("viewerTotal");
const chatUserCount =
  document.getElementById("chatUserCount");
const hostName =
  document.getElementById("hostName");
const hostAvatar =
  document.getElementById("hostAvatar");
const chatMessages =
  document.getElementById("chatMessages");
const viewerList =
  document.getElementById("viewerList");
const emojiBtn =
  document.getElementById("emojiBtn");
const emojiPanel =
  document.getElementById("emojiPanel");
const chatInput =
  document.getElementById("chatInput");
const sendChatBtn =
  document.getElementById("sendChatBtn");
const joinLiveBtn =
  document.getElementById("joinLiveBtn");
const leaveLiveBtn =
  document.getElementById("leaveLiveBtn");
const hostControls =
  document.getElementById("hostControls");
const muteBtn =
  document.getElementById("muteBtn");
const kickBtn =
  document.getElementById("kickBtn");
const blockBtn =
  document.getElementById("blockBtn");
const endLiveBtn =
  document.getElementById("endLiveBtn");
const toast =
  document.getElementById("toast");
/* =========================================================
   HELPERS
   ========================================================= */
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(window.rahulToastTimer);
  window.rahulToastTimer =
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
}
function showAuthMessage(message, type = "") {
  if (!authMessage) return;
  authMessage.textContent = message;
  if (type === "error") {
    authMessage.style.color = "#d00000";
  } else if (type === "success") {
    authMessage.style.color = "#168a36";
  } else {
    authMessage.style.color = "";
  }
}
function initialLetter(name) {
  if (!name) return "R";
  return name
    .trim()
    .charAt(0)
    .toUpperCase();
}
function setOnline(online) {
  if (!onlineStatus) return;
  if (online) {
    onlineStatus.textContent = "● Online";
  } else {
    onlineStatus.textContent = "● Offline";
  }
}
function authHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };
  if (state.token) {
    headers.Authorization =
      `Bearer ${state.token}`;
  }
  return headers;
}
/* =========================================================
   API REQUEST
   ========================================================= */
async function api(path, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  };
  if (options.body !== undefined) {
    config.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }
  try {
    const response =
      await fetch(
        API_BASE + path,
        config
      );
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      const error =
        data.error ||
        data.message ||
        `Request failed (${response.status})`;
      throw new Error(error);
    }
    return data;
  } catch (error) {
    setOnline(false);
    throw error;
  }
}
/* =========================================================
   AUTH SCREEN
   ========================================================= */
function showLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showAuthMessage("");
}
function showRegister() {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  showAuthMessage("");
}
/* =========================================================
   REGISTER
   ========================================================= */
async function registerUser() {
  const username =
    registerUsername.value.trim();
  const email =
    registerEmail.value.trim();
  const password =
    registerPassword.value;
  if (!username || !email || !password) {
    showAuthMessage(
      "सभी जानकारी भरें।",
      "error"
    );
    return;
  }
  if (username.length < 3) {
    showAuthMessage(
      "Username कम से कम 3 अक्षर का होना चाहिए।",
      "error"
    );
    return;
  }
  if (password.length < 6) {
    showAuthMessage(
      "Password कम से कम 6 अक्षर का होना चाहिए।",
      "error"
    );
    return;
  }
  registerBtn.disabled = true;
  registerBtn.textContent = "Registering...";
  try {
    const data =
      await api(
        "/api/register",
        {
          method: "POST",
          body: {
            username,
            email,
            password
          }
        }
      );
    showAuthMessage(
      data.message ||
      "Registration सफल हुआ। अब Login करें।",
      "success"
    );
    registerPassword.value = "";
    loginUsername.value = username;
    setTimeout(() => {
      showLogin();
    }, 700);
  } catch (error) {
    showAuthMessage(
      error.message,
      "error"
    );
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
}
/* =========================================================
   LOGIN
   ========================================================= */
async function loginUser() {
  const username =
    loginUsername.value.trim();
  const password =
    loginPassword.value;
  if (!username || !password) {
    showAuthMessage(
      "Username और Password भरें।",
      "error"
    );
    return;
  }
  loginBtn.disabled = true;
  loginBtn.textContent = "Login...";
  try {
    const data =
      await api(
        "/api/login",
        {
          method: "POST",
          body: {
            username,
            password
          }
        }
      );
    if (!data.token) {
      throw new Error(
        "Login token नहीं मिला।"
      );
    }
    state.token =
      data.token;
    state.user =
      data.user;
    state.isHost =
      data.user.role === "host" ||
      data.user.role === "admin";
    localStorage.setItem(
      "rahulLiveToken",
      state.token
    );
    showLiveApp();
    showToast(
      `Welcome ${data.user.username} 👋`
    );
    await loadLiveRooms();
  } catch (error) {
    showAuthMessage(
      error.message,
      "error"
    );
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}
/* =========================================================
   SESSION RESTORE
   ========================================================= */
async function restoreSession() {
  if (!state.token) {
    showLogin();
    return;
  }
  try {
    const data =
      await api("/api/me");
    state.user =
      data.user;
    state.isHost =
      data.user.role === "host" ||
      data.user.role === "admin";
    showLiveApp();
    await loadLiveRooms();
  } catch {
    clearSession();
    showLogin();
  }
}
/* =========================================================
   SHOW LIVE APP
   ========================================================= */
function showLiveApp() {
  authScreen.classList.add("hidden");
  liveApp.classList.remove("hidden");
  setOnline(true);
  if (state.user) {
    hostName.textContent =
      state.user.username;
    hostAvatar.textContent =
      initialLetter(
        state.user.username
      );
  }
  updateHostControls();
  updateButtons();
}
/* =========================================================
   CLEAR SESSION
   ========================================================= */
function clearSession() {
  state.token = "";
  state.user = null;
  state.roomId = null;
  state.joined = false;
  state.isHost = false;
  state.muted = false;
  state.blocked = false;
  localStorage.removeItem(
    "rahulLiveToken"
  );
  stopPolling();
}
/* =========================================================
   LOGOUT
   ========================================================= */
async function logoutUser() {
  if (state.joined && state.roomId) {
    try {
      await api(
        "/api/live/leave",
        {
          method: "POST",
          body: {
            roomId: state.roomId
          }
        }
      );
    } catch {}
  }
  clearSession();
  liveApp.classList.add("hidden");
  authScreen.classList.remove("hidden");
  loginPassword.value = "";
  showLogin();
  showToast("Logout हो गया।");
}
/* =========================================================
   LOAD LIVE ROOMS
   ========================================================= */
async function loadLiveRooms() {
  try {
    const data =
      await api(
        "/api/live/rooms"
      );
    setOnline(true);
    if (
      data.rooms &&
      data.rooms.length > 0
    ) {
      const room =
        data.rooms[0];
      state.roomId =
        Number(room.id);
      liveTitle.textContent =
        room.title ||
        "Chat LIVE Room";
      hostName.textContent =
        room.host_name ||
        "Host";
      hostAvatar.textContent =
        initialLetter(
          room.host_name ||
          "Host"
        );
      viewerCount.textContent =
        room.viewer_count || 0;
      updateButtons();
      return room;
    }
    state.roomId = null;
    viewerCount.textContent = "0";
    liveTitle.textContent =
      "Chat LIVE Room";
    hostName.textContent =
      "No LIVE";
    hostAvatar.textContent =
      "H";
    updateButtons();
    return null;
  } catch (error) {
    showToast(
      "LIVE rooms load नहीं हो सके।"
    );
    return null;
  }
}
/* =========================================================
   JOIN / START LIVE
   ========================================================= */
async function joinLive() {
  if (!state.user) {
    showToast(
      "पहले Login करें।"
    );
    return;
  }
  if (state.joined) {
    showToast(
      "आप पहले से LIVE में हैं।"
    );
    return;
  }
  joinLiveBtn.disabled = true;
  joinLiveBtn.textContent =
    "Connecting...";
  try {
    let room =
      await loadLiveRooms();
    /*
      अगर कोई LIVE नहीं है,
      तो पहला user नया LIVE शुरू करेगा।
    */
    if (!room) {
      const startData =
        await api(
          "/api/live/start",
          {
            method: "POST",
            body: {
              title:
                "Chat LIVE Room"
            }
          }
        );
      state.roomId =
        Number(startData.roomId);
      state.isHost = true;
      liveTitle.textContent =
        startData.title ||
        "Chat LIVE Room";
      hostName.textContent =
        state.user.username;
      hostAvatar.textContent =
        initialLetter(
          state.user.username
        );
      updateHostControls();
    } else {
      state.roomId =
        Number(room.id);
      /*
        अगर room का host current user है,
        तो current user Host है।
      */
      if (
        Number(room.host_id) ===
        Number(state.user.id)
      ) {
        state.isHost = true;
      }
    }
    await api(
      "/api/live/join",
      {
        method: "POST",
        body: {
          roomId: state.roomId
        }
      }
    );
    state.joined = true;
    state.muted = false;
    state.blocked = false;
    addSystemMessage(
      `${state.user.username} LIVE में join हुए 👋`
    );
    updateButtons();
    updateHostControls();
    showToast(
      state.isHost
        ? "आप LIVE Host हैं 🔴"
        : "आप LIVE में join हो गए 🔴"
    );
    await refreshLive();
    startPolling();
  } catch (error) {
    showToast(
      error.message
    );
  } finally {
    joinLiveBtn.disabled = false;
    updateButtons();
  }
}
/* =========================================================
   LEAVE LIVE
   ========================================================= */
async function leaveLive() {
  if (!state.roomId) {
    showToast(
      "आप किसी LIVE में नहीं हैं।"
    );
    return;
  }
  try {
    await api(
      "/api/live/leave",
      {
        method: "POST",
        body: {
          roomId: state.roomId
        }
      }
    );
    addSystemMessage(
      `${state.user.username} LIVE से चले गए।`
    );
  } catch (error) {
    showToast(
      error.message
    );
  } finally {
    state.joined = false;
    state.roomId = null;
    state.isHost = false;
    state.muted = false;
    state.blocked = false;
    stopPolling();
    viewerList.innerHTML = "";
    viewerCount.textContent = "0";
    viewerTotal.textContent = "0";
    chatUserCount.textContent = "0 viewers";
    updateButtons();
    updateHostControls();
    showToast(
      "आप LIVE से बाहर आ गए।"
    );
  }
}
/* =========================================================
   REFRESH LIVE
   ========================================================= */
async function refreshLive() {
  if (!state.roomId) return;
  try {
    await Promise.all([
      loadViewers(),
      loadMessages()
    ]);
    setOnline(true);
  } catch (error) {
    setOnline(false);
  }
}
/* =========================================================
   POLLING
   ========================================================= */
function startPolling() {
  stopPolling();
  state.pollTimer =
    setInterval(
      refreshLive,
      3000
    );
}
function stopPolling() {
  if (state.pollTimer) {
    clearInterval(
      state.pollTimer
    );
    state.pollTimer = null;
  }
}
/* =========================================================
   VIEWERS
   ========================================================= */
async function loadViewers() {
  if (!state.roomId) return;
  const data =
    await api(
      `/api/live/viewers?roomId=${encodeURIComponent(
        state.roomId
      )}`
    );
  const viewers =
    data.viewers || [];
  viewerList.innerHTML = "";
  viewers.forEach(viewer => {
    const item =
      document.createElement("div");
    item.className =
      "viewer-item";
    const avatar =
      document.createElement("div");
    avatar.className =
      "viewer-avatar";
    avatar.textContent =
      initialLetter(
        viewer.username
      );
    const name =
      document.createElement("div");
    name.className =
      "viewer-name";
    name.textContent =
      viewer.username;
    if (
      Number(viewer.id) ===
      Number(state.user?.id)
    ) {
      name.textContent +=
        " (You)";
    }
    item.appendChild(avatar);
    item.appendChild(name);
    viewerList.appendChild(item);
  });
  const count =
    viewers.length;
  viewerCount.textContent =
    count;
  viewerTotal.textContent =
    count;
  chatUserCount.textContent =
    `${count} viewer${count === 1 ? "" : "s"}`;
}
/* =========================================================
   CHAT
   ========================================================= */
async function loadMessages() {
  if (!state.roomId) return;
  const data =
    await api(
      `/api/live/messages?roomId=${encodeURIComponent(
        state.roomId
      )}&limit=100`
    );
  const messages =
    data.messages || [];
  chatMessages.innerHTML = "";
  if (!messages.length) {
    addSystemMessage(
      "LIVE room में आपका स्वागत है 👋"
    );
    return;
  }
  messages.forEach(message => {
    if (
      message.message_type ===
      "system"
    ) {
      addSystemMessage(
        message.message
      );
      return;
    }
    addChatMessage(
      message.username,
      message.message,
      Number(message.user_id) ===
      Number(state.user?.id)
    );
  });
  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}
async function sendMessage() {
  if (!state.joined) {
    showToast(
      "पहले LIVE में Join करें।"
    );
    return;
  }
  if (state.muted) {
    showToast(
      "आपको Host ने mute किया है।"
    );
    return;
  }
  if (state.blocked) {
    showToast(
      "आप blocked हैं।"
    );
    return;
  }
  const text =
    chatInput.value.trim();
  if (!text) return;
  if (text.length > 500) {
    showToast(
      "Message बहुत लंबा है।"
    );
    return;
  }
  sendChatBtn.disabled = true;
  try {
    await api(
      "/api/live/message",
      {
        method: "POST",
        body: {
          roomId:
            state.roomId,
          message:
            text,
          messageType:
            "text"
        }
      }
    );
    chatInput.value = "";
    await loadMessages();
  } catch (error) {
    showToast(
      error.message
    );
    /*
      Worker से mute/block response मिलने पर
      local state भी update कर देते हैं।
    */
    if (
      error.message
        .toLowerCase()
        .includes("mute")
    ) {
      state.muted = true;
    }
    if (
      error.message
        .toLowerCase()
        .includes("block")
    ) {
      state.blocked = true;
    }
  } finally {
    sendChatBtn.disabled = false;
  }
}
/* =========================================================
   CHAT UI
   ========================================================= */
function addChatMessage(
  username,
  text,
  mine = false
) {
  const message =
    document.createElement("div");
  message.className =
    `chat-message${mine ? " mine" : ""}`;
  const usernameElement =
    document.createElement("div");
  usernameElement.className =
    "chat-username";
  usernameElement.textContent =
    username;
  const textElement =
    document.createElement("div");
  textElement.className =
    "chat-text";
  textElement.textContent =
    text;
  message.appendChild(
    usernameElement
  );
  message.appendChild(
    textElement
  );
  chatMessages.appendChild(
    message
  );
}
function addSystemMessage(text) {
  const message =
    document.createElement("div");
  message.className =
    "system-message";
  message.textContent =
    text;
  chatMessages.appendChild(
    message
  );
}
/* =========================================================
   EMOJI
   ========================================================= */
function toggleEmojiPanel() {
  emojiPanel.classList.toggle(
    "hidden"
  );
}
function insertEmoji(emoji) {
  chatInput.value += emoji;
  chatInput.focus();
}
async function sendReaction(emoji) {
  if (!state.joined) {
    showToast(
      "पहले LIVE में Join करें।"
    );
    return;
  }
  if (state.muted) {
    showToast(
      "आप muted हैं।"
    );
    return;
  }
  try {
    await api(
      "/api/live/message",
      {
        method: "POST",
        body: {
          roomId:
            state.roomId,
          message:
            emoji,
          messageType:
            "reaction"
        }
      }
    );
    await loadMessages();
  } catch (error) {
    showToast(
      error.message
    );
  }
}
/* =========================================================
   HOST CONTROLS
   ========================================================= */
function updateHostControls() {
  if (!hostControls) return;
  if (
    state.isHost &&
    state.joined
  ) {
    hostControls.classList.remove(
      "hidden"
    );
  } else {
    hostControls.classList.add(
      "hidden"
    );
  }
}
function getTargetViewer() {
  const items =
    viewerList.querySelectorAll(
      ".viewer-item"
    );
  /*
    API से actual viewer ID चाहिए।
    इसलिए viewer list को दोबारा API से
    पढ़ेंगे।
  */
  return api(
    `/api/live/viewers?roomId=${encodeURIComponent(
      state.roomId
    )}`
  )
  .then(data => {
    const viewers =
      data.viewers || [];
    return viewers.find(
      viewer =>
        Number(viewer.id) !==
        Number(state.user?.id)
    ) || null;
  });
}
/* =========================================================
   MODERATION
   ========================================================= */
async function moderate(action) {
  if (!state.isHost) {
    showToast(
      "सिर्फ Host यह action कर सकता है।"
    );
    return;
  }
  if (!state.roomId) {
    showToast(
      "LIVE room नहीं मिला।"
    );
    return;
  }
  try {
    const target =
      await getTargetViewer();
    if (!target) {
      showToast(
        "कोई दूसरा viewer मौजूद नहीं है।"
      );
      return;
    }
    await api(
      "/api/live/moderate",
      {
        method: "POST",
        body: {
          roomId:
            state.roomId,
          targetUserId:
            target.id,
          action
        }
      }
    );
    if (action === "kick") {
      addSystemMessage(
        `${target.username} को LIVE से kick किया गया 👢`
      );
    } else if (action === "block") {
      addSystemMessage(
        `${target.username} को block किया गया 🚫`
      );
    } else if (action === "mute") {
      addSystemMessage(
        `${target.username} को mute किया गया 🔇`
      );
    }
    await refreshLive();
    showToast(
      `${target.username}: ${action}`
    );
  } catch (error) {
    showToast(
      error.message
    );
  }
}
async function muteViewer() {
  await moderate("mute");
}
async function kickViewer() {
  await moderate("kick");
}
async function blockViewer() {
  await moderate("block");
}
/* =========================================================
   END LIVE
   ========================================================= */
async function endLive() {
  if (!state.isHost) {
    showToast(
      "सिर्फ Host LIVE समाप्त कर सकता है।"
    );
    return;
  }
  if (!state.roomId) {
    showToast(
      "LIVE room नहीं मिला।"
    );
    return;
  }
  const confirmed =
    window.confirm(
      "क्या आप LIVE समाप्त करना चाहते हैं?"
    );
  if (!confirmed) return;
  try {
    await api(
      "/api/live/end",
      {
        method: "POST",
        body: {
          roomId:
            state.roomId
        }
      }
    );
    addSystemMessage(
      "🛑 Host ने LIVE समाप्त कर दिया।"
    );
    state.joined = false;
    state.roomId = null;
    state.isHost = false;
    stopPolling();
    viewerList.innerHTML = "";
    viewerCount.textContent = "0";
    viewerTotal.textContent = "0";
    chatUserCount.textContent = "0 viewers";
    updateButtons();
    updateHostControls();
    showToast(
      "LIVE समाप्त हो गया।"
    );
  } catch (error) {
    showToast(
      error.message
    );
  }
}
/* =========================================================
   BUTTON STATES
   ========================================================= */
function updateButtons() {
  if (state.joined) {
    joinLiveBtn.disabled = true;
    joinLiveBtn.textContent =
      "🔴 LIVE में Joined";
    leaveLiveBtn.disabled = false;
  } else {
    joinLiveBtn.disabled = false;
    joinLiveBtn.textContent =
      "🔴 Join LIVE";
    leaveLiveBtn.disabled = true;
  }
}
/* =========================================================
   EMOJI BUTTONS
   ========================================================= */
function setupEmojiButtons() {
  document
    .querySelectorAll(
      "[data-emoji]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          insertEmoji(
            button.getAttribute(
              "data-emoji"
            )
          );
        }
      );
    });
}
/* =========================================================
   QUICK REACTIONS
   ========================================================= */
function setupReactionButtons() {
  document
    .querySelectorAll(
      "[data-reaction]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          sendReaction(
            button.getAttribute(
              "data-reaction"
            )
          );
        }
      );
    });
}
/* =========================================================
   KEYBOARD
   ========================================================= */
function setupKeyboard() {
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
/* =========================================================
   EVENTS
   ========================================================= */
showRegisterBtn.addEventListener(
  "click",
  showRegister
);
showLoginBtn.addEventListener(
  "click",
  showLogin
);
registerBtn.addEventListener(
  "click",
  registerUser
);
loginBtn.addEventListener(
  "click",
  loginUser
);
logoutBtn.addEventListener(
  "click",
  logoutUser
);
joinLiveBtn.addEventListener(
  "click",
  joinLive
);
leaveLiveBtn.addEventListener(
  "click",
  leaveLive
);
emojiBtn.addEventListener(
  "click",
  toggleEmojiPanel
);
sendChatBtn.addEventListener(
  "click",
  sendMessage
);
muteBtn.addEventListener(
  "click",
  muteViewer
);
kickBtn.addEventListener(
  "click",
  kickViewer
);
blockBtn.addEventListener(
  "click",
  blockViewer
);
endLiveBtn.addEventListener(
  "click",
  endLive
);
/* =========================================================
   CLOSE EMOJI PANEL OUTSIDE
   ========================================================= */
document.addEventListener(
  "click",
  event => {
    if (
      emojiPanel.classList.contains(
        "hidden"
      )
    ) {
      return;
    }
    if (
      event.target === emojiBtn ||
      emojiPanel.contains(
        event.target
      )
    ) {
      return;
    }
    emojiPanel.classList.add(
      "hidden"
    );
  }
);
/* =========================================================
   START
   ========================================================= */
setupEmojiButtons();
setupReactionButtons();
setupKeyboard();
updateButtons();
restoreSession();