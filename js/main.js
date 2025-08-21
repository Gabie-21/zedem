// /js/main.js

// ---- Firebase SDK imports (kept; aliased to avoid collisions) ----
import {
  initializeApp as fbInitializeApp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  getAuth
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  getAnalytics
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// ---- Config (adjust path if needed) ----
import { firebaseConfig } from './firebase-config.js';

// ---- Initialize Firebase (optional for now) ----
const fbApp = fbInitializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const analytics = getAnalytics(fbApp);

// ---- Global state ----
let currentLocation = null;
let activeEmergency = null;
let map = null;
let responders = [];
let currentUser = null;
let isOnline = navigator.onLine;

// ---- Simulated Firebase functions ----
const FirebaseAPI = {
  async initializeAuth() {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentUser = { uid: 'demo-user-' + Date.now(), isAnonymous: true };
        console.log('Demo user authenticated:', currentUser.uid);
        resolve(currentUser);
      }, 300);
    });
  },
  async createEmergency(emergencyData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const emergency = {
          ...emergencyData,
          id: 'EMR' + Date.now(),
          userId: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          responders: [],
          messages: []
        };
        console.log('Emergency created:', emergency);
        resolve(emergency);
      }, 200);
    });
  },
  async listenToNearbyResponders(location, radiusKm, callback) {
    setTimeout(() => {
      const mockResponders = [
        {
          id: 'resp1',
          name: 'Dr. Sarah Mwamba',
          type: 'Medical',
          location: { lat: location.lat + 0.01, lng: location.lng + 0.01 },
          distance: 0.8, eta: 3, status: 'available',
          phone: '+260977123456', specialization: 'Emergency Medicine'
        },
        {
          id: 'resp2',
          name: 'James Banda',
          type: 'First Aid',
          location: { lat: location.lat - 0.01, lng: location.lng + 0.01 },
          distance: 1.2, eta: 5, status: 'available',
          phone: '+260966789012', specialization: 'Community First Aid'
        },
        {
          id: 'resp3',
          name: 'Fire Station Central',
          type: 'Fire',
          location: { lat: location.lat + 0.02, lng: location.lng - 0.01 },
          distance: 2.1, eta: 8, status: 'available',
          phone: '+260955123789', specialization: 'Fire & Rescue'
        }
      ];
      callback(mockResponders);
    }, 800);
  },
  async updateEmergencyStatus(emergencyId, status, additionalData = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Emergency status updated:', { emergencyId, status, ...additionalData });
        resolve({ success: true });
      }, 150);
    });
  },
  async addEmergencyMessage(emergencyId, message, senderType = 'user') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const messageData = {
          id: 'msg' + Date.now(),
          emergencyId,
          senderId: currentUser.uid,
          senderType,
          message,
          timestamp: new Date(),
          read: false
        };
        console.log('Message sent:', messageData);
        resolve(messageData);
      }, 120);
    });
  }
};

// ---- Boot app (renamed from initializeApp to avoid collision) ----
async function bootApp() {
  updateStatus('Connecting...');
  try {
    await FirebaseAPI.initializeAuth();
    updateStatus('Connected');
    document.getElementById('connection-indicator').className = 'w-3 h-3 bg-green-400 rounded-full';
    setupRealTimeListeners();
  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus('Offline Mode');
    document.getElementById('connection-indicator').className = 'w-3 h-3 bg-yellow-400 rounded-full';
  }
}

function setupRealTimeListeners() {
  if (activeEmergency && activeEmergency.id) {
    listenToEmergencyUpdates(activeEmergency.id);
  }
}

function setupEventListeners() {
  document.querySelectorAll('.emergency-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const type = this.dataset.type;
      const priority = this.dataset.priority;
      showEmergencyModal(type, priority);
    });
  });

  document.getElementById('confirm-emergency').addEventListener('click', confirmEmergency);
  document.getElementById('cancel-modal').addEventListener('click', hideEmergencyModal);
  document.getElementById('cancel-emergency').addEventListener('click', cancelEmergency);

  document.getElementById('refresh-location').addEventListener('click', requestLocation);

  document.getElementById('call-emergency').addEventListener('click', function () {
    if (activeEmergency) {
      alert('Emergency Services: 911\nPolice: 999\nFire: 993');
    } else {
      alert('Emergency Services:\n🚑 Medical: 911\n👮 Police: 999\n🔥 Fire: 993');
    }
  });

  document.getElementById('find-help').addEventListener('click', showNearbyHelp);
}

