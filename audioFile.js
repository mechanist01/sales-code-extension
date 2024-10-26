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

// Function to stop recording and download the audio files
export function stopRecording(micRecorder, tabRecorder) {
    micRecorder.stop();
    tabRecorder.stop();
}

// Separate function for creating blobs and uploading
export function createAndUploadFiles(micRecorder, tabRecorder, micChunks, tabChunks, fileName, onComplete) {
    // Create and upload the blobs
    Promise.all([
        new Promise(resolve => {
            const micBlob = new Blob(micChunks, { type: 'audio/wav' });
            resolve(micBlob);
        }),
        new Promise(resolve => {
            const tabBlob = new Blob(tabChunks, { type: 'audio/wav' });
            resolve(tabBlob);
        })
    ]).then(([micBlob, tabBlob]) => {
        uploadFiles(micBlob, tabBlob, fileName, onComplete);
    });
}

function uploadFiles(micBlob, tabBlob, fileName, onComplete) {
    const formData = new FormData();
    formData.append('files', micBlob, 'microphone_audio.wav');
    formData.append('files', tabBlob, 'tab_audio.wav');
    formData.append('name', fileName); // Add the file name to the form data with key 'name'

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Upload successful:', data);
        if (onComplete) {
            onComplete();
        }
    })
    .catch(error => {
        console.error('Error uploading files:', error);
        if (onComplete) {
            onComplete();
        }
    });
}
