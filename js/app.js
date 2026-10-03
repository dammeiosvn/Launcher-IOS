const SHORTCUT = "Quick Launcher";
const ILLU = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60";
const KEY = "ql_apps";
const BG = "ql_bg";
const MODE = "ql_mode";
const MAX = 8;
const JSON_URL = "System/SystemApp.json";
const PAGE = 8;
const ONLINE = 10;
const FALLBACK = "en-GB";
const SUPPORTED = ["ar","bn-BD","cs-CZ","da-DK","de-DE","el-GR","en-GB","en-US","es-ES","es-MX","fa-IR","fi-FI","fil-PH","fr-CA","fr-FR","hi-IN","hu-HU","id-ID","it-IT","ja","ko-KR","ms-MY","nb-NO","nl-NL","pl-PL","pt-BR","pt-PT","ro-RO","ru","sv-SE","sw-KE","th-TH","tr-TR","uk-UA","vi-VN","zh-CN","zh-TW"];
const ALIAS = {
  "zh-hans": "zh-CN", "zh-cn": "zh-CN", "zh-sg": "zh-CN",
  "zh-hant": "zh-TW", "zh-tw": "zh-TW", "zh-hk": "zh-TW", "zh-mo": "zh-TW",
  "ja-jp": "ja", "ru-ru": "ru", "ar-sa": "ar", "ar-eg": "ar",
  "fil": "fil-PH", "tl": "fil-PH", "tl-ph": "fil-PH",
  "nb": "nb-NO", "no": "nb-NO", "nn": "nb-NO", "nn-no": "nb-NO",
  "en": "en-GB", "es": "es-ES", "pt": "pt-PT", "fr": "fr-FR", "de": "de-DE", "zh": "zh-CN",
  "ko": "ko-KR", "vi": "vi-VN"
};

const dock = document.getElementById("dock");
const art = document.getElementById("art");
const hint = document.getElementById("hint");
const file = document.getElementById("file");
const mask = document.getElementById("mask");
const sheet = document.getElementById("sheet");
const q = document.getElementById("q");
const results = document.getElementById("results");
const addBtn = document.getElementById("add");
const menu = document.getElementById("menu");
const info = document.getElementById("info");
const done = document.getElementById("done");
let catalog = [];
let hintT, renaming = false, drag = null;
let i18n = {};
let lang = FALLBACK;
let quoteWeek = -1;
let quotes = [];
let sysPage = 1;
let online = [];
let onlineTitle = "";
let ignoreRunUntil = 0;
let deleting = false;

function t(key) { return i18n[key] || ""; }
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
function shortName(name) { return String(name || "").split(/\s*[-–—:|•]\s*/)[0].trim() || name; }
function iconUrl(path) { return String(path || "").replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/"); }
function mode() { return localStorage.getItem(MODE) || "grid"; }

function resolveLang() {
  const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || FALLBACK];
  for (let i = 0; i < list.length; i++) {
    const norm = String(list[i] || "").replace("_", "-");
    const lower = norm.toLowerCase();
    const exact = SUPPORTED.find(function (c) { return c.toLowerCase() === lower; });
    if (exact) return exact;
    if (ALIAS[lower]) return ALIAS[lower];
    const primary = lower.split("-")[0];
    if (ALIAS[primary]) return ALIAS[primary];
    const byPrimary = SUPPORTED.filter(function (c) { return c.toLowerCase().split("-")[0] === primary; });
    if (byPrimary.length) return byPrimary[0];
  }
  return FALLBACK;
}

function weekIndex() {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
}

function paintQuote() {
  if (!quotes.length) return;
  const week = weekIndex();
  quoteWeek = week;
  document.getElementById("quote").textContent = quotes[week % quotes.length];
}

