# goPM 🤖

**Complete Linear Agent for AI-Powered Product Management**

goPM is a fully-featured Linear agent that integrates seamlessly with your workspace. It supports both OAuth agent mode and legacy API key mode, providing instant AI assistance for all your product management needs.

---

## ✨ Core Features

### 🚀 **Dual-Mode Operation**
- **🤖 Agent Mode**: Full Linear agent with OAuth, assignments, and proactive behaviors  
- **📋 Legacy Mode**: Webhook-based operation using personal API keys

### ⚡ **Instant Responsiveness**
- **Immediate acknowledgment** with 🤔 thinking emoji (< 2 seconds)
- **Live progress updates** for long-running AI analysis
- **Smart completion messages** with context-aware next steps

### 🎯 **Complete Linear Integration**
- **Assignment handling** with smart acknowledgments based on issue type/priority
- **Emoji reaction responses** to user feedback (👍❤️🎉 → thanks, 👎❌ → improvements)
- **Status change monitoring** and intelligent workflow insights
- **Full webhook event support** (Comments, Issues, Reactions, Assignments)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Linear workspace with admin access
- Anthropic API key

### Option A: Agent Mode (Recommended)

1. **Install Dependencies**
   ```bash
   git clone <your-repo>
   cd goPM
   npm install
   ```

