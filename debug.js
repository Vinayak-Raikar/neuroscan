(function () {
  var box = document.createElement("div");
  box.style.cssText =
    "position:fixed;left:10px;bottom:10px;z-index:2147483647;max-width:92vw;" +
    "padding:10px 14px;border-radius:10px;font:13px/1.5 Consolas,monospace;" +
    "color:#fff;background:#0a7d3b;white-space:pre-wrap;" +
    "box-shadow:0 4px 20px rgba(0,0,0,.5)";
  box.textContent = "debug.js is running";

  function attach() { document.body.appendChild(box); }
  if (document.body) attach();
  else document.addEventListener("DOMContentLoaded", attach);

  // Shows JS errors and files that could not be found
  window.addEventListener("error", function (e) {
    box.style.background = "#b00020";
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) {
      box.textContent += "\nFILE NOT FOUND: " + (t.src || t.href);
    } else {
      var file = (e.filename || "").split("/").pop();
      box.textContent += "\nERROR: " + e.message + " (" + file + ", line " + e.lineno + ")";
    }
  }, true);

  window.addEventListener("load", function () {
    var scripts = Array.prototype.map.call(document.scripts, function (s) {
      return s.getAttribute("src") || "inline";
    }).join(", ");
    box.textContent += "\nScripts on this page: " + scripts;
    box.textContent += "\napp.js ran: " + (document.documentElement.hasAttribute("data-theme") ? "YES" : "NO");
    box.textContent += "\nTeam cards ready: " + document.querySelectorAll("[data-tm-index]").length + " (should be 5)";
  });
})();