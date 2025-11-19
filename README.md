This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Malin Wallet

A Web3 wallet application for Ethereum testnets with a MetaMask-inspired dark theme UI.

## Features

- 🦊 MetaMask-style dark theme UI
- 🔐 Password-based authentication for web (demo mode)
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
npm install

# Start development server
npm run web

# Build for production
npm run build
```

The web app will be available at `http://localhost:8080` in development mode.

### Testing the Complete Flow on Web

1. **Create Wallet**
   - Navigate to https://pulseailab.me
   - Click "Créer mon portefeuille"
   - Set a password (minimum 4 characters) - DEMO ONLY, NOT SECURE
   - Note: Password is stored in localStorage (not secure for production)

2. **Backup Phrase**
   - Write down your 12-word recovery phrase
   - Store it securely - this is the ONLY way to recover your wallet
   - Check the confirmation box
   - Verify 3 random words from your phrase

3. **Dashboard**
   - View your balance (testnet ETH)
   - See network status (Ethereum Sepolia - Testnet)
   - Access four main actions:
     - 💳 Acheter (Coming soon)
     - 🔄 Échanger (Demo swap)
     - 📤 Envoyer (Send)
     - 📥 Recevoir (Receive)

4. **Receive ETH**
   - Click "Recevoir"
   - Copy your wallet address
   - Get testnet ETH from Sepolia faucet: https://sepoliafaucet.com/
   - Wait for transaction confirmation

5. **Send ETH**
   - Click "Envoyer"
   - Enter recipient address
   - Enter amount
   - Confirm transaction
   - Transaction will appear on Sepolia Etherscan

6. **Demo Swap**
   - Click "Échanger"
   - Enter amount to swap
   - This performs a real testnet transaction to your own address
   - Useful for testing transaction flows

7. **Settings**
   - Click menu icon (☰) in top left
   - View recovery phrase (with warning)
   - Lock wallet
   - Delete wallet (with confirmation)

8. **Lock/Unlock**
   - Lock wallet from Settings
   - Enter password to unlock
   - On native apps, uses biometric authentication

### Security Warnings

⚠️ **IMPORTANT**: The web version uses localStorage for password storage, which is **NOT SECURE** for production use. This is a **DEMO/TESTNET ONLY** implementation.

For production deployments:
- Use hardware wallets or secure enclaves
- Implement proper encryption
- Never store private keys in localStorage
- Use only on testnets

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
