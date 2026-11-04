// Extrait les commentaires visibles sur la page YouTube (traverse le Shadow DOM).
if (!window.__ytSentimentInjected) {
  window.__ytSentimentInjected = true;

  function queryAllDeep(selector, root) {
    let results = Array.from(root.querySelectorAll(selector));
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        results = results.concat(queryAllDeep(selector, el.shadowRoot));
      }
    });
    return results;
  }

  function getComments() {
    return queryAllDeep("#content-text", document)
      .map((el) => el.innerText.trim())
      .filter(Boolean);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getComments") {
      sendResponse({ comments: getComments() });
    }
  });
}
