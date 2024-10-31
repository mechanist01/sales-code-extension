export class DialogueBox {
    constructor(dialogueBoxId) {
        this.dialogueBox = document.getElementById(dialogueBoxId);
        if (!this.dialogueBox) {
            this.createDialogueBox(dialogueBoxId);
        }
        this.maxCharacters = 10000;
        this.shouldAutoScroll = true;

        // Add scroll event listener to detect when user manually scrolls
        this.dialogueBox.addEventListener('scroll', () => {
            const isAtBottom = this.isUserAtBottom();
            this.shouldAutoScroll = isAtBottom;
        });
    }

    createDialogueBox(dialogueBoxId) {
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.id = dialogueBoxId;
        this.dialogueBox.className = 'dialogue-box message-box';
        document.body.appendChild(this.dialogueBox);
    }

    updateDialogueBox(text, isBubble = false, addNewLine = false, isPartial = false) {
        if (!text || text.trim() === '') return;

        // Remove any existing undefined paragraphs
        const undefinedParagraphs = this.dialogueBox.getElementsByTagName('p');
        Array.from(undefinedParagraphs).forEach(p => {
            if (p.textContent === 'undefined') {
                p.remove();
            }
        });

        // Always create a message bubble wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'message-bubble';
        if (isPartial) wrapper.classList.add('partial-text');
        if (addNewLine) wrapper.style.marginTop = '1rem';
        
        wrapper.textContent = text;
        this.dialogueBox.appendChild(wrapper);

        while (this.dialogueBox.textContent.length > this.maxCharacters) {
            this.dialogueBox.removeChild(this.dialogueBox.firstChild);
        }

        // Only auto-scroll if user was already at bottom
        if (this.shouldAutoScroll) {
            this.scrollToBottom();
        }
    }

    scrollToBottom() {
        this.dialogueBox.scrollTop = this.dialogueBox.scrollHeight;
    }

    clearDialogue() {
        this.dialogueBox.innerHTML = '';
        this.shouldAutoScroll = true;  // Reset auto-scroll on clear
    }

    isUserAtBottom(threshold = 50) {
        const scrollHeight = this.dialogueBox.scrollHeight;
        const scrollTop = this.dialogueBox.scrollTop;
        const clientHeight = this.dialogueBox.clientHeight;
        
        // Consider "at bottom" if within threshold pixels of bottom
        return scrollHeight - (scrollTop + clientHeight) <= threshold;
    }
}