function tick() {
  const d = new Date();
  document.getElementById("date").textContent = d.toLocaleDateString(lang, { month: "short", day: "2-digit" });
  document.getElementById("clock").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  if (quoteWeek !== weekIndex()) paintQuote();
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.title = t("appName");
  const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (meta) meta.setAttribute("content", t("shortName"));
  document.getElementById("gear").setAttribute("aria-label", t("settings"));
  document.getElementById("add").setAttribute("aria-label", t("addApp"));
  document.getElementById("ok").textContent = t("confirm");
  document.getElementById("hint").textContent = t("choosePhoto");
  document.getElementById("done").textContent = t("confirm");
  q.placeholder = t("searchPlaceholder");
  document.getElementById("modeGrid").textContent = t("grid");
  document.getElementById("modeList").textContent = t("list");
  document.getElementById("rename").textContent = t("rename");
  document.getElementById("about").textContent = t("about");
  document.getElementById("infoTitle").textContent = t("appName");
  document.getElementById("infoVersion").textContent = t("version");
  document.getElementById("infoAuthor").textContent = t("author");
  document.getElementById("infoBody").textContent = t("aboutBody");
  paintQuote();
  tick();
}

function fetchPack(code) {
  return fetch("Language/" + code + ".json").then(function (r) {
    if (!r.ok) throw new Error("missing");
    return r.json();
  });
}

function fetchQuotes(code) {
  return fetch("quotes/" + code + ".json").then(function (r) {
    if (!r.ok) throw new Error("missing");
    return r.json();
  }).then(function (list) {
    return Array.isArray(list) ? list : [];
  });
}

function bootI18n() {
  const code = resolveLang();
  return fetchPack(code).then(function (pack) {
    lang = code;
    i18n = pack;
  }).catch(function () {
    lang = FALLBACK;
    return fetchPack(FALLBACK).then(function (pack) { i18n = pack; }).catch(function () { i18n = {}; });
  }).then(function () {
    return fetchQuotes(lang).catch(function () { return fetchQuotes(FALLBACK); }).catch(function () { return []; });
  }).then(function (list) {
    quotes = list;
    applyI18n();
  });
}

function paintBg() { art.style.backgroundImage = "url(" + (localStorage.getItem(BG) || ILLU) + ")"; art.style.backgroundPosition = "center"; }
function showHint() { hint.classList.add("on"); clearTimeout(hintT); hintT = setTimeout(function () { hint.classList.remove("on"); }, 3000); }
art.onclick = function () { if (art.classList.contains("edit")) return; if (!hint.classList.contains("on")) { showHint(); return; } file.click(); };
hint.onclick = function (e) { e.stopPropagation(); file.click(); };

file.onchange = function () {
  const f = file.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = function () { art.style.backgroundImage = "url(" + r.result + ")"; art.dataset.raw = r.result; art.classList.add("edit"); hint.classList.remove("on"); };
  r.readAsDataURL(f);
};
art.ontouchstart = art.onmousedown = function (e) {
  if (!art.classList.contains("edit")) return;
  const p = e.touches ? e.touches[0] : e;
  drag = { x: p.clientX, y: p.clientY, px: parseFloat(art.dataset.px || 50), py: parseFloat(art.dataset.py || 50) };
};
art.ontouchmove = art.onmousemove = function (e) {
  if (!drag) return;
  e.preventDefault();
  const p = e.touches ? e.touches[0] : e;
  const px = Math.max(0, Math.min(100, drag.px - (p.clientX - drag.x) / 3));
  const py = Math.max(0, Math.min(100, drag.py - (p.clientY - drag.y) / 3));
  art.dataset.px = px; art.dataset.py = py;
  art.style.backgroundPosition = px + "% " + py + "%";
};
art.ontouchend = art.onmouseup = function () { drag = null; };
document.getElementById("ok").onclick = function (e) {
  e.stopPropagation();
  const img = new Image();
  img.onload = function () {
    const w = art.clientWidth, h = art.clientHeight, c = document.createElement("canvas");
    c.width = w * 2; c.height = h * 2;
    const ctx = c.getContext("2d");
    const ir = img.width / img.height, br = w / h;
    let dw = img.width, dh = img.height, sx = 0, sy = 0;
    if (ir > br) { dw = img.height * br; sx = (img.width - dw) * ((parseFloat(art.dataset.px || 50)) / 100); }
    else { dh = img.width / br; sy = (img.height - dh) * ((parseFloat(art.dataset.py || 50)) / 100); }
    ctx.drawImage(img, sx, sy, dw, dh, 0, 0, c.width, c.height);
    localStorage.setItem(BG, c.toDataURL("image/jpeg", .85));
    art.classList.remove("edit");
    paintBg();
  };
  img.src = art.dataset.raw || localStorage.getItem(BG) || ILLU;
};

