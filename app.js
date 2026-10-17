const products = window.XIANGKOU_PRODUCTS;

let cart;
try { cart = JSON.parse(localStorage.getItem("xiangkouCart") || "{}"); } catch { cart = {}; }
if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};
Object.keys(cart).forEach((id) => {
  if (!products.some((p) => p.id === id) || !Number.isSafeInteger(cart[id]) || cart[id] < 1) delete cart[id];
});
const stock = {};
let inventoryReady = !window.XIANGKOU_CONFIG?.INVENTORY_ENABLED;
let refreshing = false;
let submitting = false;
async function refreshInventory() {
  if (!window.XIANGKOU_CONFIG?.INVENTORY_ENABLED || refreshing || submitting) return;
  refreshing = true;
  try {
    const response = await fetch(`${apiBaseUrl}/api/catalog`, { cache: "no-store" });
    if (!response.ok) throw new Error("庫存連線失敗");
    const data = await response.json();
    if (!Array.isArray(data.products) || !data.products.length) throw new Error("庫存資料不完整");
    for (const product of products) {
      const live = data.products.find((p) => p.id === product.id);
      product.enabled = live?.enabled === true;
      stock[product.id] = live?.remaining ?? undefined;
    }
    inventoryReady = true;
    const status = document.querySelector("#inventoryStatus");
    if (status) status.textContent = "庫存已同步";
  } catch {
    inventoryReady = false;
    const status = document.querySelector("#inventoryStatus");
    if (status) status.textContent = "暫時無法同步庫存，請稍後重試";
  } finally {
    refreshing = false;
    renderMenu(); renderCart();
  }
}
let filter = document.body.dataset.category || "cake";

const menuGrid = document.querySelector("#menuGrid");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const toast = document.querySelector("#toast");
const apiBaseUrl = window.XIANGKOU_CONFIG?.API_BASE_URL || "";
const pickupHour = document.querySelector("#pickupHour");
const pickupMinute = document.querySelector("#pickupMinute");
if (window.XIANGKOU_CONFIG?.INVENTORY_ENABLED) {
  const status = document.createElement("p");
  status.id = "inventoryStatus";
  status.className = "inventory-status";
  status.setAttribute("role", "status");
  status.textContent = "庫存連線中…";
  document.querySelector(".notice")?.append(status);
}

function money(value) {
  return `NT$${value}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setQuantity(id, nextQuantity) {
  if (submitting) return;
  if (nextQuantity > (cart[id] || 0) && (!inventoryReady || products.find((p) => p.id === id)?.enabled === false)) {
    showToast("此品項暫停供應或庫存尚未連線。"); return;
  }
  const available = stock[id];
  if (typeof available === "number" && nextQuantity > available) {
    showToast(`${products.find((product) => product.id === id).name} 目前只剩 ${available} 份。`);
    return;
  }
  cart[id] = Math.max(0, nextQuantity);
  if (cart[id] === 0) {
    delete cart[id];
  }
  renderMenu();
  renderCart();
  localStorage.setItem("xiangkouCart", JSON.stringify(cart));
}

function saveStock() {
  localStorage.setItem("xiangkouStock", JSON.stringify(stock));
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem("xiangkouOrders") || "[]");
  orders.unshift(order);
  localStorage.setItem("xiangkouOrders", JSON.stringify(orders.slice(0, 30)));
}

async function sendOrderToBackend(order) {
  if (!apiBaseUrl) {
    return { sent: false, reason: "API_BASE_URL is not set" };
  }

  const response = await fetch(`${apiBaseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "訂單通知後端暫時無法使用");
  return result;
}

function getCartRows() {
  return Object.entries(cart).map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return { ...product, quantity, subtotal: product.price * quantity };
  });
}

function renderPickupTimeOptions() {
  if (!pickupHour || !pickupMinute) return;
  pickupHour.innerHTML = `<option value="">時</option>`;
  for (let hour = 15; hour <= 19; hour += 1) {
    const label = `${String(hour).padStart(2, "0")} 時`;
    pickupHour.insertAdjacentHTML("beforeend", `<option value="${String(hour).padStart(2, "0")}">${label}</option>`);
  }

  pickupMinute.innerHTML = `<option value="">分</option>`;
  for (let minute = 0; minute <= 59; minute += 1) {
    const value = String(minute).padStart(2, "0");
    pickupMinute.insertAdjacentHTML("beforeend", `<option value="${value}">${value} 分</option>`);
  }
}

