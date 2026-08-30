// ==UserScript==
// @name         TSETMC Market Watch Overlay
// @namespace    https://github.com/aminchat/capital-app
// @version      1.3.0
// @description  Full market-watch app (special filters, live table) injected into tsetmc pages. Same-origin data, no proxy, no CORS. Mobile friendly.
// @author       aminchat
// @match        https://old.tsetmc.com/*
// @match        http://old.tsetmc.com/*
// @match        https://www.tsetmc.com/*
// @match        http://www.tsetmc.com/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

/* The overlay itself is NOT in this file. This userscript only loads the
 * shared bundle (inject/inject.js) from GitHub so there is exactly one
 * copy of the app to maintain. Works with Tampermonkey on Firefox Android
 * (auto-runs on every tsetmc visit), and with Via / X browser user-scripts. */
(function () {
  "use strict";
  var APP_VER = "1.3.0";
  if (window.__mwaInjected || window.__mwaVer) return; // already loaded
  var urls = [
    "https://cdn.jsdelivr.net/gh/aminchat/capital-app@main/inject/inject.js",
    "https://aminchat.github.io/capital-app/inject/inject.js"
  ];
  var i = 0;
  function next() {
    if (i >= urls.length) { console.warn("[MWA] could not load inject.js"); return; }
    var s = document.createElement("script");
    s.src = urls[i++] + "?t=" + Date.now();
    s.onerror = function () { s.remove(); next(); };
    s.onload = function () {
      setTimeout(function () {
        if (window.__mwaVer !== APP_VER) {
          console.warn("[MWA] OLD VERSION served: v" + (window.__mwaVer || "?") + " - expected " + APP_VER);
        }
      }, 1500);
    };
    (document.head || document.documentElement).appendChild(s);
  }
  next();
})();
