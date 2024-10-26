/**
 * Converts a MediaStream to a Base64-encoded WebM video.
 * @param {MediaStream} stream - The media stream to convert.
 * @param {number} duration - The duration to record in milliseconds.
 * @returns {Promise<string>} - A promise that resolves to the Base64-encoded WebM video.
 */
export function convertStreamToBase64WebM(stream, duration = 5000) {
    return new Promise((resolve, reject) => {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };

      mediaRecorder.onerror = reject;

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), duration);
    });
}