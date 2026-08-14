export const SELECTOR_AGENT = `(function () {
  if (window.__UI_AGENT__) return;
  window.__UI_AGENT__ = true;
  var uid = 0;
  var hoverEl = null;
  document.querySelectorAll("*").forEach(function (el) {
    if (!el.dataset.uid) el.dataset.uid = "uid" + ++uid;
  });
  var styleEl = document.createElement("style");
  styleEl.textContent = [
    "*[data-uid]:hover { outline: 2px solid rgba(99,102,241,.45) !important; outline-offset: -2px; cursor: pointer; }",
    "*[data-uid].ui-selected { outline: 2px solid #6366f1 !important; outline-offset: -1px; }",
    ".ui-hover-tag { position: fixed; z-index: 2147483647; background: #111827; color: #fff; font: 11px system-ui; padding: 2px 8px; border-radius: 4px; pointer-events: none; }",
  ].join("");
  document.head.appendChild(styleEl);
  var tagEl = document.createElement("div");
  tagEl.className = "ui-hover-tag";
  tagEl.style.display = "none";
  document.body.appendChild(tagEl);

  function send(obj) {
    try { window.parent.postMessage(JSON.stringify(obj), "*"); } catch (e) {}
  }
  function summarize(el) {
    var cs = window.getComputedStyle(el);
    var text = "";
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      text = el.childNodes[0].textContent.trim();
    } else if (el.tagName === "IMG") {
      text = el.getAttribute("alt") || "";
    }
    return {
      uid: el.dataset.uid,
      tag: el.tagName.toLowerCase(),
      id: el.id || "",
      className: typeof el.className === "string" ? el.className : "",
      text: text,
      htmlSnippet: el.outerHTML.slice(0, 600),
      styles: {
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        textAlign: cs.textAlign,
        fontFamily: cs.fontFamily,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        width: cs.width,
        height: cs.height,
        display: cs.display,
        gap: cs.gap,
      },
    };
  }
  function select(el) {
    var sel = document.querySelectorAll(".ui-selected");
    sel.forEach(function (s) { s.classList.remove("ui-selected"); });
    el.classList.add("ui-selected");
    send({ type: "select", element: summarize(el) });
  }
  document.addEventListener("mouseover", function (e) {
    var el = e.target;
    if (hoverEl === el) return;
    hoverEl = el;
    if (!el.dataset || !el.dataset.uid) return;
    var r = el.getBoundingClientRect();
    tagEl.style.display = "block";
    tagEl.textContent = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "");
    tagEl.style.left = (r.left + 6) + "px";
    tagEl.style.top = (r.top + 6) + "px";
  });
  document.addEventListener("mouseout", function () {
    hoverEl = null;
    tagEl.style.display = "none";
  });
  document.addEventListener("click", function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.uid) {
      select(el);
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  window.addEventListener("message", function (e) {
    var d;
    try { d = JSON.parse(e.data); } catch (_) { return; }
    if (!d || !d.type) return;
    if (d.type === "apply-styles") {
      var el = document.querySelector('[data-uid="' + d.uid + '"]');
      if (el && d.styles) Object.assign(el.style, d.styles);
    }
    if (d.type === "set-text") {
      var el2 = document.querySelector('[data-uid="' + d.uid + '"]');
      if (!el2) return;
      if (el2.childNodes.length === 1 && el2.childNodes[0].nodeType === 3) {
        el2.childNodes[0].textContent = d.text;
      } else if (el2.tagName === "INPUT") {
        el2.value = d.text;
      } else {
        var walker = document.createTreeWalker(el2, NodeFilter.SHOW_TEXT);
        var n;
        while ((n = walker.nextNode())) { n.textContent = d.text; break; }
      }
    }
    if (d.type === "remove-element") {
      var el3 = document.querySelector('[data-uid="' + d.uid + '"]');
      if (el3 && el3.parentNode && el3.parentNode !== document.body) {
        el3.parentNode.removeChild(el3);
      }
    }
    if (d.type === "serialize") {
      send({ type: "serialized", html: document.documentElement.outerHTML });
    }
    if (d.type === "refresh-selection") {
      var el4 = document.querySelector('[data-uid="' + d.uid + '"]');
      if (el4) select(el4);
    }
  });
  var me = document.currentScript;
  if (me && me.parentNode) me.parentNode.removeChild(me);
})();`
