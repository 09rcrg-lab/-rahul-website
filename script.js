const API = "https://rahulsocialhub-db.09rcrg.workers.dev";

let currentUser = null;
let currentRoom = null;
let chatTimer = null;
let viewerTimer = null;


/* ================= HELPERS ================= */

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
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.remove("hidden");

  setTimeout(() => {
    el.classList.add("hidden");
  }, 2500);
}

async function api(path, options = {}) {

  try {

    const response = await fetch(API + path, {
      headers: {
        "Content-Type": "application/json"
      },
      ...options
    });

    const data = await response.json();

    return data;

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message: "Server से connection नहीं हो पाया"
    };

  }

}


/* ================= AUTH SCREEN ================= */

function showLogin() {
  show("loginForm");
  hide("registerForm");
  $("authMessage").textContent = "";
}

function showRegister() {
  hide("loginForm");
  show("registerForm");
  $("authMessage").textContent = "";
}


/* ================= REGISTER ================= */

async function registerUser() {

  const username =
    $("registerUsername").value.trim();

  const email =
    $("registerEmail").value.trim();

  const password =
    $("registerPassword").value;

  if (!username || !email || !password) {

    $("authMessage").textContent =
      "सभी जानकारी भरें";

    return;
  }

  if (password.length < 4) {

    $("authMessage").textContent =
      "Password कम से कम 4 अक्षर का रखें";

    return;
  }

  $("registerBtn").disabled = true;
  $("registerBtn").textContent = "Registering...";

  const result = await api("/api/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password
    })
  });

  $("registerBtn").disabled = false;
  $("registerBtn").textContent = "Register";

  if (!result.success) {

    $("authMessage").textContent =
      result.message || "Registration failed";

    return;
  }

  $("authMessage").textContent =
    "Registration successful ✅";

  $("registerUsername").value = "";
  $("registerEmail").value = "";
  $("registerPassword").value = "";

  setTimeout(() => {

    $("loginUsername").value = username;

    showLogin();

  }, 700);

}


/* ================= LOGIN ================= */

async function loginUser() {

  const username =
    $("loginUsername").value.trim();

  const password =
    $("loginPassword").value;

  if (!username || !password) {

    $("authMessage").textContent =
      "Username और password भरें";

    return;
  }

  $("loginBtn").disabled = true;
  $("loginBtn").textContent = "Login...";

  const result = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    })
  });

  $("loginBtn").disabled = false;
  $("loginBtn").textContent = "Login";

  if (!result.success) {

    $("authMessage").textContent =
      result.message || "Login failed";

    return;
  }

  currentUser = result.user;

  localStorage.setItem(
    "rahulLiveUser",
    JSON.stringify(currentUser)
  );

  $("authMessage").textContent = "";

  showLiveApp();

}


/* ================= SHOW APP ================= */

function showLiveApp() {

  hide("authScreen");
  show("liveApp");

  if ($("hostName")) {
    $("hostName").textContent =
      currentUser.username;
  }

  if ($("hostAvatar")) {
    $("hostAvatar").textContent =
      currentUser.username
        .charAt(0)
        .toUpperCase();
  }

  toast(
    "Welcome " + currentUser.username + " 👋"
  );

  loadLiveRooms();
}


/* ================= LOGOUT ================= */

function logoutUser() {

  if (currentRoom) {
    leaveLive(false);
  }

  currentUser = null;

  localStorage.removeItem(
    "rahulLiveUser"
  );

  stopTimers();

  hide("liveApp");
  show("authScreen");

  showLogin();

}


/* ================= CREATE LIVE ================= */

async function createLive() {

  if (!currentUser) {

    toast("पहले Login करें");
    return;
  }

  const title =
    prompt(
      "LIVE का नाम लिखें:",
      "Chat LIVE Room"
    );

  if (title === null) return;

  const result = await api(
    "/api/live/create",
    {
      method: "POST",
      body: JSON.stringify({
        host_id: currentUser.id,
        title:
          title.trim() ||
          "Chat LIVE Room"
      })
    }
  );

  if (!result.success) {

    toast(
      result.message ||
      "LIVE शुरू नहीं हुआ"
    );

    return;
  }

  currentRoom = result.room;

  updateRoomUI();

  showHostControls();

  toast("🔴 LIVE शुरू हो गया");

  startLivePolling();

}


