This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Malin Wallet

A Web3 wallet application for Ethereum testnets with a MetaMask-inspired dark theme UI.

## Features

- 🦊 MetaMask-style dark theme UI
- 🔐 Password-based authentication for web (demo mode)
- 📥 **Wallet import from mnemonic (12/24 words)**
- 🔥 **Firebase integration**: Wallet address linked to user account
- 💸 Send and receive ETH on Ethereum Sepolia testnet
- 🔄 Demo swap functionality
- 🪙 Token balance viewing
- ⚙️ Settings and wallet management
- 📱 Cross-platform: Web, iOS, and Android

## Web Deployment

The app is deployed at: **https://pulseailab.me**

### Running Locally (Web)

```sh
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run web

# Build for production
npm run build

# Serve production build locally
npm start
```

The web app will be available at `http://localhost:8080` in development mode.

### Firebase Configuration

The app uses Firebase Authentication for web deployments. Firebase credentials are configured in `src/firebaseConfig.ts`:

```typescript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
};
```

**Note**: The repository includes demo Firebase credentials. For production use, create your own Firebase project and update `src/firebaseConfig.ts` with your credentials.

### Firebase Authentication Flow

**On Web Platform Only:**
1. **Authentication Screen** - First screen shown to unauthenticated users
   - Sign up with email/password
   - Log in with existing account
   - **Sign in with Google** (NEW)
   - Request password reset

2. **Email Verification** - Required after signup with email/password
   - Verification email sent automatically
   - User must verify email before accessing wallet
   - Google sign-in users are automatically verified

3. **Wallet Flow** - After authentication and email verification
   - Create wallet or unlock existing wallet
   - Full wallet functionality

**On Native Platforms (iOS/Android):**
- Firebase authentication is bypassed
- Users go directly to wallet creation/unlock flow

### Google Authentication

**Prerequisites:**
1. Enable Google as a sign-in provider in Firebase Console:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Google provider
   - Add authorized domains (for local testing: `localhost` and your production domain)
2. Configure OAuth consent screen (Internal consent screen is sufficient for testing)

**Features:**
- One-click authentication with Google account
- Automatic email verification (no verification email needed)
- Seamless wallet linking: If a wallet exists locally, it's automatically linked to your Google account
- If no wallet exists, you'll be prompted to create or import one after signing in

**Usage:**
1. Navigate to the authentication screen
2. Click "🔍 Continuer avec Google"
3. Select your Google account in the popup
4. If you have an existing wallet, it will be automatically linked
5. If not, you'll be prompted to create or import a wallet

**Security:**
- Only your wallet address (public) is stored in Firebase
- Your mnemonic/private keys remain encrypted locally
- Google authentication uses Firebase's secure OAuth 2.0 flow

### Firebase Service Files

- **src/firebaseConfig.ts**: Initializes Firebase with project credentials
- **src/services/authService.ts**: Authentication functions
  - `signupWithEmail(email, password)`: Create new account
  - `loginWithEmail(email, password)`: Sign in to existing account
  - `loginWithGoogle()`: Sign in with Google (web only)
  - `requestPasswordReset(email)`: Send password reset email
  - `observeAuthState(callback)`: Monitor authentication state changes
  - `linkWalletAddressToUser(uid, address)`: Link wallet address to user account
  - `getUserWalletAddress(uid)`: Retrieve wallet address for a user
- **src/screens/AuthScreen.tsx**: UI for signup/login/password reset/Google sign-in

### Testing the Complete Flow on Web

1. **Authentication (Web Only)**
   - Navigate to https://pulseailab.me
   - Choose "Créer un compte" (Sign up)
   - Enter email and password (minimum 6 characters)
   - Confirm password
   - Check your email for verification link
   - Click verification link
   - Return to app and log in

2. **Create Wallet**
   - After email verification and login
   - Click "Créer mon portefeuille"
   - Set a password (minimum 4 characters) for wallet encryption on web
   - Note: Wallet data is stored in localStorage (demo mode)

