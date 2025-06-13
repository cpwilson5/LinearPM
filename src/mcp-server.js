// Note: MCP Server temporarily disabled due to npm registry issues
// Will re-enable once @modelcontextprotocol/sdk is available

import { LinearClient } from './linear-client.js';
import { CommandParser } from './command-parser.js';
import { AIAssistant } from './ai-assistant.js';

export class GoPMServer {
  constructor() {
    console.log('📝 MCP Server functionality temporarily disabled');
    console.log('   Using webhook-only mode for now');
    
    this.linearClient = new LinearClient();
    this.commandParser = new CommandParser();
    this.aiAssistant = new AIAssistant();
  }

  // MCP functionality will be restored once SDK is available
  async connect() {
    console.log('📝 MCP connection skipped - using webhook mode');
  }
}