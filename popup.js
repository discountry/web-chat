document.addEventListener("DOMContentLoaded", () => {
  const chat = document.getElementById("chat");
  const input = document.getElementById("input");
  const sendButton = document.getElementById("sendButton");
  const summarizeButton = document.getElementById("summarizeButton");
  let pageContent = "";
  let chatHistory = [];
  let botBubble = null;

  // Request the page content from the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    if (chrome.scripting) {
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ["content.js"],
        },
        () => {
          chrome.tabs.sendMessage(
            activeTab.id,
            { message: "get_page_content" },
            (response) => {
              if (response && response.content) {
                pageContent = response.content;
              }
            }
          );
        }
      );
    }
  });

  const createChatBubble = (sender, message) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-bubble");
  
    // 创建复制按钮
    const copyButton = document.createElement("button");
    copyButton.classList.add("copy-button");
    copyButton.textContent = "复制";
  
    // 添加复制功能
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(message)
        .then(() => {
          // 修改按钮文字为 👌
          copyButton.textContent = "👌";
          // 延迟 1 秒后恢复原文字
          setTimeout(() => {
            copyButton.textContent = "复制";
          }, 300);
        })
        .catch(err => {
          console.error("复制失败：", err);
        });
    });
  
    if (sender === "Bot") {
      messageElement.classList.add("bot");
      messageElement.innerHTML = marked.parse(message);
    } else if (sender === "You") {
      messageElement.classList.add("you");
      messageElement.textContent = message;
    } else {
      messageElement.classList.add("system");
      messageElement.textContent = message;
    }
  
    // 将按钮添加到气泡
    messageElement.appendChild(copyButton);
  
    chat.appendChild(messageElement);
    chat.scrollTop = chat.scrollHeight;

    return messageElement;
  };
  
  const sendMessage = (message) => {
    createChatBubble("You", message);
    // 创建一个临时的 bot 气泡，内容为省略号
    botBubble = createChatBubble("Bot", "..."); // 这里添加临时气泡
  
    chrome.runtime.sendMessage(
      {
        action: "fetchFromAPI",
        message,
        context: pageContent,
        history: chatHistory,
      },
      (response) => {
        if (!response.success) {
          console.error("Error:", response.error);
          createChatBubble("Error", response.error);
        }
      }
    );
  };

  // 监听来自后台脚本的流式更新消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "streamUpdate") {
      const botMessage = message.content;
      if (botBubble) {
        botBubble.innerHTML = marked.parse(botMessage); // 更新临时 bot 气泡内容
      }
      chat.scrollTop = chat.scrollHeight; // 保持滚动条在底部
    }
  });

  sendButton.addEventListener("click", () => {
    const userMessage = input.value.trim();
    if (userMessage) {
      input.value = "";
      sendMessage(userMessage);
    }
  });

  summarizeButton.addEventListener("click", () => {
    sendMessage("总结当前网页内容。");
  });

  input.addEventListener("keydown", (event) => {
    // 检查是否处于输入组合状态，如果是，则忽略Enter键
    if (event.isComposing) {
      return;
    }

    // 检查按下的键是否是Enter键
    if (event.key === "Enter") {
      sendButton.click();
    }
  });
});