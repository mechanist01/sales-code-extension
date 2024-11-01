// notes.js
import { initializeStickyPaste, contextMenuStyles } from './stickypaste.js';

export async function injectStickyNote() {
    try {
        // Get the current active tab
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab) throw new Error('No active tab found');

        const url = new URL(activeTab.url);
        const currentOrigin = url.origin;

        // Inject CSS for the sticky note and pen button
        await chrome.scripting.insertCSS({
            target: { tabId: activeTab.id },
            css: `
                .sticky-note {
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
                    width: 250px !important;
                    height: 450px !important;
                    background-color: #2d3748 !important;
                    padding: 0 !important;
                    border-radius: 0.25rem !important;
                    border: 1px solid #4a5568 !important;
                    z-index: 10000 !important;
                    resize: both !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    font-family: Arial, sans-serif !important;
                    box-sizing: border-box !important;
                    min-width: 200px !important;
                    min-height: 150px !important;
                }

                .sticky-note::after {
                    content: "" !important;
                    position: absolute !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    width: 15px !important;
                    height: 15px !important;
                    cursor: se-resize !important;
                    background: linear-gradient(135deg, transparent 50%, #4a5568 50%) !important;
                }

                .sticky-note.resizing {
                    user-select: none !important;
                    cursor: se-resize !important;
                }

                .sticky-note * {
                    box-sizing: border-box !important;
                }

                .sticky-note-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 0.75rem !important;
                    border-bottom: 1px solid #4a5568 !important;
                    background-color: #2d3748 !important;
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 1 !important;
                }

                .sticky-header-icons-left {
                    display: flex !important;
                    gap: 0.5rem !important;
                    align-items: center !important;
                    flex: 1 !important;
                }

                .sticky-header-icons-right {
                    display: flex !important;
                    gap: 0.5rem !important;
                    align-items: center !important;
                }

                .sticky-header-icon {
                    background: transparent !important;
                    border: none !important;
                    color: #a0aec0 !important;
                    cursor: pointer !important;
                    padding: 0.25rem !important;
                    border-radius: 0.25rem !important;
                    transition: all 0.2s !important;
                    width: 24px !important;
                    height: 24px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .sticky-header-icon:hover {
                    color: #f7fafc !important;
                    background-color: #4a5568 !important;
                }

                .sticky-header-icon svg {
                    width: 16px !important;
                    height: 16px !important;
                    fill: none !important;
                    stroke: currentColor !important;
                }

                .pin-icon {
                    transition: color 0.2s, transform 0.2s !important;
                }

                .pin-icon.active {
                    color: #3182ce !important;
                    transform: rotate(-45deg) !important;
                }

                .sticky-note-content {
                    flex: 1 !important;
                    width: 100% !important;
                    border: none !important;
                    background-color: #2d3748 !important;
                    resize: none !important;
                    font-family: Arial, sans-serif !important;
                    font-size: 0.875rem !important;
                    line-height: 1.4 !important;
                    color: #f7fafc !important;
                    padding: 0.875rem !important;
                    margin: 0 !important;
                    outline: none !important;
                }

                .pen-button {
                    position: fixed !important;
                    bottom: 20px !important;
                    right: 20px !important;
                    width: 40px !important;
                    height: 40px !important;
                    border: none !important;
                    border-radius: 50% !important;
                    cursor: pointer !important;
                    z-index: 10000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: transform 0.2s !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: transparent !important;
                }

                .pen-button:hover {
                    transform: scale(1.1) !important;
                }

                .pen-button svg {
                    width: 24px !important;
                    height: 24px !important;
                    fill: #4a5568 !important;
                }

                .sticky-note-content::placeholder {
                    color: #a0aec0 !important;
                }

                /* Scrollbar styles */
                .sticky-note-content::-webkit-scrollbar {
                    width: 0.5rem !important;
                }

                .sticky-note-content::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-radius: 0.25rem !important;
                }

                .sticky-note-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2) !important;
                    border-radius: 0.25rem !important;
                }

                .sticky-note-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3) !important;
                }

                .globe-icon {
                    color: #3182ce !important;
                }

                .globe-icon.active {
                    color: #a0aec0 !important;
                }

                ${contextMenuStyles}
            `
        });

        // Check if we already have a note on this page
        const hasExistingNote = document.querySelector('.sticky-note');
        if (!hasExistingNote) {
            // Inject the pen button if it doesn't exist
            injectPenButton(currentOrigin);
        }

        // Pass the current origin to the createStickyNote function
        await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: createStickyNote,
            args: [currentOrigin]
        });

    } catch (error) {
        console.error('Failed to inject sticky note:', error);
    }
}

