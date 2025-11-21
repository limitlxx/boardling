# WebZjs Frontend Implementation Guide

This guide shows you how to implement WebZjs in your frontend application for browser-based Zcash wallet functionality.

## Overview

WebZjs is a browser-focused Zcash client library that enables wallet operations directly in the browser without requiring a full node. It uses gRPC-web proxies to connect to remote lightwalletd services.

### Key Benefits
- ✅ No server infrastructure required
- ✅ No RocksDB or C++ compilation issues
- ✅ Fast setup and development
- ✅ Browser-native implementation
- ✅ ChainSafe hosted proxies available

## Prerequisites

- Node.js 18+ and npm/yarn
- Modern browser with WebAssembly support
- Basic JavaScript/TypeScript knowledge

## Installation

### 1. Install WebZjs Package

```bash
# Using npm
npm install @chainsafe/webzjs-wallet

# Using yarn
yarn add @chainsafe/webzjs-wallet
```

### 2. Optional: Build Requirements (for custom builds)

```bash
# Install Rust nightly
rustup install nightly-2024-08-07

# Install wasm-pack
cargo install wasm-pack

# Install Clang 17+ (macOS)
brew install llvm
```

## Basic Implementation

### 1. Initialize WebZjs

Create a wallet service to manage WebZjs operations:

```javascript
// src/services/webzjsWallet.js
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

class WebZjsWalletService {
  constructor() {
    this.wallet = null;
    this.initialized = false;
    this.network = 'testnet'; // or 'mainnet'
  }

  // Initialize WebZjs (call once per page load)
  async initialize() {
    if (this.initialized) return;
    
    try {
      await initWasm();
      await initThreadPool(navigator.hardwareConcurrency || 4);
      this.initialized = true;
      console.log('WebZjs initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebZjs:', error);
      throw error;
    }
  }

  // Get proxy URL based on network
  getProxyUrl() {
    return this.network === 'mainnet' 
      ? 'https://zcash-mainnet.chainsafe.dev'
      : 'https://zcash-testnet.chainsafe.dev';
  }

  // Create new wallet
  async createWallet() {
    await this.initialize();
    
    try {
      this.wallet = await Wallet.create();
      console.log('New wallet created');
      return this.wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  // Restore wallet from mnemonic
  async restoreWallet(mnemonic) {
    await this.initialize();
    
    try {
      this.wallet = await Wallet.fromMnemonic(mnemonic);
      console.log('Wallet restored from mnemonic');
      return this.wallet;
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      throw error;
    }
  }

  // Synchronize wallet with network
  async syncWallet() {
    if (!this.wallet) {
      throw new Error('No wallet available. Create or restore a wallet first.');
    }

    try {
      const proxyUrl = this.getProxyUrl();
      console.log(`Syncing with ${this.network} via ${proxyUrl}`);
      
      await this.wallet.synchronize(proxyUrl);
      console.log('Wallet synchronized successfully');
    } catch (error) {
      console.error('Failed to sync wallet:', error);
      throw error;
    }
  }

  // Get wallet address
  getAddress() {
    if (!this.wallet) {
      throw new Error('No wallet available');
    }
    return this.wallet.getAddress();
  }

  // Get wallet balance
  async getBalance() {
    if (!this.wallet) {
      throw new Error('No wallet available');
    }
    
    try {
      const balance = await this.wallet.getBalance();
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Get wallet mnemonic (for backup)
  getMnemonic() {
    if (!this.wallet) {
      throw new Error('No wallet available');
    }
    return this.wallet.getMnemonic();
  }

  // Switch network
  setNetwork(network) {
    if (!['mainnet', 'testnet'].includes(network)) {
      throw new Error('Invalid network. Use "mainnet" or "testnet"');
    }
    this.network = network;
  }
}

export default WebZjsWalletService;
```

### 2. React Component Example

