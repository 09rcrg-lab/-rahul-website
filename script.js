// ==========================================
// RAHUL SOCIAL HUB - LOCAL STORAGE VERSION
// ==========================================
const WHATSAPP_NUMBER = "919131922170";
// ---------- STORAGE ----------
const USERS_KEY = "rahul_users";
const ORDERS_KEY = "rahul_orders";
const SESSION_KEY = "rahul_session";
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}
function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}
// ---------- PAGE ELEMENTS ----------
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const dashboard = document.getElementById("dashboard");
const authSection = document.getElementById("authSection");
// ---------- TAB SWITCH ----------
if (loginTab) {
    loginTab.addEventListener("click", () => {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    });
}
if (registerTab) {
    registerTab.addEventListener("click", () => {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");
        registerForm.style.display = "block";
        loginForm.style.display = "none";
    });
}
// ---------- REGISTER ----------
if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const username =
            document.getElementById("registerUsername")?.value.trim();
        const email =
            document.getElementById("registerEmail")?.value.trim();
        const password =
            document.getElementById("registerPassword")?.value;
        if (!username || !email || !password) {
            alert("सभी जानकारी भरें।");
            return;
        }
        if (password.length < 4) {
            alert("Password कम से कम 4 अक्षर का रखें।");
            return;
        }
        const users = getUsers();
        const alreadyExists = users.some(
            user =>
                user.username.toLowerCase() === username.toLowerCase() ||
                user.email.toLowerCase() === email.toLowerCase()
        );
        if (alreadyExists) {
            alert("Username या Gmail पहले से मौजूद है।");
            return;
        }
        const user = {
            id: Date.now(),
            username: username,
            email: email,
            password: password,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        alert("Registration सफल हो गया। अब Login करें।");
        loginTab?.click();
        if (document.getElementById("loginUsername")) {
            document.getElementById("loginUsername").value = username;
        }
    });
}
// ---------- LOGIN ----------
if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const username =
            document.getElementById("loginUsername")?.value.trim();
        const password =
            document.getElementById("loginPassword")?.value;
        const users = getUsers();
        const user = users.find(
            u =>
                u.username.toLowerCase() === username.toLowerCase() &&
                u.password === password
        );
        if (!user) {
            alert("Username या Password गलत है।");
            return;
        }
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                id: user.id,
                username: user.username,
                email: user.email
            })
        );
        showDashboard();
    });
}
// ---------- SHOW DASHBOARD ----------
function showDashboard() {
    if (authSection) authSection.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
    loadUserInfo();
    loadOrders();
}
// ---------- LOGOUT ----------
function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (dashboard) dashboard.style.display = "none";
    if (authSection) authSection.style.display = "block";
    alert("Logout हो गया।");
}
window.logout = logout;
// ---------- USER INFO ----------
function loadUserInfo() {
    const session = getSession();
    if (!session) return;
    const elements = document.querySelectorAll(
        ".username, #profileUsername, #welcomeUsername"
    );
    elements.forEach(el => {
        el.textContent = session.username;
    });
}
// ---------- ORDER ID ----------
function createOrderId() {
    const random = Math.floor(100000 + Math.random() * 900000);
    return "RSH" + Date.now().toString().slice(-6) + random;
}
// ---------- CREATE ORDER ----------
function createOrder(service, quantity, amount, instagramUsername) {
    const session = getSession();
    if (!session) {
        alert("पहले Login करें।");
        return;
    }
    if (!service) {
        alert("Service select करें।");
        return;
    }
    if (!quantity || Number(quantity) <= 0) {
        alert("Quantity सही डालें।");
        return;
    }
    if (!instagramUsername) {
        alert("Instagram Username डालें।");
        return;
    }
    const order = {
        id: Date.now(),
        orderId: createOrderId(),
        username: session.username,
        service: service,
        quantity: Number(quantity),
        instagramUsername: instagramUsername,
        amount: Number(amount),
        paymentStatus: "Pending",
        orderStatus: "New",
        createdAt: new Date().toLocaleString("en-IN")
    };
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    alert(
        "Order सफलतापूर्वक बन गया!\n\n" +
        "Order ID: " + order.orderId
    );
    loadOrders();
    sendOrderWhatsApp(order);
}
window.createOrder = createOrder;
// ---------- WHATSAPP ----------
function sendOrderWhatsApp(order) {
    const message =
        "🟢 RAHUL SOCIAL HUB - NEW ORDER\n\n" +
        "Order ID: " + order.orderId + "\n" +
        "Customer: " + order.username + "\n" +
        "Service: " + order.service + "\n" +
        "Quantity: " + order.quantity + "\n" +
        "Instagram: @" + order.instagramUsername.replace("@", "") + "\n" +
        "Amount: ₹" + order.amount + "\n" +
        "Payment: " + order.paymentStatus + "\n" +
        "Status: " + order.orderStatus + "\n\n" +
        "Please check this order.";
    const url =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(message);
    window.open(url, "_blank");
}
window.sendOrderWhatsApp = sendOrderWhatsApp;
// ---------- ORDER HISTORY ----------
function loadOrders() {
    const session = getSession();
    if (!session) return;
    const orders = getOrders().filter(
        order => order.username === session.username
    );
    const container =
        document.getElementById("orderHistory") ||
        document.getElementById("ordersList");
    if (!container) return;
    if (orders.length === 0) {
        container.innerHTML =
            "<p>No orders yet.</p>";
        return;
    }
    container.innerHTML = orders.map(order => {
        return `
            <div class="order-card">
                <div>
                    <strong>${escapeHTML(order.service)}</strong>
                </div>
                <div>
                    Order ID:
                    <strong>${escapeHTML(order.orderId)}</strong>
                </div>
                <div>
                    Quantity:
                    ${escapeHTML(String(order.quantity))}
                </div>
                <div>
                    Instagram:
                    @${escapeHTML(
                        order.instagramUsername.replace("@", "")
                    )}
                </div>
                <div>
                    Amount:
                    ₹${escapeHTML(String(order.amount))}
                </div>
                <div>
                    Payment:
                    <strong>${escapeHTML(order.paymentStatus)}</strong>
                </div>
                <div>
                    Status:
                    <strong>${escapeHTML(order.orderStatus)}</strong>
                </div>
                <small>
                    ${escapeHTML(order.createdAt)}
                </small>
            </div>
        `;
    }).join("");
}
// ---------- HTML SECURITY ----------
function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
// ---------- PAYMENT WHATSAPP ----------
function sendPaymentWhatsApp() {
    const session = getSession();
    if (!session) {
        alert("पहले Login करें।");
        return;
    }
    const orders = getOrders().filter(
        order => order.username === session.username
    );
    if (orders.length === 0) {
        alert("पहले Order बनाइए।");
        return;
    }
    const order = orders[0];
    const message =
        "💳 PAYMENT SCREENSHOT\n\n" +
        "Order ID: " + order.orderId + "\n" +
        "Customer: " + order.username + "\n" +
        "Service: " + order.service + "\n" +
        "Amount: ₹" + order.amount + "\n\n" +
        "मैं payment screenshot भेज रहा/रही हूँ।";
    const url =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(message);
    window.open(url, "_blank");
}
window.sendPaymentWhatsApp = sendPaymentWhatsApp;
// ---------- QR ----------
function openQR() {
    const qr = document.getElementById("qrScanner");
    if (qr) {
        qr.style.display =
            qr.style.display === "none" ? "block" : "none";
    }
}
window.openQR = openQR;
// ---------- AUTO LOGIN ----------
document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();
    if (session) {
        showDashboard();
    } else {
        if (dashboard) {
            dashboard.style.display = "none";
        }
        if (authSection) {
            authSection.style.display = "block";
        }
    }
});