function setupNetworkMonitoring() {
  window.addEventListener('online', function () {
    isOnline = true;
    updateStatus('Connected');
    document.getElementById('connection-indicator').className = 'w-3 h-3 bg-green-400 rounded-full';
    syncPendingData();
  });

  window.addEventListener('offline', function () {
    isOnline = false;
    updateStatus('Offline');
    document.getElementById('connection-indicator').className = 'w-3 h-3 bg-red-400 rounded-full';
  });
}

// ---- Emergency flow ----
async function confirmEmergency() {
  const modal = document.getElementById('emergency-modal');
  const type = modal.dataset.type;
  const priority = modal.dataset.priority;

  if (!currentLocation) {
    alert('Location is required for emergency reporting. Please enable location services.');
    return;
  }

  updateStatus('Creating emergency...');
  try {
    const emergencyData = {
      type, priority,
      location: currentLocation,
      timestamp: new Date(),
      description: '', mediaUrls: [],
      contactPhone: '', status: 'active'
    };
    activeEmergency = await FirebaseAPI.createEmergency(emergencyData);
    hideEmergencyModal();
    showActiveEmergency();
    await dispatchToResponders();
    updateStatus('Emergency active');
    sendEmergencyNotifications();
  } catch (error) {
    console.error('Error confirming emergency:', error);
    alert('Failed to create emergency. Please try again.');
    updateStatus('Error occurred');
  }
}

async function dispatchToResponders() {
  if (!currentLocation || !activeEmergency) return;
  updateStatus('Finding responders...');
  try {
    await FirebaseAPI.listenToNearbyResponders(currentLocation, 10, (resp) => {
      updateResponderDisplay(resp);
      resp.slice(0, 3).forEach((r, i) => {
        setTimeout(() => simulateResponderResponse(r), (i + 1) * 2000);
      });
    });
    updateStatus('Responders notified');
  } catch (error) {
    console.error('Error dispatching to responders:', error);
    updateStatus('Dispatch error');
  }
}

function updateResponderDisplay(respondersData) {
  responders = respondersData;
  const section = document.getElementById('responder-section');
  const list = document.getElementById('responder-list');

  if (responders.length === 0) {
    list.innerHTML = '<div class="text-center text-gray-500 py-4">No responders available nearby</div>';
    section.classList.remove('hidden');
    return;
  }

  let relevantResponders = responders.filter(r => {
    if (activeEmergency.type === 'medical') return r.type === 'Medical' || r.type === 'First Aid';
    if (activeEmergency.type === 'fire') return r.type === 'Fire' || r.type === 'First Aid';
    if (activeEmergency.type === 'police') return r.type === 'Police';
    return true;
  });

  list.innerHTML = relevantResponders.map(r => `
    <div class="responder-card flex justify-between items-center p-3 bg-white rounded border" data-responder-id="${r.id}">
      <div>
        <div class="font-semibold">${r.name}</div>
        <div class="text-sm text-gray-600">${r.specialization || r.type}</div>
        <div class="text-xs text-gray-500">${r.distance.toFixed(1)}km away</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-medium text-blue-600">ETA: ${r.eta} min</div>
        <div class="text-xs responder-status text-gray-500">Notifying...</div>
      </div>
    </div>
  `).join('');

  section.classList.remove('hidden');
}

function simulateResponderResponse(responder) {
  const card = document.querySelector(`[data-responder-id="${responder.id}"]`);
  if (!card) return;
  const statusEl = card.querySelector('.responder-status');

  const responses = ['Accepted', 'En route', 'Declined', 'No response'];
  const weights = [0.7, 0.0, 0.2, 0.1];
  const rnd = Math.random();
  let response;
  if (rnd < weights[0]) response = 'Accepted';
  else if (rnd < weights[0] + weights[1]) response = 'En route';
  else if (rnd < weights[0] + weights[1] + weights[2]) response = 'Declined';
  else response = 'No response';

  if (response === 'Accepted') {
    statusEl.innerHTML = '<span class="text-green-600 font-semibold">✓ Accepted</span>';
    card.classList.add('ring-2', 'ring-green-300');
    setTimeout(() => { statusEl.innerHTML = '<span class="text-blue-600 font-semibold">🚗 En route</span>'; }, 1000);
    setTimeout(() => {
      statusEl.innerHTML = '<span class="text-purple-600 font-semibold">📍 Arrived</span>';
      updateStatus('Responder arrived');
    }, responder.eta * 60 * 1000);
  } else if (response === 'Declined') {
    statusEl.innerHTML = '<span class="text-red-600">✗ Declined</span>';
    card.classList.add('opacity-50');
  } else {
    statusEl.innerHTML = '<span class="text-gray-400">No response</span>';
    card.classList.add('opacity-30');
  }
}

