# zcash-devtool Frontend Integration Guide

This guide shows you how to integrate zcash-devtool CLI functionality into your frontend application for Zcash wallet operations.

## Overview

zcash-devtool is a CLI prototyping tool from the Zcash Foundation that provides wallet functionality without requiring a full node. This guide shows how to integrate it with frontend applications through various approaches.

### Key Benefits
- ✅ Official Zcash Foundation tool
- ✅ No C++ dependencies or RocksDB issues
- ✅ Pure Rust implementation with SQLite storage
- ✅ Remote light server synchronization
- ✅ Good for prototyping and development

## Prerequisites

- Node.js 18+ for frontend development
- Rust toolchain for zcash-devtool
- Age encryption tool
- Basic understanding of CLI integration

## Installation & Setup

### 1. Install zcash-devtool

```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Age encryption tool
# macOS:
brew install age

# Ubuntu/Debian:
sudo apt install age

# Clone and build zcash-devtool
git clone https://github.com/zcash/zcash-devtool.git
cd zcash-devtool
cargo build --release

# Generate Age encryption key
age-keygen -o identity.age
export AGE_FILE_SSH_KEY=1
```

### 2. Verify Installation

```bash
# Test zcash-devtool
cargo run --release -- --help

# Should show available commands
```

## Integration Approaches

### Approach 1: Node.js Backend Integration

Create a Node.js service that wraps zcash-devtool CLI commands:

