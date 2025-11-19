# WalletConnect v2 Integration Guide

## Overview

This document describes the WalletConnect v2 integration added to Malin Wallet, enabling users to connect their wallet to decentralized applications (DApps) via QR code scanning or manual URI input.

## Features Implemented

### 1. WalletConnect Service (`src/services/WalletConnectService.ts`)

A singleton service that manages WalletConnect v2 sessions:

- **Initialization**: Automatically initializes Web3Wallet with Core
- **Pairing**: Connect to DApps via WalletConnect URI
- **Session Management**: Approve/reject session proposals
- **Request Handling**: Sign transactions and messages
- **Event System**: Subscribe to WalletConnect events

**Default Configuration**:
- Project ID: `459794b1313534b16626642592582276` (public test ID)
- Metadata: Malin Wallet branding
- Supported Methods: eth_sendTransaction, eth_sign, personal_sign, eth_signTypedData, etc.

### 2. Scan Screen (`src/screens/ScanScreen.tsx`)

A dedicated screen for scanning WalletConnect QR codes:

- **Camera Detection**: Automatically detects if camera is available (web)
- **Manual Input**: Fallback text input for pasting WalletConnect URIs
- **Instructions**: Clear step-by-step guide for users
- **Validation**: URI format validation before pairing

**Usage Flow**:
1. Navigate to Scan screen from Dashboard
2. Scan QR code (if camera available) OR paste URI manually
3. Service initiates pairing
4. Modal appears for approval

### 3. WalletConnect Modal (`src/components/WalletConnectModal.tsx`)

An always-mounted modal component that displays WalletConnect requests:

**Session Proposals**:
- Shows DApp name, URL, description, and icon
- Lists requested permissions
- Security warnings
- Approve/Reject buttons

**Transaction/Signing Requests**:
- Displays request type (transaction, message, typed data)
- Shows transaction details (to address, value, etc.)
- Network information
- Clear warnings before signing

**Auto-Display**: Modal automatically shows when WalletConnect events arrive

### 4. Store Integration (`src/store/walletStore.js`)

Extended Zustand store with WalletConnect state and actions:

**New State**:
```javascript
walletConnectRequest: null // Stores pending requests
```

**New Actions**:
- `setWalletConnectRequest(request)`: Store incoming request
- `clearWalletConnectRequest()`: Clear current request
- `approveSession()`: Approve session proposal with current wallet
- `rejectSession()`: Reject session proposal
- `approveRequest()`: Sign transaction/message and respond
- `rejectRequest()`: Reject signing request

**Signing Implementation**:
- Supports eth_sign, personal_sign, eth_signTypedData, eth_signTypedData_v4
- Supports eth_sendTransaction, eth_signTransaction
- Uses ethers.js with wallet mnemonic
- Automatically refreshes balance after transactions

### 5. Dashboard Integration

Added **Scan** button (📱 icon) to Dashboard action buttons:
- Positioned alongside Acheter, Échanger, Envoyer, Recevoir
- Navigates to ScanScreen
- Available in both light and dark themes

## Testing Guide

### Prerequisites
1. Deploy wallet to https://pulseailab.me (or test locally)
2. Have testnet ETH on Ethereum Sepolia
3. Access to a DApp that supports WalletConnect v2

### Test Scenarios

#### Scenario 1: Connect to Uniswap (Testnet)

1. **Open Uniswap testnet** in a browser:
   ```
   https://app.uniswap.org
   ```

2. **Switch to Sepolia testnet** in Uniswap

3. **Click "Connect Wallet"** → Select "WalletConnect"

4. **Copy the WalletConnect URI** or prepare to scan QR code

5. **In Malin Wallet**:
   - Navigate to Dashboard
   - Click **Scan** button (📱)
   - Paste URI in manual input OR scan QR
   - Click "Connecter"

6. **Approve Connection**:
   - WalletConnectModal appears automatically
   - Review DApp details (Uniswap)
   - Review permissions
   - Click "Approuver"

7. **Verify Connection**:
   - Uniswap should show wallet as connected
   - Your Sepolia address should be visible
   - Balance should be displayed

#### Scenario 2: Sign a Transaction

