export class DialogueBox {
    constructor(dialogueBoxId) {
        this.dialogueBox = document.getElementById(dialogueBoxId);
        this.dialogueEntries = [];
        this.currentText = '';
        this.loadFromLocalStorage();
    }

    updateDialogueBox(text, isHTML = false, isSummary = false, isBubble = false) {
        const entry = { text, isHTML, isSummary, isBubble };
        this.dialogueEntries.push(entry);
        this.appendToDialogueBox(entry);
        this.saveToLocalStorage();
        this.scrollToBottom();
    }

    updateCurrentText(text) {
        this.currentText = text;
        this.renderDialogueBox();
    }

    appendToDialogueBox(entry) {
        let newContent;
        if (entry.isBubble) {
            newContent = `<div class="message-bubble">${entry.text}</div>`;
        } else if (entry.isSummary) {
            newContent = `<div class="summary">${entry.text}</div>`;
        } else if (entry.isHTML) {
            newContent = entry.text;
        } else {
            newContent = `<p>${entry.text}</p>`;
        }
        this.dialogueBox.insertAdjacentHTML('beforeend', newContent);
    }

    renderDialogueBox() {
        this.dialogueBox.innerHTML = this.dialogueEntries.map(entry => {
            if (entry.isSummary) {
                return `<div class="summary">${entry.text}</div>`;
            } else if (entry.isHTML) {
                return entry.text;
            } else if (entry.isBubble) {
                return `<div class="message-bubble">${entry.text}</div>`;
            } else {
                return `<p>${entry.text}</p>`;
            }
        }).join('');

        if (this.currentText) {
            this.dialogueBox.insertAdjacentHTML('beforeend', `<p>${this.currentText}</p>`);
        }

        this.scrollToBottom();
    }

    saveToLocalStorage() {
        if (this.dialogueEntries.length === 0) {
            localStorage.removeItem('dialogueEntries');
        } else {
            localStorage.setItem('dialogueEntries', JSON.stringify(this.dialogueEntries));
        }
    }

    loadFromLocalStorage() {
        const savedEntries = localStorage.getItem('dialogueEntries');
        if (savedEntries) {
            this.dialogueEntries = JSON.parse(savedEntries);
            this.renderDialogueBox();
        }
    }

    clearDialogue() {
        this.dialogueEntries = [];
        this.currentText = '';
        this.renderDialogueBox();
        this.saveToLocalStorage();
    }

    scrollToBottom() {
        this.dialogueBox.scrollTop = this.dialogueBox.scrollHeight;
    }
}