2. **Import Wallet (NEW)**
   - Navigate to https://pulseailab.me
   - Click "Importer un portefeuille existant"
   - Enter your 12 or 24-word recovery phrase
   - Set a password for local encryption (web demo only)
   - The wallet is imported and ready to use
   - **Security**: Your mnemonic is NEVER sent to the server. Only the wallet address is stored in Firestore if you're signed in with Firebase.

3. **Backup Phrase**
   - Write down your 12-word recovery phrase
   - Store it securely - this is the ONLY way to recover your wallet
   - Check the confirmation box
   - Verify 3 random words from your phrase

4. **Dashboard**
   - View your balance (testnet ETH)
   - See network status (Ethereum Sepolia - Testnet)
   - Access four main actions:
     - 💳 Acheter (Coming soon)
     - 🔄 Échanger (Demo swap)
     - 📤 Envoyer (Send)
     - 📥 Recevoir (Receive)

5. **Receive ETH**
   - Click "Recevoir"
   - Copy your wallet address
   - Get testnet ETH from Sepolia faucet: https://sepoliafaucet.com/
   - Wait for transaction confirmation

6. **Send ETH**
   - Click "Envoyer"
   - Enter recipient address
   - Enter amount
   - Confirm transaction
   - Transaction will appear on Sepolia Etherscan

7. **Demo Swap**
   - Click "Échanger"
   - Enter amount to swap
   - This performs a real testnet transaction to your own address
   - Useful for testing transaction flows

8. **Settings**
   - Click menu icon (☰) in top left
   - View recovery phrase (with warning)
   - Lock wallet
   - Delete wallet (with confirmation)

9. **Lock/Unlock**
   - Lock wallet from Settings
   - Enter password to unlock
   - On native apps, uses biometric authentication

## Wallet Import & Firebase Integration

### How it Works

This wallet implements a secure wallet import flow with Firebase integration:

1. **Local Storage Only**: 
   - Your mnemonic (recovery phrase) is stored ONLY on your device
   - Web: Encrypted with password in localStorage (demo only)
   - Native: Secured with device Keychain/SecureStore

2. **Firestore Integration**:
   - Only your wallet ADDRESS (public) is stored in Firestore
   - Stored under `users/{uid}/walletAddress`
   - The mnemonic is NEVER sent to Firebase or any server

3. **Import Process**:
   - Enter your 12 or 24-word recovery phrase
   - Set a password for local encryption (web only)
   - Wallet is validated using ethers.js
   - Mnemonic is encrypted and stored locally
   - If signed in with Firebase, the address is linked to your account

### Testing Wallet Import

To test the import functionality:

```bash
# 1. Create a test wallet first to get a mnemonic
# 2. Copy the mnemonic from the backup screen
# 3. Delete the wallet from settings
# 4. Use "Importer un portefeuille existant" to restore it
```

### Firebase Firestore Structure

```
users/
  {uid}/
    walletAddress: "0x..."
    updatedAt: "2025-11-19T..."
```

**Note**: The mnemonic is NEVER stored in Firestore for security reasons.

### Security Warnings

⚠️ **IMPORTANT**: This is a **DEMO/TESTNET ONLY** implementation.

**Firebase Authentication:**
- Firebase credentials are included in the repository for demo purposes
- Email verification is required for web access
- Firebase Authentication provides secure user authentication
- For production, rotate Firebase credentials and enable additional security features

**Wallet Storage:**
- Web version uses localStorage for wallet storage (not secure for production)
- Private keys should be properly encrypted in production
- Never use with real mainnet funds

For production deployments:
- Create your own Firebase project with production security rules
- Use hardware wallets or secure enclaves for key storage
- Implement proper encryption for wallet data
- Never store sensitive data in localStorage
- Use only on testnets for development

**Wallet Import Security**:
- 🔒 Your mnemonic is NEVER sent to any server
- 🔒 Only the public wallet address is stored in Firestore
- 🔒 Mnemonic is encrypted locally on your device
- ⚠️ Web demo: Uses localStorage (not production-ready)
- ✅ Native apps: Uses platform Keychain/SecureStore

### Network Configuration

The app is configured for:
- **Ethereum Sepolia** (default testnet)
- **Polygon Mumbai** (testnet)

All transactions are on testnets only. No real funds can be lost.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
