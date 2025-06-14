import { LinearClient as LinearSDK } from '@linear/sdk';
import { oauthManager } from './oauth-routes.js';

/**
 * Enhanced Linear client that supports both legacy API key mode 
 * and new OAuth agent mode with multi-workspace support
 */
export class AgentLinearClient {
  constructor() {
    // Legacy API key for backward compatibility
    this.legacyApiKey = process.env.LINEAR_API_KEY;
    this.legacyClient = this.legacyApiKey ? new LinearSDK({ apiKey: this.legacyApiKey }) : null;
    
    // OAuth workspace clients (workspaceId -> LinearSDK instance)
    this.workspaceClients = new Map();
    this.activeComments = new Map();
    
    // Reusable timestamp formatter
    this.timestampFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    this.initializeWorkspaceClients();
  }
  
  /**
   * Initialize Linear SDK clients for all authorized workspaces
   */
  initializeWorkspaceClients() {
    const workspaces = oauthManager().getInstalledWorkspaces();
    
    for (const workspace of workspaces) {
      if (!oauthManager().isTokenExpired(workspace)) {
        const client = new LinearSDK({ 
          apiKey: workspace.accessToken 
        });
        this.workspaceClients.set(workspace.workspaceId, {
          client,
          workspace,
          agentUserId: workspace.appUserId
        });
        
        console.log(`🤖 Initialized agent client for workspace: ${workspace.workspaceName} (${workspace.workspaceId})`);
      }
    }
    
    console.log(`📋 Active workspace clients: ${this.workspaceClients.size}`);
  }
  
  /**
   * Get Linear client for specific workspace
   * Falls back to legacy client if workspace not found
   * @param {string} workspaceId - Workspace ID
   * @returns {object} { client: LinearSDK, isAgent: boolean, agentUserId?: string }
   */
  getClientForWorkspace(workspaceId) {
    // Try OAuth workspace client first
    const workspaceClient = this.workspaceClients.get(workspaceId);
    if (workspaceClient) {
      return {
        client: workspaceClient.client,
        isAgent: true,
        agentUserId: workspaceClient.agentUserId,
        workspace: workspaceClient.workspace
      };
    }
    
    // Fall back to legacy client
    if (this.legacyClient) {
      console.log(`⚠️ Using legacy client for workspace ${workspaceId} (OAuth not configured)`);
      return {
        client: this.legacyClient,
        isAgent: false
      };
    }
    
    throw new Error(`No Linear client available for workspace ${workspaceId}`);
  }
  
  /**
   * Determine workspace ID from webhook event or issue data
   * @param {object} eventData - Webhook event data
   * @returns {string|null} Workspace ID
   */
  extractWorkspaceId(eventData) {
    // Try different paths to find workspace/organization ID
    const paths = [
      eventData.data?.issue?.team?.organization?.id,
      eventData.data?.issue?.organization?.id,
      eventData.data?.comment?.issue?.team?.organization?.id,
      eventData.data?.organization?.id,
      eventData.organizationId
    ];
    
    for (const path of paths) {
      if (path) {
        return path;
      }
    }
    
    console.warn('Could not extract workspace ID from event data:', JSON.stringify(eventData, null, 2));
    return null;
  }
  
