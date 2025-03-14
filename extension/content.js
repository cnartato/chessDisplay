// content.js

// Function to replace the element with class 'beef' with new HTML content and execute scripts
function replaceWithHTML() {
  const beefElement = document.querySelector('.board-layout-sidebar');
  if (beefElement) {
      const iframe = document.createElement('iframe');
      iframe.src = "https://cnartato.github.io/tokiPonaQuiz"; // Replace with your desired GitHub Pages URL
      iframe.width = "100%"; // Adjust width as needed
      iframe.height = "500px"; // Adjust height as needed
      iframe.style.border = "none"; // Optional: remove the border of the iframe

      // Replace the 'beef' element with the iframe
      beefElement.replaceWith(iframe);
  } else {
      console.log('No element with class "beef" found.');
  }
}

// Listen for a message from the popup to trigger the replacement
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'replaceBeef') {
      replaceWithHTML();
  }
});