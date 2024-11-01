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

function createCallCard(callData, searchTerm = '') {
    const card = document.createElement('div');
    card.className = 'call-card';
    
    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    function getStatusClass(status) {
        const normalizedStatus = status.toLowerCase().trim();
        return normalizedStatus === 'sold' ? 'status-completed' : 'status-pending';
    }

    function truncateNotes(notes, maxLength = 150) {
        if (!notes) return '';
        if (notes.length <= maxLength) return notes;
        return notes.substr(0, maxLength) + '...';
    }
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const displayStatus = callData.saleStatus === 'Sold' ? 'Sold' : 'No sale';
    
    card.innerHTML = `
        <div class="card-actions-header">
            <button class="card-action-button expand-card" title="Expand">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            </button>
            <button class="card-action-button delete-card" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <div class="customer-section">
            <div class="customer-name">${highlightText(callData.customer || 'Unknown Customer', searchTerm)}</div>
        </div>

        <div class="date-section">
            <div class="call-date">${formatDate(callData.date)}</div>
            <div class="amount-value">$${highlightText(callData.saleAmount.toString(), searchTerm)}</div>
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

        ${callData.notes ? `
            <div class="notes-section">
                <div class="notes-content">${highlightText(truncateNotes(callData.notes), searchTerm)}</div>
            </div>
        ` : ''}
    `;
    
    const deleteButton = card.querySelector('.delete-card');
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

    const expandButton = card.querySelector('.expand-card');
    expandButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleExpanded();
    });

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
            expandButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                </svg>
            `;
            
            document.body.style.overflow = 'hidden';
        } else {
            overlay.remove();
            expandButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
            
            document.body.style.overflow = '';
        }
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            toggleExpanded();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && card.classList.contains('expanded')) {
            toggleExpanded();
        }
    });

    return card;
}

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

function initialize() {
    loadCalls();
    setupSearch();
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