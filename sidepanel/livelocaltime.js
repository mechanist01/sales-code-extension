// livelocaltime.js

export function createClockButton() {
    const clockContainer = document.createElement('div');
    clockContainer.className = 'clock-container';
    clockContainer.style.cssText = `
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: 10px;
    `;

    const clockButton = document.createElement('button');
    clockButton.className = 'clock-button';
    clockButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
    `;

    clockButton.style.cssText = `
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    `;

    clockButton.addEventListener('click', () => {
        const existingWindow = document.querySelector('.time-zone-window');
        if (existingWindow) {
            existingWindow.remove();
            return;
        }
        injectTimeZoneWindow();
    });

    clockContainer.appendChild(clockButton);

    return clockContainer;
}

function injectTimeZoneWindow() {
    const timeZoneWindow = document.createElement('div');
    timeZoneWindow.className = 'time-zone-window';
    timeZoneWindow.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 250px !important;
        background-color: #2d3748 !important;
        padding: 0 !important;
        border-radius: 0.25rem !important;
        border: 1px solid #4a5568 !important;
        z-index: 10000 !important;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        font-family: Arial, sans-serif !important;
    `;

    timeZoneWindow.innerHTML = `
        <div class="time-zone-header" style="
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 0.75rem !important;
            border-bottom: 1px solid #4a5568 !important;
            background-color: #2d3748 !important;
        ">
            <div style="color: #f7fafc !important; font-size: 14px !important;">Time Zones</div>
            <button class="close-time-zone" style="
                background: transparent !important;
                border: none !important;
                color: #a0aec0 !important;
                cursor: pointer !important;
                padding: 0.25rem !important;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="time-zone-search" style="
            padding: 0.75rem !important;
            border-bottom: 1px solid #4a5568 !important;
        ">
            <input type="text" placeholder="Search city..." style="
                width: 100% !important;
                padding: 0.5rem !important;
                border: 1px solid #4a5568 !important;
                border-radius: 0.25rem !important;
                background-color: #1a202c !important;
                color: #f7fafc !important;
                font-size: 14px !important;
                outline: none !important;
            ">
        </div>
        <div class="time-zone-results" style="
            padding: 0.75rem !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            color: #f7fafc !important;
            font-size: 14px !important;
        ">
            <div class="loading-message">Type a city name to see local time...</div>
        </div>
    `;

    // Add close button functionality
    const closeButton = timeZoneWindow.querySelector('.close-time-zone');
    closeButton.addEventListener('click', () => {
        timeZoneWindow.remove();
    });

    // Add search functionality
    const searchInput = timeZoneWindow.querySelector('input');
    const resultsContainer = timeZoneWindow.querySelector('.time-zone-results');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '<div class="loading-message">Type a city name to see local time...</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading-message">Searching...</div>';
        
        searchTimeout = setTimeout(() => {
            // Get all time zones
            const timeZones = Intl.supportedValuesOf('timeZone');
            
            // Filter time zones based on search term
            const filteredZones = timeZones.filter(zone => 
                zone.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Display results
            if (filteredZones.length > 0) {
                resultsContainer.innerHTML = filteredZones
                    .slice(0, 10)
                    .map(zone => {
                        const time = new Date().toLocaleTimeString('en-US', {
                            timeZone: zone,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        });
                        return `
                            <div class="time-zone-item" style="
                                padding: 0.5rem !important;
                                border-bottom: 1px solid #4a5568 !important;
                                display: flex !important;
                                justify-content: space-between !important;
                                align-items: center !important;
                            ">
                                <div>${zone.replace(/_/g, ' ')}</div>
                                <div>${time}</div>
                            </div>
                        `;
                    }).join('');

                // Update times every second
                setInterval(() => {
                    document.querySelectorAll('.time-zone-item').forEach(item => {
                        const zoneName = item.firstElementChild.textContent;
                        const timeElement = item.lastElementChild;
                        timeElement.textContent = new Date().toLocaleTimeString('en-US', {
                            timeZone: zoneName.replace(/ /g, '_'),
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        });
                    });
                }, 1000);
            } else {
                resultsContainer.innerHTML = '<div class="loading-message">No results found</div>';
            }
        }, 300);
    });

    document.body.appendChild(timeZoneWindow);

    // Make the window draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    timeZoneWindow.querySelector('.time-zone-header').addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target.closest('.time-zone-header')) {
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

            setTranslate(currentX, currentY, timeZoneWindow);
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
}