// WebSocket connection for real-time functionality
let ws = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3 seconds

// Initialize WebSocket connection
function initWebSocket() {
    try {
        // In a real implementation, this would connect to your WebSocket server
        // For this demo, we'll simulate the connection
        ws = {
            send: function (data) {
                console.log('WebSocket message sent:', data);
                // Simulate receiving messages after a short delay
                setTimeout(() => {
                    handleWebSocketMessage(JSON.parse(data));
                }, 100);
            },
            close: function () {
                console.log('WebSocket connection closed');
                isConnected = false;
                updateConnectionStatus(false);
            }
        };

        // Simulate successful connection
        setTimeout(() => {
            isConnected = true;
            updateConnectionStatus(true);

            // Send user info to server
            if (currentUser) {
                sendUserInfo();
            }

            // If responder, request current emergencies
            if (currentUser && currentUser.type === 'responder') {
                requestEmergencies();
            }
        }, 500);

    } catch (error) {
        console.error('WebSocket connection failed:', error);
        handleConnectionError();
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(message) {
    console.log('WebSocket message received:', message);

    switch (message.type) {
        case 'user_joined':
            showNotification(`${message.userName} joined the system`, 'info');
            break;

        case 'user_left':
            showNotification(`${message.userName} left the system`, 'info');
            break;

        case 'emergency_reported':
            handleNewEmergency(message.emergency);
            break;

        case 'emergency_updated':
            updateEmergency(message.emergency);
            break;

        case 'emergency_resolved':
            resolveEmergency(message.emergencyId);
            break;

        case 'emergencies_list':
            if (currentUser && currentUser.type === 'responder') {
                updateEmergenciesList(message.emergencies);
            }
            break;

        case 'user_info_updated':
            updateUserInfo(message.user);
            break;

        default:
            console.log('Unknown message type:', message.type);
    }
}

// Send user information to server
function sendUserInfo() {
    if (!ws || !isConnected || !currentUser) return;

    const message = {
        type: 'user_info',
        user: {
            id: currentUser.id || Date.now(),
            name: currentUser.name,
            type: currentUser.type,
            organization: currentUser.organization,
            location: userLocation,
            timestamp: new Date().toISOString()
        }
    };

    ws.send(JSON.stringify(message));
}

// Request current emergencies from server
function requestEmergencies() {
    if (!ws || !isConnected) return;

    const message = {
        type: 'request_emergencies'
    };

    ws.send(JSON.stringify(message));
}

// Report a new emergency
function reportEmergency(emergency) {
    if (!ws || !isConnected) return;

    const message = {
        type: 'report_emergency',
        emergency: emergency
    };

    ws.send(JSON.stringify(message));
}

// Update emergency status
function updateEmergencyStatus(emergencyId, status, responder = null) {
    if (!ws || !isConnected) return;

    const message = {
        type: 'update_emergency',
        emergencyId: emergencyId,
        status: status,
        responder: responder,
        timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify(message));
}

// Handle new emergency from server
function handleNewEmergency(emergency) {
    // Add to local database
    emergencyDB.emergencies.push(emergency);

    // If user is a responder, update the UI
    if (currentUser && currentUser.type === 'responder') {
        loadEmergencies();
        showAlert(emergency);

        // Update analytics
        loadAnalyticsData();
    }

    // Show notification for reporters/guests if it's their emergency
    if (currentUser && (currentUser.type === 'reporter' || currentUser.type === 'guest') &&
        emergency.reporter.name === currentUser.name) {
        showNotification('Your emergency has been received and help is on the way!', 'success');
    }
}

// Update existing emergency
function updateEmergency(emergency) {
    const index = emergencyDB.emergencies.findIndex(e => e.id === emergency.id);
    if (index !== -1) {
        emergencyDB.emergencies[index] = emergency;

        // If user is a responder, update the UI
        if (currentUser && currentUser.type === 'responder') {
            loadEmergencies();
        }

        // Update analytics
        loadAnalyticsData();
    }
}

// Resolve emergency
function resolveEmergency(emergencyId) {
    const index = emergencyDB.emergencies.findIndex(e => e.id === emergencyId);
    if (index !== -1) {
        emergencyDB.emergencies[index].status = 'resolved';

        // If user is a responder, update the UI
        if (currentUser && currentUser.type === 'responder') {
            loadEmergencies();
        }

        // Update analytics
        loadAnalyticsData();

        // Show notification if it's the reporter's emergency
        if (currentUser && (currentUser.type === 'reporter' || currentUser.type === 'guest') &&
            emergencyDB.emergencies[index].reporter.name === currentUser.name) {
            showNotification('Your emergency has been resolved!', 'success');
        }
    }
}

// Update emergencies list for responders
function updateEmergenciesList(emergencies) {
    emergencyDB.emergencies = emergencies;
    loadEmergencies();
    loadAnalyticsData();
}

// Update user information
function updateUserInfo(user) {
    // In a real implementation, you might update user lists or online status
    console.log('User info updated:', user);
}

// Handle connection errors
function handleConnectionError() {
    isConnected = false;
    updateConnectionStatus(false);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        setTimeout(() => {
            initWebSocket();
        }, RECONNECT_INTERVAL);
    } else {
        console.error('Max reconnection attempts reached');
        showNotification('Connection lost. Please refresh the page.', 'error');
    }
}

// Update connection status UI
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    const indicatorEl = document.getElementById('connection-indicator');
    const textEl = document.getElementById('connection-text');

    if (connected) {
        statusEl.classList.remove('hidden');
        indicatorEl.className = 'online-indicator';
        textEl.textContent = 'Connected';
        reconnectAttempts = 0;
    } else {
        statusEl.classList.remove('hidden');
        indicatorEl.className = 'offline-indicator';
        textEl.textContent = 'Disconnected';
    }
}

// Data storage (simulating a database)
const emergencyDB = {
    emergencies: [],
    responders: [
        {
            id: 1,
            email: "responder@uth.gov.zm",
            password: "password123",
            organization: "hospital",
            name: "Dr. David Chanda",
            badgeId: "UTH-1234",
            isAvailable: true
        },
        {
            id: 2,
            email: "officer@police.gov.zm",
            password: "password123",
            organization: "police",
            name: "Officer James Banda",
            badgeId: "LCP-5678",
            isAvailable: true
        },
        {
            id: 3,
            email: "firefighter@lusfire.gov.zm",
            password: "fire123",
            organization: "fire",
            name: "Captain Sarah Mwale",
            badgeId: "LFF-4567",
            isAvailable: true
        },
        {
            id: 4,
            email: "guard@security.gov.zm",
            password: "secure456",
            organization: "security",
            name: "Security Chief John Phiri",
            badgeId: "GS-8965",
            isAvailable: true
        }
    ],
    rescueCenters: [
        {
            id: 1,
            name: "University Teaching Hospital",
            type: "hospital",
            location: { lat: -15.3955, lng: 28.3200 },
            address: "Nationalist Road, Lusaka, Zambia",
            phone: "+260211256067",
            resources: {
                bedsAvailable: 12,
                doctorsOnDuty: 4
            },
            emergencyTypes: ["medical", "general"]
        },
        {
            id: 2,
            name: "Lusaka Central Police Station",
            type: "police",
            location: { lat: -15.4167, lng: 28.2833 },
            address: "Cairo Road, Lusaka, Zambia",
            phone: "+260211228794",
            resources: {
                officersAvailable: 8,
                vehiclesAvailable: 3
            },
            emergencyTypes: ["police", "general"]
        },
        {
            id: 3,
            name: "Lusaka Fire Station",
            type: "fire",
            location: { lat: -15.4100, lng: 28.2900 },
            address: "Kabulonga Road, Lusaka, Zambia",
            phone: "+260211228844",
            resources: {
                trucksAvailable: 2,
                firefightersOnDuty: 6
            },
            emergencyTypes: ["fire", "general"]
        },
        {
            id: 4,
            name: "Levy Mwanawasa Hospital",
            type: "hospital",
            location: { lat: -15.3775, lng: 28.3100 },
            address: "Great East Road, Lusaka, Zambia",
            phone: "+260211253077",
            resources: {
                bedsAvailable: 8,
                doctorsOnDuty: 3
            },
            emergencyTypes: ["medical", "general"]
        },
        {
            id: 5,
            name: "Woodlands Police Station",
            type: "police",
            location: { lat: -15.4000, lng: 28.3000 },
            address: "Woodlands Road, Lusaka, Zambia",
            phone: "+260211254321",
            resources: {
                officersAvailable: 5,
                vehiclesAvailable: 2
            },
            emergencyTypes: ["police", "general"]
        }
    ]
};

