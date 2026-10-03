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
if ($("#dl")) $("#dl").onclick = async e => {
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


// ---------- Fenêtre de détails d'un projet ----------
const dlg = $("#pd");
if (dlg) {
  $$("#projects .pc").forEach(c => {
    const open = () => {
      $("#pdc").innerHTML = c.querySelector(".kind").outerHTML + c.querySelector("h3").outerHTML + c.querySelector(".t").outerHTML + c.querySelector(".det").innerHTML;
      applyLang();
      dlg.showModal();
    };
    c.onclick = open;
    c.onkeydown = e => { if (e.key === "Enter") open(); };
  });
  dlg.onclick = e => { if (e.target === dlg) dlg.close(); };
}

// ---------- Compétences : liste de catégories + panneau avec logos ----------
(function () {
  const v = $("#skills"); if (!v || $(".sk2", v)) return;
  const cards = $$(".card", v).filter(c => c.querySelector("h3") && c.querySelector(".t"));
  if (!cards.length) { console.warn("Compétences : aucune carte trouvée dans #skills"); return; }

  // Logos de marques (Simple Icons)
  const ICONS = {
    "python": "python", "java": "openjdk", "javascript": "javascript",
    "hadoop": "apachehadoop", "spark": "apachespark", "pyspark": "apachespark", "kafka": "apachekafka",
    "flink": "apacheflink", "hive": "apachehive", "airflow": "apacheairflow", "talend": "talend", "prefect": "prefect",
    "dbt": "dbt", "databricks": "databricks",
    "mysql": "mysql", "postgresql": "postgresql", "oracle": "oracle", "snowflake": "snowflake", "mongodb": "mongodb", "neo4j": "neo4j",
    "docker": "docker", "docker swarm": "docker", "kubernetes": "kubernetes",
    "django": "django", "flask": "flask", "fastapi": "fastapi", "react": "react", "node.js": "nodedotjs", "prisma": "prisma",
    "pandas": "pandas", "numpy": "numpy", "power bi": "powerbi", "tableau": "tableau",
    "git": "git", "github": "github", "dvc": "dvc", "ubuntu server": "ubuntu", "linux": "linux"
  };

  // Icônes dessinées pour les concepts et les marques sans logo
  const P = {
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    ml: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6l3.5 5M7 18l3.5-5M13.5 11L17 7M13.5 13L17 17"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    term: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10l3 2-3 2M12 15h5"/>',
    chart: '<path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"/>'
  };
  const GEN = {
    "sql": "db", "chromadb": "db", "delta lake": "layers", "machine learning": "ml", "deep learning": "layers", "nlp": "chat",
    "recommender systems": "star", "predictive maintenance": "wrench", "rest apis": "code", "linux scripting": "term",
    "data visualization": "chart"
  };
  const generic = key => { const i = document.createElement("i"); i.className = "ic g";
    i.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + P[GEN[key] || "cube"] + '</svg>'; return i; };

  const nav = document.createElement("div"), panel = document.createElement("div"), wrap = document.createElement("div");
  nav.className = "skn"; panel.className = "skp"; wrap.className = "sk2";
  wrap.append(nav, panel);
  const box = cards[0].parentElement; box.after(wrap); box.style.display = "none";
  let cur = 0;
  const btns = cards.map((c, i) => {
    const h = c.querySelector("h3"), b = document.createElement("button");
    b.dataset.fr = h.dataset.fr; b.dataset.en = h.dataset.en; b.textContent = h.textContent;
    b.onclick = () => show(i); nav.append(b); return b;
  });
  const slugify = k => k.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function show(i) {
    cur = i;
    btns.forEach((b, k) => b.classList.toggle("on", k === i));
    panel.innerHTML = cards[i].querySelector("h3").outerHTML + cards[i].querySelector(".t").outerHTML;
    applyLang();
    
        $$(".t span", panel).forEach((s, k) => {
      s.style.setProperty("--i", k);
      const key = (s.dataset.en || s.textContent).trim().toLowerCase(), cdn = ICONS[key];
      const im = new Image(); im.className = "ic"; im.alt = "";
      const fallback = () => im.replaceWith(generic(key));
      im.onerror = () => {
        if (!im.dataset.t) { im.dataset.t = 1; cdn ? (im.src = "https://cdn.simpleicons.org/" + cdn) : fallback(); }
        else fallback();
      };
      im.src = "icons/" + slugify(key) + ".svg"; // 1) ton fichier local
      s.prepend(im);
    });

  }
  show(0);
  $("#lang").addEventListener("click", () => show(cur)); // garde les icônes après le changement de langue
})();






// ---------- Langues & intérêts : tableau de bord du profil ----------
(function () {
  const v = $("#languages"); if (!v) return;
  const ks = $$(".kpi", v), ps = $$(".dp", v);
  function count() {
    ks.forEach(k => { const b = $("b", k), n = +b.dataset.n; let i = 0; b.textContent = 0;
      const t = setInterval(() => { b.textContent = ++i; if (i >= n) clearInterval(t); }, 140); });
  }
  function open(id) {
    ks.forEach(k => k.classList.toggle("on", k.dataset.t === id));
    ps.forEach(p => { const on = p.id === "dp-" + id; p.hidden = !on; p.classList.remove("show");
      if (on) requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("show"))); });
  }
  ks.forEach(k => k.onclick = () => open(k.dataset.t));
  addEventListener("hashchange", () => { if (location.hash === "#/languages") { count(); open("l"); } });
  open("l"); if (location.hash === "#/languages") count();
})();



