/**
 * Modularized Route Index
 * Centralizes all route definitions with proper API key authentication
 */

import express from 'express';

// Import individual route modules
import invoiceRouter from './invoice.js';
import withdrawRouter from './withdraw.js';
import adminRouter from './admin.js';
import usersRouter from './users.js';
import apiKeysRouter from './apiKeys.js';

// Import authentication middleware
import { authenticateApiKey, optionalApiKey, requirePermission } from '../middleware/auth.js';

// Import config and utilities
import { pool, config } from '../config/appConfig.js';
import { getBlockchainInfo } from '../config/zcash.js';

const router = express.Router();

/**
 * Public endpoints (no authentication required)
 */

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    // Test Zcash RPC connection
    const blockchainInfo = await getBlockchainInfo();
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        zcash_rpc: 'connected',
        node_blocks: blockchainInfo.blocks,
        node_chain: blockchainInfo.chain
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: error.message.includes('pool') ? 'disconnected' : 'connected',
        zcash_rpc: error.message.includes('RPC') ? 'disconnected' : 'connected'
      }
    });
  }
});

// SDK configuration endpoint
router.get('/api/config', (req, res) => {
  res.json({
    sdk: {
      baseURL: config.sdk.publicApiUrl,
      timeout: config.sdk.defaultTimeout,
      apiVersion: config.sdk.apiVersion,
      environment: config.nodeEnv
    },
    server: {
      version: '1.0.0',
      status: 'online'
    }
  });
});

// API documentation endpoint
router.get('/api', (req, res) => {
  res.json({
    name: 'Zcash Paywall SDK',
    version: '1.0.0',
    description: 'Production-ready Zcash paywall API with API key authentication',
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer zp_your_api_key_here',
      permissions: ['read', 'write', 'admin'],
      endpoints: {
        create_key: 'POST /api/keys/create',
        manage_keys: 'GET /api/keys/user/:user_id'
      }
    },
    sdk_config: '/api/config',
    endpoints: {
      users: {
        'POST /api/users/create': { auth: 'optional', description: 'Create new user' },
        'GET /api/users/:id': { auth: 'optional', description: 'Get user by ID' },
        'GET /api/users/email/:email': { auth: 'optional', description: 'Get user by email' },
        'PUT /api/users/:id': { auth: 'optional', description: 'Update user' },
        'GET /api/users/:id/balance': { auth: 'optional', description: 'Get user balance' },
        'GET /api/users': { auth: 'required', permissions: ['admin'], description: 'List all users' }
      },
      api_keys: {
        'POST /api/keys/create': { auth: 'required', description: 'Create API key' },
        'GET /api/keys/user/:user_id': { auth: 'required', description: 'List user API keys' },
        'GET /api/keys/:id': { auth: 'required', description: 'Get API key details' },
        'PUT /api/keys/:id': { auth: 'required', description: 'Update API key' },
        'DELETE /api/keys/:id': { auth: 'required', description: 'Deactivate API key' },
        'POST /api/keys/:id/regenerate': { auth: 'required', description: 'Regenerate API key' }
      },
      invoices: {
        'POST /api/invoice/create': { auth: 'optional', description: 'Create payment invoice' },
        'POST /api/invoice/check': { auth: 'optional', description: 'Check payment status' },
        'GET /api/invoice/:id': { auth: 'optional', description: 'Get invoice details' },
        'GET /api/invoice/:id/qr': { auth: 'optional', description: 'Get QR code image' },
        'GET /api/invoice/:id/uri': { auth: 'optional', description: 'Get payment URI' },
        'GET /api/invoice/user/:user_id': { auth: 'optional', description: 'List user invoices' }
      },
      withdrawals: {
        'POST /api/withdraw/create': { auth: 'optional', description: 'Create withdrawal request' },
        'GET /api/withdraw/:id': { auth: 'optional', description: 'Get withdrawal details' },
        'GET /api/withdraw/user/:user_id': { auth: 'optional', description: 'List user withdrawals' },
        'POST /api/withdraw/fee-estimate': { auth: 'optional', description: 'Get fee estimate' },
        'POST /api/withdraw/process/:id': { auth: 'required', permissions: ['admin'], description: 'Process withdrawal' }
      },
      admin: {
        'GET /api/admin/stats': { auth: 'required', permissions: ['admin'], description: 'Platform statistics' },
        'GET /api/admin/withdrawals/pending': { auth: 'required', permissions: ['admin'], description: 'Pending withdrawals' },
        'GET /api/admin/balances': { auth: 'required', permissions: ['admin'], description: 'User balances' },
        'GET /api/admin/revenue': { auth: 'required', permissions: ['admin'], description: 'Platform revenue' },
        'GET /api/admin/subscriptions': { auth: 'required', permissions: ['admin'], description: 'Active subscriptions' },
        'GET /api/admin/node-status': { auth: 'required', permissions: ['admin'], description: 'Zcash node status' }
      }
    },
    health_check: 'GET /health'
  });
});

/**
 * API Routes with Authentication
 */

// API Key management routes (always require authentication)
router.use('/api/keys', authenticateApiKey, apiKeysRouter);

// User routes (mixed authentication requirements)
router.use('/api/users', usersRouter);

// Invoice routes (optional authentication)
router.use('/api/invoice', invoiceRouter);

// Withdrawal routes (mixed authentication requirements)
router.use('/api/withdraw', withdrawRouter);

// Admin routes (require admin permission)
router.use('/api/admin', authenticateApiKey, requirePermission('admin'), adminRouter);

/**
 * Error handling
 */

// 404 handler for API routes
router.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid API endpoint`,
    available_endpoints: '/api'
  });
});

// 404 handler for all other routes
router.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    available_endpoints: '/api'
  });
});

export default router;
