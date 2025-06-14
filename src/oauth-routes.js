import express from 'express';
import LinearOAuthManager from './oauth-manager.js';

const router = express.Router();

// Create shared OAuth manager instance
let oauthManager;

// Function to get or create OAuth manager
function getOAuthManager() {
  if (!oauthManager) {
    oauthManager = new LinearOAuthManager();
  }
  return oauthManager;
}

/**
 * GET /oauth/install
 * Start OAuth installation flow for Linear agent
 */
router.get('/install', (req, res) => {
  try {
    const workspaceId = req.query.workspace_id || null;
    const { authUrl, state } = getOAuthManager().generateAuthorizationURL(workspaceId);
    
    console.log(`🔗 Starting OAuth flow for workspace: ${workspaceId || 'any'}`);
    console.log(`📋 State: ${state}`);
    
    // Redirect user to Linear for authorization
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('OAuth installation failed:', error);
    res.status(500).json({
      error: 'Failed to start installation process',
      message: error.message
    });
  }
});

/**
 * GET /oauth/callback
 * Handle OAuth callback from Linear
 */
router.get('/callback', async (req, res) => {
  console.log(`🔄 OAuth callback received with query:`, req.query);
  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.status(400).send(`
        <html>
          <head><title>goPM Installation Failed</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #dc3545;">❌ Installation Failed</h1>
            <p><strong>Error:</strong> ${error}</p>
            <p>${error_description || 'Unknown error occurred'}</p>
            <p><a href="/oauth/install">Try Again</a></p>
          </body>
        </html>
      `);
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.status(400).send(`
        <html>
          <head><title>goPM Installation Failed</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #dc3545;">❌ Installation Failed</h1>
            <p>Missing required parameters (code or state)</p>
            <p><a href="/oauth/install">Try Again</a></p>
          </body>
        </html>
      `);
    }
    
    console.log(`🔄 Processing OAuth callback with state: ${state}`);
    
    // Exchange code for token
    const tokenInfo = await getOAuthManager().exchangeCodeForToken(code, state);
    
    // Success page
    res.send(`
      <html>
        <head><title>goPM Agent Installed</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #28a745;">✅ goPM Agent Installed Successfully!</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; max-width: 600px; margin: 20px auto;">
            <h3>🤖 Agent Details</h3>
            <p><strong>Workspace:</strong> ${tokenInfo.workspaceName}</p>
            <p><strong>Agent ID:</strong> ${tokenInfo.appUserId}</p>
            <p><strong>Installed:</strong> ${new Date(tokenInfo.installedAt).toLocaleString()}</p>
            <p><strong>Permissions:</strong> ${tokenInfo.scope}</p>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px;">
            <h3>🚀 Getting Started</h3>
            <p>Your goPM agent is now active in your Linear workspace!</p>
            <ul style="text-align: left;">
              <li><strong>@mention</strong> the agent in any issue or comment for PM guidance</li>
              <li><strong>Assign issues</strong> to the agent for automated analysis</li>
              <li><strong>Collaborate</strong> with the agent like any team member</li>
            </ul>
            
            <p style="margin-top: 20px;">
              <strong>Try it now:</strong> Go to any Linear issue and type <code>@goPM help me analyze this epic</code>
            </p>
          </div>
          
          <p>
            <a href="https://linear.app" style="background: #5e6ad2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Go to Linear
            </a>
          </p>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('OAuth callback processing failed:', error);
    res.status(500).send(`
      <html>
        <head><title>goPM Installation Failed</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc3545;">❌ Installation Failed</h1>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please try the installation process again.</p>
          <p><a href="/oauth/install">Try Again</a></p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /oauth/status
 * Check installation status and list installed workspaces
 */
router.get('/status', (req, res) => {
  try {
    const workspaces = getOAuthManager().getInstalledWorkspaces();
    
    res.json({
      installed: workspaces.length > 0,
      workspaceCount: workspaces.length,
      workspaces: workspaces.map(workspace => ({
        id: workspace.workspaceId,
        name: workspace.workspaceName,
        agentId: workspace.appUserId,
        installedAt: workspace.installedAt,
        isExpired: getOAuthManager().isTokenExpired(workspace)
      }))
    });
    
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      error: 'Failed to check status',
      message: error.message
    });
  }
});

/**
 * DELETE /oauth/workspace/:workspaceId
 * Remove agent from specific workspace
 */
router.delete('/workspace/:workspaceId', (req, res) => {
  try {
    const { workspaceId } = req.params;
    const removed = getOAuthManager().removeWorkspace(workspaceId);
    
    if (removed) {
      res.json({ 
        success: true, 
        message: `Agent removed from workspace ${workspaceId}` 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: `Workspace ${workspaceId} not found` 
      });
    }
    
  } catch (error) {
    console.error('Workspace removal failed:', error);
    res.status(500).json({
      error: 'Failed to remove workspace',
      message: error.message
    });
  }
});

/**
 * POST /oauth/cleanup
 * Clean up expired authorizations and tokens
 */
router.post('/cleanup', (req, res) => {
  try {
    getOAuthManager().cleanupExpiredAuthorizations();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

/**
 * POST /oauth/test-token
 * Test if we can create a token manually for debugging
 */
router.post('/test-token', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }
    
    // Test the token by getting workspace info
    const workspaceInfo = await getOAuthManager().getWorkspaceInfo(accessToken);
    
    res.json({
      success: true,
      workspaceInfo,
      message: 'Token is valid'
    });
    
  } catch (error) {
    console.error('Token test failed:', error);
    res.status(500).json({
      error: 'Token test failed',
      message: error.message
    });
  }
});

// Export both router and shared OAuth manager 
export { router as oauthRoutes, getOAuthManager as oauthManager };

export default router;