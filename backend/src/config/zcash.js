import axios from 'axios';
import { config } from './appConfig.js';

const rpcConfig = {
  url: config.zcash.rpcUrl,
  auth: {
    username: config.zcash.rpcUser,
    password: config.zcash.rpcPass,
  },
};

/**
 * Execute Zcash RPC command
 * @param {string} method - RPC method name
 * @param {Array} params - RPC parameters
 * @returns {Promise<any>} RPC result
 */
export async function zcashRpc(method, params = []) {
  try {
    const response = await axios.post(rpcConfig.url, {
      jsonrpc: '1.0',
      id: Date.now(),
      method,
      params,
    }, {
      auth: rpcConfig.auth,
      headers: { 'Content-Type': 'text/plain' },
      timeout: 30000,
    });

    if (response.data.error) {
      throw new Error(`Zcash RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`Zcash RPC HTTP Error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw new Error(`Zcash RPC Connection Error: ${error.message}`);
  }
}

/**
 * Get new shielded address
 * @returns {Promise<string>} New z-address
 */
export async function generateZAddress() {
  return await zcashRpc('z_getnewaddress');
}

/**
 * Check received amount for address
 * @param {string} address - Z-address to check
 * @param {number} minconf - Minimum confirmations (default: 0)
 * @returns {Promise<Array>} Array of received transactions
 */
export async function getReceivedByAddress(address, minconf = 0) {
  return await zcashRpc('z_listreceivedbyaddress', [minconf, [address]]);
}

/**
 * Send ZEC to multiple recipients
 * @param {Array} recipients - Array of {address, amount, memo?} objects
 * @param {number} minconf - Minimum confirmations (default: 1)
 * @param {number} fee - Transaction fee (default: 0.0001)
 * @returns {Promise<string>} Operation ID
 */
export async function sendMany(recipients, minconf = 1, fee = 0.0001) {
  return await zcashRpc('z_sendmany', ['', recipients, minconf, fee]);
}

/**
 * Get operation status
 * @param {string} opid - Operation ID
 * @returns {Promise<Object>} Operation status
 */
export async function getOperationStatus(opid) {
  const operations = await zcashRpc('z_getoperationstatus', [[opid]]);
  return operations[0];
}

/**
 * Wait for operation to complete
 * @param {string} opid - Operation ID
 * @param {number} maxAttempts - Maximum polling attempts (default: 50)
 * @param {number} interval - Polling interval in ms (default: 2500)
 * @returns {Promise<Object>} Final operation status
 */
export async function waitForOperation(opid, maxAttempts = 50, interval = 2500) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getOperationStatus(opid);
    
    if (status.status !== 'executing' && status.status !== 'queued') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Operation ${opid} timed out after ${maxAttempts} attempts`);
}

/**
 * Get blockchain info
 * @returns {Promise<Object>} Blockchain information
 */
export async function getBlockchainInfo() {
  return await zcashRpc('getblockchaininfo');
}

/**
 * Validate Zcash address
 * @param {string} address - Address to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateAddress(address) {
  return await zcashRpc('validateaddress', [address]);
}