1. **With wallet connected to Uniswap**:
   - Attempt a swap (e.g., ETH to USDC)
   - Click "Swap"

2. **In Malin Wallet**:
   - WalletConnectModal appears automatically
   - Shows "Demande de Transaction"
   - Displays: To address, Value, Network (Sepolia)
   - Security warning shown

3. **Approve or Reject**:
   - Review transaction details carefully
   - Click "Approuver" to sign and send
   - OR click "Rejeter" to cancel

4. **Verify Transaction**:
   - Transaction submitted to Sepolia
   - Check on Etherscan: https://sepolia.etherscan.io
   - Balance updates in Dashboard

#### Scenario 3: Sign a Message

1. **Use a DApp that requires message signing**:
   - e.g., OpenSea, ENS, or similar

2. **Trigger Sign Message**:
   - DApp requests signature

3. **In Malin Wallet**:
   - Modal shows "Demande de Signature de Message"
   - Message content displayed
   - Click "Approuver" to sign

4. **Verify**:
   - DApp receives signature
   - Action completes

#### Scenario 4: Manual URI Input (No Camera)

1. **Get WalletConnect URI** from DApp

2. **In Malin Wallet**:
   - Go to Scan screen
   - See "Caméra non disponible" message
   - Scroll to "Ou entrez l'URI manuellement"
   - Paste URI (starts with `wc:`)
   - Click "Connecter"

3. **Approve** in modal as usual

## Architecture

### Event Flow

```
DApp (Uniswap)
    ↓
    | WalletConnect URI
    ↓
ScanScreen
    ↓
    | pair(uri)
    ↓
WalletConnectService
    ↓
    | session_proposal event
    ↓
WalletConnectModal (listening)
    ↓
    | setWalletConnectRequest()
    ↓
walletStore
    ↓
    | User clicks "Approuver"
    ↓
approveSession()
    ↓
WalletConnectService.approveSession()
    ↓
    | Session approved
    ↓
DApp receives confirmation
```

### Data Flow for Signing

```
DApp requests signature
    ↓
    | session_request event
    ↓
WalletConnectModal displays
    ↓
    | User approves
    ↓
approveRequest()
    ↓
    | Get mnemonic from store
    ↓
ethers.Wallet.fromPhrase(mnemonic)
    ↓
    | Sign with wallet
    ↓
WalletConnectService.respondRequest()
    ↓
    | Result sent to DApp
    ↓
DApp receives signature
```

## Security Considerations

### ⚠️ TESTNET ONLY

**Current Implementation**:
- Mnemonic stored in localStorage (web) or Keychain (native)
- localStorage is NOT secure for production
- No encryption of mnemonic on web
- Auto-unlock on page refresh

**For Production**:
1. **Never store mnemonics in localStorage**
2. **Use secure hardware wallets** (Ledger, Trezor)
3. **Implement proper encryption** with key derivation (PBKDF2/Argon2)
4. **Add multi-factor authentication**
5. **Use secure enclaves** (TPM, SE) where available
6. **Consider browser extension model** (like MetaMask)
7. **Implement rate limiting** for signing requests
8. **Add transaction confirmation delays** for large amounts

### Security Best Practices Implemented

✅ **Session Approval Warnings**:
- Clear warnings before approving sessions
- DApp name and URL displayed
- Permission list shown

✅ **Transaction Review**:
- Full transaction details displayed
- Network confirmation
- Amount and recipient visible
- Warning about irreversibility

✅ **Message Signing Warnings**:
- Message content shown (truncated if long)
- Clear indication of what's being signed
- Warning to verify content

✅ **Request Validation**:
- URI format validation
- Method support checking
- Error handling for invalid requests

## API Reference

### WalletConnectService

#### Methods

