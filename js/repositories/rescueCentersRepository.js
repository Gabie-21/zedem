// Rescue Centers Repository (Firestore compat)

const RescueCentersRepository = {
  async seedIfEmpty(sampleCenters) {
    const snap = await window.rescueCentersCollection().limit(1).get();
    if (!snap.empty) return false;

    const batch = window.db.batch();
    sampleCenters.forEach((c) => {
      const ref = window.rescueCentersCollection().doc();
      batch.set(ref, {
        ...c,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    return true;
  },

  onAll(handler) {
    return window.rescueCentersCollection().onSnapshot(handler);
  },

  async listAll() {
    const q = await window.rescueCentersCollection().get();
    return q.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

window.RescueCentersRepository = RescueCentersRepository;