// Current user state
let currentUser = null;
let currentEmergencyType = null;
let userLocation = null;
let map = null;
let userMarker = null;
let recommendedCenter = null;
let emergencyRefreshInterval = null;
let currentCallNumber = null;
let currentStep = 1;
let uploadedImages = [];
let emergencyMap = null;
let selectedEmergencyForDispatch = null;

// Alert notification variables
let alertSoundEnabled = true;
let alertSound = null;
let alertCounter = 0;
let pendingAlerts = [];
let currentAlert = null;
let alertInterval = null;
let alertDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

// Analytics variables
let analyticsMap = null;
let typeChart = null;
let timeChart = null;
let currentReportType = 'daily';

// Session management
const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes

// DOM Elements
const loginModal = document.getElementById('login-modal');
const reporterView = document.getElementById('reporter-view');
const responderView = document.getElementById('responder-view');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const rescueCentersList = document.getElementById('rescue-centers-list');
const recommendedCenterSection = document.getElementById('recommended-center');
const recommendedName = document.getElementById('recommended-name');
const recommendedDistance = document.getElementById('recommended-distance');
const recommendedResources = document.getElementById('recommended-resources');
const recommendedPhone = document.getElementById('recommended-phone');
const emergenciesList = document.getElementById('emergencies-list');
const activeEmergenciesEl = document.getElementById('active-emergencies');
const respondedEmergenciesEl = document.getElementById('responded-emergencies');
const resolvedEmergenciesEl = document.getElementById('resolved-emergencies');
const contactInfoSection = document.getElementById('contact-info-section');
const prevStepBtn = document.getElementById('prev-step');
const nextStepBtn = document.getElementById('next-step');
const currentStepEl = document.getElementById('current-step');
const progressFill = document.getElementById('progress-fill');
const formSections = document.querySelectorAll('.form-section');
const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const viewMapBtn = document.getElementById('view-map-btn');
const dispatchUnitBtn = document.getElementById('dispatch-unit-btn');
const mapModal = document.getElementById('map-modal');
const dispatchModal = document.getElementById('dispatch-modal');
const confirmDispatchBtn = document.getElementById('confirm-dispatch');
const emergencyMapContainer = document.getElementById('emergency-map');

// Alert notification elements
const alertNotification = document.getElementById('alert-notification');
const alertClose = document.getElementById('alert-close');
const alertType = document.getElementById('alert-type');
const alertLocation = document.getElementById('alert-location');
const alertTime = document.getElementById('alert-time');
const alertSeverity = document.getElementById('alert-severity');
const alertViewDetails = document.getElementById('alert-view-details');
const alertDismiss = document.getElementById('alert-dismiss');
const soundToggle = document.getElementById('sound-toggle');
const alertCounterEl = document.getElementById('alert-counter');

// Analytics elements
const dailyReportBtn = document.getElementById('daily-report-btn');
const monthlyReportBtn = document.getElementById('monthly-report-btn');
const reportPeriod = document.getElementById('report-period');
const totalEmergenciesEl = document.getElementById('total-emergencies');
const medicalEmergenciesEl = document.getElementById('medical-emergencies');
const fireEmergenciesEl = document.getElementById('fire-emergencies');
const policeEmergenciesEl = document.getElementById('police-emergencies');
const reportTableBody = document.getElementById('report-table-body');

// Show login modal on page load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize WebSocket connection
    initWebSocket();

    checkSession();
    initMap();
    setupCallButtons();
    setupFormNavigation();
    setupImageUpload();
    setupModalEvents();
    setupAlertSystem();
    setupAnalytics();
});

// Session management functions
function checkSession() {
    const sessionData = localStorage.getItem('emergencyResponseSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        const now = new Date().getTime();

        if (now - session.timestamp < SESSION_DURATION) {
            // Session is valid, restore user
            currentUser = session.user;
            userDisplay.textContent = currentUser.name;
            loginModal.classList.add('hidden');
            logoutBtn.classList.remove('hidden');

            if (currentUser.type === 'reporter') {
                reporterView.classList.remove('hidden');
                contactInfoSection.classList.remove('hidden');
            } else if (currentUser.type === 'responder') {
                responderView.classList.remove('hidden');
                // Load emergencies and set up auto-refresh
                loadEmergencies();
                if (emergencyRefreshInterval) {
                    clearInterval(emergencyRefreshInterval);
                }
                emergencyRefreshInterval = setInterval(loadEmergencies, 5000);
                initAnalytics();
            }

            // Send user info to server
            sendUserInfo();
        } else {
            // Session expired
            localStorage.removeItem('emergencyResponseSession');
        }
    }
}

function saveSession() {
    if (currentUser) {
        const session = {
            user: currentUser,
            timestamp: new Date().getTime()
        };
        localStorage.setItem('emergencyResponseSession', JSON.stringify(session));
    }
}

function clearSession() {
    localStorage.removeItem('emergencyResponseSession');
}

// Setup analytics
function setupAnalytics() {
    // Set up report type buttons
    dailyReportBtn.addEventListener('click', function () {
        currentReportType = 'daily';
        updateReportButtons();
        loadAnalyticsData();
    });

    monthlyReportBtn.addEventListener('click', function () {
        currentReportType = 'monthly';
        updateReportButtons();
        loadAnalyticsData();
    });
}

function initAnalytics() {
    loadAnalyticsData();
}

// Update report button styles
function updateReportButtons() {
    if (currentReportType === 'daily') {
        dailyReportBtn.classList.add('bg-blue-600', 'text-white');
        dailyReportBtn.classList.remove('bg-gray-200', 'text-gray-700');
        monthlyReportBtn.classList.add('bg-gray-200', 'text-gray-700');
        monthlyReportBtn.classList.remove('bg-blue-600', 'text-white');
        reportPeriod.textContent = 'Showing data for: Today';
    } else {
        monthlyReportBtn.classList.add('bg-blue-600', 'text-white');
        monthlyReportBtn.classList.remove('bg-gray-200', 'text-gray-700');
        dailyReportBtn.classList.add('bg-gray-200', 'text-gray-700');
        dailyReportBtn.classList.remove('bg-blue-600', 'text-white');
        reportPeriod.textContent = 'Showing data for: This Month';
    }
}