function injectPenButton(origin) {
    // Check if pen button already exists
    if (document.querySelector('.pen-button')) return;

    const penButton = document.createElement('button');
    penButton.className = 'pen-button';
    penButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
    `;

    penButton.addEventListener('click', () => {
        // Remove existing pen button when creating a note
        penButton.remove();

        // Create a new sticky note for this page
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const stickyNotes = result.stickyNotes || {};

            // Initialize note data for this origin
            stickyNotes[origin] = {
                persistentNote: false,
                content: '',
                position: { x: 0, y: 0 },
                ownerOrigin: origin
            };

            chrome.storage.local.set({ stickyNotes }, () => {
                createStickyNote(origin);
            });
        });
    });

    document.body.appendChild(penButton);
}

function updateNoteVisibility(currentOrigin) {
    chrome.storage.local.get(['stickyNotes'], (result) => {
        const stickyNotes = result.stickyNotes || {};
        
        // Find any persistent note that should show on this page
        const persistentNote = Object.values(stickyNotes).find(note => 
            note.persistentNote && note.showOnAllPages
        );
        
        // Check for a page-specific note
        const pageNote = stickyNotes[currentOrigin];
        
        const showNote = persistentNote || 
                        (pageNote && (currentOrigin === pageNote.ownerOrigin));

        const existingNote = document.querySelector('.sticky-note');
        const existingPenButton = document.querySelector('.pen-button');

        if (showNote) {
            if (existingPenButton) {
                existingPenButton.remove();
            }
            if (!existingNote) {
                createStickyNote(currentOrigin);
            }
        } else {
            if (existingNote) {
                existingNote.remove();
            }
            if (!existingPenButton) {
                injectPenButton(currentOrigin);
            }
        }
    });
}

async function createStickyNote(currentOrigin) {
    if (document.querySelector('.sticky-note')) {
        return;
    }

    const stickyNote = document.createElement('div');
    stickyNote.className = 'sticky-note';
    stickyNote.innerHTML = `
        <div class="sticky-note-header">
            <div class="sticky-header-icons-left">
                <button class="sticky-header-icon pin-icon" title="Pin note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <line x1="12" y1="17" x2="12" y2="22"/>
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                    </svg>
                </button>
                <button class="sticky-header-icon globe-icon" title="Go to original page">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12h20"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                </button>
            </div>
            <div class="sticky-header-icons-right">
                <button class="sticky-header-icon save-icon" title="Save note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                </button>
                <button class="sticky-header-icon delete-icon" title="Delete note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
                <button class="sticky-header-icon close-icon" title="Close note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        </div>
        <textarea class="sticky-note-content" placeholder="Type your notes here..."></textarea>
    `;

    // Set up dragging functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Handle pin button click
    const pinButton = stickyNote.querySelector('.pin-icon');
    pinButton.addEventListener('click', () => {
        const isPinned = pinButton.classList.toggle('active');
        const content = stickyNote.querySelector('.sticky-note-content').value;
        
        chrome.storage.local.get(['stickyNotes'], (result) => {
            let stickyNotes = result.stickyNotes || {};
            
            if (isPinned) {
                // Make note persistent across all pages
                const ownerNote = {
                    persistentNote: true,
                    content: content,
                    position: { x: xOffset, y: yOffset },
                    ownerOrigin: currentOrigin,
                    showOnAllPages: true,
                    dimensions: {
                        width: stickyNote.style.width,
                        height: stickyNote.style.height
                    }
                };
                
                // Remove any existing persistent notes
                Object.keys(stickyNotes).forEach(key => {
                    if (stickyNotes[key].persistentNote && stickyNotes[key].showOnAllPages) {
                        delete stickyNotes[key];
                    }
                });
                
                // Store the note under its owner's origin
                stickyNotes[currentOrigin] = ownerNote;
            } else {
                // Check if this is the owner page
                if (currentOrigin === stickyNotes[currentOrigin]?.ownerOrigin) {
                    // If unpinning on owner page, make note non-persistent but keep it
                    stickyNotes[currentOrigin] = {
                        persistentNote: false,
                        content: content,
                        position: { x: xOffset, y: yOffset },
                        ownerOrigin: currentOrigin,
                        showOnAllPages: false,
                        dimensions: {
                            width: stickyNote.style.width,
                            height: stickyNote.style.height
                        }
                    };
                } else {
                    // If unpinning on non-owner page, hide the note here
                    stickyNote.remove();
                    injectPenButton(currentOrigin);
                }
            }

            chrome.storage.local.set({ stickyNotes }, () => {
                console.log('Sticky note state updated:', stickyNotes);
                updateNoteVisibility(currentOrigin);
                
                // Notify other tabs about the pin state change
                chrome.runtime.sendMessage({
                    type: 'NOTE_PIN_STATE_CHANGED',
                    data: {
                        isPinned,
                        content,
                        origin: currentOrigin
                    }
                });
            });
        });
    });

    // Handle save button click
    const saveButton = stickyNote.querySelector('.save-icon');
    saveButton.addEventListener('click', () => {
        const content = stickyNote.querySelector('.sticky-note-content').value;
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const stickyNotes = result.stickyNotes || {};
            const ownerOrigin = stickyNotes[currentOrigin]?.ownerOrigin || currentOrigin;
            
            if (!stickyNotes[ownerOrigin]) {
                stickyNotes[ownerOrigin] = {
                    persistentNote: false,
                    position: { x: xOffset, y: yOffset },
                    ownerOrigin: ownerOrigin,
                    showOnAllPages: false
                };
            }
            stickyNotes[ownerOrigin].content = content;
            chrome.storage.local.set({ stickyNotes });
        });
    });

    // Handle delete button click
    const deleteButton = stickyNote.querySelector('.delete-icon');
    deleteButton.addEventListener('click', () => {
        chrome.storage.local.get(['stickyNotes'], (result) => {
            let stickyNotes = result.stickyNotes || {};
            delete stickyNotes[currentOrigin];
            chrome.storage.local.set({ stickyNotes }, () => {
                stickyNote.remove();
                injectPenButton(currentOrigin);
            });
        });
    });

    // Handle close button click
    const closeButton = stickyNote.querySelector('.close-icon');
    closeButton.addEventListener('click', () => {
        chrome.storage.local.get(['stickyNotes'], (result) => {
            let stickyNotes = result.stickyNotes || {};
            const ownerOrigin = stickyNotes[currentOrigin]?.ownerOrigin;
            
            if (currentOrigin === ownerOrigin) {
                // If on owner page, remove the note completely
                delete stickyNotes[currentOrigin];
            } else if (stickyNotes[currentOrigin]?.persistentNote) {
                // If persistent note on non-owner page, keep the note but hide it
                stickyNote.remove();
            } else {
                // If non-persistent note on non-owner page, remove it
                stickyNote.remove();
            }
            
            chrome.storage.local.set({ stickyNotes }, () => {
                if (!stickyNotes[currentOrigin]?.persistentNote) {
                    injectPenButton(currentOrigin);
                }
            });
        });
    });

    // Update content change handler
    const textarea = stickyNote.querySelector('.sticky-note-content');
    textarea.addEventListener('input', (e) => {
        chrome.storage.local.get(['stickyNotes'], (result) => {
            let stickyNotes = result.stickyNotes || {};
            
            // Find the persistent note if it exists
            const persistentNote = Object.values(stickyNotes).find(note => 
                note.persistentNote && note.showOnAllPages
            );
            
            // Determine the target origin and update storage
            const targetOrigin = persistentNote ? persistentNote.ownerOrigin : currentOrigin;
            const isPersistent = !!persistentNote;
            
            // Update the appropriate note's content
            if (isPersistent) {
                stickyNotes[targetOrigin] = {
                    ...stickyNotes[targetOrigin],
                    content: e.target.value
                };
            } else {
                stickyNotes[currentOrigin] = {
                    ...stickyNotes[currentOrigin],
                    content: e.target.value
                };
            }
            
            // Save to storage and broadcast update
            chrome.storage.local.set({ stickyNotes }, () => {
                chrome.runtime.sendMessage({
                    type: 'NOTE_CONTENT_UPDATED',
                    data: {
                        content: e.target.value,
                        origin: targetOrigin,
                        isPersistent: isPersistent
                    }
                });
            });
        });
    });

    // Add message listener for content updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'UPDATE_NOTE_CONTENT') {
            const textarea = stickyNote.querySelector('.sticky-note-content');
            if (!textarea) return;
            
            chrome.storage.local.get(['stickyNotes'], (result) => {
                const stickyNotes = result.stickyNotes || {};
                const persistentNote = Object.values(stickyNotes).find(note => 
                    note.persistentNote && note.showOnAllPages
                );
                
                // Update if this is either:
                // 1. A persistent note matching the origin
                // 2. A page-specific note on its origin page
                if ((message.data.isPersistent && persistentNote && 
                     persistentNote.ownerOrigin === message.data.origin) ||
                    (!message.data.isPersistent && currentOrigin === message.data.origin)) {
                    
                    textarea.value = message.data.content;
                    
                    // Update storage
                    if (persistentNote) {
                        stickyNotes[persistentNote.ownerOrigin].content = message.data.content;
                    } else if (stickyNotes[currentOrigin]) {
                        stickyNotes[currentOrigin].content = message.data.content;
                    }
                    
                    chrome.storage.local.set({ stickyNotes });
                }
            });
        }
    });

    // When loading a note, check for both persistent and page-specific notes
    chrome.storage.local.get(['stickyNotes'], (result) => {
        const stickyNotes = result.stickyNotes || {};
        
        // First check for any persistent note
        const persistentNote = Object.values(stickyNotes).find(note => 
            note.persistentNote && note.showOnAllPages
        );
        
        // Then check for a page-specific note
        const pageNote = stickyNotes[currentOrigin];
        
        // Use persistent note if it exists, otherwise use page note
        const noteToLoad = persistentNote || pageNote;
        
        if (noteToLoad) {
            textarea.value = noteToLoad.content || '';
            if (noteToLoad.persistentNote) {
                pinButton.classList.add('active');
            }
            
            if (noteToLoad.position) {
                xOffset = noteToLoad.position.x;
                yOffset = noteToLoad.position.y;
                setTranslate(xOffset, yOffset, stickyNote);
            }
        }
    });

    // Dragging functionality
    stickyNote.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.tagName === 'TEXTAREA' ||
            e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'INPUT') {
            return;
        }

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === stickyNote || e.target.closest('.sticky-note-header')) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, stickyNote);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    // Add note to page
    document.body.appendChild(stickyNote);

    // Add resize functionality
    let isResizing = false;
    let originalWidth;
    let originalHeight;
    let originalX;
    let originalY;

    const startResize = (e) => {
        // Check if click is in the bottom-right corner (15x15 px area)
        const rect = stickyNote.getBoundingClientRect();
        const isInResizeZone = 
            e.clientX > rect.right - 15 && 
            e.clientY > rect.bottom - 15;

        if (!isInResizeZone) return;

        isResizing = true;
        stickyNote.classList.add('resizing');
        
        originalWidth = stickyNote.offsetWidth;
        originalHeight = stickyNote.offsetHeight;
        originalX = e.clientX;
        originalY = e.clientY;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        e.preventDefault();
    };

    const resize = (e) => {
        if (!isResizing) return;

        const width = originalWidth + (e.clientX - originalX);
        const height = originalHeight + (e.clientY - originalY);

        // Enforce minimum dimensions
        const minWidth = 200;
        const minHeight = 150;

        if (width >= minWidth) {
            stickyNote.style.width = width + 'px';
        }
        if (height >= minHeight) {
            stickyNote.style.height = height + 'px';
        }

        // Save dimensions to storage
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const stickyNotes = result.stickyNotes || {};
            if (stickyNotes[currentOrigin]) {
                stickyNotes[currentOrigin].dimensions = {
                    width: stickyNote.style.width,
                    height: stickyNote.style.height
                };
                chrome.storage.local.set({ stickyNotes });
            }
        });
    };

    const stopResize = () => {
        isResizing = false;
        stickyNote.classList.remove('resizing');
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    };

    stickyNote.addEventListener('mousedown', startResize);

    // Modify the existing storage load logic to include dimensions
    chrome.storage.local.get(['stickyNotes'], (result) => {
        const stickyNotes = result.stickyNotes || {};
        const persistentNote = Object.values(stickyNotes).find(note => 
            note.persistentNote && note.showOnAllPages
        );
        const pageNote = stickyNotes[currentOrigin];
        const noteToLoad = persistentNote || pageNote;

        if (noteToLoad) {
            // ... existing note loading code ...

            // Apply saved dimensions if they exist
            if (noteToLoad.dimensions) {
                stickyNote.style.width = noteToLoad.dimensions.width;
                stickyNote.style.height = noteToLoad.dimensions.height;
            }
        }
    });

    // Updated globe icon click handler to use window.open
    const globeButton = stickyNote.querySelector('.globe-icon');
    globeButton.addEventListener('click', () => {
        chrome.storage.local.get(['stickyNotes'], (result) => {
            const stickyNotes = result.stickyNotes || {};
            const noteData = stickyNotes[currentOrigin];
            
            if (noteData && noteData.ownerOrigin) {
                // Simple window.open for navigation
                window.open(noteData.ownerOrigin, '_blank');
            }
        });
    });

    // Update the storage retrieval to highlight the globe icon when not on owner page
    chrome.storage.local.get(['stickyNotes'], (result) => {
        const stickyNotes = result.stickyNotes || {};
        const persistentNote = Object.values(stickyNotes).find(note => 
            note.persistentNote && note.showOnAllPages
        );
        const pageNote = stickyNotes[currentOrigin];
        const noteToLoad = persistentNote || pageNote;

        if (noteToLoad) {
            textarea.value = noteToLoad.content || '';
            if (noteToLoad.persistentNote) {
                pinButton.classList.add('active');
            }
            
            // Flip the logic - add active class when NOT on owner page
            if (noteToLoad.ownerOrigin && noteToLoad.ownerOrigin === currentOrigin) {
                globeButton.classList.remove('active');  // On owner page - show blue
            } else {
                globeButton.classList.add('active');     // Not on owner page - show grey
            }
            
            if (noteToLoad.position) {
                xOffset = noteToLoad.position.x;
                yOffset = noteToLoad.position.y;
                setTranslate(xOffset, yOffset, stickyNote);
            }
            
            if (noteToLoad.dimensions) {
                stickyNote.style.width = noteToLoad.dimensions.width;
                stickyNote.style.height = noteToLoad.dimensions.height;
            }
        }
    });

    // After creating the sticky note
    const pasteHandler = initializeStickyPaste(stickyNote);

    // Add cleanup when the note is removed
    function removeNote() {
        pasteHandler.cleanup();
        stickyNote.remove();
    }
}

// Initialize function to set up note state when page loads
function initializeNoteState() {
const url = new URL(window.location.href);
const currentOrigin = url.origin;
updateNoteVisibility(currentOrigin);
}

// Call initialize function when page loads
document.addEventListener('DOMContentLoaded', initializeNoteState);

// Make functions available to executeScript
window.createStickyNote = createStickyNote;
window.injectPenButton = injectPenButton;
window.updateNoteVisibility = updateNoteVisibility;

// Update the onActivated listener for tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(activeTab.url);
    const currentOrigin = url.origin;

    chrome.storage.local.get(['stickyNotes'], (result) => {
        const stickyNotes = result.stickyNotes || {};
        
        // Check for any persistent note
        const persistentNote = Object.values(stickyNotes).find(note => 
            note.persistentNote && note.showOnAllPages
        );
        
        // Check for page-specific note
        const pageNote = stickyNotes[currentOrigin];
        
        if (persistentNote || (pageNote && currentOrigin === pageNote.ownerOrigin)) {
            injectStickyNote();
        } else {
            const existingNote = document.querySelector('.sticky-note');
            if (existingNote) {
                existingNote.remove();
            }
            injectPenButton(currentOrigin);
        }
    });
} catch (error) {
    console.error('Error handling tab change:', error);
}});

