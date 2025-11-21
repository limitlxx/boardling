# Complete React SDK Integration Guide

This guide provides a comprehensive overview of integrating both WebZjs and zcash-devtool alternatives with React applications using the Zcash Paywall SDK.

## Project Structure

```
your-react-app/
├── src/
│   ├── components/
│   │   ├── WebZjsWallet.jsx
│   │   ├── DevtoolWallet.jsx
│   │   ├── WalletSelector.jsx
│   │   ├── DevtoolWalletSelector.jsx
│   │   ├── WalletInfo.jsx
│   │   ├── DevtoolWalletInfo.jsx
│   │   ├── PaymentInterface.jsx
│   │   ├── DevtoolPaymentInterface.jsx
│   │   ├── DevtoolCLICommands.jsx
│   │   ├── UserLogin.jsx
│   │   ├── AlternativeSelector.jsx
│   │   └── ErrorBoundary.jsx
│   ├── services/
│   │   ├── zcashSDK.js
│   │   ├── zcashDevtoolSDK.js
│   │   ├── webzjsIntegration.js
│   │   └── devtoolIntegration.js
│   ├── contexts/
│   │   └── UserContext.jsx
│   ├── hooks/
│   │   ├── useWebZjs.js
│   │   └── useDevtool.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── validators.js
│   └── App.js
├── package.json
└── .env
```

## Installation & Setup

### 1. Install All Dependencies

```bash
# Core dependencies
npm install react react-dom
npm install zcash-paywall-sdk
npm install @chainsafe/webzjs-wallet
npm install axios

# Development dependencies
npm install @testing-library/react @testing-library/jest-dom
npm install jest
```

### 2. Environment Configuration

```bash
# .env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_ZCASH_NETWORK=testnet

# WebZjs Configuration
REACT_APP_WEBZJS_MAINNET_PROXY=https://zcash-mainnet.chainsafe.dev
REACT_APP_WEBZJS_TESTNET_PROXY=https://zcash-testnet.chainsafe.dev

# zcash-devtool Configuration
REACT_APP_DEVTOOL_MAINNET_SERVER=zec.rocks
REACT_APP_DEVTOOL_TESTNET_SERVER=zec-testnet.rocks
```

## Unified SDK Service

### 1. Main SDK Service

