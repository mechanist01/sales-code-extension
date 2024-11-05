async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone access granted");
    stream.getTracks().forEach(track => track.stop());
    chrome.runtime.sendMessage({ action: "microphoneAccessGranted" });
  } catch (error) {
    console.error("Error requesting microphone permission", error);
    if (error.name === 'NotAllowedError') {
      chrome.runtime.sendMessage({ action: "microphoneAccessDenied", error: "Permission dismissed" });
    } else {
      chrome.runtime.sendMessage({ action: "microphoneAccessDenied", error: error.message });
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "requestMicrophonePermission") {
    requestMicrophonePermission();
  }
});

// Request microphone permission when the offscreen document is loaded
requestMicrophonePermission();