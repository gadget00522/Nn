# WalletConnect Intégration – Malin Wallet

Ce guide explique comment l’intégration WalletConnect fonctionne dans Malin Wallet (testnet uniquement), comment l’utilisateur établit une session avec une DApp, signe des messages et approuve des transactions.

> IMPORTANT: Environnement de test – Ne pas utiliser pour la production.
> - Mnemonic chiffrée localement (Argon2id v2 ou PBKDF2 v1 en fallback) sur le Web (démo)
> - Sur mobile (si déploiement natif), la mnemonic serait stockée dans un stockage sécurisé (ex: Keychain)
> - Pas de hardware wallet, pas d’extension navigateur, pas de sécurité avancée

---

## 1. Flux Général

1. L’utilisateur ouvre Malin Wallet.
2. Sur une DApp compatible (ex: Uniswap testnet), l’utilisateur récupère ou scanne un URI WalletConnect v2.
3. Malin Wallet initialise une session via le service `WalletConnectService`.
4. Une modale s’affiche dans l’app pour approuver ou refuser la proposition de session.
5. Une fois la session approuvée, la DApp peut initier des requêtes (signature de message, transactions).
6. Chaque requête (session_request) est affichée avec détails → l’utilisateur approuve ou rejette.
7. La réponse est renvoyée à la DApp via `respondRequest`.

---

## 2. Terminologie

| Terme | Description |
|-------|-------------|
| Session Proposal | Demande initiale d’une DApp pour se connecter au wallet |
| Session Request | Action spécifique (signature, transaction, etc.) |
| URI WalletConnect | Chaîne `wc:` utilisée pour initier la connexion |
| Approve / Reject | Actions utilisateur pour autoriser ou refuser |
| Testnet | Réseaux Sepolia / Mumbai utilisés ici |

---

## 3. Écrans Utilisateur

| Écran | Rôle |
|-------|------|
| ScanScreen | Permet de scanner un QR code ou saisir l’URI manuellement |
| WalletConnectModal | Affiche proposition/session_request (signature, transaction) |
| Dashboard | Vue principale du wallet |
| Settings | Paramètres (langue, thème, sécurité) |

---

## 4. Scénarios d’Utilisation

### Scénario 1: Connexion via QR Code

1. Sur la DApp → bouton “Connect Wallet”.
2. Affichage d’un QR code WalletConnect.
3. Dans Malin Wallet → ouvrir ScanScreen.
4. Scanner le QR code → URI récupéré.
5. WalletConnectService.pair(uri) est appelé.
6. Modale de Session Proposal s’affiche.
7. Utilisateur clique “Approuver”.
8. Session établie, la DApp reçoit confirmation.

### Scénario 2: Signature de Message

1. Sur la DApp → action nécessite signature (ex: login off-chain).
2. DApp envoie `session_request` avec `method: personal_sign` ou `eth_sign`.
3. Malin Wallet affiche contenu du message dans WalletConnectModal.
4. Utilisateur vérifie et approuve.
5. Le wallet (ethers v5) signe via `wallet.signMessage()` ou `_signTypedData()`.
6. Signature renvoyée à la DApp → succès.

### Scénario 3: Transaction On-Chain

1. DApp envoie `eth_sendTransaction` dans `session_request`.
2. Modale affiche destinataire, montant, réseau.
3. L’utilisateur approuve.
4. Le wallet envoie la transaction via `connectedWallet.sendTransaction(tx)`.
5. Hash renvoyé à la DApp.
6. Une fois confirmée, l’utilisateur voit la mise à jour dans Dashboard après `fetchData()`.

### Scénario 4: URI Manuel (Pas de Caméra)

1. Sur la DApp, copier l’URI commençant par `wc:`.
2. Dans ScanScreen, coller l’URI dans le champ texte.
3. Cliquer “Connecter”.
4. Modale de proposition → approuver.
5. Session active.

---

## 5. Architecture

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
WalletConnectModal (écoute store)
    ↓
    | setWalletConnectRequest()
    ↓
walletStore
    ↓
    | User clique "Approuver"
    ↓