function run(id) {
  if (Date.now() < ignoreRunUntil) return;
  location.href = "shortcuts://run-shortcut?name=" + encodeURIComponent(SHORTCUT) + "&input=text&text=" + encodeURIComponent(id);
}
function render() {
  const list = load();
  dock.className = "dock " + mode() + (renaming ? " renaming" : "");
  dock.innerHTML = "";
  list.forEach(function (app, i) {
    const b = document.createElement("button");
    b.className = "app"; b.type = "button";
    b.innerHTML = (app.icon ? '<img src="' + app.icon + '" alt="">' : '<span class="bubble">●</span>') + "<span>" + (app.name || "") + "</span>";
    b.onclick = function (e) {
      if (Date.now() < ignoreRunUntil) { e.preventDefault(); e.stopPropagation(); return; }
      if (!renaming) { run(app.bundleId); return; }
      const name = prompt(t("displayName"), app.name);
      if (name == null) return;
      const all = load(); all[i].name = name.trim() || all[i].name; save(all); render();
    };
    var hold, fired = false;
    b.ontouchstart = function () {
      if (renaming) return;
      fired = false;
      hold = setTimeout(function () { fired = true; remove(i); }, 600);
    };
    b.ontouchmove = function () { clearTimeout(hold); };
    b.ontouchend = function (e) {
      clearTimeout(hold);
      if (fired) { e.preventDefault(); ignoreRunUntil = Date.now() + 800; }
    };
    b.oncontextmenu = function (e) { e.preventDefault(); if (!renaming) remove(i); };
    dock.appendChild(b);
  });
  addBtn.classList.toggle("hide", list.length >= MAX || renaming);
  document.getElementById("modeGrid").classList.toggle("on", mode() === "grid");
  document.getElementById("modeList").classList.toggle("on", mode() === "list");
}
function remove(i) {
  if (deleting) return;
  deleting = true;
  ignoreRunUntil = Date.now() + 900;
  const list = load();
  const ok = !!(list[i] && confirm(t("deleteAsk").replace("{name}", list[i].name)));
  ignoreRunUntil = Date.now() + 900;
  deleting = false;
  if (!ok) return;
  list.splice(i, 1); save(list); render();
}

function openSheet() {
  if (load().length >= MAX) return;
  closePops();
  sysPage = 1;
  online = [];
  onlineTitle = "";
  mask.classList.add("on");
  sheet.classList.add("on");
  q.value = "";
  paintResults("");
}
function closeSheet() { mask.classList.remove("on"); sheet.classList.remove("on"); menu.classList.remove("on"); info.classList.remove("on"); }
function closePops() { menu.classList.remove("on"); info.classList.remove("on"); }
addBtn.onclick = openSheet;
mask.onclick = closeSheet;
document.getElementById("gear").onclick = function () { info.classList.remove("on"); menu.classList.toggle("on"); mask.classList.toggle("on", menu.classList.contains("on")); };
document.getElementById("modeGrid").onclick = function () { localStorage.setItem(MODE, "grid"); render(); };
document.getElementById("modeList").onclick = function () { localStorage.setItem(MODE, "list"); render(); };
document.getElementById("rename").onclick = function () { renaming = true; closeSheet(); done.classList.add("on"); render(); };
done.onclick = function () { renaming = false; done.classList.remove("on"); render(); };
document.getElementById("about").onclick = function () { menu.classList.remove("on"); info.classList.add("on"); mask.classList.add("on"); };