/* ================= JOIN LIVE ================= */

async function joinLive(roomId) {

  if (!currentUser) {

    toast("पहले Login करें");
    return;
  }

  const result = await api(
    "/api/live/join",
    {
      method: "POST",
      body: JSON.stringify({
        live_room_id: roomId,
        user_id: currentUser.id
      })
    }
  );

  if (!result.success) {

    toast(
      result.message ||
      "LIVE join नहीं हुआ"
    );

    return;
  }

  const roomResult =
    await api(
      "/api/live/room/" + roomId
    );

  if (!roomResult.success) {

    toast("LIVE room नहीं मिला");
    return;
  }

  currentRoom = roomResult.room;

  updateRoomUI();

  hideHostControls();

  toast("🔴 LIVE joined");

  startLivePolling();

}


/* ================= UPDATE ROOM UI ================= */

function updateRoomUI() {

  if (!currentRoom) return;

  if ($("liveTitle")) {
    $("liveTitle").textContent =
      currentRoom.title ||
      "Chat LIVE Room";
  }

  if ($("hostName")) {
    $("hostName").textContent =
      currentRoom.host_username ||
      currentUser.username;
  }

  if ($("hostAvatar")) {
    $("hostAvatar").textContent =
      (
        currentRoom.host_username ||
        currentUser.username
      )
      .charAt(0)
      .toUpperCase();
  }

  const isHost =
    String(currentRoom.host_id) ===
    String(currentUser.id);

  if (isHost) {
    showHostControls();
  } else {
    hideHostControls();
  }

}


/* ================= HOST CONTROLS ================= */

function showHostControls() {
  show("hostControls");
}

function hideHostControls() {
  hide("hostControls");
}


/* ================= CHAT ================= */

async function sendChat() {

  if (!currentUser) {

    toast("पहले Login करें");
    return;
  }

  if (!currentRoom) {

    toast("पहले LIVE join करें");
    return;
  }

  const input =
    $("chatInput");

  const message =
    input.value.trim();

  if (!message) return;

  const result = await api(
    "/api/live/message",
    {
      method: "POST",
      body: JSON.stringify({
        live_room_id:
          currentRoom.id,

        user_id:
          currentUser.id,

        message
      })
    }
  );

  if (!result.success) {

    toast(
      result.message ||
      "Message नहीं भेजा गया"
    );

    return;
  }

  input.value = "";

  loadMessages();

}


/* ================= LOAD CHAT ================= */

async function loadMessages() {

  if (!currentRoom) return;

  const result =
    await api(
      "/api/live/messages/" +
      currentRoom.id
    );

  if (!result.success) return;

  const container =
    $("chatMessages");

  if (!container) return;

  container.innerHTML = "";

  if (!result.messages.length) {

    container.innerHTML =
      `<div class="system-message">
        LIVE room में आपका स्वागत है 👋
      </div>`;

    return;
  }

  result.messages.forEach(msg => {

    const div =
      document.createElement("div");

    const mine =
      String(msg.user_id) ===
      String(currentUser.id);

    div.className =
      "chat-message" +
      (mine ? " mine" : "");

    const username =
      msg.username ||
      "User";

    div.innerHTML = `
      <div class="chat-username">
        ${escapeHTML(username)}
      </div>

      <div class="chat-text">
        ${escapeHTML(msg.message)}
      </div>
    `;

    container.appendChild(div);

  });

  container.scrollTop =
    container.scrollHeight;

}


/* ================= VIEWERS ================= */