approveSession()
    ↓
WalletConnectService.approveSession()
    ↓
    | Session approuvée
    ↓
DApp reçoit confirmation
```

### Data Flow pour Signature

```
DApp → session_request (personal_sign / eth_signTypedData)
    ↓
WalletConnectModal affiche message / typedData
    ↓
User approuve
    ↓
approveRequest()
    ↓
ethers.Wallet.fromMnemonic(mnemonic)
    ↓
signMessage() ou _signTypedData()
    ↓
WalletConnectService.respondRequest()
    ↓
DApp reçoit la signature
```

---

## 6. Détails Techniques

### Store (walletStore)

- `walletConnectRequest`: objet stockant la proposition ou requête active.
- Actions:
  - `setWalletConnectRequest()`
  - `approveSession(id, accounts, chainId)`
  - `rejectSession(id)`
  - `approveRequest()` gère:
    - `eth_sign`
    - `personal_sign`
    - `eth_signTypedData` / `_v4`
    - `eth_sendTransaction`
    - `eth_signTransaction`
  - `rejectRequest()`

### WalletConnectService (pseudo)

```typescript
class WalletConnectService {
  private static instance: WalletConnectService;
  private web3wallet: Web3Wallet;

  static getInstance() {
    if (!this.instance) this.instance = new WalletConnectService();
    return this.instance;
  }

  async initialize(projectId: string) {
    this.web3wallet = await Web3Wallet.init({ projectId, metadata: { name: 'Malin Wallet', description: 'Testnet Wallet', url: 'https://pulseailab.me', icons: [] } });
    this.web3wallet.on('session_proposal', this.onSessionProposal);
    this.web3wallet.on('session_request', this.onSessionRequest);
  }

  private onSessionProposal = (proposal) => {
    // set walletConnectRequest in store with type 'session_proposal'
  }

  private onSessionRequest = (event) => {
    // set walletConnectRequest in store with type 'session_request'
  }

  async approveSession(id: number, accounts: string[], chainId: number) {
    await this.web3wallet.approveSession({
      id,
      relayProtocol: 'irn',
      namespaces: {
        eip155: {
          chains: [`eip155:${chainId}`],
          accounts,
          methods: ['eth_sendTransaction','eth_signTransaction','personal_sign','eth_sign','eth_signTypedData','eth_signTypedData_v4'],
          events: []
        }
      }
    });
  }

  async rejectSession(id: number) {
    await this.web3wallet.rejectSession({ id, reason: { code: 5000, message: 'User rejected' } });
  }

