// ===== Fonction serveur du chatbot (Vercel) =====
// Répond aux visiteurs à partir de api/knowledge.txt (généré par `npm run knowledge`).
// Modèle : Groq (palier gratuit, sans carte bancaire).
import fs from "node:fs/promises";
import path from "node:path";

// Vérifie les noms exacts dans console.groq.com (liste des modèles) : ils peuvent évoluer.
const MODEL = "llama-3.3-70b-versatile"; // plan B si quota atteint : "llama-3.1-8b-instant"

const RULES = `Tu es l'assistant du portfolio de son propriétaire. Tu réponds aux visiteurs (recruteurs, clients) à sa place.

RÈGLES
- Réponds uniquement à partir du contenu du portfolio et du CV fournis plus bas.
- Réponses courtes (3 à 5 phrases), chaleureuses et professionnelles.
- Réponds dans la langue du visiteur.
- Si l'information n'est pas dans ces contenus, dis-le poliment et propose de contacter le propriétaire via les coordonnées présentes dans le contenu.
- N'invente jamais d'informations (dates, entreprises, diplômes, projets).`;

const MAX_MESSAGES = 10;
const MAX_CHARS = 500;

let knowledge = null; // lu une seule fois par instance du serveur

async function getKnowledge() {
  if (knowledge !== null) return knowledge;
  try {
    knowledge = await fs.readFile(path.join(process.cwd(), "api", "knowledge.txt"), "utf8");
  } catch (e) {
    console.error("api/knowledge.txt introuvable. Lance `npm run knowledge` puis redéploie.", e);
    knowledge = "";
  }
  return knowledge;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ reply: "Requête invalide." });
  }

  const history = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: String(m.content ?? "").slice(0, MAX_CHARS) }));

  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length) return res.status(400).json({ reply: "Requête invalide." });

  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY manquante");
    return res.status(200).json({ reply: "Le chatbot n'est pas encore configuré." });
  }

  const info = await getKnowledge();
  if (!info) {
    return res.status(200).json({ reply: "Le chatbot n'est pas encore configuré." });
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: "system", content: `${RULES}\n\nCONTENU DU PORTFOLIO ET DU CV\n${info}` },
          ...history,
        ],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Erreur Groq :", r.status, JSON.stringify(data));
      return res.status(200).json({
        reply:
          r.status === 429
            ? "Beaucoup de visiteurs en ce moment, réessayez dans quelques minutes."
            : "Le chatbot rencontre un problème. Réessayez plus tard.",
      });
    }

    const reply =
      (data.choices?.[0]?.message?.content || "").trim() ||
      "Désolé, je n'ai pas de réponse pour le moment.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(200).json({ reply: "Le chatbot est indisponible pour le moment." });
  }
}