async function sendEmergencyNotifications() {
  if (!activeEmergency) return;
  try {
    console.log('Sending notifications for emergency:', activeEmergency.id);
    const emergencyContacts = ['+260977123456', '+260966789012'];
    console.log('SMS sent to emergency contacts:', emergencyContacts);
    console.log('Official services notified:', {
      type: activeEmergency.type, location: activeEmergency.location, priority: activeEmergency.priority
    });
    await FirebaseAPI.addEmergencyMessage(
      activeEmergency.id,
      `Emergency reported: ${activeEmergency.type} at ${new Date().toLocaleTimeString()}`,
      'system'
    );
  } catch (error) { console.error('Error sending notifications:', error); }
}

function showActiveEmergency() {
  const container = document.getElementById('active-emergency');
  const details = document.getElementById('emergency-details');
  const emergencyTypes = {
    medical: '🏥 Medical Emergency', fire: '🔥 Fire Emergency',
    police: '👮 Police Required', general: '⚠️ General Emergency'
  };

  details.innerHTML = `
    <div class="space-y-2">
      <div><strong>Type:</strong> ${emergencyTypes[activeEmergency.type]}</div>
      <div><strong>Priority:</strong> <span class="text-red-600 font-bold">${activeEmergency.priority}</span></div>
      <div><strong>ID:</strong> <code class="text-xs bg-gray-100 px-1 rounded">${activeEmergency.id}</code></div>
      <div><strong>Time:</strong> ${activeEmergency.timestamp.toLocaleTimeString()}</div>
      <div><strong>Status:</strong> <span class="text-red-600 font-semibold">🔴 ACTIVE</span></div>
      <div id="responder-count" class="text-sm text-gray-600">Searching for responders...</div>
    </div>

    <div class="mt-4 p-3 bg-gray-50 rounded">
      <h4 class="font-semibold text-sm mb-2">💬 Emergency Chat</h4>
      <div id="chat-messages" class="space-y-1 max-h-32 overflow-y-auto text-sm">
        <div class="text-gray-500">Emergency created. Help is on the way...</div>
      </div>
      <div class="flex mt-2">
        <input type="text" id="chat-input" placeholder="Send message..."
          class="flex-1 text-xs p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500">
        <button id="send-message" class="bg-blue-600 text-white px-3 py-2 rounded-r text-xs">Send</button>
      </div>
    </div>
  `;

  container.classList.remove('hidden');
  showMapWithLocation();
  setupEmergencyChat();
}

