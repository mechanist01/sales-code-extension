let allCalls = [];

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateForInput(dateString) {
    return new Date(dateString).toISOString().slice(0, 16);
}

function createCallCard(callData, searchTerm = '') {
    const card = document.createElement('div');
    card.className = 'call-card';
    let isEditing = false;
    
    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    function getStatusClass(status) {
        const normalizedStatus = (status || '').toLowerCase().trim();
        return normalizedStatus === 'sold' ? 'status-completed' : 'status-pending';
    }

    function truncateNotes(notes, maxLength = 150) {
        if (!notes) return '';
        if (notes.length <= maxLength) return notes;
        return notes.substr(0, maxLength) + '...';
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    function renderViewMode() {
        const displayStatus = callData.saleStatus === 'Sold' ? 'Sold' : 'No sale';
        const isExpanded = card.classList.contains('expanded');
        
        return `
            <div class="card-actions-header">
                <div class="header-actions-left">
                    <button class="card-action-button delete-card" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
                <div class="header-actions-right">
                    <button class="card-action-button edit-card" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </button>
                    <button class="card-action-button expand-card" title="Expand">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="customer-section">
                <div class="customer-name">${highlightText(callData.customer || 'Unknown Customer', searchTerm)}</div>
                <div class="amount-value">$${highlightText((callData.saleAmount || 0).toString(), searchTerm)}</div>
            </div>

            <div class="date-section">
                <div class="date-field">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Created: ${formatDate(callData.date)}</span>
                </div>
                <div class="date-field">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Check-in: ${formatDate(callData.checkInDate || callData.date)}</span>
                </div>
            </div>

            <div class="call-details">
                <div class="detail-item">
                    <span class="detail-label">Rep</span>
                    <span class="detail-value">${highlightText(callData.rep, searchTerm)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="status-badge ${getStatusClass(callData.saleStatus)}">
                        ${highlightText(displayStatus, searchTerm)}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Brand</span>
                    <span class="detail-value">${highlightText(callData.brand, searchTerm)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Products</span>
                    <span class="detail-value">${highlightText(callData.products, searchTerm)}</span>
                </div>
            </div>

            ${isExpanded ? `
                <div class="content-columns">
                    <div class="notes-section">
                        <div class="notes-header">Notes</div>
                        <div class="notes-content">${highlightText(callData.notes || '', searchTerm)}</div>
                    </div>

                    <div class="transcription-section">
                        <div class="transcription-header">
                            <span>Transcription</span>
                            <div class="transcription-status">
                                <div class="status-indicator"></div>
                                <span>Complete</span>
                            </div>
                        </div>
                        <div class="transcription-content">
                            ${callData.transcription || 'No transcription available.'}
                        </div>
                    </div>
                </div>
            ` : `
                <div class="notes-section">
                    <div class="notes-content">${highlightText(callData.notes || '', searchTerm)}</div>
                </div>
            `}
        `;
    }

    function renderEditMode() {
        return `
            <div class="card-actions-header">
                <div class="header-actions-left">
                    <button class="card-action-button save-card" title="Save">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                    </button>
                    <button class="card-action-button cancel-edit" title="Cancel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="customer-section">
                <input type="text" class="editable-field customer-name" value="${callData.customer || ''}" placeholder="Customer Name">
            </div>

            <div class="date-section">
                <div class="date-row">
                    <div class="date-field created-date">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input type="datetime-local" class="editable-field" value="${formatDateForInput(callData.date)}" disabled>
                    </div>
                    <input type="number" class="editable-field amount-value" value="${callData.saleAmount}" step="0.01" min="0">
                </div>
                <div class="date-row">
                    <div class="date-field check-in-date">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input type="datetime-local" class="editable-field" value="${formatDateForInput(callData.checkInDate || callData.date)}">
                    </div>
                </div>
            </div>

            <div class="call-details">
                <div class="detail-item">
                    <span class="detail-label">Rep</span>
                    <input type="text" class="editable-field" value="${callData.rep}" placeholder="Rep Name">
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <select class="editable-field status-select">
                        <option value="Sold" ${callData.saleStatus === 'Sold' ? 'selected' : ''}>Sold</option>
                        <option value="No sale" ${callData.saleStatus !== 'Sold' ? 'selected' : ''}>No sale</option>
                    </select>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Brand</span>
                    <input type="text" class="editable-field" value="${callData.brand}" placeholder="Brand">
                </div>
                <div class="detail-item">
                    <span class="detail-label">Products</span>
                    <input type="text" class="editable-field" value="${callData.products}" placeholder="Products">
                </div>
            </div>

            <div class="notes-section">
                <textarea class="notes-content editable-field" placeholder="Add notes...">${callData.notes || ''}</textarea>
            </div>
        `;
    }

    async function saveChanges() {
        try {
            // Convert form values to proper types and handle potential undefined values
            const newData = {
                customer: card.querySelector('.customer-name').value || 'Unknown Customer',
                date: new Date(card.querySelector('input[type="datetime-local"][disabled]').value).toISOString(),
                saleAmount: parseFloat(card.querySelector('.amount-value').value) || 0,
                rep: card.querySelectorAll('.call-details .editable-field')[0].value || '',
                saleStatus: card.querySelector('.status-select').value || 'No sale',
                brand: card.querySelectorAll('.call-details .editable-field')[2].value || '',
                products: card.querySelectorAll('.call-details .editable-field')[3].value || '',
                notes: card.querySelector('.notes-content').value || '',
                checkInDate: new Date(card.querySelector('.check-in-date input[type="datetime-local"]').value).toISOString()
            };

            // Validate the data
            if (isNaN(newData.saleAmount)) {
                newData.saleAmount = 0;
            }

            const result = await chrome.storage.local.get(['savedCalls']);
            const calls = result.savedCalls || [];
            const index = calls.findIndex(call => 
                call.date === callData.date && 
                call.customer === callData.customer
            );

            if (index !== -1) {
                calls[index] = newData;
                await chrome.storage.local.set({ savedCalls: calls });
                
                // Update local reference before refreshing grid
                allCalls = calls;
                
                // First collapse if expanded
                if (card.classList.contains('expanded')) {
                    toggleExpanded();
                }

                // Then update the entire grid
                updateGrid(
                    document.getElementById('sortSelect').value,
                    document.getElementById('repFilter').value
                );
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    }

    function toggleEditMode() {
        isEditing = !isEditing;
        card.innerHTML = isEditing ? renderEditMode() : renderViewMode();
        setupEventListeners();
    }

    function toggleExpanded() {
        const wasExpanded = card.classList.contains('expanded');
        
        document.querySelectorAll('.call-card.expanded').forEach(expandedCard => {
            if (expandedCard !== card) {
                expandedCard.classList.remove('expanded');
            }
        });
        
        card.classList.toggle('expanded');
        overlay.classList.toggle('active');
        
        if (!wasExpanded) {
            document.body.appendChild(overlay);
            const expandButton = card.querySelector('.expand-card');
            if (expandButton) {
                expandButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                `;
            }
            document.body.style.overflow = 'hidden';
        } else {
            overlay.remove();
            const expandButton = card.querySelector('.expand-card');
            if (expandButton) {
                expandButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                `;
            }
            document.body.style.overflow = '';
            
            card.innerHTML = renderViewMode();
            setupEventListeners();
        }
    }

    function setupEventListeners() {
        const deleteButton = card.querySelector('.delete-card');
        const expandButton = card.querySelector('.expand-card');
        const editButton = card.querySelector('.edit-card');
        const saveButton = card.querySelector('.save-card');
        const cancelButton = card.querySelector('.cancel-edit');

        if (deleteButton) {
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                card.style.transition = 'opacity 0.2s ease';
                card.style.opacity = '0';
                
                try {
                    const result = await chrome.storage.local.get(['savedCalls']);
                    const calls = result.savedCalls || [];
                    const updatedCalls = calls.filter(call => 
                        call.date !== callData.date || 
                        call.customer !== callData.customer
                    );
                    
                    await chrome.storage.local.set({ savedCalls: updatedCalls });
                    
                    setTimeout(() => {
                        if (card.classList.contains('expanded')) {
                            overlay.remove();
                            document.body.style.overflow = '';
                        }
                        card.remove();
                    }, 200);
                    
                } catch (error) {
                    console.error('Error deleting call:', error);
                    card.style.opacity = '1';
                }
            });
        }

        if (expandButton) {
            expandButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleExpanded();
            });
        }

        if (editButton) {
            editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!card.classList.contains('expanded')) {
                    toggleExpanded();
                }
                toggleEditMode();
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                e.stopPropagation();
                saveChanges();
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleEditMode();
            });
        }
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (isEditing) {
                toggleEditMode();
            }
            toggleExpanded();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isEditing) {
                toggleEditMode();
            }
            if (card.classList.contains('expanded')) {
                toggleExpanded();
            }
        }
    });

    card.innerHTML = renderViewMode();
    setupEventListeners();
    return card;
}

