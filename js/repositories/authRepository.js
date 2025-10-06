// Auth Repository: wraps Firebase Auth and Users collection

const AuthRepository = {
  async signUpWithEmail({ email, password, name, organization, role }) {
    const cred = await window.auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const userDoc = {
      type: role || 'responder',
      email,
      name: name || '',
      organization: organization || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await window.usersCollection().doc(uid).set(userDoc);
    return { uid, ...userDoc };
  },

  async signInWithEmail({ email, password }) {
    const cred = await window.auth.signInWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const snap = await window.usersCollection().doc(uid).get();
    const profile = snap.exists ? snap.data() : { type: 'responder', email };
    return { uid, ...profile };
  },

  async signOut() {
    await window.auth.signOut();
  },

  onAuthStateChanged(handler) {
    return window.auth.onAuthStateChanged(handler);
  },
};

window.AuthRepository = AuthRepository;
