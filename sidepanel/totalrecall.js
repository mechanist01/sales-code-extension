export function resetAllData() {
    console.log('Resetting all data...');

    // Clear the global array
    window.dialogueEntries = [];

    // Clear localStorage
    localStorage.removeItem('dialogueEntries');

    // Get all possible dialogue box elements
    const dialogueBox = document.querySelector('.dialogue-box');
    const messageBox = document.querySelector('.message-box');
    const dialogueBoxById = document.getElementById('dialogueBox');

    // Clear all possible dialogue box elements
    [dialogueBox, messageBox, dialogueBoxById].forEach(element => {
        if (element) {
            // Remove all child elements
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            // Also set innerHTML to empty
            element.innerHTML = '';
        }
    });

    // Reset displays
    const elements = {
        status: document.getElementById('status'),
        websocketStatus: document.getElementById('websocketStatusText'),
        volumeBar: document.getElementById('volumeBarFill'),
        volumeMeter: document.getElementById('volumeMeterFill')
    };

    if (elements.status) elements.status.textContent = '';
    if (elements.websocketStatus) elements.websocketStatus.textContent = '';
    if (elements.volumeBar) elements.volumeBar.style.width = '0%';
    if (elements.volumeMeter) elements.volumeMeter.style.width = '0%';

    // Force a re-render of the dialogue box
    if (dialogueBox) {
        dialogueBox.style.display = 'none';
        void dialogueBox.offsetHeight; // Force a reflow
        dialogueBox.style.display = 'block';
    }

    console.log('All data reset complete');
}