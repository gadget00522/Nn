// Ce fichier remplace 'react-native-keychain' sur le web
// Il utilise le stockage du navigateur (localStorage)
//
// ⚠️ DEMO ONLY - NOT SECURE FOR PRODUCTION ⚠️
// localStorage is NOT secure for storing sensitive data like mnemonics
// This implementation is suitable ONLY for testnet/development purposes
// For production, use:
//   - Secure hardware wallets
//   - Browser extension wallets (MetaMask, etc.)
//   - Server-side encrypted storage with proper key management
//   - Web3Auth or similar secure authentication providers

export const setGenericPassword = async (username, password, options) => {
  localStorage.setItem('wallet_secret', password);
  return true;
};

export const getGenericPassword = async (options) => {
  const password = localStorage.getItem('wallet_secret');
  if (password) {
    return { password: password };
  }
  return false;
};

export const resetGenericPassword = async (options) => {
  localStorage.removeItem('wallet_secret');
  return true;
};

// Constantes bidons pour éviter les erreurs
export const ACCESS_CONTROL = {};
export const ACCESSIBLE = {};
export const AUTHENTICATION_TYPE = {};
