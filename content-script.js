// Variables to store video player elements and bookmarks
let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];

// Function to fetch bookmarks from storage
const fetchBookmarks = () => {
  return new Promise((resolve) => {
    // Check if the extension context is valid
    if (chrome.runtime && !chrome.runtime.lastError) {
      // Retrieve bookmarks from storage and parse the JSON
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    } else {
      // Log an error if the extension context is invalidated
      console.error("Extension context invalidated.");
      resolve([]);
    }
  });
};

// Event handler for adding a new bookmark
const addNewBookmarkEventHandler = async () => {
  // Get the current timestamp
  const currentTime = youtubePlayer.currentTime;
  // Create a new bookmark object
  const newBookmark = {
    time: currentTime,
    desc: "Bookmark at " + getTime(currentTime),
  };

  // Fetch existing bookmarks
  currentVideoBookmarks = await fetchBookmarks();

  // Update storage with the new bookmark
  chrome.storage.sync.set({
    [currentVideo]: JSON.stringify(
      [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
    ),
  });
};

// Function to handle new video loading
const newVideoLoaded = async () => {
  // Get video player elements
  youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
  youtubePlayer = document.getElementsByClassName("video-stream")[0];

  // Check if the video player elements are present
  if (youtubeLeftControls && youtubePlayer) {
    // Fetch existing bookmarks
    currentVideoBookmarks = await fetchBookmarks();
    // Check if the bookmark button already exists
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    if (!bookmarkBtnExists) {
      // Create a new bookmark button
      const bookmarkBtn = document.createElement("img");
      bookmarkBtn.src = chrome.runtime.getURL("icons/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      // Append the button to the video player controls
      youtubeLeftControls.appendChild(bookmarkBtn);
      // Add event listener to the bookmark button
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);

      return true; // Indicates the bookmark button was added
    } else {
      return false; // Indicates the bookmark button already exists
    }
  }

  return false; // Indicates the video player elements are not present
};

// Listener for messages from the popup
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
  const { type, value, videoId } = obj;

  if (type === "NEW") {
    // Update the current video ID
    currentVideo = videoId;
    // Call the function to handle new video loading and send the response
    response(await newVideoLoaded());
  } else if (type === "PLAY") {
    // Set the video player's current time
    youtubePlayer.currentTime = value;
  } else if (type === "DELETE") {

    // Remove the bookmark with the specified time
    currentVideoBookmarks = currentVideoBookmarks.filter(
      (b) => b.time != value
    );
    // Update storage with the modified bookmarks
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
    });

    // Send the updated bookmarks as a response
    response(currentVideoBookmarks);
  }
});

// Function to format time
const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};