```jsx
// src/components/WebZjsWallet.jsx
import React, { useState, useEffect } from 'react';
import WebZjsWalletService from '../services/webzjsWallet';

const WebZjsWallet = () => {
  const [walletService] = useState(new WebZjsWalletService());
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState('testnet');

  // Initialize WebZjs on component mount
  useEffect(() => {
    const initializeWebZjs = async () => {
      try {
        await walletService.initialize();
      } catch (err) {
        setError(`Failed to initialize WebZjs: ${err.message}`);
      }
    };

    initializeWebZjs();
  }, [walletService]);

  // Create new wallet
  const handleCreateWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      walletService.setNetwork(network);
      const newWallet = await walletService.createWallet();
      setWallet(newWallet);
      
      const walletAddress = walletService.getAddress();
      const walletMnemonic = walletService.getMnemonic();
      
      setAddress(walletAddress);
      setMnemonic(walletMnemonic);
      
      // Auto-sync after creation
      await handleSyncWallet();
    } catch (err) {
      setError(`Failed to create wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Restore wallet from mnemonic
  const handleRestoreWallet = async (inputMnemonic) => {
    if (!inputMnemonic.trim()) {
      setError('Please enter a valid mnemonic phrase');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      walletService.setNetwork(network);
      const restoredWallet = await walletService.restoreWallet(inputMnemonic);
      setWallet(restoredWallet);
      
      const walletAddress = walletService.getAddress();
      setAddress(walletAddress);
      setMnemonic(inputMnemonic);
      
      // Auto-sync after restoration
      await handleSyncWallet();
    } catch (err) {
      setError(`Failed to restore wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync wallet with network
  const handleSyncWallet = async () => {
    if (!wallet) {
      setError('No wallet available to sync');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await walletService.syncWallet();
      const currentBalance = await walletService.getBalance();
      setBalance(currentBalance);
    } catch (err) {
      setError(`Failed to sync wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Network change handler
  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    walletService.setNetwork(newNetwork);
  };

  return (
    <div className="webzjs-wallet">
      <h2>WebZjs Zcash Wallet</h2>
      
      {/* Network Selection */}
      <div className="network-selection">
        <label>Network: </label>
        <select 
          value={network} 
          onChange={(e) => handleNetworkChange(e.target.value)}
          disabled={loading}
        >
          <option value="testnet">Testnet</option>
          <option value="mainnet">Mainnet</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}

      {/* Wallet Actions */}
      <div className="wallet-actions">
        <button 
          onClick={handleCreateWallet} 
          disabled={loading}
          style={{ margin: '5px' }}
        >
          {loading ? 'Creating...' : 'Create New Wallet'}
        </button>
        
        <button 
          onClick={() => {
            const inputMnemonic = prompt('Enter your mnemonic phrase:');
            if (inputMnemonic) {
              handleRestoreWallet(inputMnemonic);
            }
          }} 
          disabled={loading}
          style={{ margin: '5px' }}
        >
          {loading ? 'Restoring...' : 'Restore Wallet'}
        </button>

        {wallet && (
          <button 
            onClick={handleSyncWallet} 
            disabled={loading}
            style={{ margin: '5px' }}
          >
            {loading ? 'Syncing...' : 'Sync Wallet'}
          </button>
        )}
      </div>

      {/* Wallet Information */}
      {wallet && (
        <div className="wallet-info" style={{ marginTop: '20px' }}>
          <h3>Wallet Information</h3>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Network:</strong> {network}
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Address:</strong>
            <div style={{ 
              wordBreak: 'break-all', 
              backgroundColor: '#f5f5f5', 
              padding: '5px',
              fontFamily: 'monospace'
            }}>
              {address}
            </div>
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Balance:</strong> {balance} ZEC
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Mnemonic (Backup):</strong>
            <div style={{ 
              wordBreak: 'break-all', 
              backgroundColor: '#fff3cd', 
              padding: '5px',
              border: '1px solid #ffeaa7',
              fontFamily: 'monospace'
            }}>
              {mnemonic}
            </div>
            <small style={{ color: '#856404' }}>
              ⚠️ Keep this mnemonic safe! It's needed to restore your wallet.
            </small>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      )}
    </div>
  );
};

