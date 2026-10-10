// ===== Chatbot du portfolio =====
(function () {
  // --- Réglages à adapter ---
  const WELCOME = "Bonjour ! Je suis l'assistant de ce portfolio. Posez-moi une question sur le parcours, les compétences ou les projets.";
  const SUGGESTIONS = ["Quels sont tes projets ?", "Quelles sont tes compétences ?", "Comment te contacter ?"];
  const API_URL = "/api/chat";
  const MAX_HISTORY = 10;        // nombre de messages envoyés à l'IA
  const MAX_INPUT = 500;         // longueur max d'un message
  const MAX_PER_SESSION = 30;    // messages max par visite (protège ton quota gratuit)

  // --- Création de l'interface ---
  const root = document.createElement("div");
  root.innerHTML = `
    <button id="chat-toggle" type="button" aria-label="Ouvrir le chat" aria-expanded="false" aria-controls="chat-box">💬</button>
    <section id="chat-box" hidden aria-label="Assistant du portfolio">
      <div class="chat-header">Assistant du portfolio</div>
      <div id="chat-messages" role="log" aria-live="polite"></div>
      <div id="chat-suggestions"></div>
      <form id="chat-form" autocomplete="off">
        <input id="chat-input" type="text" maxlength="${MAX_INPUT}" placeholder="Écrivez votre question" aria-label="Votre question" />
        <button id="chat-send" type="submit">Envoyer</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const toggle = document.getElementById("chat-toggle");
  const box = document.getElementById("chat-box");
  const msgs = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const suggestions = document.getElementById("chat-suggestions");

  let history = [];
  let sent = 0;
  let busy = false;

  function addMsg(text, cls) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.textContent = text; // textContent : pas d'injection HTML possible
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function renderSuggestions() {
    suggestions.innerHTML = "";
    SUGGESTIONS.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.onclick = () => send(q);
      suggestions.appendChild(b);
    });
  }

  toggle.addEventListener("click", () => {
    box.hidden = !box.hidden;
    toggle.setAttribute("aria-expanded", String(!box.hidden));
    if (!box.hidden) {
      if (!msgs.children.length) {
        addMsg(WELCOME, "bot");
        renderSuggestions();
      }
      input.focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) {
      box.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });

  async function send(text) {
    text = (text || "").trim().slice(0, MAX_INPUT);
    if (!text || busy) return;

    if (sent >= MAX_PER_SESSION) {
      addMsg("Limite de messages atteinte pour cette visite. Merci de me contacter directement.", "bot error");
      return;
    }

    suggestions.innerHTML = "";
    input.value = "";
    addMsg(text, "user");
    history.push({ role: "user", content: text });
    sent++;

    busy = true;
    sendBtn.disabled = true;
    const loading = addMsg("Je réfléchis…", "bot loading");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      loading.className = "msg bot";
      loading.textContent = data.reply;
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      loading.className = "msg bot error";
      loading.textContent = "Le message n'a pas pu être envoyé. Réessayez dans un instant.";
      history.pop(); // on retire la question pour garder un historique valide
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
  });
})();