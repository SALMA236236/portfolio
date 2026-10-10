// Serveur de test LOCAL : sert ton site et exécute api/chat.js comme le ferait Vercel.
// Aucun compte, aucune installation. Lancement :  npm run dev
// Puis ouvre http://localhost:3000
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.PORT) || 3000;
const ROOT = process.cwd();

// Charge .env.local (ligne attendue : GROQ_API_KEY=gsk_...)
try {
  const env = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* pas de .env.local */
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.statusCode = 400; return res.end("Bad request"); }

  // --- Fonction serveur : /api/chat ---
  if (pathname === "/api/chat") {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try { req.body = JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { req.body = {}; }

      // Mêmes méthodes que Vercel : res.status(...).json(...)
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(obj));
        return res;
      };

      // Le "?t=" force à relire api/chat.js : tes modifications sont prises en compte sans redémarrer
      const mod = await import(pathToFileURL(path.join(ROOT, "api", "chat.js")).href + "?t=" + Date.now());
      await mod.default(req, res);
      if (!res.writableEnded) res.end();
    } catch (err) {
      console.error("Erreur dans api/chat.js :", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ reply: "Erreur serveur (voir le terminal)." }));
    }
    return;
  }

  // --- Fichiers du site ---
  const rel = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = path.resolve(ROOT, rel);
  const relative = path.relative(ROOT, file);
  const blocked =
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    /(^|[\\/])(\.|node_modules)/.test(relative) ||
    /^(api|scripts)([\\/]|$)/.test(relative);

  try {
    if (blocked) throw new Error("bloqué");
    const data = await fs.readFile(file);
    res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Serveur de test : http://localhost:${PORT}`);
  console.log(process.env.GROQ_API_KEY ? "🔑 GROQ_API_KEY détectée" : "⚠️  GROQ_API_KEY absente : crée .env.local (voir instructions)");
  console.log("Arrêter : Ctrl + C\n");
});