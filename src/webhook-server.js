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
      res.json({ status: 'healthy', service: 'LinearPM' });
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
    console.log('Received webhook:', payload.type);
    
    // Handle comment creation events
    if (payload.type === 'Comment' && payload.action === 'create') {
      const comment = payload.data;
      
      // Check if comment mentions @LinearPM
      if (comment.body && comment.body.includes('@LinearPM')) {
        await this.processLinearComment(comment);
      }
    }
    
    // Handle issue updates that might contain @LinearPM mentions
    if (payload.type === 'Issue' && (payload.action === 'create' || payload.action === 'update')) {
      const issue = payload.data;
      
      if (issue.description && issue.description.includes('@LinearPM')) {
        await this.processLinearIssue(issue);
      }
    }
  }

  async processLinearComment(comment) {
    const command = await this.commandParser.parseCommand(comment.body, this.aiAssistant);
    
    if (command) {
      // Get full issue context
      const issue = await this.linearClient.getIssue(comment.issue.id);
      
      await this.processCommand(comment.issue.id, command, {
        issueTitle: issue.title,
        issueDescription: issue.description,
        comments: issue.comments.nodes,
        team: issue.team?.name,
        state: issue.state?.name
      });
    }
  }

  async processLinearIssue(issue) {
    const command = await this.commandParser.parseCommand(issue.description, this.aiAssistant);
    
    if (command) {
      await this.processCommand(issue.id, command, {
        issueTitle: issue.title,
        issueDescription: issue.description,
        team: issue.team?.name,
        state: issue.state?.name
      });
    }
  }

  async processCommand(issueId, command, context) {
    try {
      // First, acknowledge with emoji
      const workingEmoji = this.getWorkingEmoji(command.type);
      await this.linearClient.addComment(issueId, `${workingEmoji} Working on it...`);
      
      let response;
      
      switch (command.type) {
        case 'improve_test_cases':
          response = await this.aiAssistant.improveTestCases(
            command.currentContent || '',
            context
          );
          break;
          
        case 'improve_acceptance_criteria':
          response = await this.aiAssistant.improveAcceptanceCriteria(
            command.currentContent || '',
            context
          );
          break;
          
        case 'suggest_requirements':
          response = await this.aiAssistant.suggestRequirements(context);
          break;
          
        case 'break_down_epic':
          response = await this.aiAssistant.breakDownEpic(context);
          break;
          
        case 'estimate_effort':
          response = await this.aiAssistant.estimateEffort(context);
          break;
          
        case 'identify_risks':
          response = await this.aiAssistant.identifyRisks(context);
          break;
          
        case 'create_user_stories':
          response = await this.aiAssistant.createUserStories(context);
          break;
          
        case 'analyze_dependencies':
          response = await this.aiAssistant.analyzeDependencies(context);
          break;
          
        case 'suggest_mvp_scope':
          response = await this.aiAssistant.suggestMvpScope(context);
          break;
          
        case 'conversational_request':
        default:
          response = await this.aiAssistant.handleConversationalRequest(
            command.originalText,
            context
          );
      }
      
      // Add the AI response as a comment
      await this.linearClient.addComment(issueId, response);
      
    } catch (error) {
      console.error('Command processing error:', error);
      
      // Add error message as comment
      await this.linearClient.addComment(
        issueId,
        '❌ Sorry, I encountered an error processing your request. Please try again.'
      );
    }
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