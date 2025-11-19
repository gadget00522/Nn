import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Platform } from 'react-native';

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

/**
 * Sign in with Google (Web only)
 * Uses Firebase GoogleAuthProvider with popup
 * Returns AuthUser with email, uid, and emailVerified status
 * 
 * @throws Error with specific messages for:
 *   - auth/popup-closed-by-user
 *   - auth/cancelled-popup-request
 *   - Other Firebase auth errors
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  // Platform check: Only supported on web
  // TODO: Implémenter Google Sign-In natif (expo-auth-session ou react-native-google-signin)
  if (Platform.OS !== 'web' && typeof window === 'undefined') {
    throw new Error('Google Sign-In est actuellement disponible uniquement sur Web.');
  }

  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    console.log('Google Sign-In successful:', { uid: user.uid, email: user.email });

    return {
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified, // Google usually returns emailVerified = true
    };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    // Map Firebase error codes to user-friendly messages
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Fenêtre fermée avant la connexion.');
      case 'auth/cancelled-popup-request':
        throw new Error('Action annulée, réessaie.');
      default:
        throw new Error(error.message || `Erreur lors de la connexion Google (${error.code || 'unknown'})`);
    }
  }
}
