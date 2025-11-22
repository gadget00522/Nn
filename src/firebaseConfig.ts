import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuration Firebase pour l'application.
 * Contient les clés API et identifiants nécessaires pour se connecter aux services Firebase.
 *
 * Services utilisés :
 * - Authentication : Gestion des utilisateurs (inscription, connexion, réinitialisation mot de passe).
 * - Firestore : Base de données NoSQL pour stocker les données utilisateur (ex: adresse du portefeuille).
 */
const firebaseConfig = {
  apiKey: 'AIzaSyB31MfZcNtdDO3gdyYqCeO4NbpVMQct6Oc',
  authDomain: 'malin-wallet.firebaseapp.com',
  projectId: 'malin-wallet',
  storageBucket: 'malin-wallet.firebasestorage.app',
  messagingSenderId: '341622379332',
  appId: '1:341622379332:web:62db22e44925d96f77fd11',
  measurementId: 'G-0TT4MBSWCX',
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

/** Instance du service d'authentification Firebase. */
export const auth = getAuth(app);

/** Instance de la base de données Firestore. */
export const db = getFirestore(app);
