// Function to start recording audio streams
export async function startRecordingAudioStreams(micStream, tabStream) {
    const micRecorder = new MediaRecorder(micStream);
    const tabRecorder = new MediaRecorder(tabStream);

    const micChunks = [];
    const tabChunks = [];

    micRecorder.ondataavailable = (event) => {
        micChunks.push(event.data);
    };

    tabRecorder.ondataavailable = (event) => {
        tabChunks.push(event.data);
    };

    micRecorder.start();
    tabRecorder.start();

    return { micRecorder, tabRecorder, micChunks, tabChunks };
}

// Function to stop recording
export function stopRecording(micRecorder, tabRecorder) {
    if (micRecorder && micRecorder.state !== 'inactive') {
        micRecorder.stop();
    }
    if (tabRecorder && tabRecorder.state !== 'inactive') {
        tabRecorder.stop();
    }
}

// Helper function to check if response is truly successful
function isSuccessfulResponse(response) {
    return response.ok && response.status >= 200 && response.status < 300;
}

// Function for creating blobs and sending them to the server
export function createAndDownloadFiles(micChunks, tabChunks, onComplete) {
    const callData = {
        id: `call-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    Promise.all([
        new Promise(resolve => {
            const micBlob = new Blob(micChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = () => resolve({ blob: micBlob, base64: reader.result });
            reader.readAsDataURL(micBlob);
        }),
        new Promise(resolve => {
            const tabBlob = new Blob(tabChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onload = () => resolve({ blob: tabBlob, base64: reader.result });
            reader.readAsDataURL(tabBlob);
        })
    ]).then(([micData, tabData]) => {
        // Store the audio data
        callData.micAudio = micData.base64;
        callData.tabAudio = tabData.base64;

        const formData = new FormData();
        formData.append('micAudio', micData.blob, 'rep.wav');
        formData.append('tabAudio', tabData.blob, 'customer.wav');

        fetch('http://127.0.0.1:5000/be-flow', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            if (onComplete) {
                onComplete(true);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            // Update call data with error details
            callData.status = 'failed';
            callData.errorDetails = {
                message: error.message,
                timestamp: new Date().toISOString(),
                type: error.name
            };
            
            // Store the failed call
            storeFailedCall(callData);
            
            if (onComplete) {
                onComplete(false);
            }
        });
    });
}

// Add these functions to handle the UI states
function showUploadLoading() {
    const container = document.getElementById('failedCallsContainer');
    if (!container) return;

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

    container.innerHTML = `
        <div class="upload-success-container">
            <div class="success-content">
                <span class="success-icon">✓</span>
                <span>Call uploaded successfully!</span>
            </div>
        </div>
    `;

    // After the animation completes, remove the success message
    setTimeout(() => {
        container.innerHTML = '';
        container.style.display = 'none';
    }, 3000);
}

function showFailedCallsContainer() {
    // Your existing displayFailedCallStatus function
    displayFailedCallStatus();
}

// Function to store failed call data
function storeFailedCall(callData) {
    try {
        let failedCalls = JSON.parse(localStorage.getItem('failedCalls') || '[]');
        failedCalls.push(callData);
        localStorage.setItem('failedCalls', JSON.stringify(failedCalls));
        
        // Dispatch event for UI update instead of trying to call the function directly
        window.dispatchEvent(new CustomEvent('failedCallsUpdated'));
        
    } catch (error) {
        console.error('Error storing failed call data:', error);
    }
}

// Function to handle call data
export function handleCall(rep, customer, saleStatus, saleAmount, brand, products) {
    const callMetadata = {
        rep,
        customer,
        saleStatus,
        saleAmount,
        brand,
        products,
        timestamp: new Date().toISOString()
    };

    // Store metadata with the failed call if it exists
    let failedCalls = JSON.parse(localStorage.getItem('failedCalls') || '[]');
    const lastCall = failedCalls[failedCalls.length - 1];
    if (lastCall && lastCall.status === 'failed') {
        lastCall.metadata = callMetadata;
        localStorage.setItem('failedCalls', JSON.stringify(failedCalls));
    }
}

// Add a function to retry failed calls
export function retryFailedCall(callId) {
    const failedCalls = JSON.parse(localStorage.getItem('failedCalls') || '[]');
    const callToRetry = failedCalls.find(call => call.id === callId);

    if (!callToRetry) {
        console.error('Failed call not found:', callId);
        return;
    }

    // Convert base64 back to blobs
    const micBlob = fetch(callToRetry.micAudio)
        .then(res => res.blob());
    const tabBlob = fetch(callToRetry.tabAudio)
        .then(res => res.blob());

    Promise.all([micBlob, tabBlob])
        .then(([micBlob, tabBlob]) => {
            const formData = new FormData();
            formData.append('micAudio', micBlob, 'rep.wav');
            formData.append('tabAudio', tabBlob, 'customer.wav');

            return fetch('http://127.0.0.1:5000/be-flow', {
                method: 'POST',
                body: formData
            });
        })
        .then(response => {
            if (!response.ok) throw new Error(`Server returned status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            // Remove from failed calls on success
            let failedCalls = JSON.parse(localStorage.getItem('failedCalls') || '[]');
            failedCalls = failedCalls.filter(call => call.id !== callId);
            localStorage.setItem('failedCalls', JSON.stringify(failedCalls));
            
            // Dispatch event for UI update
            window.dispatchEvent(new CustomEvent('failedCallsUpdated'));
        })
        .catch(error => {
            console.error('Error retrying call:', error);
            callToRetry.status = 'failed';
            callToRetry.errorDetails = {
                message: error.message,
                timestamp: new Date().toISOString(),
                type: error.name
            };
            storeFailedCall(callToRetry);
        });
}

// Add this function to delete a failed call
export function deleteFailedCall(callId) {
    try {
        let failedCalls = JSON.parse(localStorage.getItem('failedCalls') || '[]');
        failedCalls = failedCalls.filter(call => call.id !== callId);
        localStorage.setItem('failedCalls', JSON.stringify(failedCalls));
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('failedCallsUpdated'));
        console.log('Failed call deleted:', callId);
    } catch (error) {
        console.error('Error deleting failed call:', error);
    }
}
