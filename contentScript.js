chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pasteStickyContent') {
        // First get the note content
        chrome.runtime.sendMessage({ action: 'getNoteContent' }, response => {
            if (response.content) {
                // Get the active element (input or textarea)
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    const start = activeElement.selectionStart;
                    const end = activeElement.selectionEnd;
                    const currentValue = activeElement.value;
                    
                    // Insert the sticky note content at cursor position
                    activeElement.value = 
                        currentValue.substring(0, start) + 
                        response.content + 
                        currentValue.substring(end);
                    
                    // Move cursor after the pasted content
                    activeElement.setSelectionRange(
                        start + response.content.length,
                        start + response.content.length
                    );
                }
            }
        });
    }
});