```javascript
// src/services/unifiedZcashSDK.js
import { ZcashPaywall } from 'zcash-paywall-sdk';
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";

class UnifiedZcashSDK {
  constructor() {
    this.sdk = new ZcashPaywall({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
      timeout: 60000
    });
    
    this.webzjsInitialized = false;
    this.currentWallet = null;
    this.network = process.env.REACT_APP_ZCASH_NETWORK || 'testnet';
  }

  // ===== USER MANAGEMENT =====
  async createUser(email, name) {
    return await this.sdk.users.create({ email, name });
  }

  async getUser(userId) {
    return await this.sdk.users.get(userId);
  }

  // ===== WEBZJS METHODS =====
  async initializeWebZjs() {
    if (this.webzjsInitialized) return;
    
    try {
      await initWasm();
      await initThreadPool(navigator.hardwareConcurrency || 4);
      this.webzjsInitialized = true;
      console.log('WebZjs initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebZjs:', error);
      throw error;
    }
  }

  async createWebZjsWallet(userId, walletName, mnemonic = null) {
    await this.initializeWebZjs();
    
    try {
      // Create WebZjs wallet instance
      const wallet = mnemonic 
        ? await Wallet.fromMnemonic(mnemonic)
        : await Wallet.create();

      const address = wallet.getAddress();
      const walletMnemonic = wallet.getMnemonic();

      // Store wallet configuration via API
      const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          wallet_name: walletName,
          network: this.network,
          mnemonic: walletMnemonic
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create WebZjs wallet');
      }

      return {
        wallet,
        config: result.wallet,
        address,
        mnemonic: walletMnemonic
      };
    } catch (error) {
      console.error('Failed to create WebZjs wallet:', error);
      throw error;
    }
  }

  async syncWebZjsWallet(wallet) {
    const proxyUrl = this.network === 'mainnet' 
      ? process.env.REACT_APP_WEBZJS_MAINNET_PROXY
      : process.env.REACT_APP_WEBZJS_TESTNET_PROXY;
    
    await wallet.synchronize(proxyUrl);
  }

  async getWebZjsWalletInfo(wallet) {
    const address = wallet.getAddress();
    const balance = await wallet.getBalance();
    
    return { address, balance, network: this.network };
  }

  // ===== ZCASH-DEVTOOL METHODS =====
  async createDevtoolWallet(userId, walletName) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          wallet_name: walletName,
          network: this.network
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create zcash-devtool wallet');
      }

      return result.wallet;
    } catch (error) {
      console.error('Failed to create zcash-devtool wallet:', error);
      throw error;
    }
  }

  async syncDevtoolWallet(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync wallet');
      }

      return result;
    } catch (error) {
      console.error('Failed to sync zcash-devtool wallet:', error);
      throw error;
    }
  }

  async getDevtoolWalletBalance(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/balance`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get balance');
      }

      return result.balance;
    } catch (error) {
      console.error('Failed to get zcash-devtool balance:', error);
      throw error;
    }
  }

  // ===== COMMON METHODS =====
  async getUserWallets(userId, type = 'both') {
    const wallets = { webzjs: [], devtool: [] };
    
    if (type === 'webzjs' || type === 'both') {
      try {
        const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/wallet/user/${userId}`);
        const result = await response.json();
        if (result.success) {
          wallets.webzjs = result.wallets;
        }
      } catch (error) {
        console.warn('Failed to get WebZjs wallets:', error);
      }
    }

    if (type === 'devtool' || type === 'both') {
      try {
        const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/wallet/user/${userId}`);
        const result = await response.json();
        if (result.success) {
          wallets.devtool = result.wallets;
        }
      } catch (error) {
        console.warn('Failed to get zcash-devtool wallets:', error);
      }
    }

    return wallets;
  }

  async createInvoice(userId, walletId, amount, description, type = 'webzjs') {
    const endpoint = type === 'webzjs' 
      ? '/api/webzjs/invoice/create'
      : '/api/zcash-devtool/invoice/create';

    try {
      const response = await fetch(`${this.sdk.config.baseURL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          wallet_id: walletId,
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
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  async getAlternativeRecommendation(useCase, platform, experienceLevel) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/alternatives/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_case: useCase,
          platform: platform,
          experience_level: experienceLevel
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get recommendation');
      }

      return result.recommendation;
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      throw error;
    }
  }

  setNetwork(network) {
    if (!['mainnet', 'testnet'].includes(network)) {
      throw new Error('Invalid network. Use "mainnet" or "testnet"');
    }
    this.network = network;
  }
}

export default UnifiedZcashSDK;
```

## Custom React Hooks

### 1. WebZjs Hook

```javascript
// src/hooks/useWebZjs.js
import { useState, useEffect, useCallback } from 'react';
import UnifiedZcashSDK from '../services/unifiedZcashSDK';

export const useWebZjs = (userId) => {
  const [sdk] = useState(new UnifiedZcashSDK());
  const [wallet, setWallet] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createWallet = useCallback(async (walletName, mnemonic = null) => {
    if (!userId) throw new Error('User ID required');
    
    setLoading(true);
    setError('');
    
    try {
      const result = await sdk.createWebZjsWallet(userId, walletName, mnemonic);
      setWallet(result.wallet);
      
      // Auto-sync after creation
      await sdk.syncWebZjsWallet(result.wallet);
      const info = await sdk.getWebZjsWalletInfo(result.wallet);
      setWalletInfo(info);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, sdk]);

  const syncWallet = useCallback(async () => {
    if (!wallet) throw new Error('No wallet available');
    
    setLoading(true);
    setError('');
    
    try {
      await sdk.syncWebZjsWallet(wallet);
      const info = await sdk.getWebZjsWalletInfo(wallet);
      setWalletInfo(info);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, sdk]);

  const restoreWallet = useCallback(async (mnemonic) => {
    return await createWallet('Restored Wallet', mnemonic);
  }, [createWallet]);

  return {
    wallet,
    walletInfo,
    loading,
    error,
    createWallet,
    syncWallet,
    restoreWallet,
    setError
  };
};
```

### 2. zcash-devtool Hook

```javascript
// src/hooks/useDevtool.js
import { useState, useCallback } from 'react';
import UnifiedZcashSDK from '../services/unifiedZcashSDK';

export const useDevtool = (userId) => {
  const [sdk] = useState(new UnifiedZcashSDK());
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletData, setWalletData] = useState({
    balance: 0,
    addresses: [],
    transactions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createWallet = useCallback(async (walletName) => {
    if (!userId) throw new Error('User ID required');
    
    setLoading(true);
    setError('');
    
    try {
      const wallet = await sdk.createDevtoolWallet(userId, walletName);
      return wallet;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, sdk]);

  const selectWallet = useCallback(async (wallet) => {
    setLoading(true);
    setError('');
    
    try {
      setSelectedWallet(wallet);
      
      // Load wallet data
      const balance = await sdk.getDevtoolWalletBalance(wallet.id);
      // Note: addresses and transactions would need additional API endpoints
      
      setWalletData({
        balance,
        addresses: [], // Implement when API is available
        transactions: [] // Implement when API is available
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const syncWallet = useCallback(async () => {
    if (!selectedWallet) throw new Error('No wallet selected');
    
    setLoading(true);
    setError('');
    
    try {
      await sdk.syncDevtoolWallet(selectedWallet.id);
      
      // Reload wallet data
      const balance = await sdk.getDevtoolWalletBalance(selectedWallet.id);
      setWalletData(prev => ({ ...prev, balance }));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedWallet, sdk]);

  return {
    selectedWallet,
    walletData,
    loading,
    error,
    createWallet,
    selectWallet,
    syncWallet,
    setError
  };
};
```

## Unified Wallet Component

### Main Unified Component

```jsx
// src/components/UnifiedWallet.jsx
import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { useWebZjs } from '../hooks/useWebZjs';
import { useDevtool } from '../hooks/useDevtool';
import UnifiedZcashSDK from '../services/unifiedZcashSDK';
import AlternativeSelector from './AlternativeSelector';
import WebZjsInterface from './WebZjsInterface';
import DevtoolInterface from './DevtoolInterface';
import ErrorBoundary from './ErrorBoundary';

const UnifiedWallet = () => {
  const { user } = useContext(UserContext);
  const [sdk] = useState(new UnifiedZcashSDK());
  const [selectedAlternative, setSelectedAlternative] = useState('webzjs');
  const [allWallets, setAllWallets] = useState({ webzjs: [], devtool: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize hooks
  const webzjsHook = useWebZjs(user?.id);
  const devtoolHook = useDevtool(user?.id);

  // Load all user wallets
  useEffect(() => {
    if (user?.id) {
      loadAllWallets();
    }
  }, [user]);

  const loadAllWallets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const wallets = await sdk.getUserWallets(user.id);
      setAllWallets(wallets);
    } catch (err) {
      setError(`Failed to load wallets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativeChange = (alternative) => {
    setSelectedAlternative(alternative);
    setError(''); // Clear errors when switching
  };

  if (!user) {
    return (
      <div className="unified-wallet">
        <h2>Zcash Wallet</h2>
        <p>Please log in to access your wallet.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="unified-wallet">
        <h2>Zcash Wallet Manager</h2>
        
        {/* Alternative Selector */}
        <AlternativeSelector 
          selected={selectedAlternative}
          onSelect={handleAlternativeChange}
          webzjsCount={allWallets.webzjs.length}
          devtoolCount={allWallets.devtool.length}
        />

        {/* Error Display */}
        {error && (
          <div className="error" style={{ color: 'red', margin: '10px 0' }}>
            {error}
          </div>
        )}

        {/* Interface Components */}
        {selectedAlternative === 'webzjs' && (
          <WebZjsInterface 
            hook={webzjsHook}
            wallets={allWallets.webzjs}
            onWalletCreated={loadAllWallets}
            sdk={sdk}
          />
        )}

        {selectedAlternative === 'devtool' && (
          <DevtoolInterface 
            hook={devtoolHook}
            wallets={allWallets.devtool}
            onWalletCreated={loadAllWallets}
            sdk={sdk}
          />
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <div>Loading...</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UnifiedWallet;
```

### WebZjs Interface Component

```jsx
// src/components/WebZjsInterface.jsx
import React, { useState } from 'react';

const WebZjsInterface = ({ hook, wallets, onWalletCreated, sdk }) => {
  const { wallet, walletInfo, loading, error, createWallet, syncWallet, restoreWallet } = hook;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [isRestore, setIsRestore] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!walletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    try {
      const result = isRestore 
        ? await restoreWallet(mnemonic)
        : await createWallet(walletName);
      
      if (!isRestore) {
        alert(`Wallet created successfully!\n\nMnemonic: ${result.mnemonic}\n\n⚠️ IMPORTANT: Save this mnemonic phrase securely!`);
      }
      
      // Reset form
      setWalletName('');
      setMnemonic('');
      setShowCreateForm(false);
      setIsRestore(false);
      
      // Refresh wallet list
      onWalletCreated();
    } catch (error) {
      console.error('Failed to create/restore wallet:', error);
    }
  };

  return (
    <div className="webzjs-interface">
      <h3>WebZjs Browser Wallet</h3>
      
      {/* Existing Wallets */}
      {wallets.length > 0 && (
        <div style={{ margin: '15px 0' }}>
          <h4>Your WebZjs Wallets ({wallets.length})</h4>
          {wallets.map(w => (
            <div key={w.id} style={{ 
              margin: '5px 0', 
              padding: '10px', 
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '3px'
            }}>
              <strong>{w.name}</strong> - {w.network}
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Created: {new Date(w.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Restore Form */}
      <div style={{ margin: '15px 0' }}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create/Restore Wallet'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ 
          margin: '15px 0', 
          padding: '15px', 
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          <div style={{ margin: '10px 0' }}>
            <label style={{ marginRight: '15px' }}>
              <input
                type="radio"
                checked={!isRestore}
                onChange={() => setIsRestore(false)}
                style={{ marginRight: '5px' }}
              />
              Create New Wallet
            </label>
            <label>
              <input
                type="radio"
                checked={isRestore}
                onChange={() => setIsRestore(true)}
                style={{ marginRight: '5px' }}
              />
              Restore from Mnemonic
            </label>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ margin: '10px 0' }}>
              <label>Wallet Name: </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                required
                style={{ width: '200px', padding: '5px' }}
              />
            </div>

            {isRestore && (
              <div style={{ margin: '10px 0' }}>
                <label>Mnemonic Phrase: </label>
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="Enter your 12-word mnemonic phrase"
                  required
                  rows="3"
                  style={{ width: '300px', padding: '5px' }}
                />
              </div>
            )}

            <div>
              <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : (isRestore ? 'Restore Wallet' : 'Create Wallet')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Wallet Info */}
      {wallet && walletInfo && (
        <div style={{ 
          margin: '20px 0', 
          padding: '15px', 
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '5px'
        }}>
          <h4>Active Wallet</h4>
          <div><strong>Address:</strong> {walletInfo.address}</div>
          <div><strong>Balance:</strong> {walletInfo.balance} ZEC</div>
          <div><strong>Network:</strong> {walletInfo.network}</div>
          
          <button 
            onClick={syncWallet}
            disabled={loading}
            style={{ 
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '3px'
            }}
          >
            {loading ? 'Syncing...' : 'Sync Wallet'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default WebZjsInterface;
```

### DevTool Interface Component

```jsx
// src/components/DevtoolInterface.jsx
import React, { useState } from 'react';

const DevtoolInterface = ({ hook, wallets, onWalletCreated, sdk }) => {
  const { selectedWallet, walletData, loading, error, createWallet, selectWallet, syncWallet } = hook;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [walletName, setWalletName] = useState('');

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    
    if (!walletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    try {
      const newWallet = await createWallet(walletName);
      
      alert(`Wallet created successfully!\n\nWallet: ${newWallet.name}\nPath: ${newWallet.wallet_path}\n\n⚠️ IMPORTANT: Use CLI commands to initialize and manage this wallet.`);
      
      // Reset form
      setWalletName('');
      setShowCreateForm(false);
      
      // Refresh wallet list
      onWalletCreated();
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  return (
    <div className="devtool-interface">
      <h3>zcash-devtool CLI Wallet</h3>
      
      {/* Existing Wallets */}
      {wallets.length > 0 && (
        <div style={{ margin: '15px 0' }}>
          <h4>Your zcash-devtool Wallets ({wallets.length})</h4>
          <select 
            value={selectedWallet?.id || ''} 
            onChange={(e) => {
              const wallet = wallets.find(w => w.id === parseInt(e.target.value));
              if (wallet) selectWallet(wallet);
            }}
            disabled={loading}
            style={{ width: '300px', padding: '5px' }}
          >
            <option value="">Select a wallet...</option>
            {wallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({wallet.network})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create Wallet Form */}
      <div style={{ margin: '15px 0' }}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create New Wallet'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ 
          margin: '15px 0', 
          padding: '15px', 
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          <h4>Create New zcash-devtool Wallet</h4>
          <form onSubmit={handleCreateWallet}>
            <div style={{ margin: '10px 0' }}>
              <label>Wallet Name: </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                required
                style={{ width: '200px', padding: '5px' }}
              />
            </div>
            
            <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '3px' }}>
              <strong>Prerequisites:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>zcash-devtool installed and built</li>
                <li>Age encryption key generated</li>
                <li>Environment variables set</li>
              </ul>
            </div>

            <div>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Wallet Info */}
      {selectedWallet && (
        <div style={{ 
          margin: '20px 0', 
          padding: '15px', 
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '5px'
        }}>
          <h4>Selected Wallet: {selectedWallet.name}</h4>
          <div><strong>Network:</strong> {selectedWallet.network}</div>
          <div><strong>Path:</strong> {selectedWallet.wallet_path}</div>
          <div><strong>Balance:</strong> {walletData.balance} ZEC</div>
          
          <button 
            onClick={syncWallet}
            disabled={loading}
            style={{ 
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '3px'
            }}
          >
            {loading ? 'Syncing...' : 'Sync Wallet'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DevtoolInterface;
```

## Testing Strategy

### 1. Unit Tests

```javascript
// src/tests/UnifiedZcashSDK.test.js
import UnifiedZcashSDK from '../services/unifiedZcashSDK';

// Mock fetch
global.fetch = jest.fn();

// Mock WebZjs
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

describe('UnifiedZcashSDK', () => {
  let sdk;

  beforeEach(() => {
    sdk = new UnifiedZcashSDK();
    fetch.mockClear();
  });

  test('should create WebZjs wallet successfully', async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        wallet: { id: 1, name: 'Test Wallet' }
      })
    });

    const result = await sdk.createWebZjsWallet('user123', 'Test Wallet');
    
    expect(result.wallet).toBeDefined();
    expect(result.config).toBeDefined();
    expect(result.address).toBe('zs1test...');
  });

  test('should create zcash-devtool wallet successfully', async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        wallet: { id: 1, name: 'Test Wallet', wallet_path: './test' }
      })
    });

    const result = await sdk.createDevtoolWallet('user123', 'Test Wallet');
    
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test Wallet');
  });
});
```

### 2. Integration Tests

```javascript
// src/tests/UnifiedWallet.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '../contexts/UserContext';
import UnifiedWallet from '../components/UnifiedWallet';

describe('UnifiedWallet Integration', () => {
  test('renders wallet selector', () => {
    render(
      <UserProvider>
        <UnifiedWallet />
      </UserProvider>
    );
    
    expect(screen.getByText('Zcash Wallet Manager')).toBeInTheDocument();
  });

  test('switches between alternatives', async () => {
    render(
      <UserProvider>
        <UnifiedWallet />
      </UserProvider>
    );
    
    const devtoolRadio = screen.getByLabelText(/zcash-devtool/);
    fireEvent.click(devtoolRadio);
    
    await waitFor(() => {
      expect(screen.getByText('zcash-devtool CLI Wallet')).toBeInTheDocument();
    });
  });
});
```

## Deployment

### 1. Build Configuration

```json
{
  "name": "zcash-react-sdk-app",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zcash-paywall-sdk": "^1.0.0",
    "@chainsafe/webzjs-wallet": "latest",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### 2. Production Environment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Usage Examples

### Basic Usage

```jsx
// App.js
import React from 'react';
import { UserProvider } from './contexts/UserContext';
import UnifiedWallet from './components/UnifiedWallet';
import UserLogin from './components/UserLogin';

function App() {
  return (
    <UserProvider>
      <div className="App">
        <h1>Zcash SDK Demo</h1>
        <UserLogin />
        <UnifiedWallet />
      </div>
    </UserProvider>
  );
}

export default App;
```

### Advanced Usage with Custom Components

```jsx
// CustomWalletApp.js
import React, { useState } from 'react';
import { useWebZjs } from './hooks/useWebZjs';
import { useDevtool } from './hooks/useDevtool';

function CustomWalletApp({ userId }) {
  const [mode, setMode] = useState('webzjs');
  const webzjs = useWebZjs(userId);
  const devtool = useDevtool(userId);

  return (
    <div>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="webzjs">WebZjs</option>
        <option value="devtool">zcash-devtool</option>
      </select>

      {mode === 'webzjs' && (
        <div>
          <button onClick={() => webzjs.createWallet('My Wallet')}>
            Create WebZjs Wallet
          </button>
          {webzjs.wallet && (
            <div>Balance: {webzjs.walletInfo?.balance} ZEC</div>
          )}
        </div>
      )}

      {mode === 'devtool' && (
        <div>
          <button onClick={() => devtool.createWallet('My CLI Wallet')}>
            Create CLI Wallet
          </button>
          {devtool.selectedWallet && (
            <div>Balance: {devtool.walletData.balance} ZEC</div>
          )}
        </div>
      )}
    </div>
  );
}
```

This complete integration guide provides a production-ready foundation for building React applications that support both WebZjs and zcash-devtool alternatives using the Zcash Paywall SDK.