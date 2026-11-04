// A remplacer par l'URL du Hugging Face Space une fois deploye (Phase 6).
const API_URL = "http://localhost:8000/predict_batch";

document.getElementById("analyze").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "Analyse en cours...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { comments } = await chrome.tabs.sendMessage(tab.id, { action: "getComments" });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments }),
  });
  const data = await response.json();

  resultDiv.textContent = `Positif: ${data.stats.positive} | Neutre: ${data.stats.neutral} | Negatif: ${data.stats.negative}`;
});
