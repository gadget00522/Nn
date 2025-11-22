# Malin Wallet

Ceci est un nouveau projet [**React Native**](https://reactnative.dev) pour un portefeuille Web3, initialisé avec [`@react-native-community/cli`](https://github.com/react-native-community/cli).

Une application de portefeuille Web3 pour les testnets Ethereum avec une interface utilisateur sombre inspirée de MetaMask.

## Fonctionnalités

- 🦊 Interface utilisateur sombre style MetaMask
- 🔐 Authentification par mot de passe pour le web (mode démo)
- 📥 **Importation de portefeuille depuis mnémonique (12/24 mots)**
- 🔥 **Intégration Firebase** : Adresse du portefeuille liée au compte utilisateur
- 💸 Envoi et réception d'ETH sur le testnet Ethereum Sepolia
- 🔄 Fonctionnalité d'échange (Swap) de démonstration
- 🪙 Visualisation des soldes de jetons
- ⚙️ Paramètres et gestion du portefeuille
- 📱 Multiplateforme : Web, iOS et Android

## Déploiement Web

L'application est déployée sur : **https://pulseailab.me**

### Exécution Locale (Web)

```sh
# Installer les dépendances
npm install --legacy-peer-deps

# Démarrer le serveur de développement
npm run web

# Construire pour la production
npm run build

# Servir la version de production localement
npm start
```

L'application web sera disponible sur `http://localhost:8080` en mode développement.

### Configuration Firebase

L'application utilise Firebase Authentication pour les déploiements web. Les identifiants Firebase sont configurés dans `src/firebaseConfig.ts` :

```typescript
const firebaseConfig = {
  apiKey: 'VOTRE_API_KEY',
  authDomain: 'VOTRE_PROJET.firebaseapp.com',
  projectId: 'VOTRE_PROJET',
  storageBucket: 'VOTRE_PROJET.firebasestorage.app',
  messagingSenderId: 'VOTRE_SENDER_ID',
  appId: 'VOTRE_APP_ID',
  measurementId: 'VOTRE_MEASUREMENT_ID',
};
```

**Note** : Le dépôt inclut des identifiants Firebase de démonstration. Pour une utilisation en production, créez votre propre projet Firebase et mettez à jour `src/firebaseConfig.ts`.

### Flux d'Authentification Firebase

**Sur la plateforme Web uniquement :**
1. **Écran d'Authentification** - Premier écran affiché aux utilisateurs non authentifiés
   - Inscription avec email/mot de passe
   - Connexion avec un compte existant
   - **Connexion avec Google** (NOUVEAU)
   - Demande de réinitialisation de mot de passe

2. **Vérification d'Email** - Requise après inscription par email/mot de passe
   - Email de vérification envoyé automatiquement
   - L'utilisateur doit vérifier son email avant d'accéder au portefeuille
   - Les utilisateurs Google sont automatiquement vérifiés

3. **Flux Portefeuille** - Après authentification et vérification de l'email
   - Créer un portefeuille ou déverrouiller un portefeuille existant
   - Fonctionnalités complètes du portefeuille

**Sur les plateformes natives (iOS/Android) :**
- L'authentification Firebase est contournée
- Les utilisateurs accèdent directement au flux de création/déverrouillage du portefeuille

### Connexion Google

**Prérequis :**
1. Activer Google comme fournisseur de connexion dans la Console Firebase :
   - Aller dans Console Firebase → Authentication → Sign-in method
   - Activer le fournisseur Google
   - Ajouter les domaines autorisés dans les paramètres du projet (pour les tests locaux : `localhost` et votre domaine de production)
2. Configurer l'écran de consentement OAuth (l'écran de consentement interne est suffisant pour les tests)

**Fonctionnalités :**
- Authentification en un clic avec un compte Google
- Vérification automatique de l'email (aucun email de vérification nécessaire)
- Liaison transparente du portefeuille : si un portefeuille existe localement, il est automatiquement lié à votre compte Google
- Si aucun portefeuille n'existe, vous serez invité à en créer ou en importer un après vous être connecté
- **Flow intelligent** : utilise une popup avec repli automatique vers la redirection si la popup est bloquée par le navigateur
- **Mobile** : le flow de redirection est automatiquement utilisé sur mobile quand la popup n'est pas disponible

