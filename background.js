console.log('Background script loaded');

// Function to log all existing offscreen documents.
/**
 * Function to log all existing offscreen documents.
 */
async function logExistingOffscreenDocuments() {
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    if (contexts.length > 0) {
      console.log('Existing offscreen documents:', contexts);
    } else {
      console.log('No existing offscreen documents found.');
    }
  } catch (error) {
    console.error('Error retrieving offscreen documents:', error);
  }
}

// Call this function to log existing offscreen documents
logExistingOffscreenDocuments();

// Listener for action button click to open the side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Action clicked, attempting to open side panel and open HTML document in a new tab');
    
    // Open the side panel
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('Side panel opened');

    // Check if offscreen document already exists
    const existingDocument = await getExistingOffscreenDocument();
    
    if (existingDocument) {
      console.log('Offscreen document already exists');
    } else {
      console.log('Opening new tab with HTML document');
      chrome.tabs.create({ 
        url: 'offscreen.html', 
        active: false, // Open in the background
        index: 0 // Open as the very first tab
      }, (newTab) => {
        console.log('New tab opened with HTML document:', newTab);
      });
    }
  } catch (error) {
    console.error('Error in action.onClicked listener:', error);
  }
});

/**
 * Function to get audible tabs.
 * @returns {Promise<Array>} - A promise that resolves to an array of audible tabs.
 */
function getAudibleTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({audible: true}, (tabs) => {
      console.log('Audible tabs found:', tabs);
      resolve(tabs);
    });
  });
}

/**
 * Function to get existing offscreen document.
 * @returns {Promise<Object|null>} - A promise that resolves to the existing offscreen document or null.
 */
async function getExistingOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: ['offscreen.html']
  });
  return existingContexts[0] || null;
}

// Listener for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === "getAudibleTabs") {
    getAudibleTabs().then(tabs => {
      console.log('Sending response with tabs:', tabs);
      sendResponse({tabs: tabs});
    });
    return true;  // Indicates we will send a response asynchronously
  } else if (request.action === "getMediaStreamId") {
    chrome.tabCapture.getMediaStreamId(
      { consumerTabId: sender.tab ? sender.tab.id : null, targetTabId: request.tabId },
      (streamId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ streamId: streamId });
        }
      }
    );
    return true;  // Indicates we will send a response asynchronously
  //} else if (request.action === "createOffscreenDocument") {
    console.log("Received request to create offscreen document");
    getExistingOffscreenDocument().then(existingDocument => {
      if (existingDocument) {
        console.log("Offscreen document already exists");
        sendResponse({ success: true });
      } else {
        console.log("Creating new offscreen document");
        chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['USER_MEDIA'],
          justification: 'Request microphone permission'
        }).then(() => {
          console.log("Offscreen document created successfully");
          sendResponse({ success: true });
        }).catch((error) => {
          console.error("Error creating offscreen document:", error);
          sendResponse({ success: false, error: error.message });
        });
      }
    }).catch(error => {
      console.error("Error checking for existing offscreen document:", error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Log when the background script is unloaded
chrome.runtime.onSuspend.addListener(() => {
  console.log('Background script unloaded');
});

// Save API key to storage on installation or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ assemblyAIKey: '189b301d34764c52927f66083fb7c0b9' }, () => {
    console.log('API key saved');
  });
});
