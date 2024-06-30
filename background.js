chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.startsWith("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchFromAPI") {
    const apiUrl = `http://localhost:11434/api/chat`;

    chrome.storage.sync.get(["apiToken"], async (result) => {
      try {
        const input = {
          model: "qwen2",
          messages: [
            {
              role: "system",
              content: `根据当前网页内容回答之后对话中我提出的所有问题。网页内容："""${request.context}"""`,
            },
            ...request.history,
            {
              role: "user",
              content: request.message,
            },
          ],
          stream: false,
          options: {
            num_ctx: 40960,
          },
        };

        const response = await fetch(apiUrl, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(input),
        });

        console.log(response);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const resultJson = await response.json();
        console.log(resultJson);
        sendResponse({ success: true, data: resultJson });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

// Function to limit context to 2048 characters
function limitContext(context) {
  return context.trim().slice(0, 2048);
}
