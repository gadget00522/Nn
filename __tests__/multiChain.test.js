/**
 * @format
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

jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: mockCreateRandom,
      fromPhrase: mockFromPhrase,
    },
    JsonRpcProvider: jest.fn(() => ({})),
    isAddress: jest.fn(() => true),
    parseEther: jest.fn((val) => val),
    formatEther: jest.fn((val) => val),
  },
}));

// Import after mocks are defined
const useWalletStore = require('../src/store/walletStore').default;
const { SUPPORTED_NETWORKS } = require('../src/store/walletStore');

describe('Multi-Chain Support', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useWalletStore.setState({
      mnemonic: 'test mnemonic phrase',
      address: '0x1234567890123456789012345678901234567890',
      isWalletCreated: true,
      isWalletUnlocked: true,
      balance: '0',
      transactions: [],
      tokenBalances: [],
      currentNetwork: SUPPORTED_NETWORKS[0],
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('SUPPORTED_NETWORKS', () => {
    test('should export SUPPORTED_NETWORKS constant', () => {
      expect(SUPPORTED_NETWORKS).toBeDefined();
      expect(Array.isArray(SUPPORTED_NETWORKS)).toBe(true);
    });

    test('should have at least 2 networks configured', () => {
      expect(SUPPORTED_NETWORKS.length).toBeGreaterThanOrEqual(2);
    });

    test('each network should have required properties', () => {
      SUPPORTED_NETWORKS.forEach(network => {
        expect(network).toHaveProperty('name');
        expect(network).toHaveProperty('symbol');
        expect(network).toHaveProperty('rpcUrl');
        expect(network).toHaveProperty('chainId');
        expect(network).toHaveProperty('explorerUrl');
        expect(network).toHaveProperty('alchemyNetwork');
      });
    });

    test('should include Ethereum Sepolia', () => {
      const ethNetwork = SUPPORTED_NETWORKS.find(n => n.name === 'Ethereum Sepolia');
      expect(ethNetwork).toBeDefined();
      expect(ethNetwork.symbol).toBe('ETH');
      expect(ethNetwork.chainId).toBe(11155111);
    });

    test('should include Polygon Mumbai', () => {
      const polygonNetwork = SUPPORTED_NETWORKS.find(n => n.name === 'Polygon Mumbai');
      expect(polygonNetwork).toBeDefined();
      expect(polygonNetwork.symbol).toBe('MATIC');
      expect(polygonNetwork.chainId).toBe(80001);
    });
  });

  describe('currentNetwork state', () => {
    test('should initialize with first network by default', () => {
      const initialState = useWalletStore.getState();
      expect(initialState.currentNetwork).toBeDefined();
      expect(initialState.currentNetwork.name).toBe(SUPPORTED_NETWORKS[0].name);
    });

    test('should have currentNetwork in store', () => {
      const state = useWalletStore.getState();
      expect(state.currentNetwork).toBeDefined();
      expect(state.currentNetwork).toHaveProperty('name');
      expect(state.currentNetwork).toHaveProperty('symbol');
    });
  });

  describe('switchNetwork action', () => {
    test('should exist in actions', () => {
      const state = useWalletStore.getState();
      expect(state.actions.switchNetwork).toBeDefined();
      expect(typeof state.actions.switchNetwork).toBe('function');
    });

    test('should change current network', () => {
      const state = useWalletStore.getState();
      const newNetwork = SUPPORTED_NETWORKS[1];
      
      state.actions.switchNetwork(newNetwork);
      
      const updatedState = useWalletStore.getState();
      expect(updatedState.currentNetwork.name).toBe(newNetwork.name);
      expect(updatedState.currentNetwork.chainId).toBe(newNetwork.chainId);
    });

    test('should reset balance when switching networks', () => {
      useWalletStore.setState({ balance: '10.5' });
      
      const state = useWalletStore.getState();
      state.actions.switchNetwork(SUPPORTED_NETWORKS[1]);
      
      const updatedState = useWalletStore.getState();
      expect(updatedState.balance).toBe('0');
    });

    test('should reset transactions when switching networks', () => {
      useWalletStore.setState({ 
        transactions: [
          { hash: '0xabc', value: '1.0' },
          { hash: '0xdef', value: '2.0' }
        ]
      });
      
      const state = useWalletStore.getState();
      state.actions.switchNetwork(SUPPORTED_NETWORKS[1]);
      
      const updatedState = useWalletStore.getState();
      expect(updatedState.transactions).toEqual([]);
    });

    test('should reset token balances when switching networks', () => {
      useWalletStore.setState({ 
        tokenBalances: [
          { symbol: 'USDC', balance: '100' },
          { symbol: 'DAI', balance: '50' }
        ]
      });
      
      const state = useWalletStore.getState();
      state.actions.switchNetwork(SUPPORTED_NETWORKS[1]);
      
      const updatedState = useWalletStore.getState();
      expect(updatedState.tokenBalances).toEqual([]);
    });

    test('should be able to switch between multiple networks', () => {
      const state = useWalletStore.getState();
      
      // Switch to second network
      state.actions.switchNetwork(SUPPORTED_NETWORKS[1]);
      let updatedState = useWalletStore.getState();
      expect(updatedState.currentNetwork.name).toBe(SUPPORTED_NETWORKS[1].name);
      
      // Switch back to first network
      state.actions.switchNetwork(SUPPORTED_NETWORKS[0]);
      updatedState = useWalletStore.getState();
      expect(updatedState.currentNetwork.name).toBe(SUPPORTED_NETWORKS[0].name);
    });
  });

  describe('fetchData with network support', () => {
    test('should use current network for fetching data', async () => {
      const mockAlchemy = {
        core: {
          getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
          getTokenBalances: jest.fn().mockResolvedValue({ tokenBalances: [] }),
          getAssetTransfers: jest.fn().mockResolvedValue({ transfers: [] }),
        },
      };

      const AlchemyMock = require('alchemy-sdk').Alchemy;
      AlchemyMock.mockImplementation(() => mockAlchemy);

      const state = useWalletStore.getState();
      await state.actions.fetchData();

      // Verify Alchemy was called with current network settings
      expect(AlchemyMock).toHaveBeenCalled();
      const alchemyCall = AlchemyMock.mock.calls[AlchemyMock.mock.calls.length - 1][0];
      expect(alchemyCall.network).toBe(SUPPORTED_NETWORKS[0].alchemyNetwork);
    });

    test('should use different network settings after switching', async () => {
      const mockAlchemy = {
        core: {
          getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
          getTokenBalances: jest.fn().mockResolvedValue({ tokenBalances: [] }),
          getAssetTransfers: jest.fn().mockResolvedValue({ transfers: [] }),
        },
      };

      const AlchemyMock = require('alchemy-sdk').Alchemy;
      AlchemyMock.mockImplementation(() => mockAlchemy);

      const state = useWalletStore.getState();
      
      // Switch to Polygon
      state.actions.switchNetwork(SUPPORTED_NETWORKS[1]);
      
      await state.actions.fetchData();

      // Verify Alchemy was called with Polygon network settings
      expect(AlchemyMock).toHaveBeenCalled();
      const alchemyCall = AlchemyMock.mock.calls[AlchemyMock.mock.calls.length - 1][0];
      expect(alchemyCall.network).toBe(SUPPORTED_NETWORKS[1].alchemyNetwork);
    });
  });

  describe('sendTransaction with network support', () => {
    test('should use current network RPC URL', async () => {
      const { ethers } = require('ethers');
      
      // Mock wallet methods
      const mockWallet = {
        connect: jest.fn().mockReturnThis(),
        sendTransaction: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({}),
        }),
      };
      
      mockFromPhrase.mockReturnValue(mockWallet);
      
      const state = useWalletStore.getState();
      
      try {
        await state.actions.sendTransaction('0x0000000000000000000000000000000000000000', '0.1');
      } catch (error) {
        // Transaction might fail in test, but we're checking if provider was called
      }

      // Verify JsonRpcProvider was called with current network's RPC URL
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(SUPPORTED_NETWORKS[0].rpcUrl);
    });

    test('should use different RPC URL after switching networks', async () => {
      const { ethers } = require('ethers');
      
      // Mock wallet methods
      const mockWallet = {
        connect: jest.fn().mockReturnThis(),
        sendTransaction: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({}),
        }),
      };
      
      mockFromPhrase.mockReturnValue(mockWallet);
      
      const state = useWalletStore.getState();
      
      // Switch to Polygon
      state.actions.switchNetwork(SUPPORTED_NETWORKS[1]);
      
      try {
        await state.actions.sendTransaction('0x0000000000000000000000000000000000000000', '0.1');
      } catch (error) {
        // Transaction might fail in test, but we're checking if provider was called
      }

      // Verify JsonRpcProvider was called with Polygon's RPC URL
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(SUPPORTED_NETWORKS[1].rpcUrl);
    });
  });
});
