// Auth Service: keeps role in session and exposes login/logout/signup

const AuthService = {
  async signupResponder({ email, password, name, organization }) {
    const user = await window.AuthRepository.signUpWithEmail({
      email, password, name, organization, role: 'responder',
    });
    this._saveSession(user);
    return user;
  },

  async loginResponder({ email, password }) {
    const user = await window.AuthRepository.signInWithEmail({ email, password });
    this._saveSession(user);
    return user;
  },

  async logout() {
    await window.AuthRepository.signOut();
    this._clearSession();
  },

  _saveSession(user) {
    const session = {
      user: {
        id: user.uid,
        type: user.type || 'responder',
        email: user.email || '',
        organization: user.organization || '',
        name: user.name || '',
      },
      timestamp: new Date().getTime(),
    };
    localStorage.setItem('emergencyResponseSession', JSON.stringify(session));
  },

  _clearSession() {
    localStorage.removeItem('emergencyResponseSession');
  },
};

window.AuthService = AuthService;
