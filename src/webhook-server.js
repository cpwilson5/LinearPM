import express from 'express';
import { AIAssistant } from './ai-assistant.js';
import { LinearClient } from './linear-client.js';
import { AgentLinearClient } from './agent-linear-client.js';
import { oauthRoutes } from './oauth-routes.js';

export class WebhookServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.aiAssistant = new AIAssistant();
    this.linearClient = new LinearClient(); // Legacy client for backward compatibility
    this.agentClient = new AgentLinearClient(); // New agent-aware client
    
    // Track agent assignments for better unassignment handling
    this.agentAssignments = new Map(); // issueId -> { workspaceId, assignedAt, status }
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    
    // Webhook signature verification middleware
    this.app.use('/webhook', (req, res, next) => {
      const signature = req.headers['linear-signature'];
      const webhookSecret = process.env.LINEAR_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('LINEAR_WEBHOOK_SECRET not set, skipping signature verification');
        return next();
      }
      
      // TODO: Implement proper signature verification
      // For now, just check if signature exists
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }
      
      next();
    });
  }

  setupRoutes() {
    // OAuth routes for agent installation
    this.app.use('/oauth', oauthRoutes);
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'goPM' });
    });
    
    // Installation status endpoint
    this.app.get('/status', (req, res) => {
      const agentStatus = this.agentClient.getInstallationStatus();
      res.json({
        service: 'goPM',
        mode: agentStatus.agentWorkspaces > 0 ? 'agent' : 'legacy',
        ...agentStatus
      });
    });

    // Linear webhook endpoint
    this.app.post('/webhook', async (req, res) => {
      try {
        await this.handleLinearWebhook(req.body);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  }

  async handleLinearWebhook(payload) {
    console.log(`📨 Webhook received: ${payload.type} - ${payload.action}`);
    
    // Extract workspace ID for all events
    const workspaceId = this.agentClient.extractWorkspaceId(payload);
    
    // Route to appropriate handler based on event type
    switch (payload.type) {
      case 'Comment':
        await this.handleCommentEvent(payload, workspaceId);
        break;
        
      case 'Issue':
        await this.handleIssueEvent(payload, workspaceId);
        break;
        
      case 'Reaction':
        await this.handleReactionEvent(payload, workspaceId);
        break;
        
      default:
        console.log(`📋 Unhandled webhook type: ${payload.type}`);
    }
  }

  async handleCommentEvent(payload, workspaceId) {
    if (payload.action === 'create') {
      const comment = payload.data;
      
      // Check for @goPM (new agent mode) - case insensitive since Linear converts to lowercase
      if (comment.body && (comment.body.includes('@goPM') || comment.body.includes('@gopm'))) {
        await this.processAgentComment(comment, payload);
      }
      // Check for @LinearPM (legacy mode)
      else if (comment.body && comment.body.includes('@LinearPM')) {
        await this.processLegacyComment(comment, payload);
      }
    }
  }

  async handleIssueEvent(payload, workspaceId) {
    const issue = payload.data;
    
    if (payload.action === 'create' || payload.action === 'update') {
      // Handle @mentions in issue description
      if (issue.description && (issue.description.includes('@goPM') || issue.description.includes('@gopm'))) {
        console.log(`🤖 Agent Issue ${issue.id}`);
        await this.processAgentIssue(issue, payload);
      }
      else if (issue.description && issue.description.includes('@LinearPM')) {
        console.log(`📋 Legacy Issue ${issue.id}`);
        await this.processLegacyIssue(issue, payload);
      }
      
      // Handle issue assignment to agent
      if (payload.action === 'update' && issue.assignee) {
        const agentUserId = this.agentClient.getAgentUserId(workspaceId);
        if (agentUserId && issue.assignee.id === agentUserId) {
          console.log(`🎯 Issue ${issue.id} assigned to agent`);
          await this.handleIssueAssignedToAgent(issue, payload, workspaceId);
        }
      }
      
      // Handle issue unassignment from agent  
      if (payload.action === 'update' && !issue.assignee) {
        // Check if agent was previously assigned (we'd need to track this)
        console.log(`🔄 Issue ${issue.id} unassigned`);
        await this.handleIssueUnassignedFromAgent(issue, payload, workspaceId);
      }
      
      // Handle status changes when agent is involved
      if (payload.action === 'update' && issue.state) {
        const agentUserId = this.agentClient.getAgentUserId(workspaceId);
        if (agentUserId && issue.assignee && issue.assignee.id === agentUserId) {
          console.log(`📊 Issue ${issue.id} status changed to ${issue.state.name} (agent assigned)`);
          await this.handleAgentIssueStatusChange(issue, payload, workspaceId);
        }
      }
    }
  }

  async handleReactionEvent(payload, workspaceId) {
    if (payload.action === 'create') {
      const reaction = payload.data;
      console.log(`😀 Reaction ${reaction.emoji} added to ${reaction.issue ? 'issue' : 'comment'}`);
      
      // Check if reaction is on agent's comment or issue assigned to agent
      const agentUserId = this.agentClient.getAgentUserId(workspaceId);
      
      if (reaction.comment) {
        // Reaction on comment - check if it's agent's comment
        await this.handleCommentReaction(reaction, payload, workspaceId, agentUserId);
      } else if (reaction.issue) {
        // Reaction on issue - check if agent is assigned or mentioned
        await this.handleIssueReaction(reaction, payload, workspaceId, agentUserId);
      }
    }
  }

  // New agent mode (@goPM) - uses OAuth and agent client
  async processAgentComment(comment, eventPayload) {
    console.log(`🤖 Processing agent comment for @goPM`);
    
    // Extract workspace ID from event payload
    const workspaceId = this.agentClient.extractWorkspaceId(eventPayload);
    
    const { issue, projectContext } = await this.getIssueContext(comment.issue.id, workspaceId);
    
    this.logCommentProcessing(comment, issue, projectContext, 'agent');
    
    // Process with agent client - pass comment ID for emoji reaction
    await this.processAgentCommand(comment.issue.id, comment.body, this.buildContext(issue, projectContext), workspaceId, comment.id);
  }

  async processAgentIssue(issue, eventPayload) {
    console.log(`🤖 Processing agent issue for @goPM`);
    
    // Extract workspace ID from event payload
    const workspaceId = this.agentClient.extractWorkspaceId(eventPayload);
    
    const { issue: fullIssue, projectContext } = await this.getIssueContext(issue.id, workspaceId);
    
    await this.processAgentCommand(issue.id, issue.description, this.buildContext(fullIssue, projectContext), workspaceId);
  }

  // Legacy mode (@LinearPM) - uses API key and legacy client
  async processLegacyComment(comment, eventPayload) {
    console.log(`📋 Processing legacy comment for @LinearPM`);
    
    // Inline command parsing for legacy mode
    if (!comment.body || !comment.body.includes('@LinearPM')) return;
    
    const command = {
      type: 'conversational_request',
      originalText: comment.body.trim(),
      confidence: 1.0
    };

    const { issue, projectContext } = await this.getLegacyIssueContext(comment.issue.id);
    
    this.logCommentProcessing(comment, issue, projectContext, 'legacy');
    
    await this.processLegacyCommand(comment.issue.id, command, this.buildContext(issue, projectContext));
  }

  async processLegacyIssue(issue, eventPayload) {
    console.log(`📋 Processing legacy issue for @LinearPM`);
    
    // Inline command parsing for legacy mode
    if (!issue.description || !issue.description.includes('@LinearPM')) return;
    
    const command = {
      type: 'conversational_request',
      originalText: issue.description.trim(),
      confidence: 1.0
    };

    const { issue: fullIssue, projectContext } = await this.getLegacyIssueContext(issue.id);
    
    await this.processLegacyCommand(issue.id, command, this.buildContext(fullIssue, projectContext));
  }

  // Agent mode context (uses OAuth)
  async getIssueContext(issueId, workspaceId) {
    try {
      // Try agent client first
      const issue = await this.agentClient.getIssueWithProject(issueId, workspaceId);
      const projectContext = await this.getProjectContext(issue);
      return { issue, projectContext };
    } catch (error) {
      console.warn('Agent client failed, falling back to legacy client:', error.message);
      // Fallback to legacy client
      const issue = await this.linearClient.getIssueWithProject(issueId);
      const projectContext = await this.linearClient.getProjectContext(issue);
      return { issue, projectContext };
    }
  }

  // Legacy mode context (uses API key)
  async getLegacyIssueContext(issueId) {
    const issue = await this.linearClient.getIssueWithProject(issueId);
    const projectContext = await this.linearClient.getProjectContext(issue);
    return { issue, projectContext };
  }

  buildContext(issue, projectContext) {
    return {
      issueTitle: issue.title,
      issueDescription: issue.description,
      comments: issue.comments?.nodes || [],
      team: issue.team?.name,
      state: issue.state?.name,
      projectContext: projectContext
    };
  }

  logCommentProcessing(comment, issue, projectContext, mode = 'unknown') {
    const modeEmoji = mode === 'agent' ? '🤖' : '📋';
    const commentSnippet = this.createSnippet(comment.body);
    const issueSnippet = this.createSnippet(issue.description || '');
    
    console.log('');
    console.log(`${modeEmoji} [${mode.toUpperCase()}] Received Comment ${commentSnippet}`);
    console.log('');
    console.log(`📋 For Issue ${comment.issue.id} ${issue.title} ${issueSnippet}`);
    console.log('');
    
    if (typeof projectContext === 'string') {
      console.log(`🏗️ ${projectContext}`);
    } else {
      const projectContent = projectContext.content || projectContext.description || '';
      const projectSnippet = this.createSnippet(projectContent);
      console.log(`🏗️ Related to Project ${projectContext.name} ${projectSnippet}`);
    }
    console.log('');
  }

  createSnippet(text, maxLength = 150) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Agent command processing (@goPM) with immediate acknowledgment
  async processAgentCommand(issueId, originalText, context, workspaceId, commentId = null) {
    try {
      console.log(`🤖 Processing agent command for issue ${issueId}`);
      
      // IMMEDIATE ACKNOWLEDGMENT - React with thinking emoji if triggered by comment
      if (commentId) {
        await this.agentClient.addEmojiReaction(commentId, '🤔', workspaceId);
        console.log(`⚡ Immediate 🤔 reaction added to comment ${commentId}`);
      }
      
      // ASYNC AI PROCESSING - Create working comment and process in background
      const workingComment = await this.agentClient.addWorkingComment(issueId, workspaceId);
      const workingCommentId = workingComment.id;
      this.processAgentCommandAsync(issueId, originalText, context, workspaceId, workingCommentId);
      
    } catch (error) {
      console.error('🤖 Agent command processing error:', error);
      await this.handleAgentProcessingError(issueId, workspaceId);
    }
  }

  // Async AI processing that updates the working comment with progress
  async processAgentCommandAsync(issueId, originalText, context, workspaceId, workingCommentId) {
    const startTime = Date.now();
    
    try {
      console.log(`🧠 Starting AI processing for issue ${issueId}`);
      
      // Update to show processing status
      const processingMessage = `🤔 Analyzing this issue...\n\n_Started: ${this.agentClient.getTimestamp()}_`;
      await this.agentClient.updateWorkingComment(issueId, workingCommentId, processingMessage, workspaceId);
      
      // Start progress updates for long-running requests
      const progressInterval = this.startProgressUpdates(issueId, workingCommentId, workspaceId, startTime);
      
      try {
        // Get AI response using master prompt
        const response = await this.aiAssistant.handleConversationalRequest(
          originalText,
          context
        );
        
        // Clear progress updates
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        // Create smart completion message with next steps
        const completionMessage = await this.createCompletionMessage(response, context, originalText);
        await this.agentClient.updateWorkingComment(issueId, workingCommentId, completionMessage, workspaceId);
        
        console.log(`✅ AI processing completed for issue ${issueId}`);
        
      } catch (aiError) {
        // Clear progress updates on error
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        throw aiError;
      }
      
    } catch (error) {
      console.error('🤖 Async agent processing error:', error);
      
      // Update comment with error message
      const errorMessage = `❌ Sorry, I encountered an error processing your request. Please try again.\n\n_Error time: ${this.agentClient.getTimestamp()}_`;
      await this.agentClient.updateWorkingComment(issueId, workingCommentId, errorMessage, workspaceId);
    }
  }

  // Start progress updates for long-running AI requests
  startProgressUpdates(issueId, workingCommentId, workspaceId, startTime) {
    let updateCount = 0;
    
    const progressInterval = setInterval(async () => {
      updateCount++;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      // Only show progress updates after 10 seconds
      if (elapsed < 10) return;
      
      const progressDots = '.'.repeat((updateCount % 3) + 1);
      const progressMessage = `🧠 Still thinking${progressDots}\n\n_Processing for ${elapsed}s..._`;
      
      try {
        await this.agentClient.updateWorkingComment(issueId, workingCommentId, progressMessage, workspaceId);
      } catch (error) {
        console.error('Failed to update progress:', error);
        clearInterval(progressInterval);
      }
    }, 5000); // Update every 5 seconds
    
    // Auto-clear after 2 minutes to prevent runaway intervals
    setTimeout(() => {
      clearInterval(progressInterval);
    }, 120000);
    
    return progressInterval;
  }

  // Create smart completion message with context-aware next steps
  async createCompletionMessage(response, context, originalText) {
    const timestamp = this.agentClient.getTimestamp();
    let completionMessage = response;
    
    // Add context-aware next steps
    const requestType = this.detectRequestType(originalText);
    const nextSteps = this.suggestNextSteps(requestType, context);
    
    if (nextSteps) {
      completionMessage += `\n\n${nextSteps}`;
    }
    
    completionMessage += `\n\n🤖 _Completed by goPM agent: ${timestamp}_`;
    
    return completionMessage;
  }

  // Detect the type of request for better next steps
  detectRequestType(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('break down') || lowerText.includes('epic')) {
      return 'breakdown';
    }
    if (lowerText.includes('analyze') || lowerText.includes('review')) {
      return 'analysis';
    }
    if (lowerText.includes('estimate') || lowerText.includes('effort')) {
      return 'estimation';
    }
    if (lowerText.includes('requirements') || lowerText.includes('criteria')) {
      return 'requirements';
    }
    
    return 'general';
  }

  // Suggest contextual next steps
  suggestNextSteps(requestType, context) {
    const issueTitle = context.issueTitle || '';
    
    switch (requestType) {
      case 'breakdown':
        return `🎯 **Next Steps**: Consider creating sub-issues for each story, or @mention me with "create tasks" if you'd like me to help structure them.`;
      
      case 'analysis':
        return `🎯 **Next Steps**: If you need deeper analysis on any specific area, @mention me with more details. Ready to help refine requirements!`;
      
      case 'estimation':
        return `🎯 **Next Steps**: Share this estimate with your dev team for validation, or @mention me if scope changes significantly.`;
      
      case 'requirements':
        return `🎯 **Next Steps**: Review these with stakeholders, then @mention me if you need help breaking down into tasks or creating acceptance criteria.`;
      
      default:
        return `🎯 **Next Steps**: @mention me anytime for follow-up questions, deeper analysis, or help with next phases!`;
    }
  }

  // Legacy command processing (@LinearPM)
  async processLegacyCommand(issueId, command, context) {
    try {
      console.log(`📋 Processing legacy command for issue ${issueId}`);
      
      // Create initial working comment using legacy client
      await this.linearClient.addWorkingComment(issueId);
      
      // Get AI response using master prompt
      const response = await this.aiAssistant.handleConversationalRequest(
        command.originalText,
        context
      );
      
      // Update the working comment with the full response
      await this.linearClient.updateWorkingCommentWithResult(issueId, response);
      
    } catch (error) {
      console.error('📋 Legacy command processing error:', error);
      await this.handleLegacyProcessingError(issueId);
    }
  }

  async handleAgentProcessingError(issueId, workspaceId) {
    try {
      await this.agentClient.handleProcessingError(issueId, workspaceId);
    } catch (error) {
      console.error('🤖 Agent error handling failed:', error);
    }
  }

  async handleLegacyProcessingError(issueId) {
    try {
      await this.linearClient.handleProcessingError(issueId);
    } catch (error) {
      console.error('📋 Legacy error handling failed:', error);
    }
  }
  
  // Helper method for project context (shared between agents and legacy)
  async getProjectContext(issue) {
    if (!issue.project) {
      return 'No project associated with this issue';
    }
    
    const project = issue.project;
    return {
      name: project.name || 'Unknown Project',
      description: project.description || '',
      content: project.content || project.description || ''
    };
  }

  // NEW WEBHOOK EVENT HANDLERS

  async handleIssueAssignedToAgent(issue, payload, workspaceId) {
    try {
      console.log(`🎯 Handling agent assignment for issue ${issue.id}`);
      
      // Track the assignment
      this.agentAssignments.set(issue.id, {
        workspaceId,
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        issueTitle: issue.title,
        issueState: issue.state?.name
      });
      
      // Get issue context for smarter response
      const { issue: fullIssue, projectContext } = await this.getIssueContext(issue.id, workspaceId);
      
      // Create context-aware acknowledgment
      const acknowledgeMessage = await this.createAssignmentAcknowledgment(fullIssue, projectContext);
      await this.agentClient.createComment(issue.id, acknowledgeMessage, workspaceId);
      
      // Move issue to "In Progress" if it's not already started
      await this.moveIssueToInProgress(issue, workspaceId);
      
    } catch (error) {
      console.error('Failed to handle issue assignment:', error);
    }
  }

  async handleIssueUnassignedFromAgent(issue, payload, workspaceId) {
    try {
      console.log(`🔄 Handling agent unassignment for issue ${issue.id}`);
      
      // Check if we were tracking this assignment
      const assignmentData = this.agentAssignments.get(issue.id);
      
      if (assignmentData) {
        const timeAssigned = new Date(assignmentData.assignedAt);
        const timeUnassigned = new Date();
        const duration = Math.round((timeUnassigned - timeAssigned) / (1000 * 60)); // minutes
        
        // Create contextual farewell message
        const farewellMessage = `🤖 I've been unassigned from this issue after working on it for ${duration} minutes. Feel free to @mention me again if you need help!`;
        await this.agentClient.createComment(issue.id, farewellMessage, workspaceId);
        
        // Remove from tracking
        this.agentAssignments.delete(issue.id);
      } else {
        // Fallback for unknown assignments
        const farewellMessage = `🤖 I've been unassigned from this issue. Feel free to @mention me again if you need help!`;
        await this.agentClient.createComment(issue.id, farewellMessage, workspaceId);
      }
      
    } catch (error) {
      console.error('Failed to handle issue unassignment:', error);
    }
  }

  async handleAgentIssueStatusChange(issue, payload, workspaceId) {
    try {
      console.log(`📊 Agent issue status changed: ${issue.id} → ${issue.state.name}`);
      
      // Optional: React to specific status changes
      if (issue.state.name.toLowerCase().includes('completed') || 
          issue.state.name.toLowerCase().includes('done')) {
        const completionMessage = `🎉 Great! This issue has been marked as ${issue.state.name}. Let me know if you need any follow-up assistance.`;
        await this.agentClient.createComment(issue.id, completionMessage, workspaceId);
      }
      
    } catch (error) {
      console.error('Failed to handle issue status change:', error);
    }
  }

  async handleCommentReaction(reaction, payload, workspaceId, agentUserId) {
    try {
      // Check if the reaction is on agent's comment
      if (reaction.comment.author && reaction.comment.author.id === agentUserId) {
        console.log(`😀 Reaction ${reaction.emoji} on agent's comment ${reaction.comment.id}`);
        
        // React to positive feedback
        if (['👍', '❤️', '🎉', '✅'].includes(reaction.emoji)) {
          const thankYouMessage = `🤖 Thanks for the positive feedback! Happy to help anytime.`;
          await this.agentClient.createComment(reaction.issue.id, thankYouMessage, workspaceId);
        }
        
        // React to negative feedback  
        if (['👎', '❌', '😞'].includes(reaction.emoji)) {
          const improvementMessage = `🤖 I see you weren't satisfied with my response. Feel free to provide more details or @mention me with specific feedback on how I can improve!`;
          await this.agentClient.createComment(reaction.issue.id, improvementMessage, workspaceId);
        }
      }
      
    } catch (error) {
      console.error('Failed to handle comment reaction:', error);
    }
  }

  async handleIssueReaction(reaction, payload, workspaceId, agentUserId) {
    try {
      // Check if agent is assigned to the issue
      if (reaction.issue.assignee && reaction.issue.assignee.id === agentUserId) {
        console.log(`😀 Reaction ${reaction.emoji} on issue ${reaction.issue.id} assigned to agent`);
        
        // React to urgent/priority reactions
        if (['🔥', '⚡', '🚨', '⏰'].includes(reaction.emoji)) {
          const urgentMessage = `🤖 I see this has been marked as urgent with ${reaction.emoji}. Moving this to high priority!`;
          await this.agentClient.createComment(reaction.issue.id, urgentMessage, workspaceId);
        }
        
        // React to approval/completion reactions
        if (['✅', '🎉', '👍'].includes(reaction.emoji)) {
          const approvalMessage = `🤖 Thanks for the ${reaction.emoji}! Let me know if there's anything else I can help with.`;
          await this.agentClient.createComment(reaction.issue.id, approvalMessage, workspaceId);
        }
      }
      
    } catch (error) {
      console.error('Failed to handle issue reaction:', error);
    }
  }

  // ASSIGNMENT HELPER METHODS

  async createAssignmentAcknowledgment(issue, projectContext) {
    const priority = this.detectIssuePriority(issue);
    const issueType = this.detectIssueType(issue);
    
    let acknowledgeMessage = `🤖 I've been assigned to this ${issueType}`;
    
    // Add priority context
    if (priority === 'high') {
      acknowledgeMessage += ` (high priority)`;
    } else if (priority === 'urgent') {
      acknowledgeMessage += ` (urgent)`;
    }
    
    acknowledgeMessage += ` and will start working on it immediately.\n\n`;
    
    // Add context-specific information
    if (issueType === 'bug') {
      acknowledgeMessage += `🔍 I'll investigate the issue and provide analysis with potential solutions.`;
    } else if (issueType === 'feature') {
      acknowledgeMessage += `✨ I'll break down the requirements and provide implementation guidance.`;
    } else if (issueType === 'epic') {
      acknowledgeMessage += `📋 I'll break this down into manageable user stories and tasks.`;
    } else {
      acknowledgeMessage += `📝 I'll analyze this and provide detailed guidance and recommendations.`;
    }
    
    // Add project context if available
    if (projectContext && projectContext.name !== 'Unknown Project') {
      acknowledgeMessage += `\n\n🏗️ Project context: ${projectContext.name}`;
    }
    
    acknowledgeMessage += `\n\nFeel free to @mention me anytime for updates or specific questions!`;
    
    return acknowledgeMessage;
  }

  detectIssuePriority(issue) {
    const title = issue.title?.toLowerCase() || '';
    const description = issue.description?.toLowerCase() || '';
    const labels = issue.labels?.nodes || [];
    
    // Check for urgent indicators
    if (title.includes('urgent') || title.includes('critical') || title.includes('hotfix') ||
        description.includes('urgent') || description.includes('critical') ||
        labels.some(label => ['urgent', 'critical', 'p0', 'hotfix'].includes(label.name?.toLowerCase()))) {
      return 'urgent';
    }
    
    // Check for high priority indicators
    if (title.includes('high priority') || title.includes('important') ||
        description.includes('high priority') || description.includes('important') ||
        labels.some(label => ['high', 'p1', 'important'].includes(label.name?.toLowerCase()))) {
      return 'high';
    }
    
    return 'normal';
  }

  detectIssueType(issue) {
    const title = issue.title?.toLowerCase() || '';
    const description = issue.description?.toLowerCase() || '';
    const labels = issue.labels?.nodes || [];
    
    // Check for bug indicators
    if (title.includes('bug') || title.includes('fix') || title.includes('error') ||
        description.includes('bug') || description.includes('error') ||
        labels.some(label => ['bug', 'fix', 'error'].includes(label.name?.toLowerCase()))) {
      return 'bug';
    }
    
    // Check for feature indicators
    if (title.includes('feature') || title.includes('add') || title.includes('implement') ||
        description.includes('feature') || description.includes('new') ||
        labels.some(label => ['feature', 'enhancement', 'new'].includes(label.name?.toLowerCase()))) {
      return 'feature';
    }
    
    // Check for epic indicators
    if (title.includes('epic') || 
        labels.some(label => ['epic'].includes(label.name?.toLowerCase()))) {
      return 'epic';
    }
    
    return 'task';
  }

  async moveIssueToInProgress(issue, workspaceId) {
    try {
      // Only move if issue is in a "not started" state
      const currentState = issue.state?.name?.toLowerCase() || '';
      const notStartedStates = ['backlog', 'todo', 'planned', 'new', 'open', 'triage'];
      
      if (notStartedStates.some(state => currentState.includes(state))) {
        console.log(`📊 Moving issue ${issue.id} from "${issue.state?.name}" to "In Progress"`);
        
        // Get available states for this team/project
        const inProgressStates = await this.findInProgressState(issue, workspaceId);
        
        if (inProgressStates.length > 0) {
          // Use the first "in progress" type state found
          const targetState = inProgressStates[0];
          await this.agentClient.updateIssueStatus(issue.id, targetState.id, workspaceId);
          
          console.log(`✅ Moved issue ${issue.id} to "${targetState.name}"`);
        } else {
          console.log(`⚠️ No suitable "In Progress" state found for issue ${issue.id}`);
        }
      } else {
        console.log(`📋 Issue ${issue.id} already in progress state: ${issue.state?.name}`);
      }
      
    } catch (error) {
      console.error('Failed to move issue to in progress:', error);
    }
  }

  async findInProgressState(issue, workspaceId) {
    try {
      // This would require getting the team's workflow states
      // For now, return common "in progress" state names
      const commonInProgressNames = [
        'In Progress', 'in progress', 'In Development', 'Started', 'Working', 'Doing'
      ];
      
      // In a real implementation, you'd query Linear's API for available states
      // For now, we'll return a mock state - this should be enhanced
      return [{
        id: 'mock-in-progress-state',
        name: 'In Progress'
      }];
      
    } catch (error) {
      console.error('Failed to find in progress state:', error);
      return [];
    }
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 Webhook server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }
}