export default WebZjsWallet;
```

### 3. Vue.js Component Example

```vue
<!-- src/components/WebZjsWallet.vue -->
<template>
  <div class="webzjs-wallet">
    <h2>WebZjs Zcash Wallet</h2>
    
    <!-- Network Selection -->
    <div class="network-selection">
      <label>Network: </label>
      <select v-model="network" @change="handleNetworkChange" :disabled="loading">
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error" style="color: red; margin: 10px 0;">
      {{ error }}
    </div>

    <!-- Wallet Actions -->
    <div class="wallet-actions">
      <button @click="handleCreateWallet" :disabled="loading" style="margin: 5px;">
        {{ loading ? 'Creating...' : 'Create New Wallet' }}
      </button>
      
      <button @click="showRestoreDialog" :disabled="loading" style="margin: 5px;">
        {{ loading ? 'Restoring...' : 'Restore Wallet' }}
      </button>

      <button v-if="wallet" @click="handleSyncWallet" :disabled="loading" style="margin: 5px;">
        {{ loading ? 'Syncing...' : 'Sync Wallet' }}
      </button>
    </div>

    <!-- Restore Dialog -->
    <div v-if="showRestore" class="restore-dialog" style="margin: 20px 0;">
      <h4>Restore Wallet</h4>
      <textarea 
        v-model="restoreMnemonic" 
        placeholder="Enter your 12-word mnemonic phrase..."
        rows="3"
        style="width: 100%; margin: 10px 0;"
      ></textarea>
      <div>
        <button @click="handleRestoreWallet" :disabled="!restoreMnemonic.trim()">
          Restore
        </button>
        <button @click="showRestore = false" style="margin-left: 10px;">
          Cancel
        </button>
      </div>
    </div>

    <!-- Wallet Information -->
    <div v-if="wallet" class="wallet-info" style="margin-top: 20px;">
      <h3>Wallet Information</h3>
      
      <div style="margin: 10px 0;">
        <strong>Network:</strong> {{ network }}
      </div>
      
      <div style="margin: 10px 0;">
        <strong>Address:</strong>
        <div style="word-break: break-all; background-color: #f5f5f5; padding: 5px; font-family: monospace;">
          {{ address }}
        </div>
      </div>
      
      <div style="margin: 10px 0;">
        <strong>Balance:</strong> {{ balance }} ZEC
      </div>
      
      <div style="margin: 10px 0;">
        <strong>Mnemonic (Backup):</strong>
        <div style="word-break: break-all; background-color: #fff3cd; padding: 5px; border: 1px solid #ffeaa7; font-family: monospace;">
          {{ mnemonic }}
        </div>
        <small style="color: #856404;">
          ⚠️ Keep this mnemonic safe! It's needed to restore your wallet.
        </small>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" style="margin: 20px 0; text-align: center;">
      <div>Loading...</div>
    </div>
  </div>
</template>

<script>
import WebZjsWalletService from '../services/webzjsWallet';

