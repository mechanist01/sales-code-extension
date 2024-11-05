let audioContext; // Global variable to hold the AudioContext
let mediaRecorder; // Global variable to hold the MediaRecorder
let audioAnalyser; // Global variable to hold the AnalyserNode

/**
 * Captures audio from the current tab.
 * @returns {Promise<MediaStream>} - A promise that resolves to the captured audio stream.
 */
export function captureTabAudio() {
	return new Promise((resolve, reject) => {
		chrome.tabCapture.capture({audio: true, video: false}, (stream) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else if (stream) {
				resolve(stream);
			} else {
				reject(new Error('Failed to capture tab audio'));
			}
		});
	});
}

/**
 * Starts capturing audio from the provided stream.
 * @param {MediaStream} stream - The audio stream to capture.
 * @param {function} onDataAvailable - Callback function to handle data available event.
 * @returns {Object} - An object containing mediaRecorder, audioContext, audioAnalyser, and scriptProcessor.
 */
export function startAudioCapture(stream, onDataAvailable) {
	audioContext = new AudioContext({ sampleRate: 16000 });
	const source = audioContext.createMediaStreamSource(stream);
	audioAnalyser = audioContext.createAnalyser();
	audioAnalyser.fftSize = 256;
	
	const gainNode = audioContext.createGain();
	gainNode.gain.value = 1;
	
	const destination = audioContext.createMediaStreamDestination();
	
	source.connect(audioAnalyser);
	audioAnalyser.connect(gainNode);
	gainNode.connect(destination);
	gainNode.connect(audioContext.destination);
	
	// Create a ScriptProcessorNode for raw PCM data
	const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
	source.connect(scriptProcessor);
	scriptProcessor.connect(audioContext.destination);
	
	mediaRecorder = new MediaRecorder(destination.stream, { 
		mimeType: 'audio/webm',
		audioBitsPerSecond: 16000
	});
	
	mediaRecorder.ondataavailable = onDataAvailable;
	mediaRecorder.onstop = () => {
		stream.getTracks().forEach(track => track.stop());
		audioContext.close();
	};

	mediaRecorder.start(20); // Capture data in 20ms chunks
	
	return { mediaRecorder, audioContext, audioAnalyser, scriptProcessor };
}

/**
 * Converts a Float32Array to a 16-bit PCM Int16Array.
 * @param {Float32Array} input - The input float array.
 * @returns {Int16Array} - The converted 16-bit PCM array.
 */
function floatTo16BitPCM(input) {
	const output = new Int16Array(input.length);
	for (let i = 0; i < input.length; i++) {
		const s = Math.max(-1, Math.min(1, input[i]));
		output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
	}
	return output;
}

/**
 * Stops the audio capture by closing the AudioContext.
 */
export function stopAudioCapture() {
	if (audioContext && audioContext.state !== 'closed') {
		audioContext.close().catch(err => console.error('Error closing AudioContext:', err));
	}
}

/**
 * Visualizes the audio by updating the width of a volume bar.
 * @param {HTMLElement} volumeBarFill - The HTML element representing the volume bar fill.
 * @returns {function} - The draw function to be used with requestAnimationFrame.
 */
export function visualizeAudio(volumeBarFill) {
	const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
	
	function draw() {
		audioAnalyser.getByteFrequencyData(dataArray);
		const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
		const volume = Math.min(100, Math.max(0, average * 100 / 256));
		
		volumeBarFill.style.width = `${volume}%`;
		
		requestAnimationFrame(draw);
	}
	
	return draw;
}