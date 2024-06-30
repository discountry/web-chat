document.addEventListener('DOMContentLoaded', () => {
  const apiTokenInput = document.getElementById('apiToken');
  const saveButton = document.getElementById('saveButton');

  // Load the existing token from storage
  chrome.storage.sync.get(['apiToken'], (result) => {
    if (result.apiToken) {
      apiTokenInput.value = result.apiToken;
    }
  });

  // Save the token to storage
  saveButton.addEventListener('click', () => {
    const apiToken = apiTokenInput.value;
    chrome.storage.sync.set({ apiToken }, () => {
      alert('API Token saved!');
    });
  });
});