const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) {} };

// ---------- Langue FR / EN ----------
let lang = store("lang") || (navigator.language.startsWith("en") ? "en" : "fr");
const roles = { fr: ["Élève ingénieure Big Data & IA", "Machine Learning", "Data Engineering"], en: ["Big Data & AI Engineering Student", "Machine Learning", "Data Engineering"] };
function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-fr]").forEach(e => e.textContent = e.dataset[lang]);
  $$("[data-pfr]").forEach(e => e.placeholder = e.dataset[lang === "fr" ? "pfr" : "pen"]);
  $("#lang").textContent = lang === "fr" ? "EN" : "FR";
  store("lang", lang);
}
$("#lang").onclick = () => { lang = lang === "fr" ? "en" : "fr"; applyLang(); };
applyLang();

// ---------- Thème ----------
let theme = store("theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
const setTheme = () => { document.documentElement.dataset.theme = theme; store("theme", theme); };
$("#theme").onclick = () => { theme = theme === "dark" ? "light" : "dark"; setTheme(); };
setTheme();

// ---------- Texte qui s'écrit ----------
(function () {
  let i = 0, j = 0, del = false; const el = $("#typed");
  (function tick() {
    const w = roles[lang][i % roles[lang].length];
    j += del ? -1 : 1; el.textContent = w.slice(0, j);
    let d = del ? 35 : 70;
    if (!del && j === w.length) { del = true; d = 1400; }
    else if (del && j === 0) { del = false; i++; d = 300; }
    setTimeout(tick, d);
  })();
})();

// ---------- Pages de détails (routeur par #) ----------
function route() {
  const id = location.hash.replace("#/", ""), v = id && document.getElementById(id);
  const open = v && v.classList.contains("view");
  $("#home").hidden = open; $("#views").hidden = !open;
  $$(".view").forEach(x => { x.hidden = x !== v; x.classList.toggle("show", x === v); });
  if (open) window.scrollTo(0, 0);
  else if (!location.hash) $("#explore").scrollIntoView();
}
addEventListener("hashchange", route);
route();

// ---------- Filtre des projets ----------
$$(".filters button").forEach(b => b.onclick = () => {
  $$(".filters button").forEach(x => x.classList.toggle("on", x === b));
  $$("#projects .card").forEach(c => c.hidden = !(b.dataset.f === "all" || c.dataset.tags.split(" ").includes(b.dataset.f)));
});

// ---------- Lueur qui suit la souris sur les cartes ----------
document.addEventListener("pointermove", e => {
  const c = e.target.closest(".card"); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty("--x", e.clientX - r.left + "px"); c.style.setProperty("--y", e.clientY - r.top + "px");
});

// ---------- Fond : réseau de neurones animé ----------
(function () {
  const cv = $("#bg"), ctx = cv.getContext("2d"); let W, H, P = [];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight;
    P = Array.from({ length: Math.min(70, W / 16) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 })); }
  function draw() {
    const rgb = getComputedStyle(document.documentElement).getPropertyValue("--dot");
    ctx.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      if (!still) { p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H; }
      ctx.fillStyle = `rgba(${rgb},.7)`; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill();
      for (let k = i + 1; k < P.length; k++) {
        const q = P[k], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 130) { ctx.strokeStyle = `rgba(${rgb},${.22 * (1 - d / 130)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
    });
    if (!still) requestAnimationFrame(draw);
  }
  addEventListener("resize", () => { size(); if (still) draw(); });
  size(); draw();
})();

// ---------- Journey : route en perspective, animée au défilement ----------
(function () {
  const road = $("#road"); if (!road) return;
  const NS = "http://www.w3.org/2000/svg", still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const X = d => 450 + 150 * Math.sin(d * 5) * (.25 + .75 * d), Y = d => 70 + 450 * Math.pow(d, 1.35), HW = d => 4 + 176 * Math.pow(d, 1.2);
  const L = [], R = [];
  for (let i = 0; i <= 60; i++) { const d = i / 60; L.push((X(d) - HW(d)) + "," + Y(d)); R.unshift((X(d) + HW(d)) + "," + Y(d)); }
  $("#rd").setAttribute("points", L.concat(R).join(" "));
  const dg = $("#dash"), N = 16, orb = $("#orb"), stops = $$(".stop", road);
  const rects = Array.from({ length: N }, () => dg.appendChild(document.createElementNS(NS, "rect")));
  stops.forEach(s => { const d = +s.dataset.d; s.style.left = X(d) / 9 + "%"; s.style.top = Y(d) / 5.2 + "%"; s.style.setProperty("--s", .75 + .25 * d);
    s.querySelector(".nd").onclick = () => s.classList.toggle("open"); });
  function layout() { stops.forEach(s => s.style.setProperty("--off", (s.hasAttribute("data-near") ? 32 : HW(+s.dataset.d) * road.clientWidth / 900 + 26) + "px")); }
  addEventListener("resize", layout); layout();
  let ph = 0, cur = still ? 1 : 0;
  function frame() {
    const r = road.getBoundingClientRect(), t = still ? 1 : Math.min(1, Math.max(0, (innerHeight * .9 - r.top) / (r.height * .9)));
    cur += (t - cur) * .08;
    orb.setAttribute("cx", X(cur)); orb.setAttribute("cy", Y(cur)); orb.setAttribute("r", 4 + 9 * cur);
    stops.forEach(s => s.classList.toggle("on", cur >= +s.dataset.d - .03));
    if (!still) ph = (ph + 1 - .0018) % 1;
    rects.forEach((q, i) => { const d = (i / N + ph) % 1;
      q.setAttribute("x", X(d) - (1 + 5 * d) / 2); q.setAttribute("y", Y(d)); q.setAttribute("width", 1 + 5 * d); q.setAttribute("height", 2 + 30 * d * d); q.style.opacity = .15 + .55 * d; });
    if (!still) requestAnimationFrame(frame);
  }
  frame();
})();
$("#dl").onclick = async e => {
  if (!location.protocol.startsWith("http")) return; // ouverture directe du fichier : comportement normal
  e.preventDefault();
  try {
    const blob = await (await fetch("cv.pdf")).blob();
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "CV-Nom-Prenom.pdf" });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    location.href = "cv.pdf"; // en cas d'échec, le CV s'ouvre au lieu de rester bloqué
  }
};