// Rest of the code remains the same
function updateGrid(sortBy = 'date-desc', repFilter = 'all', searchFiltered = null) {
    const grid = document.getElementById('callGrid');
    grid.innerHTML = '';
    
    let filteredCalls = searchFiltered || [...allCalls];
    
    if (!searchFiltered && repFilter !== 'all') {
        filteredCalls = filteredCalls.filter(call => call.rep === repFilter);
    }
    
    filteredCalls.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'customer':
                return a.customer.localeCompare(b.customer);
            case 'amount':
                return parseFloat(b.saleAmount) - parseFloat(a.saleAmount);
            default:
                return 0;
        }

    });
    
    const searchTerm = document.querySelector('.search-input')?.value.toLowerCase() || '';
    
    filteredCalls.forEach(call => {
        grid.appendChild(createCallCard(call, searchTerm));
    });
}

function updateRepFilter() {
    const repFilter = document.getElementById('repFilter');
    const reps = new Set(allCalls.map(call => call.rep));
    
    repFilter.innerHTML = '<option value="all">All Reps</option>';
    reps.forEach(rep => {
        const option = document.createElement('option');
        option.value = rep;
        option.textContent = rep;
        repFilter.appendChild(option);
    });
}

function loadCalls() {
    chrome.storage.local.get(['savedCalls'], (result) => {
        allCalls = result.savedCalls || [];
        updateRepFilter();
        updateGrid();
    });
}

