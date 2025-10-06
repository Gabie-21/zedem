// Data Sync Controller: keeps UI state in sync with Firestore

const DataSyncController = (function () {
  let unsubEmergencies = null;
  let unsubRescueCenters = null;

  function mapEmergencyDoc(doc) {
    const data = doc.data();
    // Normalize location shape to { lat, lng }
    let loc = { lat: -15.3875, lng: 28.3228 };
    if (data.location) {
      if (typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
        loc = { lat: data.location.lat, lng: data.location.lng };
      } else if (typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number') {
        loc = { lat: data.location.latitude, lng: data.location.longitude };
      }
    }

    // Normalize status to app's set
    const status = (function (s) {
      if (!s) return 'reported';
      const v = String(s).toLowerCase();
      if (v === 'pending') return 'reported';
      if (v === 'responding') return 'responded';
      return s; // dispatched/responded/resolved/reported are OK
    })(data.status);

    // Compute timestamp used by UI
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date());
    return {
      id: doc.id,
      ...data,
      status,
      // normalized location
      location: loc,
      reporter: data.reporter || {},
      timestamp: ts,
    };
  }

  function mapRescueCenterDoc(doc) {
    const data = doc.data();
    // normalize location to { latitude, longitude, address }
    let location = null;
    if (data.location) {
      if (typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number') {
        location = data.location;
      } else if (typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
        location = { latitude: data.location.lat, longitude: data.location.lng, address: data.location.address || '' };
      }
    }
    return {
      id: doc.id,
      ...data,
      location,
    };
  }

  function syncEmergencies(snapshot) {
    const emergencies = snapshot.docs.map(mapEmergencyDoc);
    if (window.emergencyDB) {
      window.emergencyDB.emergencies = emergencies;
    }
    if (typeof window.loadEmergencies === 'function') {
      try { window.loadEmergencies(); } catch (e) {}
    }
    if (typeof window.loadAnalyticsData === 'function') {
      try { window.loadAnalyticsData(); } catch (e) {}
    }
  }

  function syncRescueCenters(snapshot) {
    const centers = snapshot.docs.map(mapRescueCenterDoc);
    if (window.emergencyDB) {
      window.emergencyDB.rescueCenters = centers;
    }
    // refresh map markers in real-time
    try {
      refreshRescueCentersMap();
    } catch (e) {}
  }

  function refreshRescueCentersMap() {
    if (!window.map || !window.emergencyDB) return;
    // create or clear layer group for centers
    if (!window.rescueCentersLayer) {
      window.rescueCentersLayer = L.layerGroup().addTo(window.map);
    } else {
      window.rescueCentersLayer.clearLayers();
    }
    (window.emergencyDB.rescueCenters || []).forEach(center => {
      if (!center.location) return;
      const { latitude, longitude } = center.location;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
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
      L.marker([latitude, longitude], { icon })
        .addTo(window.rescueCentersLayer)
        .bindPopup(center.name || 'Rescue Center');
    });
  }

  return {
    start() {
      if (!window.isFirebaseReady || !window.isFirebaseReady()) return;
      if (!window.emergencyDB) return;

      // initial seed
      window.EmergencyService.init();

      // subscribe
      unsubEmergencies = window.EmergenciesRepository.onAll(syncEmergencies);
      unsubRescueCenters = window.RescueCentersRepository.onAll(syncRescueCenters);
    },

    stop() {
      if (unsubEmergencies) { unsubEmergencies(); unsubEmergencies = null; }
      if (unsubRescueCenters) { unsubRescueCenters(); unsubRescueCenters = null; }
    },
  };
})();

window.DataSyncController = DataSyncController;

// Bootstrap after DOM and Firebase are ready
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    try { window.DataSyncController.start(); } catch (e) { console.warn('DataSync start failed', e); }
  }, 0);
});