  /**
   * Get issue with resolved project context using appropriate client
   * @param {string} issueId - Linear issue ID
   * @param {string} workspaceId - Workspace ID (optional, will try to determine)
   * @returns {object} Issue with resolved project
   */
  async getIssueWithProject(issueId, workspaceId = null) {
    let clientInfo;
    
    if (workspaceId) {
      clientInfo = this.getClientForWorkspace(workspaceId);
    } else {
      // Try to find any available client
      if (this.workspaceClients.size > 0) {
        const firstWorkspace = this.workspaceClients.values().next().value;
        clientInfo = {
          client: firstWorkspace.client,
          isAgent: true,
          agentUserId: firstWorkspace.agentUserId,
          workspace: firstWorkspace.workspace
        };
      } else if (this.legacyClient) {
        clientInfo = {
          client: this.legacyClient,
          isAgent: false
        };
      } else {
        throw new Error('No Linear client available');
      }
    }
    
    try {
      const issue = await clientInfo.client.issue(issueId);
      
      // Resolve project promise if it exists
      if (issue.project) {
        const resolvedProject = await issue.project;
        return { 
          ...issue, 
          project: resolvedProject,
          _clientInfo: clientInfo 
        };
      }
      
      return { 
        ...issue, 
        _clientInfo: clientInfo 
      };
      
    } catch (error) {
      console.error(`Failed to fetch issue ${issueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Add working comment with agent-aware messaging
   * @param {string} issueId - Linear issue ID
   * @param {string} workspaceId - Workspace ID
   * @returns {object} Created comment
   */
  async addWorkingComment(issueId, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    const timestamp = this.getTimestamp();
    
    const body = clientInfo.isAgent 
      ? `🤖 goPM agent is working on this...\nStarted: ${timestamp}`
      : `🤔 working on it\nLast updated: ${timestamp}`;
    
    try {
      const result = await clientInfo.client.createComment({
        issueId,
        body
      });
      
      // Linear SDK returns result with _comment property
      const comment = result._comment || result;
      
      // Store comment ID for later updates
      this.activeComments.set(issueId, comment.id);
      
      console.log(`💬 Created working comment ${comment.id} for issue ${issueId} (agent: ${clientInfo.isAgent})`);
      return comment;
      
    } catch (error) {
      console.error(`Failed to create working comment for issue ${issueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update working comment with final result
   * @param {string} issueId - Linear issue ID
   * @param {string} result - AI response result
   * @param {string} workspaceId - Workspace ID
   */
  async updateWorkingCommentWithResult(issueId, result, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    const commentId = this.activeComments.get(issueId);
    
    if (!commentId) {
      console.warn(`No active comment found for issue ${issueId}, creating new comment`);
      return this.createComment(issueId, result, workspaceId);
    }
    
    const timestamp = this.getTimestamp();
    const agentSignature = clientInfo.isAgent 
      ? `\n\n🤖 Completed by goPM agent: ${timestamp}`
      : `\n\nCompleted: ${timestamp}`;
    
    const finalBody = result + agentSignature;
    
    try {
      const result = await clientInfo.client.updateComment(commentId, { body: finalBody });
      this.activeComments.delete(issueId);
      
      console.log(`✅ Updated comment ${commentId} for issue ${issueId} (agent: ${clientInfo.isAgent})`);
      
    } catch (error) {
      console.error(`Failed to update comment ${commentId}:`, error);
      // Fallback: create new comment
      await this.createComment(issueId, result, workspaceId);
    }
  }

  /**
   * Update specific working comment by ID
   * @param {string} issueId - Linear issue ID
   * @param {string} commentId - Comment ID to update
   * @param {string} content - New content
   * @param {string} workspaceId - Workspace ID
   */
  async updateWorkingComment(issueId, commentId, content, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    
    try {
      const result = await clientInfo.client.updateComment(commentId, { body: content });
      console.log(`🔄 Updated working comment ${commentId} for issue ${issueId} (agent: ${clientInfo.isAgent})`);
      return result;
      
    } catch (error) {
      console.error(`Failed to update working comment ${commentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new comment (fallback method)
   * @param {string} issueId - Linear issue ID
   * @param {string} body - Comment body
   * @param {string} workspaceId - Workspace ID
   */
  async createComment(issueId, body, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    const timestamp = this.getTimestamp();
    
    const agentSignature = clientInfo.isAgent 
      ? `\n\n🤖 goPM agent response: ${timestamp}`
      : `\n\nCompleted: ${timestamp}`;
    
    const finalBody = body + agentSignature;
    
    try {
      const result = await clientInfo.client.createComment({
        issueId,
        body: finalBody
      });
      
      // Linear SDK returns result with _comment property
      const comment = result._comment || result;
      
      console.log(`💬 Created new comment ${comment.id} for issue ${issueId} (agent: ${clientInfo.isAgent})`);
      return comment;
      
    } catch (error) {
      console.error(`Failed to create comment for issue ${issueId}:`, error);
      throw error;
    }
  }
  
  /**
   * Handle error by updating working comment or creating error comment
   * @param {string} issueId - Linear issue ID
   * @param {string} workspaceId - Workspace ID
   */
  async handleProcessingError(issueId, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    const commentId = this.activeComments.get(issueId);
    const timestamp = this.getTimestamp();
    
    const errorBody = clientInfo.isAgent
      ? `🤖 goPM agent encountered an error processing this request. Please try again or contact support.\n\nError time: ${timestamp}`
      : `❌ Sorry, I encountered an error processing your request. Please try again.\n\nError time: ${timestamp}`;
    
    try {
      if (commentId) {
        await clientInfo.client.updateComment(commentId, { body: errorBody });
        this.activeComments.delete(issueId);
      } else {
        await this.createComment(issueId, errorBody, workspaceId);
      }
    } catch (error) {
      console.error(`Failed to create error comment for issue ${issueId}:`, error);
    }
  }
  
  /**
   * Check if current user is the agent in a workspace
   * @param {string} workspaceId - Workspace ID
   * @param {string} userId - User ID to check
   * @returns {boolean} True if user is the agent
   */
  isAgentUser(workspaceId, userId) {
    const workspaceClient = this.workspaceClients.get(workspaceId);
    return workspaceClient && workspaceClient.agentUserId === userId;
  }
  
  /**
   * Get agent user ID for workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {string|null} Agent user ID or null
   */
  getAgentUserId(workspaceId) {
    const workspaceClient = this.workspaceClients.get(workspaceId);
    return workspaceClient ? workspaceClient.agentUserId : null;
  }
  
  /**
   * Refresh workspace clients (call when new workspaces are added)
   */
  refreshWorkspaceClients() {
    console.log('🔄 Refreshing workspace clients...');
    this.workspaceClients.clear();
    this.initializeWorkspaceClients();
  }
  
  /**
   * Get formatted timestamp
   * @returns {string} Formatted timestamp with EST timezone
   */
  getTimestamp() {
    return this.timestampFormatter.format(new Date()) + ' EST';
  }
  
  /**
   * Clean up orphaned comment references
   */
  cleanupActiveComments() {
    console.log(`🧹 Cleaning up ${this.activeComments.size} active comment references`);
    this.activeComments.clear();
  }
  
  /**
   * Update issue status
   * @param {string} issueId - Linear issue ID
   * @param {string} stateId - Target state ID  
   * @param {string} workspaceId - Workspace ID
   */
  async updateIssueStatus(issueId, stateId, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    
    try {
      const result = await clientInfo.client.updateIssue(issueId, {
        stateId: stateId
      });
      
      console.log(`📊 Updated issue ${issueId} status (agent: ${clientInfo.isAgent})`);
      return result;
      
    } catch (error) {
      console.error(`Failed to update issue ${issueId} status:`, error);
      throw error;
    }
  }

  /**
   * Add emoji reaction to a comment
   * @param {string} commentId - Comment ID to react to
   * @param {string} emoji - Emoji to add (e.g., '🤔')
   * @param {string} workspaceId - Workspace ID
   */
  async addEmojiReaction(commentId, emoji, workspaceId) {
    const clientInfo = this.getClientForWorkspace(workspaceId);
    
    try {
      const result = await clientInfo.client.createReaction({
        commentId,
        emoji
      });
      
      console.log(`😀 Added ${emoji} reaction to comment ${commentId} (agent: ${clientInfo.isAgent})`);
      return result;
      
    } catch (error) {
      console.error(`Failed to add ${emoji} reaction to comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Get installation status
   * @returns {object} Installation status and workspace info
   */
  getInstallationStatus() {
    const workspaces = Array.from(this.workspaceClients.values()).map(wc => ({
      id: wc.workspace.workspaceId,
      name: wc.workspace.workspaceName,
      agentId: wc.agentUserId,
      installedAt: wc.workspace.installedAt
    }));
    
    return {
      hasLegacyClient: !!this.legacyClient,
      agentWorkspaces: workspaces.length,
      totalClients: workspaces.length + (this.legacyClient ? 1 : 0),
      workspaces
    };
  }
}

export default AgentLinearClient;