// Extrait les commentaires visibles sur la page YouTube.
function getComments() {
  const nodes = document.querySelectorAll("#content-text");
  return Array.from(nodes).map((n) => n.innerText).filter(Boolean);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getComments") {
    sendResponse({ comments: getComments() });
  }
});
