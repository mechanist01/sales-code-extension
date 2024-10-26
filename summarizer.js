export async function summarizeNotes(notes) {
    // Check if notes are empty
    if (!notes.trim()) {
        throw new Error('No notes to summarize.');
    }

    try {
        // Make a POST request to the API to get the summary
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': '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',
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 150,
                messages: [
                    {
                        role: "user",
                        content: `summarize this, format(bullet points only): ${notes}`
                    }
                ]
            })
        });

        // Check if the response is not OK
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error response body:', errorBody);
            throw new Error(`Failed to get summary from Claude: ${response.status} ${response.statusText}`);
        }

        // Parse the response JSON
        const data = await response.json();
        console.log('API response:', data); // Log the entire response for debugging

        // Check if the response contains the expected structure
        if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error('Unexpected API response structure');
        }

        return data.content[0].text; // Return the summary text
    } catch (error) {
        console.error('Error details:', error);
        throw new Error('Failed to summarize notes');
    }
}

// Function to initialize the summarize button
export function initializeSummarizeButton() {
    const summarizeButton = document.getElementById('summarizeButton');

    summarizeButton.addEventListener('click', async () => {
        try {
            console.log('Summarize button clicked');
            
            // Call stopRecording if it's available
            if (typeof window.stopRecording === 'function') {
                window.stopRecording();
                console.log('Recording stopped');
            }

            // Get the complete text from the dialogue box
            const dialogueBox = document.getElementById('dialogueBox');
            const notes = dialogueBox.textContent;

            // Check if notes are empty
            if (!notes.trim()) {
                alert('No notes to summarize. Please add some text first.');
                return;
            }

            console.log('Notes to summarize:', notes);

            // Get the summary of the notes
            const summary = await summarizeNotes(notes);
            
            console.log('Received summary:', summary);

            // Convert the summary to HTML list items
            const summaryHTML = `<h3>Summary:</h3><ul>${summary.split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => `<li>${line.trim().substring(1).trim()}</li>`)
                .join('')}</ul>`;

            // Append the summary to the dialogue box content
            dialogueBox.innerHTML += `<hr>${summaryHTML}`;

            // Scroll to the bottom of the dialogue box
            dialogueBox.scrollTop = dialogueBox.scrollHeight;

        } catch (error) {
            console.error('Error summarizing notes:', error);
            alert('Failed to summarize notes. Please try again.');
        }
    });
}

// Function to strip HTML tags from a string
function stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}