export default {
  name: 'WebZjsWallet',
  data() {
    return {
      walletService: new WebZjsWalletService(),
      wallet: null,
      address: '',
      balance: 0,
      mnemonic: '',
      loading: false,
      error: '',
      network: 'testnet',
      showRestore: false,
      restoreMnemonic: ''
    };
  },
  async mounted() {
    try {
      await this.walletService.initialize();
    } catch (err) {
      this.error = `Failed to initialize WebZjs: ${err.message}`;
    }
  },
  methods: {
    async handleCreateWallet() {
      this.loading = true;
      this.error = '';
      
      try {
        this.walletService.setNetwork(this.network);
        const newWallet = await this.walletService.createWallet();
        this.wallet = newWallet;
        
        this.address = this.walletService.getAddress();
        this.mnemonic = this.walletService.getMnemonic();
        
        // Auto-sync after creation
        await this.handleSyncWallet();
      } catch (err) {
        this.error = `Failed to create wallet: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async handleRestoreWallet() {
      if (!this.restoreMnemonic.trim()) {
        this.error = 'Please enter a valid mnemonic phrase';
        return;
      }

      this.loading = true;
      this.error = '';
      
      try {
        this.walletService.setNetwork(this.network);
        const restoredWallet = await this.walletService.restoreWallet(this.restoreMnemonic);
        this.wallet = restoredWallet;
        
        this.address = this.walletService.getAddress();
        this.mnemonic = this.restoreMnemonic;
        this.showRestore = false;
        this.restoreMnemonic = '';
        
        // Auto-sync after restoration
        await this.handleSyncWallet();
      } catch (err) {
        this.error = `Failed to restore wallet: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async handleSyncWallet() {
      if (!this.wallet) {
        this.error = 'No wallet available to sync';
        return;
      }

      this.loading = true;
      this.error = '';
      
      try {
        await this.walletService.syncWallet();
        this.balance = await this.walletService.getBalance();
      } catch (err) {
        this.error = `Failed to sync wallet: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    handleNetworkChange() {
      this.walletService.setNetwork(this.network);
    },

    showRestoreDialog() {
      this.showRestore = true;
      this.restoreMnemonic = '';
    }
  }
};
</script>
```

## Advanced Features

### 1. Payment Integration

```javascript
// src/services/webzjsPayments.js
import WebZjsWalletService from './webzjsWallet';

class WebZjsPaymentService extends WebZjsWalletService {
  constructor() {
    super();
    this.apiBaseUrl = 'http://localhost:3000/api';
  }

  // Create payment invoice via API
  async createPaymentInvoice(amount, description) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/webzjs/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId, // Set this when user logs in
          amount_zec: amount,
          description: description
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }

      return result.invoice;
    } catch (error) {
      console.error('Failed to create payment invoice:', error);
      throw error;
    }
  }

  // Generate QR code for payment
  generatePaymentQR(address, amount, memo = '') {
    const paymentUri = `zcash:${address}?amount=${amount}&memo=${encodeURIComponent(memo)}`;
    return paymentUri;
  }

  // Monitor for incoming payments
  async monitorPayments(expectedAmount, onPaymentReceived) {
    const checkInterval = 30000; // Check every 30 seconds
    
    const checkPayment = async () => {
      try {
        await this.syncWallet();
        const currentBalance = await this.getBalance();
        
        if (currentBalance >= expectedAmount) {
          onPaymentReceived(currentBalance);
          return true; // Stop monitoring
        }
        
        return false; // Continue monitoring
      } catch (error) {
        console.error('Error checking payment:', error);
        return false;
      }
    };

    // Initial check
    if (await checkPayment()) return;

    // Set up periodic checking
    const intervalId = setInterval(async () => {
      if (await checkPayment()) {
        clearInterval(intervalId);
      }
    }, checkInterval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

export default WebZjsPaymentService;
```

### 2. Local Storage Integration

```javascript
// src/services/webzjsStorage.js
class WebZjsStorageService {
  constructor() {
    this.storageKey = 'webzjs_wallet_data';
  }

  // Save wallet data to localStorage
  saveWalletData(data) {
    try {
      const walletData = {
        mnemonic: data.mnemonic,
        network: data.network,
        address: data.address,
        lastSync: new Date().toISOString(),
        ...data
      };
      
      // Encrypt mnemonic in production!
      localStorage.setItem(this.storageKey, JSON.stringify(walletData));
      return true;
    } catch (error) {
      console.error('Failed to save wallet data:', error);
      return false;
    }
  }

  // Load wallet data from localStorage
  loadWalletData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      return null;
    }
  }

  // Clear wallet data
  clearWalletData() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
      return false;
    }
  }

  // Check if wallet data exists
  hasWalletData() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

export default WebZjsStorageService;
```

## Error Handling

### Common Issues and Solutions

```javascript
// src/utils/webzjsErrorHandler.js
export class WebZjsErrorHandler {
  static handleError(error) {
    console.error('WebZjs Error:', error);

    // Network connectivity issues
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        suggestion: 'Try again in a few moments or check your network settings.'
      };
    }

    // Proxy service issues
    if (error.message.includes('proxy') || error.message.includes('chainsafe')) {
      return {
        type: 'proxy',
        message: 'Zcash proxy service is unavailable.',
        suggestion: 'The ChainSafe proxy may be temporarily down. Try again later.'
      };
    }

    // WebAssembly issues
    if (error.message.includes('wasm') || error.message.includes('WebAssembly')) {
      return {
        type: 'wasm',
        message: 'WebAssembly initialization failed.',
        suggestion: 'Your browser may not support WebAssembly. Try using a modern browser.'
      };
    }

    // Wallet issues
    if (error.message.includes('mnemonic') || error.message.includes('seed')) {
      return {
        type: 'wallet',
        message: 'Invalid mnemonic phrase.',
        suggestion: 'Please check your mnemonic phrase and try again.'
      };
    }

    // Generic error
    return {
      type: 'generic',
      message: error.message || 'An unexpected error occurred.',
      suggestion: 'Please try again or contact support if the issue persists.'
    };
  }
}
```

## Testing

### Unit Tests Example

```javascript
// src/tests/webzjsWallet.test.js
import WebZjsWalletService from '../services/webzjsWallet';

// Mock WebZjs modules
jest.mock('@chainsafe/webzjs-wallet', () => ({
  initWasm: jest.fn().mockResolvedValue(undefined),
  initThreadPool: jest.fn().mockResolvedValue(undefined),
  Wallet: {
    create: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockReturnValue('zs1test...'),
      getBalance: jest.fn().mockResolvedValue(1.5),
      getMnemonic: jest.fn().mockReturnValue('test mnemonic phrase'),
      synchronize: jest.fn().mockResolvedValue(undefined)
    }),
    fromMnemonic: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockReturnValue('zs1test...'),
      getBalance: jest.fn().mockResolvedValue(2.0),
      getMnemonic: jest.fn().mockReturnValue('test mnemonic phrase'),
      synchronize: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('WebZjsWalletService', () => {
  let walletService;

  beforeEach(() => {
    walletService = new WebZjsWalletService();
  });

  test('should initialize WebZjs successfully', async () => {
    await expect(walletService.initialize()).resolves.not.toThrow();
    expect(walletService.initialized).toBe(true);
  });

  test('should create new wallet', async () => {
    const wallet = await walletService.createWallet();
    expect(wallet).toBeDefined();
    expect(walletService.getAddress()).toBe('zs1test...');
  });

  test('should restore wallet from mnemonic', async () => {
    const mnemonic = 'test mnemonic phrase';
    const wallet = await walletService.restoreWallet(mnemonic);
    expect(wallet).toBeDefined();
    expect(walletService.getAddress()).toBe('zs1test...');
  });

  test('should sync wallet successfully', async () => {
    await walletService.createWallet();
    await expect(walletService.syncWallet()).resolves.not.toThrow();
  });

  test('should get correct proxy URL for network', () => {
    walletService.setNetwork('testnet');
    expect(walletService.getProxyUrl()).toBe('https://zcash-testnet.chainsafe.dev');
    
    walletService.setNetwork('mainnet');
    expect(walletService.getProxyUrl()).toBe('https://zcash-mainnet.chainsafe.dev');
  });
});
```

## Production Considerations

### Security Best Practices

1. **Mnemonic Storage**: Never store mnemonics in plain text
```javascript
// Use encryption for mnemonic storage
import CryptoJS from 'crypto-js';

const encryptMnemonic = (mnemonic, password) => {
  return CryptoJS.AES.encrypt(mnemonic, password).toString();
};

const decryptMnemonic = (encryptedMnemonic, password) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

2. **Environment Configuration**:
```javascript
// src/config/webzjs.js
export const WEBZJS_CONFIG = {
  networks: {
    mainnet: {
      proxyUrl: process.env.REACT_APP_ZCASH_MAINNET_PROXY || 'https://zcash-mainnet.chainsafe.dev',
      name: 'Mainnet'
    },
    testnet: {
      proxyUrl: process.env.REACT_APP_ZCASH_TESTNET_PROXY || 'https://zcash-testnet.chainsafe.dev',
      name: 'Testnet'
    }
  },
  defaultNetwork: process.env.REACT_APP_DEFAULT_NETWORK || 'testnet'
};
```

3. **Error Boundaries**:
```jsx
// src/components/WebZjsErrorBoundary.jsx
import React from 'react';

class WebZjsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WebZjs Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>WebZjs Error</h2>
          <p>Something went wrong with the Zcash wallet.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebZjsErrorBoundary;
```

## Deployment

### Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "react-scripts build",
    "build:webzjs": "npm run build && npm run copy-wasm"
  },
  "homepage": "https://yourdomain.com"
}
```

### HTTPS Requirements

WebZjs requires HTTPS in production due to WebAssembly security requirements:

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # WebAssembly MIME type
    location ~* \.wasm$ {
        add_header Content-Type application/wasm;
    }
}
```

## Troubleshooting

### Common Issues

1. **WebAssembly not loading**: Ensure HTTPS and proper MIME types
2. **Proxy connection fails**: Check network and ChainSafe service status
3. **Wallet sync slow**: Normal for first sync, subsequent syncs are faster
4. **Balance not updating**: Call `syncWallet()` to refresh from network

### Debug Mode

```javascript
// Enable debug logging
const walletService = new WebZjsWalletService();
walletService.debug = true; // Add debug flag to service
```

This comprehensive guide provides everything needed to implement WebZjs in a frontend application, from basic setup to production deployment considerations.