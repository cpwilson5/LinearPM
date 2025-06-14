# goPM Linear Agent Installation Guide

## Phase 1: OAuth Application Setup & Testing

This guide covers setting up goPM as a Linear agent using OAuth authentication instead of personal API keys.

### Prerequisites

- Node.js 18+
- Access to Linear Developer Console
- Admin permissions in your Linear workspace

### Step 1: Create Linear OAuth Application

1. **Go to Linear Developer Console**
   - Visit: https://linear.app/settings/api/applications
   - Click "Create Application"

2. **Configure Application Settings**
   ```
   Name: goPM AI Assistant
   Description: AI-powered product management assistant for Linear
   Website URL: https://github.com/cpwilson5/LinearPM
   Redirect URIs: http://localhost:3000/oauth/callback
   ```

3. **Set Required Scopes**
   - ✅ `read` - Read access to workspace data
   - ✅ `write` - Write access for creating/updating
   - ✅ `issues:create` - Create new issues
   - ✅ `app:assignable` - Allow assignment to issues/projects
   - ✅ `app:mentionable` - Allow @mentions in issues/documents

4. **Enable Webhooks**
   - Check "Enable webhooks" 
   - Select "Inbox notifications" event type
   - Webhook URL: `http://localhost:3000/webhook` (or your domain)

5. **Save and Get Credentials**
   - Copy the Client ID and Client Secret
   - Store them securely

### Step 2: Configure Environment Variables

Update your `.env` file with OAuth credentials:

```bash
# Linear OAuth Configuration (Agent Mode)
LINEAR_CLIENT_ID=your_linear_oauth_client_id_here
LINEAR_CLIENT_SECRET=your_linear_oauth_client_secret_here
LINEAR_REDIRECT_URI=http://localhost:3000/oauth/callback

# Legacy configuration (keep for backward compatibility)
LINEAR_API_KEY=your_linear_api_key_here
LINEAR_WEBHOOK_SECRET=your_webhook_secret_here

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Step 3: Start goPM Server

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start with both legacy and agent modes available:
- Legacy webhook: `http://localhost:3000/webhook`
- Agent installation: `http://localhost:3000/oauth/install`
- Status check: `http://localhost:3000/status`

### Step 4: Install Agent in Linear Workspace

1. **Start Installation**
   - Open: `http://localhost:3000/oauth/install`
   - You'll be redirected to Linear for authorization

2. **Authorize in Linear**
   - Select your workspace
   - Review permissions
   - Click "Install Application"

3. **Verify Installation**
   - You'll be redirected back to goPM with success message
   - Check status: `http://localhost:3000/status`

### Step 5: Test Agent Functionality

1. **Check Installation Status**
   ```bash
   curl http://localhost:3000/status
   ```
   
   Expected response:
   ```json
   {
     "service": "goPM",
     "mode": "agent",
     "hasLegacyClient": true,
     "agentWorkspaces": 1,
     "totalClients": 2,
     "workspaces": [
       {
         "id": "workspace-id",
         "name": "Your Workspace",
         "agentId": "agent-user-id",
         "installedAt": "2024-12-14T..."
       }
     ]
   }
   ```

2. **Test Agent Mention**
   - Go to any Linear issue
   - Add comment: `@goPM help me analyze this issue`
   - The agent should respond with "🤖 goPM agent is working on this..."
   - Then update with AI response

3. **Test Agent Assignment**
   - Assign any issue to the goPM agent
   - The agent should acknowledge assignment

### Troubleshooting

#### OAuth Installation Issues

**Error: "Invalid redirect URI"**
- Verify redirect URI in Linear app matches `.env` setting
- Ensure no trailing slashes: `http://localhost:3000/oauth/callback`

**Error: "Invalid client credentials"**
- Double-check CLIENT_ID and CLIENT_SECRET in `.env`
- Ensure no extra spaces or quotes

**Error: "Missing required scopes"**
- Verify all required scopes are enabled in Linear app:
  - `app:assignable`, `app:mentionable`, `read`, `write`, `issues:create`

#### Agent Not Responding

**Check Webhook Configuration**
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"Comment","action":"create","data":{"body":"@goPM test","issue":{"id":"test"}}}'
```

**Check Server Logs**
- Look for "🤖 Initialized agent client for workspace" messages
- Check for OAuth token exchange success
- Verify workspace ID extraction from webhooks

**Check Linear Webhook Settings**
- Ensure webhook URL points to your server
- Verify "Inbox notifications" is enabled
- Check webhook secret matches (if using signature verification)

#### Fallback to Legacy Mode

If agent mode fails, goPM automatically falls back to legacy API key mode:
- Verify `LINEAR_API_KEY` is set in `.env`
- Check server logs for "Using legacy client" messages
- Agent features won't be available, but basic @goPM mentions will work

### Development Notes

#### Multi-Workspace Support

The agent supports multiple workspace installations:
- Each workspace gets its own OAuth token
- Workspace ID is extracted from webhook events
- Automatic fallback between workspaces

#### Token Management

- Tokens are stored in memory (development)
- Production should use persistent storage (database)
- Automatic cleanup of expired tokens
- Token refresh handling (if Linear supports it)

#### Agent vs Legacy Mode

| Feature | Legacy Mode | Agent Mode |
|---------|-------------|------------|
| @goPM mentions | ✅ | ✅ |
| Issue assignment | ❌ | ✅ |
| Agent user presence | ❌ | ✅ |
| Workspace member | ❌ | ✅ |
| Multi-workspace | ❌ | ✅ |

### Next Steps

After successful Phase 1 testing:
1. **Phase 2**: Implement assignment handling and inbox notifications
2. **Phase 3**: Add proactive agent behaviors
3. **Phase 4**: Visual generation and advanced integrations
4. **Phase 5**: AWS deployment and distribution

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/install` | GET | Start agent installation |
| `/oauth/callback` | GET | OAuth callback handler |
| `/oauth/status` | GET | Installation status |
| `/oauth/workspace/:id` | DELETE | Remove workspace |
| `/status` | GET | Overall service status |
| `/health` | GET | Health check |
| `/webhook` | POST | Linear webhook events |

### Security Considerations

- Store CLIENT_SECRET securely
- Use HTTPS in production
- Implement proper webhook signature verification
- Validate all OAuth state parameters
- Regular token cleanup and rotation