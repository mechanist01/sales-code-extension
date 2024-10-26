import { summarizeNotes } from './summarizer.js'; // Add this import statement

export class WordsMerger {
    constructor(dialogueBoxId) {
        this.dialogueBoxId = dialogueBoxId;
        this.dialogueBox = document.getElementById(dialogueBoxId);
        if (!this.dialogueBox) {
            this.createDialogueBox();
        }
        this.currentSentence = '';
        this.partialText = '';
        this.lastPartialTime = null;
        this.emptyPartialCount = 0;
        this.dialogueBoxInstance = null; // Will be set from outside
    }

    createDialogueBox() {
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.id = this.dialogueBoxId;
        this.dialogueBox.className = 'dialogue-box';
        document.body.appendChild(this.dialogueBox);
    }

    async processApiResponse(response) {
        if (response.message_type === 'PartialTranscript') {
            if (response.text === '') {
                this.emptyPartialCount++;
                if (this.emptyPartialCount >= 3) {
                    await this.createTextBubble();
                    this.emptyPartialCount = 0;
                }
            } else {
                this.emptyPartialCount = 0;
                this.partialText = response.text;
            }
            this.lastPartialTime = new Date(response.created).getTime();
        } else if (response.message_type === 'FinalTranscript') {
            this.currentSentence += response.text + ' ';
            this.partialText = '';
            this.emptyPartialCount = 0;
        }
        this.updateDialogueBox();
    }

    async createTextBubble() {
        if (this.currentSentence.trim()) {
            const originalText = this.currentSentence.trim();
            this.currentSentence = ''; // Clear the current sentence immediately

            console.log('Sending text to summarizer:', originalText); // Log the text being sent

            try {
                const summary = await summarizeNotes(originalText);
                console.log('Received summary:', summary); // Log the received summary
                // Update the dialogue box with the summary only
                this.dialogueBoxInstance.updateDialogueBox(summary, false, true, true);
            } catch (error) {
                console.error('Error summarizing text bubble:', error);
            }
        }
    }

    updateDialogueBox() {
        const displayText = this.currentSentence + this.partialText;
        if (displayText.trim()) {
            this.dialogueBoxInstance.updateCurrentText(displayText);
        }
    }

    reset() {
        this.currentSentence = '';
        this.partialText = '';
        this.emptyPartialCount = 0;
    }

    clearDialogue() {
        this.reset();
        this.dialogueBoxInstance.clearDialogue();
    }

    setDialogueBoxInstance(instance) {
        this.dialogueBoxInstance = instance;
    }

    clearTextMemory() {
        this.reset();
        this.dialogueBoxInstance.clearDialogue();
        console.log('Text memory cleared in WordsMerger');
    }
}
