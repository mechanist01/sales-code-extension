export class WordsMerger {
    constructor(dialogueBoxId) {
        this.dialogueBoxId = dialogueBoxId;
        this.dialogueBox = document.getElementById(dialogueBoxId);
        if (!this.dialogueBox) {
            this.createDialogueBox();
        }
        this.currentText = '';
        this.lastPartialText = '';
        this.dialogueBoxInstance = null;
        this.emptyResponseCount = 0;
        this.bubbles = [];
        this.currentBubbleText = '';
        this.EMPTY_THRESHOLD = 4; // Changed to 4 empty responses
    }

    createDialogueBox() {
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.id = this.dialogueBoxId;
        this.dialogueBox.className = 'dialogue-box';
        document.body.appendChild(this.dialogueBox);
    }

    processApiResponse(response) {
        if (!response || !response.message_type) return;

        if (response.message_type === 'PartialTranscript') {
            if (!response.text || response.text.trim() === '') {
                this.emptyResponseCount++;
                if (this.emptyResponseCount >= this.EMPTY_THRESHOLD && this.currentBubbleText.trim()) {
                    // Only create a new bubble if we have accumulated text
                    this.bubbles.push(this.currentBubbleText.trim());
                    this.currentBubbleText = '';
                    this.currentText = '';
                    this.lastPartialText = '';
                    this.emptyResponseCount = 0;
                }
            } else {
                // Reset empty count and update current text
                this.emptyResponseCount = 0;
                this.lastPartialText = response.text;
                this.currentText = response.text;
            }
            this.updateDialogueBox();
        } else if (response.message_type === 'FinalTranscript') {
            if (response.text && response.text.trim()) {
                // Add the final text to the current bubble text
                const finalText = response.text.trim();
                if (!this.currentBubbleText.includes(finalText)) {
                    if (this.currentBubbleText) {
                        this.currentBubbleText += ' ' + finalText;
                    } else {
                        this.currentBubbleText = finalText;
                    }
                }
                this.currentText = '';
            }
            this.emptyResponseCount = 0;
            this.updateDialogueBox();
        }
    }

    updateDialogueBox() {
        if (this.dialogueBoxInstance) {
            // Clear the dialogue box
            this.dialogueBoxInstance.clearDialogue();

            // Display all completed bubbles
            this.bubbles.forEach((bubble, index) => {
                this.dialogueBoxInstance.updateDialogueBox(bubble, true, index > 0);
            });

            // Display current bubble text plus any partial text
            let displayText = this.currentBubbleText;
            if (this.currentText && !displayText.endsWith(this.currentText)) {
                displayText = displayText ? `${displayText} ${this.currentText}` : this.currentText;
            }

            if (displayText.trim()) {
                this.dialogueBoxInstance.updateDialogueBox(
                    displayText,
                    true,
                    this.bubbles.length > 0,
                    Boolean(this.currentText)
                );
            }
        }
    }

    reset() {
        this.currentText = '';
        this.lastPartialText = '';
        this.emptyResponseCount = 0;
        this.bubbles = [];
        this.currentBubbleText = '';
    }

    clearDialogue() {
        this.reset();
        if (this.dialogueBoxInstance) {
            this.dialogueBoxInstance.clearDialogue();
        }
    }

    setDialogueBoxInstance(instance) {
        this.dialogueBoxInstance = instance;
    }

    clearTextMemory() {
        this.reset();
        if (this.dialogueBoxInstance) {
            this.dialogueBoxInstance.clearDialogue();
        }
    }
}
