// content.js

// Function to replace the element with class 'beef' with new HTML content and execute scripts
function replaceWithHTML() {
  const beefElement = document.querySelector('.board-layout-sidebar');
  if (beefElement) {
      const iframe = document.createElement('iframe');
      iframe.className = 'greenn'
      iframe.src = "https://cnartato.github.io/chessDisplay"; // Replace with your desired GitHub Pages URL
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
  if (message.action === 'sendMsg') {
    sendMoveMsg('junk', 'junk2')
  }
});

const observer = new MutationObserver((mutationsList, observer) => {
  for (let mutation of mutationsList) {
    if(mutation.addedNodes.length && mutation.addedNodes[0].tagName == 'WC-CHESS-BOARD') {
      let cb = mutation.addedNodes[0]
      let pieces = Array.from(cb.querySelectorAll('.piece'))

      pieces.forEach(pic => {
        pic.setAttribute('uuid', Math.random() * 100)
      })
    }
  }
})

// Configure the observer to watch for specific mutations
const config = { childList: true, subtree: true, attributes: true };

// Start observing the document for mutations
observer.observe(document.body, config)


function sendMoveMsg(newBoard)
{
  let iframe = document.querySelector('.greenn')
  if(!iframe) return console.log('Iframe isnt made yet')
    document.querySelector('.greenn').contentWindow.postMessage(newBoard, '*');
}