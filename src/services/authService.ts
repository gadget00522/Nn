import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

/**
 * Représente un utilisateur authentifié dans l'application.
 */
export type AuthUser = {
  /** L'adresse email de l'utilisateur. */
  email: string | null;
  /** L'identifiant unique de l'utilisateur (User ID). */
  uid: string;
  /** Indique si l'email de l'utilisateur a été vérifié. */
  emailVerified: boolean;
};

/**
 * Crée un nouveau compte utilisateur avec email et mot de passe.
 * Envoie automatiquement un email de vérification si nécessaire.
 *
 * @param {string} email - L'adresse email de l'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<AuthUser>} Une promesse contenant les informations de l'utilisateur créé.
 */
export async function signupWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
  return {
    email: user.email,
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
}

/**
 * Connecte un utilisateur existant avec email et mot de passe.
 *
 * @param {string} email - L'adresse email de l'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<AuthUser>} Une promesse contenant les informations de l'utilisateur connecté.
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  return {
    email: user.email,
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
}

/**
 * Envoie un email de réinitialisation de mot de passe à l'adresse spécifiée.
 *
 * @param {string} email - L'adresse email pour laquelle réinitialiser le mot de passe.
 * @returns {Promise<void>} Une promesse qui se résout une fois l'email envoyé.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Mappe les codes d'erreur d'authentification Firebase vers des messages conviviaux en français.
 *
 * @param {string} errorCode - Le code d'erreur renvoyé par Firebase (ex: 'auth/user-disabled').
 * @returns {string} Le message d'erreur traduit en français.
 */
export function mapGoogleAuthError(errorCode: string): string {
  const errorMap: { [key: string]: string } = {
    'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée.',
    'auth/popup-blocked': 'La fenêtre popup a été bloquée par le navigateur.',
    'auth/cancelled-popup-request': 'Demande de connexion annulée.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email.',
    'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  };
  
  return errorMap[errorCode] || 'Impossible de se connecter avec Google.';
}

/**
 * Connecte l'utilisateur avec Google en utilisant une fenêtre popup (Web uniquement).
 * Tente d'abord `signInWithPopup`, et bascule vers `signInWithRedirect` si la popup est bloquée.
 *
 * @returns {Promise<AuthUser | null>} Une promesse contenant l'utilisateur authentifié en cas de succès immédiat, ou null si le flux de redirection a commencé.
 * @throws {Error} Si la connexion échoue ou si l'environnement n'est pas le Web.
 */
export async function loginWithGoogle(): Promise<AuthUser | null> {
  // Check if running on web
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in is only available on web');
  }

  const provider = new GoogleAuthProvider();
  
  try {
    // Try popup first
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;
    return {
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified,
    };
  } catch (error: any) {
    // If popup was blocked, fall back to redirect
    if (error?.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      // Redirect flow started - return null to indicate this
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Gère le résultat de la redirection après une connexion Google (Web uniquement).
 * Cette fonction doit être appelée au chargement de l'application pour vérifier si l'utilisateur revient d'une redirection.
 *
 * @returns {Promise<AuthUser | null>} Une promesse contenant l'utilisateur authentifié si un résultat de redirection existe, sinon null.
 */
export async function handleRedirectResultOnLoad(): Promise<AuthUser | null> {
  // Check if running on web
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return {
        email: result.user.email,
        uid: result.user.uid,
        emailVerified: result.user.emailVerified,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
}

/**
 * Observe les changements d'état de l'authentification Firebase.
 *
 * @param {function(AuthUser | null): void} callback - La fonction de rappel appelée lors d'un changement d'état.
 * @returns {import('firebase/auth').Unsubscribe} Une fonction pour se désabonner de l'observateur.
 */
export function observeAuthState(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (!user) return callback(null);
    callback({
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified,
    });
  });
}

/**
 * Lie une adresse de portefeuille à un utilisateur Firebase dans Firestore.
 * Stocke uniquement l'adresse du portefeuille (PAS la phrase mnémonique) dans `users/{uid}`.
 *
 * @param {string} uid - L'identifiant unique de l'utilisateur.
 * @param {string} walletAddress - L'adresse publique du portefeuille à lier.
 * @returns {Promise<void>} Une promesse qui se résout une fois le lien établi.
 */
export async function linkWalletAddressToUser(
  uid: string,
  walletAddress: string,
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    {
      walletAddress,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/**
 * Récupère l'adresse du portefeuille pour un utilisateur Firebase depuis Firestore.
 *
 * @param {string} uid - L'identifiant unique de l'utilisateur.
 * @returns {Promise<string | null>} Une promesse contenant l'adresse du portefeuille ou null si non trouvée.
 */
export async function getUserWalletAddress(uid: string): Promise<string | null> {
  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.walletAddress || null;
  }
  
  return null;
}