**Utilisation :**
1. Accéder à l'écran d'authentification
2. Cliquer sur "Continuer avec Google" (avec le logo G officiel)
3. Sélectionner votre compte Google dans la popup (ou être redirigé)
4. Si vous avez un portefeuille existant, il sera automatiquement lié
5. Sinon, vous serez invité à créer ou importer un portefeuille

**Gestion des erreurs :**
- Si la popup est fermée par l'utilisateur, un message convivial s'affiche
- Si la popup est bloquée, le système bascule automatiquement vers le flow de redirection
- Tous les codes d'erreur Firebase sont traduits en messages français compréhensibles

**Sécurité :**
- ⚠️ **IMPORTANT** : Seule l'adresse du portefeuille (publique) est stockée dans Firebase
- ⚠️ **NE JAMAIS** stocker la phrase mnémonique ou les clés privées dans Firestore
- Vos clés privées/phrase mnémonique restent chiffrées localement
- L'authentification Google utilise le flow OAuth 2.0 sécurisé de Firebase

### Cas de test

**Cas A : Utilisateur sans portefeuille local**
1. Cliquer sur "Continuer avec Google"
2. Se connecter avec Google
3. Voir le toast : "Aucun portefeuille trouvé. Crée ou importe ton portefeuille."
4. Être dirigé vers le flux de création/import de portefeuille

**Cas B : Utilisateur avec portefeuille local**
1. Cliquer sur "Continuer avec Google"
2. Se connecter avec Google
3. Après connexion, vérifier dans Firestore que `users/{uid}` contient `walletAddress` et `updatedAt`
4. Voir le toast de confirmation de liaison du portefeuille

**Cas C : Popup fermée par l'utilisateur**
1. Cliquer sur "Continuer avec Google"
2. Fermer la popup de connexion Google
3. Voir un message d'erreur convivial : "La fenêtre de connexion a été fermée."

### Fichiers de Service Firebase

- **src/firebaseConfig.ts** : Initialise Firebase avec les identifiants du projet
- **src/services/authService.ts** : Fonctions d'authentification
  - `signupWithEmail(email, password)` : Créer un nouveau compte
  - `loginWithEmail(email, password)` : Se connecter à un compte existant
  - `loginWithGoogle()` : Se connecter avec Google (web uniquement)
  - `handleRedirectResultOnLoad()` : Vérifier le résultat de redirection au chargement de l'app
  - `mapGoogleAuthError(errorCode)` : Traduire les codes d'erreur Firebase en français
  - `requestPasswordReset(email)` : Envoyer un email de réinitialisation de mot de passe
  - `observeAuthState(callback)` : Surveiller les changements d'état d'authentification
  - `linkWalletAddressToUser(uid, address)` : Lier une adresse de portefeuille à un utilisateur
  - `getUserWalletAddress(uid)` : Récupérer l'adresse de portefeuille d'un utilisateur
- **src/screens/AuthScreen.tsx** : Interface utilisateur pour l'inscription/connexion
- **src/screens/components/GoogleButton.tsx** : Composant bouton Google réutilisable

### Tester le Flux Complet sur Web

1. **Authentification (Web Uniquement)**
   - Naviguer vers https://pulseailab.me
   - Choisir "Créer un compte"
   - Entrer email et mot de passe (minimum 6 caractères)
   - Confirmer le mot de passe
   - Vérifier votre email via le lien reçu
   - Retourner sur l'app et se connecter

2. **Créer un Portefeuille**
   - Après vérification de l'email et connexion
   - Cliquer sur "Créer mon portefeuille"
   - Définir un mot de passe (minimum 4 caractères) pour le chiffrement local
   - Note : Les données du portefeuille sont stockées dans le localStorage (mode démo)

3. **Importer un Portefeuille (NOUVEAU)**
   - Naviguer vers https://pulseailab.me
   - Cliquer sur "Importer un portefeuille existant"
   - Entrer votre phrase de récupération de 12 ou 24 mots
   - Définir un mot de passe pour le chiffrement local
   - Le portefeuille est importé et prêt à l'emploi
   - **Sécurité** : Votre mnémonique n'est JAMAIS envoyée au serveur. Seule l'adresse est stockée si connecté.

