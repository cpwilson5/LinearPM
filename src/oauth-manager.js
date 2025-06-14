import crypto from 'crypto';
import { URLSearchParams } from 'url';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

class LinearOAuthManager {
  constructor() {
    this.clientId = process.env.LINEAR_CLIENT_ID;
    this.clientSecret = process.env.LINEAR_CLIENT_SECRET;
    this.redirectUri = process.env.LINEAR_REDIRECT_URI || 'http://localhost:3000/oauth/callback';
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET are required for OAuth');
    }
    
    // File-based storage for development (replace with database in production)
    this.tokensFile = path.join(process.cwd(), '.gopm-tokens.json');
    this.workspaceTokens = new Map();
    this.pendingAuthorizations = new Map();
    
    // Load existing tokens on startup
    this.loadTokensFromFile();
  }
  
  /**
   * Generate OAuth authorization URL for Linear agent installation
   * @param {string} workspaceId - Optional workspace ID for specific workspace
   * @returns {object} Authorization URL and state for CSRF protection
   */
  generateAuthorizationURL(workspaceId = null) {
    const state = crypto.randomBytes(32).toString('hex');
    const scopes = [
      'app:assignable',    // Allow assignment to issues/projects  
      'app:mentionable',   // Allow @mentions in issues/documents
      'read',              // Read access to workspace data
      'write',             // Write access for creating/updating
      'issues:create'      // Create new issues
    ].join(',');
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code',
      state: state,
      actor: 'app'  // Critical: This makes it an agent installation
    });
    
    if (workspaceId) {
      params.append('workspace_id', workspaceId);
    }
    
    const authUrl = `https://linear.app/oauth/authorize?${params.toString()}`;
    
    // Store state for verification
    this.pendingAuthorizations.set(state, {
      workspaceId,
      timestamp: Date.now(),
      state
    });
    
    return { authUrl, state };
  }
  
  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Linear
   * @param {string} state - State parameter for CSRF verification
   * @returns {object} Token information and workspace details
   */
  async exchangeCodeForToken(code, state) {
    // Verify state parameter
    const pendingAuth = this.pendingAuthorizations.get(state);
    if (!pendingAuth) {
      throw new Error('Invalid or expired state parameter');
    }
    
    // Clean up pending authorization
    this.pendingAuthorizations.delete(state);
    
    // Exchange code for token
    const tokenParams = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    });
    
    try {
      const response = await fetch('https://api.linear.app/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }
      
      const tokenData = await response.json();
      
      // Get workspace information using the new token
      const workspaceInfo = await this.getWorkspaceInfo(tokenData.access_token);
      
      // Store token for this workspace
      const tokenInfo = {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
        workspaceId: workspaceInfo.id,
        workspaceName: workspaceInfo.name,
        appUserId: workspaceInfo.appUserId, // The agent's user ID in this workspace
        installedAt: new Date().toISOString(),
        expiresAt: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null
      };
      
      this.workspaceTokens.set(workspaceInfo.id, tokenInfo);
      
      // Persist tokens to file
      this.saveTokensToFile();
      
      console.log(`🤖 Agent installed in workspace: ${workspaceInfo.name} (${workspaceInfo.id})`);
      console.log(`📋 Agent user ID: ${workspaceInfo.appUserId}`);
      
      return tokenInfo;
      
    } catch (error) {
      console.error('OAuth token exchange failed:', error);
      throw error;
    }
  }
  
  /**
   * Get workspace information using access token
   * @param {string} accessToken - Linear access token
   * @returns {object} Workspace information
   */
  async getWorkspaceInfo(accessToken) {
    const query = `
      query {
        viewer {
          id
          name
          organization {
            id
            name
          }
        }
      }
    `;
    
    try {
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      return {
        id: data.data.viewer.organization.id,
        name: data.data.viewer.organization.name,
        appUserId: data.data.viewer.id // This is the agent's user ID
      };
      
    } catch (error) {
      console.error('Failed to get workspace info:', error);
      throw error;
    }
  }
  
  /**
   * Get stored token for a workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {object|null} Token information or null if not found
   */
  getWorkspaceToken(workspaceId) {
    return this.workspaceTokens.get(workspaceId) || null;
  }
  
  /**
   * Get all installed workspaces
   * @returns {Array} List of workspace token information
   */
  getInstalledWorkspaces() {
    return Array.from(this.workspaceTokens.values());
  }
  
  /**
   * Remove workspace installation
   * @param {string} workspaceId - Workspace ID to remove
   */
  removeWorkspace(workspaceId) {
    const removed = this.workspaceTokens.delete(workspaceId);
    if (removed) {
      console.log(`🗑️ Agent removed from workspace: ${workspaceId}`);
      // Persist the removal
      this.saveTokensToFile();
    }
    return removed;
  }
  
  /**
   * Check if token is expired
   * @param {object} tokenInfo - Token information object
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(tokenInfo) {
    if (!tokenInfo.expiresAt) return false;
    return new Date() > new Date(tokenInfo.expiresAt);
  }
  
  /**
   * Validate workspace has valid token
   * @param {string} workspaceId - Workspace ID
   * @returns {boolean} True if workspace has valid token
   */
  isWorkspaceAuthorized(workspaceId) {
    const tokenInfo = this.getWorkspaceToken(workspaceId);
    return tokenInfo && !this.isTokenExpired(tokenInfo);
  }
  
  /**
   * Clean up expired authorizations (should be called periodically)
   */
  cleanupExpiredAuthorizations() {
    const now = Date.now();
    const expiredStates = [];
    
    // Clean up pending authorizations older than 10 minutes
    for (const [state, auth] of this.pendingAuthorizations.entries()) {
      if (now - auth.timestamp > 10 * 60 * 1000) {
        expiredStates.push(state);
      }
    }
    
    expiredStates.forEach(state => {
      this.pendingAuthorizations.delete(state);
    });
    
    // Clean up expired tokens
    const expiredWorkspaces = [];
    for (const [workspaceId, tokenInfo] of this.workspaceTokens.entries()) {
      if (this.isTokenExpired(tokenInfo)) {
        expiredWorkspaces.push(workspaceId);
      }
    }
    
    expiredWorkspaces.forEach(workspaceId => {
      this.removeWorkspace(workspaceId);
    });
    
    if (expiredStates.length > 0 || expiredWorkspaces.length > 0) {
      console.log(`🧹 Cleaned up ${expiredStates.length} expired authorizations and ${expiredWorkspaces.length} expired tokens`);
    }
  }

  /**
   * Load tokens from file on startup
   */
  loadTokensFromFile() {
    try {
      if (fs.existsSync(this.tokensFile)) {
        const data = fs.readFileSync(this.tokensFile, 'utf8');
        const tokens = JSON.parse(data);
        
        for (const [workspaceId, tokenInfo] of Object.entries(tokens)) {
          // Skip expired tokens
          if (!this.isTokenExpired(tokenInfo)) {
            this.workspaceTokens.set(workspaceId, tokenInfo);
            console.log(`📥 Loaded token for workspace: ${tokenInfo.workspaceName} (${workspaceId})`);
          }
        }
        
        console.log(`🔑 Loaded ${this.workspaceTokens.size} workspace tokens from file`);
      }
    } catch (error) {
      console.warn('Failed to load tokens from file:', error.message);
    }
  }

  /**
   * Save tokens to file
   */
  saveTokensToFile() {
    try {
      const tokens = Object.fromEntries(this.workspaceTokens);
      console.log(`💾 Attempting to save ${this.workspaceTokens.size} tokens to ${this.tokensFile}`);
      console.log(`📋 Tokens to save:`, JSON.stringify(tokens, null, 2));
      fs.writeFileSync(this.tokensFile, JSON.stringify(tokens, null, 2));
      console.log(`✅ Successfully saved tokens to file`);
    } catch (error) {
      console.error('❌ Failed to save tokens to file:', error);
    }
  }
}

export default LinearOAuthManager;