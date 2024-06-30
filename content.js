// Extract the text content from the current web page
function getPageContent() {
  return document.body.innerText;
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