```javascript
// backend/services/zcashDevtoolService.js
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

class ZcashDevtoolService {
  constructor(options = {}) {
    this.devtoolPath = options.devtoolPath || './zcash-devtool';
    this.walletsDir = options.walletsDir || './wallets';
    this.identityFile = options.identityFile || './identity.age';
    this.network = options.network || 'testnet';
    
    // Ensure wallets directory exists
    if (!fs.existsSync(this.walletsDir)) {
      fs.mkdirSync(this.walletsDir, { recursive: true });
    }
  }

  // Get server URL based on network
  getServerUrl() {
    return this.network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';
  }

  // Execute zcash-devtool command
  async executeCommand(args, options = {}) {
    const command = `cargo run --release -- ${args.join(' ')}`;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.devtoolPath,
        env: { ...process.env, AGE_FILE_SSH_KEY: '1' },
        ...options
      });
      
      if (stderr && !stderr.includes('Finished')) {
        console.warn('zcash-devtool stderr:', stderr);
      }
      
      return stdout.trim();
    } catch (error) {
      console.error('zcash-devtool command failed:', error);
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  // Create new wallet
  async createWallet(walletName, userId) {
    const walletPath = path.join(this.walletsDir, `wallet_${userId}_${Date.now()}`);
    
    try {
      const args = [
        'wallet', '-w', walletPath,
        'init', '--name', walletName,
        '-i', this.identityFile,
        '-n', this.network
      ];
      
      const output = await this.executeCommand(args);
      
      // Parse mnemonic from output (implementation depends on output format)
      const mnemonicMatch = output.match(/Mnemonic: (.+)/);
      const mnemonic = mnemonicMatch ? mnemonicMatch[1] : null;
      
      return {
        walletPath,
        walletName,
        network: this.network,
        mnemonic,
        output
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // Sync wallet with network
  async syncWallet(walletPath) {
    try {
      const args = [
        'wallet', '-w', walletPath,
        'sync', '--server', this.getServerUrl()
      ];
      
      const output = await this.executeCommand(args);
      return { success: true, output };
    } catch (error) {
      throw new Error(`Failed to sync wallet: ${error.message}`);
    }
  }

  // Get wallet balance
  async getBalance(walletPath) {
    try {
      const args = ['wallet', '-w', walletPath, 'balance'];
      const output = await this.executeCommand(args);
      
      // Parse balance from output
      const balanceMatch = output.match(/Total: ([\d.]+) ZEC/);
      const balance = balanceMatch ? parseFloat(balanceMatch[1]) : 0;
      
      return { balance, output };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Generate new address
  async generateAddress(walletPath) {
    try {
      const args = ['wallet', '-w', walletPath, 'new-address'];
      const output = await this.executeCommand(args);
      
      // Parse address from output
      const addressMatch = output.match(/Address: (.+)/);
      const address = addressMatch ? addressMatch[1] : null;
      
      return { address, output };
    } catch (error) {
      throw new Error(`Failed to generate address: ${error.message}`);
    }
  }

  // List wallet addresses
  async listAddresses(walletPath) {
    try {
      const args = ['wallet', '-w', walletPath, 'addresses'];
      const output = await this.executeCommand(args);
      
      // Parse addresses from output (implementation depends on format)
      const addresses = this.parseAddressesFromOutput(output);
      
      return { addresses, output };
    } catch (error) {
      throw new Error(`Failed to list addresses: ${error.message}`);
    }
  }

  // List transactions
  async listTransactions(walletPath) {
    try {
      const args = ['wallet', '-w', walletPath, 'list-txs'];
      const output = await this.executeCommand(args);
      
      // Parse transactions from output
      const transactions = this.parseTransactionsFromOutput(output);
      
      return { transactions, output };
    } catch (error) {
      throw new Error(`Failed to list transactions: ${error.message}`);
    }
  }

  // Get wallet info
  async getWalletInfo(walletPath) {
    try {
      const args = ['wallet', '-w', walletPath, 'info'];
      const output = await this.executeCommand(args);
      
      return { output };
    } catch (error) {
      throw new Error(`Failed to get wallet info: ${error.message}`);
    }
  }

  // Helper method to parse addresses from CLI output
  parseAddressesFromOutput(output) {
    const addresses = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Adjust regex based on actual output format
      const match = line.match(/^(\d+):\s+(.+)$/);
      if (match) {
        addresses.push({
          index: parseInt(match[1]),
          address: match[2].trim()
        });
      }
    }
    
    return addresses;
  }

  // Helper method to parse transactions from CLI output
  parseTransactionsFromOutput(output) {
    const transactions = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Adjust parsing based on actual output format
      if (line.includes('txid:')) {
        const txMatch = line.match(/txid: (.+)/);
        if (txMatch) {
          transactions.push({
            txid: txMatch[1].trim(),
            // Add more fields as needed
          });
        }
      }
    }
    
    return transactions;
  }

  // Set network
  setNetwork(network) {
    if (!['mainnet', 'testnet'].includes(network)) {
      throw new Error('Invalid network. Use "mainnet" or "testnet"');
    }
    this.network = network;
  }
}

export default ZcashDevtoolService;
```

### Approach 2: Express API Wrapper

Create Express routes that expose zcash-devtool functionality:

```javascript
// backend/routes/devtoolApi.js
import express from 'express';
import ZcashDevtoolService from '../services/zcashDevtoolService.js';
import { pool } from '../config/appConfig.js';

const router = express.Router();
const devtoolService = new ZcashDevtoolService({
  devtoolPath: process.env.ZCASH_DEVTOOL_PATH || './zcash-devtool',
  walletsDir: process.env.WALLETS_DIR || './wallets',
  identityFile: process.env.AGE_IDENTITY_FILE || './identity.age'
});

// Create wallet
router.post('/wallet/create', async (req, res) => {
  const { user_id, wallet_name, network = 'testnet' } = req.body;

  if (!user_id || !wallet_name) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, wallet_name'
    });
  }

  try {
    // Set network
    devtoolService.setNetwork(network);
    
    // Create wallet using zcash-devtool
    const walletResult = await devtoolService.createWallet(wallet_name, user_id);
    
    // Store wallet info in database
    const dbResult = await pool.query(
      `INSERT INTO devtool_wallets (user_id, name, network, wallet_path, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [user_id, wallet_name, network, walletResult.walletPath]
    );

    const wallet = dbResult.rows[0];

    res.status(201).json({
      success: true,
      wallet: {
        id: wallet.id,
        user_id: wallet.user_id,
        name: wallet.name,
        network: wallet.network,
        wallet_path: wallet.wallet_path,
        mnemonic: walletResult.mnemonic,
        created_at: wallet.created_at
      },
      cli_output: walletResult.output
    });

  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({
      error: 'Failed to create wallet',
      details: error.message
    });
  }
});