document.getElementById('sortSelect').addEventListener('change', (e) => {
    updateGrid(e.target.value, document.getElementById('repFilter').value);
});

document.getElementById('repFilter').addEventListener('change', (e) => {
    updateGrid(document.getElementById('sortSelect').value, e.target.value);
});

function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search calls...';
    
    const searchContainer = document.querySelector('.search-container');
    searchContainer.appendChild(searchInput);
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const grid = document.getElementById('callGrid');
        grid.innerHTML = '';
        
        let filteredCalls = allCalls.filter(call => {
            return Object.values(call).some(value => {
                if (typeof value === 'string' || typeof value === 'number') {
                    return value.toString().toLowerCase().includes(searchTerm);
                }
                return false;
            });
        });
        
        const currentSort = document.getElementById('sortSelect').value;
        const currentRep = document.getElementById('repFilter').value;
        
        if (currentRep !== 'all') {
            filteredCalls = filteredCalls.filter(call => call.rep === currentRep);
        }
        
        updateGrid(currentSort, currentRep, filteredCalls);
    });
}

function setupAddButton() {
    const filterBar = document.querySelector('.filter-bar');
    const addButton = document.createElement('button');
    addButton.className = 'card-action-button';
    addButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>New Call</span>
    `;
    addButton.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #3182ce;
        color: #f7fafc;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
        margin-left: auto;
    `;
    addButton.addEventListener('mouseenter', () => {
        addButton.style.backgroundColor = '#2b6cb0';
    });
    addButton.addEventListener('mouseleave', () => {
        addButton.style.backgroundColor = '#3182ce';
    });
    addButton.addEventListener('click', addCard);
    filterBar.appendChild(addButton);
}

