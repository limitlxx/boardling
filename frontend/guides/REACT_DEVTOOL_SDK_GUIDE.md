# React zcash-devtool SDK Integration Guide

This guide shows how to integrate zcash-devtool with React applications using the Zcash Paywall SDK and API routes.

## Overview

This implementation combines:
- **zcash-devtool** for CLI-based Zcash wallet operations
- **Zcash Paywall SDK** for backend API integration
- **React** for frontend user interface
- **API Routes** for wallet management and CLI command execution

## Installation & Setup

### 1. Install Dependencies

```bash
# Install SDK and React dependencies
npm install zcash-paywall-sdk
npm install react react-dom
npm install axios  # for API calls

# Backend requirements (zcash-devtool setup)
# See backend setup in zcash-devtool guide
```

### 2. Environment Configuration

```bash
# .env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_ZCASH_NETWORK=testnet
REACT_APP_DEVTOOL_MAINNET_SERVER=zec.rocks
REACT_APP_DEVTOOL_TESTNET_SERVER=zec-testnet.rocks
```

## SDK Integration Layer

### 1. Create SDK Service for zcash-devtool

```javascript
// src/services/zcashDevtoolSDK.js
import { ZcashPaywall } from 'zcash-paywall-sdk';

class ZcashDevtoolSDKService {
  constructor() {
    this.sdk = new ZcashPaywall({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
      timeout: 60000 // Longer timeout for CLI operations
    });
  }

  // User management
  async createUser(email, name) {
    return await this.sdk.users.create({ email, name });
  }

  async getUser(userId) {
    return await this.sdk.users.get(userId);
  }

  // zcash-devtool wallet management via API
  async createDevtoolWallet(userId, walletName, network = 'testnet') {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/wallet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          wallet_name: walletName,
          network: network
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create zcash-devtool wallet');
      }

      return result.wallet;
    } catch (error) {
      console.error('SDK: Failed to create zcash-devtool wallet:', error);
      throw error;
    }
  }

  async getUserDevtoolWallets(userId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/wallet/user/${userId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get zcash-devtool wallets');
      }

      return result.wallets;
    } catch (error) {
      console.error('SDK: Failed to get zcash-devtool wallets:', error);
      throw error;
    }
  }

  async getDevtoolWalletCommands(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/wallet/${walletId}/commands`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get wallet commands');
      }

      return result;
    } catch (error) {
      console.error('SDK: Failed to get wallet commands:', error);
      throw error;
    }
  }

  // CLI operations via backend API
  async syncWallet(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync wallet');
      }

      return result;
    } catch (error) {
      console.error('SDK: Failed to sync wallet:', error);
      throw error;
    }
  }

  async getWalletBalance(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/balance`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get balance');
      }

      return result.balance;
    } catch (error) {
      console.error('SDK: Failed to get balance:', error);
      throw error;
    }
  }

  async generateAddress(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/address/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate address');
      }

      return result.address;
    } catch (error) {
      console.error('SDK: Failed to generate address:', error);
      throw error;
    }
  }

  async listAddresses(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/addresses`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to list addresses');
      }

      return result.addresses;
    } catch (error) {
      console.error('SDK: Failed to list addresses:', error);
      throw error;
    }
  }

  async listTransactions(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/devtool/wallet/${walletId}/transactions`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to list transactions');
      }

      return result.transactions;
    } catch (error) {
      console.error('SDK: Failed to list transactions:', error);
      throw error;
    }
  }

  // zcash-devtool invoice management
  async createDevtoolInvoice(userId, walletId, amount, description) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          wallet_id: walletId,
          amount_zec: amount,
          description: description
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create zcash-devtool invoice');
      }

      return result.invoice;
    } catch (error) {
      console.error('SDK: Failed to create zcash-devtool invoice:', error);
      throw error;
    }
  }

  // Get zcash-devtool configuration
  async getDevtoolConfig() {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/zcash-devtool/config`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get zcash-devtool config');
      }

      return result.zcash_devtool;
    } catch (error) {
      console.error('SDK: Failed to get zcash-devtool config:', error);
      throw error;
    }
  }

  // Alternative recommendations
  async getAlternativeRecommendation(useCase, platform, experienceLevel) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/alternatives/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.error('SDK: Failed to get recommendation:', error);
      throw error;
    }
  }
}

