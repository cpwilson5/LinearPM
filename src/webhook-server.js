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
    console.log('📨 Received webhook:', payload.type);
    
    // Handle comment creation events
    if (payload.type === 'Comment' && payload.action === 'create') {
      const comment = payload.data;
      
      // Check if comment mentions @goPM
      if (comment.body && comment.body.includes('@goPM')) {
        console.log('💬 Processing @goPM mention in comment');
        console.log(`   Issue ID: ${comment.issue.id}`);
        await this.processLinearComment(comment);
      }
    }
    
    // Handle issue updates that might contain @goPM mentions
    if (payload.type === 'Issue' && (payload.action === 'create' || payload.action === 'update')) {
      const issue = payload.data;
      
      if (issue.description && issue.description.includes('@goPM')) {
        console.log('📋 Processing @goPM mention in issue');
        console.log(`   Issue ID: ${issue.id}`);
        await this.processLinearIssue(issue);
      }
    }
  }

  async processLinearComment(comment) {
    const command = await this.commandParser.parseCommand(comment.body, this.aiAssistant);
    
    if (command) {
      // Get full issue context with project information
      const issue = await this.linearClient.getIssueWithProject(comment.issue.id);
      const projectContext = await this.linearClient.getProjectContext(issue);
      
      await this.processCommand(comment.issue.id, command, {
        issueTitle: issue.title,
        issueDescription: issue.description,
        comments: issue.comments?.nodes || [],
        team: issue.team?.name,
        state: issue.state?.name,
        projectContext: projectContext
      });
    }
  }

  async processLinearIssue(issue) {
    const command = await this.commandParser.parseCommand(issue.description, this.aiAssistant);
    
    if (command) {
      // Get full issue context with project information
      const fullIssue = await this.linearClient.getIssueWithProject(issue.id);
      const projectContext = await this.linearClient.getProjectContext(fullIssue);
      
      await this.processCommand(issue.id, command, {
        issueTitle: issue.title,
        issueDescription: issue.description,
        team: issue.team?.name,
        state: issue.state?.name,
        projectContext: projectContext
      });
    }
  }

  async processCommand(issueId, command, context) {
    try {
      // Create initial working comment
      await this.linearClient.addWorkingComment(issueId);
      
      let response;
      
      // All requests now use the master prompt
      response = await this.aiAssistant.handleConversationalRequest(
        command.originalText,
        context
      );
      
      // Update the working comment with the full response
      await this.linearClient.updateWorkingCommentWithResult(issueId, response);
      
    } catch (error) {
      console.error('Command processing error:', error);
      
      try {
        // Try to update the working comment with error
        await this.linearClient.updateWorkingCommentWithResult(issueId, '❌ Sorry, I encountered an error processing your request. Please try again.');
      } catch (updateError) {
        console.error('Failed to update working comment with error:', updateError);
        // Fallback: Add error message as new comment
        try {
          await this.linearClient.addComment(
            issueId,
            '❌ Sorry, I encountered an error processing your request. Please try again.'
          );
        } catch (fallbackError) {
          console.error('Failed to add fallback error comment:', fallbackError);
        }
      }
    }
  }

  createSummaryResponse(response, commandType) {
    const maxLength = 100;
    let summary = response.substring(0, maxLength);
    
    if (response.length > maxLength) {
      summary += '...';
    }
    
    // Remove line breaks for cleaner display
    summary = summary.replace(/\n/g, ' ').trim();
    
    const action = 'Completed request';
    return `${action}: ${summary}`;
  }

  getWorkingEmoji(commandType) {
    const emojiMap = {
      'improve_test_cases': '🧪',
      'improve_acceptance_criteria': '✅',
      'suggest_requirements': '📋',
      'break_down_epic': '🧩',
      'estimate_effort': '⏱️',
      'identify_risks': '⚠️',
      'create_user_stories': '👥',
      'analyze_dependencies': '🔗',
      'suggest_mvp_scope': '🎯',
      'conversational_request': '🤖'
    };
    
    return emojiMap[commandType] || '🤖';
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