// Load and process analytics data
function loadAnalyticsData() {
    // Filter emergencies based on report type
    const now = new Date();
    let filteredEmergencies = [];

    if (currentReportType === 'daily') {
        // Get emergencies from today
        filteredEmergencies = emergencyDB.emergencies.filter(emergency => {
            const emergencyDate = new Date(emergency.timestamp);
            return emergencyDate.toDateString() === now.toDateString();
        });
    } else {
        // Get emergencies from this month
        filteredEmergencies = emergencyDB.emergencies.filter(emergency => {
            const emergencyDate = new Date(emergency.timestamp);
            return emergencyDate.getMonth() === now.getMonth() &&
                emergencyDate.getFullYear() === now.getFullYear();
        });
    }

    // Update summary statistics
    updateSummaryStats(filteredEmergencies);

    // Update map visualization
    updateAnalyticsMap(filteredEmergencies);

    // Update charts
    updateTypeChart(filteredEmergencies);
    updateTimeChart(filteredEmergencies);

    // Update report table
    updateReportTable(filteredEmergencies);
}

// Update summary statistics
function updateSummaryStats(emergencies) {
    totalEmergenciesEl.textContent = emergencies.length;

    const medicalCount = emergencies.filter(e => e.type === 'medical').length;
    const fireCount = emergencies.filter(e => e.type === 'fire').length;
    const policeCount = emergencies.filter(e => e.type === 'police').length;
    const otherCount = emergencies.filter(e => e.type === 'general').length;

    medicalEmergenciesEl.textContent = medicalCount;
    fireEmergenciesEl.textContent = fireCount;
    policeEmergenciesEl.textContent = policeCount;
}

// Update analytics map with emergency hotspots
function updateAnalyticsMap(emergencies) {
    const mapContainer = document.getElementById('analytics-map');

    // Clear previous map if it exists
    if (analyticsMap) {
        analyticsMap.remove();
    }

    // Create new map centered on Lusaka
    analyticsMap = L.map('analytics-map').setView([-15.3875, 28.3228], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(analyticsMap);

    // Create a heatmap layer (using circles as a simple approximation)
    emergencies.forEach(emergency => {
        let color;
        switch (emergency.type) {
            case 'medical': color = 'red'; break;
            case 'fire': color = 'orange'; break;
            case 'police': color = 'blue'; break;
            default: color = 'gray';
        }

        L.circle([emergency.location.lat, emergency.location.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            radius: 300
        }).addTo(analyticsMap).bindPopup(`
            <strong>${emergency.type.toUpperCase()} Emergency</strong><br>
            ${emergency.address}<br>
            ${formatTime(emergency.timestamp)}
        `);
    });

    // Add rescue centers to the map
    emergencyDB.rescueCenters.forEach(center => {
        let iconColor;
        switch (center.type) {
            case 'hospital': iconColor = 'red'; break;
            case 'police': iconColor = 'blue'; break;
            case 'fire': iconColor = 'orange'; break;
            default: iconColor = 'gray';
        }

        const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color: ${iconColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        L.marker([center.location.lat, center.location.lng], { icon: icon })
            .addTo(analyticsMap)
            .bindPopup(`
                <strong>${center.name}</strong><br>
                ${center.address}<br>
                Phone: ${center.phone}
            `);
    });
}

// Update emergency type distribution chart
function updateTypeChart(emergencies) {
    const ctx = document.getElementById('type-chart').getContext('2d');

    // Count emergencies by type
    const typeCounts = {
        medical: emergencies.filter(e => e.type === 'medical').length,
        fire: emergencies.filter(e => e.type === 'fire').length,
        police: emergencies.filter(e => e.type === 'police').length,
        general: emergencies.filter(e => e.type === 'general').length
    };

    // Destroy previous chart if it exists
    if (typeChart) {
        typeChart.destroy();
    }

    // Create new chart
    typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Medical', 'Fire', 'Police', 'Other'],
            datasets: [{
                data: [typeCounts.medical, typeCounts.fire, typeCounts.police, typeCounts.general],
                backgroundColor: [
                    '#ef4444', // red
                    '#f97316', // orange
                    '#3b82f6', // blue
                    '#94a3b8'  // gray
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update time pattern chart
function updateTimeChart(emergencies) {
    const ctx = document.getElementById('time-chart').getContext('2d');

    // Group emergencies by hour
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourlyCounts = hours.map(hour => {
        return emergencies.filter(emergency => {
            const emergencyHour = new Date(emergency.timestamp).getHours();
            return emergencyHour === hour;
        }).length;
    });

    // Destroy previous chart if it exists
    if (timeChart) {
        timeChart.destroy();
    }

    // Create new chart
    timeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
                label: 'Emergencies by Hour',
                data: hourlyCounts,
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Emergencies'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hour of Day'
                    }
                }
            }
        }
    });
}

