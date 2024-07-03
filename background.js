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
              content: `今天是${new Date().toLocaleTimeString()}根据当前网页内容回答之后对话中我提出的所有问题。网页内容："""${request.context}"""`,
            },
            ...request.history,
            {
              role: "user",
              content: request.message,
            },
          ],
          stream: true, // Enable streaming
          options: {
            num_ctx: 40960,
          },
        };

        const response = await fetch(apiUrl, {
          method: "POST",
          body: JSON.stringify(input),
        });

        const reader = response.body.getReader();
        if (!reader) {
          throw new Error("Failed to read response body")
        }

        const decoder = new TextDecoder("utf-8");
        let partialMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const rawJson = decoder.decode(value, { stream: true });
          const jsonContent = JSON.parse(rawJson);

          partialMessage += jsonContent.message.content;

          if (partialMessage) {
            chrome.runtime.sendMessage({
              action: "streamUpdate",
              content: partialMessage,
            });
          }
        }

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });

    return true;
  }
});

// Function to limit context to 2048 characters
function limitContext(context) {
  return context.trim().slice(0, 2048);
}