// Simple shim pour build web : implémentations no-op
// Si tu as besoin de comportements réels côté web (ex: stockage sécurisé) il faudra remplacer par IndexedDB/WebCrypto.

module.exports = {
  setGenericPassword: async (username, password) => {
    // retourne true pour indiquer succès côté web (stockage peut être fait dans localStorage si souhaité)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rn_keychain_user', username || '');
        localStorage.setItem('rn_keychain_pass', password || '');
      }
      return true;
    } catch (e) {
      return false;
    }
  },
  getGenericPassword: async () => {
    if (typeof window === 'undefined') return false;
    const user = localStorage.getItem('rn_keychain_user');
    const pass = localStorage.getItem('rn_keychain_pass');
    if (user === null && pass === null) return false;
    return { username: user, password: pass };
  },
  resetGenericPassword: async () => {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem('rn_keychain_user');
    localStorage.removeItem('rn_keychain_pass');
    return true;
  }
};