export default ZcashDevtoolSDKService;
```

### 2. zcash-devtool Integration Service

```javascript
// src/services/devtoolIntegration.js
import ZcashDevtoolSDKService from './zcashDevtoolSDK';

class DevtoolIntegrationService {
  constructor() {
    this.sdkService = new ZcashDevtoolSDKService();
    this.network = process.env.REACT_APP_ZCASH_NETWORK || 'testnet';
    this.selectedWallet = null;
  }

  // Get server URL from environment
  getServerUrl() {
    return this.network === 'mainnet' 
      ? process.env.REACT_APP_DEVTOOL_MAINNET_SERVER
      : process.env.REACT_APP_DEVTOOL_TESTNET_SERVER;
  }

  // Create wallet (CLI + SDK)
  async createWallet(userId, walletName) {
    try {
      const wallet = await this.sdkService.createDevtoolWallet(
        userId, 
        walletName, 
        this.network
      );

      return wallet;
    } catch (error) {
      console.error('Failed to create integrated wallet:', error);
      throw error;
    }
  }

  // Select wallet for operations
  selectWallet(wallet) {
    this.selectedWallet = wallet;
  }

  // Get wallet commands and setup
  async getWalletSetup(walletId) {
    try {
      const setupData = await this.sdkService.getDevtoolWalletCommands(walletId);
      return setupData;
    } catch (error) {
      console.error('Failed to get wallet setup:', error);
      throw error;
    }
  }

  // Sync wallet via CLI
  async syncWallet(walletId) {
    try {
      const result = await this.sdkService.syncWallet(walletId);
      return result;
    } catch (error) {
      console.error('Failed to sync wallet:', error);
      throw error;
    }
  }

  // Get wallet balance via CLI
  async getBalance(walletId) {
    try {
      const balance = await this.sdkService.getWalletBalance(walletId);
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Generate address via CLI
  async generateAddress(walletId) {
    try {
      const address = await this.sdkService.generateAddress(walletId);
      return address;
    } catch (error) {
      console.error('Failed to generate address:', error);
      throw error;
    }
  }

  // List addresses via CLI
  async listAddresses(walletId) {
    try {
      const addresses = await this.sdkService.listAddresses(walletId);
      return addresses;
    } catch (error) {
      console.error('Failed to list addresses:', error);
      throw error;
    }
  }

  // List transactions via CLI
  async listTransactions(walletId) {
    try {
      const transactions = await this.sdkService.listTransactions(walletId);
      return transactions;
    } catch (error) {
      console.error('Failed to list transactions:', error);
      throw error;
    }
  }

  // Create payment invoice
  async createPaymentInvoice(userId, walletId, amount, description) {
    try {
      const invoice = await this.sdkService.createDevtoolInvoice(
        userId, 
        walletId, 
        amount, 
        description
      );

      return invoice;
    } catch (error) {
      console.error('Failed to create payment invoice:', error);
      throw error;
    }
  }

  // Set network
  setNetwork(network) {
    if (!['mainnet', 'testnet'].includes(network)) {
      throw new Error('Invalid network. Use "mainnet" or "testnet"');
    }
    this.network = network;
  }
}

export default DevtoolIntegrationService;
```

## React Components

### 1. Main zcash-devtool Wallet Component

```jsx
// src/components/DevtoolWallet.jsx
import React, { useState, useEffect, useContext } from 'react';
import DevtoolIntegrationService from '../services/devtoolIntegration';
import { UserContext } from '../contexts/UserContext';
import DevtoolWalletSelector from './DevtoolWalletSelector';
import DevtoolWalletInfo from './DevtoolWalletInfo';
import DevtoolPaymentInterface from './DevtoolPaymentInterface';
import DevtoolCLICommands from './DevtoolCLICommands';
import ErrorBoundary from './ErrorBoundary';

const DevtoolWallet = () => {
  const { user } = useContext(UserContext);
  const [integrationService] = useState(new DevtoolIntegrationService());
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletData, setWalletData] = useState({
    balance: 0,
    addresses: [],
    transactions: [],
    commands: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState(process.env.REACT_APP_ZCASH_NETWORK || 'testnet');

  // Load user wallets on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserWallets();
    }
  }, [user]);