var timer;
q.onfocus = function () { if (!q.value.trim()) suggestOnline(); };
q.oninput = function () {
  clearTimeout(timer);
  sysPage = 1;
  timer = setTimeout(function () {
    const term = q.value.trim();
    if (term.length >= 2) searchStore(term);
    else if (!term) suggestOnline();
    else { online = []; paintResults(term); }
  }, 250);
};
function systemHits(term) {
  const qn = (term || "").toLowerCase();
  return catalog.filter(function (a) { return !qn || a.name.toLowerCase().indexOf(qn) >= 0 || a.bundleId.toLowerCase().indexOf(qn) >= 0; });
}
function hitButton(hit) {
  const b = document.createElement("button");
  b.className = "hit";
  b.type = "button";
  b.innerHTML = '<img src="' + (hit.icon || "") + '" alt=""><div><b>' + (hit.name || "") + "</b><span>" + (hit.bundleId || "") + "</span></div>";
  b.onclick = function () { addApp(hit); };
  return b;
}
function paintResults(term) {
  results.innerHTML = "";
  const hits = systemHits(term);
  if (!catalog.length) {
    results.innerHTML = '<div class="empty">' + t("catalogMissing") + "</div>";
  } else {
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = t("systemApps");
    results.appendChild(label);
    hits.slice(0, sysPage * PAGE).forEach(function (hit) { results.appendChild(hitButton(hit)); });
    if (sysPage * PAGE < hits.length) {
      const more = document.createElement("button");
      more.className = "more";
      more.type = "button";
      more.textContent = t("seeMore");
      more.onclick = function () { sysPage += 1; paintResults(q.value.trim()); };
      results.appendChild(more);
    }
  }
  if (!online.length) return;
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = onlineTitle || t("appStore");
  results.appendChild(label);
  online.slice(0, ONLINE).forEach(function (hit) { results.appendChild(hitButton(hit)); });
}
function storeCountry() {
  const parts = String(lang).split("-");
  return (parts[1] || "gb").toLowerCase();
}
function mapStore(data) {
  return (data.results || []).filter(function (x) { return x.bundleId; }).slice(0, ONLINE).map(function (hit) {
    return { name: shortName(hit.trackName), bundleId: hit.bundleId, icon: hit.artworkUrl100 || hit.artworkUrl60 || "" };
  });
}
function searchStore(term) {
  const cb = "ql_" + Date.now();
  const old = document.getElementById("qljsonp"); if (old) old.remove();
  window[cb] = function (data) {
    delete window[cb];
    const node = document.getElementById("qljsonp"); if (node) node.remove();
    online = mapStore(data);
    onlineTitle = t("appStore");
    paintResults(q.value.trim());
  };
  const s = document.createElement("script"); s.id = "qljsonp";
  s.src = "https://itunes.apple.com/search?term=" + encodeURIComponent(term) + "&entity=software&country=" + storeCountry() + "&limit=10&callback=" + cb;
  document.body.appendChild(s);
}
function suggestOnline() {
  const cb = "ql_" + Date.now();
  const old = document.getElementById("qljsonp"); if (old) old.remove();
  window[cb] = function (data) {
    delete window[cb];
    const node = document.getElementById("qljsonp"); if (node) node.remove();
    online = mapStore(data);
    onlineTitle = t("suggest");
    paintResults(q.value.trim());
  };
  const s = document.createElement("script"); s.id = "qljsonp";
  s.src = "https://itunes.apple.com/search?term=app&entity=software&country=" + storeCountry() + "&limit=10&callback=" + cb;
  document.body.appendChild(s);
}
function addApp(hit) {
  if (load().length >= MAX) return;
  const list = load().filter(function (a) { return a.bundleId !== hit.bundleId; });
  list.push({ name: shortName(hit.name), bundleId: hit.bundleId, icon: hit.icon });
  save(list); render(); closeSheet();
}
function takeCatalog(data) {
  catalog = Object.keys(data || {}).map(function (id) {
    const row = data[id] || {};
    return { bundleId: id, name: shortName(row.Name || row.name || id), icon: iconUrl(row.icon) };
  }).sort(function (a, b) { return a.name.localeCompare(b.name, lang); });
  if (sheet.classList.contains("on")) paintResults(q.value.trim());
}
fetch(JSON_URL).then(function (r) { if (!r.ok) throw new Error("missing"); return r.json(); }).then(takeCatalog).catch(function () {
  fetch("System/SystemApp.json").then(function (r) { return r.json(); }).then(takeCatalog).catch(function () { catalog = []; });
});

paintBg();
showHint();
bootI18n().then(render);
setInterval(tick, 10000);