function renderMenu() {
  if (!menuGrid) return;
  const visibleProducts = products.filter((product) => filter === "all" || product.category === filter);
  menuGrid.innerHTML = visibleProducts.map((product) => {
    const quantity = cart[product.id] || 0;
    const available = stock[product.id];
    const hasStockLimit = typeof available === "number";
    const soldOut = product.enabled === false || hasStockLimit && available === 0;
    const stockLabel = hasStockLimit
      ? `<span class="stock-badge ${soldOut ? "empty" : ""}">${product.enabled === false ? "暫停供應" : soldOut ? "已售完" : `剩 ${available} ${product.unit}`}</span>`
      : product.enabled === false ? '<span class="stock-badge empty">暫停供應</span>' : "";
    return `
      <article class="item-card ${soldOut ? "sold-out" : ""}">
        <div class="item-top">
          <div>
            <h3 class="item-name">${product.name}</h3>
            <p class="item-desc">${product.desc}</p>
          </div>
          <span class="price">${money(product.price)}<small>／${product.unit}</small></span>
        </div>
        ${stockLabel}
        <div class="quantity">
          <span>數量</span>
          <div class="stepper" aria-label="${product.name} 數量">
            <button type="button" data-action="decrease" data-id="${product.id}" aria-label="減少 ${product.name}">−</button>
            <span>${quantity}</span>
            <button type="button" data-action="increase" data-id="${product.id}" aria-label="增加 ${product.name}" ${!inventoryReady || soldOut || quantity >= available ? "disabled" : ""}>＋</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderCart() {
  const rows = getCartRows();
  const total = rows.reduce((sum, row) => sum + row.subtotal, 0);
  document.querySelectorAll("[data-cart-summary]").forEach((element) => {
    element.textContent = `購物車 ${rows.reduce((sum, row) => sum + row.quantity, 0)} 件 · ${money(total)}`;
  });
  if (!cartItems) return;

  if (rows.length === 0) {
    cartItems.innerHTML = `<p class="cart-empty">目前尚未加入商品。選好後會在這裡看到小計。</p>`;
    cartTotal.textContent = money(0);
    return;
  }

  cartItems.innerHTML = rows.map((row) => `
    <div class="cart-row">
      <div>
        <strong>${row.name}</strong>
        <small>${money(row.price)} × ${row.quantity}</small>
      </div>
      <strong>${money(row.subtotal)}</strong>
      <div class="stepper">
        <button type="button" data-action="decrease" data-id="${row.id}" aria-label="減少 ${row.name}">−</button>
        <span>${row.quantity}</span>
        <button type="button" data-action="increase" data-id="${row.id}" aria-label="增加 ${row.name}">＋</button>
      </div>
    </div>
  `).join("");

  cartTotal.textContent = money(total);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const productId = button.dataset.id;
  const current = cart[productId] || 0;
  setQuantity(productId, button.dataset.action === "increase" ? current + 1 : current - 1);
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    filter = tab.dataset.filter;
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    renderMenu();
  });
});

document.querySelector("#pickupForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const pickupForm = event.currentTarget;
  if (submitting) return;
  await refreshInventory();
  if (!inventoryReady || Object.keys(cart).some((id) => products.find((p) => p.id === id)?.enabled === false)) {
    showToast("庫存尚未連線或餐點已停售，請調整餐點後再送單。"); return;
  }
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  if (count === 0) {
    showToast("請先加入至少一項商品，再確認預約取餐。");
    return;
  }
  const overStockItem = Object.entries(cart).find(([id, quantity]) => typeof stock[id] === "number" && quantity > stock[id]);
  if (overStockItem) {
    const product = products.find((item) => item.id === overStockItem[0]);
    showToast(`${product.name} 庫存不足，請調整數量。`);
    return;
  }
  const form = new FormData(event.currentTarget);
  const rows = getCartRows();
  const total = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const pickupTime = `今天 ${form.get("pickupHour")}:${form.get("pickupMinute")}`;
  const order = {
    id: crypto.randomUUID(),
    createdAt: new Date().toLocaleString("zh-TW", { hour12: false }),
    name: form.get("name"),
    phone: form.get("phone"),
    pickupTime,
    note: "【籌備中測試單，請勿製作】" + (form.get("note") || "無"),
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      quantity: row.quantity,
      subtotal: row.subtotal
    })),
    total
  };
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  if (submitButton.disabled) return;
  const signature = JSON.stringify([order.name, order.phone, order.pickupTime, order.note, order.items]);
  const pending = JSON.parse(sessionStorage.getItem("xiangkouPendingOrder") || "null");
  if (pending?.signature === signature) order.id = pending.id;
  sessionStorage.setItem("xiangkouPendingOrder", JSON.stringify({ signature, id: order.id }));
  submitting = true;
  submitButton.disabled = true;
  submitButton.textContent = "測試訂單傳送中…";
  let result;
  try {
    result = await sendOrderToBackend(order);
    if (!result.sent && !result.ok) throw new Error("後端尚未確認收單");
  } catch (error) {
    showToast(error.message + " 已保留餐點。");
    return;
  } finally {
    submitting = false;
    submitButton.disabled = false;
    submitButton.textContent = "送出測試訂單";
  }
  Object.entries(cart).forEach(([id, quantity]) => {
    if (typeof stock[id] === "number") {
      stock[id] = Math.max(0, stock[id] - quantity);
    }
    delete cart[id];
  });
  sessionStorage.removeItem("xiangkouPendingOrder");
  localStorage.setItem("xiangkouCart", JSON.stringify(cart));
  saveOrder(order);
  renderMenu();
  renderCart();
  pickupForm.reset();
  await refreshInventory();
  const notice = result.lineNotified ? "LINE 通知已送出。" : "後端已收單，但 LINE 通知未確認。";
  showToast(`測試單已建立，總金額 ${money(order.total)}。${notice} 籌備中，請勿前往取餐。`);
});

renderMenu();
renderCart();
renderPickupTimeOptions();
refreshInventory();
setInterval(refreshInventory, 15000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshInventory(); });
window.addEventListener("pageshow", refreshInventory);