4. **Phrase de Sauvegarde**
   - Noter votre phrase de récupération de 12 mots
   - La stocker en lieu sûr - c'est le SEUL moyen de récupérer votre portefeuille
   - Cocher la case de confirmation
   - Vérifier 3 mots aléatoires de votre phrase

5. **Tableau de Bord**
   - Voir votre solde (ETH testnet)
   - Voir l'état du réseau (Ethereum Sepolia - Testnet)
   - Accéder aux quatre actions principales :
     - 💳 Acheter (Bientôt)
     - 🔄 Échanger (Demo swap)
     - 📤 Envoyer
     - 📥 Recevoir

6. **Recevoir des ETH**
   - Cliquer sur "Recevoir"
   - Copier votre adresse de portefeuille
   - Obtenir des ETH testnet depuis le faucet Sepolia : https://sepoliafaucet.com/
   - Attendre la confirmation de la transaction

7. **Envoyer des ETH**
   - Cliquer sur "Envoyer"
   - Entrer l'adresse du destinataire
   - Entrer le montant
   - Confirmer la transaction
   - La transaction apparaîtra sur Sepolia Etherscan

8. **Paramètres**
   - Cliquer sur l'icône menu (⚙️) en haut à gauche
   - Voir la phrase de récupération (avec avertissement)
   - Verrouiller le portefeuille
   - Supprimer le portefeuille (avec confirmation)

## Importation de Portefeuille & Intégration Firebase

### Comment ça marche

Ce portefeuille implémente un flux d'importation sécurisé avec intégration Firebase :

1. **Stockage Local Uniquement** :
   - Votre mnémonique (phrase de récupération) est stockée UNIQUEMENT sur votre appareil
   - Web : Chiffrée avec mot de passe dans localStorage (démo seulement)
   - Natif : Sécurisée avec Keychain/SecureStore de l'appareil

2. **Intégration Firestore** :
   - Seule votre ADRESSE de portefeuille (publique) est stockée dans Firestore
   - Stockée sous `users/{uid}/walletAddress`
   - La mnémonique n'est JAMAIS envoyée à Firebase ou un serveur

### Avertissements de Sécurité

⚠️ **IMPORTANT** : Ceci est une implémentation **DÉMO/TESTNET UNIQUEMENT**.

**Authentification Firebase :**
- Les identifiants Firebase sont inclus dans le dépôt pour la démo
- Pour la production, utilisez vos propres identifiants et activez les règles de sécurité

**Stockage Portefeuille :**
- La version Web utilise localStorage (non sécurisé pour de vrais fonds)
- N'utilisez jamais avec de vrais fonds Mainnet

**Sécurité Import :**
- 🔒 Votre mnémonique n'est JAMAIS envoyée à un serveur
- 🔒 Seule l'adresse publique est stockée dans Firestore
- 🔒 La mnémonique est chiffrée localement sur votre appareil

### Configuration Réseau

L'application est configurée pour :
- **Ethereum Sepolia** (testnet par défaut)
- **Polygon Mumbai** (testnet)

Toutes les transactions sont sur des testnets uniquement. Aucun fonds réel ne peut être perdu.

# Pour Commencer

> **Note** : Assurez-vous d'avoir complété le guide [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) avant de continuer.

## Étape 1 : Démarrer Metro

Lancez **Metro**, l'outil de build JavaScript pour React Native.

```sh
# Utiliser npm
npm start

# OU utiliser Yarn
yarn start
```

## Étape 2 : Construire et lancer votre application

Ouvrez un nouveau terminal et lancez :

### Android

```sh
# Utiliser npm
npm run android

# OU utiliser Yarn
yarn android
```

### iOS

N'oubliez pas d'installer les dépendances CocoaPods :

```sh
cd ios && pod install && cd ..
```

Puis lancez :

```sh
# Utiliser npm
npm run ios

# OU utiliser Yarn
yarn ios
```

## Dépannage

Si vous rencontrez des problèmes, consultez la page [Troubleshooting](https://reactnative.dev/docs/troubleshooting).

# En Savoir Plus

- [Site Web React Native](https://reactnative.dev)
- [Getting Started](https://reactnative.dev/docs/environment-setup)
- [Learn the Basics](https://reactnative.dev/docs/getting-started)
- [Blog](https://reactnative.dev/blog)
- [`@facebook/react-native`](https://github.com/facebook/react-native)