```typescript
// Initialize service
await WalletConnectService.getInstance().initialize(projectId?: string)

// Check if initialized
WalletConnectService.getInstance().isInitialized(): boolean

// Pair with DApp
await WalletConnectService.getInstance().pair(uri: string)

// Approve session
await WalletConnectService.getInstance().approveSession(
  proposalId: number,
  accounts: string[],
  chainId: number
)

// Reject session
await WalletConnectService.getInstance().rejectSession(proposalId: number)

// Respond to request
await WalletConnectService.getInstance().respondRequest(
  topic: string,
  requestId: number,
  result: any
)

// Reject request
await WalletConnectService.getInstance().rejectRequest(
  topic: string,
  requestId: number
)

// Get active sessions
WalletConnectService.getInstance().getActiveSessions(): Record<string, any>

// Disconnect session
await WalletConnectService.getInstance().disconnectSession(topic: string)

// Subscribe to events
WalletConnectService.getInstance().on(event: string, handler: Function)

// Unsubscribe from events
WalletConnectService.getInstance().off(event: string, handler: Function)
```

#### Events

```typescript
'session_proposal' // When DApp requests connection
'session_request'  // When DApp requests signing
'session_delete'   // When session is disconnected
'session_approved' // When session is approved
'session_rejected' // When session is rejected
'request_responded' // When request is signed
'request_rejected'  // When request is rejected
'session_disconnected' // When session is manually disconnected
```

### Store Actions

```javascript
// Set WalletConnect request
setWalletConnectRequest(request: {
  type: 'session_proposal' | 'session_request',
  id: number,
  params: any,
  topic?: string
})

// Clear request
clearWalletConnectRequest()

// Approve session
await approveSession()

// Reject session
await rejectSession()

// Approve signing request
await approveRequest()

// Reject signing request
await rejectRequest()
```

## Troubleshooting

### Common Issues

#### "WalletConnect not initialized"
**Cause**: Service not initialized before pairing
**Solution**: Wait for initialization or call `initialize()` manually

#### "Invalid URI"
**Cause**: URI doesn't start with `wc:` or is malformed
**Solution**: Verify URI format, get fresh URI from DApp

#### "Failed to pair"
**Cause**: Network issues or expired URI
**Solution**: Get new URI, check internet connection

#### "Signature failed"
**Cause**: Wallet locked or mnemonic unavailable
**Solution**: Ensure wallet is unlocked before signing

#### "No modal appears"
**Cause**: WalletConnectModal not mounted or event listener not set up
**Solution**: Verify modal is in App.tsx, check browser console for errors

### Debugging

Enable console logging:
```javascript
// In WalletConnectService.ts, logs are already enabled
console.log('Session proposal received:', proposal);
console.log('Session request received:', request);
```

Check active sessions:
```javascript
const sessions = WalletConnectService.getInstance().getActiveSessions();
console.log('Active sessions:', sessions);
```

## Dependencies

```json
{
  "@walletconnect/web3wallet": "^1.16.1",
  "@walletconnect/core": "^2.17.1",
  "@walletconnect/utils": "^2.17.1",
  "@json-rpc-tools/utils": "^1.7.6",
  "react-qr-reader": "^3.0.0-beta-1"
}
```

## Future Enhancements

### Phase 2
- [ ] Real QR code scanning with camera (full react-qr-reader integration)
- [ ] Session management screen (view/disconnect active sessions)
- [ ] Request history
- [ ] Gas estimation before signing
- [ ] Transaction simulation/preview

### Phase 3
- [ ] Multi-chain support (Polygon, Arbitrum, etc.)
- [ ] NFT signing support
- [ ] Batch transactions
- [ ] Custom RPC endpoints
- [ ] Address book integration

### Phase 4
- [ ] Hardware wallet integration
- [ ] Multi-signature wallets
- [ ] Time-locked transactions
- [ ] Advanced security features

## Support

For issues or questions:
1. Check this documentation
2. Review console logs
3. Test with known working DApps (Uniswap testnet)
4. Verify testnet has funds
5. Create issue on GitHub with:
   - Steps to reproduce
   - Browser/platform info
   - Console errors
   - Screenshots

## References

- [WalletConnect v2 Documentation](https://docs.walletconnect.com/)
- [Web3Wallet SDK](https://docs.walletconnect.com/web3wallet/about)
- [Ethereum JSON-RPC Methods](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [ethers.js Documentation](https://docs.ethers.org/v5/)

---

**Last Updated**: 2024-11-19
**Version**: 1.1.0
**Status**: Production Ready (Testnet Only)
