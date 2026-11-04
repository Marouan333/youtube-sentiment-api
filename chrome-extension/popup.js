// URL publique du Codespace (GitHub Codespaces, Phase 6).
// Attention : change a chaque redemarrage du Codespace -> relancer docker run et mettre a jour ici.
const API_URL = "https://friendly-eureka-r5pv45q9r763wq44-7860.app.github.dev/predict_batch";

const analyzeBtn = document.getElementById("analyze");
const resultDiv = document.getElementById("result");

const CATEGORIES = [
  { key: "all", label: "Tous", cls: "all" },
  { key: 1, label: "Positif", cls: "positive" },
  { key: 0, label: "Neutre", cls: "neutral" },
  { key: -1, label: "Negatif", cls: "negative" },
];

let state = { comments: [], predictions: [], filter: "all" };

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
    state = { comments, predictions: data.predictions, filter: "all" };
    render();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    analyzeBtn.disabled = false;
  }
});

function setStatus(text, isError) {
  resultDiv.innerHTML = `<p class="${isError ? "error" : "status"}">${text}</p>`;
}

function counts() {
  const c = { all: state.comments.length, 1: 0, 0: 0, "-1": 0 };
  state.predictions.forEach((p) => c[p]++);
  return c;
}

function render() {
  resultDiv.innerHTML = "";
  const total = state.comments.length;
  const c = counts();
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const summary = document.createElement("div");
  summary.className = "summary";
  [
    { name: "Positif", cls: "positive", n: c[1] },
    { name: "Neutre", cls: "neutral", n: c[0] },
    { name: "Negatif", cls: "negative", n: c[-1] },
  ].forEach(({ name, cls, n }) => {
    const box = document.createElement("div");
    box.className = `stat ${cls}`;
    box.innerHTML = `<span class="stat-pct">${pct(n)}%</span><span class="stat-name">${name}</span><span class="stat-n">${n}</span>`;
    summary.appendChild(box);
  });
  resultDiv.appendChild(summary);

  const tabs = document.createElement("div");
  tabs.className = "tabs";
  CATEGORIES.forEach(({ key, label, cls }) => {
    const btn = document.createElement("button");
    btn.className = `tab ${cls}` + (state.filter === key ? " active" : "");
    btn.textContent = `${label} (${c[key]})`;
    btn.addEventListener("click", () => {
      state.filter = key;
      render();
    });
    tabs.appendChild(btn);
  });
  resultDiv.appendChild(tabs);

  const list = document.createElement("ul");
  list.className = "comment-list";
  state.comments.forEach((text, i) => {
    const label = state.predictions[i];
    if (state.filter !== "all" && label !== state.filter) return;

    const li = document.createElement("li");
    const tag = document.createElement("span");
    const tagInfo = CATEGORIES.find((cat) => cat.key === label);
    tag.className = `tag ${tagInfo ? tagInfo.cls : ""}`;
    tag.textContent = tagInfo ? tagInfo.label : "?";
    li.appendChild(tag);

    const span = document.createElement("span");
    span.textContent = text;
    li.appendChild(span);

    list.appendChild(li);
  });
  if (!list.children.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Aucun commentaire";
    list.appendChild(li);
  }
  resultDiv.appendChild(list);
}
