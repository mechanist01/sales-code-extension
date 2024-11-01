export function initializeStickyPaste(stickyNote) {
    // Create context menu element
    const contextMenu = document.createElement('div');
    contextMenu.className = 'sticky-note-context-menu';
    contextMenu.style.cssText = `
        position: fixed;
        background: #2d3748;
        border: 1px solid #4a5568;
        border-radius: 0.25rem;
        padding: 0.5rem 0;
        display: none;
        z-index: 10001;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    `;

    // Create paste menu item
    const pasteItem = document.createElement('div');
    pasteItem.className = 'context-menu-item';
    pasteItem.textContent = 'Paste Note Content';
    pasteItem.style.cssText = `
        padding: 0.5rem 1rem;
        cursor: pointer;
        color: #f7fafc;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    `;

    // Add hover effects
    pasteItem.addEventListener('mouseover', () => {
        pasteItem.style.backgroundColor = '#4a5568';
    });

    pasteItem.addEventListener('mouseout', () => {
        pasteItem.style.backgroundColor = 'transparent';
    });

    // Assemble menu
    contextMenu.appendChild(pasteItem);
    document.body.appendChild(contextMenu);

    // Handle right-click on sticky note
    stickyNote.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const noteContent = stickyNote.querySelector('.sticky-note-content').value;
        
        if (noteContent.trim()) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
        }
    });

    // Handle paste action
    pasteItem.addEventListener('click', async () => {
        const noteContent = stickyNote.querySelector('.sticky-note-content').value;
        
        try {
            await navigator.clipboard.writeText(noteContent);
            
            if (document.activeElement && 
                (document.activeElement.tagName === 'INPUT' || 
                 document.activeElement.tagName === 'TEXTAREA')) {
                // Handle paste into focused input/textarea
                const start = document.activeElement.selectionStart;
                const end = document.activeElement.selectionEnd;
                const currentValue = document.activeElement.value;
                
                document.activeElement.value = 
                    currentValue.substring(0, start) + 
                    noteContent + 
                    currentValue.substring(end);
                
                document.activeElement.setSelectionRange(
                    start + noteContent.length,
                    start + noteContent.length
                );
            }
        } catch (err) {
            console.error('Failed to paste note content:', err);
        }

        contextMenu.style.display = 'none';
    });

    // Hide menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Hide menu during note interactions
    stickyNote.addEventListener('scroll', () => {
        contextMenu.style.display = 'none';
    });

    return {
        hideContextMenu: () => {
            contextMenu.style.display = 'none';
        },
        cleanup: () => {
            // Remove event listeners and elements when needed
            contextMenu.remove();
        }
    };
}

// Export CSS styles for the context menu
export const contextMenuStyles = `
    .sticky-note-context-menu {
        position: fixed !important;
        background: #2d3748 !important;
        border: 1px solid #4a5568 !important;
        border-radius: 0.25rem !important;
        padding: 0.5rem 0 !important;
        z-index: 10001 !important;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
    }

    .context-menu-item {
        padding: 0.5rem 1rem !important;
        cursor: pointer !important;
        color: #f7fafc !important;
        font-size: 0.875rem !important;
        transition: background-color 0.2s !important;
    }

    .context-menu-item:hover {
        background-color: #4a5568 !important;
    }
`;