async function loadViewers() {

  if (!currentRoom) return;

  const result =
    await api(
      "/api/live/viewers/" +
      currentRoom.id
    );

  if (!result.success) return;

  const list =
    $("viewerList");

  if (!list) return;

  list.innerHTML = "";

  result.viewers.forEach(viewer => {

    const div =
      document.createElement("div");

    div.className =
      "viewer-item";

    const name =
      viewer.username ||
      "User";

    div.innerHTML = `
      <div class="viewer-avatar">
        ${escapeHTML(
          name.charAt(0).toUpperCase()
        )}
      </div>

      <div class="viewer-name">
        ${escapeHTML(name)}
      </div>
    `;

    list.appendChild(div);

  });

  const count =
    result.viewers.length;

  if ($("viewerCount")) {
    $("viewerCount").textContent =
      count;
  }

  if ($("viewerTotal")) {
    $("viewerTotal").textContent =
      count;
  }

  if ($("chatUserCount")) {
    $("chatUserCount").textContent =
      count + " viewers";
  }

}


/* ================= EMOJI ================= */

function insertEmoji(emoji) {

  const input =
    $("chatInput");

  if (!input) return;

  input.value += emoji;

  input.focus();

}


/* ================= REACTION ================= */

async function sendReaction(emoji) {

  if (!currentUser || !currentRoom) {

    toast("पहले LIVE join करें");
    return;
  }

  createFloatingEmoji(emoji);

  await api(
    "/api/live/reaction",
    {
      method: "POST",
      body: JSON.stringify({
        live_room_id:
          currentRoom.id,

        user_id:
          currentUser.id,

        reaction: emoji
      })
    }
  );

  loadMessages();

}


/* ================= FLOATING EMOJI ================= */

function createFloatingEmoji(emoji) {

  let box =
    $("floatingReactions");

  if (!box) {

    box =
      document.createElement("div");

    box.id =
      "floatingReactions";

    document.body.appendChild(box);

  }

  const item =
    document.createElement("div");

  item.className =
    "floating-reaction";

  item.textContent =
    emoji;

  item.style.right =
    Math.floor(
      Math.random() * 80
    ) + "px";

  box.appendChild(item);

  setTimeout(() => {
    item.remove();
  }, 1900);

}


/* ================= MODERATION ================= */

async function moderateUser(
  targetUserId,
  action
) {

  if (!currentRoom || !currentUser) return;

  const isHost =
    String(currentRoom.host_id) ===
    String(currentUser.id);

  if (!isHost) {

    toast(
      "केवल Host यह action कर सकता है"
    );

    return;
  }

  const result =
    await api(
      "/api/live/moderate",
      {
        method: "POST",
        body: JSON.stringify({
          live_room_id:
            currentRoom.id,

          host_id:
            currentUser.id,

          target_user_id:
            targetUserId,

          action
        })
      }
    );

  toast(
    result.message ||
    "Action complete"
  );

  loadViewers();

}


/* ================= END LIVE ================= */

async function endLive() {

  if (!currentRoom || !currentUser) return;

  const isHost =
    String(currentRoom.host_id) ===
    String(currentUser.id);

  if (!isHost) {

    toast(
      "केवल Host LIVE end कर सकता है"
    );

    return;
  }

  const confirmEnd =
    confirm(
      "क्या आप LIVE समाप्त करना चाहते हैं?"
    );

  if (!confirmEnd) return;

  const result =
    await api(
      "/api/live/end",
      {
        method: "POST",
        body: JSON.stringify({
          live_room_id:
            currentRoom.id,

          host_id:
            currentUser.id
        })
      }
    );

  if (!result.success) {

    toast(
      result.message ||
      "LIVE end नहीं हुआ"
    );

    return;
  }

  toast("LIVE समाप्त हो गया");

  currentRoom = null;

  stopTimers();

  hideHostControls();

  loadLiveRooms();

}


/* ================= LEAVE LIVE ================= */

async function leaveLive(showMessage = true) {

  if (!currentRoom || !currentUser) return;

  await api(
    "/api/live/leave",
    {
      method: "POST",
      body: JSON.stringify({
        live_room_id:
          currentRoom.id,

        user_id:
          currentUser.id
      })
    }
  );

  stopTimers();

  currentRoom = null;

  hideHostControls();

  if (showMessage) {
    toast("LIVE से बाहर आ गए");
  }

  loadLiveRooms();

}


