/* Demo pages (/contoh/kueburina/ and /contoh/dasbor/).
   Everything stays in this browser tab: the cart and the orders sent from the
   demo shop live in sessionStorage (as on the real shop page, 117b §5) and
   nothing is sent anywhere except the wa.me link the visitor taps. */
(function () {
  "use strict";

  var BB = window.BB;
  if (!BB) return;
  var $ = BB.$, $$ = BB.$$, store = BB.store, rupiah = BB.rupiah;
  var d = document;
  var root = d.documentElement;
  var data = {};
  try { data = JSON.parse(d.getElementById("demo-data").textContent); } catch (e) { return; }

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  var waHref = function (text) {
    return "https://wa.me/" + (data.merchantWa || "") + "?text=" + encodeURIComponent(text);
  };

  /* ---------- Free / Pro switch (demo bar) ---------- */
  var plan = root.getAttribute("data-plan") === "pro" ? "pro" : "free";
  var isPro = function () { return plan === "pro"; };
  var planListeners = [];
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
    planListeners.forEach(function (fn) { fn(p); });
  }
  $$("[data-plan-set]").forEach(function (b) {
    b.addEventListener("click", function () {
      setPlan(b.getAttribute("data-plan-set"));
      BB.toast(plan === "pro" ? "Versi Pro: keranjang dan pesanan via WhatsApp" : "Versi Gratis: tanya per produk via WhatsApp");
    });
  });
  setPlan(plan);

  /* ---------- Demo links ---------- */
  d.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-demo-link], [data-report]") : null;
    if (!t) return;
    e.preventDefault();
    BB.toast(t.hasAttribute("data-report") ? "Contoh: di halaman asli, tombol ini membuka formulir laporan." : "Contoh link");
  });

  /* ---------- Orders saved by the demo shop in this tab ---------- */
  var ORDERS_KEY = "bb-demo-orders";
  var NEXT_KEY = "bb-demo-next-order";
  var STATUS_KEY = "bb-demo-status";
  var nextOrderNo = function () { return parseInt(store.get(NEXT_KEY), 10) || data.nextOrderNo; };

  if ($("[data-store]")) initStore();
  if ($("[data-dash]")) initDash();

  /* =================================================================== */
  /* Storefront                                                          */
  /* =================================================================== */
  function initStore() {
    var items = {};
    data.items.forEach(function (it) { items[it.id] = it; });
    var cart = store.json("bb-demo-cart", {});
    Object.keys(cart).forEach(function (id) { if (!items[id] || !(cart[id] > 0)) delete cart[id]; });

    var save = function () { store.setJson("bb-demo-cart", cart); };
    var lines = function () {
      // In the order the buyer added them (object keys keep insertion order).
      return Object.keys(cart).filter(function (id) { return cart[id] > 0; }).map(function (id) { return { item: items[id], qty: cart[id] }; });
    };
    var count = function () { return lines().reduce(function (n, l) { return n + l.qty; }, 0); };
    var totals = function () {
      var sum = 0, unpriced = false;
      lines().forEach(function (l) { if (l.item.price) sum += l.item.price * l.qty; else unpriced = true; });
      return { sum: sum, unpriced: unpriced };
    };
    // "Rp440.000", "Rp440.000 + harga via chat" or "harga via chat"
    var totalText = function () {
      var t = totals();
      if (!t.sum && t.unpriced) return "harga via chat";
      return rupiah(t.sum) + (t.unpriced ? " + harga via chat" : "");
    };

    /* Category tabs */
    $$("[data-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var cat = tab.getAttribute("data-tab");
        $$("[data-tab]").forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
        $$("[data-grid] [data-item]").forEach(function (li) { li.hidden = cat !== "all" && li.getAttribute("data-cat") !== cat; });
      });
    });

    /* Item sheet */
    var sheetEl = $('[data-sheet="item"]');
    var currentId = null;
    var qty = 1;
    var setQty = function (q) { qty = Math.max(1, Math.min(99, q)); $("[data-item-qty]", sheetEl).textContent = qty; };
    function openItem(id, from) {
      var it = items[id];
      var card = $('[data-item="' + id + '"]');
      var img = $("img", card);
      currentId = id;
      $("[data-item-img]", sheetEl).src = img.src;
      $("[data-item-img]", sheetEl).alt = img.alt;
      $("[data-item-name]", sheetEl).textContent = it.name;
      var priceEl = $("[data-item-price]", sheetEl);
      priceEl.textContent = it.price ? rupiah(it.price) : "Tanya harga";
      priceEl.classList.toggle("is-ask", !it.price);
      $("[data-item-desc]", sheetEl).textContent = it.description;
      $("[data-item-ask]", sheetEl).href = $("[data-ask-href]", card).getAttribute("data-ask-href");
      setQty(1);
      BB.sheet.open("item", from);
    }
    $$("[data-open-item]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); openItem(a.getAttribute("data-open-item"), a); });
    });
    $$("[data-add]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-add");
        if (!isPro()) { openItem(id, b); return; }
        add(id, 1);
        BB.toast(items[id].name + " masuk keranjang");
      });
    });
    $$("[data-step]", sheetEl).forEach(function (b) {
      b.addEventListener("click", function () { setQty(qty + parseInt(b.getAttribute("data-step"), 10)); });
    });
    $("[data-item-add]", sheetEl).addEventListener("click", function () {
      add(currentId, qty);
      BB.sheet.close(true);
      BB.toast(qty + "× " + items[currentId].name + " masuk keranjang");
    });

    function add(id, n) {
      cart[id] = Math.min(99, (cart[id] || 0) + n);
      if (cart[id] <= 0) delete cart[id];
      save();
      refresh();
    }

    /* Cart bar + quantity badges */
    var bar = $("[data-cartbar]");
    function refresh() {
      var n = count();
      bar.hidden = !(isPro() && n > 0);
      root.classList.toggle("has-cartbar", !bar.hidden);
      $("[data-cart-count]", bar).textContent = n;
      $("[data-cart-total]", bar).textContent = "Total " + totalText();
      $$("[data-add]").forEach(function (b) {
        var badge = $("[data-qty-badge]", b);
        var q = cart[b.getAttribute("data-add")] || 0;
        badge.hidden = !(isPro() && q > 0);
        badge.textContent = q;
      });
      if (BB.sheet.isOpen("cart")) renderCart();
    }
    planListeners.push(function () { refresh(); });

    /* Cart sheet */
    var cartEl = $('[data-sheet="cart"]');
    var nameInput = $("[data-cart-name]", cartEl);
    var noteInput = $("[data-cart-note]", cartEl);
    var sendBtn = $("[data-cart-send]", cartEl);

    function message(no) {
      var name = nameInput.value.trim();
      var note = noteInput.value.trim();
      var t = totals();
      var out = "Halo " + data.business.name + ", saya mau pesan:\n\n*Pesanan #" + no + "*\n";
      lines().forEach(function (l) {
        out += l.qty + "× " + l.item.name + " — " + (l.item.price ? rupiah(l.item.price * l.qty) : "harga via chat") + "\n";
      });
      out += "\n*" + (!t.sum && t.unpriced ? "Total: harga via chat" : "Total " + totalText()) + "*\n";
      // Omit the "Nama:" and "Catatan:" lines when empty (F-09).
      if (name || note) out += "\n" + (name ? "Nama: " + name + "\n" : "") + (note ? "Catatan: " + note + "\n" : "");
      return out + "\n— via " + data.url;
    }

    function renderCart() {
      var ls = lines();
      $("[data-cart-lines]", cartEl).innerHTML = ls.length
        ? ls.map(function (l) {
            var it = l.item;
            return '<li class="line">' +
              '<span class="line__main"><b>' + esc(it.name) + "</b><small>" + (it.price ? rupiah(it.price) + " / item" : "harga via chat") + "</small></span>" +
              '<span class="stepper stepper--sm">' +
              '<button type="button" data-line="' + it.id + '" data-delta="-1" aria-label="Kurangi ' + esc(it.name) + '"><svg aria-hidden="true"><use href="#i-minus"/></svg></button>' +
              "<output>" + l.qty + "</output>" +
              '<button type="button" data-line="' + it.id + '" data-delta="1" aria-label="Tambah ' + esc(it.name) + '"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>' +
              "</span>" +
              '<span class="line__total">' + (it.price ? rupiah(it.price * l.qty) : "harga via chat") + "</span>" +
              "</li>";
          }).join("")
        : '<li class="line line--empty">Keranjang kosong. Tap <b>+</b> di produk untuk menambah.</li>';
      $("[data-cart-sum]", cartEl).textContent = ls.length ? totalText() : rupiah(0);
      updateSend();
    }
    function updateSend() {
      var empty = !lines().length;
      sendBtn.setAttribute("aria-disabled", String(empty));
      sendBtn.href = empty ? "#" : waHref(message(nextOrderNo()));
    }
    $("[data-cart-lines]", cartEl).addEventListener("click", function (e) {
      var b = e.target.closest("[data-line]");
      if (!b) return;
      add(b.getAttribute("data-line"), parseInt(b.getAttribute("data-delta"), 10));
    });
    nameInput.addEventListener("input", updateSend);
    noteInput.addEventListener("input", updateSend);

    var showView = function (v) {
      $$("[data-cart-view]", cartEl).forEach(function (el) { el.hidden = el.getAttribute("data-cart-view") !== v; });
    };
    $("[data-cart-open]").addEventListener("click", function (e) {
      showView("form");
      renderCart();
      BB.sheet.open("cart", e.currentTarget);
    });

    // The order is logged when the buyer taps the button, before WhatsApp
    // opens (F-09). The link itself navigates as usual (no window.open).
    sendBtn.addEventListener("click", function (e) {
      if (!lines().length) { e.preventDefault(); return; }
      var no = nextOrderNo();
      sendBtn.href = waHref(message(no));
      var orders = store.json(ORDERS_KEY, []);
      orders.unshift({
        no: no,
        time: "Baru saja",
        name: nameInput.value.trim(),
        summary: lines().map(function (l) { return l.qty + "× " + l.item.name; }).join(", "),
        total: totals().unpriced && !totals().sum ? null : totals().sum,
        unpriced: totals().unpriced,
        status: "Baru",
      });
      store.setJson(ORDERS_KEY, orders);
      store.set(NEXT_KEY, String(no + 1));
      setTimeout(function () {
        cart = {};
        save();
        nameInput.value = "";
        noteInput.value = "";
        $("[data-done-no]", cartEl).textContent = "#" + no;
        showView("done");
        refresh();
      }, 50);
    });

    refresh();
  }

  /* =================================================================== */
  /* Dashboard                                                           */
  /* =================================================================== */
  function initDash() {
    var list = $("[data-orders]");
    var empty = $("[data-orders-empty]");
    var filter = "Semua";
    var overrides = store.json(STATUS_KEY, {});
    var NEXT = { Baru: ["Dikonfirmasi", "Dibatalkan"], Dikonfirmasi: ["Selesai", "Dibatalkan"] };
    var ACTION = { Dikonfirmasi: "Konfirmasi", Selesai: "Tandai selesai", Dibatalkan: "Batalkan" };
    var open = null;

    function all() {
      return store.json(ORDERS_KEY, []).concat(data.orders).map(function (o) {
        var copy = {};
        Object.keys(o).forEach(function (k) { copy[k] = o[k]; });
        if (overrides[o.no]) copy.status = overrides[o.no];
        return copy;
      });
    }
    function totalOf(o) {
      if (!o.total) return "harga via chat";
      return rupiah(o.total) + (o.unpriced ? " + harga via chat" : "");
    }

    function render() {
      var rows = all().filter(function (o) { return filter === "Semua" || o.status === filter; });
      empty.hidden = rows.length > 0;
      list.innerHTML = rows.map(function (o) {
        var expanded = open === o.no;
        var actions = (NEXT[o.status] || []).map(function (s) {
          return '<button type="button" class="btn btn--sm ' + (s === "Dibatalkan" ? "btn--outline" : "btn--dark") + '" data-set-status="' + s + '" data-no="' + o.no + '">' + ACTION[s] + "</button>";
        }).join("");
        return '<li class="order' + (o.time === "Baru saja" ? " order--fresh" : "") + '">' +
          '<button type="button" class="order__toggle" data-toggle="' + o.no + '" aria-expanded="' + expanded + '">' +
          '<span class="order__top"><b>#' + o.no + "</b><span>" + esc(o.time) + '</span><em class="status status--' + o.status.toLowerCase() + '">' + o.status + "</em></span>" +
          '<span class="order__name">' + esc(o.name || "—") + "</span>" +
          '<span class="order__summary">' + esc(o.summary) + "</span>" +
          '<span class="order__total">' + totalOf(o) + "</span>" +
          "</button>" +
          (expanded
            ? '<div class="order__actions">' + (actions || '<span class="order__final">Pesanan ini sudah ' + o.status.toLowerCase() + ".</span>") + "</div>"
            : "") +
          "</li>";
      }).join("");
    }

    $$("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.getAttribute("data-filter");
        $$("[data-filter]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        render();
      });
    });
    list.addEventListener("click", function (e) {
      var setBtn = e.target.closest("[data-set-status]");
      if (setBtn) {
        var no = setBtn.getAttribute("data-no");
        overrides[no] = setBtn.getAttribute("data-set-status");
        store.setJson(STATUS_KEY, overrides);
        BB.toast("Pesanan #" + no + ": " + overrides[no]);
        render();
        return;
      }
      var t = e.target.closest("[data-toggle]");
      if (!t) return;
      var n = parseInt(t.getAttribute("data-toggle"), 10);
      open = open === n ? null : n;
      render();
      var again = $('[data-toggle="' + n + '"]', list);
      if (again) again.focus();
    });
    render();

    /* Tabs: #pesanan, #statistik, #insights */
    var tabs = $$("[data-dash-tab]");
    function show(name, scroll) {
      if (!$('[data-panel="' + name + '"]')) name = "pesanan";
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
