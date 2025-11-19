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

export type AuthUser = {
  email: string | null;
  uid: string;
  emailVerified: boolean;
};

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

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Map Firebase auth error codes to user-friendly messages in French
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
 * Sign in with Google using popup (web only)
 * Attempts signInWithPopup first, falls back to signInWithRedirect if popup is blocked
 * Returns AuthUser object on immediate success, or null if redirect flow started
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
 * Handle redirect result after Google sign-in redirect flow
 * Call this on app load to check if user is returning from redirect
 * Returns AuthUser object if redirect result exists, null otherwise
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
 * Link a wallet address to a Firebase user in Firestore
 * Stores only the wallet address (NOT the mnemonic) in users/{uid}
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
 * Get the wallet address for a Firebase user from Firestore
 * Returns the address or null if not found
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
