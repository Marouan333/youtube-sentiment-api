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
    renderStats(data.stats, comments.length);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    analyzeBtn.disabled = false;
  }
});

function setStatus(text, isError) {
  resultDiv.innerHTML = `<p class="${isError ? "error" : "status"}">${text}</p>`;
}

function renderStats(stats, total) {
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  resultDiv.innerHTML = `
    <p class="total">${total} commentaires analyses</p>
    <div class="bar"><span class="label positive">Positif</span><span>${stats.positive} (${pct(stats.positive)}%)</span></div>
    <div class="bar"><span class="label neutral">Neutre</span><span>${stats.neutral} (${pct(stats.neutral)}%)</span></div>
    <div class="bar"><span class="label negative">Negatif</span><span>${stats.negative} (${pct(stats.negative)}%)</span></div>
  `;
}
