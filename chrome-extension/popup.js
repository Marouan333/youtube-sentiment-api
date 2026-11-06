// URL publique du Codespace (GitHub Codespaces, Phase 6).
// Attention : change a chaque redemarrage du Codespace -> relancer docker run et mettre a jour ici.
const API_URL = "https://friendly-eureka-r5pv45q9r763wq44-7860.app.github.dev/predict_batch";

const analyzeBtn = document.getElementById("analyze");
const copyBtn = document.getElementById("copy");
const themeToggleBtn = document.getElementById("theme-toggle");
const resultDiv = document.getElementById("result");

chrome.storage.local.get(["theme"], ({ theme }) => {
  applyTheme(theme === "light" ? "light" : "dark");
});

themeToggleBtn.addEventListener("click", () => {
  const next = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
});

function applyTheme(theme) {
  if (theme === "light") {
    document.body.setAttribute("data-theme", "light");
    themeToggleBtn.textContent = "☼";
  } else {
    document.body.removeAttribute("data-theme");
    themeToggleBtn.textContent = "☽";
  }
}

copyBtn.addEventListener("click", async () => {
  if (!state.comments.length) return;
  const labelFor = (key) => CATEGORIES.find((c) => c.key === key)?.label || "?";
  const c = counts();
  const lines = [
    `YouTube Sentiment - resultats (${state.comments.length} commentaires)`,
    `Positif: ${c[1]} | Neutre: ${c[0]} | Negatif: ${c[-1]}`,
    "",
    ...state.comments.map((text, i) => `[${labelFor(state.predictions[i])}] ${text}`),
  ];
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    copyBtn.classList.add("copied");
    setTimeout(() => copyBtn.classList.remove("copied"), 1200);
  } catch (err) {
    setStatus("Impossible de copier: " + err.message, true);
  }
});

const CATEGORIES = [
  { key: "all", label: "Tous", cls: "all" },
  { key: 1, label: "Positif", cls: "positive" },
  { key: 0, label: "Neutre", cls: "neutral" },
  { key: -1, label: "Negatif", cls: "negative" },
];

let state = { comments: [], predictions: [], filter: "all" };

// Fonction injectee directement dans la page YouTube : traverse le Shadow DOM
// pour trouver les commentaires et renvoie le resultat via chrome.scripting.
function extractCommentsFromPage() {
  function queryAllDeep(selector, root) {
    let results = Array.from(root.querySelectorAll(selector));
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) results = results.concat(queryAllDeep(selector, el.shadowRoot));
    });
    return results;
  }
  return queryAllDeep("#content-text", document)
    .map((el) => el.innerText.trim())
    .filter(Boolean);
}

analyzeBtn.addEventListener("click", async () => {
  setStatus("Analyse en cours...");
  analyzeBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url || !tab.url.includes("youtube.com/watch")) {
      throw new Error("Ouvre une video YouTube d'abord.");
    }

    const [{ result: comments }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCommentsFromPage,
    });

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
  copyBtn.disabled = state.comments.length === 0;
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