function initialize() {
    loadCalls();
    setupSearch();
    setupAddButton();
}

initialize();

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.savedCalls) {
        allCalls = changes.savedCalls.newValue || [];
        updateRepFilter();
        updateGrid(
            document.getElementById('sortSelect').value,
            document.getElementById('repFilter').value
        );
    }
});

// Add message listener for transcription updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TRANSCRIPTION_UPDATED') {
        const transcriptionContent = document.querySelector('.transcription-content');
        if (transcriptionContent && 
            transcriptionContent.dataset.origin === message.data.origin) {
            transcriptionContent.textContent = message.data.transcription;
        }
    }
});

function addCard() {
    // Create default call data with current timestamp and proper initial status
    const now = new Date().toISOString();
    const defaultCallData = {
        customer: '',
        date: now,
        checkInDate: now,
        saleAmount: 0,
        rep: '',
        saleStatus: 'No sale',
        brand: '',
        products: '',
        notes: '',
        transcription: ''
    };

    // Create a temporary card element
    const tempCard = createCallCard(defaultCallData);
    tempCard.classList.add('expanded');
    
    // Create and show overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay active';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Add the card to the DOM
    document.body.appendChild(tempCard);
    
    // Immediately switch to edit mode
    const editButton = tempCard.querySelector('.edit-card');
    if (editButton) {
        editButton.click();
    }

    // Override the normal save behavior for new cards
    const saveButton = tempCard.querySelector('.save-card');
    if (saveButton) {
        saveButton.removeEventListener('click', null);
        saveButton.addEventListener('click', async () => {
            try {
                const newData = {
                    customer: tempCard.querySelector('.customer-name').value || 'Unknown Customer',
                    date: new Date(tempCard.querySelector('input[type="datetime-local"][disabled]').value).toISOString(),
                    saleAmount: parseFloat(tempCard.querySelector('.amount-value').value) || 0,
                    rep: tempCard.querySelectorAll('.call-details .editable-field')[0].value || '',
                    saleStatus: tempCard.querySelector('.status-select').value || 'No sale',
                    brand: tempCard.querySelectorAll('.call-details .editable-field')[2].value || '',
                    products: tempCard.querySelectorAll('.call-details .editable-field')[3].value || '',
                    notes: tempCard.querySelector('.notes-content').value || '',
                    checkInDate: new Date(tempCard.querySelector('.check-in-date input[type="datetime-local"]').value).toISOString(),
                    transcription: ''
                };

                // Validate required fields
                if (!newData.customer.trim()) {
                    alert('Please enter a customer name');
                    return;
                }

                // Validate status to ensure it matches expected values
                if (!['Sold', 'No sale'].includes(newData.saleStatus)) {
                    newData.saleStatus = 'No sale';
                }

                // Get existing calls
                const result = await chrome.storage.local.get(['savedCalls']);
                const calls = result.savedCalls || [];
                
                // Add new call to the beginning of the array
                calls.unshift(newData);
                
                // Save updated calls
                await chrome.storage.local.set({ savedCalls: calls });
                
                // Update local reference
                allCalls = calls;
                
                // Remove temporary card and overlay
                tempCard.remove();
                overlay.remove();
                document.body.style.overflow = '';
                
                // Update the grid
                updateGrid(
                    document.getElementById('sortSelect').value,
                    document.getElementById('repFilter').value
                );
                
                // Update rep filter options
                updateRepFilter();
                
            } catch (error) {
                console.error('Error saving new call:', error);
                alert('Error saving new call. Please try again.');
            }
        });
    }

    // Handle cancel for new cards
    const cancelButton = tempCard.querySelector('.cancel-edit');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            tempCard.remove();
            overlay.remove();
            document.body.style.overflow = '';
        });
    }

    // Handle overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            tempCard.remove();
            overlay.remove();
            document.body.style.overflow = '';
        }
    });

    // Handle escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            tempCard.remove();
            overlay.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}