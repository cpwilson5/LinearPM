# goPM Setup Guide

**Complete Linear Agent Installation**

goPM supports two installation modes: **Agent Mode** (recommended) with OAuth, and **Legacy Mode** with API keys.

---

## 🤖 Agent Mode Setup (Recommended)

### 1. Prerequisites
- Node.js 18+
- Linear workspace admin access
- Anthropic API key

### 2. Clone and Install
```bash
git clone <your-repo>
cd goPM
npm install
```

### 3. Create Linear OAuth Application
1. **Go to Linear Developer Console**
   - Visit: https://linear.app/settings/api/applications
   - Click "Create Application"

2. **Configure Application**
   ```
   Name: goPM AI Assistant
   Description: AI-powered product management assistant
   Website: https://github.com/your-username/goPM
   Redirect URI: http://localhost:3000/oauth/callback
   ```

3. **Set Required Scopes**
   - ✅ `read` - Read workspace data
   - ✅ `write` - Write access for comments/updates
   - ✅ `issues:create` - Create new issues
   - ✅ `app:assignable` - Allow assignment to issues
   - ✅ `app:mentionable` - Allow @mentions

4. **Get OAuth Credentials**
   - Copy Client ID and Client Secret

### 4. Environment Configuration
Create `.env` file:
```bash
# OAuth Configuration (Agent Mode)
LINEAR_CLIENT_ID=your_client_id_here
LINEAR_CLIENT_SECRET=your_client_secret_here
LINEAR_REDIRECT_URI=http://localhost:3000/oauth/callback

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 5. Install Agent
```bash
# Start server
npm start

# Install agent (opens browser)
open http://localhost:3000/oauth/install

# Follow OAuth flow in Linear
# - Select your workspace
# - Review permissions
# - Click "Install Application"
```

### 6. Verify Installation
```bash
# Check agent status
curl http://localhost:3000/status

# Should show:
# {
#   "service": "goPM",
#   "mode": "agent",
#   "agentWorkspaces": 1,
#   "workspaces": [...]
# }
```

---

## 📋 Legacy Mode Setup

### Alternative: API Key Setup
If you prefer traditional webhook mode:

```bash
# Legacy Configuration
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx
LINEAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
PORT=3000
```

### Webhook Configuration
1. Go to Linear → Settings → API → Webhooks
2. Create webhook pointing to: `https://your-domain.com/webhook`
3. Select events: Comment, Issue, Reaction
4. Use webhook secret from `.env`

---

## 🧪 Testing & Usage

### Agent Mode Testing
```bash
# Check installation status
curl http://localhost:3000/status

# OAuth installation status
curl http://localhost:3000/oauth/status

# Health check
curl http://localhost:3000/health
```

### Using Agent Mode (@goPM)
**Mention in Comments:**
```
@goPM break down this epic into user stories
@goPM what are the risks with this feature?
@goPM help improve these acceptance criteria
```

**Assign to Issues:**
- Assign the goPM agent directly to any issue
- Get smart acknowledgment based on issue type

**React with Emojis:**
- 👍❤️🎉 → Agent thanks you
- 👎❌😞 → Agent asks for improvement feedback
- 🔥⚡🚨 → Agent acknowledges urgency

### Using Legacy Mode (@LinearPM)
```
@LinearPM estimate effort for this task
@LinearPM analyze technical complexity
@LinearPM suggest requirements
```

### Expected Flow
1. **Instant acknowledgment** (🤔) within 2 seconds
2. **Live processing** ("🤔 Analyzing this issue...")
3. **Progress updates** for long requests ("🧠 Still thinking...")
4. **Smart completion** with next steps and timestamp

### Local Development with ngrok
```bash
# Expose local server for webhook testing
ngrok http 3000
# Use ngrok URL in Linear webhook/OAuth settings
```

### Manual Webhook Testing
```bash
# Test agent mention
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Comment","action":"create","data":{"body":"@goPM test","issue":{"id":"123"}}}'

# Test legacy mention  
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Comment","action":"create","data":{"body":"@LinearPM test","issue":{"id":"123"}}}'

# Test assignment
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Issue","action":"update","data":{"assignee":{"id":"agent-user-id"},"id":"test-issue"}}'
```

---

## 🛠️ Troubleshooting

### Agent Mode Issues

**OAuth Installation Failed:**
```bash
# Check OAuth credentials
echo $LINEAR_CLIENT_ID
echo $LINEAR_CLIENT_SECRET

# Verify redirect URI matches exactly
# Linear App: http://localhost:3000/oauth/callback
# .env file: LINEAR_REDIRECT_URI=http://localhost:3000/oauth/callback
```

**Agent Not Responding to Assignments:**
- Verify agent has `app:assignable` scope
- Check for "🎯 Issue assigned to agent" in server logs
- Ensure workspace ID extraction is working

**OAuth Tokens Lost After Restart:**
- Check if `.gopm-tokens.json` file exists
- Verify file permissions (should be readable/writable)
- Look for "📥 Loaded token for workspace" on startup

### General Issues

**Webhook Not Receiving Events:**
- Ensure webhook URL is publicly accessible
- Use ngrok for local development
- Check Linear webhook configuration
- Look for "📨 Webhook received" in logs

**Slow AI Responses:**
- Agent shows 🤔 instantly (< 2 seconds)
- Progress updates appear after 10+ seconds
- Normal AI processing: 5-30 seconds

**Missing Context:**
- Include more details in issue description
- Add project information for better responses
- Be specific in requests

### Quick Fixes

```bash
# Restart and check status
npm start
curl http://localhost:3000/status

# Reinstall OAuth agent
rm .gopm-tokens.json
open http://localhost:3000/oauth/install

# Check OAuth status
curl http://localhost:3000/oauth/status

# Test both modes
# Agent: @goPM test
# Legacy: @LinearPM test
```

---

## 📁 Project Structure

```
src/
├── index.js                # Entry point
├── webhook-server.js       # Event routing & async processing
├── agent-linear-client.js  # OAuth agent with assignments & reactions
├── linear-client.js        # Legacy API key client
├── oauth-manager.js        # Token persistence & workspace management
├── oauth-routes.js         # OAuth installation & status endpoints
├── ai-assistant.js         # Claude integration with context awareness
└── command-parser.js       # Legacy @LinearPM detection

OAuth tokens: .gopm-tokens.json (auto-generated)
```

---

## 🎉 Success!

**You now have a complete Linear agent with:**
- ⚡ Instant responses (🤔 acknowledgment in < 2 seconds)
- 🤖 Smart assignment handling with context-aware responses
- 😀 Emoji reaction processing for interactive feedback
- 🎯 Context-aware completion with next step suggestions
- 🔄 Dual-mode operation (OAuth agent + Legacy webhook)

**Ready for AI-powered PM assistance in Linear!** 🚀