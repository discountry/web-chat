// Extract the text content from the current web page
function getPageContent() {
  const constructedWebPageData = {
    title: document.title,
    url: window.location.href,
    content: document.body.innerText,
    links: Array.from(document.links).map((link) => link.href),
    images: Array.from(document.images).map((image) => image.src),
    timestamp: new Date().toISOString(),
  }
  return JSON.stringify(constructedWebPageData);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "get_page_content") {
    sendResponse({ content: getPageContent() });
    return true; // Keep the message channel open for sendResponse
  }
});

function addWebChatIframe() {
  const my_web_chart_iframe = document.createElement("iframe");
  my_web_chart_iframe.id = "my-sidebar-iframe"; // 添加 ID
  my_web_chart_iframe.src = chrome.runtime.getURL("popup.html");
  document.body.appendChild(my_web_chart_iframe);
}

// addIframe();
