// Emergencies Repository (Firestore compat)
// Depends on window.emergenciesCollection and window.TIMESTAMP_FIELDS

const EmergenciesRepository = {
  async create(emergency) {
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const docRef = await window.emergenciesCollection().add({
      ...emergency,
      status: emergency.status || 'reported',
      [window.TIMESTAMP_FIELDS.CREATED_AT]: now,
      [window.TIMESTAMP_FIELDS.UPDATED_AT]: now,
    });
    const snap = await docRef.get();
    return { id: docRef.id, ...snap.data() };
  },

  async update(id, updates) {
    const now = firebase.firestore.FieldValue.serverTimestamp();
    await window.emergenciesCollection().doc(id).update({
      ...updates,
      [window.TIMESTAMP_FIELDS.UPDATED_AT]: now,
    });
  },

  async setStatus(id, status, extra = {}) {
    return this.update(id, { status, ...extra });
  },

  async getById(id) {
    const snap = await window.emergenciesCollection().doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  onActiveSince(date, handler) {
    // subscribe to active emergencies ordered by createdAt desc
    return window
      .emergenciesCollection()
      .where('status', 'in', ['reported', 'dispatched', 'responded'])
      .orderBy('createdAt', 'desc')
      .onSnapshot(handler);
  },

  onAll(handler) {
    return window.emergenciesCollection().onSnapshot(handler);
  },

  async listByStatus(status) {
    const q = await window.emergenciesCollection().where('status', '==', status).get();
    return q.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

window.EmergenciesRepository = EmergenciesRepository;
