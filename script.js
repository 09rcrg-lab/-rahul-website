document.addEventListener("DOMContentLoaded", () => {

  const $ = (id) => document.getElementById(id);

  /* ================= ELEMENTS ================= */

  const loginScreen = $("loginScreen");
  const registerScreen = $("registerScreen");
  const homeScreen = $("homeScreen");
  const liveRoomScreen = $("liveRoomScreen");

  const giftPanel = $("giftPanel");
  const membersPanel = $("membersPanel");
  const createRoomPanel = $("createRoomPanel");
  const profilePanel = $("profilePanel");

  const toast = $("toast");

  let currentUser = JSON.parse(
    localStorage.getItem("rahulLiveUser") || "null"
  );

  let currentRoom = null;
  let microphoneOn = true;
  let soundOn = true;
  let handRaised = false;

  /* ================= TOAST ================= */

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  /* ================= SCREEN ================= */

  function showScreen(screen) {

    [
      loginScreen,
      registerScreen,
      homeScreen,
      liveRoomScreen
    ].forEach((el) => {
      if (el) el.classList.add("hidden");
    });

    screen.classList.remove("hidden");
  }

  /* ================= LOGIN ================= */

  function loginUser() {

    const username = $("loginUsername").value.trim();
    const password = $("loginPassword").value;

    if (!username || !password) {
      showToast("Username aur password bharo");
      return;
    }

    const savedUser = JSON.parse(
      localStorage.getItem("rahulLiveRegisteredUser") || "null"
    );

    if (
      savedUser &&
      savedUser.username === username &&
      savedUser.password === password
    ) {

      currentUser = {
        username: savedUser.username,
        email: savedUser.email
      };

    } else if (!savedUser) {

      currentUser = {
        username,
        email: `${username}@example.com`
      };

    } else {

      showToast("Username ya password galat hai");
      return;
    }

    localStorage.setItem(
      "rahulLiveUser",
      JSON.stringify(currentUser)
    );

    updateProfile();

    showScreen(homeScreen);

    showToast(`Welcome ${currentUser.username} 👋`);
  }

  $("loginBtn").addEventListener("click", loginUser);

  $("loginPassword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginUser();
  });

  /* ================= REGISTER ================= */

  function registerUser() {

    const username = $("registerUsername").value.trim();
    const email = $("registerEmail").value.trim();
    const password = $("registerPassword").value;

    if (!username || !email || !password) {
      showToast("Sabhi details bharo");
      return;
    }

    if (username.length < 3) {
      showToast("Username kam se kam 3 characters ka ho");
      return;
    }

    if (password.length < 6) {
      showToast("Password kam se kam 6 characters ka ho");
      return;
    }

    const user = {
      username,
      email,
      password
    };

    localStorage.setItem(
      "rahulLiveRegisteredUser",
      JSON.stringify(user)
    );

    currentUser = {
      username,
      email
    };

    localStorage.setItem(
      "rahulLiveUser",
      JSON.stringify(currentUser)
    );

    updateProfile();

    showScreen(homeScreen);

    showToast("Account successfully create ho gaya 🎉");
  }

  $("registerBtn").addEventListener("click", registerUser);

  /* ================= LOGIN / REGISTER SWITCH ================= */

  $("showRegisterBtn").addEventListener("click", () => {
    showScreen(registerScreen);
  });

  $("showLoginBtn").addEventListener("click", () => {
    showScreen(loginScreen);
  });

  /* ================= PROFILE ================= */

  function updateProfile() {

    if (!currentUser) return;

    $("profileUsername").textContent =
      currentUser.username;

    $("profileEmail").textContent =
      currentUser.email;

  }

  /* ================= LOGOUT ================= */

  $("logoutBtn").addEventListener("click", () => {

    currentUser = null;

    localStorage.removeItem("rahulLiveUser");

    closeAllPanels();

    showScreen(loginScreen);

    showToast("Logout successful");
  });

  /* ================= AUTO LOGIN ================= */

  if (currentUser) {

    updateProfile();

    showScreen(homeScreen);

  } else {

    showScreen(loginScreen);

  }

  /* ================= SEARCH ================= */

  $("searchBtn").addEventListener("click", () => {

    $("searchBox").classList.toggle("hidden");

    if (!$("searchBox").classList.contains("hidden")) {
      $("roomSearch").focus();
    }

  });

  $("roomSearch").addEventListener("input", filterRooms);

  function filterRooms() {

    const value =
      $("roomSearch").value
        .trim()
        .toLowerCase();

    document.querySelectorAll(".room-card")
      .forEach((card) => {

        const text =
          card.textContent.toLowerCase();

        card.style.display =
          text.includes(value)
            ? ""
            : "none";

      });
  }

  /* ================= CATEGORIES ================= */

  document.querySelectorAll(".category")
    .forEach((button) => {

      button.addEventListener("click", () => {

        document.querySelectorAll(".category")
          .forEach((b) =>
            b.classList.remove("active")
          );

        button.classList.add("active");

        const category =
          button.dataset.category;

        document.querySelectorAll(".room-card")
          .forEach((card) => {

            if (category === "all") {
              card.style.display = "";
              return;
            }

            card.style.display =
              card.dataset.room === category
                ? ""
                : "none";

          });

      });

    });

  /* ================= JOIN ROOM ================= */

  document.querySelectorAll(".join-room-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const roomId =
          button.dataset.roomId;

        joinRoom(roomId);

      });

    });

  function joinRoom(roomId) {

    const rooms = {

      room001: {
        name: "Music Lovers",
        id: "954032",
        host: "Blake Kim",
        viewers: 1092
      },

      room002: {
        name: "Friends Forever ❤️",
        id: "821745",
        host: "Teresa",
        viewers: 892
      },

      room003: {
        name: "Game Night 🎮",
        id: "665421",
        host: "Harry",
        viewers: 564
      }

    };

    currentRoom =
      rooms[roomId] || rooms.room001;

    $("liveRoomName").textContent =
      currentRoom.name;

    $("liveRoomId").textContent =
      currentRoom.id;

    $("hostName").textContent =
      currentRoom.host;

    $("roomViewerCount").textContent =
      currentRoom.viewers;

    showScreen(liveRoomScreen);

    showToast(
      `${currentRoom.name} mein join ho gaye 🎙️`
    );
  }

  /* ================= LEAVE ROOM ================= */

  $("leaveRoomBtn").addEventListener("click", () => {

    currentRoom = null;

    closeAllPanels();

    showScreen(homeScreen);

  });

  /* ================= CREATE ROOM ================= */

  $("createRoomBtn").addEventListener(
    "click",
    openCreateRoom
  );

  $("bottomCreateRoom").addEventListener(
    "click",
    openCreateRoom
  );

  function openCreateRoom() {

    closeAllPanels();

    createRoomPanel.classList.remove("hidden");

  }

  $("closeCreateRoomBtn").addEventListener(
    "click",
    () => {
      createRoomPanel.classList.add("hidden");
    }
  );

  $("startRoomBtn").addEventListener(
    "click",
    createRoom
  );

  function createRoom() {

    const name =
      $("newRoomName").value.trim();

    const category =
      $("newRoomCategory").value;

    if (!name) {
      showToast("Room ka naam bharo");
      return;
    }

    const roomId =
      "room" + Date.now();

    const newRoom =
      document.createElement("article");

    newRoom.className = "room-card";

    newRoom.dataset.room = category;
    newRoom.dataset.roomId = roomId;

    newRoom.innerHTML = `

      <div class="room-cover room-cover-1">

        <div class="room-top">

          <span class="live-label">
            ● LIVE
          </span>

          <span class="viewer-label">
            👁 1
          </span>

        </div>

        <div class="host-avatar">

          <div class="avatar-frame gold">
            👤
          </div>

          <span class="host-crown">
            👑
          </span>

        </div>

        <h3>${escapeHTML(name)}</h3>

        <p>New live voice room</p>

        <div class="mini-users">

          <span>👤</span>

          <b>+0</b>

        </div>

      </div>

      <div class="room-info">

        <div>

          <strong>
            ${escapeHTML(name)}
          </strong>

          <span>
            Hosted by ${
              escapeHTML(
                currentUser?.username || "You"
              )
            }
          </span>

        </div>

        <button
          class="join-room-btn"
          data-room-id="${roomId}"
        >
          Join
        </button>

      </div>
    `;

    $("roomList").prepend(newRoom);

    newRoom
      .querySelector(".join-room-btn")
      .addEventListener("click", () => {
        joinCreatedRoom(name, roomId);
      });

    $("newRoomName").value = "";

    createRoomPanel.classList.add("hidden");

    showToast("Live room create ho gaya 🎙️");

    joinCreatedRoom(name, roomId);
  }

  function joinCreatedRoom(name, roomId) {

    currentRoom = {
      name,
      id: roomId.substring(4, 10),
      host: currentUser?.username || "You",
      viewers: 1
    };

    $("liveRoomName").textContent =
      name;

    $("liveRoomId").textContent =
      currentRoom.id;

    $("hostName").textContent =
      currentRoom.host;

    $("roomViewerCount").textContent =
      "1";

    showScreen(liveRoomScreen);
  }

  /* ================= CHAT ================= */

  $("sendMessageBtn").addEventListener(
    "click",
    sendMessage
  );

  $("chatInput").addEventListener(
    "keydown",
    (e) => {

      if (e.key === "Enter") {
        sendMessage();
      }

    }
  );

  function sendMessage() {

    const input = $("chatInput");

    const message =
      input.value.trim();

    if (!message) return;

    addChatMessage(
      currentUser?.username || "You",
      "👤",
      message
    );

    input.value = "";
  }

  function addChatMessage(
    username,
    avatar,
    message
  ) {

    const chat =
      $("roomChat");

    const item =
      document.createElement("div");

    item.className =
      "chat-message";

    item.innerHTML = `

      <span class="chat-avatar">
        ${avatar}
      </span>

      <div class="chat-bubble">

        <strong>
          ${escapeHTML(username)}
        </strong>

        <span>
          ${escapeHTML(message)}
        </span>

      </div>
    `;

    chat.appendChild(item);

    while (chat.children.length > 7) {
      chat.removeChild(chat.firstChild);
    }
  }

  /* ================= REACTIONS ================= */

  document.querySelectorAll(
    ".quick-reactions button"
  ).forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        createReaction(
          button.dataset.reaction
        );

      }
    );

  });

  function createReaction(emoji) {

    const area =
      $("reactionArea");

    const reaction =
      document.createElement("span");

    reaction.className =
      "floating-reaction";

    reaction.textContent =
      emoji;

    reaction.style.setProperty(
      "--move",
      `${Math.random() * 80 - 40}px`
    );

    area.appendChild(reaction);

    setTimeout(() => {
      reaction.remove();
    }, 2500);
  }

  /* ================= EMOJI ================= */

  $("emojiBtn").addEventListener(
    "click",
    () => {

      const emojis =
        ["😀","😂","😍","🥰","😘","🔥","❤️","👏"];

      const emoji =
        emojis[
          Math.floor(
            Math.random() * emojis.length
          )
        ];

      $("chatInput").value += emoji;

      $("chatInput").focus();

    }
  );

  /* ================= GIFT ================= */

  $("giftBtn").addEventListener(
    "click",
    () => {

      closeAllPanels();

      giftPanel.classList.remove("hidden");

    }
  );

  $("closeGiftBtn").addEventListener(
    "click",
    () => {
      giftPanel.classList.add("hidden");
    }
  );

  document.querySelectorAll(
    ".gift-item"
  ).forEach((gift) => {

    gift.addEventListener(
      "click",
      () => {

        const emoji =
          gift.dataset.gift;

        const cost =
          gift.dataset.cost;

        giftPanel.classList.add("hidden");

        showGiftAnimation(emoji);

        showToast(
          `${emoji} Gift sent • ${cost} coins`
        );

      }
    );

  });

  function showGiftAnimation(emoji) {

    const animation =
      $("giftAnimation");

    animation.textContent =
      emoji;

    animation.classList.remove("hidden");

    animation.style.animation = "none";

    void animation.offsetWidth;

    animation.style.animation =
      "giftPop 1.2s ease forwards";

    setTimeout(() => {
      animation.classList.add("hidden");
    }, 1200);

  }

  /* ================= MEMBERS ================= */

  $("membersBtn").addEventListener(
    "click",
    () => {

      closeAllPanels();

      membersPanel.classList.remove(
        "hidden"
      );

    }
  );

  $("closeMembersBtn").addEventListener(
    "click",
    () => {
      membersPanel.classList.add("hidden");
    }
  );

  /* ================= MIC ================= */

  $("micBtn").addEventListener(
    "click",
    () => {

      microphoneOn =
        !microphoneOn;

      $("micBtn").innerHTML =
        microphoneOn
          ? "🎤<small>Mic</small>"
          : "🔇<small>Muted</small>";

      showToast(
        microphoneOn
          ? "Microphone ON 🎤"
          : "Microphone OFF 🔇"
      );

    }
  );

  /* ================= SOUND ================= */

  $("muteBtn").addEventListener(
    "click",
    () => {

      soundOn =
        !soundOn;

      $("muteBtn").innerHTML =
        soundOn
          ? "🔊<small>Sound</small>"
          : "🔇<small>Muted</small>";

      showToast(
        soundOn
          ? "Room sound ON"
          : "Room sound OFF"
      );

    }
  );

  /* ================= RAISE HAND ================= */

  $("raiseHandBtn").addEventListener(
    "click",
    () => {

      handRaised =
        !handRaised;

      $("raiseHandBtn").innerHTML =
        handRaised
          ? "✋<small>Raised</small>"
          : "🙋<small>Hand</small>";

      showToast(
        handRaised
          ? "Hand raised 🙋"
          : "Hand lowered"
      );

    }
  );

  /* ================= SHARE ================= */

  $("shareRoomBtn").addEventListener(
    "click",
    async () => {

      const roomName =
        currentRoom?.name ||
        "Rahul Live Room";

      const shareText =
        `Join my live room: ${roomName}`;

      if (
        navigator.share
      ) {

        try {

          await navigator.share({
            title: roomName,
            text: shareText,
            url: location.href
          });

        } catch (error) {}

      } else {

        try {

          await navigator.clipboard.writeText(
            location.href
          );

          showToast(
            "Room link copied 🔗"
          );

        } catch (error) {

          showToast(
            "Room link: " + location.href
          );

        }

      }

    }
  );

  /* ================= ROOM SETTINGS ================= */

  $("roomSettingsBtn").addEventListener(
    "click",
    () => {

      showToast(
        "Room settings coming in next step ⚙️"
      );

    }
  );

  /* ================= PROFILE ================= */

  $("profileBtn").addEventListener(
    "click",
    () => {

      closeAllPanels();

      profilePanel.classList.remove(
        "hidden"
      );

    }
  );

  $("closeProfileBtn").addEventListener(
    "click",
    () => {
      profilePanel.classList.add("hidden");
    }
  );

  /* ================= BOTTOM NAV ================= */

  document.querySelectorAll(
    ".nav-item"
  ).forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const page =
          button.dataset.page;

        if (page === "profile") {

          closeAllPanels();

          profilePanel.classList.remove(
            "hidden"
          );

          return;
        }

        if (page === "rooms") {

          showToast(
            "Live Rooms 🎙️"
          );

          return;
        }

        if (page === "wallet") {

          showToast(
            "Wallet 🪙"
          );

          return;
        }

        showScreen(homeScreen);

      }
    );

  });

  /* ================= REFRESH ================= */

  $("refreshRoomsBtn").addEventListener(
    "click",
    () => {

      const button =
        $("refreshRoomsBtn");

      button.style.transform =
        "rotate(360deg)";

      setTimeout(() => {

        button.style.transform =
          "";

        showToast(
          "Rooms refreshed 🔄"
        );

      }, 500);

    }
  );

  /* ================= NOTIFICATION ================= */

  $("notificationBtn").addEventListener(
    "click",
    () => {

      showToast(
        "No new notifications 🔔"
      );

    }
  );

  /* ================= CLOSE PANELS ================= */

  function closeAllPanels() {

    giftPanel.classList.add("hidden");

    membersPanel.classList.add("hidden");

    createRoomPanel.classList.add(
      "hidden"
    );

    profilePanel.classList.add(
      "hidden"
    );

  }

  /* ================= SECURITY ================= */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }

});