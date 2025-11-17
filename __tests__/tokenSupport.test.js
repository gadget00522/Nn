/**
 * @format
 * Tests for ERC-20 token support
 */

// Mock the dependencies
jest.mock('react-native-keychain');

// Mock alchemy-sdk
jest.mock('alchemy-sdk', () => ({
  Alchemy: jest.fn(),
  Network: {
    ETH_SEPOLIA: 'eth-sepolia',
  },
}));

// Create mock functions for ethers
const mockCreateRandom = jest.fn();
const mockFromPhrase = jest.fn();
const mockConnect = jest.fn();
const mockSendTransaction = jest.fn();
const mockWait = jest.fn();
const mockGetBalance = jest.fn();
const mockIsAddress = jest.fn();
const mockParseEther = jest.fn();
const mockParseUnits = jest.fn();
const mockFormatEther = jest.fn();
const mockTransfer = jest.fn();
const mockContract = jest.fn();

jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: mockCreateRandom,
      fromPhrase: mockFromPhrase,
    },
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: mockGetBalance,
    })),
    Contract: mockContract,
    isAddress: mockIsAddress,
    parseEther: mockParseEther,
    parseUnits: mockParseUnits,
    formatEther: mockFormatEther,
  },
}));

// Import after mocks are defined
const useWalletStore = require('../src/store/walletStore').default;

describe('WalletStore - ERC-20 Token Support', () => {
  let store;

  beforeEach(() => {
    // Reset the store state before each test
    store = useWalletStore.getState();
    useWalletStore.setState({
      mnemonic: null,
      address: null,
      isWalletCreated: false,
      isWalletUnlocked: false,
      balance: '0',
      currentScreen: 'dashboard',
      isSending: false,
      sendError: null,
      tokenBalances: [],
      assetToSend: null,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initial State - Token Fields', () => {
    it('should have tokenBalances array in initial state', () => {
      store = useWalletStore.getState();
      expect(store.tokenBalances).toBeDefined();
      expect(Array.isArray(store.tokenBalances)).toBe(true);
      expect(store.tokenBalances).toEqual([]);
    });

    it('should have assetToSend set to null in initial state', () => {
      store = useWalletStore.getState();
      expect(store.assetToSend).toBeNull();
    });
  });

  describe('setScreen action with asset parameter', () => {
    it('should accept asset parameter and set assetToSend', () => {
      const mockAsset = {
        symbol: 'USDT',
        balance: '100.0',
        contractAddress: '0xabc123',
        decimals: 6,
      };

      useWalletStore.getState().actions.setScreen('send', mockAsset);
      store = useWalletStore.getState();
      
      expect(store.currentScreen).toBe('send');
      expect(store.assetToSend).toEqual(mockAsset);
    });

    it('should clear assetToSend when null is passed', () => {
      // First set an asset
      const mockAsset = {
        symbol: 'USDT',
        balance: '100.0',
        contractAddress: '0xabc123',
        decimals: 6,
      };
      useWalletStore.setState({ assetToSend: mockAsset });

      // Then clear it
      useWalletStore.getState().actions.setScreen('dashboard', null);
      store = useWalletStore.getState();
      
      expect(store.currentScreen).toBe('dashboard');
      expect(store.assetToSend).toBeNull();
    });

    it('should work with no asset parameter (backward compatible)', () => {
      useWalletStore.getState().actions.setScreen('receive');
      store = useWalletStore.getState();
      
      expect(store.currentScreen).toBe('receive');
      expect(store.assetToSend).toBeNull();
    });
  });

  describe('sendTransaction with ERC-20 tokens', () => {
    beforeEach(() => {
      // Setup common mocks
      mockIsAddress.mockReturnValue(true);
      mockParseUnits.mockReturnValue('100000000'); // 100 USDT with 6 decimals
      mockWait.mockResolvedValue({ status: 1 });
      mockTransfer.mockResolvedValue({
        wait: mockWait,
        hash: '0xtoken123',
      });
      mockContract.mockImplementation(() => ({
        transfer: mockTransfer,
      }));
      mockConnect.mockReturnValue({
        sendTransaction: mockSendTransaction,
      });
      mockFromPhrase.mockReturnValue({
        connect: mockConnect,
      });
    });

    it('should send ERC-20 token when assetToSend has contractAddress', async () => {
      const mockToken = {
        symbol: 'USDT',
        balance: '100.0',
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6,
      };

      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        assetToSend: mockToken,
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '50.0'
      );
      
      // Verify Contract was instantiated
      expect(mockContract).toHaveBeenCalled();
      
      // Verify parseUnits was called with correct decimals
      expect(mockParseUnits).toHaveBeenCalledWith('50.0', 6);
      
      // Verify transfer was called
      expect(mockTransfer).toHaveBeenCalledWith(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '100000000'
      );
      
      store = useWalletStore.getState();
      expect(store.isSending).toBe(false);
      expect(store.sendError).toBeNull();
    });

    it('should send ETH when assetToSend has no contractAddress', async () => {
      const mockEth = {
        symbol: 'ETH',
        balance: '1.5',
        contractAddress: null,
        decimals: 18,
      };

      mockParseEther.mockReturnValue('1000000000000000000');
      mockSendTransaction.mockResolvedValue({
        wait: mockWait,
        hash: '0xeth123',
      });

      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        assetToSend: mockEth,
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      // Verify parseEther was called for ETH
      expect(mockParseEther).toHaveBeenCalledWith('1.0');
      
      // Verify sendTransaction was called (not transfer)
      expect(mockSendTransaction).toHaveBeenCalled();
      
      store = useWalletStore.getState();
      expect(store.isSending).toBe(false);
      expect(store.sendError).toBeNull();
    });

    it('should send ETH when assetToSend is null', async () => {
      mockParseEther.mockReturnValue('1000000000000000000');
      mockSendTransaction.mockResolvedValue({
        wait: mockWait,
        hash: '0xeth123',
      });

      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        assetToSend: null,
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      // Verify parseEther was called for ETH
      expect(mockParseEther).toHaveBeenCalledWith('1.0');
      
      // Verify sendTransaction was called (not transfer)
      expect(mockSendTransaction).toHaveBeenCalled();
      
      store = useWalletStore.getState();
      expect(store.isSending).toBe(false);
      expect(store.sendError).toBeNull();
    });

    it('should handle token transfer errors gracefully', async () => {
      const mockToken = {
        symbol: 'USDT',
        balance: '100.0',
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6,
      };

      mockTransfer.mockRejectedValue(new Error('Insufficient token balance'));

      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        assetToSend: mockToken,
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '200.0'
      );
      
      store = useWalletStore.getState();
      expect(store.sendError).toBe('Insufficient token balance');
      expect(store.isSending).toBe(false);
    });
  });
});
