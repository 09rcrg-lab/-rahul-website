/* =========================================
   RAHUL SOCIAL HUB
   ORDER + QR + LOCAL STORAGE SYSTEM
========================================= */

const STORAGE_KEY = "rahul_orders";

/* -----------------------------------------
   SERVICES
----------------------------------------- */

const SERVICES = [
  {
    id: "followers50",
    name: "1,000 Followers",
    price: 50,
    quantity: 1000,
    referral: false,
    refill: false
  },
  {
    id: "followers100",
    name: "1,000 Followers",
    price: 100,
    quantity: 1000,
    referral: false,
    refill: true
  },
  {
    id: "likes20",
    name: "1,000 Likes",
    price: 20,
    quantity: 1000,
    referral: true,
    refill: false
  },
  {
    id: "live10",
    name: "1,000 Live",
    price: 10,
    quantity: 1000,
    referral: false,
    refill: false
  },
  {
    id: "shares20",
    name: "1,000 Shares",
    price: 20,
    quantity: 1000,
    referral: false,
    refill: false
  },
  {
    id: "views10",
    name: "10,000 Views",
    price: 10,
    quantity: 10000,
    referral: false,
    refill: false
  }
];


/* -----------------------------------------
   STORAGE
----------------------------------------- */

function getOrders() {

  try {

    const data =
      localStorage.getItem(STORAGE_KEY);

    return data ? JSON.parse(data) : [];

  } catch (error) {

    console.error("Storage error:", error);

    return [];

  }
}


function saveOrders(orders) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders)
  );

}


/* -----------------------------------------
   ORDER ID
----------------------------------------- */

function generateOrderId() {

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return "RH" + Date.now().toString().slice(-6) + random;

}


/* -----------------------------------------
   CREATE ORDER
----------------------------------------- */

function createNewOrder({
  customerName,
  username,
  serviceId,
  quantity
}) {

  const service =
    SERVICES.find(
      item => item.id === serviceId
    );


  if (!service) {
    throw new Error("Service not found");
  }


  const qty =
    Number(quantity);


  if (!qty || qty < 1) {
    throw new Error("Invalid quantity");
  }


  const units =
    service.quantity * qty;


  const total =
    service.price * qty;


  const order = {

    id: generateOrderId(),

    customerName:
      customerName.trim(),

    username:
      username.trim(),

    serviceId:
      service.id,

    serviceName:
      service.name,

    quantity:
      qty,

    units:
      units,

    amount:
      total,

    referral:
      service.referral,

    lifetimeRefill:
      service.refill,

    status:
      "Pending",

    createdAt:
      new Date().toISOString()

  };


  const orders =
    getOrders();


  orders.unshift(order);

  saveOrders(orders);


  return order;

}


/* -----------------------------------------
   FIND ORDER
----------------------------------------- */

function findOrder(orderId) {

  if (!orderId) {
    return null;
  }


  const cleanId =
    String(orderId)
      .trim()
      .toUpperCase();


  return getOrders().find(
    order =>
      String(order.id)
        .toUpperCase() === cleanId
  ) || null;

}


/* -----------------------------------------
   UPDATE ORDER STATUS
----------------------------------------- */

function updateOrderStatus(
  orderId,
  newStatus
) {

  const orders =
    getOrders();


  const index =
    orders.findIndex(
      order =>
        order.id === orderId
    );


  if (index === -1) {
    return false;
  }


  orders[index].status =
    newStatus;


  orders[index].updatedAt =
    new Date().toISOString();


  saveOrders(orders);

  return true;

}


/* -----------------------------------------
   STATUS TEXT
----------------------------------------- */

function getStatusText(status) {

  const statusMap = {

    Pending:
      "⏳ Order Pending",

    Processing:
      "⚙️ Order Processing",

    Completed:
      "✅ Order Completed",

    Cancelled:
      "❌ Order Cancelled"

  };


  return (
    statusMap[status] ||
    status
  );

}


/* -----------------------------------------
   CUSTOMER ORDER PAGE
----------------------------------------- */

