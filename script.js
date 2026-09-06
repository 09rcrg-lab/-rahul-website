const API_URL = "https://rahulsocialhub-db.09rcrg.workers.dev";
const WHATSAPP_NUMBER = "919131922170";
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
  authMessage.textContent = "Account बनाया जा रहा है...";
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
    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Registration failed."
      );
    }
    registerForm.reset();
    authMessage.textContent =
      "✅ Account बन गया। अब Login करें।";
    showLogin();
  } catch (error) {
    authMessage.textContent =
      "❌ " + error.message;
  }
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
  authMessage.textContent = "Login हो रहा है...";
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
    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Login failed."
      );
    }
    localStorage.setItem(
      "rahul_session",
      JSON.stringify(data.user)
    );
    loginForm.reset();
    openDashboard(data.user);
  } catch (error) {
    authMessage.textContent =
      "❌ " + error.message;
  }
});
// ===============================
// DASHBOARD
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
  showLogin();
}
// ===============================
// SESSION CHECK
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
async function createOrder() {
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
  const button =
    document.querySelector(
      "#orderModal .main-btn"
    );
  button.disabled = true;
  button.textContent = "Order बनाया जा रहा है...";
  try {
    const response = await fetch(
      API_URL + "/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: session.username,
          service: currentService,
          price: currentPrice,
          instagram: instagramUsername
        })
      }
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Order failed."
      );
    }
    closeOrder();
    loadOrders();
    sendOrderWhatsApp(data.order);
  } catch (error) {
    document.getElementById(
      "orderMessage"
    ).textContent =
      "❌ " + error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Confirm Order";
  }
}
// ===============================
// LOAD ORDERS FROM D1
// ===============================
async function loadOrders() {
  const session =
    localStorage.getItem("rahul_session");
  if (!session) return;
  const user =
    JSON.parse(session);
  orderHistory.innerHTML =
    "Orders loading...";
  try {
    const response = await fetch(
      API_URL +
      "/api/orders?username=" +
      encodeURIComponent(user.username)
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Orders load नहीं हुए।"
      );
    }
    if (!data.orders || data.orders.length === 0) {
      orderHistory.innerHTML =
        "अभी कोई order नहीं है।";
      return;
    }
    orderHistory.innerHTML =
      data.orders.map(order => `
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
          ">
            ${escapeHTML(order.order_id)}
          </div>
          <div style="margin-top:7px;">
            ${escapeHTML(order.service)}
          </div>
          <div style="
            color:#39ff14;
            margin-top:5px;
          ">
            ₹${escapeHTML(String(order.amount))}
          </div>
          <div style="
            color:#aaa;
            font-size:13px;
            margin-top:5px;
          ">
            @${escapeHTML(order.instagram_username)}
          </div>
          <div style="
            color:#ffd166;
            font-size:13px;
            margin-top:8px;
          ">
            Payment: ${escapeHTML(order.payment_status)}
          </div>
          <div style="
            color:#aaa;
            font-size:13px;
            margin-top:5px;
          ">
            Order: ${escapeHTML(order.order_status)}
          </div>
          <div style="
            color:#777;
            font-size:12px;
            margin-top:7px;
          ">
            ${escapeHTML(order.created_at)}
          </div>
        </div>
      `).join("");
  } catch (error) {
    orderHistory.innerHTML =
      "❌ Orders load नहीं हुए।";
  }
}
// ===============================
// WHATSAPP ORDER
// ===============================
function sendOrderWhatsApp(order) {
  const message =
`🚀 NEW ORDER - RAHUL SOCIAL HUB
🧾 Order ID:
${order.orderId}
👤 Customer:
@${order.username}
📱 Instagram:
@${order.instagram}
🛒 Service:
${order.service}
💰 Amount:
₹${order.amount}
💳 Payment:
Pending
कृपया payment verify करें।`;
  openWhatsApp(message);
}
// ===============================
// PAYMENT WHATSAPP
// ===============================
function sendPaymentWhatsApp() {
  const session =
    localStorage.getItem("rahul_session");
  if (!session) {
    alert("पहले Login करें।");
    return;
  }
  const user =
    JSON.parse(session);
  const message =
`💳 PAYMENT SCREENSHOT
👤 Username:
@${user.username}
मैंने Rahul Social Hub पर payment किया है।
📸 Payment screenshot भेज रहा/रही हूँ।
कृपया payment verify करें।`;
  openWhatsApp(message);
}
// ===============================
// OPEN WHATSAPP
// ===============================
function openWhatsApp(message) {
  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);
  window.open(url, "_blank");
}
// ===============================
// SECURITY
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
// MODAL CLOSE
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
// START
// ===============================
checkSession();