// Sync wallet
router.post('/wallet/:wallet_id/sync', async (req, res) => {
  const { wallet_id } = req.params;

  try {
    // Get wallet from database
    const walletResult = await pool.query(
      'SELECT * FROM devtool_wallets WHERE id = $1',
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = walletResult.rows[0];
    devtoolService.setNetwork(wallet.network);

    // Sync wallet
    const syncResult = await devtoolService.syncWallet(wallet.wallet_path);

    res.json({
      success: true,
      wallet_id: wallet.id,
      sync_result: syncResult,
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Wallet sync error:', error);
    res.status(500).json({
      error: 'Failed to sync wallet',
      details: error.message
    });
  }
});

// Get wallet balance
router.get('/wallet/:wallet_id/balance', async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      'SELECT * FROM devtool_wallets WHERE id = $1',
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = walletResult.rows[0];
    devtoolService.setNetwork(wallet.network);

    const balanceResult = await devtoolService.getBalance(wallet.wallet_path);

    res.json({
      success: true,
      wallet_id: wallet.id,
      balance: balanceResult.balance,
      network: wallet.network,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({
      error: 'Failed to get balance',
      details: error.message
    });
  }
});

// Generate new address
router.post('/wallet/:wallet_id/address/generate', async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      'SELECT * FROM devtool_wallets WHERE id = $1',
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = walletResult.rows[0];
    devtoolService.setNetwork(wallet.network);

    const addressResult = await devtoolService.generateAddress(wallet.wallet_path);

    res.json({
      success: true,
      wallet_id: wallet.id,
      address: addressResult.address,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Address generation error:', error);
    res.status(500).json({
      error: 'Failed to generate address',
      details: error.message
    });
  }
});

// List wallet addresses
router.get('/wallet/:wallet_id/addresses', async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      'SELECT * FROM devtool_wallets WHERE id = $1',
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = walletResult.rows[0];
    devtoolService.setNetwork(wallet.network);

    const addressesResult = await devtoolService.listAddresses(wallet.wallet_path);

    res.json({
      success: true,
      wallet_id: wallet.id,
      addresses: addressesResult.addresses,
      total_count: addressesResult.addresses.length
    });

  } catch (error) {
    console.error('List addresses error:', error);
    res.status(500).json({
      error: 'Failed to list addresses',
      details: error.message
    });
  }
});

// List wallet transactions
router.get('/wallet/:wallet_id/transactions', async (req, res) => {
  const { wallet_id } = req.params;

  try {
    const walletResult = await pool.query(
      'SELECT * FROM devtool_wallets WHERE id = $1',
      [wallet_id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = walletResult.rows[0];
    devtoolService.setNetwork(wallet.network);

    const transactionsResult = await devtoolService.listTransactions(wallet.wallet_path);

    res.json({
      success: true,
      wallet_id: wallet.id,
      transactions: transactionsResult.transactions,
      total_count: transactionsResult.transactions.length
    });

  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({
      error: 'Failed to list transactions',
      details: error.message
    });
  }
});

export default router;
```

### Approach 3: Frontend Service Integration

Create a frontend service that communicates with the backend API:

```javascript
// frontend/src/services/zcashDevtoolService.js
class ZcashDevtoolFrontendService {
  constructor(apiBaseUrl = 'http://localhost:3000/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  // Create wallet
  async createWallet(userId, walletName, network = 'testnet') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devtool/wallet/create`, {
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
        throw new Error(result.error || 'Failed to create wallet');
      }

      return result.wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  // Sync wallet
  async syncWallet(walletId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devtool/wallet/${walletId}/sync`, {
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
      console.error('Failed to sync wallet:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getBalance(walletId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devtool/wallet/${walletId}/balance`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get balance');
      }

      return result.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Generate new address
  async generateAddress(walletId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devtool/wallet/${walletId}/address/generate`, {
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
      console.error('Failed to generate address:', error);
      throw error;
    }
  }

  // List wallet addresses
  async listAddresses(walletId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devtool/wallet/${walletId}/addresses`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to list addresses');
      }

      return result.addresses;
    } catch (error) {
      console.error('Failed to list addresses:', error);
      throw error;
    }
  }

  // List wallet transactions
  async listTransactions(walletId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/devtool/wallet/${walletId}/transactions`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to list transactions');
      }

      return result.transactions;
    } catch (error) {
      console.error('Failed to list transactions:', error);
      throw error;
    }
  }

  // Get user wallets
  async getUserWallets(userId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/zcash-devtool/wallet/user/${userId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get user wallets');
      }

      return result.wallets;
    } catch (error) {
      console.error('Failed to get user wallets:', error);
      throw error;
    }
  }
}

export default ZcashDevtoolFrontendService;
```

## React Component Example

```jsx
// frontend/src/components/ZcashDevtoolWallet.jsx
import React, { useState, useEffect } from 'react';
import ZcashDevtoolFrontendService from '../services/zcashDevtoolService';

const ZcashDevtoolWallet = ({ userId }) => {
  const [devtoolService] = useState(new ZcashDevtoolFrontendService());
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState('testnet');

  // Load user wallets on component mount
  useEffect(() => {
    if (userId) {
      loadUserWallets();
    }
  }, [userId]);

  // Load user wallets
  const loadUserWallets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userWallets = await devtoolService.getUserWallets(userId);
      setWallets(userWallets);
      
      if (userWallets.length > 0) {
        setSelectedWallet(userWallets[0]);
        await loadWalletData(userWallets[0].id);
      }
    } catch (err) {
      setError(`Failed to load wallets: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load wallet data (balance, addresses, transactions)
  const loadWalletData = async (walletId) => {
    setLoading(true);
    setError('');
    
    try {
      const [walletBalance, walletAddresses, walletTransactions] = await Promise.all([
        devtoolService.getBalance(walletId),
        devtoolService.listAddresses(walletId),
        devtoolService.listTransactions(walletId)
      ]);

      setBalance(walletBalance);
      setAddresses(walletAddresses);
      setTransactions(walletTransactions);
    } catch (err) {
      setError(`Failed to load wallet data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new wallet
  const handleCreateWallet = async () => {
    const walletName = prompt('Enter wallet name:');
    if (!walletName) return;

    setLoading(true);
    setError('');
    
    try {
      const newWallet = await devtoolService.createWallet(userId, walletName, network);
      
      // Reload wallets list
      await loadUserWallets();
      
      // Select the new wallet
      setSelectedWallet(newWallet);
      await loadWalletData(newWallet.id);
      
      alert(`Wallet created successfully!\nMnemonic: ${newWallet.mnemonic}\n\nPlease save this mnemonic securely!`);
    } catch (err) {
      setError(`Failed to create wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync selected wallet
  const handleSyncWallet = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    setError('');
    
    try {
      await devtoolService.syncWallet(selectedWallet.id);
      await loadWalletData(selectedWallet.id);
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
      const newAddress = await devtoolService.generateAddress(selectedWallet.id);
      
      // Reload addresses
      const updatedAddresses = await devtoolService.listAddresses(selectedWallet.id);
      setAddresses(updatedAddresses);
      
      alert(`New address generated: ${newAddress}`);
    } catch (err) {
      setError(`Failed to generate address: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Select wallet
  const handleWalletSelect = async (wallet) => {
    setSelectedWallet(wallet);
    await loadWalletData(wallet.id);
  };

  return (
    <div className="zcash-devtool-wallet">
      <h2>zcash-devtool Wallet Manager</h2>
      
      {/* Network Selection */}
      <div className="network-selection">
        <label>Network: </label>
        <select 
          value={network} 
          onChange={(e) => setNetwork(e.target.value)}
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

      {/* Wallet Selection */}
      <div className="wallet-selection">
        <h3>Your Wallets</h3>
        <button onClick={handleCreateWallet} disabled={loading}>
          Create New Wallet
        </button>
        
        {wallets.length > 0 && (
          <div style={{ margin: '10px 0' }}>
            <select 
              value={selectedWallet?.id || ''} 
              onChange={(e) => {
                const wallet = wallets.find(w => w.id === parseInt(e.target.value));
                if (wallet) handleWalletSelect(wallet);
              }}
              disabled={loading}
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
      </div>

      {/* Wallet Actions */}
      {selectedWallet && (
        <div className="wallet-actions">
          <h3>Wallet: {selectedWallet.name}</h3>
          
          <div style={{ margin: '10px 0' }}>
            <button onClick={handleSyncWallet} disabled={loading} style={{ margin: '5px' }}>
              {loading ? 'Syncing...' : 'Sync Wallet'}
            </button>
            <button onClick={handleGenerateAddress} disabled={loading} style={{ margin: '5px' }}>
              Generate Address
            </button>
          </div>

          {/* Balance */}
          <div className="balance-info">
            <h4>Balance: {balance} ZEC</h4>
          </div>

          {/* Addresses */}
          <div className="addresses-section">
            <h4>Addresses ({addresses.length})</h4>
            {addresses.length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {addresses.map((addr, index) => (
                  <div key={index} style={{ 
                    margin: '5px 0', 
                    padding: '5px', 
                    backgroundColor: '#f5f5f5',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all'
                  }}>
                    {addr.index}: {addr.address}
                  </div>
                ))}
              </div>
            ) : (
              <p>No addresses found. Generate an address to get started.</p>
            )}
          </div>

          {/* Transactions */}
          <div className="transactions-section">
            <h4>Transactions ({transactions.length})</h4>
            {transactions.length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {transactions.map((tx, index) => (
                  <div key={index} style={{ 
                    margin: '5px 0', 
                    padding: '5px', 
                    backgroundColor: '#f0f8ff',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}>
                    <div><strong>TxID:</strong> {tx.txid}</div>
                    {/* Add more transaction details as needed */}
                  </div>
                ))}
              </div>
            ) : (
              <p>No transactions found.</p>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      )}

      {/* CLI Instructions */}
      {selectedWallet && (
        <div className="cli-instructions" style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <h4>CLI Commands for this wallet:</h4>
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            <div><strong>Sync:</strong> cargo run --release -- wallet -w {selectedWallet.wallet_path} sync --server {network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks'}</div>
            <div><strong>Balance:</strong> cargo run --release -- wallet -w {selectedWallet.wallet_path} balance</div>
            <div><strong>New Address:</strong> cargo run --release -- wallet -w {selectedWallet.wallet_path} new-address</div>
            <div><strong>List TXs:</strong> cargo run --release -- wallet -w {selectedWallet.wallet_path} list-txs</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZcashDevtoolWallet;
```

## Vue.js Component Example

```vue
<!-- frontend/src/components/ZcashDevtoolWallet.vue -->
<template>
  <div class="zcash-devtool-wallet">
    <h2>zcash-devtool Wallet Manager</h2>
    
    <!-- Network Selection -->
    <div class="network-selection">
      <label>Network: </label>
      <select v-model="network" :disabled="loading">
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error" style="color: red; margin: 10px 0;">
      {{ error }}
    </div>

    <!-- Wallet Selection -->
    <div class="wallet-selection">
      <h3>Your Wallets</h3>
      <button @click="handleCreateWallet" :disabled="loading">
        Create New Wallet
      </button>
      
      <div v-if="wallets.length > 0" style="margin: 10px 0;">
        <select v-model="selectedWalletId" @change="handleWalletSelect" :disabled="loading">
          <option value="">Select a wallet...</option>
          <option v-for="wallet in wallets" :key="wallet.id" :value="wallet.id">
            {{ wallet.name }} ({{ wallet.network }})
          </option>
        </select>
      </div>
    </div>

    <!-- Wallet Actions -->
    <div v-if="selectedWallet" class="wallet-actions">
      <h3>Wallet: {{ selectedWallet.name }}</h3>
      
      <div style="margin: 10px 0;">
        <button @click="handleSyncWallet" :disabled="loading" style="margin: 5px;">
          {{ loading ? 'Syncing...' : 'Sync Wallet' }}
        </button>
        <button @click="handleGenerateAddress" :disabled="loading" style="margin: 5px;">
          Generate Address
        </button>
      </div>

      <!-- Balance -->
      <div class="balance-info">
        <h4>Balance: {{ balance }} ZEC</h4>
      </div>

      <!-- Addresses -->
      <div class="addresses-section">
        <h4>Addresses ({{ addresses.length }})</h4>
        <div v-if="addresses.length > 0" style="max-height: 200px; overflow-y: auto;">
          <div 
            v-for="(addr, index) in addresses" 
            :key="index" 
            style="margin: 5px 0; padding: 5px; background-color: #f5f5f5; font-family: monospace; font-size: 12px; word-break: break-all;"
          >
            {{ addr.index }}: {{ addr.address }}
          </div>
        </div>
        <p v-else>No addresses found. Generate an address to get started.</p>
      </div>

      <!-- Transactions -->
      <div class="transactions-section">
        <h4>Transactions ({{ transactions.length }})</h4>
        <div v-if="transactions.length > 0" style="max-height: 200px; overflow-y: auto;">
          <div 
            v-for="(tx, index) in transactions" 
            :key="index" 
            style="margin: 5px 0; padding: 5px; background-color: #f0f8ff; font-family: monospace; font-size: 12px;"
          >
            <div><strong>TxID:</strong> {{ tx.txid }}</div>
          </div>
        </div>
        <p v-else>No transactions found.</p>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" style="margin: 20px 0; text-align: center;">
      <div>Loading...</div>
    </div>

    <!-- CLI Instructions -->
    <div v-if="selectedWallet" class="cli-instructions" style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
      <h4>CLI Commands for this wallet:</h4>
      <div style="font-family: monospace; font-size: 12px;">
        <div><strong>Sync:</strong> cargo run --release -- wallet -w {{ selectedWallet.wallet_path }} sync --server {{ getServerUrl() }}</div>
        <div><strong>Balance:</strong> cargo run --release -- wallet -w {{ selectedWallet.wallet_path }} balance</div>
        <div><strong>New Address:</strong> cargo run --release -- wallet -w {{ selectedWallet.wallet_path }} new-address</div>
        <div><strong>List TXs:</strong> cargo run --release -- wallet -w {{ selectedWallet.wallet_path }} list-txs</div>
      </div>
    </div>
  </div>
</template>

<script>
import ZcashDevtoolFrontendService from '../services/zcashDevtoolService';

export default {
  name: 'ZcashDevtoolWallet',
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      devtoolService: new ZcashDevtoolFrontendService(),
      wallets: [],
      selectedWallet: null,
      selectedWalletId: '',
      balance: 0,
      addresses: [],
      transactions: [],
      loading: false,
      error: '',
      network: 'testnet'
    };
  },
  async mounted() {
    if (this.userId) {
      await this.loadUserWallets();
    }
  },
  methods: {
    async loadUserWallets() {
      this.loading = true;
      this.error = '';
      
      try {
        const userWallets = await this.devtoolService.getUserWallets(this.userId);
        this.wallets = userWallets;
        
        if (userWallets.length > 0) {
          this.selectedWallet = userWallets[0];
          this.selectedWalletId = userWallets[0].id;
          await this.loadWalletData(userWallets[0].id);
        }
      } catch (err) {
        this.error = `Failed to load wallets: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async loadWalletData(walletId) {
      this.loading = true;
      this.error = '';
      
      try {
        const [walletBalance, walletAddresses, walletTransactions] = await Promise.all([
          this.devtoolService.getBalance(walletId),
          this.devtoolService.listAddresses(walletId),
          this.devtoolService.listTransactions(walletId)
        ]);

        this.balance = walletBalance;
        this.addresses = walletAddresses;
        this.transactions = walletTransactions;
      } catch (err) {
        this.error = `Failed to load wallet data: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async handleCreateWallet() {
      const walletName = prompt('Enter wallet name:');
      if (!walletName) return;

      this.loading = true;
      this.error = '';
      
      try {
        const newWallet = await this.devtoolService.createWallet(this.userId, walletName, this.network);
        
        await this.loadUserWallets();
        
        this.selectedWallet = newWallet;
        this.selectedWalletId = newWallet.id;
        await this.loadWalletData(newWallet.id);
        
        alert(`Wallet created successfully!\nMnemonic: ${newWallet.mnemonic}\n\nPlease save this mnemonic securely!`);
      } catch (err) {
        this.error = `Failed to create wallet: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async handleSyncWallet() {
      if (!this.selectedWallet) return;

      this.loading = true;
      this.error = '';
      
      try {
        await this.devtoolService.syncWallet(this.selectedWallet.id);
        await this.loadWalletData(this.selectedWallet.id);
      } catch (err) {
        this.error = `Failed to sync wallet: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async handleGenerateAddress() {
      if (!this.selectedWallet) return;

      this.loading = true;
      this.error = '';
      
      try {
        const newAddress = await this.devtoolService.generateAddress(this.selectedWallet.id);
        
        const updatedAddresses = await this.devtoolService.listAddresses(this.selectedWallet.id);
        this.addresses = updatedAddresses;
        
        alert(`New address generated: ${newAddress}`);
      } catch (err) {
        this.error = `Failed to generate address: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async handleWalletSelect() {
      if (!this.selectedWalletId) return;
      
      const wallet = this.wallets.find(w => w.id === parseInt(this.selectedWalletId));
      if (wallet) {
        this.selectedWallet = wallet;
        await this.loadWalletData(wallet.id);
      }
    },

    getServerUrl() {
      return this.network === 'mainnet' ? 'zec.rocks' : 'zec-testnet.rocks';
    }
  }
};
</script>
```

## Production Considerations

### Security

1. **CLI Command Injection Prevention**:
```javascript
// Sanitize inputs to prevent command injection
const sanitizeInput = (input) => {
  return input.replace(/[;&|`$(){}[\]\\]/g, '');
};
```

2. **Age Key Management**:
```bash
# Store Age keys securely
chmod 600 identity.age
export AGE_FILE_SSH_KEY=1
```

3. **Wallet Path Security**:
```javascript
// Validate wallet paths to prevent directory traversal
const validateWalletPath = (path) => {
  const normalizedPath = path.normalize(path);
  return normalizedPath.startsWith('./wallets/') && !normalizedPath.includes('..');
};
```

### Error Handling

```javascript
// Enhanced error handling for CLI operations
class DevtoolError extends Error {
  constructor(message, command, output) {
    super(message);
    this.name = 'DevtoolError';
    this.command = command;
    this.output = output;
  }
}

const handleDevtoolError = (error, command) => {
  if (error.message.includes('Age key')) {
    return new DevtoolError('Age encryption key not found or invalid', command, error.message);
  }
  
  if (error.message.includes('network')) {
    return new DevtoolError('Network connection failed', command, error.message);
  }
  
  return new DevtoolError('Unknown devtool error', command, error.message);
};
```

### Performance Optimization

```javascript
// Cache wallet data to reduce CLI calls
class WalletCache {
  constructor(ttl = 30000) { // 30 second TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}
```

This comprehensive guide provides multiple approaches for integrating zcash-devtool with frontend applications, from direct CLI wrapping to full API integration with React and Vue.js components.