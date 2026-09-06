// ==========================================
// RAHUL SOCIAL HUB - ORDER SYSTEM
// D1 DATABASE + OFFLINE BACKUP
// ==========================================

const API_BASE =
  "https://rahulsocialhub-db.09rcrg.workers.dev";

// Owner WhatsApp number
// Customer को यह number website पर नहीं दिखेगा.
const OWNER_WHATSAPP = "919131922170";

// ==========================================
// SERVICES
// ==========================================

const SERVICES = {
  1: {
    name: "1,000 Followers",
    price: 50,
    unit: 1000,
    referral: false,
    lifetimeRefill: false
  },

  2: {
    name: "1,000 Followers - Lifetime Refill",
    price: 100,
    unit: 1000,
    referral: false,
    lifetimeRefill: true
  },

  3: {
    name: "1,000 Likes",
    price: 20,
    unit: 1000,
    referral: true,
    lifetimeRefill: false
  },

  4: {
    name: "1,000 Live",
    price: 10,
    unit: 1000,
    referral: false,
    lifetimeRefill: false
  },

  5: {
    name: "1,000 Shares",
    price: 20,
    unit: 1000,
    referral: false,
    lifetimeRefill: false
  },

  6: {
    name: "10,000 Views",
    price: 10,
    unit: 10000,
    referral: false,
    lifetimeRefill: false
  }
};


// ==========================================
// GENERATE ORDER ID
// ==========================================

function generateOrderId() {
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return "RH" + Date.now().toString().slice(-8) + random;
}


// ==========================================
// SAVE OFFLINE
// ==========================================

function saveOfflineOrder(order) {
  const orders =
    JSON.parse(localStorage.getItem("rahul_orders") || "[]");

  const exists = orders.some(
    item => item.id === order.id
  );

  if (!exists) {
    orders.unshift({
      ...order,
      syncStatus: "offline"
    });

    localStorage.setItem(
      "rahul_orders",
      JSON.stringify(orders)
    );
  }
}


// ==========================================
// SAVE ORDER TO LOCAL HISTORY
// ==========================================

function saveLocalOrder(order) {
  const orders =
    JSON.parse(localStorage.getItem("rahul_orders") || "[]");

  const index = orders.findIndex(
    item => item.id === order.id
  );

  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }

  localStorage.setItem(
    "rahul_orders",
    JSON.stringify(orders)
  );
}


// ==========================================
// SEND ORDER TO D1
// ==========================================

async function saveOrderToD1(order) {

  try {

    const response = await fetch(
      `${API_BASE}/api/orders`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(order)
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Database error"
      );
    }

    return true;

  } catch (error) {

    console.log(
      "D1 unavailable:",
      error.message
    );

    return false;
  }
}


// ==========================================
// WHATSAPP NOTIFICATION
// ==========================================

function sendOrderToWhatsApp(order) {

  const message = `
🚨 NEW ORDER - RAHUL SOCIAL HUB

🆔 Order ID:
${order.id}

📦 Service:
${order.serviceName}

🔢 Quantity:
${order.quantity}

📊 Units:
${order.units}

💰 Amount:
₹${order.amount}

👤 Customer:
${order.customerName || "Customer"}

📱 Username:
${order.username || "Not provided"}

📌 Status:
${order.status}

━━━━━━━━━━━━━━
Rahul Social Hub
  `.trim();

  const whatsappURL =
    `https://wa.me/${OWNER_WHATSAPP}?text=` +
    encodeURIComponent(message);

  window.open(
    whatsappURL,
    "_blank"
  );
}


// ==========================================
// CREATE ORDER
// ==========================================

