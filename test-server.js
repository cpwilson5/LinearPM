#!/usr/bin/env node

// Simple test server without dependencies
import { createServer } from 'http';

const port = process.env.PORT || 3000;

const server = createServer((req, res) => {
  // CORS headers for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${port}`);
  
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'LinearPM Test Server',
      message: 'Ready for API keys and dependencies!'
    }));
    return;
  }
  
  if (url.pathname === '/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log('📥 Received webhook:', payload.type || 'Unknown');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Webhook received! (LinearPM ready for configuration)'
        }));
      } catch (error) {
        console.error('❌ Webhook error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log('🚀 LinearPM Test Server Started!');
  console.log(`📡 Server running on http://localhost:${port}`);
  console.log('🔍 Test endpoints:');
  console.log(`   GET  http://localhost:${port}/health`);
  console.log(`   POST http://localhost:${port}/webhook`);
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Add your API keys to .env file');
  console.log('   2. Run: npm install (when registry is working)');
  console.log('   3. Set up Linear webhook');
  console.log('   4. Start using @LinearPM in Linear!');
});

process.on('SIGINT', () => {
  console.log('\n👋 LinearPM Test Server stopped');
  process.exit(0);
});