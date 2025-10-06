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

// Seed sample rescue centers for first-time setup
window.SAMPLE_RESCUE_CENTERS = [
  {
    name: 'University Teaching Hospital',
    type: 'hospital',
    phone: '+260 211 254838',
    location: { latitude: -15.3875, longitude: 28.3228, address: 'Nationalist Road, Lusaka' },
    resources: ['Ambulance', 'Emergency Room', 'ICU', 'Trauma Center'],
    available: true,
    responseTime: 15,
  },
  {
    name: 'Lusaka Central Police Station',
    type: 'police',
    phone: '991',
    location: { latitude: -15.4173, longitude: 28.2809, address: 'Independence Avenue, Lusaka' },
    resources: ['Patrol Units', 'Criminal Investigation', 'Traffic Police'],
    available: true,
    responseTime: 10,
  },
  {
    name: 'Zambia Fire and Rescue Services',
    type: 'fire',
    phone: '993',
    location: { latitude: -15.4086, longitude: 28.2883, address: 'Dedan Kimathi Road, Lusaka' },
    resources: ['Fire Engines', 'Rescue Equipment', 'Hazmat Response'],
    available: true,
    responseTime: 12,
  },
  {
    name: 'Levy Mwanawasa Hospital',
    type: 'hospital',
    phone: '+260 211 253652',
    location: { latitude: -15.3953, longitude: 28.3105, address: 'Lukanga Road, Lusaka' },
    resources: ['Ambulance', 'Emergency Room', 'Maternity Ward'],
    available: true,
    responseTime: 18,
  },
  {
    name: 'Chelstone Police Station',
    type: 'police',
    phone: '+260 211 278430',
    location: { latitude: -15.4285, longitude: 28.3475, address: 'Chelstone, Lusaka' },
    resources: ['Patrol Units', 'Community Policing'],
    available: true,
    responseTime: 20,
  },
  {
    name: 'Ndola Teaching Hospital',
    type: 'hospital',
    phone: '+260 212 610473',
    location: { latitude: -12.9829, longitude: 28.6498, address: 'Ndola, Copperbelt' },
    resources: ['Ambulance', 'Emergency Room', 'ICU', 'Trauma Center'],
    available: true,
    responseTime: 16,
  },
  {
    name: 'Kitwe Central Hospital',
    type: 'hospital',
    phone: '+260 212 221123',
    location: { latitude: -12.8140, longitude: 28.2076, address: 'Kitwe, Copperbelt' },
    resources: ['Ambulance', 'Emergency Room', 'Surgery'],
    available: true,
    responseTime: 14,
  },
  {
    name: 'Livingstone Central Hospital',
    type: 'hospital',
    phone: '+260 213 321122',
    location: { latitude: -17.8519, longitude: 25.8543, address: 'Livingstone, Southern Province' },
    resources: ['Ambulance', 'Emergency Room'],
    available: true,
    responseTime: 22,
  },
  {
    name: 'Matero Police Station',
    type: 'police',
    phone: '+260 211 244444',
    location: { latitude: -15.3915, longitude: 28.2467, address: 'Matero, Lusaka' },
    resources: ['Patrol Units', 'Community Policing'],
    available: true,
    responseTime: 12,
  },
  {
    name: 'Libala South Police Post',
    type: 'police',
    phone: '+260 211 234567',
    location: { latitude: -15.4548, longitude: 28.3221, address: 'Libala South, Lusaka' },
    resources: ['Patrol Units'],
    available: true,
    responseTime: 11,
  },
  {
    name: 'Kabwata Fire Station',
    type: 'fire',
    phone: '993',
    location: { latitude: -15.4448, longitude: 28.3109, address: 'Kabwata, Lusaka' },
    resources: ['Fire Engines', 'Rescue Equipment'],
    available: true,
    responseTime: 9,
  },
  {
    name: 'Chilenje Fire Station',
    type: 'fire',
    phone: '993',
    location: { latitude: -15.4583, longitude: 28.3437, address: 'Chilenje, Lusaka' },
    resources: ['Fire Engines', 'Rescue Equipment'],
    available: true,
    responseTime: 10,
  },
  {
    name: 'Chipata Central Hospital',
    type: 'hospital',
    phone: '+260 216 221241',
    location: { latitude: -13.6360, longitude: 32.6460, address: 'Chipata, Eastern Province' },
    resources: ['Ambulance', 'Emergency Room'],
    available: true,
    responseTime: 25,
  },
  {
    name: 'Solwezi General Hospital',
    type: 'hospital',
    phone: '+260 218 821174',
    location: { latitude: -12.1733, longitude: 26.3894, address: 'Solwezi, North-Western' },
    resources: ['Ambulance', 'Emergency Room'],
    available: true,
    responseTime: 28,
  },
  {
    name: 'Luanshya Fire Brigade',
    type: 'fire',
    phone: '993',
    location: { latitude: -13.1339, longitude: 28.4166, address: 'Luanshya, Copperbelt' },
    resources: ['Fire Engines', 'Hazmat Response'],
    available: true,
    responseTime: 15,
  }
];