function showCustomerOrder(order) {

  const box =
    document.getElementById(
      "customerOrder"
    );


  if (!box) {
    return;
  }


  if (!order) {

    box.innerHTML = `
      <div class="order">
        <h3>❌ Order नहीं मिला</h3>
        <p>
          कृपया सही Order ID से QR खोलें।
        </p>
      </div>
    `;

    return;

  }


  box.innerHTML = `

    <div class="order">

      <div class="order-id">
        Order ID: ${escapeHTML(order.id)}
      </div>

      <h3>
        ${escapeHTML(order.serviceName)}
      </h3>

      <p>
        📦 Quantity:
        ${order.quantity}
      </p>

      <p>
        🔢 Total Units:
        ${Number(order.units)
          .toLocaleString("en-IN")}
      </p>

      <p>
        💰 Amount:
        ₹${Number(order.amount)
          .toLocaleString("en-IN")}
      </p>

      <p>
        📊 Status:
        <strong>
          ${getStatusText(order.status)}
        </strong>
      </p>

      ${
        order.lifetimeRefill
        ? `
          <p>
            ♾️ Lifetime Refill:
            Available
          </p>
        `
        : ""
      }

      <p class="small">
        Order Date:
        ${formatDate(order.createdAt)}
      </p>

    </div>

  `;

}


/* -----------------------------------------
   QR URL
----------------------------------------- */

function getOrderQRUrl(orderId) {

  const base =
    window.location.origin +
    window.location.pathname;


  return (
    base +
    "?order=" +
    encodeURIComponent(orderId)
  );

}


/* -----------------------------------------
   GENERATE QR
----------------------------------------- */

function generateOrderQR(orderId) {

  const qrImage =
    document.getElementById(
      "qrImage"
    );


  if (!qrImage) {
    return;
  }


  const url =
    getOrderQRUrl(orderId);


  qrImage.src =
    "https://api.qrserver.com/v1/create-qr-code/" +
    "?size=300x300&data=" +
    encodeURIComponent(url);

}


/* -----------------------------------------
   CHECK QR URL
----------------------------------------- */

function checkOrderFromURL() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const orderId =
    params.get("order");


  if (!orderId) {
    return;
  }


  const order =
    findOrder(orderId);


  showCustomerOrder(order);

}


/* -----------------------------------------
   WHATSAPP
----------------------------------------- */

function sendOrderToWhatsApp(order) {

  /*
    यह नंबर केवल owner notification
    के लिए है।

    Customer page पर इसे display
    नहीं किया जाता।
  */

  const ownerNumber =
    "919131922170";


  const message = `
🛒 नया Order

Order ID: ${order.id}

Service:
${order.serviceName}

Username:
${order.username}

Quantity:
${order.quantity}

Total Units:
${order.units}

Amount:
₹${order.amount}

Referral:
${order.referral ? "हाँ" : "नहीं"}

Lifetime Refill:
${order.lifetimeRefill ? "हाँ" : "नहीं"}

Status:
${order.status}
`;


  const url =
    "https://wa.me/" +
    ownerNumber +
    "?text=" +
    encodeURIComponent(message);


  window.open(
    url,
    "_blank"
  );

}


/* -----------------------------------------
   DATE
----------------------------------------- */

function formatDate(date) {

  if (!date) {
    return "-";
  }


  try {

    return new Date(date)
      .toLocaleString(
        "hi-IN",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );

  } catch {

    return date;

  }

}


/* -----------------------------------------
   SECURITY
----------------------------------------- */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* -----------------------------------------
   EXPORT ORDERS
----------------------------------------- */

function exportOrders() {

  const orders =
    getOrders();


  const blob =
    new Blob(
      [
        JSON.stringify(
          orders,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const a =
    document.createElement("a");


  a.href = url;

  a.download =
    "rahul-social-hub-orders.json";


  a.click();


  URL.revokeObjectURL(url);

}


/* -----------------------------------------
   IMPORT ORDERS
----------------------------------------- */

function importOrders(file) {

  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    function () {

      try {

        const orders =
          JSON.parse(
            reader.result
          );


        if (!Array.isArray(orders)) {
          throw new Error();
        }


        saveOrders(orders);


        alert(
          "Order History वापस आ गई।"
        );


        location.reload();


      } catch {

        alert(
          "गलत backup file है।"
        );

      }

    };


  reader.readAsText(file);

}


/* -----------------------------------------
   START
----------------------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    checkOrderFromURL();

  }
);


/*
-------------------------------------------
IMPORTANT

Customer को:
- Owner WhatsApp number
- Owner phone number
- Internal order data

नहीं दिखाया जाता।

Customer QR खोलने पर केवल:
- Order ID
- Service
- Quantity
- Amount
- Status
- Refill information

दिखेगी।
-------------------------------------------
*/