function setupEmergencyChat() {
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-message');
  const chatMessages = document.getElementById('chat-messages');

  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    const me = document.createElement('div');
    me.className = 'text-blue-600 text-right';
    me.innerHTML = `<strong>You:</strong> ${message}`;
    chatMessages.appendChild(me);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    FirebaseAPI.addEmergencyMessage(activeEmergency.id, message, 'user');
    setTimeout(() => {
      const reply = document.createElement('div');
      reply.className = 'text-green-600';
      reply.innerHTML = `<strong>Responder:</strong> Message received. On my way!`;
      chatMessages.appendChild(reply);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
  }

  sendButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
}

async function cancelEmergency() {
  if (!activeEmergency) return;
  try {
    await FirebaseAPI.updateEmergencyStatus(activeEmergency.id, 'cancelled');
    activeEmergency = null;
    document.getElementById('active-emergency').classList.add('hidden');
    document.getElementById('responder-section').classList.add('hidden');
    document.getElementById('map-container').classList.add('hidden');
    updateStatus('Emergency cancelled');
    if (map) { map.remove(); map = null; }
  } catch (error) {
    console.error('Error cancelling emergency:', error);
    alert('Failed to cancel emergency. Please try again.');
  }
}

function showMapWithLocation() {
  if (!currentLocation) return;
  const mapContainer = document.getElementById('map-container');
  mapContainer.classList.remove('hidden');

  if (map) map.remove();
  map = L.map('map');
  map.setView([currentLocation.lat, currentLocation.lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  L.marker([currentLocation.lat, currentLocation.lng])
    .addTo(map)
    .bindPopup(`🚨 Emergency Location<br>ID: ${activeEmergency ? activeEmergency.id : 'Unknown'}`)
    .openPopup();

  if (currentLocation.accuracy) {
    L.circle([currentLocation.lat, currentLocation.lng], {
      radius: currentLocation.accuracy,
      color: 'red', fillColor: '#ff0000', fillOpacity: 0.1
    }).addTo(map);
  }

  // Ensure Leaflet sizes correctly after un-hiding
  setTimeout(() => { map.invalidateSize(); }, 0);

  if (responders.length > 0) {
    responders.forEach(r => {
      if (r.location) {
        L.marker([r.location.lat, r.location.lng])
          .addTo(map)
          .bindPopup(`👨‍⚕️ ${r.name}<br>${r.specialization || r.type}<br>ETA: ${r.eta} min`);
        L.polyline([
          [r.location.lat, r.location.lng],
          [currentLocation.lat, currentLocation.lng]
        ], { color: 'blue', weight: 2, opacity: 0.7 }).addTo(map);
      }
    });
  }
}

// ---- Location handling ----
function requestLocation() {
  updateLocationStatus('Getting your location...');
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isLocalhost && !window.isSecureContext) {
    updateLocationStatus('Location requires HTTPS or localhost. Please run on https:// or via VS Code Live Server.');
    return;
  }

  if (!navigator.geolocation) {
    updateLocationStatus('Location not supported');
    useDefaultLusaka();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date()
      };
      const acc = currentLocation.accuracy;
      const accuracyText = acc < 100 ? `Located (±${Math.round(acc)}m)` :
        `Located (±${Math.round((acc / 1000) * 10) / 10}km)`;
      updateLocationStatus(accuracyText);
      if (activeEmergency) updateEmergencyLocation();
    },
    error => {
      console.error('Location error:', error);
      handleLocationError(error);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
  );
}

function useDefaultLusaka() {
  currentLocation = {
    lat: -15.3875, lng: 28.3228, accuracy: 10000, timestamp: new Date(), isDefault: true
  };
  updateLocationStatus('Using default location (Lusaka)');
}

function handleLocationError(error) {
  let msg = 'Location unavailable';
  if (error.code === error.PERMISSION_DENIED) msg = 'Location access denied. Please enable location services.';
  else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information unavailable.';
  else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
  updateLocationStatus(msg);
  useDefaultLusaka();
  setTimeout(() => updateLocationStatus('Using default location (Lusaka)'), 3000);
}

async function updateEmergencyLocation() {
  if (!activeEmergency || !currentLocation) return;
  try {
    await FirebaseAPI.updateEmergencyStatus(activeEmergency.id, 'active', {
      location: currentLocation, locationUpdatedAt: new Date()
    });
    console.log('Emergency location updated');
  } catch (error) { console.error('Error updating emergency location:', error); }
}

function showNearbyHelp() {
  if (!currentLocation) {
    alert('Location is required to show nearby help. Please enable location services.');
    return;
  }
  showMapWithNearbyServices();
}

function showMapWithNearbyServices() {
  const mapContainer = document.getElementById('map-container');
  mapContainer.classList.remove('hidden');
  if (map) map.remove();

  map = L.map('map').setView([currentLocation.lat, currentLocation.lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  L.marker([currentLocation.lat, currentLocation.lng]).addTo(map).bindPopup('📍 Your Location').openPopup();

  const nearbyServices = [
    { name: 'University Teaching Hospital', type: 'hospital', lat: -15.3955, lng: 28.3200, phone: '+260211256067', icon: '🏥' },
    { name: 'Lusaka Central Police', type: 'police', lat: -15.4167, lng: 28.2833, phone: '+260211228794', icon: '👮' },
    { name: 'Lusaka Fire Station', type: 'fire', lat: -15.4100, lng: 28.2900, phone: '+260211228844', icon: '🔥' },
    { name: 'Levy Mwanawasa Hospital', type: 'hospital', lat: -15.3700, lng: 28.3500, phone: '+260211256700', icon: '🏥' }
  ];

  nearbyServices.forEach(s => {
    L.marker([s.lat, s.lng]).addTo(map).bindPopup(`
      ${s.icon} <strong>${s.name}</strong><br>
      Type: ${s.type}<br>
      Phone: ${s.phone}
    `);
  });

  const group = new L.featureGroup([
    L.marker([currentLocation.lat, currentLocation.lng]),
    ...nearbyServices.map(s => L.marker([s.lat, s.lng]))
  ]);
  map.fitBounds(group.getBounds().pad(0.1));
  setTimeout(() => map.invalidateSize(), 0);
}

function syncPendingData() {
  console.log('Syncing pending data...');
  if (activeEmergency && !activeEmergency.synced) {
    FirebaseAPI.createEmergency(activeEmergency)
      .then(() => {
        activeEmergency.synced = true;
        console.log('Emergency synced successfully');
      })
      .catch(err => console.error('Failed to sync emergency:', err));
  }
}

function listenToEmergencyUpdates(emergencyId) {
  console.log('Listening for emergency updates:', emergencyId);
  const interval = setInterval(() => {
    if (!activeEmergency || activeEmergency.id !== emergencyId) {
      clearInterval(interval); return;
    }
    const statuses = ['Dispatching', 'Responder assigned', 'Responder en route', 'Help arrived'];
    const i = statuses.findIndex(s => s === activeEmergency.status);
    if (i < statuses.length - 1) {
      const next = statuses[i + 1];
      activeEmergency.status = next;
      updateStatus(next);
    }
  }, 30000);
}

// ---- UI helpers ----
function updateLocationStatus(text) {
  document.getElementById('location-text').textContent = text;
}
function updateStatus(text) {
  document.getElementById('status').textContent = text;
}
function showEmergencyModal(type, priority) {
  const modal = document.getElementById('emergency-modal');
  const content = document.getElementById('modal-content');

  const emergencyTypes = {
    medical: { emoji: '🏥', name: 'Medical Emergency', desc: 'Medical assistance needed immediately' },
    fire:    { emoji: '🔥', name: 'Fire Emergency',    desc: 'Fire or dangerous situation requiring immediate response' },
    police:  { emoji: '👮', name: 'Police Required',   desc: 'Security incident or crime in progress' },
    general: { emoji: '⚠️', name: 'General Emergency', desc: 'Other emergency requiring assistance' }
  };
  const priorityInfo = {
    P1: { name: 'CRITICAL', color: 'text-red-600',    desc: 'Life-threatening emergency' },
    P2: { name: 'URGENT',   color: 'text-orange-600', desc: 'Urgent response needed' },
    P3: { name: 'IMPORTANT',color: 'text-yellow-600', desc: 'Important but not critical' }
  };

  const pr = priorityInfo[priority] || priorityInfo.P3;
  const e = emergencyTypes[type];

  content.innerHTML = `
    <div class="text-center">
      <div class="text-6xl mb-3">${e.emoji}</div>
      <h3 class="text-lg font-semibold mb-2">${e.name}</h3>
      <div class="mb-3">
        <span class="px-2 py-1 rounded text-sm font-bold ${pr.color} bg-gray-100">${pr.name}</span>
      </div>
      <p class="text-gray-600 mb-4">${e.desc}</p>
      <div class="bg-gray-100 p-3 rounded text-sm text-left">
        <strong>Location Status:</strong><br>
        ${currentLocation ? `✅ Located (±${Math.round(currentLocation.accuracy)}m accuracy)` : '❌ Location not available'}<br><br>
        <strong>What happens next:</strong><br>
        • Nearby responders will be notified<br>
        • Emergency services will be contacted<br>
        • You'll receive real-time updates<br>
        • Help typically arrives within 5-15 minutes
      </div>
    </div>
  `;
  modal.dataset.type = type;
  modal.dataset.priority = priority;
  modal.classList.remove('hidden');
}
function hideEmergencyModal() {
  document.getElementById('emergency-modal').classList.add('hidden');
}

// ---- Notifications ----
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') console.log('Notification permission granted');
    return permission === 'granted';
  }
  return false;
}

// ---- Entry point ----
document.addEventListener('DOMContentLoaded', async () => {
  await bootApp();
  setupEventListeners();
  setupNetworkMonitoring();
  requestLocation();
  requestNotificationPermission();
});
