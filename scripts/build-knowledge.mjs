// Lit ton portfolio et ton CV EN LOCAL et écrit api/knowledge.txt.
// À relancer chaque fois que tu modifies ton portfolio ou ton CV :
//   npm run knowledge
import fs from "node:fs/promises";
import path from "node:path";

// ⬇️ À ADAPTER (chemins relatifs à la racine du projet)
const PAGES = [];   // ex. ["index.html", "projets.html"]
const CV_PDF = "cv.pdf";        // mets "" si pas de PDF
const CV_TXT = "cv.txt";        // plan B : CV copié en texte brut (utilisé si le PDF échoue)

const OUT = path.join("api", "knowledge.txt");

function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|li|h[1-6]|tr|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

let out = "";

// 1) Pages du portfolio
for (const page of PAGES) {
  if (!(await exists(page))) { console.warn(`⚠️  Page introuvable : ${page}`); continue; }
  const text = htmlToText(await fs.readFile(page, "utf8"));
  out += `\n=== PAGE ${page} ===\n${text.slice(0, 15000)}\n`;
  console.log(`✔ ${page} : ${text.length} caractères`);
}

// 2) CV
let cvText = "";
if (CV_PDF && (await exists(CV_PDF))) {
  try {
    const { default: pdf } = await import("pdf-parse/lib/pdf-parse.js");
    cvText = (await pdf(await fs.readFile(CV_PDF))).text.replace(/\n\s*\n+/g, "\n").trim();
    console.log(`✔ ${CV_PDF} : ${cvText.length} caractères`);
  } catch (e) {
    console.warn(`⚠️  Lecture du PDF impossible (${e.message}). Lance : npm install`);
  }
}
if (!cvText && (await exists(CV_TXT))) {
  cvText = (await fs.readFile(CV_TXT, "utf8")).trim();
  console.log(`✔ ${CV_TXT} : ${cvText.length} caractères`);
}
if (cvText) out += `\n=== CV ===\n${cvText.slice(0, 10000)}\n`;
else console.warn("⚠️  Aucun CV lu (ni PDF ni cv.txt).");


// 3) Informations complémentaires écrites à la main
if (await exists("extra.txt")) {
  const extra = (await fs.readFile("extra.txt", "utf8")).trim();
  out += `\n=== INFORMATIONS COMPLÉMENTAIRES ===\n${extra}\n`;
  console.log(`✔ extra.txt : ${extra.length} caractères`);
}




if (!out.trim()) { console.error("❌ Rien à écrire."); process.exit(1); }

await fs.writeFile(OUT, out.trim() + "\n", "utf8");
console.log(`\n✅ ${OUT} créé (${out.length} caractères). Relis-le pour vérifier.`);