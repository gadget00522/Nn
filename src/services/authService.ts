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
 * Sign in with Google using popup (web only)
 * Returns an AuthUser object with email, uid, and emailVerified status
 * Google accounts are automatically email verified by Firebase
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;
  return {
    email: user.email,
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
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