2. **Create Linear OAuth App**
   - Go to [Linear Developer Console](https://linear.app/settings/api/applications)
   - Create application with scopes: `read`, `write`, `issues:create`, `app:assignable`, `app:mentionable`
   - Set redirect URI: `http://localhost:3000/oauth/callback`

3. **Configure Environment**
   ```bash
   # OAuth Configuration (Agent Mode)
   LINEAR_CLIENT_ID=your_client_id_here
   LINEAR_CLIENT_SECRET=your_client_secret_here
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   PORT=3000
   ```

4. **Install Agent**
   ```bash
   npm start
   # Visit: http://localhost:3000/oauth/install
   # Complete OAuth flow in Linear
   ```

### Option B: Legacy Mode

1. **Use Personal API Key**
   ```bash
   # Legacy Configuration
   LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx
   LINEAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```

2. **Configure Webhook**
   - Linear → Settings → API → Webhooks
   - URL: `https://your-domain.com/webhook`

---

## 💬 How to Use

### 🤖 **Agent Mode** - `@goPM`
The complete Linear agent experience:

**Mention in Comments:**
```
@goPM what are the risks with this feature?
@goPM break this epic down into user stories  
@goPM help me improve these acceptance criteria
@goPM estimate development effort for this task
```

**Assign to Issues:**
- Assign the goPM agent directly to any issue
- Get intelligent acknowledgment based on issue type (bug, feature, epic)
- Agent provides context-aware analysis and next steps

**React with Emojis:**
- 👍❤️🎉✅ → Agent thanks you for positive feedback
- 👎❌😞 → Agent offers to improve and asks for specifics
- 🔥⚡🚨⏰ → Agent acknowledges urgency and prioritizes

### 📋 **Legacy Mode** - `@LinearPM`  
Traditional webhook-based interaction:
```
@LinearPM estimate effort for this task
@LinearPM suggest requirements for this feature
@LinearPM analyze the technical complexity
```

### 🎭 **Response Experience**
1. **Instant acknowledgment** (🤔) within 2 seconds
2. **Live processing updates** ("🧠 Still thinking..." for long requests)
3. **Smart completion** with context-aware next steps
4. **Professional signatures** with timestamps

---

## 🎯 Live Examples

### 🤖 Agent Assignment Example
**When you assign goPM to a high-priority bug:**
```
🤖 I've been assigned to this bug (high priority) and will start working on it immediately.

🔍 I'll investigate the issue and provide analysis with potential solutions.

🏗️ Project context: User Authentication System

Feel free to @mention me anytime for updates or specific questions!
```

### 💬 Agent Mention Example  
**Your comment:** `@goPM break down this user authentication epic`

**Live response evolution:**
```
🤔
↓ (2 seconds later)
🤔 Analyzing this issue...
Started: 12/14/2024, 02:30:15 PM EST
↓ (after processing)
## Epic Breakdown: User Authentication

### User Stories
1. **Basic Login Flow**
   - As a user, I want to log in with email/password
   - Acceptance criteria: validation, error handling, redirect

2. **Registration Process** 
   - As a new user, I want to create an account
   - Acceptance criteria: form validation, email verification

3. **Password Reset**
   - As a user, I want to reset my forgotten password
   - Acceptance criteria: email flow, secure token handling

🎯 **Next Steps**: Consider creating sub-issues for each story, or @mention me with "create tasks" if you'd like me to help structure them.

🤖 Completed by goPM agent: 12/14/2024, 02:30:45 PM EST
```

### 😀 Emoji Reaction Example
**When you react 👍 to agent's comment:**
```
🤖 Thanks for the positive feedback! Happy to help anytime.
```

**When you react 🔥 to an assigned issue:**
```
🤖 I see this has been marked as urgent with 🔥. Moving this to high priority!
```

---

## 🏗️ Architecture

```
Linear Event → Webhook Router → Event Handler → AI Assistant → Live Response
                    ↓
    Comments/Issues/Reactions/Assignments
                    ↓
         🤖 Agent Mode (OAuth) | 📋 Legacy Mode (API Key)
                    ↓
              Instant Acknowledgment → Async Processing → Smart Completion
```

### Core Components
- **Webhook Server**: Comprehensive Linear event processing (Comments, Issues, Reactions, Assignments)
- **Agent Client**: Full OAuth-based Linear agent with assignment handling and proactive behaviors
- **Legacy Client**: API key-based fallback for traditional webhook interactions
- **AI Assistant**: Claude integration with context-aware responses and next step suggestions
- **OAuth Manager**: Token persistence, workspace management, and installation handling

### Key Features
- **Dual Authentication**: OAuth agent mode + API key legacy mode
- **Event-Driven Architecture**: Responds to all Linear webhook event types
- **Async Processing**: Immediate acknowledgment with background AI processing
- **Smart Context Building**: Project awareness, issue analysis, and team workflow integration

---

## 🔧 Development

### Project Structure
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
```

### API Endpoints
```bash
# OAuth Agent Installation
GET  /oauth/install        # Start agent installation flow
GET  /oauth/callback       # OAuth callback handler
GET  /oauth/status         # Installation status
POST /oauth/test-token     # Debug token validation

# Service Status
GET  /status               # Service and workspace status
GET  /health               # Health check
POST /webhook              # Linear webhook events
```

### Testing Commands
```bash
# Check agent installation status
curl http://localhost:3000/status

# Health check
curl http://localhost:3000/health

# Test webhook (agent mode)
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Comment","action":"create","data":{"body":"@goPM test","issue":{"id":"123"}}}'

# Test webhook (legacy mode)  
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Comment","action":"create","data":{"body":"@LinearPM test","issue":{"id":"123"}}}'
```

---

## 🛠️ Troubleshooting

### Agent Mode Issues

**Agent not installed:**
```bash
# Check installation status
curl http://localhost:3000/status
# Should show "mode": "agent" and workspace count > 0
```

**Agent not responding to assignments:**
- Verify agent has `app:assignable` scope in Linear app
- Check logs for "🎯 Issue assigned to agent" messages
- Ensure webhook URL is properly configured

**OAuth token issues:**
- Tokens are stored in `.gopm-tokens.json`
- Delete file and reinstall if corrupted
- Check LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET in `.env`

### General Issues

**Slow AI responses:**
- Agent shows 🤔 instantly, then processes asynchronously
- Progress updates appear after 10+ seconds
- Normal processing time: 5-30 seconds

**Webhook not receiving events:**
- Verify webhook URL is accessible publicly
- Check Linear webhook settings match your domain
- Look for "📨 Webhook received" in server logs

**Missing context:**
- Add more details in issue title/description
- Include project information for better responses
- Be specific in your requests for targeted help

### Quick Fixes

```bash
# Restart server to reload OAuth tokens
npm start

# Clear OAuth tokens and reinstall
rm .gopm-tokens.json
# Visit: http://localhost:3000/oauth/install

# Test specific webhook events
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Issue","action":"update","data":{"assignee":{"id":"your-agent-id"}}}'
```

---

---

## 🚀 What's Next?

goPM is a complete Linear agent implementation ready for production use. Upcoming enhancements include:

- **Slack Integration** - Pull conversation context from team channels
- **Gong Integration** - Add customer insights from sales calls  
- **Visual Generation** - Create mockups and diagrams with AI
- **Advanced Analytics** - Team productivity insights and reporting

---

## 📄 License

MIT License

---

**🤖 Complete Linear Agent • ⚡ Instant Responses • 🧠 AI-Powered PM Assistant**

**Get your AI PM assistant running in under 5 minutes!** 🚀