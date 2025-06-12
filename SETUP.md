# LinearPM Setup Guide

## Current Status ✅

LinearPM foundation is built and ready! We're running in test mode while npm registry issues resolve.

## Quick Start

### 1. Get Your API Keys

**Linear API Key:**
```bash
# Go to: Linear → Settings → API → Personal API Keys
# Create new key, then add to .env:
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx
```

**Anthropic API Key:**
```bash
# Go to: https://console.anthropic.com
# Get your API key, then add to .env:
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 2. Test the Server

```bash
# Start test server
node test-server.js

# Test health endpoint (in another terminal)
curl http://localhost:3000/health
```

### 3. Install Dependencies (when npm registry is working)

```bash
npm install
```

### 4. Set Up Linear Webhook

1. Go to Linear → Settings → API → Webhooks
2. Create new webhook:
   - **URL**: `https://your-domain.com/webhook` (or ngrok for testing)
   - **Events**: Comment events, Issue events
3. Copy the webhook secret to `.env`:
   ```bash
   LINEAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

### 5. Start Full Server

```bash
# Once dependencies are installed
npm start

# Or for development
npm run dev
```

## Testing LinearPM

### Option 1: Local Testing with ngrok

```bash
# Install ngrok if you haven't
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL for Linear webhook
```

### Option 2: Manual Testing

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Comment",
    "action": "create",
    "data": {
      "body": "@LinearPM help me improve test cases",
      "issue": { "id": "test-issue-123" }
    }
  }'
```

## Using LinearPM in Linear

Once set up, use these commands in Linear issues/comments:

- `@LinearPM help me improve the test cases`
- `@LinearPM help me improve the acceptance criteria`
- `@LinearPM suggest requirements`

## Expected Behavior

1. You mention `@LinearPM` in Linear
2. LinearPM responds with 🤖 (working on it)
3. AI analyzes your request and issue context
4. Detailed suggestions posted as Linear comment

## Troubleshooting

### Dependencies Won't Install
- npm registry issues - use `node test-server.js` for now
- Try again later or use `npm install --registry https://registry.yarnpkg.com`

### Linear API Errors
- Check API key is valid and has proper permissions
- Verify webhook URL is accessible from internet

### Anthropic API Errors
- Check API key is valid
- Verify you have credits/usage available

## Architecture

- **Webhook Server**: Receives Linear events (`/webhook`)
- **Command Parser**: Extracts @LinearPM commands
- **AI Assistant**: Processes requests with specialized prompts
- **Linear Client**: Posts responses back to Linear

Ready to transform your Linear workflow with AI! 🚀