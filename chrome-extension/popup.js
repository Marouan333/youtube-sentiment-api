// A remplacer par l'URL du Hugging Face Space une fois deploye (Phase 6).
const API_URL = "http://localhost:8000/predict_batch";

const analyzeBtn = document.getElementById("analyze");
const resultDiv = document.getElementById("result");

analyzeBtn.addEventListener("click", async () => {
  setStatus("Analyse en cours...");
  analyzeBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url || !tab.url.includes("youtube.com/watch")) {
      throw new Error("Ouvre une video YouTube d'abord.");
    }

    // Re-injecte le content script au cas ou la page a ete chargee avant l'extension.
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    const { comments } = await chrome.tabs.sendMessage(tab.id, { action: "getComments" });

    if (!comments || comments.length === 0) {
      throw new Error("Aucun commentaire trouve. Fais defiler jusqu'aux commentaires.");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments }),
    });
    if (!response.ok) throw new Error(`Erreur API (${response.status})`);

    const data = await response.json();
    renderResult(comments, data.predictions, data.stats);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    analyzeBtn.disabled = false;
  }
});

function setStatus(text, isError) {
  resultDiv.innerHTML = `<p class="${isError ? "error" : "status"}">${text}</p>`;
}

const SECTIONS = [
  { label: 1, name: "Positif", cls: "positive" },
  { label: 0, name: "Neutre", cls: "neutral" },
  { label: -1, name: "Negatif", cls: "negative" },
];

function renderResult(comments, predictions, stats) {
  resultDiv.innerHTML = `<p class="total">${comments.length} commentaires analyses</p>`;

  SECTIONS.forEach(({ label, name, cls }) => {
    const items = comments.filter((_, i) => predictions[i] === label);

    const details = document.createElement("details");
    details.open = label === 1;

    const summary = document.createElement("summary");
    summary.className = `label ${cls}`;
    summary.textContent = `${name} (${items.length})`;
    details.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "comment-list";
    items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Aucun commentaire";
      list.appendChild(li);
    }
    details.appendChild(list);

    resultDiv.appendChild(details);
  });
}
