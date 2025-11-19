import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { getSdkError } from '@walletconnect/utils';

/**
 * WalletConnect v2 Service
 * Singleton class to manage WalletConnect sessions and requests
 * 
 * TESTNET ONLY - Default projectId is for testing purposes
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
   * Get singleton instance
   */
  public static getInstance(): WalletConnectService {
    if (!WalletConnectService.instance) {
      WalletConnectService.instance = new WalletConnectService();
    }
    return WalletConnectService.instance;
  }

  /**
   * Initialize Web3Wallet with WalletConnect Core
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
   * Setup event listeners for WalletConnect events
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
   * Pair with a DApp using WalletConnect URI
   * @param uri - WalletConnect URI from QR code or manual input
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
   * Approve a session proposal
   * @param proposalId - Proposal ID from session_proposal event
   * @param accounts - Array of accounts to approve (format: "eip155:1:0x...")
   * @param chainId - Chain ID (e.g., 11155111 for Sepolia)
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
   * Reject a session proposal
   * @param proposalId - Proposal ID from session_proposal event
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
   * Respond to a session request (approve)
   * @param topic - Session topic
   * @param requestId - Request ID
   * @param result - Result to send back to DApp
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
   * Reject a session request
   * @param topic - Session topic
   * @param requestId - Request ID
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
   * Get all active sessions
   */
  public getActiveSessions(): Record<string, any> {
    if (!this.web3wallet) {
      return {};
    }
    return this.web3wallet.getActiveSessions();
  }

  /**
   * Disconnect a session
   * @param topic - Session topic to disconnect
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
   * Subscribe to events
   * @param event - Event name
   * @param handler - Event handler function
   */
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   * @param event - Event name
   * @param handler - Event handler function
   */
  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param event - Event name
   * @param data - Event data
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
   * Check if WalletConnect is initialized
   */
  public isInitialized(): boolean {
    return this.initialized && this.web3wallet !== null;
  }
}

export default WalletConnectService;
