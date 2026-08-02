/* =========================================================
   RAHUL LIVE
   Frontend Controller
   ========================================================= */
"use strict";
/* =========================
   STATE
========================= */
const state = {
  loggedIn: false,
  username: "",
  email: "",
  isHost: false,
  joinedLive: false,
  mutedUsers: new Set(),
  blockedUsers: new Set(),
  kickedUsers: new Set(),
  viewers: [],
  messages: []
};
/* =========================
   ELEMENTS
========================= */
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
const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");
const hostName = document.getElementById("hostName");
const hostAvatar = document.getElementById("hostAvatar");
const viewerCount = document.getElementById("viewerCount");
const viewerTotal = document.getElementById("viewerTotal");
const chatUserCount = document.getElementById("chatUserCount");
const viewerList = document.getElementById("viewerList");
const chatMessages = document.getElementById("chatMessages");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPanel = document.getElementById("emojiPanel");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const joinLiveBtn = document.getElementById("joinLiveBtn");
const leaveLiveBtn = document.getElementById("leaveLiveBtn");
const hostControls = document.getElementById("hostControls");
const muteBtn = document.getElementById("muteBtn");
const kickBtn = document.getElementById("kickBtn");
const blockBtn = document.getElementById("blockBtn");
const endLiveBtn = document.getElementById("endLiveBtn");
const toast = document.getElementById("toast");
/* =========================
   HELPERS
========================= */
function showMessage(message, type = "normal") {
  if (!authMessage) return;
  authMessage.textContent = message;
  if (type === "error") {
    authMessage.style.color = "#d00000";
  } else if (type === "success") {
    authMessage.style.color = "#168a36";
  } else {
    authMessage.style.color = "#777777";
  }
}
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}
function getInitial(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}
function cleanText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function saveSession() {
  localStorage.setItem(
    "rahulLiveSession",
    JSON.stringify({
      username: state.username,
      email: state.email,
      isHost: state.isHost
    })
  );
}
function removeSession() {
  localStorage.removeItem("rahulLiveSession");
}
/* =========================
   AUTH SCREEN
========================= */
function showLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showMessage("");
}
function showRegister() {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  showMessage("");
}
/* =========================
   REGISTER
========================= */
function registerUser() {
  const username = registerUsername.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;
  if (!username || !email || !password) {
    showMessage("सभी जानकारी भरें।", "error");
    return;
  }
  if (username.length < 3) {
    showMessage("Username कम से कम 3 अक्षर का होना चाहिए।", "error");
    return;
  }
  if (password.length < 6) {
    showMessage("Password कम से कम 6 अक्षर का होना चाहिए।", "error");
    return;
  }
  const users = JSON.parse(
    localStorage.getItem("rahulLiveUsers") || "[]"
  );
  const alreadyExists = users.some(
    user =>
      user.username.toLowerCase() === username.toLowerCase() ||
      user.email.toLowerCase() === email.toLowerCase()
  );
  if (alreadyExists) {
    showMessage("Username या Email पहले से मौजूद है।", "error");
    return;
  }
  users.push({
    username,
    email,
    password
  });
  localStorage.setItem(
    "rahulLiveUsers",
    JSON.stringify(users)
  );
  registerPassword.value = "";
  showLogin();
  loginUsername.value = username;
  showMessage(
    "Registration सफल हुआ। अब Login करें।",
    "success"
  );
}
/* =========================
   LOGIN
========================= */
function loginUser() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  if (!username || !password) {
    showMessage("Username और Password भरें।", "error");
    return;
  }
  const users = JSON.parse(
    localStorage.getItem("rahulLiveUsers") || "[]"
  );
  const user = users.find(
    item =>
      item.username.toLowerCase() === username.toLowerCase() &&
      item.password === password
  );
  if (!user) {
    showMessage(
      "Username या Password गलत है।",
      "error"
    );
    return;
  }
  state.loggedIn = true;
  state.username = user.username;
  state.email = user.email;
  /*
    Demo में username "host" या "admin" को Host बनाया गया है।
    बाद में Worker/D1 से actual role आएगा।
  */
  state.isHost =
    user.username.toLowerCase() === "host" ||
    user.username.toLowerCase() === "admin";
  saveSession();
  loginPassword.value = "";
  openLiveApp();
}
/* =========================
   OPEN APP
========================= */
function openLiveApp() {
  authScreen.classList.add("hidden");
  liveApp.classList.remove("hidden");
  hostName.textContent = state.username;
  hostAvatar.textContent = getInitial(state.username);
  if (state.isHost) {
    hostControls.classList.remove("hidden");
  } else {
    hostControls.classList.add("hidden");
  }
  renderViewers();
  showToast(
    `Welcome ${state.username} 👋`
  );
}
/* =========================
   LOGOUT
========================= */
function logoutUser() {
  state.loggedIn = false;
  state.joinedLive = false;
  state.isHost = false;
  state.viewers = [];
  state.messages = [];
  removeSession();
  liveApp.classList.add("hidden");
  authScreen.classList.remove("hidden");
  showLogin();
  showToast("Logout हो गया।");
}
/* =========================
   LIVE JOIN
========================= */
function joinLive() {
  if (!state.loggedIn) {
    showToast("पहले Login करें।");
    return;
  }
  if (state.joinedLive) {
    showToast("आप पहले से LIVE में हैं।");
    return;
  }
  state.joinedLive = true;
  const exists = state.viewers.some(
    viewer =>
      viewer.username.toLowerCase() ===
      state.username.toLowerCase()
  );
  if (!exists) {
    state.viewers.push({
      username: state.username,
      muted: false,
      blocked: false
    });
  }
  renderViewers();
  addSystemMessage(
    `${state.username} LIVE में join हुए 👋`
  );
  showToast("आप LIVE में join हो गए।");
}
/* =========================
   LIVE LEAVE
========================= */
function leaveLive() {
  if (!state.joinedLive) {
    showToast("आप LIVE में नहीं हैं।");
    return;
  }
  state.joinedLive = false;
  state.viewers = state.viewers.filter(
    viewer =>
      viewer.username !== state.username
  );
  renderViewers();
  addSystemMessage(
    `${state.username} LIVE से चले गए।`
  );
  showToast("आप LIVE से बाहर आ गए।");
}
/* =========================
   VIEWERS
========================= */
function renderViewers() {
  viewerList.innerHTML = "";
  state.viewers.forEach(viewer => {
    const item = document.createElement("div");
    item.className = "viewer-item";
    const avatar = document.createElement("div");
    avatar.className = "viewer-avatar";
    avatar.textContent = getInitial(viewer.username);
    const name = document.createElement("div");
    name.className = "viewer-name";
    name.textContent = viewer.username;
    if (viewer.username === state.username) {
      name.textContent += " (You)";
    }
    if (viewer.muted) {
      name.textContent += " 🔇";
    }
    if (viewer.blocked) {
      name.textContent += " 🚫";
    }
    item.appendChild(avatar);
    item.appendChild(name);
    viewerList.appendChild(item);
  });
  const count = state.viewers.length;
  viewerCount.textContent = count;
  viewerTotal.textContent = count;
  chatUserCount.textContent =
    `${count} viewer${count === 1 ? "" : "s"}`;
}
/* =========================
   CHAT
========================= */
function sendMessage() {
  if (!state.loggedIn) {
    showToast("पहले Login करें।");
    return;
  }
  if (!state.joinedLive) {
    showToast("पहले LIVE में Join करें।");
    return;
  }
  const text = chatInput.value.trim();
  if (!text) return;
  if (state.blockedUsers.has(state.username)) {
    showToast("आप इस LIVE में blocked हैं।");
    return;
  }
  if (state.mutedUsers.has(state.username)) {
    showToast("आपको Host ने mute किया है।");
    return;
  }
  addChatMessage(
    state.username,
    text,
    true
  );
  chatInput.value = "";
}
function addChatMessage(
  username,
  text,
  mine = false
) {
  const message = document.createElement("div");
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
  message.appendChild(usernameElement);
  message.appendChild(textElement);
  chatMessages.appendChild(message);
  chatMessages.scrollTop =
    chatMessages.scrollHeight;
  state.messages.push({
    username,
    text
  });
}
function addSystemMessage(text) {
  const message =
    document.createElement("div");
  message.className =
    "system-message";
  message.textContent =
    text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}