/* ================= LIVE ROOMS ================= */

async function loadLiveRooms() {

  /*
    अभी index.html में अलग room-list नहीं है,
    इसलिए function API को test कर सकता है।
  */

  const result =
    await api(
      "/api/live/rooms"
    );

  console.log(
    "LIVE rooms:",
    result
  );

}


/* ================= POLLING ================= */

function startLivePolling() {

  stopTimers();

  loadMessages();
  loadViewers();

  chatTimer =
    setInterval(
      loadMessages,
      2500
    );

  viewerTimer =
    setInterval(
      loadViewers,
      5000
    );

}

function stopTimers() {

  if (chatTimer) {
    clearInterval(chatTimer);
    chatTimer = null;
  }

  if (viewerTimer) {
    clearInterval(viewerTimer);
    viewerTimer = null;
  }

}


/* ================= ESCAPE HTML ================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ================= EVENTS ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* Login */

    $("loginBtn")?.addEventListener(
      "click",
      loginUser
    );

    /* Register */

    $("registerBtn")?.addEventListener(
      "click",
      registerUser
    );

    /* Switch forms */

    $("showRegisterBtn")?.addEventListener(
      "click",
      showRegister
    );

    $("showLoginBtn")?.addEventListener(
      "click",
      showLogin
    );

    /* Logout */

    $("logoutBtn")?.addEventListener(
      "click",
      logoutUser
    );

    /* Join */

    $("joinLiveBtn")?.addEventListener(
      "click",
      async () => {

        if (!currentRoom) {

          toast(
            "अभी कोई LIVE room selected नहीं है"
          );

          return;
        }

        await joinLive(
          currentRoom.id
        );

      }
    );

    /* Leave */

    $("leaveLiveBtn")?.addEventListener(
      "click",
      () => leaveLive(true)
    );

    /* Send chat */

    $("sendChatBtn")?.addEventListener(
      "click",
      sendChat
    );

    /* Enter key */

    $("chatInput")?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendChat();

        }

      }
    );

    /* Emoji panel */

    $("emojiBtn")?.addEventListener(
      "click",
      () => {

        const panel =
          $("emojiPanel");

        if (!panel) return;

        panel.classList.toggle(
          "hidden"
        );

      }
    );

    /* Emoji buttons */

    document
      .querySelectorAll(
        "[data-emoji]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            insertEmoji(
              button.dataset.emoji
            );

          }
        );

      });

    /* Quick reactions */

    document
      .querySelectorAll(
        "[data-reaction]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            sendReaction(
              button.dataset.reaction
            );

          }
        );

      });

    /* Host mute */

    $("muteBtn")?.addEventListener(
      "click",
      () => {

        const target =
          prompt(
            "Mute करने वाले Viewer की User ID:"
          );

        if (target) {
          moderateUser(
            target,
            "mute"
          );
        }

      }
    );

    /* Host kick */

    $("kickBtn")?.addEventListener(
      "click",
      () => {

        const target =
          prompt(
            "Kick करने वाले Viewer की User ID:"
          );

        if (target) {
          moderateUser(
            target,
            "kick"
          );
        }

      }
    );

    /* Host block */

    $("blockBtn")?.addEventListener(
      "click",
      () => {

        const target =
          prompt(
            "Block करने वाले Viewer की User ID:"
          );

        if (target) {
          moderateUser(
            target,
            "block"
          );
        }

      }
    );

    /* End LIVE */

    $("endLiveBtn")?.addEventListener(
      "click",
      endLive
    );


    /* ================= RESTORE LOGIN ================= */

    const saved =
      localStorage.getItem(
        "rahulLiveUser"
      );

    if (saved) {

      try {

        currentUser =
          JSON.parse(saved);

        showLiveApp();

      } catch {

        localStorage.removeItem(
          "rahulLiveUser"
        );

        showLogin();

      }

    } else {

      showLogin();

    }

  }
);