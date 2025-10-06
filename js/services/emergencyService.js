// Emergency Service: high-level operations combining repositories

const EmergencyService = {
  async init() {
    // No seeding; rescue centers are managed in Firestore only
    return;
  },

  async reportEmergency(payload) {
    return window.EmergenciesRepository.create(payload);
  },

  async updateEmergencyStatus(id, status, extra) {
    return window.EmergenciesRepository.setStatus(id, status, extra || {});
  },

  async listRescueCenters() {
    return window.RescueCentersRepository.listAll();
  },
};

window.EmergencyService = EmergencyService;