// ---------- Photo en grand au clic sur l'icône d'une compétence ----------
(function () {
  const lb = $("#lb"); if (!lb) return;
  const im = $("img", lb), cap = $("p", lb);
  $$(".ps .ico").forEach((ic, i) => {
    const open = () => {
      const src = ic.dataset.photo || `photos/skill-${i + 1}.jpg`;
      im.onerror = () => { lb.close(); console.warn("Photo introuvable : " + src); };
      cap.textContent = ic.closest(".ps").querySelector("h4").textContent;
      im.src = src;
      if (!lb.open) lb.showModal();
    };
    ic.tabIndex = 0; ic.setAttribute("role", "button");
    ic.onclick = open;
    ic.onkeydown = e => { if (e.key === "Enter") open(); };
  });
  lb.onclick = () => lb.close();
})();


// ---------- Centres d'intérêt : index + panneau « ce que cela m'apporte » ----------
(function () {
  const items = $$(".ib"), pan = $(".id"); if (!items.length || !pan) return;
  let cur = 0;
  const txt = (it, s) => (it.querySelector(s)?.textContent || "").trim();
  function show(i) {
    cur = i;
    items.forEach((x, k) => x.classList.toggle("on", k === i));
    const it = items[i], name = txt(it, "b"), desc = txt(it, "p"), tags = txt(it, "u");
    if (!desc || !tags) console.warn(`Intérêt « ${name} » : il manque ${!desc ? "la balise <p hidden>" : ""} ${!tags ? "la balise <u hidden>" : ""} dans son bloc`);
    pan.style.setProperty("--c", it.style.getPropertyValue("--c"));
    pan.innerHTML =
      `<div class="big">${it.querySelector("svg")?.outerHTML || ""}</div>` +
      `<small>${txt(it, "i")} / ${String(items.length).padStart(2, "0")}</small>` +
      `<h3>${name}</h3><p>${desc}</p>` +
      (tags ? `<h5>${lang === "fr" ? "Ce que cela m'apporte" : "What it brings me"}</h5>` +
        `<div class="tg">${tags.split("·").map(t => `<span>${t.trim()}</span>`).join("")}</div>` : "");
    pan.classList.remove("in"); void pan.offsetWidth; pan.classList.add("in");
  }
  items.forEach((it, i) => { it.onmouseenter = () => show(i); it.onclick = () => show(i); it.onfocus = () => show(i); });
  show(0);
  $("#lang").addEventListener("click", () => show(cur));
})();