/* =========================
   EMOJI
========================= */
function toggleEmojiPanel() {
  emojiPanel.classList.toggle("hidden");
}
function insertEmoji(emoji) {
  if (!chatInput) return;
  chatInput.value += emoji;
  chatInput.focus();
}
function sendReaction(emoji) {
  if (!state.loggedIn) {
    showToast("पहले Login करें।");
    return;
  }
  if (!state.joinedLive) {
    showToast("पहले LIVE में Join करें।");
    return;
  }
  if (state.mutedUsers.has(state.username)) {
    showToast("आप muted हैं।");
    return;
  }
  addChatMessage(
    state.username,
    emoji,
    true
  );
  showToast(`Reaction ${emoji}`);
}
/* =========================
   HOST USER SELECTION
========================= */
function getTargetViewer() {
  const available =
    state.viewers.filter(
      viewer =>
        viewer.username !== state.username &&
        !state.kickedUsers.has(viewer.username)
    );
  if (!available.length) {
    showToast("कोई दूसरा viewer मौजूद नहीं है।");
    return null;
  }
  /*
    अभी frontend version में पहला available viewer
    target होगा।
    बाद में viewer selection UI और API जोड़ेंगे।
  */
  return available[0];
}
/* =========================
   MUTE
========================= */
function muteViewer() {
  if (!state.isHost) {
    showToast("सिर्फ Host यह action कर सकता है।");
    return;
  }
  const viewer =
    getTargetViewer();
  if (!viewer) return;
  viewer.muted = true;
  state.mutedUsers.add(
    viewer.username
  );
  renderViewers();
  addSystemMessage(
    `${viewer.username} को Host ने mute किया 🔇`
  );
  showToast(
    `${viewer.username} muted`
  );
}
/* =========================
   KICK
========================= */
function kickViewer() {
  if (!state.isHost) {
    showToast("सिर्फ Host यह action कर सकता है।");
    return;
  }
  const viewer =
    getTargetViewer();
  if (!viewer) return;
  state.kickedUsers.add(
    viewer.username
  );
  state.viewers =
    state.viewers.filter(
      item =>
        item.username !== viewer.username
    );
  renderViewers();
  addSystemMessage(
    `${viewer.username} को LIVE से kick किया गया 👢`
  );
  showToast(
    `${viewer.username} kicked`
  );
}
/* =========================
   BLOCK
========================= */
function blockViewer() {
  if (!state.isHost) {
    showToast("सिर्फ Host यह action कर सकता है।");
    return;
  }
  const viewer =
    getTargetViewer();
  if (!viewer) return;
  state.blockedUsers.add(
    viewer.username
  );
  state.viewers =
    state.viewers.filter(
      item =>
        item.username !== viewer.username
    );
  renderViewers();
  addSystemMessage(
    `${viewer.username} को Host ने block किया 🚫`
  );
  showToast(
    `${viewer.username} blocked`
  );
}
/* =========================
   END LIVE
========================= */
function endLive() {
  if (!state.isHost) {
    showToast("सिर्फ Host LIVE समाप्त कर सकता है।");
    return;
  }
  const confirmed =
    window.confirm(
      "क्या आप LIVE समाप्त करना चाहते हैं?"
    );
  if (!confirmed) return;
  state.joinedLive = false;
  state.viewers = [];
  renderViewers();
  addSystemMessage(
    "🛑 Host ने LIVE समाप्त कर दिया।"
  );
  showToast(
    "LIVE समाप्त हो गया।"
  );
}
/* =========================
   QUICK REACTIONS
========================= */
function setupReactions() {
  const buttons =
    document.querySelectorAll(
      "[data-reaction]"
    );
  buttons.forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const emoji =
          button.getAttribute(
            "data-reaction"
          );
        sendReaction(emoji);
      }
    );
  });
}
/* =========================
   EMOJI BUTTONS
========================= */
function setupEmojiButtons() {
  const buttons =
    document.querySelectorAll(
      "[data-emoji]"
    );
  buttons.forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const emoji =
          button.getAttribute(
            "data-emoji"
          );
        insertEmoji(emoji);
      }
    );
  });
}
/* =========================
   KEYBOARD
========================= */
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
/* =========================
   RESTORE SESSION
========================= */
function restoreSession() {
  const saved =
    localStorage.getItem(
      "rahulLiveSession"
    );
  if (!saved) return;
  try {
    const session =
      JSON.parse(saved);
    if (!session.username) return;
    state.loggedIn = true;
    state.username = session.username;
    state.email = session.email || "";
    state.isHost = Boolean(session.isHost);
    openLiveApp();
  } catch (error) {
    removeSession();
  }
}
/* =========================
   EVENT LISTENERS
========================= */
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
/* =========================
   INITIALIZE
========================= */
setupEmojiButtons();
setupReactions();
setupKeyboard();
restoreSession();