// Update detailed report table
function updateReportTable(emergencies) {
    reportTableBody.innerHTML = '';

    // Sort emergencies by timestamp (newest first)
    const sortedEmergencies = [...emergencies].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Add rows to table
    sortedEmergencies.forEach(emergency => {
        const row = document.createElement('tr');

        // Format time
        const emergencyTime = new Date(emergency.timestamp);
        const timeString = emergencyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Format type with icon
        let typeIcon = '';
        switch (emergency.type) {
            case 'medical': typeIcon = '🏥'; break;
            case 'fire': typeIcon = '🔥'; break;
            case 'police': typeIcon = '👮'; break;
            default: typeIcon = '⚠️';
        }

        row.innerHTML = `
            <td class="py-2 px-4">${timeString}</td>
            <td class="py-2 px-4">${typeIcon} ${emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1)}</td>
            <td class="py-2 px-4">${emergency.address}</td>
            <td class="py-2 px-4">
                <span class="priority-badge ${getSeverityClass(emergency.severity)}">
                    ${emergency.severity}
                </span>
            </td>
        `;

        reportTableBody.appendChild(row);
    });

    // If no emergencies, show message
    if (sortedEmergencies.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="py-4 px-4 text-center text-gray-500">
                No emergencies found for this period
            </td>
        `;
        reportTableBody.appendChild(row);
    }
}

// Helper function to get severity CSS class
function getSeverityClass(severity) {
    if (severity.includes('Critical')) return 'bg-red-100 text-red-800';
    if (severity.includes('Serious')) return 'bg-yellow-100 text-yellow-800';
    if (severity.includes('Moderate')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
}

// Setup alert notification system
function setupAlertSystem() {
    // Setup alert event listeners
    alertClose.addEventListener('click', hideAlert);
    alertDismiss.addEventListener('click', hideAlert);
    alertViewDetails.addEventListener('click', function () {
        if (currentAlert) {
            // Select the emergency in the list
            const emergencyItem = document.querySelector(`.emergency-item[data-id="${currentAlert.id}"]`);
            if (emergencyItem) {
                emergencyItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                emergencyItem.classList.add('selected');

                // Highlight the emergency for a moment
                setTimeout(() => {
                    emergencyItem.style.backgroundColor = '#fff3cd';
                    setTimeout(() => {
                        emergencyItem.style.backgroundColor = '';
                    }, 3000);
                }, 100);
            }
        }
        hideAlert();
    });

    // Sound toggle
    soundToggle.addEventListener('click', function () {
        alertSoundEnabled = !alertSoundEnabled;
        if (alertSoundEnabled) {
            soundToggle.classList.remove('muted');
            soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            soundToggle.classList.add('muted');
            soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    });

    // Check for new emergencies periodically
    setInterval(checkForNewEmergencies, 3000);
}

// Check for new emergencies and trigger alerts
function checkForNewEmergencies() {
    // Only check if user is a responder
    if (!currentUser || currentUser.type !== 'responder') return;

    // Get the latest emergency ID we've seen
    const latestSeenId = localStorage.getItem('latestSeenEmergencyId') || 0;

    // Find new emergencies (those with ID greater than latest seen)
    const newEmergencies = emergencyDB.emergencies.filter(
        emergency => emergency.id > latestSeenId && emergency.status === 'reported'
    );

    // Update the latest seen ID
    if (emergencyDB.emergencies.length > 0) {
        const maxId = Math.max(...emergencyDB.emergencies.map(e => e.id));
        localStorage.setItem('latestSeenEmergencyId', maxId);
    }

    // Show alerts for new emergencies
    newEmergencies.forEach(emergency => {
        showAlert(emergency);
    });
}

// Show alert for a new emergency
function showAlert(emergency) {
    // If there's already an alert showing, add to pending queue
    if (alertNotification.classList.contains('show')) {
        pendingAlerts.push(emergency);
        updateAlertCounter();
        return;
    }

    currentAlert = emergency;

    // Update alert content
    alertType.textContent = emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1) + ' Emergency';
    alertLocation.textContent = emergency.address;
    alertTime.textContent = formatTime(emergency.timestamp);
    alertSeverity.textContent = emergency.severity;

    // Add severity-based styling
    alertSeverity.className = '';
    if (emergency.severity.includes('Critical')) {
        alertSeverity.classList.add('priority-badge', 'bg-red-100', 'text-red-800');
    } else if (emergency.severity.includes('Serious')) {
        alertSeverity.classList.add('priority-badge', 'bg-yellow-100', 'text-yellow-800');
    } else if (emergency.severity.includes('Moderate')) {
        alertSeverity.classList.add('priority-badge', 'bg-blue-100', 'text-blue-800');
    } else {
        alertSeverity.classList.add('priority-badge', 'bg-gray-100', 'text-gray-800');
    }

    // Show the alert
    alertNotification.classList.add('show', 'pulse');

    // Play alert sound if enabled
    if (alertSoundEnabled) {
        playAlertSound();
        // Continue playing sound every 10 seconds for 5 minutes
        alertInterval = setInterval(() => {
            if (alertSoundEnabled && alertNotification.classList.contains('show')) {
                playAlertSound();
            }
        }, 10000);
    }

    // Auto-hide after 5 minutes if not interacted with
    setTimeout(() => {
        if (alertNotification.classList.contains('show')) {
            hideAlert();
        }
    }, alertDuration);
}

// Hide the current alert and show next if available
function hideAlert() {
    alertNotification.classList.remove('show', 'pulse');
    currentAlert = null;

    // Clear the alert interval
    if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
    }

    // Show next alert if available
    if (pendingAlerts.length > 0) {
        setTimeout(() => {
            const nextAlert = pendingAlerts.shift();
            showAlert(nextAlert);
            updateAlertCounter();
        }, 500);
    }
}

// Play alert sound
function playAlertSound() {
    if (alertSoundEnabled) {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            // Repeat after a short delay
            setTimeout(() => {
                const oscillator2 = audioContext.createOscillator();
                const gainNode2 = audioContext.createGain();

                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);

                oscillator2.frequency.value = 600;
                oscillator2.type = 'sine';

                gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator2.start(audioContext.currentTime);
                oscillator2.stop(audioContext.currentTime + 0.5);
            }, 600);
        } catch (e) {
            console.error('Error playing alert sound:', e);
        }
    }
}

// Update alert counter badge
function updateAlertCounter() {
    alertCounter = pendingAlerts.length;
    if (alertCounter > 0) {
        alertCounterEl.textContent = alertCounter;
        alertCounterEl.classList.remove('hidden');
    } else {
        alertCounterEl.classList.add('hidden');
    }
}

// Setup image upload functionality
function setupImageUpload() {
    imageUpload.addEventListener('change', function (e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.match('image.*')) continue;

            const reader = new FileReader();
            reader.onload = function (e) {
                const imageData = e.target.result;
                uploadedImages.push(imageData);

                // Create preview
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview';
                previewDiv.innerHTML = `
                    <img src="${imageData}" alt="Uploaded image">
                    <div class="remove-image" data-index="${uploadedImages.length - 1}">
                        <i class="fas fa-times"></i>
                    </div>
                `;
                imagePreviewContainer.appendChild(previewDiv);

                // Add event listener to remove button
                const removeBtn = previewDiv.querySelector('.remove-image');
                removeBtn.addEventListener('click', function () {
                    const index = parseInt(this.getAttribute('data-index'));
                    uploadedImages.splice(index, 1);
                    imagePreviewContainer.removeChild(previewDiv);

                    // Update indices for remaining remove buttons
                    const remainingButtons = imagePreviewContainer.querySelectorAll('.remove-image');
                    remainingButtons.forEach((btn, idx) => {
                        btn.setAttribute('data-index', idx);
                    });
                });
            };
            reader.readAsDataURL(file);
        }

        // Reset the file input
        imageUpload.value = '';
    });
}

// Setup modal events
function setupModalEvents() {
    // Close modals when clicking the close button
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            mapModal.classList.add('hidden');
            dispatchModal.classList.add('hidden');
        });
    });

    // Close modals when clicking outside the content
    mapModal.addEventListener('click', function (e) {
        if (e.target === mapModal) {
            mapModal.classList.add('hidden');
        }
    });

    dispatchModal.addEventListener('click', function (e) {
        if (e.target === dispatchModal) {
            dispatchModal.classList.add('hidden');
        }
    });

    // View map button
    viewMapBtn.addEventListener('click', function () {
        // Check if an emergency is selected
        const selectedEmergency = document.querySelector('.emergency-item.selected');
        if (!selectedEmergency) {
            showNotification('Please select an emergency first', 'error');
            return;
        }

        const emergencyId = parseInt(selectedEmergency.getAttribute('data-id'));
        const emergency = emergencyDB.emergencies.find(e => e.id === emergencyId);

        if (emergency) {
            showEmergencyMap(emergency);
            mapModal.classList.remove('hidden');
        }
    });

    // Dispatch unit button
    dispatchUnitBtn.addEventListener('click', function () {
        // Check if an emergency is selected
        const selectedEmergency = document.querySelector('.emergency-item.selected');
        if (!selectedEmergency) {
            showNotification('Please select an emergency first', 'error');
            return;
        }

        const emergencyId = parseInt(selectedEmergency.getAttribute('data-id'));
        selectedEmergencyForDispatch = emergencyDB.emergencies.find(e => e.id === emergencyId);

        if (selectedEmergencyForDispatch) {
            dispatchModal.classList.remove('hidden');
        }
    });

    // Confirm dispatch
    confirmDispatchBtn.addEventListener('click', function () {
        const unit = document.getElementById('dispatch-unit').value;
        const notes = document.getElementById('dispatch-notes').value;

        if (!unit) {
            showNotification('Please select a unit to dispatch', 'error');
            return;
        }

        // Update emergency status
        selectedEmergencyForDispatch.status = 'dispatched';
        selectedEmergencyForDispatch.dispatchedUnit = unit;
        selectedEmergencyForDispatch.dispatchNotes = notes;
        selectedEmergencyForDispatch.dispatchTime = new Date();

        // Send update to server
        updateEmergencyStatus(selectedEmergencyForDispatch.id, 'dispatched', currentUser.name);

        showNotification(`Unit ${unit} has been dispatched to the emergency`, 'success');
        dispatchModal.classList.add('hidden');

        // Refresh emergencies list
        loadEmergencies();
        // Refresh analytics
        loadAnalyticsData();
    });
}

// Show emergency on map
function showEmergencyMap(emergency) {
    // Clear previous map if it exists
    if (emergencyMap) {
        emergencyMap.remove();
    }

    // Create new map
    emergencyMap = L.map('emergency-map').setView([emergency.location.lat, emergency.location.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(emergencyMap);

    // Add marker for emergency location
    L.marker([emergency.location.lat, emergency.location.lng])
        .addTo(emergencyMap)
        .bindPopup(`
            <strong>${emergency.type.toUpperCase()} Emergency</strong><br>
            ${emergency.address}<br>
            ${emergency.landmark ? `Landmark: ${emergency.landmark}<br>` : ''}
            Reported: ${formatTime(emergency.timestamp)}
        `)
        .openPopup();

    // Add nearby rescue centers to the map
    emergencyDB.rescueCenters.forEach(center => {
        let iconColor;
        switch (center.type) {
            case 'hospital': iconColor = 'red'; break;
            case 'police': iconColor = 'blue'; break;
            case 'fire': iconColor = 'orange'; break;
            default: iconColor = 'gray';
        }

        const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color: ${iconColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        L.marker([center.location.lat, center.location.lng], { icon: icon })
            .addTo(emergencyMap)
            .bindPopup(`
                <strong>${center.name}</strong><br>
                ${center.address}<br>
                Phone: ${center.phone}
            `);
    });
}

// Setup form navigation
function setupFormNavigation() {
    prevStepBtn.addEventListener('click', goToPreviousStep);
    nextStepBtn.addEventListener('click', goToNextStep);
}

// Navigate to next step
function goToNextStep() {
    // Validate current step
    if (!validateCurrentStep()) {
        return;
    }

    if (currentStep < 4) {
        // Hide current section
        document.getElementById(`step-${currentStep}`).classList.remove('active');

        // Show next section
        currentStep++;
        document.getElementById(`step-${currentStep}`).classList.add('active');

        // Update UI
        updateStepUI();

        // If we're on the final step, load rescue centers
        if (currentStep === 4) {
            loadRescueCenters();
        }
    } else {
        // Submit the form if we're on the last step
        document.getElementById('submit-emergency').click();
    }
}

// Navigate to previous step
function goToPreviousStep() {
    if (currentStep > 1) {
        // Hide current section
        document.getElementById(`step-${currentStep}`).classList.remove('active');

        // Show previous section
        currentStep--;
        document.getElementById(`step-${currentStep}`).classList.add('active');

        // Update UI
        updateStepUI();
    }
}

// Update step UI elements
function updateStepUI() {
    // Update progress bar
    const progressPercentage = (currentStep / 4) * 100;
    progressFill.style.width = `${progressPercentage}%`;

    // Update step indicator
    currentStepEl.textContent = currentStep;

    // Update navigation buttons
    if (currentStep === 1) {
        prevStepBtn.classList.add('hidden');
    } else {
        prevStepBtn.classList.remove('hidden');
    }

    if (currentStep === 4) {
        nextStepBtn.textContent = 'Submit Report';
        nextStepBtn.innerHTML = 'Submit Report <i class="fas fa-check ml-2"></i>';
    } else {
        nextStepBtn.textContent = 'Next';
        nextStepBtn.innerHTML = 'Next <i class="fas fa-arrow-right ml-2"></i>';
    }
}

// Validate current step
function validateCurrentStep() {
    switch (currentStep) {
        case 1: // Emergency type
            const selectedType = document.querySelector('input[name="emergency-type"]:checked');
            if (!selectedType) {
                showNotification('Please select an emergency type', 'error');
                return false;
            }
            currentEmergencyType = selectedType.value;
            return true;

        case 2: // Emergency details
            const affectedPeople = document.getElementById('affected-people').value;
            const severity = document.getElementById('emergency-severity').value;
            const description = document.getElementById('emergency-description').value;

            if (!affectedPeople) {
                showNotification('Please indicate how many people are affected', 'error');
                return false;
            }

            if (!severity) {
                showNotification('Please select the emergency severity', 'error');
                return false;
            }

            if (!description.trim()) {
                showNotification('Please provide a description of the emergency', 'error');
                return false;
            }

            return true;

        case 3: // Location
            const address = document.getElementById('emergency-address').value;

            if (!address.trim()) {
                showNotification('Please provide the emergency location address', 'error');
                return false;
            }

            return true;

        default:
            return true;
    }
}

// User type selection
document.querySelectorAll('.user-type-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        const userType = this.getAttribute('data-type');
        document.getElementById('reporter-login').classList.add('hidden');
        document.getElementById('responder-login').classList.add('hidden');
        document.getElementById('guest-login').classList.add('hidden');

        if (userType === 'reporter') {
            document.getElementById('reporter-login').classList.remove('hidden');
        } else if (userType === 'responder') {
            document.getElementById('responder-login').classList.remove('hidden');
        } else {
            document.getElementById('guest-login').classList.remove('hidden');
        }
    });
});

// Reporter login
document.getElementById('reporter-login-btn').addEventListener('click', function () {
    const phone = document.getElementById('reporter-phone').value;
    if (!phone) {
        showNotification('Please enter your phone number', 'error');
        return;
    }

    currentUser = {
        type: 'reporter',
        phone: phone,
        name: 'Reporter'
    };

    userDisplay.textContent = 'Reporter';
    loginModal.classList.add('hidden');
    reporterView.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    contactInfoSection.classList.remove('hidden');

    // Save session
    saveSession();

    // Clear any existing refresh interval
    if (emergencyRefreshInterval) {
        clearInterval(emergencyRefreshInterval);
        emergencyRefreshInterval = null;
    }

    // Send user info to server
    sendUserInfo();

    showNotification('Logged in as reporter', 'success');
});

// Responder login (Firebase Auth)
document.getElementById('responder-login-btn').addEventListener('click', async function () {
    const email = document.getElementById('responder-email').value;
    const password = document.getElementById('responder-password').value;
    const organization = document.getElementById('responder-org').value;

    if (!email || !password || !organization) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    try {
        let user;
        if (window.isFirebaseReady && window.isFirebaseReady()) {
            user = await window.AuthService.loginResponder({ email, password });
            // Ensure organization field exists in profile
            if (!user.organization) {
                await window.usersCollection().doc(user.uid).set({ organization }, { merge: true });
                user.organization = organization;
            }
        } else {
            // Fallback local mock (offline)
            user = { uid: 'offline', type: 'responder', email, organization, name: email.split('@')[0] };
        }

        currentUser = {
            type: 'responder',
            id: user.uid,
            email: user.email,
            organization: user.organization,
            name: user.name || email.split('@')[0]
        };

        userDisplay.textContent = currentUser.name;
        loginModal.classList.add('hidden');
        responderView.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');

        // Save session
        saveSession();

        // Send user info to server
        sendUserInfo();

        // Load emergencies and set up auto-refresh
        loadEmergencies();
        if (emergencyRefreshInterval) {
            clearInterval(emergencyRefreshInterval);
        }
        emergencyRefreshInterval = setInterval(loadEmergencies, 5000);

        // Initialize analytics
        initAnalytics();

        showNotification('Logged in as responder', 'success');
    } catch (e) {
        console.error('Responder login failed', e);
        showNotification('Login failed', 'error');
    }
});

// Guest login
document.getElementById('guest-login-btn').addEventListener('click', function () {
    currentUser = {
        type: 'guest',
        name: 'Guest User'
    };

    userDisplay.textContent = 'Guest';
    loginModal.classList.add('hidden');
    reporterView.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    contactInfoSection.classList.add('hidden');

    // Save session
    saveSession();

    // Clear any existing refresh interval
    if (emergencyRefreshInterval) {
        clearInterval(emergencyRefreshInterval);
        emergencyRefreshInterval = null;
    }

    // Send user info to server
    sendUserInfo();

    showNotification('Continuing as guest', 'info');
});

// Logout functionality
logoutBtn.addEventListener('click', async function () {
    try {
        if (window.isFirebaseReady && window.isFirebaseReady()) {
            await window.AuthService.logout();
        }
    } catch (e) {
        console.warn('Logout warning:', e);
    }
    currentUser = null;
    userDisplay.textContent = 'Guest';
    reporterView.classList.add('hidden');
    responderView.classList.add('hidden');
    loginModal.classList.remove('hidden');
    logoutBtn.classList.add('hidden');

    // Clear session
    clearSession();

    // Clear refresh interval
    if (emergencyRefreshInterval) {
        clearInterval(emergencyRefreshInterval);
        emergencyRefreshInterval = null;
    }

    showNotification('Logged out successfully', 'info');
});

// Submit emergency
document.getElementById('submit-emergency').addEventListener('click', async function () {
    if (!currentEmergencyType) {
        showNotification('Please select an emergency type', 'error');
        return;
    }

    const severity = document.getElementById('emergency-severity').value;
    const affectedPeople = document.getElementById('affected-people').value;
    const description = document.getElementById('emergency-description').value;
    const address = document.getElementById('emergency-address').value;
    const landmark = document.getElementById('emergency-landmark').value;

    if (!description || !address) {
        showNotification('Please provide emergency details and location', 'error');
        return;
    }

    let name = "Anonymous";
    let phone = "Not provided";
    let canContact = false;

    if (currentUser.type !== 'guest') {
        name = document.getElementById('reporter-name').value || "Anonymous";
        phone = document.getElementById('reporter-contact-phone').value || "Not provided";
        canContact = document.querySelector('input[name="contact"]:checked').value === 'yes';
    }

    // Create emergency object
    const emergency = {
        id: Date.now(),
        type: currentEmergencyType,
        severity: severity,
        affectedPeople: affectedPeople,
        description: description,
        address: address,
        landmark: landmark,
        location: userLocation || { lat: -15.3875, lng: 28.3228 },
        reporter: {
            name: name,
            phone: phone,
            canContact: canContact
        },
        status: 'reported',
        timestamp: new Date(),
        responder: null,
        images: [...uploadedImages] // Store uploaded images
    };

    // Persist to Firestore via service (also triggers realtime sync)
    try {
        if (window.isFirebaseReady && window.isFirebaseReady()) {
            const location = {
                latitude: emergency.location.lat,
                longitude: emergency.location.lng,
                address: emergency.address,
            };
            if (emergency.landmark && emergency.landmark.trim()) {
                location.landmark = emergency.landmark.trim();
            }
            await window.EmergencyService.reportEmergency({
                type: emergency.type,
                severity: emergency.severity,
                affectedPeople: emergency.affectedPeople,
                description: emergency.description,
                location,
                reporter: emergency.reporter,
                images: emergency.images,
                status: emergency.status,
            });
        } else {
            // Fallback to local in-memory for offline
            emergencyDB.emergencies.push(emergency);
        }
    } catch (e) {
        console.error('Failed to save emergency:', e);
        emergencyDB.emergencies.push(emergency);
    }

    showNotification('Emergency reported successfully! Help is on the way.', 'success');

    // Refresh analytics if responder is logged in
    if (currentUser && currentUser.type === 'responder') {
        loadAnalyticsData();
    }

    // Reset form
    setTimeout(() => {
        // Reset form fields
        document.querySelectorAll('input[name="emergency-type"]').forEach(input => input.checked = false);
        document.getElementById('affected-people').value = '';
        document.getElementById('emergency-severity').value = '';
        document.getElementById('emergency-description').value = '';
        document.getElementById('emergency-address').value = '';
        document.getElementById('emergency-landmark').value = '';
        imagePreviewContainer.innerHTML = '';
        uploadedImages = [];

        if (currentUser.type !== 'guest') {
            document.getElementById('reporter-name').value = '';
            document.getElementById('reporter-contact-phone').value = '';
        }

        // Reset to first step
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep = 1;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateStepUI();

        currentEmergencyType = null;

        showNotification('Emergency responders have been notified', 'info');
    }, 2000);
});

// Refresh location button
document.getElementById('refresh-location').addEventListener('click', function () {
    initMap();
});

// Refresh centers button
document.getElementById('refresh-centers').addEventListener('click', function () {
    loadRescueCenters();
});

// Initialize map
function initMap() {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([-15.3875, 28.3228], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Try to get user's actual location
    if (navigator.geolocation) {
        document.getElementById('location-status').textContent = 'Detecting your location...';

        navigator.geolocation.getCurrentPosition(
            function (position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setView([userLocation.lat, userLocation.lng], 15);

                // Add a marker for the user's location
                if (userMarker) {
                    map.removeLayer(userMarker);
                }

                userMarker = L.marker([userLocation.lat, userLocation.lng]).addTo(map)
                    .bindPopup('Your location')
                    .openPopup();

                // Add circle to show accuracy
                L.circle([userLocation.lat, userLocation.lng], {
                    color: 'blue',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    radius: position.coords.accuracy / 2
                }).addTo(map);

                document.getElementById('location-status').textContent = 'Location detected';

                // Update rescue centers based on location
                if (currentStep === 4) {
                    loadRescueCenters();
                }

                // Send updated location to server
                if (currentUser && isConnected) {
                    sendUserInfo();
                }
            },
            function (error) {
                console.error('Geolocation error:', error);
                // Use default location (Lusaka) if geolocation fails
                userLocation = { lat: -15.3875, lng: 28.3228 };

                // Add a marker for the default location
                userMarker = L.marker([userLocation.lat, userLocation.lng]).addTo(map)
                    .bindPopup('Your approximate location')
                    .openPopup();

                document.getElementById('location-status').textContent = 'Using approximate location';

                // Update rescue centers based on default location
                if (currentStep === 4) {
                    loadRescueCenters();
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        // Geolocation not supported
        userLocation = { lat: -15.3875, lng: 28.3228 };

        // Add a marker for the default location
        userMarker = L.marker([userLocation.lat, userLocation.lng]).addTo(map)
            .bindPopup('Your approximate location')
            .openPopup();

        document.getElementById('location-status').textContent = 'Geolocation not supported';

        // Update rescue centers based on default location
        if (currentStep === 4) {
            loadRescueCenters();
        }
    }

    // Add markers for nearby rescue centers
    emergencyDB.rescueCenters.forEach(center => {
        let iconColor;
        switch (center.type) {
            case 'hospital': iconColor = 'red'; break;
            case 'police': iconColor = 'blue'; break;
            case 'fire': iconColor = 'orange'; break;
            default: iconColor = 'gray';
        }

        const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color: ${iconColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        L.marker([center.location.lat, center.location.lng], { icon: icon })
            .addTo(map)
            .bindPopup(center.name);
    });
}

// Load rescue centers with proximity calculation
function loadRescueCenters() {
    rescueCentersList.innerHTML = '';
    recommendedCenter = null;
    recommendedCenterSection.classList.add('hidden');

    if (!userLocation) {
        rescueCentersList.innerHTML = '<div class="text-center py-4 text-gray-500">Location not available. Please enable location services.</div>';
        return;
    }

    // Calculate distances and filter by emergency type if selected
    const centersWithDistances = emergencyDB.rescueCenters
        .map(center => {
            const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                center.location.lat, center.location.lng
            );

            return {
                ...center,
                distance: distance,
                isRelevant: !currentEmergencyType || center.emergencyTypes.includes(currentEmergencyType)
            };
        })
        .sort((a, b) => a.distance - b.distance);

    // Find the recommended center (closest relevant center)
    const relevantCenters = centersWithDistances.filter(center => center.isRelevant);
    if (relevantCenters.length > 0) {
        recommendedCenter = relevantCenters[0];
        displayRecommendedCenter(recommendedCenter);
    }

    // Display all centers
    if (centersWithDistances.length === 0) {
        rescueCentersList.innerHTML = '<div class="text-center py-4 text-gray-500">No rescue centers found in your area.</div>';
        return;
    }

    centersWithDistances.forEach(center => {
        const card = document.createElement('div');
        card.className = 'rescue-center-card';

        let resourcesHtml = '';
        if (center.type === 'hospital') {
            resourcesHtml = `
                <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                    <i class="fas fa-bed mr-1"></i> ${center.resources.bedsAvailable} beds available
                </div>
                <div class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    <i class="fas fa-user-md mr-1"></i> ${center.resources.doctorsOnDuty} doctors on duty
                </div>
            `;
        } else if (center.type === 'police') {
            resourcesHtml = `
                <div class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                    <i class="fas fa-shield-alt mr-1"></i> ${center.resources.officersAvailable} officers available
                </div>
                <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    <i class="fas fa-car mr-1"></i> ${center.resources.vehiclesAvailable} patrol vehicles
                </div>
            `;
        } else if (center.type === 'fire') {
            resourcesHtml = `
                <div class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-2">
                    <i class="fas fa-fire-extinguisher mr-1"></i> ${center.resources.trucksAvailable} trucks available
                </div>
                <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    <i class="fas fa-users mr-1"></i> ${center.resources.firefightersOnDuty} firefighters on duty
                </div>
            `;
        }

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg">${center.name}</h3>
                    <p class="text-gray-600">${center.distance.toFixed(1)} km away • Open 24 hours</p>
                    <div class="flex items-center mt-2">
                        ${resourcesHtml}
                    </div>
                    ${!center.isRelevant && currentEmergencyType ?
                `<div class="mt-2 text-xs text-orange-600">
                            <i class="fas fa-info-circle mr-1"></i> May not handle ${currentEmergencyType} emergencies
                        </div>` : ''
        }
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold text-red-600">${center.phone}</div>
                    <button class="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm call-center" data-phone="${center.phone}">
                        <i class="fas fa-phone mr-1"></i> Call Now
                    </button>
                </div>
            </div>
        `;

        rescueCentersList.appendChild(card);
    });

    // Set up the call buttons
    setTimeout(setupCallButtons, 100);
}

