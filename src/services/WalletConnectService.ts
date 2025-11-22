import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { getSdkError } from '@walletconnect/utils';

/**
 * Service WalletConnect v2.
 * Classe Singleton pour gérer les sessions et les requêtes WalletConnect.
 * 
 * TESTNET UNIQUEMENT - L'identifiant de projet (projectId) par défaut est destiné aux tests.
 */
class WalletConnectService {
  private static instance: WalletConnectService;
  private web3wallet: IWeb3Wallet | null = null;
  private initialized: boolean = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  // Default test projectId - should be made configurable via environment
  private projectId: string = '459794b1313534b16626642592582276';

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Obtient l'instance unique du service (Singleton).
   *
   * @returns {WalletConnectService} L'instance du service WalletConnect.
   */
  public static getInstance(): WalletConnectService {
    if (!WalletConnectService.instance) {
      WalletConnectService.instance = new WalletConnectService();
    }
    return WalletConnectService.instance;
  }

  /**
   * Initialise le portefeuille Web3 avec le noyau WalletConnect.
   *
   * @param {string} [customProjectId] - Identifiant de projet personnalisé optionnel.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'initialisation terminée.
   * @throws {Error} Si l'initialisation échoue.
   */
  public async initialize(customProjectId?: string): Promise<void> {
    if (this.initialized && this.web3wallet) {
      return;
    }

    try {
      if (customProjectId) {
        this.projectId = customProjectId;
      }

      const core = new Core({
        projectId: this.projectId,
      });

      this.web3wallet = await Web3Wallet.init({
        core,
        metadata: {
          name: 'Malin Wallet',
          description: 'A simple testnet wallet for Ethereum',
          url: 'https://pulseailab.me',
          icons: ['https://pulseailab.me/icon.png'],
        },
      });

      this.setupEventListeners();
      this.initialized = true;
      console.log('WalletConnect initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Configure les écouteurs d'événements pour les événements WalletConnect.
   * Écoute les propositions de session, les requêtes de session et les suppressions de session.
   *
   * @private
   */
  private setupEventListeners(): void {
    if (!this.web3wallet) return;

    // Listen for session proposals
    this.web3wallet.on('session_proposal', (proposal) => {
      console.log('Session proposal received:', proposal);
      this.emit('session_proposal', proposal);
    });

    // Listen for session requests (sign transactions, messages, etc.)
    this.web3wallet.on('session_request', (request) => {
      console.log('Session request received:', request);
      this.emit('session_request', request);
    });

    // Listen for session deletions
    this.web3wallet.on('session_delete', (session) => {
      console.log('Session deleted:', session);
      this.emit('session_delete', session);
    });
  }

  /**
   * S'appaire avec une DApp en utilisant une URI WalletConnect.
   *
   * @param {string} uri - L'URI WalletConnect provenant d'un code QR ou d'une saisie manuelle.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'appairage initié.
   * @throws {Error} Si WalletConnect n'est pas initialisé ou si l'appairage échoue.
   */
  public async pair(uri: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized. Call initialize() first.');
    }

    try {
      await this.web3wallet.core.pairing.pair({ uri });
      console.log('Pairing initiated successfully');
    } catch (error) {
      console.error('Failed to pair:', error);
      throw error;
    }
  }

  /**
   * Approuve une proposition de session.
   *
   * @param {number} proposalId - L'ID de la proposition reçu via l'événement `session_proposal`.
   * @param {string[]} accounts - Tableau des comptes à approuver (format: "eip155:1:0x...").
   * @param {number} chainId - L'ID de la chaîne (ex: 11155111 pour Sepolia).
   * @returns {Promise<void>} Une promesse qui se résout une fois la session approuvée.
   * @throws {Error} Si WalletConnect n'est pas initialisé ou si l'approbation échoue.
   */
  public async approveSession(
    proposalId: number,
    accounts: string[],
    chainId: number
  ): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      const session = await this.web3wallet.approveSession({
        id: proposalId,
        namespaces: {
          eip155: {
            accounts: accounts,
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
              'eth_signTypedData_v4',
            ],
            events: ['chainChanged', 'accountsChanged'],
            chains: [`eip155:${chainId}`],
          },
        },
      });
      console.log('Session approved:', session);
      this.emit('session_approved', session);
    } catch (error) {
      console.error('Failed to approve session:', error);
      throw error;
    }
  }

  /**
   * Rejette une proposition de session.
   *
   * @param {number} proposalId - L'ID de la proposition reçu via l'événement `session_proposal`.
   * @returns {Promise<void>} Une promesse qui se résout une fois la session rejetée.
   * @throws {Error} Si WalletConnect n'est pas initialisé ou si le rejet échoue.
   */
  public async rejectSession(proposalId: number): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.rejectSession({
        id: proposalId,
        reason: getSdkError('USER_REJECTED'),
      });
      console.log('Session rejected');
      this.emit('session_rejected', { proposalId });
    } catch (error) {
      console.error('Failed to reject session:', error);
      throw error;
    }
  }

  /**
   * Répond à une demande de session (approbation).
   *
   * @param {string} topic - Le sujet (topic) de la session.
   * @param {number} requestId - L'ID de la requête.
   * @param {any} result - Le résultat à renvoyer à la DApp.
   * @returns {Promise<void>} Une promesse qui se résout une fois la réponse envoyée.
   * @throws {Error} Si WalletConnect n'est pas initialisé ou si la réponse échoue.
   */
  public async respondRequest(
    topic: string,
    requestId: number,
    result: any
  ): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.respondSessionRequest({
        topic,
        response: {
          id: requestId,
          jsonrpc: '2.0',
          result: result,
        },
      });
      console.log('Request responded successfully');
      this.emit('request_responded', { topic, requestId, result });
    } catch (error) {
      console.error('Failed to respond to request:', error);
      throw error;
    }
  }

  /**
   * Rejette une demande de session.
   *
   * @param {string} topic - Le sujet (topic) de la session.
   * @param {number} requestId - L'ID de la requête.
   * @returns {Promise<void>} Une promesse qui se résout une fois la demande rejetée.
   * @throws {Error} Si WalletConnect n'est pas initialisé ou si le rejet échoue.
   */
  public async rejectRequest(
    topic: string,
    requestId: number
  ): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.respondSessionRequest({
        topic,
        response: {
          id: requestId,
          jsonrpc: '2.0',
          error: getSdkError('USER_REJECTED_METHODS'),
        },
      });
      console.log('Request rejected');
      this.emit('request_rejected', { topic, requestId });
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les sessions actives.
   *
   * @returns {Record<string, any>} Un objet contenant les sessions actives.
   */
  public getActiveSessions(): Record<string, any> {
    if (!this.web3wallet) {
      return {};
    }
    return this.web3wallet.getActiveSessions();
  }

  /**
   * Déconnecte une session.
   *
   * @param {string} topic - Le sujet (topic) de la session à déconnecter.
   * @returns {Promise<void>} Une promesse qui se résout une fois la session déconnectée.
   * @throws {Error} Si WalletConnect n'est pas initialisé ou si la déconnexion échoue.
   */
  public async disconnectSession(topic: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.disconnectSession({
        topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });
      console.log('Session disconnected');
      this.emit('session_disconnected', { topic });
    } catch (error) {
      console.error('Failed to disconnect session:', error);
      throw error;
    }
  }

  /**
   * S'abonne à un événement.
   *
   * @param {string} event - Le nom de l'événement.
   * @param {Function} handler - La fonction de gestion de l'événement.
   */
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Se désabonne d'un événement.
   *
   * @param {string} event - Le nom de l'événement.
   * @param {Function} handler - La fonction de gestion de l'événement à retirer.
   */
  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Émet un événement à tous les abonnés.
   *
   * @private
   * @param {string} event - Le nom de l'événement.
   * @param {any} data - Les données de l'événement.
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Vérifie si WalletConnect est initialisé.
   *
   * @returns {boolean} True si le service est initialisé, sinon False.
   */
  public isInitialized(): boolean {
    return this.initialized && this.web3wallet !== null;
  }
}

export default WalletConnectService;
