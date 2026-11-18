/* BookBook marketing site. No dependencies.
   Values come from site.config.mjs via the inline #site-config JSON. */
(function () {
  "use strict";

  var CONFIG = {};
  try { CONFIG = JSON.parse(document.getElementById("site-config").textContent); } catch (e) { /* keep defaults */ }
  var BRAND = CONFIG.brand || "BookBook";
  var DOMAIN = CONFIG.domain || "bookbook.id";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var rupiah = function (n) { return "Rp" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------- Founding offer: open until the deadline (P-06) ---------- */
  var foundingOpen = function () {
    if (!CONFIG.founding || !CONFIG.founding.enabled) return false;
    return Date.now() < new Date(CONFIG.founding.deadline).getTime();
  };
  var syncFounding = function () {
    root.setAttribute("data-founding", CONFIG.founding && CONFIG.founding.enabled ? (foundingOpen() ? "open" : "closed") : "off");
  };
  syncFounding();

  /* ---------- Attribution: keep utm_*, ref and src for sign-up (206, 106 §5) ---------- */
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "src"];
  var attribution = (function () {
    var saved = {};
    try { saved = JSON.parse(store.get("bb_attr") || "{}") || {}; } catch (e) { saved = {}; }
    var params = new URLSearchParams(window.location.search);
    var fresh = {};
    ATTR_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) fresh[k] = v.slice(0, 100);
    });
    // A new campaign link replaces the old one; otherwise keep the first-touch values.
    var result = Object.keys(fresh).length ? fresh : saved;
    if (!result.landing && Object.keys(result).length) result.landing = window.location.pathname;
    store.set("bb_attr", JSON.stringify(result));
    return result;
  })();

  // Forward attribution to the product app's sign-up page.
  if (CONFIG.signupUrl) {
    $$("a[data-cta]").forEach(function (a) {
      try {
        var url = new URL(a.getAttribute("href"), window.location.href);
        ATTR_KEYS.forEach(function (k) { if (attribution[k] && !url.searchParams.has(k)) url.searchParams.set(k, attribution[k]); });
        a.setAttribute("href", url.toString());
      } catch (e) { /* leave link as is */ }
    });
  }

  /* ---------- Analytics: PostHog on marketing pages only (206) ---------- */
  var track = function () {};
  if (CONFIG.posthog && CONFIG.posthog.key) {
    var queue = [];
    track = function (event, props) { queue.push([event, props || {}]); };
    var ph = document.createElement("script");
    ph.async = true;
    ph.src = CONFIG.posthog.host.replace(/\/+$/, "") + "/static/array.js";
    ph.onload = function () {
      if (!window.posthog || !window.posthog.init) return;
      window.posthog.init(CONFIG.posthog.key, { api_host: CONFIG.posthog.host, capture_pageview: false, autocapture: false });
      track = function (event, props) { window.posthog.capture(event, props || {}); };
      queue.forEach(function (q) { track(q[0], q[1]); });
    };
    document.head.appendChild(ph);
    var viewProps = { path: window.location.pathname };
    ATTR_KEYS.forEach(function (k) { if (attribution[k]) viewProps[k] = attribution[k]; });
    track("marketing_page_viewed", viewProps);
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-cta]");
      if (a) track("cta_clicked", { cta: a.getAttribute("data-cta"), path: window.location.pathname });
    });
  }

  /* ---------- Nav ---------- */
  var nav = $("[data-nav]");
  var menu = $("[data-menu]");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  if (menu) {
    menu.addEventListener("toggle", function () { nav.classList.toggle("is-open", menu.open); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; $("summary", menu).focus(); } });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    reveals.forEach(function (el) {
      var sibs = $$(":scope > .reveal", el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i, 6) * 0.07 + "s");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Interactive example homepage ---------- */
  var demo = $("[data-demo]");
  if (demo) {
    var STORE = "Kue Bu Rina";
    var STORE_URL = DOMAIN + "/kueburina";
    var items = $$("[data-item]", demo);
    var orderBtn = $("[data-order]", demo);
    var countEl = $("[data-count]", demo);
    var linesEl = $("[data-lines]", demo);
    var totalEl = $("[data-total]", demo);
    var orderNoEl = $("[data-order-no]", demo);
    var statusEl = $("[data-status]", demo);
    var orderCard = $(".order-card", demo);
    var linkCard = $(".link-card", demo);
    var statsList = $("[data-link-stats]", demo);
    var chat = $("[data-chat]", demo);
    var screens = { store: $('[data-screen="store"]', demo), chat: $('[data-screen="chat"]', demo) };
    var orderNo = 12;
    var timers = [];

    var flash = function (el) {
      if (reduceMotion || !el) return;
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    };

    /* Cart (Pro) */
    var cart = function () {
      return items.map(function (li) {
        return { name: li.dataset.name, price: +li.dataset.price, qty: +li.dataset.qty };
      }).filter(function (x) { return x.qty > 0; });
    };
    var setStatus = function (s) {
      statusEl.className = "chip " + (s === "ok" ? "chip--ok" : "chip--new");
      statusEl.textContent = s === "ok" ? "Dikonfirmasi" : "Baru";
    };
    var renderCart = function (animate) {
      var c = cart();
      var count = c.reduce(function (s, x) { return s + x.qty; }, 0);
      var total = c.reduce(function (s, x) { return s + x.qty * x.price; }, 0);
      countEl.textContent = count;
      orderBtn.disabled = count === 0;
      totalEl.textContent = rupiah(total);
      orderNoEl.textContent = orderNo;
      linesEl.textContent = "";
      if (!c.length) {
        var empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "Keranjang masih kosong";
        linesEl.appendChild(empty);
      }
      c.forEach(function (x) {
        var li = document.createElement("li");
        li.textContent = x.qty + "× " + x.name;
        linesEl.appendChild(li);
      });
      items.forEach(function (li) {
        $("output", li).textContent = li.dataset.qty;
        li.classList.toggle("is-in", +li.dataset.qty > 0);
      });
      if (animate) {
        flash(orderCard);
        if (!reduceMotion) { orderBtn.classList.remove("bump"); void orderBtn.offsetWidth; orderBtn.classList.add("bump"); }
      }
    };
    items.forEach(function (li) {
      li.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        var q = +li.dataset.qty;
        if (btn.hasAttribute("data-inc")) q = Math.min(q + 1, 9);
        if (btn.hasAttribute("data-dec")) q = Math.max(q - 1, 0);
        li.dataset.qty = q;
        setStatus("new");
        renderCart(true);
      });
    });

    /* Clicks per link (D-42): a tap on a link or social icon adds one */
    var LINKS = {
      gofood: { label: "GoFood", count: 14 },
      shopee: { label: "Shopee", count: 9 },
      instagram: { label: "Instagram", count: 7 },
      video: { label: "Video collab", count: 5 },
      tiktok: { label: "TikTok", count: 3 },
      facebook: { label: "Facebook", count: 1 }
    };
    var renderStats = function (hit) {
      var keys = Object.keys(LINKS).sort(function (a, b) { return LINKS[b].count - LINKS[a].count; });
      var shown = keys.slice(0, 4);
      if (hit && shown.indexOf(hit) === -1) shown[3] = hit;
      var max = LINKS[keys[0]].count;
      statsList.textContent = "";
      shown.forEach(function (k) {
        var li = document.createElement("li");
        if (k === hit) li.className = "is-hit";
        var label = document.createElement("span");
        label.textContent = LINKS[k].label;
        var bar = document.createElement("i");
        bar.style.setProperty("--w", Math.max(6, Math.round(LINKS[k].count / max * 100)) + "%");
        var n = document.createElement("b");
        n.textContent = LINKS[k].count;
        li.appendChild(label); li.appendChild(bar); li.appendChild(n);
        statsList.appendChild(li);
      });
    };
    $$("[data-link]", demo).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.getAttribute("data-link");
        if (!LINKS[k]) return;
        LINKS[k].count += 1;
        renderStats(k);
        flash(linkCard);
        btn.classList.add("is-hit");
        setTimeout(function () { btn.classList.remove("is-hit"); }, 600);
      });
    });

    /* WhatsApp chat screen */
    var show = function (name) {
      Object.keys(screens).forEach(function (k) {
        var on = k === name;
        screens[k].classList.toggle("is-active", on);
        screens[k].setAttribute("aria-hidden", on ? "false" : "true");
        if ("inert" in screens[k]) screens[k].inert = !on;
      });
    };
    if ("inert" in screens.chat) screens.chat.inert = true;

    // Renders WhatsApp-style *bold* safely.
    var bubble = function (cls, text, time) {
      var b = document.createElement("div");
      b.className = "bubble " + cls;
      text.split(/(\*[^*\n]+\*)/).forEach(function (part) {
        if (/^\*[^*\n]+\*$/.test(part)) {
          var strong = document.createElement("b");
          strong.textContent = part.slice(1, -1);
          b.appendChild(strong);
        } else if (part) {
          b.appendChild(document.createTextNode(part));
        }
      });
      if (time) { var t = document.createElement("time"); t.textContent = time; b.appendChild(t); }
      chat.appendChild(b);
      return b;
    };
    var later = function (fn, ms) { timers.push(setTimeout(fn, reduceMotion ? 0 : ms)); };
    var conversation = function (outgoing, reply, onReply) {
      timers.forEach(clearTimeout); timers = [];
      chat.textContent = "";
      show("chat");
      later(function () { bubble("bubble--out", outgoing, "10.21 ✓✓"); }, 350);
      var typing;
      later(function () {
        typing = document.createElement("div");
        typing.className = "bubble bubble--in bubble--typing";
        typing.appendChild(document.createElement("i"));
        typing.appendChild(document.createElement("i"));
        typing.appendChild(document.createElement("i"));
        chat.appendChild(typing);
      }, 1300);
      later(function () {
        if (typing) typing.remove();
        bubble("bubble--in", reply, "10.22");
        if (onReply) onReply();
      }, 2600);
      var back = $(".wa-back", demo);
      if (back) setTimeout(function () { back.focus({ preventScroll: true }); }, reduceMotion ? 0 : 400);
    };

    // Order message: the detailed template decided in D-37.
    orderBtn.addEventListener("click", function () {
      var c = cart();
      if (!c.length) return;
      var total = c.reduce(function (s, x) { return s + x.qty * x.price; }, 0);
      var msg = "Halo " + STORE + ", saya mau pesan:\n\n" +
        "*Pesanan #" + orderNo + "*\n" +
        c.map(function (x) { return x.qty + "× " + x.name + " — " + rupiah(x.qty * x.price); }).join("\n") +
        "\n\n*Total " + rupiah(total) + "*\n\n— via " + STORE_URL;
      setStatus("new");
      flash(orderCard);
      conversation(msg, "Siap kak, pesanan #" + orderNo + " sudah dicatat 🙏 Total " + rupiah(total) + ", bisa transfer atau QRIS ya.", function () {
        setStatus("ok");
        flash(orderCard);
      });
    });

    // "Tanya via WhatsApp" for an item without a fixed price (D-35, F-08).
    $$("[data-ask]", demo).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-ask");
        conversation(
          "Halo " + STORE + ", saya mau tanya tentang:\n*" + name + "* (Tanya harga)\n\nMasih tersedia?\n\n— via " + STORE_URL,
          "Masih kak 😊 Isi dan budget bisa disesuaikan. Untuk berapa orang?"
        );
      });
    });

    $$("[data-back]", demo).forEach(function (b) {
      b.addEventListener("click", function () {
        timers.forEach(clearTimeout); timers = [];
        if (statusEl.textContent === "Dikonfirmasi") orderNo += 1;
        setStatus("new");
        show("store");
        renderCart(false);
        orderBtn.focus({ preventScroll: true });
      });
    });

    renderCart(false);
    renderStats();
  }

  /* ---------- Slug typer ---------- */
  var typer = $("[data-typer]");
  if (typer && !reduceMotion) {
    var SLUGS = ["kueburina", "dimas.thrift", "rajutan.sari", "dapurmama.ina"];
    var si = 0, ci = SLUGS[0].length, deleting = true;
    var tick = function () {
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; si = (si + 1) % SLUGS.length; }
      } else {
        ci++;
        if (ci >= SLUGS[si].length) { deleting = true; typer.textContent = SLUGS[si]; return setTimeout(tick, 2200); }
      }
      typer.textContent = SLUGS[si].slice(0, Math.max(ci, 0));
      setTimeout(tick, deleting ? 45 : 90);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Countdown to the founding deadline ---------- */
  var cd = $("[data-countdown]");
  if (cd && foundingOpen()) {
    var end = new Date(cd.getAttribute("data-countdown")).getTime();
    var parts = { d: $("[data-d]", cd), h: $("[data-h]", cd), m: $("[data-m]", cd), s: $("[data-s]", cd) };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var iv;
    var update = function () {
      var diff = end - Date.now();
      if (diff <= 0) { clearInterval(iv); syncFounding(); return; }
      var s = Math.floor(diff / 1000);
      parts.d.textContent = Math.floor(s / 86400);
      parts.h.textContent = pad(Math.floor(s % 86400 / 3600));
      parts.m.textContent = pad(Math.floor(s % 3600 / 60));
      parts.s.textContent = pad(s % 60);
    };
    iv = setInterval(update, 1000);
    update();
  }

  /* ---------- Founding / waitlist form -> WhatsApp ---------- */
  var form = $("[data-form]");
  if (form) {
    var err = $("[data-form-error]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var v = function (k) { return String(data.get(k) || "").trim(); };
      var firstBad = null;
      ["nama", "usaha", "jenis", "kota"].forEach(function (k) {
        var el = form.elements[k];
        var bad = !v(k);
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) { err.hidden = false; firstBad.focus(); return; }
      err.hidden = true;

      var founding = foundingOpen();
      var lines = [
        "Halo " + BRAND + "! Saya mau daftar " + (founding ? "founding member." : "antrean beta."),
        "",
        "Nama: " + v("nama"),
        "Usaha: " + v("usaha"),
        "Jualan: " + v("jenis"),
        "Kota: " + v("kota")
      ];
      if (v("bio")) lines.push("Link di bio sekarang: " + v("bio"));
      if (v("sumber")) lines.push("Tahu " + BRAND + " dari: " + v("sumber"));
      var tags = ["ref", "utm_source", "utm_medium", "utm_campaign", "src"].filter(function (k) { return attribution[k]; })
        .map(function (k) { return k + "=" + attribution[k]; });
      if (tags.length) lines.push("Kode: " + tags.join(", "));

      track(founding ? "founding_form_sent" : "waitlist_form_sent", { jenis: v("jenis"), sumber: v("sumber") || null });
      var number = String(CONFIG.waNumber || "").replace(/\D/g, "");
      // Direct navigation (not window.open) so it also works in IG/TikTok in-app browsers.
      window.location.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(lines.join("\n"));
    });
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true" && String(e.target.value).trim()) {
        e.target.setAttribute("aria-invalid", "false");
      }
    });
  }

  /* ---------- Footer year ---------- */
  var y = $("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
