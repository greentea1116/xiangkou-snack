const base = window.XIANGKOU_CONFIG.API_BASE_URL;
let token = sessionStorage.getItem("xiangkouAdmin") || "";
let catalog = [];
const status = document.querySelector("#status");
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
function setLoggedIn(value) {
  document.querySelector("#loginForm").hidden = value;
  document.querySelector("#management").hidden = !value;
  document.querySelector("#logout").hidden = !value;
}
async function api(path, method = "GET", body) {
  const response = await fetch(base + path, { method, cache:"no-store",
    headers:{ "Content-Type":"application/json", Authorization:"Bearer " + token },
    ...(body ? {body:JSON.stringify(body)} : {}) });
  let data; try { data = await response.json(); } catch { throw new Error("管理服務尚未更新完成，請先完成後端設定。"); }
  if (!response.ok) {
    if (response.status === 401) { token=""; sessionStorage.removeItem("xiangkouAdmin"); setLoggedIn(false); }
    throw new Error(data.error || "管理服務暫時無法使用。");
  }
  return data;
}
function render() {
  const category = document.querySelector("#category").value;
  document.querySelector("#products").innerHTML = catalog.filter((p) => !category || p.category === category).map((p) => `
    <form class="item-card inventory-form" data-id="${escape(p.id)}">
      <h3>${escape(p.name)}</h3><p>NT$${p.price}／${escape(p.unit)} · 目前 ${p.remaining === null ? "不限量" : "剩 " + p.remaining + " " + escape(p.unit)}</p>
      <label class="switch-label"><input type="checkbox" name="enabled" ${p.enabled ? "checked" : ""}>供應中</label>
      <label class="switch-label"><input type="checkbox" name="limited" ${p.remaining !== null ? "checked" : ""}>限量供應</label>
      <label>目前剩餘（${escape(p.unit)}）<input type="number" name="remaining" min="0" max="100000" step="1" value="${p.remaining ?? 0}" ${p.remaining === null ? "disabled" : "required"}></label>
      <button class="stock-btn" type="submit">儲存</button>
    </form>`).join("");
}
async function load() {
  const [data, inbox] = await Promise.all([api("/api/catalog"), api("/api/admin/orders")]);
  catalog = data.products; setLoggedIn(true); render();
  document.querySelector("#orders").innerHTML = inbox.orders.length ? inbox.orders.map((order) => `
    <article class="order-card"><strong>${escape(order.id)} · NT$${order.total} · ${order.cancelled ? "已取消" : "已收單"}</strong>
    <p>${escape(order.name)}／${escape(order.phone)}／${escape(order.pickupTime)}</p>
    <p>${order.items.map((i)=>escape(i.name)+" × "+i.quantity).join("<br>")}</p><p>${escape(order.note)}</p>
    ${order.cancelled ? "" : `<button type="button" class="stock-btn secondary" data-cancel="${escape(order.id)}">取消訂單並補回庫存</button>`}</article>`).join("") : "<p>目前沒有訂單。</p>";
  status.textContent = "資料已同步。";
}
document.querySelector("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault(); const button=event.currentTarget.querySelector("button"); button.disabled=true;
  try {
    const data=await api("/api/admin/login","POST",{password:new FormData(event.currentTarget).get("password")});
    token=data.token; sessionStorage.setItem("xiangkouAdmin",token);
    document.querySelector("#loginForm").reset(); await load();
  } catch (error) { status.textContent=error.message; } finally { button.disabled=false; }
});
document.querySelector("#products").addEventListener("change",(event)=>{
  if(event.target.name==="limited") {
    const input=event.target.form.elements.remaining;
    input.disabled=!event.target.checked; input.required=event.target.checked;
  }
});
document.querySelector("#products").addEventListener("submit",async(event)=>{
  event.preventDefault(); const form=event.target; const product=catalog.find((p)=>p.id===form.dataset.id);
  const button=form.querySelector("button"); button.disabled=true;
  try {
    await api("/api/admin/products/"+encodeURIComponent(product.id),"PATCH",{
      enabled:form.elements.enabled.checked,
      remaining:form.elements.limited.checked ? Number(form.elements.remaining.value) : null,revision:product.revision });
    await load();
  } catch(error) { status.textContent=error.message; } finally { button.disabled=false; }
});
document.querySelector("#orders").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-cancel]"); if(!button || !confirm("取消此訂單並補回庫存？"))return;
  button.disabled=true;
  try { await api("/api/admin/orders/"+encodeURIComponent(button.dataset.cancel)+"/cancel","POST"); await load(); }
  catch(error) {status.textContent=error.message;button.disabled=false;}
});
document.querySelector("#category").addEventListener("change",render);
document.querySelector("#refresh").addEventListener("click",()=>load().catch((e)=>status.textContent=e.message));
document.querySelector("#logout").addEventListener("click",async()=>{
  try { await api("/api/admin/logout","POST"); } catch {}
  token="";sessionStorage.removeItem("xiangkouAdmin");setLoggedIn(false);status.textContent="已登出。";
});
if(token)load().catch((e)=>status.textContent=e.message);
