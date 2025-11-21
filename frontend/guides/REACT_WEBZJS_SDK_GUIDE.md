# React WebZjs SDK Integration Guide

This guide shows how to integrate WebZjs with React applications using the Zcash Paywall SDK and API routes.

## Overview

This implementation combines:
- **WebZjs** for browser-based Zcash wallet operations
- **Zcash Paywall SDK** for backend API integration
- **React** for frontend user interface
- **API Routes** for wallet management and payments

## Installation & Setup

### 1. Install Dependencies

```bash
# Install WebZjs and SDK
npm install @chainsafe/webzjs-wallet
npm install zcash-paywall-sdk

# Install React dependencies
npm install react react-dom
npm install axios  # for API calls
```

### 2. Environment Configuration

```bash
# .env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_ZCASH_NETWORK=testnet
REACT_APP_WEBZJS_MAINNET_PROXY=https://zcash-mainnet.chainsafe.dev
REACT_APP_WEBZJS_TESTNET_PROXY=https://zcash-testnet.chainsafe.dev
```

## SDK Integration Layer

### 1. Create SDK Service

```javascript
// src/services/zcashSDK.js
import { ZcashPaywall } from 'zcash-paywall-sdk';

class ZcashSDKService {
  constructor() {
    this.sdk = new ZcashPaywall({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
      timeout: 30000
    });
  }

  // User management
  async createUser(email, name) {
    return await this.sdk.users.create({ email, name });
  }

  async getUser(userId) {
    return await this.sdk.users.get(userId);
  }

  // WebZjs wallet management via API
  async createWebZjsWallet(userId, walletName, network = 'testnet', mnemonic = null) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/wallet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          wallet_name: walletName,
          network: network,
          mnemonic: mnemonic
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create WebZjs wallet');
      }

      return result.wallet;
    } catch (error) {
      console.error('SDK: Failed to create WebZjs wallet:', error);
      throw error;
    }
  }

  async getUserWebZjsWallets(userId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/wallet/user/${userId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get WebZjs wallets');
      }

      return result.wallets;
    } catch (error) {
      console.error('SDK: Failed to get WebZjs wallets:', error);
      throw error;
    }
  }

  async getWebZjsWalletSetup(walletId) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/wallet/${walletId}/setup`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get wallet setup');
      }

      return result;
    } catch (error) {
      console.error('SDK: Failed to get wallet setup:', error);
      throw error;
    }
  }

  // WebZjs invoice management
  async createWebZjsInvoice(userId, walletId, amount, description) {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/invoice/create`, {
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
        throw new Error(result.error || 'Failed to create WebZjs invoice');
      }

      return result.invoice;
    } catch (error) {
      console.error('SDK: Failed to create WebZjs invoice:', error);
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

  // Get WebZjs configuration
  async getWebZjsConfig() {
    try {
      const response = await fetch(`${this.sdk.config.baseURL}/api/webzjs/config`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get WebZjs config');
      }

      return result.webzjs;
    } catch (error) {
      console.error('SDK: Failed to get WebZjs config:', error);
      throw error;
    }
  }
}

export default ZcashSDKService;
```

### 2. WebZjs Integration Service

```javascript
// src/services/webzjsIntegration.js
import { initWasm, initThreadPool, Wallet } from "@chainsafe/webzjs-wallet";
import ZcashSDKService from './zcashSDK';

class WebZjsIntegrationService {
  constructor() {
    this.sdkService = new ZcashSDKService();
    this.wallet = null;
    this.initialized = false;
    this.network = process.env.REACT_APP_ZCASH_NETWORK || 'testnet';
  }

  // Initialize WebZjs
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

  // Get proxy URL from environment
  getProxyUrl() {
    return this.network === 'mainnet' 
      ? process.env.REACT_APP_WEBZJS_MAINNET_PROXY
      : process.env.REACT_APP_WEBZJS_TESTNET_PROXY;
  }

  // Create wallet (WebZjs + SDK)
  async createWallet(userId, walletName, mnemonic = null) {
    await this.initialize();
    
    try {
      // Create WebZjs wallet instance
      this.wallet = mnemonic 
        ? await Wallet.fromMnemonic(mnemonic)
        : await Wallet.create();

      const address = this.wallet.getAddress();
      const walletMnemonic = this.wallet.getMnemonic();

      // Store wallet configuration via SDK
      const walletConfig = await this.sdkService.createWebZjsWallet(
        userId, 
        walletName, 
        this.network, 
        walletMnemonic
      );

      return {
        wallet: this.wallet,
        config: walletConfig,
        address: address,
        mnemonic: walletMnemonic
      };
    } catch (error) {
      console.error('Failed to create integrated wallet:', error);
      throw error;
    }
  }

  // Restore wallet from SDK configuration
  async restoreWalletFromConfig(walletId) {
    await this.initialize();
    
    try {
      // Get wallet setup from SDK
      const setupData = await this.sdkService.getWebZjsWalletSetup(walletId);
      
      // Extract mnemonic from setup (in production, this should be encrypted)
      const mnemonic = setupData.setup.mnemonic || setupData.wallet.mnemonic;
      
      if (!mnemonic) {
        throw new Error('No mnemonic available for wallet restoration');
      }

      // Restore WebZjs wallet
      this.wallet = await Wallet.fromMnemonic(mnemonic);
      
      return {
        wallet: this.wallet,
        config: setupData.wallet,
        address: this.wallet.getAddress()
      };
    } catch (error) {
      console.error('Failed to restore wallet from config:', error);
      throw error;
    }
  }

  // Sync wallet
  async syncWallet() {
    if (!this.wallet) {
      throw new Error('No wallet available to sync');
    }

    try {
      const proxyUrl = this.getProxyUrl();
      await this.wallet.synchronize(proxyUrl);
      console.log('Wallet synchronized successfully');
    } catch (error) {
      console.error('Failed to sync wallet:', error);
      throw error;
    }
  }

  // Get wallet info
  async getWalletInfo() {
    if (!this.wallet) {
      throw new Error('No wallet available');
    }

    try {
      const address = this.wallet.getAddress();
      const balance = await this.wallet.getBalance();
      
      return {
        address,
        balance,
        network: this.network,
        proxyUrl: this.getProxyUrl()
      };
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      throw error;
    }
  }

  // Create payment invoice
  async createPaymentInvoice(userId, walletId, amount, description) {
    try {
      const invoice = await this.sdkService.createWebZjsInvoice(
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

export default WebZjsIntegrationService;
```

## React Components

### 1. Main WebZjs Wallet Component

```jsx
// src/components/WebZjsWallet.jsx
import React, { useState, useEffect, useContext } from 'react';
import WebZjsIntegrationService from '../services/webzjsIntegration';
import { UserContext } from '../contexts/UserContext';
import WalletSelector from './WalletSelector';
import WalletInfo from './WalletInfo';
import PaymentInterface from './PaymentInterface';
import ErrorBoundary from './ErrorBoundary';

const WebZjsWallet = () => {
  const { user } = useContext(UserContext);
  const [integrationService] = useState(new WebZjsIntegrationService());
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
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
      const userWallets = await integrationService.sdkService.getUserWebZjsWallets(user.id);
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

  // Select and restore wallet
  const selectWallet = async (wallet) => {
    setLoading(true);
    setError('');
    
    try {
      setSelectedWallet(wallet);
      
      // Restore wallet from configuration
      const restoredWallet = await integrationService.restoreWalletFromConfig(wallet.id);
      
      // Sync and get wallet info
      await integrationService.syncWallet();
      const info = await integrationService.getWalletInfo();
      
      setWalletInfo(info);
    } catch (err) {
      setError(`Failed to select wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new wallet
  const handleCreateWallet = async (walletName, mnemonic = null) => {
    setLoading(true);
    setError('');
    
    try {
      integrationService.setNetwork(network);
      
      const newWallet = await integrationService.createWallet(
        user.id, 
        walletName, 
        mnemonic
      );
      
      // Reload wallets list
      await loadUserWallets();
      
      // Select the new wallet
      await selectWallet(newWallet.config);
      
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
      await integrationService.syncWallet();
      const info = await integrationService.getWalletInfo();
      setWalletInfo(info);
    } catch (err) {
      setError(`Failed to sync wallet: ${err.message}`);
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
      <div className="webzjs-wallet">
        <h2>WebZjs Wallet</h2>
        <p>Please log in to access your wallet.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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

        {/* Wallet Selector */}
        <WalletSelector
          wallets={wallets}
          selectedWallet={selectedWallet}
          onSelectWallet={selectWallet}
          onCreateWallet={handleCreateWallet}
          loading={loading}
          network={network}
        />

        {/* Wallet Information */}
        {selectedWallet && walletInfo && (
          <WalletInfo
            wallet={selectedWallet}
            walletInfo={walletInfo}
            onSync={handleSyncWallet}
            loading={loading}
          />
        )}

        {/* Payment Interface */}
        {selectedWallet && (
          <PaymentInterface
            wallet={selectedWallet}
            onCreateInvoice={handleCreateInvoice}
            loading={loading}
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

export default WebZjsWallet;
```

### 2. Wallet Selector Component

```jsx
// src/components/WalletSelector.jsx
import React, { useState } from 'react';

const WalletSelector = ({ 
  wallets, 
  selectedWallet, 
  onSelectWallet, 
  onCreateWallet, 
  loading, 
  network 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRestoreForm, setShowRestoreForm] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    
    if (!walletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }

    try {
      const newWallet = await onCreateWallet(walletName);
      
      // Show mnemonic to user
      alert(`Wallet created successfully!\n\nMnemonic: ${newWallet.mnemonic}\n\n⚠️ IMPORTANT: Save this mnemonic phrase securely. You'll need it to restore your wallet.`);
      
      // Reset form
      setWalletName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleRestoreWallet = async (e) => {
    e.preventDefault();
    
    if (!walletName.trim() || !mnemonic.trim()) {
      alert('Please enter both wallet name and mnemonic phrase');
      return;
    }

    try {
      await onCreateWallet(walletName, mnemonic);
      
      // Reset form
      setWalletName('');
      setMnemonic('');
      setShowRestoreForm(false);
    } catch (error) {
      console.error('Failed to restore wallet:', error);
    }
  };

  return (
    <div className="wallet-selector">
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
        
        <button 
          onClick={() => setShowRestoreForm(!showRestoreForm)} 
          disabled={loading}
          style={{ margin: '5px' }}
        >
          Restore Wallet
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
          <h4>Create New Wallet</h4>
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

      {/* Restore Wallet Form */}
      {showRestoreForm && (
        <div className="restore-wallet-form" style={{ 
          margin: '15px 0', 
          padding: '15px', 
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          <h4>Restore Wallet</h4>
          <form onSubmit={handleRestoreWallet}>
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
            <div style={{ margin: '10px 0' }}>
              <small>Network: {network}</small>
            </div>
            <div>
              <button type="submit" disabled={loading}>
                Restore Wallet
              </button>
              <button 
                type="button" 
                onClick={() => setShowRestoreForm(false)}
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

export default WalletSelector;
```

### 3. Wallet Info Component

```jsx
// src/components/WalletInfo.jsx
import React from 'react';

const WalletInfo = ({ wallet, walletInfo, onSync, loading }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <div className="wallet-info" style={{ 
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
        <strong>Network:</strong> {walletInfo.network}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Proxy URL:</strong> {walletInfo.proxyUrl}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Address:</strong>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '5px 0' 
        }}>
          <div style={{ 
            wordBreak: 'break-all', 
            backgroundColor: '#f5f5f5', 
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            flex: 1,
            marginRight: '10px'
          }}>
            {walletInfo.address}
          </div>
          <button 
            onClick={() => copyToClipboard(walletInfo.address)}
            style={{ padding: '5px 10px' }}
          >
            Copy
          </button>
        </div>
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Balance:</strong> {walletInfo.balance} ZEC
      </div>
      
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
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Syncing...' : 'Sync Wallet'}
        </button>
      </div>
    </div>
  );
};

export default WalletInfo;
```

### 4. Payment Interface Component

```jsx
// src/components/PaymentInterface.jsx
import React, { useState } from 'react';

const PaymentInterface = ({ wallet, onCreateInvoice, loading }) => {
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
Payment Request
Amount: ${invoice.amount_zec} ZEC
Description: ${invoice.description || 'No description'}
Invoice ID: ${invoice.id}
Created: ${new Date(invoice.created_at).toLocaleString()}
    `.trim();
    
    navigator.clipboard.writeText(invoiceText).then(() => {
      alert('Invoice information copied to clipboard!');
    });
  };

  return (
    <div className="payment-interface" style={{ 
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
              Copy Invoice Info
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

export default PaymentInterface;
```

### 5. User Context Provider

```jsx
// src/contexts/UserContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import ZcashSDKService from '../services/zcashSDK';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sdkService] = useState(new ZcashSDKService());

  // Create or get user
  const createUser = async (email, name) => {
    setLoading(true);
    try {
      const newUser = await sdkService.createUser(email, name);
      setUser(newUser);
      
      // Store user in localStorage
      localStorage.setItem('zcash_user', JSON.stringify(newUser));
      
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('zcash_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('zcash_user');
      }
    }
  }, []);

  // Logout user
  const logout = () => {
    setUser(null);
    localStorage.removeItem('zcash_user');
  };

  const value = {
    user,
    loading,
    createUser,
    logout,
    sdkService
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
```

### 6. Error Boundary Component

```jsx
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WebZjs Error Boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          border: '1px solid #dc3545',
          borderRadius: '5px',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          <h2>WebZjs Integration Error</h2>
          <p>Something went wrong with the Zcash wallet integration.</p>
          
          {this.state.error && (
            <details style={{ marginTop: '10px' }}>
              <summary>Error Details</summary>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Main App Integration

### App.js

```jsx
// src/App.js
import React from 'react';
import { UserProvider } from './contexts/UserContext';
import WebZjsWallet from './components/WebZjsWallet';
import UserLogin from './components/UserLogin';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <div className="App">
          <header className="App-header">
            <h1>Zcash WebZjs Integration Demo</h1>
          </header>
          
          <main>
            <UserLogin />
            <WebZjsWallet />
          </main>
        </div>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### User Login Component

```jsx
// src/components/UserLogin.jsx
import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

const UserLogin = () => {
  const { user, createUser, logout, loading } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!email || !name) {
      alert('Please enter both email and name');
      return;
    }

    try {
      await createUser(email, name);
      setEmail('');
      setName('');
      setShowForm(false);
    } catch (error) {
      alert(`Failed to create user: ${error.message}`);
    }
  };

  if (user) {
    return (
      <div className="user-info" style={{ 
        margin: '20px 0', 
        padding: '15px', 
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '5px'
      }}>
        <h3>Welcome, {user.name}!</h3>
        <p>Email: {user.email}</p>
        <p>User ID: {user.id}</p>
        <button 
          onClick={logout}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="user-login" style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd',
      borderRadius: '5px'
    }}>
      <h3>User Login</h3>
      
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Create/Login User
        </button>
      ) : (
        <form onSubmit={handleCreateUser}>
          <div style={{ margin: '10px 0' }}>
            <label>Email: </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{ width: '200px', padding: '5px' }}
            />
          </div>
          <div style={{ margin: '10px 0' }}>
            <label>Name: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              style={{ width: '200px', padding: '5px' }}
            />
          </div>
          <div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserLogin;
```

## Usage Example

```jsx
// Example usage in your React app
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Testing

```javascript
// src/tests/WebZjsIntegration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '../contexts/UserContext';
import WebZjsWallet from '../components/WebZjsWallet';

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
    })
  }
}));

describe('WebZjs Integration', () => {
  test('renders wallet component', () => {
    render(
      <UserProvider>
        <WebZjsWallet />
      </UserProvider>
    );
    
    expect(screen.getByText('WebZjs Zcash Wallet')).toBeInTheDocument();
  });
});
```

This comprehensive React integration guide provides a complete implementation that combines WebZjs browser functionality with the Zcash Paywall SDK and API routes, offering a production-ready foundation for Zcash wallet applications.