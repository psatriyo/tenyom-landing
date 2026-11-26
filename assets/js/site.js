/* SatuPage marketing site: shared behaviour for every page.
   - Sign-up and sign-in links pass utm_* and ref on to the app (F-01-FR9)
   - Monthly / annual toggle on the Pro card
   - Bottom sheets (the demo item sheet), toast
   No cookies, no storage, no network requests, no third-party code. */
(function () {
  "use strict";

  var d = document;
  var root = d.documentElement;
  var cfg = { lang: "id", text: {} };
  try { cfg = JSON.parse(d.getElementById("site-config").textContent); } catch (e) { /* defaults */ }

  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- App links: pass utm_* and ref on (F-01-FR9) ---------- */
  // The page is static, so the query string is read when the link is used.
  // Without JavaScript the plain link still works.
  var APP_KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref"];
  function appHref(href) {
    var keep = [];
    try {
      var params = new URLSearchParams(location.search);
      APP_KEYS.forEach(function (k) {
        var v = params.get(k);
        if (v) keep.push(encodeURIComponent(k) + "=" + encodeURIComponent(v.slice(0, 80)));
      });
    } catch (e) { /* old browser: plain link */ }
    if (!keep.length) return href;
    return href + (href.indexOf("?") < 0 ? "?" : "&") + keep.join("&");
  }
  var onAppLink = function (e) {
    var a = e.target.closest ? e.target.closest("a[data-app-link]") : null;
    if (!a) return;
    if (!a.hasAttribute("data-app-href")) a.setAttribute("data-app-href", a.getAttribute("href"));
    a.setAttribute("href", appHref(a.getAttribute("data-app-href")));
  };
  // Mousedown/touchstart too, so "open in new tab" and long-press get the full URL.
  d.addEventListener("click", onAppLink, true);
  d.addEventListener("mousedown", onAppLink, true);
  d.addEventListener("touchstart", onAppLink, { capture: true, passive: true });
  d.addEventListener("keydown", function (e) { if (e.key === "Enter") onAppLink(e); }, true);

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
    // Close; real links still navigate afterwards.
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

  // A sheet opened through the no-JS fallback (its id in the URL).
  if (location.hash.length > 1) {
    var target = d.getElementById(location.hash.slice(1));
    if (target && target.hasAttribute("data-sheet")) { clearHash(); sheet.open(target.getAttribute("data-sheet")); }
  }

  /* ---------- Legal pages: table of contents open on wide screens ---------- */
  var toc = $("[data-toc]");
  if (toc && window.matchMedia && window.matchMedia("(min-width: 1000px)").matches) toc.open = true;

  window.BB = { cfg: cfg, text: cfg.text || {}, sheet: sheet, toast: toast, $: $, $$: $$ };
})();
