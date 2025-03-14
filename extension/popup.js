// popup.js
document.getElementById('replaceButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Send a message to the content script of the current tab
        chrome.tabs.sendMessage(tabs[0].id, { action: "replaceBeef" });
    });
});
document.getElementById('testButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Send a message to the content script of the current tab
        chrome.tabs.sendMessage(tabs[0].id, { action: "sendMsg" });
    });
});
