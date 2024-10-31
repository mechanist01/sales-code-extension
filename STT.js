import { captureTabAudio, startAudioCapture, stopAudioCapture } from './audiocapture.js';
import { WordsMerger } from './wordsMerger.js';
import { DialogueBox } from './dialogueBox.js';

export class SpeechToText {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.socket = null;
        this.dialogueBox = new DialogueBox('dialogueBox');
        this.wordsMerger = new WordsMerger('dialogueBox');
        this.wordsMerger.setDialogueBoxInstance(this.dialogueBox);
        this.isReady = false;
        this.token = null;
        this.audioStream = null;
        this.audioAnalyser = null;
        this.scriptProcessor = null;
        this.onTranscriptReceived = null;
    }

    async getTemporaryToken() {
        const url = 'https://api.assemblyai.com/v2/realtime/token';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expires_in: 3600 })
        });

        if (!response.ok) {
            throw new Error('Failed to obtain temporary token');
        }

        const data = await response.json();
        this.token = data.token;
    }

    async initializeWebSocket(sampleRate = 16000) {
        if (!this.token) {
            await this.getTemporaryToken();
        }

        return new Promise((resolve, reject) => {
            const url = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${this.token}`;

            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log('WebSocket connection established');
                this.isReady = true;
                resolve();
            };

            this.socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Received message:', message);

                if (message.message_type === 'PartialTranscript' || message.message_type === 'FinalTranscript') {
                    this.wordsMerger.processApiResponse(message);
                    
                    if (this.onTranscriptReceived) {
                        this.onTranscriptReceived(message.text);
                    }
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                this.isReady = false;
            };
        });
    }

    async startTranscription(existingStream) {
        console.log('Starting transcription...');
        try {
            console.log('Initializing WebSocket...');
            await this.initializeWebSocket();
            console.log('WebSocket initialized.');
            console.log('Setting up audio processing...');
            this.setupAudioProcessing(existingStream);
            console.log('Audio processing set up.');
        } catch (error) {
            console.error('Error in startTranscription:', error);
            throw error;
        }
    }

    setupAudioProcessing(stream) {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBuffer = this.floatTo16BitPCM(inputData);
                this.socket.send(pcmBuffer);
            }
        };

        this.audioContext = audioContext;
        this.processor = processor;
    }

    floatTo16BitPCM(inputBuffer) {
        const output = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
            const s = Math.max(-1, Math.min(1, inputBuffer[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    async startTabAudioCapture() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot capture audio from Chrome pages. Please navigate to a regular web page.');
            }

            this.audioStream = await captureTabAudio();
            const { audioAnalyser, scriptProcessor } = startAudioCapture(this.audioStream, (audioData) => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    const pcmBuffer = this.floatTo16BitPCM(audioData);
                    this.socket.send(pcmBuffer);
                }
            });
            this.audioAnalyser = audioAnalyser;
            this.scriptProcessor = scriptProcessor;
        } catch (error) {
            console.error('Error capturing tab audio:', error);
            throw error;
        }
    }

    stopTranscription() {
        // Stop the recording if applicable
        if (window.micRecorder && window.tabRecorder) {
            stopRecording(window.micRecorder, window.tabRecorder);
            console.log('Recording stopped.');
        }

        if (this.socket) {
            console.log('WebSocket state before closing:', this.socket.readyState);
            
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ "terminate_session": true }));
                this.socket.close();
                console.log('WebSocket close initiated.');
            } else if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
                console.log('WebSocket is already closing or closed.');
            } else {
                console.log('WebSocket is not open, current state:', this.socket.readyState);
            }
        } else {
            console.log('No WebSocket instance found.');
        }

        if (this.processor) {
            this.processor.disconnect();
            console.log('Audio processor disconnected.');
        }

        if (this.audioContext) {
            this.audioContext.close();
            console.log('Audio context closed.');
        }

        this.wordsMerger.reset();
        console.log('WordsMerger reset.');
    }

    setTranscriptCallback(callback) {
        this.onTranscriptReceived = callback;
    }

    clearDialogueAndMemory() {
        this.dialogueBox.clearDialogue();
        this.wordsMerger.clearTextMemory();
    }
}