  async respondRequest(topic: string, id: number, result: any) {
    await this.web3wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: '2.0', result }
    });
  }

  async rejectRequest(topic: string, id: number) {
    await this.web3wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: '2.0', error: { code: 5000, message: 'User rejected request' } }
    });
  }
}
```

### Signature Typed Data

Pour `eth_signTypedData_v4`:
```typescript
const typedData = JSON.parse(request.params[1]);
const signature = wallet._signTypedData(typedData.domain, typedData.types, typedData.message);
```

### Transaction Example

```typescript
const txRequest = request.params[0];
const tx = {
  to: txRequest.to,
  value: txRequest.value ? ethers.BigNumber.from(txRequest.value) : undefined,
  data: txRequest.data,
  gasLimit: txRequest.gas ? ethers.BigNumber.from(txRequest.gas) : undefined,
  gasPrice: txRequest.gasPrice ? ethers.BigNumber.from(txRequest.gasPrice) : undefined,
};
const txResponse = await connectedWallet.sendTransaction(tx);
```

---

## 7. Sécurité (Testnet)

### Implémenté

- Avertissements avant approbation session.
- Détails transaction visibles.
- Message en clair avant signature.
- Chiffrement local (version 2: Argon2id + AES-GCM) sur web (démo).
- Auto-lock configurable (0 / 1 / 5 / 15 min).

### Non Implémenté (Production)

- Pas de hardware wallet.
- Pas de sandbox d’extension.
- Pas de multi-signature.
- Pas de rate limiting dynamique.
- Pas de module anti-phishing.

### Recommandations Production

1. Extension navigateur avec isolation (comme MetaMask).
2. Stockage chiffré hors localStorage (IndexedDB + WebCrypto, salt par session).
3. Intégration hardware wallet (Ledger/Trezor).
4. Journalisation sécurisée des actions (audit).
5. Rate limiting sur méthodes critiques.
6. Confirmation renforcée pour montants élevés (2FA / délai).

---

## 8. Gestion des Erreurs

| Type | Cause | Réponse |
|------|-------|---------|
| session_proposal invalide | URI malformé | Rejet avec message |
| méthode non supportée | request.method hors liste | Toast + rejectRequest |
| signature échoue | mnemonic absente / déverrouillage | Toast + lock |
| transaction revert | Smart contract error | message d’erreur + affichage hash si existant |
| integrity failed (v2) | Falsification payload | Forcer wipe + message critique |

---

## 9. Variables Importantes

| Variable | Description |
|----------|-------------|
| mnemonic | Phrase de récupération (chiffrée localement) |
| walletConnectRequest | Objet actif (proposal ou request) |
| currentNetwork | Détermine RPC / ChainId |
| encryptionVersion | 1 (PBKDF2) ou 2 (Argon2id) |
| autoLockMinutes | Durée avant verrouillage automatique |

---

## 10. Migration Chiffrement

Si payload v1 détecté:
1. Utilisateur ouvre Settings.
2. Entre mot de passe actuel.
3. Clique “Upgrade Encryption”.
4. Déchiffrement PBKDF2 → réchiffrement Argon2id (version:2).
5. Vérifie localStorage: clé `wallet.encryptedMnemonic.v` contient `"version":2,"kdf":"argon2id"`.

---

## 11. Limites Connues

| Limite | Impact |
|--------|--------|
| localStorage sur web | Exposition potentielle si XSS |
| Pas de signature hors-ligne | Doit être en ligne pour RPC |
| Pas de multi-compte | Un seul compte affiché |
| Pas de validation de type avancée sur typedData | Risque si schéma malicieux |
| UI non internationalisée entièrement | Certains textes encore en dur |

---

## 12. Étapes Futur

1. Ajouter hardware wallet.
2. Support multi comptes / dérivations (m/44’/60’).
3. Implémenter signature hors-ligne + file d’attente.
4. Améliorer logs d’audit.
5. Ajouter filtrage DApps “fiables”.
6. Localisation complète (toutes chaînes via i18n).

---

## 13. Exemple Complet de Réponse Session Request (signature)

```typescript
case 'personal_sign': {
  const message = request.params[0];
  const signature = await connectedWallet.signMessage(
    ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message
  );
  await wcService.respondRequest(topic, id, signature);
  break;
}
```

---

## 14. Nettoyage Session

- Sur logout / wipe wallet:
  - Réinitialiser store (`walletConnectRequest = null`)
  - Appeler éventuellement `web3wallet.disconnectSession()` (si mis en œuvre)
  - Purger payload chiffré si souhaité (`wipeWallet()`)

---

## 15. FAQ

| Question | Réponse |
|----------|---------|
| Pourquoi Argon2id ? | Meilleure résistance aux attaques GPU/mémoire que PBKDF2 |
| Pourquoi AES-GCM ? | Authenticated encryption (intégrité + confidentialité) |
| Peut-on ajouter des réseaux ? | Oui → append dans SUPPORTED_NETWORKS |
| Comment gérer typedData complexe ? | Parse JSON puis `_signTypedData(domain, types, message)` |
| Pourquoi un “swap” envoi-vers-soi ? | Démo testnet simplifiée (simulateur de transaction) |

---

## 16. Avertissement Final

Ce guide décrit une implémentation DEMO. Pour la production:
- Retirer toute conservation directe de la mnemonic côté navigateur non durci.
- Utiliser des solutions spécialisées de wallet.
- Auditer le code (sécurité / cryptographie).
- Ajouter tests et revues pour chaque méthode critique WalletConnect.

---

_Fin du guide._
