// Firestore collection names and helpers
// Requires window.db from js/firebase.js (compat SDK)

/** @type {{USERS:'users', EMERGENCIES:'emergencies', RESCUE_CENTERS:'rescueCenters', RESPONSES:'responses'}} */
window.COLLECTIONS = {
  USERS: 'users',
  EMERGENCIES: 'emergencies',
  RESCUE_CENTERS: 'rescueCenters',
  RESPONSES: 'responses',
};

// Collection references
window.usersCollection = () => window.db.collection(window.COLLECTIONS.USERS);
window.emergenciesCollection = () => window.db.collection(window.COLLECTIONS.EMERGENCIES);
window.rescueCentersCollection = () => window.db.collection(window.COLLECTIONS.RESCUE_CENTERS);
window.responsesCollection = () => window.db.collection(window.COLLECTIONS.RESPONSES);

// Utility
window.getCollectionRef = function (name) {
  return window.db.collection(window.COLLECTIONS[name]);
};

window.TIMESTAMP_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
};