// Display recommended center
function displayRecommendedCenter(center) {
    recommendedCenterSection.classList.remove('hidden');
    recommendedName.textContent = center.name;
    recommendedDistance.textContent = `${center.distance.toFixed(1)} km away • Open 24 hours`;
    recommendedPhone.textContent = center.phone;

    let resourcesHtml = '';
    if (center.type === 'hospital') {
        resourcesHtml = `
            <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                <i class="fas fa-bed mr-1"></i> ${center.resources.bedsAvailable} beds available
            </div>
            <div class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                <i class="fas fa-user-md mr-1"></i> ${center.resources.doctorsOnDuty} doctors on duty
            </div>
        `;
    } else if (center.type === 'police') {
        resourcesHtml = `
            <div class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                <i class="fas fa-shield-alt mr-1"></i> ${center.resources.officersAvailable} officers available
            </div>
            <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                <i class="fas fa-car mr-1"></i> ${center.resources.vehiclesAvailable} patrol vehicles
            </div>
        `;
    } else if (center.type === 'fire') {
        resourcesHtml = `
            <div class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-2">
                <i class="fas fa-fire-extinguisher mr-1"></i> ${center.resources.trucksAvailable} trucks available
            </div>
            <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                <i class="fas fa-users mr-1"></i> ${center.resources.firefightersOnDuty} firefighters on duty
            </div>
        `;
    }

    recommendedResources.innerHTML = resourcesHtml;

    // Set up the call button for the recommended center
    setTimeout(() => {
        const recommendedCallBtn = document.querySelector('#recommended-center .call-center');
        if (recommendedCallBtn) {
            recommendedCallBtn.addEventListener('click', function () {
                const phoneNumber = center.phone;
                initiatePhoneCall(phoneNumber);
            });
        }
    }, 100);
}

