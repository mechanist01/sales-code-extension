import { startAudioCapture, stopAudioCapture, visualizeAudio, captureTabAudio } from './audiocapture.js';
import { convertStreamToBase64WebM } from './utils.js';
import { SpeechToText } from './STT.js';
import { startRecordingAudioStreams, stopRecording, createAndDownloadFiles, handleCall, retryFailedCall, deleteFailedCall } from './audioFile.js';
import { createSalesForm } from './salesForm.js';
import { resetAllData } from './totalrecall.js';

let speechToText;
let dialogueContent = '';
let microphoneStream = null;
let audioContext;
let analyser;
let dataArray;
let volumeMeterAnimationFrame;

// Create a list to hold all dialogue entries
window.dialogueEntries = [];

// Define these functions first, before any event listeners
function displayFailedCallStatus() {
    const failedCalls = JSON.parse(localStorage.getItem('failedCalls') || '[]');
    const statusContainer = document.getElementById('failedCallsContainer');

    if (!statusContainer) {
        console.error('Failed calls container not found');
        return;
    }

    // Clear existing content
    statusContainer.innerHTML = '';

    if (failedCalls.length === 0) {
        statusContainer.style.display = 'none';
        return;
    }

    statusContainer.style.display = 'block';

    // Container structure
    statusContainer.innerHTML = `
        <div class="failed-calls-header">
            <h3>Failed Uploads (${failedCalls.length})</h3>
            <button class="clear-all-button">↺ Clear All</button>
        </div>
        <div class="failed-calls-content"></div>
    `;

    // Get content container
    const contentContainer = statusContainer.querySelector('.failed-calls-content');

    // Add clear all functionality
    statusContainer.querySelector('.clear-all-button').addEventListener('click', () => {
        localStorage.setItem('failedCalls', '[]');
        window.dispatchEvent(new CustomEvent('failedCallsUpdated'));
    });

    // Populate failed calls
    failedCalls.forEach(call => {
        const statusElement = document.createElement('div');
        statusElement.className = 'failed-call-status';
        
        const timestamp = new Date(call.timestamp).toLocaleString();
        const customerName = call.metadata?.customer || 'Unknown Customer';
        const errorMessage = call.errorDetails?.message || 'Upload failed';
        
        statusElement.innerHTML = `
            <div class="status-details">
                <span class="customer-name">${customerName}</span>
                <span class="timestamp">${timestamp}</span>
                <span class="error-message">${errorMessage}</span>
            </div>
            <div class="action-buttons">
                <button class="retry-button" title="Retry Upload">↺</button>
                <button class="delete-button" title="Delete">×</button>
            </div>
        `;

        // Add retry functionality
        const retryButton = statusElement.querySelector('.retry-button');
        retryButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Retrying call:', call);
            retryButton.disabled = true;
            retryFailedCall(call.id);
        });

        // Add delete functionality
        const deleteButton = statusElement.querySelector('.delete-button');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            statusElement.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                deleteFailedCall(call.id);
            }, 250);
        });

        contentContainer.appendChild(statusElement);
    });
}

function showUploadLoading() {
    const container = document.getElementById('failedCallsContainer');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="upload-loading-container">
            <div class="loading-text">
                <div class="loading-spinner"></div>
                <span>Uploading call...</span>
            </div>
            <div class="upload-progress"></div>
        </div>
    `;
}

function showUploadSuccess() {
    const container = document.getElementById('failedCallsContainer');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="upload-success-container">
            <div class="success-content">
                <span class="success-icon">✓</span>
                <span>Call uploaded successfully!</span>
            </div>
        </div>
    `;
}

// Make it globally available
window.displayFailedCallStatus = displayFailedCallStatus;

// Now add the event listener
window.addEventListener('failedCallsUpdated', () => {
    console.log('Failed calls updated event received');
    displayFailedCallStatus();
});

/**
 * Updates the dialogue box with new text.
 * @param {string} text - The text to add to the dialogue box.
 * @param {boolean} isHTML - Whether the text is HTML.
 * @param {boolean} isSummary - Whether the text is a summary.
 */
function updateDialogueBox(text, isHTML = false, isSummary = false) {
    const entry = { text, isHTML, isSummary };
    const dialogueBox = document.querySelector('.dialogue-box');
    const isAtBottom = dialogueBox.scrollHeight - dialogueBox.clientHeight <= dialogueBox.scrollTop + 1;

    window.dialogueEntries.push(entry);
    appendToDialogueBox(entry);
    saveToLocalStorage();

    if (isAtBottom) {
        dialogueBox.scrollTop = dialogueBox.scrollHeight;
    }

    console.log('Current dialogue box content size:', dialogueBox.innerHTML.length, 'characters');
    console.log('Number of entries:', window.dialogueEntries.length);
}