async function createOrder(options = {}) {

  const serviceId =
    Number(options.serviceId);

  const quantity =
    Number(options.quantity || 1);

  const customerName =
    options.customerName || "";

  const username =
    options.username || "";

  const service =
    SERVICES[serviceId];

  if (!service) {
    alert("Service select करें");
    return null;
  }

  if (quantity < 1) {
    alert("Quantity कम से कम 1 होनी चाहिए");
    return null;
  }

  const units =
    service.unit * quantity;

  const amount =
    service.price * quantity;

  const order = {

    id: generateOrderId(),

    customerName,

    username,

    serviceId,

    serviceName: service.name,

    quantity,

    units,

    amount,

    referral: service.referral,

    lifetimeRefill:
      service.lifetimeRefill,

    status: "Pending",

    createdAt:
      new Date().toISOString()
  };


  // पहले local history
  saveLocalOrder(order);


  // D1 में save
  const online =
    await saveOrderToD1(order);


  if (online) {

    order.syncStatus = "synced";

    saveLocalOrder(order);

  } else {

    saveOfflineOrder(order);
  }


  // WhatsApp notification
  sendOrderToWhatsApp(order);


  // Order ID दिखाएं
  alert(
    "Order successfully placed!\\n\\n" +
    "Order ID: " +
    order.id +
    "\\n\\n" +
    "Status: Pending"
  );


  return order;
}


// ==========================================
// GET ORDER FROM D1
// ==========================================

async function getOrderFromD1(orderId) {

  try {

    const response =
      await fetch(
        `${API_BASE}/api/orders/${encodeURIComponent(orderId)}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      return null;
    }

    return data.order;

  } catch (error) {

    console.log(
      "Unable to load order:",
      error.message
    );

    return null;
  }
}


// ==========================================
// GET LOCAL ORDER
// ==========================================

function getLocalOrder(orderId) {

  const orders =
    JSON.parse(
      localStorage.getItem("rahul_orders") ||
      "[]"
    );

  return (
    orders.find(
      order => order.id === orderId
    ) || null
  );
}


// ==========================================
// GET ORDER
// ONLINE FIRST
// ==========================================

async function getOrder(orderId) {

  const onlineOrder =
    await getOrderFromD1(orderId);

  if (onlineOrder) {
    return onlineOrder;
  }

  return getLocalOrder(orderId);
}


// ==========================================
// UPDATE ORDER STATUS LOCALLY
// ==========================================

function updateLocalOrderStatus(
  orderId,
  status
) {

  const orders =
    JSON.parse(
      localStorage.getItem("rahul_orders") ||
      "[]"
    );

  const index =
    orders.findIndex(
      order => order.id === orderId
    );

  if (index === -1) {
    return false;
  }

  orders[index].status = status;

  orders[index].updatedAt =
    new Date().toISOString();

  localStorage.setItem(
    "rahul_orders",
    JSON.stringify(orders)
  );

  return true;
}


// ==========================================
// ORDER HISTORY
// ==========================================

function getOrderHistory() {

  return JSON.parse(
    localStorage.getItem("rahul_orders") ||
    "[]"
  );
}


// ==========================================
// CREATE CUSTOMER QR URL
// ==========================================

function getOrderQRUrl(orderId) {

  const base =
    window.location.origin;

  return (
    `${base}/customer.html?order=` +
    encodeURIComponent(orderId)
  );
}


// ==========================================
// SYNC OFFLINE ORDERS
// ==========================================

async function syncOfflineOrders() {

  const orders =
    JSON.parse(
      localStorage.getItem("rahul_orders") ||
      "[]"
    );

  let synced = 0;

  for (const order of orders) {

    if (
      order.syncStatus === "synced"
    ) {
      continue;
    }

    const success =
      await saveOrderToD1(order);

    if (success) {

      order.syncStatus =
        "synced";

      synced++;
    }
  }

  localStorage.setItem(
    "rahul_orders",
    JSON.stringify(orders)
  );

  return synced;
}


// ==========================================
// AUTO SYNC WHEN INTERNET RETURNS
// ==========================================

window.addEventListener(
  "online",
  async () => {

    console.log(
      "Internet वापस आ गया — orders syncing..."
    );

    const count =
      await syncOfflineOrders();

    if (count > 0) {

      console.log(
        `${count} order synced`
      );
    }
  }
);


// ==========================================
// GLOBAL ACCESS
// ==========================================

window.RahulOrders = {

  SERVICES,

  createOrder,

  getOrder,

  getOrderFromD1,

  getLocalOrder,

  getOrderHistory,

  updateLocalOrderStatus,

  getOrderQRUrl,

  syncOfflineOrders
};