// Load emergencies for responders
function loadEmergencies() {
    emergenciesList.innerHTML = '';

    const activeEmergencies = emergencyDB.emergencies.filter(e => e.status === 'reported' || e.status === 'dispatched');
    const respondedEmergencies = emergencyDB.emergencies.filter(e => e.status === 'responded');
    const resolvedEmergencies = emergencyDB.emergencies.filter(e => e.status === 'resolved');

    activeEmergenciesEl.textContent = activeEmergencies.length;
    respondedEmergenciesEl.textContent = respondedEmergencies.length;
    resolvedEmergenciesEl.textContent = resolvedEmergencies.length;

    if (activeEmergencies.length === 0) {
        emergenciesList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>No active emergencies at this time</p>
            </div>
        `;
        return;
    }

    // Sort by timestamp (newest first)
    activeEmergencies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    activeEmergencies.forEach(emergency => {
        let severityClass = 'moderate';
        if (emergency.severity.includes('Critical')) severityClass = 'critical';
        if (emergency.severity.includes('Serious')) severityClass = 'serious';

        const item = document.createElement('div');
        item.className = `emergency-item ${severityClass} p-4 bg-white rounded-lg shadow`;
        item.setAttribute('data-id', emergency.id);

        // Add new emergency indicator
        if (emergency.timestamp > Date.now() - 60000) { // Within the last minute
            item.classList.add('new-emergency-indicator');
        }

        // Create image HTML if there are uploaded images
        let imagesHtml = '';
        if (emergency.images && emergency.images.length > 0) {
            imagesHtml = `
                <div class="mt-3">
                    <p class="text-sm font-medium mb-2">Uploaded Images:</p>
                    <div class="flex space-x-2 overflow-x-auto pb-2">
                        ${emergency.images.map(img => `
                            <img src="${img}" alt="Emergency image" class="emergency-image w-32 h-24 object-cover rounded cursor-pointer" onclick="openImageModal('${img}')">
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Add dispatch info if available
        let dispatchInfo = '';
        if (emergency.status === 'dispatched') {
            dispatchInfo = `
                <div class="mt-2 bg-yellow-100 text-yellow-800 p-2 rounded text-sm">
                    <i class="fas fa-ambulance mr-1"></i> Unit ${emergency.dispatchedUnit} dispatched at ${formatTime(emergency.dispatchTime)}
                    ${emergency.dispatchNotes ? `<br>Notes: ${emergency.dispatchNotes}` : ''}
                </div>
            `;
        }

        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-lg">${emergency.type.toUpperCase()} Emergency</h4>
                    <p class="text-gray-600">${emergency.description}</p>
                    <div class="flex items-center mt-2">
                        <span class="priority-badge bg-${severityClass === 'critical' ? 'red' : severityClass === 'serious' ? 'yellow' : 'blue'}-100 text-${severityClass === 'critical' ? 'red' : severityClass === 'serious' ? 'yellow' : 'blue'}-800 mr-2">
                            ${emergency.severity}
                        </span>
                        <span class="text-sm text-gray-500">${formatTime(emergency.timestamp)}</span>
                        ${emergency.timestamp > Date.now() - 60000 ? '<span class="real-time-badge">NEW</span>' : ''}
                    </div>
                    <p class="text-sm mt-2"><i class="fas fa-map-marker-alt mr-1"></i> ${emergency.address} ${emergency.landmark ? `(${emergency.landmark})` : ''}</p>
                    <p class="text-sm mt-1"><i class="fas fa-user mr-1"></i> Reported by: ${emergency.reporter.name}</p>
                    ${emergency.reporter.canContact ? `
                        <p class="text-sm mt-1"><i class="fas fa-phone mr-1"></i> Contact: ${emergency.reporter.phone}</p>
                    ` : ''}
                    ${dispatchInfo}
                    ${imagesHtml}
                </div>
                <div class="flex space-x-2">
                    ${emergency.reporter.canContact ? `
                        <button class="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg call-reporter" data-phone="${emergency.reporter.phone}" data-name="${emergency.reporter.name}">
                            <i class="fas fa-phone"></i>
                        </button>
                    ` : ''}
                    <button class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg respond-btn" data-id="${emergency.id}">
                        <i class="fas fa-first-aid"></i>
                    </button>
                </div>
            </div>
        `;

        emergenciesList.appendChild(item);

        // Add click event to select emergency
        item.addEventListener('click', function (e) {
            // Don't trigger selection if clicking on buttons or images
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') return;

            // Remove selection from all items
            document.querySelectorAll('.emergency-item').forEach(el => {
                el.classList.remove('selected');
            });

            // Add selection to clicked item
            this.classList.add('selected');
        });
    });

    // Set up the call buttons
    setTimeout(setupCallButtons, 100);

    // Add event listeners for respond buttons
    document.querySelectorAll('.respond-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent triggering the item click event
            const emergencyId = parseInt(this.getAttribute('data-id'));
            respondToEmergency(emergencyId);
        });
    });
}

