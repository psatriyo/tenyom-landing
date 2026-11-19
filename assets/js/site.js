/* BookBook marketing site: shared behaviour for every page.
   - Pro price switch for interviews: ?harga=49 or ?harga=99 (kept for the tab)
   - Monthly / annual toggle on the Pro card
   - Bottom sheets ("uji coba" and the demo sheets), toast
   No cookies, no network requests, no third-party code. */
(function () {
  "use strict";

  var d = document;
  var root = d.documentElement;
  var cfg = {};
  try { cfg = JSON.parse(d.getElementById("site-config").textContent); } catch (e) { /* defaults */ }

  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  // sessionStorage can throw (private mode, blocked storage): never rely on it.
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    json: function (k, fallback) { try { var v = JSON.parse(store.get(k)); return v == null ? fallback : v; } catch (e) { return fallback; } },
    setJson: function (k, v) { store.set(k, JSON.stringify(v)); },
  };

  // NFR-14: "Rp95.000" (dot thousands separator, no decimals, no space)
  var rupiah = function (n) { return "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); };

  /* ---------- Pro price (Q-03 price test) ---------- */
  var price = cfg.price;
  if (price) {
    var key = null;
    try { key = new URLSearchParams(location.search).get(price.param); } catch (e) { /* old browser */ }
    if (key && price.options[key]) store.set("bb-harga", key);
    else key = store.get("bb-harga");
    if (!key || !price.options[key]) key = String(price.fallback);
    var monthly = price.options[key];
    var values = {
      monthly: rupiah(monthly),
      annual: rupiah(monthly * price.annualMonthsPaid),
      saving: rupiah(monthly * (12 - price.annualMonthsPaid)),
    };
    $$("[data-price]").forEach(function (el) {
      var v = values[el.getAttribute("data-price")];
      if (v) el.textContent = v;
    });
    root.setAttribute("data-harga", key);
  }

  /* ---------- Monthly / annual toggle ---------- */
  $$("[data-billing-set]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest("[data-billing]");
      card.setAttribute("data-billing", btn.getAttribute("data-billing-set"));
      $$("[data-billing-set]", card).forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    });
  });

  /* ---------- Toast ---------- */
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.remove("is-on");
    void toastEl.offsetWidth; // restart the transition
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }

  /* ---------- Bottom sheets ---------- */
  var current = null;
  var opener = null;
  var clearHash = function () {
    if (location.hash && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  };
  var sheet = {
    open: function (name, from) {
      var el = $('[data-sheet="' + name + '"]');
      if (!el) return null;
      if (current && current !== el) sheet.close(true);
      opener = from || d.activeElement;
      current = el;
      el.classList.add("is-open");
      root.classList.add("has-sheet");
      var panel = $(".sheet__panel", el);
      setTimeout(function () { panel.focus(); }, 30);
      el.dispatchEvent(new CustomEvent("sheet:open"));
      return el;
    },
    close: function (silent) {
      if (!current) return;
      var el = current;
      current = null;
      el.classList.remove("is-open");
      root.classList.remove("has-sheet");
      if (el.id && location.hash === "#" + el.id) clearHash();
      el.dispatchEvent(new CustomEvent("sheet:close"));
      if (!silent && opener && opener.focus) opener.focus();
    },
    isOpen: function (name) { return Boolean(current && current.getAttribute("data-sheet") === name); },
  };

  d.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-sheet-open], [data-sheet-close]") : null;
    if (!t) return;
    if (t.hasAttribute("data-sheet-open")) {
      e.preventDefault();
      sheet.open(t.getAttribute("data-sheet-open"), t);
      return;
    }
    // Close; real links (e.g. "/#anggota-pendiri") still navigate afterwards.
    var href = t.getAttribute("href");
    var isReal = Boolean(href && href !== "#");
    if (!isReal) e.preventDefault();
    sheet.close(isReal);
  });

  d.addEventListener("keydown", function (e) {
    if (!current) return;
    if (e.key === "Escape") { sheet.close(); return; }
    if (e.key !== "Tab") return;
    // Keep focus inside the open sheet.
    var panel = $(".sheet__panel", current);
    var focusable = $$('a[href], button:not([disabled]), input, textarea', panel)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && (d.activeElement === first || d.activeElement === panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // A sheet opened through the no-JS fallback (e.g. #uji-coba in the URL).
  if (location.hash.length > 1) {
    var target = d.getElementById(location.hash.slice(1));
    if (target && target.hasAttribute("data-sheet")) { clearHash(); sheet.open(target.getAttribute("data-sheet")); }
  }

  /* ---------- Legal pages: table of contents open on wide screens ---------- */
  var toc = $("[data-toc]");
  if (toc && window.matchMedia && window.matchMedia("(min-width: 1000px)").matches) toc.open = true;

  window.BB = { cfg: cfg, store: store, rupiah: rupiah, sheet: sheet, toast: toast, $: $, $$: $$ };
})();
