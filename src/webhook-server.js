import express from 'express';
import { CommandParser } from './command-parser.js';
import { AIAssistant } from './ai-assistant.js';
import { LinearClient } from './linear-client.js';

export class WebhookServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.commandParser = new CommandParser();
    this.aiAssistant = new AIAssistant();
    this.linearClient = new LinearClient();
    
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
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'goPM' });
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

    // Manual trigger endpoint for testing
    this.app.post('/trigger', async (req, res) => {
      try {
        const { issueId, command, context } = req.body;
        await this.processCommand(issueId, command, context);
        res.json({ success: true, message: 'Command processed' });
      } catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  async handleLinearWebhook(payload) {
    // Handle comment creation events
    if (payload.type === 'Comment' && payload.action === 'create') {
      const comment = payload.data;
      
      // Check if comment mentions @goPM
      if (comment.body && comment.body.includes('@goPM')) {
        await this.processLinearComment(comment);
      }
    }
    
    // Handle issue updates that might contain @goPM mentions
    if (payload.type === 'Issue' && (payload.action === 'create' || payload.action === 'update')) {
      const issue = payload.data;
      
      if (issue.description && issue.description.includes('@goPM')) {
        console.log(`Received Issue ${issue.id}`);
        console.log(issue.description);
        await this.processLinearIssue(issue);
      }
    }
  }

  async processLinearComment(comment) {
    const command = await this.commandParser.parseCommand(comment.body);
    if (!command) return;

    const { issue, projectContext } = await this.getIssueContext(comment.issue.id);
    
    this.logCommentProcessing(comment, issue, projectContext);
    
    await this.processCommand(comment.issue.id, command, this.buildContext(issue, projectContext));
  }

  async processLinearIssue(issue) {
    const command = await this.commandParser.parseCommand(issue.description);
    if (!command) return;

    const { issue: fullIssue, projectContext } = await this.getIssueContext(issue.id);
    
    await this.processCommand(issue.id, command, this.buildContext(fullIssue, projectContext));
  }

  async getIssueContext(issueId) {
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

  logCommentProcessing(comment, issue, projectContext) {
    const commentSnippet = this.createSnippet(comment.body);
    const issueSnippet = this.createSnippet(issue.description || '');
    
    console.log('');
    console.log(`💬 Received Comment ${commentSnippet}`);
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

  async processCommand(issueId, command, context) {
    try {
      // Create initial working comment
      await this.linearClient.addWorkingComment(issueId);
      
      // Get AI response using master prompt
      const response = await this.aiAssistant.handleConversationalRequest(
        command.originalText,
        context
      );
      
      // Update the working comment with the full response
      await this.linearClient.updateWorkingCommentWithResult(issueId, response);
      
    } catch (error) {
      console.error('Command processing error:', error);
      await this.handleProcessingError(issueId);
    }
  }

  async handleProcessingError(issueId) {
    const errorMessage = '❌ Sorry, I encountered an error processing your request. Please try again.';
    
    try {
      // Try to update the working comment with error
      await this.linearClient.updateWorkingCommentWithResult(issueId, errorMessage);
    } catch (updateError) {
      console.error('Failed to update working comment with error:', updateError);
      // Fallback: Add error message as new comment
      try {
        await this.linearClient.addComment(issueId, errorMessage);
      } catch (fallbackError) {
        console.error('Failed to add fallback error comment:', fallbackError);
      }
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