// Open image in modal
function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="close-modal">
                <i class="fas fa-times"></i>
            </div>
            <img src="${imageSrc}" alt="Emergency image" class="w-full h-auto">
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.remove('hidden');

    // Close modal when clicking close button or outside
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function () {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Respond to emergency
function respondToEmergency(emergencyId) {
    const emergencyIndex = emergencyDB.emergencies.findIndex(e => e.id === emergencyId);
    if (emergencyIndex !== -1) {
        emergencyDB.emergencies[emergencyIndex].status = 'responded';
        emergencyDB.emergencies[emergencyIndex].responder = currentUser.name;

        // Send update to server
        updateEmergencyStatus(emergencyId, 'responded', currentUser.name);

        showNotification(`You are now responding to emergency #${emergencyId}`, 'success');
        loadEmergencies();

        // Refresh analytics
        loadAnalyticsData();

        // Simulate response process
        setTimeout(() => {
            emergencyDB.emergencies[emergencyIndex].status = 'resolved';

            // Send update to server
            updateEmergencyStatus(emergencyId, 'resolved', currentUser.name);

            showNotification(`Emergency #${emergencyId} has been resolved`, 'info');
            loadEmergencies();
            // Refresh analytics after resolution
            loadAnalyticsData();
        }, 10000);
    }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Format time
function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to initiate phone call
function initiatePhoneCall(phoneNumber) {
    // Clean the phone number (remove any non-digit characters except +)
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    currentCallNumber = cleanedNumber;

    // For mobile devices, this will trigger the phone dialer
    // For desktop, it won't do anything, so we'll show a message
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Mobile device - directly initiate the call
        window.location.href = `tel:${cleanedNumber}`;
    } else {
        // Desktop device - show the number and instructions
        document.getElementById('calling-details').innerHTML = `
            <p class="text-gray-600">Call: ${phoneNumber}</p>
            <p class="text-sm text-gray-500 mt-2">On a mobile device, this would automatically dial the number.</p>
        `;
        document.getElementById('calling-modal').classList.remove('hidden');
    }
}

// Set up call buttons
function setupCallButtons() {
    // Add event listeners to all call buttons for rescue centers
    document.querySelectorAll('.call-center').forEach(btn => {
        btn.addEventListener('click', function () {
            const phoneNumber = this.getAttribute('data-phone');
            initiatePhoneCall(phoneNumber);
        });
    });

    // Add event listeners to call reporter buttons for responders
    document.querySelectorAll('.call-reporter').forEach(btn => {
        btn.addEventListener('click', function () {
            const phoneNumber = this.getAttribute('data-phone');
            const name = this.getAttribute('data-name');
            document.getElementById('calling-details').innerHTML = `<p class="text-gray-600">Calling: ${name} (${phoneNumber})</p>`;
            initiatePhoneCall(phoneNumber);
        });
    });

    // Add event listener to emergency call button
    document.querySelector('.floating-action').addEventListener('click', function () {
        document.getElementById('calling-details').innerHTML = `<p class="text-gray-600">Connecting to emergency services</p>`;
        initiatePhoneCall('991');
    });
}

// Confirm call button
document.getElementById('confirm-call').addEventListener('click', function () {
    if (currentCallNumber) {
        window.location.href = `tel:${currentCallNumber}`;
    }
    document.getElementById('calling-modal').classList.add('hidden');
});

// Cancel call button
document.getElementById('cancel-call').addEventListener('click', function () {
    document.getElementById('calling-modal').classList.add('hidden');
    showNotification('Emergency call cancelled', 'info');
});

// Notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    let bgColor = 'bg-blue-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'info') bgColor = 'bg-blue-500';

    notification.className = `notification ${bgColor}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Simulate live status updates
setInterval(() => {
    const statuses = ['Ready to help', 'Monitoring', 'Processing', 'Standing by'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    document.getElementById('status').textContent = randomStatus;
}, 8000);