  // Load user wallets from SDK
  const loadUserWallets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userWallets = await integrationService.sdkService.getUserDevtoolWallets(user.id);
      setWallets(userWallets);
      
      if (userWallets.length > 0) {
        await selectWallet(userWallets[0]);
      }
    } catch (err) {
      setError(`Failed to load wallets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Select and load wallet data
  const selectWallet = async (wallet) => {
    setLoading(true);
    setError('');
    
    try {
      setSelectedWallet(wallet);
      integrationService.selectWallet(wallet);
      
      // Load wallet data in parallel
      const [balance, addresses, transactions, commands] = await Promise.all([
        integrationService.getBalance(wallet.id).catch(() => 0),
        integrationService.listAddresses(wallet.id).catch(() => []),
        integrationService.listTransactions(wallet.id).catch(() => []),
        integrationService.getWalletSetup(wallet.id).catch(() => null)
      ]);

      setWalletData({
        balance,
        addresses,
        transactions,
        commands
      });
    } catch (err) {
      setError(`Failed to select wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new wallet
  const handleCreateWallet = async (walletName) => {
    setLoading(true);
    setError('');
    
    try {
      integrationService.setNetwork(network);
      
      const newWallet = await integrationService.createWallet(
        user.id, 
        walletName
      );
      
      // Reload wallets list
      await loadUserWallets();
      
      // Select the new wallet
      await selectWallet(newWallet);
      
      return newWallet;
    } catch (err) {
      setError(`Failed to create wallet: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sync wallet
  const handleSyncWallet = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    setError('');
    
    try {
      await integrationService.syncWallet(selectedWallet.id);
      
      // Reload wallet data after sync
      const [balance, addresses, transactions] = await Promise.all([
        integrationService.getBalance(selectedWallet.id),
        integrationService.listAddresses(selectedWallet.id),
        integrationService.listTransactions(selectedWallet.id)
      ]);

      setWalletData(prev => ({
        ...prev,
        balance,
        addresses,
        transactions
      }));
    } catch (err) {
      setError(`Failed to sync wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate new address
  const handleGenerateAddress = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    setError('');
    
    try {
      const newAddress = await integrationService.generateAddress(selectedWallet.id);
      
      // Reload addresses
      const addresses = await integrationService.listAddresses(selectedWallet.id);
      setWalletData(prev => ({
        ...prev,
        addresses
      }));
      
      return newAddress;
    } catch (err) {
      setError(`Failed to generate address: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create payment invoice
  const handleCreateInvoice = async (amount, description) => {
    if (!selectedWallet) return;

    setLoading(true);
    setError('');
    
    try {
      const invoice = await integrationService.createPaymentInvoice(
        user.id,
        selectedWallet.id,
        amount,
        description
      );
      
      return invoice;
    } catch (err) {
      setError(`Failed to create invoice: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Network change handler
  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    integrationService.setNetwork(newNetwork);
  };

  if (!user) {
    return (
      <div className="devtool-wallet">
        <h2>zcash-devtool Wallet</h2>
        <p>Please log in to access your wallet.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="devtool-wallet">
        <h2>zcash-devtool Zcash Wallet</h2>
        
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

        {/* Wallet Selector */}
        <DevtoolWalletSelector
          wallets={wallets}
          selectedWallet={selectedWallet}
          onSelectWallet={selectWallet}
          onCreateWallet={handleCreateWallet}
          loading={loading}
          network={network}
        />

        {/* Wallet Information */}
        {selectedWallet && (
          <DevtoolWalletInfo
            wallet={selectedWallet}
            walletData={walletData}
            onSync={handleSyncWallet}
            onGenerateAddress={handleGenerateAddress}
            loading={loading}
            network={network}
          />
        )}

        {/* Payment Interface */}
        {selectedWallet && (
          <DevtoolPaymentInterface
            wallet={selectedWallet}
            onCreateInvoice={handleCreateInvoice}
            loading={loading}
          />
        )}

        {/* CLI Commands */}
        {selectedWallet && walletData.commands && (
          <DevtoolCLICommands
            wallet={selectedWallet}
            commands={walletData.commands}
            network={network}
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

export default DevtoolWallet;
```

### 2. Devtool Wallet Selector Component

```jsx
// src/components/DevtoolWalletSelector.jsx
import React, { useState } from 'react';

const DevtoolWalletSelector = ({ 
  wallets, 
  selectedWallet, 
  onSelectWallet, 
  onCreateWallet, 
  loading, 
  network 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [walletName, setWalletName] = useState('');

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    
    if (!walletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    try {
      const newWallet = await onCreateWallet(walletName);
      
      // Show creation success with setup instructions
      alert(`Wallet created successfully!\n\nWallet: ${newWallet.name}\nNetwork: ${newWallet.network}\nPath: ${newWallet.wallet_path}\n\n⚠️ IMPORTANT: Follow the CLI setup instructions to initialize your wallet.`);
      
      // Reset form
      setWalletName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  return (
    <div className="devtool-wallet-selector">
      <h3>Wallet Management</h3>
      
      {/* Wallet Selection */}
      {wallets.length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <label>Select Wallet: </label>
          <select 
            value={selectedWallet?.id || ''} 
            onChange={(e) => {
              const wallet = wallets.find(w => w.id === parseInt(e.target.value));
              if (wallet) onSelectWallet(wallet);
            }}
            disabled={loading}
          >
            <option value="">Choose a wallet...</option>
            {wallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({wallet.network})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="wallet-actions" style={{ margin: '15px 0' }}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          disabled={loading}
          style={{ margin: '5px' }}
        >
          Create New Wallet
        </button>
      </div>

      {/* Create Wallet Form */}
      {showCreateForm && (
        <div className="create-wallet-form" style={{ 
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
            <div style={{ margin: '10px 0' }}>
              <small>Network: {network}</small>
            </div>
            <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '3px' }}>
              <strong>Prerequisites:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Rust toolchain installed</li>
                <li>Age encryption tool installed</li>
                <li>zcash-devtool cloned and built</li>
                <li>Age identity key generated</li>
              </ul>
            </div>
            <div>
              <button type="submit" disabled={loading}>
                Create Wallet
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DevtoolWalletSelector;
```

### 3. Devtool Wallet Info Component

```jsx
// src/components/DevtoolWalletInfo.jsx
import React from 'react';

const DevtoolWalletInfo = ({ 
  wallet, 
  walletData, 
  onSync, 
  onGenerateAddress, 
  loading, 
  network 
}) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleGenerateAddress = async () => {
    try {
      const newAddress = await onGenerateAddress();
      alert(`New address generated: ${newAddress}`);
    } catch (error) {
      console.error('Failed to generate address:', error);
    }
  };

  const getServerUrl = () => {
    return network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';
  };

  return (
    <div className="devtool-wallet-info" style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd',
      borderRadius: '5px'
    }}>
      <h3>Wallet Information</h3>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Name:</strong> {wallet.name}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Network:</strong> {wallet.network}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Server:</strong> {getServerUrl()}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Wallet Path:</strong>
        <div style={{ 
          wordBreak: 'break-all', 
          backgroundColor: '#f5f5f5', 
          padding: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {wallet.wallet_path}
        </div>
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Balance:</strong> {walletData.balance} ZEC
      </div>
      
      {/* Action Buttons */}
      <div style={{ margin: '15px 0' }}>
        <button 
          onClick={onSync} 
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Syncing...' : 'Sync Wallet'}
        </button>
        
        <button 
          onClick={handleGenerateAddress} 
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Address'}
        </button>
      </div>

      {/* Addresses Section */}
      <div className="addresses-section" style={{ margin: '20px 0' }}>
        <h4>Addresses ({walletData.addresses.length})</h4>
        {walletData.addresses.length > 0 ? (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {walletData.addresses.map((addr, index) => (
              <div key={index} style={{ 
                margin: '5px 0', 
                padding: '8px', 
                backgroundColor: '#f5f5f5',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{ 
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}>
                  <strong>{addr.index}:</strong> {addr.address}
                </div>
                <button 
                  onClick={() => copyToClipboard(addr.address)}
                  style={{ 
                    padding: '4px 8px',
                    marginLeft: '10px',
                    fontSize: '12px'
                  }}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No addresses found. Generate an address to get started.</p>
        )}
      </div>

      {/* Transactions Section */}
      <div className="transactions-section" style={{ margin: '20px 0' }}>
        <h4>Transactions ({walletData.transactions.length})</h4>
        {walletData.transactions.length > 0 ? (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {walletData.transactions.map((tx, index) => (
              <div key={index} style={{ 
                margin: '5px 0', 
                padding: '8px', 
                backgroundColor: '#f0f8ff',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}>
                  <strong>TxID:</strong> {tx.txid}
                </div>
                {/* Add more transaction details as available */}
              </div>
            ))}
          </div>
        ) : (
          <p>No transactions found.</p>
        )}
      </div>
    </div>
  );
};

export default DevtoolWalletInfo;
```

### 4. Devtool Payment Interface Component

```jsx
// src/components/DevtoolPaymentInterface.jsx
import React, { useState } from 'react';

const DevtoolPaymentInterface = ({ wallet, onCreateInvoice, loading }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const newInvoice = await onCreateInvoice(parseFloat(amount), description);
      setInvoice(newInvoice);
      
      // Reset form
      setAmount('');
      setDescription('');
      setShowInvoiceForm(false);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const copyInvoiceInfo = () => {
    const invoiceText = `
zcash-devtool Payment Request
Amount: ${invoice.amount_zec} ZEC
Description: ${invoice.description || 'No description'}
Invoice ID: ${invoice.id}
Wallet: ${wallet.name}
Network: ${wallet.network}
Created: ${new Date(invoice.created_at).toLocaleString()}

CLI Instructions:
1. Generate receiving address: cargo run --release -- wallet -w ${wallet.wallet_path} new-address
2. Provide address to payer
3. Sync wallet: cargo run --release -- wallet -w ${wallet.wallet_path} sync --server ${wallet.network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks'}
4. Check balance: cargo run --release -- wallet -w ${wallet.wallet_path} balance
    `.trim();
    
    navigator.clipboard.writeText(invoiceText).then(() => {
      alert('Invoice information copied to clipboard!');
    });
  };

  return (
    <div className="devtool-payment-interface" style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd',
      borderRadius: '5px'
    }}>
      <h3>Payment Interface</h3>
      
      <div style={{ margin: '15px 0' }}>
        <button 
          onClick={() => setShowInvoiceForm(!showInvoiceForm)}
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Create Payment Invoice
        </button>
      </div>

      {/* Invoice Creation Form */}
      {showInvoiceForm && (
        <div className="invoice-form" style={{ 
          margin: '15px 0', 
          padding: '15px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '5px'
        }}>
          <h4>Create Payment Invoice</h4>
          <form onSubmit={handleCreateInvoice}>
            <div style={{ margin: '10px 0' }}>
              <label>Amount (ZEC): </label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                required
                style={{ width: '150px', padding: '5px' }}
              />
            </div>
            <div style={{ margin: '10px 0' }}>
              <label>Description: </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description (optional)"
                style={{ width: '250px', padding: '5px' }}
              />
            </div>
            <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '3px' }}>
              <small>
                <strong>Note:</strong> This creates an invoice record. Use CLI commands to generate receiving addresses and monitor payments.
              </small>
            </div>
            <div>
              <button type="submit" disabled={loading}>
                Create Invoice
              </button>
              <button 
                type="button" 
                onClick={() => setShowInvoiceForm(false)}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Display */}
      {invoice && (
        <div className="invoice-display" style={{ 
          margin: '15px 0', 
          padding: '15px', 
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '5px'
        }}>
          <h4>Payment Invoice Created</h4>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Invoice ID:</strong> {invoice.id}
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Amount:</strong> {invoice.amount_zec} ZEC
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Description:</strong> {invoice.description || 'No description'}
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Status:</strong> {invoice.status}
          </div>
          
          <div style={{ margin: '10px 0' }}>
            <strong>Created:</strong> {new Date(invoice.created_at).toLocaleString()}
          </div>
          
          <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '3px' }}>
            <strong>Next Steps:</strong>
            <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Use CLI to generate a receiving address</li>
              <li>Provide the address to the payer</li>
              <li>Sync wallet periodically to check for payments</li>
              <li>Verify payment amount matches invoice</li>
            </ol>
          </div>
          
          <div style={{ margin: '15px 0' }}>
            <button 
              onClick={copyInvoiceInfo}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginRight: '10px'
              }}
            >
              Copy Invoice & Instructions
            </button>
            
            <button 
              onClick={() => setInvoice(null)}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevtoolPaymentInterface;
```

### 5. CLI Commands Component

```jsx
// src/components/DevtoolCLICommands.jsx
import React, { useState } from 'react';

const DevtoolCLICommands = ({ wallet, commands, network }) => {
  const [selectedCommand, setSelectedCommand] = useState('basic_operations');

  const copyCommand = (command) => {
    navigator.clipboard.writeText(command).then(() => {
      alert('Command copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy command:', err);
    });
  };

  const getServerUrl = () => {
    return network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';
  };

  const renderCommandSection = (sectionName, sectionCommands) => {
    return (
      <div key={sectionName} style={{ margin: '10px 0' }}>
        <h5 style={{ marginBottom: '10px', textTransform: 'capitalize' }}>
          {sectionName.replace('_', ' ')}
        </h5>
        {Object.entries(sectionCommands).map(([operation, command]) => (
          <div key={operation} style={{ 
            margin: '8px 0', 
            padding: '10px', 
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '3px'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '5px',
              color: '#495057'
            }}>
              {operation}:
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: '#343a40',
              color: '#f8f9fa',
              padding: '8px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <code style={{ flex: 1, wordBreak: 'break-all' }}>
                {command}
              </code>
              <button 
                onClick={() => copyCommand(command)}
                style={{ 
                  marginLeft: '10px',
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '11px'
                }}
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!commands || !commands.commands) {
    return (
      <div className="devtool-cli-commands" style={{ 
        margin: '20px 0', 
        padding: '15px', 
        border: '1px solid #ddd',
        borderRadius: '5px'
      }}>
        <h3>CLI Commands</h3>
        <p>Loading CLI commands...</p>
      </div>
    );
  }

  return (
    <div className="devtool-cli-commands" style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd',
      borderRadius: '5px'
    }}>
      <h3>CLI Commands for {wallet.name}</h3>
      
      <div style={{ margin: '15px 0' }}>
        <strong>Wallet Path:</strong> {wallet.wallet_path}
      </div>
      
      <div style={{ margin: '15px 0' }}>
        <strong>Network:</strong> {network} ({getServerUrl()})
      </div>

      {/* Command Category Selector */}
      <div style={{ margin: '15px 0' }}>
        <label>Command Category: </label>
        <select 
          value={selectedCommand} 
          onChange={(e) => setSelectedCommand(e.target.value)}
          style={{ padding: '5px' }}
        >
          {Object.keys(commands.commands).map(category => (
            <option key={category} value={category}>
              {category.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Command Display */}
      <div className="command-section">
        {selectedCommand && commands.commands[selectedCommand] && 
          renderCommandSection(selectedCommand, commands.commands[selectedCommand])
        }
      </div>

      {/* Complete Workflow */}
      {commands.usage_examples && commands.usage_examples.complete_workflow && (
        <div style={{ margin: '20px 0' }}>
          <h4>Complete Workflow</h4>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e9ecef',
            border: '1px solid #ced4da',
            borderRadius: '5px'
          }}>
            <pre style={{ 
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {commands.usage_examples.complete_workflow.join('\n')}
            </pre>
            <button 
              onClick={() => copyCommand(commands.usage_examples.complete_workflow.join('\n'))}
              style={{ 
                marginTop: '10px',
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px'
              }}
            >
              Copy Complete Workflow
            </button>
          </div>
        </div>
      )}

      {/* Troubleshooting */}
      {commands.commands.troubleshooting && (
        <div style={{ margin: '20px 0' }}>
          <h4>Troubleshooting</h4>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '5px'
          }}>
            {Object.entries(commands.commands.troubleshooting).map(([issue, solution]) => (
              <div key={issue} style={{ margin: '10px 0' }}>
                <strong>{issue}:</strong> {solution}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevtoolCLICommands;
```

## Main App Integration

### App.js with Both Alternatives

```jsx
// src/App.js
import React, { useState } from 'react';
import { UserProvider } from './contexts/UserContext';
import WebZjsWallet from './components/WebZjsWallet';
import DevtoolWallet from './components/DevtoolWallet';
import UserLogin from './components/UserLogin';
import AlternativeSelector from './components/AlternativeSelector';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [selectedAlternative, setSelectedAlternative] = useState('webzjs');

  return (
    <ErrorBoundary>
      <UserProvider>
        <div className="App">
          <header className="App-header">
            <h1>Zcash SDK Integration Demo</h1>
          </header>
          
          <main>
            <UserLogin />
            
            <AlternativeSelector 
              selected={selectedAlternative}
              onSelect={setSelectedAlternative}
            />
            
            {selectedAlternative === 'webzjs' && <WebZjsWallet />}
            {selectedAlternative === 'devtool' && <DevtoolWallet />}
          </main>
        </div>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### Alternative Selector Component

```jsx
// src/components/AlternativeSelector.jsx
import React from 'react';

const AlternativeSelector = ({ selected, onSelect }) => {
  return (
    <div className="alternative-selector" style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd',
      borderRadius: '5px'
    }}>
      <h3>Choose Zcash Alternative</h3>
      
      <div style={{ margin: '15px 0' }}>
        <label style={{ marginRight: '20px' }}>
          <input
            type="radio"
            value="webzjs"
            checked={selected === 'webzjs'}
            onChange={(e) => onSelect(e.target.value)}
            style={{ marginRight: '5px' }}
          />
          WebZjs (Browser-based)
        </label>
        
        <label>
          <input
            type="radio"
            value="devtool"
            checked={selected === 'devtool'}
            onChange={(e) => onSelect(e.target.value)}
            style={{ marginRight: '5px' }}
          />
          zcash-devtool (CLI-based)
        </label>
      </div>
      
      <div style={{ fontSize: '14px', color: '#6c757d' }}>
        {selected === 'webzjs' && (
          <p>WebZjs provides browser-native Zcash wallet operations without requiring a backend server.</p>
        )}
        {selected === 'devtool' && (
          <p>zcash-devtool provides CLI-based wallet operations through backend API integration.</p>
        )}
      </div>
    </div>
  );
};

export default AlternativeSelector;
```

This comprehensive React integration guide provides a complete implementation that combines zcash-devtool CLI functionality with the Zcash Paywall SDK and API routes, offering a full-stack solution for Zcash wallet management in React applications.