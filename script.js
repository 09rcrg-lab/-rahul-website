let ws;
let currentUser = null;

// Screen Switching Function
function showScreen(screenId) {
  document.querySelectorAll('.auth-box, .chat-box').forEach(el => el.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

// User Registration
async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  if (!username || !password) return alert("Please fill all fields!");

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.success) {
    alert("Account created! Please login.");
    showScreen('login-screen');
  } else {
    alert(data.message);
  }
}

// User Login
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!username || !password) return alert("Please fill all fields!");

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.success) {
    currentUser = data.username;
    document.getElementById('current-user-display').innerText = `👤 ${currentUser}`;
    showScreen('chat-screen');
    connectWebSocket();
  } else {
    alert(data.message);
  }
}

// WebSocket Connection (After Login)
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "system", text: `${currentUser} joined the chat` }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    displayMessage(data);
  };
}

function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();

  if (text && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "chat",
      sender: currentUser,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    input.value = "";
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") sendMessage();
}

function displayMessage(data) {
  const box = document.getElementById("messages-box");

  if (data.type === "system") {
    const sysDiv = document.createElement("div");
    sysDiv.className = "system-msg";
    sysDiv.innerText = data.text;
    box.appendChild(sysDiv);
  } else {
    const msgDiv = document.createElement("div");
    const isMe = data.sender === currentUser;
    msgDiv.className = `msg ${isMe ? "my-msg" : "other-msg"}`;

    msgDiv.innerHTML = `
      ${!isMe ? `<div class="sender">${data.sender}</div>` : ""}
      <div>${data.text}</div>
      <div class="time">${data.time}</div>
    `;

    box.appendChild(msgDiv);
  }

  box.scrollTop = box.scrollHeight;
}

// Logout Action
function handleLogout() {
  if (ws) ws.close();
  currentUser = null;
  document.getElementById('messages-box').innerHTML = "";
  showScreen('login-screen');
}