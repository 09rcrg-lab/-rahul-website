document.addEventListener("DOMContentLoaded", () => {

  const $ = (id) => document.getElementById(id);

  /* =========================
     STATE
  ========================= */

  let currentPage = "roomPage";
  let selectedSeat = null;
  let mySeat = null;

  let user = {
    name: localStorage.getItem("rahul_name") || "Rahul",
    photo: localStorage.getItem("rahul_photo") ||
      "https://i.pravatar.cc/200?img=12"
  };

  let room = {
    id: "874271",
    host: "Rahul",
    viewers: 1
  };

  const seats = {};


  /* =========================
     PAGE NAVIGATION
  ========================= */

  function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("active");
    });

    const page = $(pageId);

    if (page) {
      page.classList.add("active");
      currentPage = pageId;
    }

    window.scrollTo(0, 0);
  }


  document.querySelectorAll("[data-back]").forEach(button => {

    button.addEventListener("click", () => {

      const target = button.dataset.back;

      if (target) {
        showPage(target);
      }

    });

  });


  /* =========================
     USER PROFILE
  ========================= */

  function updateUserProfile() {

    if ($("profileName")) {
      $("profileName").textContent = user.name;
    }

    if ($("roomHostName")) {
      $("roomHostName").textContent = room.host;
    }

    if ($("mainHostName")) {
      $("mainHostName").textContent = room.host;
    }

    if ($("profilePhoto")) {
      $("profilePhoto").src = user.photo;
    }

    if ($("roomHostPhoto")) {
      $("roomHostPhoto").src = user.photo;
    }

    if ($("mainHostPhoto")) {
      $("mainHostPhoto").src = user.photo;
    }

    if ($("chatUserPhoto")) {
      $("chatUserPhoto").src = user.photo;
    }

    if ($("chatUserName")) {
      $("chatUserName").textContent = user.name;
    }
  }

  updateUserProfile();


  /* =========================
     PROFILE PHOTO UPLOAD
  ========================= */

  const photoInput = $("profilePhotoInput");

  if (photoInput) {

    photoInput.addEventListener("change", (event) => {

      const file = event.target.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select an image.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Photo 5MB se chhoti honi chahiye.");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {

        user.photo = reader.result;

        localStorage.setItem(
          "rahul_photo",
          user.photo
        );

        updateUserProfile();

      };

      reader.readAsDataURL(file);

    });

  }


  /* =========================
     PROFILE NAME
  ========================= */

  if ($("profileName")) {

    $("profileName").addEventListener("click", () => {

      const newName =
        prompt("Apna naam enter karo:", user.name);

      if (!newName) return;

      const name = newName.trim();

      if (name.length < 2) {
        alert("Naam bahut chhota hai.");
        return;
      }

      user.name = name;

      localStorage.setItem(
        "rahul_name",
        user.name
      );

      updateUserProfile();

    });

  }


  /* =========================
     ROOM ID
  ========================= */

  if ($("roomId")) {
    $("roomId").textContent = room.id;
  }

  if ($("viewerCount")) {
    $("viewerCount").textContent = room.viewers;
  }


  /* =========================
     VOICE SEATS
  ========================= */

  document.querySelectorAll(".seat").forEach(seat => {

    seat.addEventListener("click", () => {

      const seatNumber =
        Number(seat.dataset.seat);

      if (seat.classList.contains("locked")) {

        showNotice("🔒 Ye seat locked hai.");

        return;
      }

      if (
        mySeat !== null &&
        mySeat !== seatNumber
      ) {

        showNotice(
          "Pehle apni current seat chhodo."
        );

        return;
      }

      selectedSeat = seatNumber;

      $("selectedSeatNumber").textContent =
        seatNumber;

      $("seatModal").classList.add("show");

    });

  });


  /* =========================
     CLOSE SEAT MODAL
  ========================= */

  if ($("closeSeatModal")) {

    $("closeSeatModal").addEventListener(
      "click",
      () => {

        $("seatModal").classList.remove("show");

      }
    );

  }


  /* =========================
     JOIN SEAT
  ========================= */

  if ($("joinSeatBtn")) {

    $("joinSeatBtn").addEventListener(
      "click",
      () => {

        if (!selectedSeat) return;

        occupySeat(selectedSeat);

        $("seatModal").classList.remove("show");

      }
    );

  }


  function occupySeat(number) {

    if (
      mySeat !== null &&
      mySeat !== number
    ) {
      return;
    }

    const seat =
      document.querySelector(
        `.seat[data-seat="${number}"]`
      );

    if (!seat) return;

    seat.classList.remove("empty");
    seat.classList.add("occupied");

    seat.innerHTML = `
      <span class="seat-circle">
        <img src="${escapeHTML(user.photo)}"
             alt="User">
      </span>

      <span class="seat-user-name">
        ${escapeHTML(user.name)}
      </span>

      <span class="mic-status">
        🎙️
      </span>

      <span class="seat-number">
        ${number}
      </span>
    `;

    seats[number] = {
      name: user.name,
      photo: user.photo,
      mic: true
    };

    mySeat = number;

    room.viewers++;

    updateViewerCount();

    showNotice(
      `Seat ${number} par aap baith gaye 🎙️`
    );

  }


  /* =========================
     LEAVE MY SEAT
  ========================= */

  function leaveMySeat() {

    if (mySeat === null) {
      showNotice("Aap kisi seat par nahi ho.");
      return;
    }

    const number = mySeat;

    const seat =
      document.querySelector(
        `.seat[data-seat="${number}"]`
      );

    if (!seat) return;

    seat.classList.remove("occupied");
    seat.classList.add("empty");

    seat.innerHTML = `
      <span class="seat-circle">
        +
      </span>

      <span class="seat-number">
        ${number}
      </span>
    `;

    delete seats[number];

    mySeat = null;

    room.viewers =
      Math.max(1, room.viewers - 1);

    updateViewerCount();

    showNotice("Aapne seat chhod di.");

  }


  /* =========================
     VIEWER COUNT
  ========================= */

  function updateViewerCount() {

    if ($("viewerCount")) {
      $("viewerCount").textContent =
        room.viewers;
    }

  }


  /* =========================
     MICROPHONE
  ========================= */

  let micOn = true;

  if ($("micBtn")) {

    $("micBtn").addEventListener(
      "click",
      () => {

        micOn = !micOn;

        $("micBtn").textContent =
          micOn ? "🎙️" : "🔇";

        if (mySeat !== null) {

          seats[mySeat].mic = micOn;

          const seat =
            document.querySelector(
              `.seat[data-seat="${mySeat}"]`
            );

          const mic =
            seat?.querySelector(".mic-status");

          if (mic) {
            mic.textContent =
              micOn ? "🎙️" : "🔇";
          }

        }

        showNotice(
          micOn
            ? "Microphone ON 🎙️"
            : "Microphone OFF 🔇"
        );

      }
    );

  }


  /* =========================
     SPEAKER
  ========================= */

  let speakerOn = true;

  if ($("speakerBtn")) {

    $("speakerBtn").addEventListener(
      "click",
      () => {

        speakerOn = !speakerOn;

        $("speakerBtn").textContent =
          speakerOn ? "🔊" : "🔇";

        showNotice(
          speakerOn
            ? "Speaker ON"
            : "Speaker OFF"
        );

      }
    );

  }


  /* =========================
     ROOM CHAT
  ========================= */

  function addRoomMessage(
    name,
    message,
    mine = false
  ) {

    const container =
      $("roomMessages");

    if (!container) return;

    const item =
      document.createElement("div");

    item.className =
      mine
        ? "join-message"
        : "system-message";

    item.innerHTML = `
      <span>${escapeHTML(name)}</span>
      ${escapeHTML(message)}
    `;

    container.appendChild(item);

    while (container.children.length > 7) {
      container.removeChild(
        container.firstChild
      );
    }

  }


  if ($("openRoomChat")) {

    $("openRoomChat").addEventListener(
      "click",
      openRoomChat
    );

  }


  if ($("roomChatButton")) {

    $("roomChatButton").addEventListener(
      "click",
      openRoomChat
    );

  }


  function openRoomChat() {

    const message =
      prompt("Room mein message likho:");

    if (!message) return;

    const text =
      message.trim();

    if (!text) return;

    addRoomMessage(
      user.name,
      ": " + text,
      true
    );

  }


  /* =========================
     PERSONAL CHAT
  ========================= */

  const personalInput =
    $("personalMessageInput");

  const sendPersonal =
    $("sendPersonalMessage");

  if (sendPersonal) {

    sendPersonal.addEventListener(
      "click",
      sendPersonalMessage
    );

  }


  if (personalInput) {

    personalInput.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {
          sendPersonalMessage();
        }

      }
    );

  }


  function sendPersonalMessage() {

    if (!personalInput) return;

    const text =
      personalInput.value.trim();

    if (!text) return;

    const container =
      $("personalMessages");

    if (!container) return;

    const message =
      document.createElement("div");

    message.className =
      "message sent";

    const bubble =
      document.createElement("div");

    bubble.innerHTML = `
      ${escapeHTML(text)}
      <small>Now ✓✓</small>
    `;

    message.appendChild(bubble);

    container.appendChild(message);

    personalInput.value = "";

    container.scrollTop =
      container.scrollHeight;

  }


  /* =========================
     PERSONAL CHAT OPEN
  ========================= */

  if ($("personalChatNav")) {

    $("personalChatNav").addEventListener(
      "click",
      () => {

        showPage("chatPage");

      }
    );

  }


  /* =========================
     PROFILE OPEN
  ========================= */

  if ($("profileSettingsBtn")) {

    $("profileSettingsBtn").addEventListener(
      "click",
      () => {

        showPage("settingsPage");

      }
    );

  }


  /* =========================
     CHAT EMOJI
  ========================= */

  if ($("chatEmojiBtn")) {

    $("chatEmojiBtn").addEventListener(
      "click",
      () => {

        if (!personalInput) return;

        personalInput.value += " 😊";

        personalInput.focus();

      }
    );

  }


  /* =========================
     ROOM EMOJI
  ========================= */

  if ($("emojiBtn")) {

    $("emojiBtn").addEventListener(
      "click",
      () => {

        $("emojiPanel").classList.toggle(
          "show"
        );

      }
    );

  }


  document.querySelectorAll(
    "#emojiPanel button"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        addRoomMessage(
          user.name,
          ": " + button.textContent,
          true
        );

        $("emojiPanel").classList.remove(
          "show"
        );

      }
    );

  });


  /* =========================
     GIFTS
  ========================= */

  if ($("giftBtn")) {

    $("giftBtn").addEventListener(
      "click",
      () => {

        $("giftModal").classList.add(
          "show"
        );

      }
    );

  }


  if ($("closeGiftModal")) {

    $("closeGiftModal").addEventListener(
      "click",
      () => {

        $("giftModal").classList.remove(
          "show"
        );

      }
    );

  }


  document.querySelectorAll(
    ".gift-grid button"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const gift =
          button.dataset.gift;

        addRoomMessage(
          user.name,
          `sent ${gift} gift 🎁`,
          true
        );

        $("giftModal").classList.remove(
          "show"
        );

        showNotice(
          `${gift} Gift sent 🎁`
        );

      }
    );

  });


  /* =========================
     SHARE
  ========================= */

  if ($("shareRoomBtn")) {

    $("shareRoomBtn").addEventListener(
      "click",
      async () => {

        const text =
          `Join my Rahul Live room. Room ID: ${room.id}`;

        if (
          navigator.share
        ) {

          try {

            await navigator.share({
              title: "Rahul Live",
              text,
              url: location.href
            });

          } catch (error) {}

        } else {

          try {

            await navigator.clipboard.writeText(
              location.href
            );

            showNotice(
              "Room link copied 🔗"
            );

          } catch (error) {

            showNotice(text);

          }

        }

      }
    );

  }


  /* =========================
     LEAVE ROOM
  ========================= */

  if ($("leaveRoomBtn")) {

    $("leaveRoomBtn").addEventListener(
      "click",
      () => {

        if (mySeat !== null) {
          leaveMySeat();
        }

        showPage("profilePage");

      }
    );

  }


  /* =========================
     ROOM MUSIC
  ========================= */

  if ($("roomMusicBtn")) {

    $("roomMusicBtn").addEventListener(
      "click",
      () => {

        showNotice(
          "Room music option selected 🎵"
        );

      }
    );

  }


  /* =========================
     MESSAGES BUTTON
  ========================= */

  if ($("messagesBtn")) {

    $("messagesBtn").addEventListener(
      "click",
      () => {

        showPage("chatPage");

      }
    );

  }


  /* =========================
     MENU
  ========================= */

  if ($("menuBtn")) {

    $("menuBtn").addEventListener(
      "click",
      () => {

        const action =
          confirm(
            "Apni current seat chhodni hai?"
          );

        if (action) {
          leaveMySeat();
        }

      }
    );

  }


  /* =========================
     SIGN OUT
  ========================= */

  if ($("signOutBtn")) {

    $("signOutBtn").addEventListener(
      "click",
      () => {

        const yes =
          confirm(
            "Kya aap Sign Out karna chahte hain?"
          );

        if (!yes) return;

        localStorage.removeItem(
          "rahul_name"
        );

        localStorage.removeItem(
          "rahul_photo"
        );

        user.name = "Rahul";

        user.photo =
          "https://i.pravatar.cc/200?img=12";

        updateUserProfile();

        showPage("roomPage");

        showNotice(
          "Signed out"
        );

      }
    );

  }


  /* =========================
     ROOM TIMER
  ========================= */

  let seconds = 4 * 60 + 54;

  setInterval(() => {

    if (!$("pkTimer")) return;

    seconds--;

    if (seconds < 0) {
      seconds = 4 * 60 + 54;
    }

    const minutes =
      Math.floor(seconds / 60);

    const sec =
      seconds % 60;

    $("pkTimer").textContent =
      `${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  }, 1000);


  /* =========================
     NOTICE
  ========================= */

  function showNotice(message) {

    let notice =
      document.getElementById(
        "rahulNotice"
      );

    if (!notice) {

      notice =
        document.createElement("div");

      notice.id =
        "rahulNotice";

      notice.style.position =
        "fixed";

      notice.style.left =
        "50%";

      notice.style.bottom =
        "95px";

      notice.style.transform =
        "translateX(-50%)";

      notice.style.zIndex =
        "9999";

      notice.style.background =
        "rgba(0,0,0,.82)";

      notice.style.color =
        "#fff";

      notice.style.padding =
        "11px 18px";

      notice.style.borderRadius =
        "22px";

      notice.style.fontSize =
        "14px";

      notice.style.whiteSpace =
        "nowrap";

      document.body.appendChild(
        notice
      );

    }

    notice.textContent =
      message;

    clearTimeout(
      notice._timer
    );

    notice._timer =
      setTimeout(() => {

        notice.remove();

      }, 2200);

  }


  /* =========================
     HTML ESCAPE
  ========================= */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =========================
     MODAL BACKDROP
  ========================= */

  document.querySelectorAll(".modal")
    .forEach(modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            modal.classList.remove(
              "show"
            );

          }

        }
      );

    });


  /* =========================
     START
  ========================= */

  showPage("roomPage");

});