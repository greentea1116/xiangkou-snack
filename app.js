const products = [
  {
    id: "crispy-original-cake",
    category: "cake",
    name: "原味脆皮雞蛋糕",
    desc: "外層薄脆、內裡鬆軟，經典原味最耐吃。",
    price: 50
  },
  {
    id: "crispy-matcha-cake",
    category: "cake",
    name: "抹茶脆皮雞蛋糕",
    desc: "淡淡茶香搭配脆皮口感，甜度清爽。",
    price: 60
  },
  {
    id: "crispy-chocolate-cake",
    category: "cake",
    name: "巧克力脆皮雞蛋糕",
    desc: "濃郁巧克力香，適合想吃甜一點的時候。",
    price: 60
  },
  {
    id: "limited-luwei",
    category: "luwei",
    name: "每日限量滷味",
    desc: "每日新鮮滷製，品項依當日供應為準。",
    price: 100
  }
];

const cart = {};
const stock = JSON.parse(localStorage.getItem("xiangkouStock") || '{"limited-luwei":12}');
let filter = "all";

const menuGrid = document.querySelector("#menuGrid");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const toast = document.querySelector("#toast");
const pickupHour = document.querySelector("#pickupHour");
const pickupMinute = document.querySelector("#pickupMinute");

function money(value) {
  return `NT$${value}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 4800);
}

function setQuantity(id, nextQuantity) {
  const available = stock[id];
  if (typeof available === "number" && nextQuantity > available) {
    showToast(`每日限量滷味目前只剩 ${available} 份。`);
    return;
  }
  cart[id] = Math.max(0, nextQuantity);
  if (cart[id] === 0) {
    delete cart[id];
  }
  renderMenu();
  renderCart();
}

function saveStock() {
  localStorage.setItem("xiangkouStock", JSON.stringify(stock));
}

function getCartRows() {
  return Object.entries(cart).map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return { ...product, quantity, subtotal: product.price * quantity };
  });
}

function renderPickupTimeOptions() {
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
  const visibleProducts = products.filter((product) => filter === "all" || product.category === filter);
  menuGrid.innerHTML = visibleProducts.map((product) => {
    const quantity = cart[product.id] || 0;
    const available = stock[product.id];
    const hasStockLimit = typeof available === "number";
    const soldOut = hasStockLimit && available === 0;
    const stockLabel = hasStockLimit
      ? `<span class="stock-badge ${soldOut ? "empty" : ""}">${soldOut ? "已售完" : `剩 ${available} 份`}</span>`
      : "";
    return `
      <article class="item-card ${soldOut ? "sold-out" : ""}">
        <div class="item-top">
          <div>
            <h3 class="item-name">${product.name}</h3>
            <p class="item-desc">${product.desc}</p>
          </div>
          <span class="price">${money(product.price)}</span>
        </div>
        ${stockLabel}
        <div class="quantity">
          <span>數量</span>
          <div class="stepper" aria-label="${product.name} 數量">
            <button type="button" data-action="decrease" data-id="${product.id}" aria-label="減少 ${product.name}">−</button>
            <span>${quantity}</span>
            <button type="button" data-action="increase" data-id="${product.id}" aria-label="增加 ${product.name}" ${soldOut || quantity >= available ? "disabled" : ""}>＋</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderCart() {
  const rows = getCartRows();

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
    </div>
  `).join("");

  const total = rows.reduce((sum, row) => sum + row.subtotal, 0);
  cartTotal.textContent = money(total);
}

document.querySelector("#menuGrid").addEventListener("click", (event) => {
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

document.querySelector("#pickupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const submitButton = formElement.querySelector('button[type="submit"]');
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

  const form = new FormData(formElement);
  const rows = getCartRows();
  const total = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const pickupTime = `今天 ${form.get("pickupHour")}:${form.get("pickupMinute")}`;
  const order = {
    id: `XK${Date.now().toString().slice(-8)}`,
    createdAt: new Date().toLocaleString("zh-TW", { hour12: false }),
    name: String(form.get("name")).trim(),
    phone: String(form.get("phone")).trim(),
    pickupTime,
    note: String(form.get("note") || "無").trim() || "無",
    items: rows.map(({ name, price, quantity, subtotal }) => ({ name, price, quantity, subtotal })),
    total
  };
  const apiBaseUrl = window.XIANGKOU_CONFIG?.API_BASE_URL;
  if (!apiBaseUrl) {
    showToast("訂單通知尚未設定，請稍後再試。");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "送出中…";
  try {
    const response = await fetch(`${apiBaseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error("訂單通知服務暫時無法使用");
    }
    if (result.lineNotified !== true) {
      showToast("訂單資料已到達後端，但 LINE 尚未確認通知。請先查看官方 LINE，避免重複送單。");
      return;
    }

    Object.entries(cart).forEach(([id, quantity]) => {
      if (typeof stock[id] === "number") {
        stock[id] = Math.max(0, stock[id] - quantity);
      }
      delete cart[id];
    });
    localStorage.setItem("xiangkouStock", JSON.stringify(stock));
    renderMenu();
    renderCart();
    formElement.reset();
    showToast(`${order.name} 的預約已通知店家 LINE：${pickupTime} 取餐，總金額 ${money(total)}。`);
  } catch (error) {
    console.warn(error);
    showToast("目前無法確認訂單是否送達，請先查看官方 LINE，再決定是否重送。");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "確認預約取餐";
  }
});

renderMenu();
renderCart();
renderPickupTimeOptions();
