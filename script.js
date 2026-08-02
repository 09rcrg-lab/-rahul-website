/* =========================================================
   RAHUL LIVE — COMPLETE SCRIPT
   ========================================================= */

const API_BASE = "https://rahulsocialhub-db.09rcrg.workers.dev";

let currentUser = null;
let currentRoom = null;
let roomPollTimer = null;
let chatPollTimer = null;
let viewerPollTimer = null;


/* ================= HELPERS ================= */

const $ = (id) => document.getElementById(id);

function show(id){
  $(id)?.classList.remove("hidden");
}

function hide(id){
  $(id)?.classList.add("hidden");
}

function toast(message){
  const el = $("toast");
  if(!el) return;

  el.textContent = message;
  el.classList.remove("hidden");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 2500);
}

async function api(path, options = {}){
  const response = await fetch(API_BASE + path, {
    headers:{
      "Content-Type":"application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data;

  try{
    data = await response.json();
  }catch{
    data = {
      success:false,
      message:"Server response समझ नहीं आया"
    };
  }

  if(!response.ok && data.success !== true){
    throw new Error(data.message || "Request failed");
  }

  return data;
}


/* ================= AUTH ================= */

function saveUser(user){
  currentUser = user;
  localStorage.setItem(
    "rahul_live_user",
    JSON.stringify(user)
  );
}

function loadUser(){
  try{
    const saved = localStorage.getItem("rahul_live_user");

    if(saved){
      currentUser = JSON.parse(saved);
      return true;
    }
  }catch{}

  return false;
}

function clearUser(){
  currentUser = null;
  localStorage.removeItem("rahul_live_user");
}

function showMainApp(){
  hide("authScreen");
  show("mainApp");

  $("profileUsername").textContent =
    currentUser?.username || "User";

  $("profileEmail").textContent =
    currentUser?.email || "";

  const letter =
    (currentUser?.username || "R")
      .charAt(0)
      .toUpperCase();

  $("profileAvatar").textContent = letter;

  loadLiveRooms();
}

function showAuth(){
  show("authScreen");
  hide("mainApp");
  hide("liveRoomScreen");
  show("homeScreen");
  hide("profileScreen");
}


/* ================= LOGIN / REGISTER ================= */

async function registerUser(){

  const username =
    $("registerUsername").value.trim();

  const email =
    $("registerEmail").value.trim();

  const password =
    $("registerPassword").value;

  if(!username || !email || !password){
    $("authMessage").textContent =
      "सभी details भरें";
    return;
  }

  if(password.length < 6){
    $("authMessage").textContent =
      "Password कम से कम 6 characters का होना चाहिए";
    return;
  }

  $("registerBtn").disabled = true;
  $("registerBtn").textContent = "Registering...";

  try{

    const data = await api("/api/register",{
      method:"POST",
      body:JSON.stringify({
        username,
        email,
        password
      })
    });

    if(data.success){

      $("authMessage").textContent =
        data.message || "Registration successful";

      $("registerUsername").value = "";
      $("registerEmail").value = "";
      $("registerPassword").value = "";

      toast("Account बन गया ✅");

      setTimeout(() => {
        showLogin();
      },700);

    }else{

      $("authMessage").textContent =
        data.message || "Registration failed";
    }

  }catch(error){

    $("authMessage").textContent =
      error.message || "Registration failed";

  }finally{

    $("registerBtn").disabled = false;
    $("registerBtn").textContent = "Register";
  }
}


async function loginUser(){

  const username =
    $("loginUsername").value.trim();

  const password =
    $("loginPassword").value;

  if(!username || !password){
    $("authMessage").textContent =
      "Username और password भरें";
    return;
  }

  $("loginBtn").disabled = true;
  $("loginBtn").textContent = "Login...";

  try{

    const data = await api("/api/login",{
      method:"POST",
      body:JSON.stringify({
        username,
        password
      })
    });

    if(data.success){

      const user =
        data.user || data.data || {
          username,
          email:data.email || ""
        };

      saveUser(user);

      $("authMessage").textContent = "";

      toast("Login successful ✅");

      showMainApp();

    }else{

      $("authMessage").textContent =
        data.message || "Login failed";
    }

  }catch(error){

    $("authMessage").textContent =
      error.message || "Login failed";

  }finally{

    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "Login";
  }
}


function showRegister(){

  hide("loginForm");
  show("registerForm");

  $("authMessage").textContent = "";
}


function showLogin(){

  show("loginForm");
  hide("registerForm");

  $("authMessage").textContent = "";
}


/* ================= LIVE ROOMS ================= */

async function loadLiveRooms(){

  const grid = $("liveRoomsGrid");
  const empty = $("emptyRooms");

  if(!grid) return;

  try{

    const data =
      await api("/api/live/rooms");

    const rooms =
      data.rooms ||
      data.data ||
      [];

    grid.innerHTML = "";

    if(!rooms.length){

      show("emptyRooms");
      return;
    }

    hide("emptyRooms");

    rooms.forEach(room => {

      grid.appendChild(
        createRoomCard(room)
      );

    });

  }catch(error){

    /*
      अगर अभी Worker में rooms endpoint
      उपलब्ध नहीं है तो Home खाली रहेगा।
    */

    grid.innerHTML = "";

    show("emptyRooms");
  }
}


function createRoomCard(room){

  const card =
    document.createElement("div");

  card.className = "live-card";

  const host =
    room.host_username ||
    room.username ||
    room.hostName ||
    "Host";

  const viewers =
    room.viewer_count ||
    room.viewers ||
    0;

  const title =
    room.title ||
    "Chat LIVE";

  const letter =
    host.charAt(0).toUpperCase();

  card.innerHTML = `

    <div class="live-card-cover">

      <div class="live-badge-card">
        🔴 LIVE
      </div>

      <div class="live-card-viewers">
        👥 ${viewers}
      </div>

      <div class="live-card-avatar">
        ${escapeHtml(letter)}
      </div>

    </div>

    <div class="live-card-info">

      <strong>
        ${escapeHtml(host)}
      </strong>

      <span>
        ${escapeHtml(title)}
      </span>

      <span>
        👥 ${viewers} viewers
      </span>

    </div>

  `;

  card.addEventListener("click",() => {
    joinRoom(room);
  });

  return card;
}


/* ================= START LIVE ================= */

async function startLive(){

  if(!currentUser){
    toast("पहले Login करें");
    return;
  }

  try{

    const data =
      await api("/api/live/create",{
        method:"POST",
        body:JSON.stringify({
          host_id:currentUser.id,
          title:"Chat LIVE",
          status:"live"
        })
      });

    if(data.success){

      const room =
        data.room ||
        data.data ||
        data;

      toast("LIVE शुरू हो गया 🔴");

      await joinRoom(room);

    }else{

      toast(
        data.message ||
        "LIVE शुरू नहीं हुआ"
      );
    }

  }catch(error){

    toast(
      error.message ||
      "LIVE शुरू करने में समस्या"
    );
  }
}


/* ================= JOIN ROOM ================= */

async function joinRoom(room){

  currentRoom = room;

  hide("homeScreen");
  hide("profileScreen");
  show("liveRoomScreen");

  const host =
    room.host_username ||
    room.username ||
    room.hostName ||
    "Host";

  $("roomTitle").textContent =
    room.title || "Chat LIVE";

  $("roomHostName").textContent =
    host;

  $("roomHostAvatar").textContent =
    host.charAt(0).toUpperCase();

  await joinViewer();

  loadRoomData();

  startRoomPolling();

  toast("LIVE में Join हो गए 🔴");
}


/* ================= VIEWER JOIN ================= */

async function joinViewer(){

  if(!currentRoom || !currentUser)
    return;

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  if(!roomId) return;

  try{

    await api("/api/live/join",{
      method:"POST",
      body:JSON.stringify({
        live_room_id:roomId,
        user_id:currentUser.id
      })
    });

  }catch(error){
    console.log("Join viewer:",error);
  }
}


/* ================= ROOM DATA ================= */

async function loadRoomData(){

  if(!currentRoom) return;

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  if(!roomId) return;

  try{

    const data =
      await api(
        `/api/live/room/${encodeURIComponent(roomId)}`
      );

    const room =
      data.room ||
      data.data ||
      data;

    const count =
      room.viewer_count ||
      room.viewers ||
      0;

    $("roomViewerCount").textContent = count;
    $("roomViewerCount2").textContent = count;
    $("chatViewerCount").textContent =
      `${count} viewers`;
    $("viewerTotal").textContent = count;

    const hostId =
      room.host_id ||
      currentRoom.host_id;

    if(
      currentUser &&
      String(hostId) === String(currentUser.id)
    ){
      show("hostControls");
    }else{
      hide("hostControls");
    }

    await loadMessages();
    await loadViewers();

  }catch(error){

    console.log("Room:",error);
  }
}


/* ================= CHAT ================= */

async function loadMessages(){

  if(!currentRoom) return;

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  if(!roomId) return;

  try{

    const data =
      await api(
        `/api/live/messages/${encodeURIComponent(roomId)}`
      );

    const messages =
      data.messages ||
      data.data ||
      [];

    renderMessages(messages);

  }catch(error){

    console.log("Messages:",error);
  }
}


function renderMessages(messages){

  const box = $("chatMessages");

  if(!box) return;

  box.innerHTML = "";

  if(!messages.length){

    box.innerHTML = `
      <div class="system-message">
        LIVE room में आपका स्वागत है 👋
      </div>
    `;

    return;
  }

  messages.forEach(message => {

    const item =
      document.createElement("div");

    const username =
      message.username ||
      message.sender_username ||
      "User";

    const text =
      message.message ||
      message.content ||
      "";

    item.className =
      "chat-message" +
      (
        currentUser &&
        String(
          message.user_id ||
          message.sender_id
        ) === String(currentUser.id)
          ? " mine"
          : ""
      );

    item.innerHTML = `

      <div class="chat-username">
        ${escapeHtml(username)}
      </div>

      <div class="chat-text">
        ${escapeHtml(text)}
      </div>

    `;

    box.appendChild(item);
  });

  box.scrollTop = box.scrollHeight;
}


async function sendChat(){

  const input =
    $("chatInput");

  const message =
    input.value.trim();

  if(!message) return;

  if(!currentRoom || !currentUser){
    toast("LIVE में Join करें");
    return;
  }

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  if(!roomId) return;

  input.disabled = true;

  try{

    const data =
      await api("/api/live/message",{
        method:"POST",
        body:JSON.stringify({
          live_room_id:roomId,
          user_id:currentUser.id,
          message
        })
      });

    if(data.success){

      input.value = "";

      await loadMessages();

    }else{

      toast(
        data.message ||
        "Message नहीं भेजा गया"
      );
    }

  }catch(error){

    toast(
      error.message ||
      "Chat error"
    );

  }finally{

    input.disabled = false;
    input.focus();
  }
}


/* ================= VIEWERS ================= */

async function loadViewers(){

  if(!currentRoom) return;

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  if(!roomId) return;

  try{

    const data =
      await api(
        `/api/live/viewers/${encodeURIComponent(roomId)}`
      );

    const viewers =
      data.viewers ||
      data.data ||
      [];

    renderViewers(viewers);

  }catch(error){

    console.log("Viewers:",error);
  }
}


function renderViewers(viewers){

  const list =
    $("viewerList");

  if(!list) return;

  list.innerHTML = "";

  viewers.forEach(viewer => {

    const username =
      viewer.username ||
      viewer.name ||
      "User";

    const item =
      document.createElement("div");

    item.className =
      "viewer-item";

    item.innerHTML = `

      <div class="viewer-avatar">
        ${escapeHtml(
          username.charAt(0).toUpperCase()
        )}
      </div>

      <div class="viewer-name">
        ${escapeHtml(username)}
      </div>

    `;

    list.appendChild(item);
  });
}


/* ================= EMOJI ================= */

function insertEmoji(emoji){

  const input =
    $("chatInput");

  input.value += emoji;

  input.focus();

  hide("emojiPanel");
}


function sendReaction(emoji){

  createFloatingReaction(emoji);

  if(
    currentRoom &&
    currentUser
  ){
    sendReactionToServer(emoji);
  }
}


function createFloatingReaction(emoji){

  const container =
    $("floatingReactions");

  if(!container) return;

  const reaction =
    document.createElement("div");

  reaction.className =
    "floating-reaction";

  reaction.textContent = emoji;

  reaction.style.right =
    `${Math.random()*70}px`;

  container.appendChild(reaction);

  setTimeout(() => {
    reaction.remove();
  },1800);
}


async function sendReactionToServer(emoji){

  const roomId =
    currentRoom?.id ||
    currentRoom?.live_room_id;

  if(!roomId) return;

  try{

    await api("/api/live/reaction",{
      method:"POST",
      body:JSON.stringify({
        live_room_id:roomId,
        user_id:currentUser.id,
        reaction:emoji
      })
    });

  }catch(error){

    console.log("Reaction:",error);
  }
}


/* ================= HOST CONTROLS ================= */

async function moderationAction(action){

  if(!currentRoom || !currentUser)
    return;

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  const target =
    prompt(
      "जिस viewer पर action करना है उसका User ID डालें:"
    );

  if(!target) return;

  try{

    const data =
      await api("/api/live/moderate",{
        method:"POST",
        body:JSON.stringify({
          live_room_id:roomId,
          host_id:currentUser.id,
          target_user_id:target,
          action
        })
      });

    toast(
      data.message ||
      `${action} किया गया`
    );

    await loadViewers();

  }catch(error){

    toast(
      error.message ||
      "Moderation failed"
    );
  }
}


async function endLive(){

  if(!currentRoom || !currentUser)
    return;

  const ok =
    confirm("क्या आप LIVE End करना चाहते हैं?");

  if(!ok) return;

  const roomId =
    currentRoom.id ||
    currentRoom.live_room_id;

  try{

    const data =
      await api("/api/live/end",{
        method:"POST",
        body:JSON.stringify({
          live_room_id:roomId,
          host_id:currentUser.id
        })
      });

    if(data.success){

      toast("LIVE End हो गया");

      stopRoomPolling();

      currentRoom = null;

      show("homeScreen");
      hide("liveRoomScreen");

      await loadLiveRooms();

    }else{

      toast(
        data.message ||
        "LIVE End नहीं हुआ"
      );
    }

  }catch(error){

    toast(
      error.message ||
      "End LIVE error"
    );
  }
}


/* ================= LEAVE LIVE ================= */

async function leaveLive(){

  if(currentRoom && currentUser){

    const roomId =
      currentRoom.id ||
      currentRoom.live_room_id;

    try{

      await api("/api/live/leave",{
        method:"POST",
        body:JSON.stringify({
          live_room_id:roomId,
          user_id:currentUser.id
        })
      });

    }catch(error){

      console.log("Leave:",error);
    }
  }

  stopRoomPolling();

  currentRoom = null;

  hide("liveRoomScreen");
  show("homeScreen");

  await loadLiveRooms();

  toast("LIVE छोड़ दिया");
}


/* ================= POLLING ================= */

function startRoomPolling(){

  stopRoomPolling();

  roomPollTimer =
    setInterval(
      loadRoomData,
      4000
    );

  chatPollTimer =
    setInterval(
      loadMessages,
      2500
    );

  viewerPollTimer =
    setInterval(
      loadViewers,
      4000
    );
}


function stopRoomPolling(){

  clearInterval(roomPollTimer);
  clearInterval(chatPollTimer);
  clearInterval(viewerPollTimer);

  roomPollTimer = null;
  chatPollTimer = null;
  viewerPollTimer = null;
}


/* ================= NAVIGATION ================= */

function showHome(){

  hide("profileScreen");
  hide("liveRoomScreen");
  show("homeScreen");

  $("homeNavBtn")
    ?.classList.add("nav-active");

  $("profileNavBtn")
    ?.classList.remove("nav-active");

  loadLiveRooms();
}


function showProfile(){

  hide("homeScreen");
  hide("liveRoomScreen");
  show("profileScreen");

  $("profileNavBtn")
    ?.classList.add("nav-active");

  $("homeNavBtn")
    ?.classList.remove("nav-active");
}


/* ================= LOGOUT ================= */

function logout(){

  if(currentRoom){
    leaveLive();
  }

  clearUser();

  showAuth();

  $("loginUsername").value = "";
  $("loginPassword").value = "";

  toast("Logout हो गया");
}


/* ================= SECURITY ================= */

function escapeHtml(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}


/* ================= EVENTS ================= */

document.addEventListener("DOMContentLoaded",() => {

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

  $("showRegisterBtn")
    ?.addEventListener(
      "click",
      showRegister
    );

  $("showLoginBtn")
    ?.addEventListener(
      "click",
      showLogin
    );

  $("logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );

  $("startLiveBtn")
    ?.addEventListener(
      "click",
      startLive
    );

  $("refreshRoomsBtn")
    ?.addEventListener(
      "click",
      loadLiveRooms
    );

  $("backHomeBtn")
    ?.addEventListener(
      "click",
      leaveLive
    );

  $("leaveLiveBtn")
    ?.addEventListener(
      "click",
      leaveLive
    );

  $("sendChatBtn")
    ?.addEventListener(
      "click",
      sendChat
    );

  $("emojiBtn")
    ?.addEventListener(
      "click",
      () => {
        $("emojiPanel")
          ?.classList.toggle("hidden");
      }
    );

  document
    .querySelectorAll("[data-emoji]")
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

  document
    .querySelectorAll("[data-reaction]")
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


  $("chatInput")
    ?.addEventListener(
      "keydown",
      event => {

        if(event.key === "Enter"){
          event.preventDefault();
          sendChat();
        }

      }
    );


  $("muteBtn")
    ?.addEventListener(
      "click",
      () => moderationAction("mute")
    );

  $("kickBtn")
    ?.addEventListener(
      "click",
      () => moderationAction("kick")
    );

  $("blockBtn")
    ?.addEventListener(
      "click",
      () => moderationAction("block")
    );

  $("endLiveBtn")
    ?.addEventListener(
      "click",
      endLive
    );


  $("homeNavBtn")
    ?.addEventListener(
      "click",
      showHome
    );

  $("liveNavBtn")
    ?.addEventListener(
      "click",
      loadLiveRooms
    );

  $("profileNavBtn")
    ?.addEventListener(
      "click",
      showProfile
    );


  /* Restore login */

  if(loadUser()){
    showMainApp();
  }else{
    showAuth();
  }

});