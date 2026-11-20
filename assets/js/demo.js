/* Demo pages (/contoh/warungsari/ and /contoh/dasbor/).
   Nothing is stored or sent anywhere: the only outside request is a wa.me
   link the visitor taps. Orders stay in the WhatsApp chat (D-73), so there
   is no cart. */
(function () {
  "use strict";

  var BB = window.BB;
  if (!BB) return;
  var $ = BB.$, $$ = BB.$$, rupiah = BB.rupiah;
  var d = document;
  var root = d.documentElement;
  var data = {};
  try { data = JSON.parse(d.getElementById("demo-data").textContent); } catch (e) { return; }

  /* ---------- Free / Pro switch (demo bar) ---------- */
  var plan = root.getAttribute("data-plan") === "pro" ? "pro" : "free";
  var isPro = function () { return plan === "pro"; };
  function setPlan(p) {
    plan = p;
    root.setAttribute("data-plan", p);
    $$("[data-plan-set]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-plan-set") === p)); });
    try {
      var url = new URL(location.href);
      if (p === "pro") url.searchParams.set("paket", "pro");
      else url.searchParams.delete("paket");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) { /* old browser: the switch still works */ }
  }
  var isStore = Boolean($("[data-store]"));
  $$("[data-plan-set]").forEach(function (b) {
    b.addEventListener("click", function () {
      setPlan(b.getAttribute("data-plan-set"));
      if (isStore) {
        BB.toast(isPro() ? "Versi Pro: tanpa lencana, warna sendiri, promo dan label (segera)" : "Versi Gratis: semua fitur halaman, dengan lencana");
      } else {
        BB.toast(isPro() ? "Versi Pro: tanpa batas, statistik 90 hari, Insights (segera)" : "Versi Gratis: statistik 7 hari, Insights pratinjau");
      }
    });
  });
  setPlan(plan);

  /* ---------- Demo links and actions ---------- */
  d.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-demo-link], [data-report], [data-demo-action]") : null;
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute("data-demo-action")) BB.toast(t.getAttribute("data-demo-action"));
    else BB.toast(t.hasAttribute("data-report") ? "Contoh: di halaman asli, tombol ini membuka formulir laporan." : "Contoh link");
  });

  if (isStore) initStore();
  if ($("[data-dash]")) initDash();

  /* =================================================================== */
  /* Example page                                                        */
  /* =================================================================== */
  function initStore() {
    var items = {};
    data.items.forEach(function (it) { items[it.id] = it; });

    /* Category tabs */
    $$("[data-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var cat = tab.getAttribute("data-tab");
        $$("[data-tab]").forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
        $$("[data-grid] [data-item]").forEach(function (li) { li.hidden = cat !== "all" && li.getAttribute("data-cat") !== cat; });
      });
    });

    /* Item sheet: photo, name, price, description, "Tanya via WhatsApp" (F-07, F-08) */
    var sheetEl = $('[data-sheet="item"]');
    function openItem(id, from) {
      var it = items[id];
      var card = $('[data-item="' + id + '"]');
      var img = $("img", card);
      var imgEl = $("[data-item-img]", sheetEl);
      imgEl.hidden = !img;
      if (img) { imgEl.src = img.src; imgEl.alt = img.alt; }
      $("[data-item-name]", sheetEl).textContent = it.name;
      var priceEl = $("[data-item-price]", sheetEl);
      priceEl.classList.toggle("is-ask", !it.price);
      if (!it.price) priceEl.textContent = "Tanya harga";
      else if (isPro() && it.promoPrice) priceEl.innerHTML = "<s>" + rupiah(it.price) + "</s> " + rupiah(it.promoPrice) + ' <span class="tag tag--promo">Promo · segera</span>';
      else priceEl.textContent = rupiah(it.price);
      $("[data-item-desc]", sheetEl).textContent = it.description;
      $("[data-item-ask]", sheetEl).href = $("[data-ask-href]", card).getAttribute("data-ask-href");
      BB.sheet.open("item", from);
    }
    $$("[data-open-item]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); openItem(a.getAttribute("data-open-item"), a); });
    });
  }

  /* =================================================================== */
  /* Example dashboard: tabs #ringkasan, #statistik, #insights            */
  /* =================================================================== */
  function initDash() {
    var tabs = $$("[data-dash-tab]");
    function show(name, scroll) {
      if (!$('[data-panel="' + name + '"]')) name = "ringkasan";
      $$("[data-panel]").forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === name); });
      tabs.forEach(function (t) {
        if (t.getAttribute("data-dash-tab") === name) t.setAttribute("aria-current", "page");
        else t.removeAttribute("aria-current");
      });
      if (scroll) window.scrollTo(0, 0);
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        var name = t.getAttribute("data-dash-tab");
        if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + name);
        show(name, true);
      });
    });
    root.classList.add("dash-tabs");
    show(location.hash.slice(1));
  }
})();
