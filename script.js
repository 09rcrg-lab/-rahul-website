// ===============================
// CONFIGURATION
// ===============================
const API_URL = ""; 
const WHATSAPP_NUMBER = "919131922170";
// ===============================
// PAGE ELEMENTS
// ===============================
const authPage = document.getElementById("authPage");
const dashboardPage = document.getElementById("dashboardPage");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const authMessage = document.getElementById("authMessage");
const orderModal = document.getElementById("orderModal");
const selectedService = document.getElementById("selectedService");
const selectedPrice = document.getElementById("selectedPrice");
const welcomeUser = document.getElementById("welcomeUser");
const orderHistory = document.getElementById("orderHistory");
let currentService = "";
let currentPrice = 0;
// ===============================
// LOGIN / REGISTER TABS
// ===============================
function showLogin() {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  authMessage.textContent = "";
}
function showRegister() {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  authMessage.textContent = "";
}
// ===============================
// REGISTER
// ===============================
registerForm.addEventListener("submit", async function(event) {
  event.preventDefault();
  const username =
    document.getElementById("registerUsername").value.trim();
  const email =
    document.getElementById("registerEmail").value.trim();
  const password =
    document.getElementById("registerPassword").value;
  const referral =
    document.getElementById("referralCode").value.trim();
  if (!username || !email || !password) {
    authMessage.textContent = "सभी जरूरी जानकारी भरें।";
    return;
  }
  // Backend connected होने पर यह request जाएगी
  if (API_URL) {
    try {
      const response = await fetch(
        API_URL + "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            email,
            password,
            referral
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      authMessage.textContent =
        "Account बन गया। अब Login करें।";
      registerForm.reset();
      showLogin();
    } catch (error) {
      authMessage.textContent =
        error.message || "Registration में समस्या हुई।";
    }
    return;
  }
  // Temporary local testing
  const users =
    JSON.parse(localStorage.getItem("rahul_users") || "[]");
  const alreadyExists =
    users.some(user => user.username === username);
  if (alreadyExists) {
    authMessage.textContent =
      "यह username पहले से मौजूद है।";
    return;
  }
  users.push({
    username,
    email,
    password,
    referral
  });
  localStorage.setItem(
    "rahul_users",
    JSON.stringify(users)
  );
  authMessage.textContent =
    "Account बन गया। अब Login करें।";
  registerForm.reset();
  showLogin();
});
// ===============================
// LOGIN
// ===============================
loginForm.addEventListener("submit", async function(event) {
  event.preventDefault();
  const username =
    document.getElementById("loginUsername").value.trim();
  const password =
    document.getElementById("loginPassword").value;
  if (!username || !password) {
    authMessage.textContent =
      "Username और Password डालें।";
    return;
  }
  // Backend login
  if (API_URL) {
    try {
      const response = await fetch(
        API_URL + "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem(
        "rahul_session",
        JSON.stringify(data.user || { username })
      );
      openDashboard(
        data.user || { username }
      );
    } catch (error) {
      authMessage.textContent =
        error.message || "Login में समस्या हुई।";
    }
    return;
  }
  // Temporary local login
  const users =
    JSON.parse(localStorage.getItem("rahul_users") || "[]");
  const user =
    users.find(
      item =>
        item.username === username &&
        item.password === password
    );
  if (!user) {
    authMessage.textContent =
      "Username या Password गलत है।";
    return;
  }
  localStorage.setItem(
    "rahul_session",
    JSON.stringify(user)
  );
  openDashboard(user);
});
// ===============================
// OPEN DASHBOARD
// ===============================
function openDashboard(user) {
  authPage.style.display = "none";
  dashboardPage.style.display = "block";
  welcomeUser.textContent =
    "Logged in as @" + user.username;
  loadOrders();
}
// ===============================
// LOGOUT
// ===============================
function logout() {
  localStorage.removeItem("rahul_session");
  dashboardPage.style.display = "none";
  authPage.style.display = "flex";
  loginForm.reset();
  showLogin();
}
// ===============================
// CHECK SESSION
// ===============================
function checkSession() {
  const session =
    localStorage.getItem("rahul_session");
  if (!session) {
    authPage.style.display = "flex";
    dashboardPage.style.display = "none";
    return;
  }
  try {
    const user = JSON.parse(session);
    openDashboard(user);
  } catch {
    localStorage.removeItem("rahul_session");
    authPage.style.display = "flex";
    dashboardPage.style.display = "none";
  }
}
// ===============================
// OPEN ORDER
// ===============================
function openOrder(service, price) {
  const session =
    localStorage.getItem("rahul_session");
  if (!session) {
    alert("पहले Login करें।");
    authPage.style.display = "flex";
    dashboardPage.style.display = "none";
    return;
  }
  currentService = service;
  currentPrice = price;
  selectedService.textContent =
    "Service: " + service;
  selectedPrice.textContent =
    price;
  document.getElementById(
    "instagramUsername"
  ).value = "";
  document.getElementById(
    "orderMessage"
  ).textContent = "";
  orderModal.style.display = "flex";
}
// ===============================
// CLOSE ORDER
// ===============================
function closeOrder() {
  orderModal.style.display = "none";
}
// ===============================
// CREATE ORDER
// ===============================
function createOrder() {
  const instagramUsername =
    document
      .getElementById("instagramUsername")
      .value
      .trim();
  if (!instagramUsername) {
    document.getElementById(
      "orderMessage"
    ).textContent =
      "Instagram Username डालें।";
    return;
  }
  const session =
    JSON.parse(
      localStorage.getItem("rahul_session")
    );
  const orderId =
    "RSH-" +
    Date.now().toString().slice(-8);
  const order = {
    id: orderId,
    username: session.username,
    service: currentService,
    price: currentPrice,
    instagram: instagramUsername,
    status: "Payment Pending",
    date: new Date().toLocaleString("en-IN")
  };
  const orders =
    JSON.parse(
      localStorage.getItem("rahul_orders") || "[]"
    );
  orders.unshift(order);
  localStorage.setItem(
    "rahul_orders",
    JSON.stringify(orders)
  );
  closeOrder();
  loadOrders();
  sendOrderWhatsApp(order);
}
// ===============================
// LOAD ORDERS
// ===============================
function loadOrders() {
  const session =
    JSON.parse(
      localStorage.getItem("rahul_session")
    );
  if (!session) return;
  const orders =
    JSON.parse(
      localStorage.getItem("rahul_orders") || "[]"
    );
  const myOrders =
    orders.filter(
      order =>
        order.username === session.username
    );
  if (myOrders.length === 0) {
    orderHistory.innerHTML =
      "अभी कोई order नहीं है।";
    return;
  }
  orderHistory.innerHTML =
    myOrders.map(order => `
      <div style="
        background:#080808;
        border:1px solid #252525;
        border-radius:12px;
        padding:15px;
        margin-bottom:10px;
      ">
        <div style="
          color:#39ff14;
          font-weight:bold;
          margin-bottom:7px;
        ">
          ${escapeHTML(order.id)}
        </div>
        <div>
          ${escapeHTML(order.service)}
        </div>
        <div style="
          color:#39ff14;
          margin-top:5px;
        ">
          ₹${escapeHTML(String(order.price))}
        </div>
        <div style="
          color:#aaa;
          font-size:13px;
          margin-top:5px;
        ">
          @${escapeHTML(order.instagram)}
        </div>
        <div style="
          color:#aaa;
          font-size:12px;
          margin-top:7px;
        ">
          ${escapeHTML(order.date)}
        </div>
        <div style="
          margin-top:8px;
          color:#ffd166;
          font-size:13px;
        ">
          ${escapeHTML(order.status)}
        </div>
      </div>
    `).join("");
}
// ===============================
// WHATSAPP ORDER
// ===============================
function sendOrderWhatsApp(order) {
  const message =
`🚀 NEW ORDER - RAHUL SOCIAL HUB
🧾 Order ID: ${order.id}
👤 Customer:
@${order.username}
📱 Instagram:
@${order.instagram}
🛒 Service:
${order.service}
💰 Amount:
₹${order.price}
💳 Payment:
Pending
कृपया payment verify करें।`;
  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);
  window.open(url, "_blank");
}
// ===============================
// PAYMENT WHATSAPP
// ===============================
function sendPaymentWhatsApp() {
  const session =
    JSON.parse(
      localStorage.getItem("rahul_session")
    );
  if (!session) {
    alert("पहले Login करें।");
    return;
  }
  const message =
`💳 PAYMENT SCREENSHOT
👤 Username:
@${session.username}
मैंने Rahul Social Hub पर payment किया है।
📸 मैं payment screenshot WhatsApp पर भेज रहा/रही हूँ।
कृपया payment verify करें।`;
  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);
  window.open(url, "_blank");
}
// ===============================
// HTML SECURITY
// ===============================
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
// ===============================
// MODAL OUTSIDE CLICK
// ===============================
orderModal.addEventListener(
  "click",
  function(event) {
    if (event.target === orderModal) {
      closeOrder();
    }
  }
);
// ===============================
// START WEBSITE
// ===============================
checkSession();