/**
 * Appends a new entry to the dialogue box.
 * @param {Object} entry - The entry to append.
 */
function appendToDialogueBox(entry) {
    const dialogueBox = document.querySelector('.dialogue-box');
    let newContent;
    if (entry.isSummary) {
        newContent = `<div class="summary">${entry.text}</div>`;
    } else if (entry.isHTML) {
        newContent = entry.text;
    } else {
        newContent = `<p>${entry.text}</p>`;
    }
    dialogueBox.insertAdjacentHTML('beforeend', newContent);
    dialogueBox.scrollTop = dialogueBox.scrollHeight;
}

/**
 * Saves the dialogue entries to local storage.
 */
function saveToLocalStorage() {
    localStorage.setItem('dialogueEntries', JSON.stringify(window.dialogueEntries));
}

/**
 * Loads the dialogue entries from local storage.
 */


document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
    let isRecording = false;
    let animationFrame;
    let capturedStream;

    let startButton, stopButton, statusDisplay, micIcon, volumeBarFill, volumeMeterFill;

    startButton = document.getElementById('startRecording');
    stopButton = document.getElementById('stopRecording');
    statusDisplay = document.getElementById('status');
    micIcon = document.getElementById('micIcon');
    volumeBarFill = document.getElementById('volumeBarFill');
    volumeMeterFill = document.getElementById('volumeMeterFill');
    const tabSelect = document.getElementById('tabSelect');
    const micSelect = document.getElementById('micSelect');
    const websocketIndicator = document.getElementById('websocketIndicator');
    const websocketStatusText = document.getElementById('websocketStatusText');
    const dialogueBox = document.getElementById('dialogueBox');
    const uploadButton = document.getElementById('uploadButton');

    // Check if the tabSelect element is found
    if (!tabSelect) {
        console.error('Tab selector element not found');
        return;
    }

    // Function to populate the tab dropdown
    function populateTabDropdown() {
        // Clear existing options
        tabSelect.innerHTML = '';

        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a tab';
        tabSelect.appendChild(defaultOption);

        // Query for all tabs, not just audible ones
        chrome.tabs.query({}, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error('Error querying tabs:', chrome.runtime.lastError);
                return;
            }

            console.log('All tabs found:', tabs);

            if (tabs.length === 0) {
                console.log('No tabs found');
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No tabs found';
                tabSelect.appendChild(option);
                return;
            }

            tabs.forEach((tab) => {
                console.log('Adding tab to selector:', tab.title, 'Audible:', tab.audible);
                const option = document.createElement('option');
                option.value = tab.id;
                option.textContent = `${tab.title} ${tab.audible ? '(Audio)' : ''}`;
                tabSelect.appendChild(option);
            });

            // Check if any tabs were added
            if (tabSelect.options.length <= 1) {
                console.log('No tabs were added to the dropdown');
            }
        });
    }

    // Populate the dropdown initially
    populateTabDropdown();

    // Function to get microphone stream
    async function getMicrophoneStream(deviceId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { deviceId: deviceId ? { exact: deviceId } : undefined } 
            });
            console.log('Microphone access granted');
            return stream;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    // Function to combine tab audio and microphone audio
    function combineAudioStreams(tabStream, micStream) {
        audioContext = new AudioContext();
        const tabSource = audioContext.createMediaStreamSource(tabStream);
        const micSource = audioContext.createMediaStreamSource(micStream);
        const destination = audioContext.createMediaStreamDestination();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Connect only the tab source to the destination
        tabSource.connect(destination);
        
        // Connect the microphone source to the analyser only (not to the destination)
        micSource.connect(analyser);

        // Optionally, connect the analyser to the destination if you need to visualize the mic input
        // analyser.connect(destination);

        return destination.stream;
    }

    function updateVolumeMeter() {
        if (!isRecording) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        const volume = Math.min(100, Math.round((average / 255) * 100));

        volumeMeterFill.style.width = `${volume}%`;

        volumeMeterAnimationFrame = requestAnimationFrame(updateVolumeMeter);
    }

    startButton.addEventListener('click', async () => {
        console.log('Start button clicked');
        const tabId = parseInt(tabSelect.value);
        const selectedMicId = micSelect.value;
    
        if (!tabId) {
            console.error('No tab selected');
            statusDisplay.textContent = 'Error: Please select a tab';
            return;
        }
    
        if (!selectedMicId) {
            console.error('No microphone selected');
            statusDisplay.textContent = 'Error: Please select a microphone';
            return;
        }
    
        try {
            const tabStream = await captureTabAudio(tabId);
            microphoneStream = await getMicrophoneStream(selectedMicId);
            
            const combinedStream = combineAudioStreams(tabStream, microphoneStream);
            
            // Start recording both streams
            const { micRecorder, tabRecorder, micChunks, tabChunks } = await startRecordingAudioStreams(microphoneStream, tabStream);
            
            startRecording(combinedStream);
            updateVolumeMeter();
            hideDropdown();
    
            // Store recorders and chunks for later use
            window.micRecorder = micRecorder;
            window.tabRecorder = tabRecorder;
            window.micChunks = micChunks;
            window.tabChunks = tabChunks;
    
            // Update button states
            startButton.disabled = true;
            stopButton.disabled = false;
            uploadButton.disabled = true;
    
        } catch (error) {
            console.error('Error starting recording:', error);
            statusDisplay.textContent = 'Error: ' + error.message;
        }
    });
    
    stopButton.addEventListener('click', () => {
        console.log('Stop button clicked');
        stopRecording(window.micRecorder, window.tabRecorder);
        
        // Ensure the STT WebSocket connection is closed
        if (speechToText) {
            speechToText.stopTranscription();
        }
        
        // Update button states
        stopButton.disabled = true;
        uploadButton.disabled = false;
        startButton.disabled = true;
    });
    
    uploadButton.addEventListener('click', () => {
        console.log('Upload button clicked');
        const uploadButtonText = uploadButton.textContent;

        if (uploadButtonText === 'Upload') {
            // First click - show the sales form
            const elements = {
                dialogueBox: document.querySelector('.dialogue-box'),
                uploadButton: document.getElementById('uploadButton'),
                startButton: document.getElementById('startRecording')
            };

            // Hide the dialogue box before creating the form
            if (elements.dialogueBox) {
                elements.dialogueBox.style.height = '0px';
                elements.dialogueBox.style.overflow = 'hidden';
                elements.dialogueBox.classList.add('transparent');
            }

            createSalesForm(
                elements,
                window.micChunks,
                window.tabChunks,
                handleCall,
                true
            );
        } else if (uploadButtonText === 'Send') {
            // Immediately change button text back to Upload and update button states
            uploadButton.textContent = 'Upload';
            uploadButton.disabled = true;
            
            const startButton = document.getElementById('startRecording');
            if (startButton) {
                startButton.disabled = false;
            }
            
            // Get elements
            const dialogueBox = document.querySelector('.dialogue-box');
            const inputContainer = document.querySelector('.input-container');
            
            // Clear the dialogue box content before showing it
            if (dialogueBox) {
                dialogueBox.innerHTML = ''; // Clear all content
                dialogueBox.classList.remove('transparent');
                dialogueBox.style.height = '400px';
                dialogueBox.style.overflow = 'auto';
                dialogueBox.style.transition = 'all 0.3s ease-in-out';
            }

            // Hide and remove the sales form
            if (inputContainer) {
                inputContainer.style.opacity = '0';
                inputContainer.style.transition = 'opacity 0.3s ease-in-out';
                
                setTimeout(() => {
                    inputContainer.remove();
                }, 300);
            }

            // Get form data for submission
            const formData = {
                rep: document.getElementById('repDropdown')?.value,
                customer: document.getElementById('customerInput')?.value,
                saleStatus: document.getElementById('saleStatusDropdown')?.value,
                saleAmount: document.getElementById('saleAmountInput')?.value,
                brand: document.getElementById('brandDropdown')?.value,
                products: document.getElementById('productsDropdown')?.value
            };

            // Submit the form data and reset the dialogue box
            createAndDownloadFiles(window.micChunks, window.tabChunks, () => {
                handleCall(
                    formData.rep,
                    formData.customer,
                    formData.saleStatus,
                    formData.saleAmount,
                    formData.brand,
                    formData.products
                );

                // Reset all data including the dialogue box
                resetAllData();
                
                // Explicitly clear DialogueBox instance if it exists
                if (window.dialogueBox && typeof window.dialogueBox.clearDialogue === 'function') {
                    window.dialogueBox.clearDialogue();
                }

                // Reset button states
                uploadButton.disabled = true;
                startButton.disabled = false;
            });
        }
    });

    async function startRecording(stream) {
        try {
            const { audioContext: captureContext, audioAnalyser } = startAudioCapture(stream);
            
            isRecording = true;
            startButton.disabled = true;
            stopButton.disabled = false;
            micIcon.classList.add('active');
            
            const visualize = visualizeAudio(volumeBarFill);
            animationFrame = requestAnimationFrame(visualize);

            capturedStream = stream;

            // Initialize SpeechToText if not already done
            if (!speechToText) {
                await initializeSpeechToText();
            }

            await speechToText.initializeWebSocket();
            await speechToText.startTranscription(stream);

            hideDropdown();
        } catch (error) {
            console.error('Failed to start recording:', error);
            statusDisplay.textContent = 'Error: ' + error.message;
            stopRecording(); // Clean up if an error occurs
        }
    }

    // Define stopRecording as a global function
    window.stopRecording = function() {
        console.log('stopRecording function called');
        if (!speechToText) {
            console.error('SpeechToText not initialized');
            return;
        }
        if (isRecording) {
            console.log('Stopping recording...');
            isRecording = false;
            stopAudioCapture();
            if (capturedStream) {
                capturedStream.getTracks().forEach(track => track.stop());
            }
            if (microphoneStream) {
                microphoneStream.getTracks().forEach(track => track.stop());
                microphoneStream = null;
            }
            if (audioContext) {
                audioContext.close();
            }
            startButton.disabled = false;
            stopButton.disabled = true;
            statusDisplay.textContent = '';
            micIcon.classList.remove('active');
            volumeBarFill.style.width = '0%';
            volumeMeterFill.style.width = '0%';
            cancelAnimationFrame(animationFrame);
            cancelAnimationFrame(volumeMeterAnimationFrame);

            // Stop the STT transcription
            speechToText.stopTranscription();
            console.log('Recording stopped');

            // Release the tab audio stream
            if (window.tabRecorder) {
                window.tabRecorder.stream.getTracks().forEach(track => track.stop());
            }

            showDropdown();
        } else {
            console.log('Not currently recording');
        }
    };

    // Style the dialogue box
    dialogueBox.style.overflowY = 'scroll';
    dialogueBox.style.scrollbarWidth = 'none'; // For Firefox
    dialogueBox.style.msOverflowStyle = 'none'; // For Internet Explorer/Edge

    // Hide webkit scrollbar
    const style = document.createElement('style');
    style.textContent = `
        #dialogueBox::-webkit-scrollbar {
            display: none;
        }
    `;
    document.head.appendChild(style);

    // Initialize SpeechToText
    async function initializeSpeechToText() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['assemblyAIKey'], (result) => {
                if (result.assemblyAIKey) {
                    speechToText = new SpeechToText(result.assemblyAIKey);
                    speechToText.setTranscriptCallback((transcriptMessage) => {
                        console.log('Transcript received:', transcriptMessage);
                        updateDialogueBox(transcriptMessage.text);
                    });
                    resolve();
                } else {
                    reject(new Error('AssemblyAI key not found'));
                }
            });
        });
    }

    // Function to populate the microphone dropdown
    async function populateMicDropdown() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            micSelect.innerHTML = ''; // Clear existing options

            // Add a default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a microphone';
            micSelect.appendChild(defaultOption);

            audioInputs.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Microphone ${index + 1}`;
                micSelect.appendChild(option);
            });

            if (audioInputs.length > 0) {
                micSelect.style.display = ''; // Show the dropdown if microphones are available
            } else {
                console.warn('No microphones found');
                micSelect.style.display = 'none';
            }
        } catch (error) {
            console.error('Error enumerating devices:', error);
            statusDisplay.textContent = 'Error: Unable to list microphones';
        }
    }

    // Call the function to populate the microphone dropdown
    await populateMicDropdown();

    // Modify the chrome.runtime.onMessage listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "offscreenStatus") {
            console.log('Received offscreen status:', request.status);
            if (request.status === 'error') {
                console.error('Error creating offscreen document:', request.error);
                statusDisplay.textContent = 'Error: Unable to access microphone. Please try again.';
            } else {
                // The offscreen document is ready (either it already existed or was just created)
                console.log('Offscreen document is ready');
            }
        }
    });

    // Initialize failed calls display
    displayFailedCallStatus();
});

function hideDropdown() {
    const dropdownContainer = document.getElementById('dropdownContainer');
    if (dropdownContainer) {
        dropdownContainer.style.display = 'none';
    }
}

function showDropdown() {
    const dropdownContainer = document.getElementById('dropdownContainer');
    if (dropdownContainer) {
        dropdownContainer.style.display = 'flex';
    }
}

