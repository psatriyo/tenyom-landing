/* BookBook landing page — no dependencies. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIG — edit these before going live.
     WA_NUMBER: the BookBook support WhatsApp number in international
     format without "+" or spaces, e.g. "6281234567890".
     Left empty, the form opens WhatsApp's "choose a chat" screen.
     ------------------------------------------------------------------ */
  var CONFIG = {
    WA_NUMBER: "",
    DEMO_STORE: "Kue Bu Rina",
    DEMO_SLUGS: ["kueburina", "dimas.thrift", "rajutan.sari", "dapurmama.ina"]
  };

  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var rupiah = function (n) { return "Rp" + n.toLocaleString("id-ID"); };

  /* ---------- Nav background on scroll ---------- */
  var nav = $("[data-nav]");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 12); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    // stagger siblings
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

  /* ---------- Interactive storefront demo ---------- */
  var demo = $("[data-demo]");
  if (demo) {
    var items = $$("[data-item]", demo);
    var orderBtn = $("[data-order]", demo);
    var countEl = $("[data-count]", demo);
    var linesEl = $("[data-lines]", demo);
    var totalEl = $("[data-total]", demo);
    var orderNoEl = $("[data-order-no]", demo);
    var statusEl = $("[data-status]", demo);
    var card = $(".order-card", demo);
    var chat = $("[data-chat]", demo);
    var screens = { store: $('[data-screen="store"]', demo), chat: $('[data-screen="chat"]', demo) };
    var orderNo = 12;
    var timers = [];

    var cart = function () {
      return items.map(function (li) {
        return { name: li.dataset.name, price: +li.dataset.price, qty: +li.dataset.qty };
      }).filter(function (x) { return x.qty > 0; });
    };

    var render = function (flash) {
      var c = cart();
      var count = c.reduce(function (s, x) { return s + x.qty; }, 0);
      var total = c.reduce(function (s, x) { return s + x.qty * x.price; }, 0);
      countEl.textContent = count;
      orderBtn.disabled = count === 0;
      totalEl.textContent = rupiah(total);
      orderNoEl.textContent = orderNo;
      linesEl.innerHTML = "";
      if (!c.length) {
        var li = document.createElement("li");
        li.className = "empty";
        li.textContent = "Keranjang masih kosong";
        linesEl.appendChild(li);
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
      if (flash && !reduceMotion) {
        card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
        orderBtn.classList.remove("bump"); void orderBtn.offsetWidth; orderBtn.classList.add("bump");
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
        render(true);
      });
    });

    var setStatus = function (s) {
      statusEl.className = "chip " + (s === "ok" ? "chip--ok" : "chip--new");
      statusEl.textContent = s === "ok" ? "Dikonfirmasi" : "Baru";
    };

    var show = function (name) {
      Object.keys(screens).forEach(function (k) {
        var on = k === name;
        screens[k].classList.toggle("is-active", on);
        screens[k].setAttribute("aria-hidden", on ? "false" : "true");
        if ("inert" in screens[k]) screens[k].inert = !on;
      });
    };
    if ("inert" in screens.chat) screens.chat.inert = true;

    var bubble = function (cls, text, time) {
      var b = document.createElement("div");
      b.className = "bubble " + cls;
      b.textContent = text;
      if (time) { var t = document.createElement("time"); t.textContent = time; b.appendChild(t); }
      chat.appendChild(b);
      return b;
    };

    var later = function (fn, ms) { timers.push(setTimeout(fn, reduceMotion ? 0 : ms)); };

    orderBtn.addEventListener("click", function () {
      var c = cart();
      if (!c.length) return;
      var total = c.reduce(function (s, x) { return s + x.qty * x.price; }, 0);
      var msg = "Halo " + CONFIG.DEMO_STORE + ", saya mau pesan (#" + orderNo + "):\n" +
        c.map(function (x) { return "• " + x.qty + "× " + x.name + " — " + rupiah(x.qty * x.price); }).join("\n") +
        "\nTotal: " + rupiah(total);

      chat.innerHTML = "";
      show("chat");
      later(function () { bubble("bubble--out", msg, "10.21 ✓✓"); }, 350);
      var typing;
      later(function () {
        typing = document.createElement("div");
        typing.className = "bubble bubble--in bubble--typing";
        typing.innerHTML = "<i></i><i></i><i></i>";
        chat.appendChild(typing);
      }, 1300);
      later(function () {
        if (typing) typing.remove();
        bubble("bubble--in", "Siap kak, pesanan #" + orderNo + " sudah dicatat 🙏 Total " + rupiah(total) + ", bisa transfer atau QRIS ya.", "10.22");
        setStatus("ok");
      }, 2600);
    });

    $$("[data-back]", demo).forEach(function (b) {
      b.addEventListener("click", function () {
        timers.forEach(clearTimeout); timers = [];
        if (statusEl.textContent === "Dikonfirmasi") orderNo += 1;
        setStatus("new");
        show("store");
        render(false);
      });
    });

    render(false);
  }

  /* ---------- Slug typer ---------- */
  var typer = $("[data-typer]");
  if (typer && !reduceMotion) {
    var si = 0, ci = CONFIG.DEMO_SLUGS[0].length, deleting = true;
    var tick = function () {
      var word = CONFIG.DEMO_SLUGS[si];
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; si = (si + 1) % CONFIG.DEMO_SLUGS.length; }
      } else {
        ci++;
        if (ci >= CONFIG.DEMO_SLUGS[si].length) { deleting = true; typer.textContent = CONFIG.DEMO_SLUGS[si]; return setTimeout(tick, 2200); }
      }
      typer.textContent = CONFIG.DEMO_SLUGS[si].slice(0, Math.max(ci, 0));
      setTimeout(tick, deleting ? 45 : 90);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Countdown ---------- */
  var cd = $("[data-countdown]");
  if (cd) {
    var end = new Date(cd.getAttribute("data-countdown")).getTime();
    var parts = { d: $("[data-d]", cd), h: $("[data-h]", cd), m: $("[data-m]", cd), s: $("[data-s]", cd) };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var update = function () {
      var diff = end - Date.now();
      if (diff <= 0) {
        cd.classList.add("is-over");
        $("[data-countdown-label]", cd).textContent = "Pendaftaran founding member sudah ditutup. Daftar untuk antrean beta lewat form di samping.";
        return clearInterval(iv);
      }
      var s = Math.floor(diff / 1000);
      parts.d.textContent = Math.floor(s / 86400);
      parts.h.textContent = pad(Math.floor(s % 86400 / 3600));
      parts.m.textContent = pad(Math.floor(s % 3600 / 60));
      parts.s.textContent = pad(s % 60);
    };
    var iv = setInterval(update, 1000);
    update();
  }

  /* ---------- Founding member form -> WhatsApp ---------- */
  var form = $("[data-form]");
  if (form) {
    var err = $("[data-form-error]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var required = ["nama", "usaha", "jenis", "kota"];
      var firstBad = null;
      required.forEach(function (k) {
        var el = form.elements[k];
        var bad = !String(data.get(k) || "").trim();
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) { err.hidden = false; firstBad.focus(); return; }
      err.hidden = true;

      var v = function (k) { return String(data.get(k) || "").trim(); };
      var text = "Halo BookBook! Saya mau daftar founding member.\n\n" +
        "Nama: " + v("nama") + "\n" +
        "Usaha: " + v("usaha") + "\n" +
        "Jualan: " + v("jenis") + "\n" +
        "Kota: " + v("kota") +
        (v("kanal") ? "\nSekarang jualan lewat: " + v("kanal") : "");
      var url = "https://wa.me/" + CONFIG.WA_NUMBER.replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
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
