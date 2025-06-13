#!/usr/bin/env node

import { WebhookServer } from './webhook-server.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Starting goPM...');
  
  // Start Webhook Server
  const webhookServer = new WebhookServer();
  await webhookServer.start();
  
  console.log('✅ goPM is running!');
  console.log(`Webhook Server: http://localhost:${process.env.PORT || 3000}`);
  console.log('Ready to receive @goPM commands!');
}

main().catch((error) => {
  console.error('❌ Failed to start goPM:', error);
  process.exit(1);
});