// Function to initialize the content script on page load or history state change
const initializeVideoContentScript = (tabId, url) => {
  // Extract videoId from the URL parameters
  const videoId = new URLSearchParams(new URL(url).search).get("v");

  if (videoId) {
    chrome.tabs.sendMessage(tabId, { type: "NEW", videoId });
  }
};

// Event listener for changes in history state (e.g., when navigating within a page)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // Check if the updated URL is a YouTube video page
  if (details.url.includes("youtube.com/watch")) {
    
    initializeVideoContentScript(details.tabId, details.url);
  }
});

// Event listener for changes in the status of a tab (e.g., when a tab finishes loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the status change indicates that the page has finished loading
  if (
    changeInfo.status === "complete" &&
    tab.url.includes("youtube.com/watch")
  ) {
    
    initializeVideoContentScript(tabId, tab.url);
  }
});
