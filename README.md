# goPM 🤖

**AI-Powered Product Management Assistant for Linear**

goPM transforms your Linear workflow with intelligent, conversational AI assistance. Simply mention `@goPM` in any Linear issue or comment, and get expert product management guidance powered by Anthropic's Claude.

---

## ✨ What Makes goPM Special

### 🧠 Conversational Intelligence
- **Natural Language Processing**: Talk to goPM like you would a senior PM
- **Context-Aware Responses**: Understands your issue context and provides relevant advice
- **Smart Command Routing**: AI automatically determines the best type of assistance to provide

### 📋 Comprehensive PM Toolkit
- **Requirements & Planning**: Generate detailed requirements and break down epics
- **Quality Assurance**: Improve test cases and acceptance criteria
- **Risk Management**: Identify potential blockers and mitigation strategies
- **Estimation & Scoping**: Get effort estimates and MVP recommendations
- **User Stories**: Create comprehensive user stories with acceptance criteria

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Linear workspace with API access
- Anthropic API key

### Quick Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd goPM
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys:
   ```

3. **Get Your API Keys**
   
   **Linear API Key:**
   - Go to Linear → Settings → API → Personal API Keys
   - Create new key and add to `.env`:
   ```
   LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx
   ```

   **Anthropic API Key:**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Get your API key and add to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```

4. **Start the Server**
   ```bash
   npm start
   ```

5. **Set Up Linear Webhook**
   - Go to Linear → Settings → API → Webhooks
   - Create webhook pointing to your server: `https://your-domain.com/webhook`
   - Add webhook secret to `.env`:
   ```
   LINEAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

---

## 💬 How to Use goPM

### Conversational Commands
Just mention `@goPM` with your request in natural language:

```
@goPM what are the risks with this feature?
@goPM how long will this take to build?
@goPM break this epic down into user stories
@goPM help me improve these acceptance criteria
```

### Specific Command Categories

#### 🔍 **Quality Improvement**
- `@goPM improve test cases` - Enhance existing test coverage
- `@goPM improve acceptance criteria` - Refine criteria with GIVEN-WHEN-THEN format

#### 📋 **Planning & Requirements**
- `@goPM suggest requirements` - Generate comprehensive requirements
- `@goPM break down this epic` - Decompose large features into stories
- `@goPM create user stories` - Generate detailed user stories
- `@goPM suggest MVP scope` - Define minimum viable product features

#### ⚠️ **Risk & Analysis**
- `@goPM identify risks` - Analyze potential risks and blockers
- `@goPM analyze dependencies` - Map feature and team dependencies
- `@goPM estimate effort` - Get effort estimation guidance

#### 🤖 **Conversational**
- `@goPM [your question]` - Ask any PM question in natural language

---

## 🎯 Example Interactions

### Epic Breakdown
**You:** `@goPM break down this user authentication epic`

**goPM:** 🧩 Working on it...

```markdown
## 🧩 Epic Breakdown: User Authentication

### 📋 User Stories

**Story 1: Basic Login**
- **As a** registered user
- **I want** to log in with email/password
- **So that** I can access my account
- **Acceptance Criteria:**
  - [ ] User can enter email and password
  - [ ] System validates credentials
  - [ ] User is redirected to dashboard on success
- **Estimated Effort:** M

**Story 2: Registration Flow**
- **As a** new user
- **I want** to create an account
- **So that** I can start using the platform
...
```

### Risk Analysis
**You:** `@goPM what could go wrong with this payment integration?`

**goPM:** ⚠️ Working on it...

```markdown
## ⚠️ Risk Analysis: Payment Integration

### 🔴 High Risk Items
**PCI Compliance Requirements**
- **Probability:** High
- **Impact:** High
- **Description:** Payment processing requires PCI DSS compliance
- **Mitigation:** Use established payment processor (Stripe, PayPal)
- **Contingency:** Partner with compliant payment gateway
...
```

---

## 🏗️ Architecture

### System Overview
```
Linear Issue/Comment
       ↓
   goPM Mention
       ↓
  Webhook Handler
       ↓
   Command Parser
       ↓ 
  AI Assistant (Claude)
       ↓
   Linear Comment Response
```

### Key Components

- **🎯 Command Parser**: Intelligent natural language processing with fallback patterns
- **🧠 AI Assistant**: Specialized prompts for different PM tasks
- **📡 Webhook Server**: Real-time Linear event processing
- **🔗 Linear Client**: GraphQL integration with Linear API
- **⚡ MCP Integration**: Model Context Protocol support (when available)

---

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Linear Configuration
LINEAR_API_KEY=your_linear_api_key
LINEAR_WEBHOOK_SECRET=your_webhook_secret

# Anthropic Configuration  
ANTHROPIC_API_KEY=your_anthropic_key

# Server Configuration
PORT=3000
NODE_ENV=production

# MCP Configuration (Future)
MCP_SERVER_NAME=linear-pm
MCP_SERVER_VERSION=1.0.0
```

### Custom Prompts
goPM uses specialized prompts for each command type. You can customize these in `src/ai-assistant.js` to match your team's preferences and standards.

---

## 🧪 Testing & Development

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test webhook endpoint
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Comment", 
    "action": "create",
    "data": {
      "body": "@goPM help me improve test cases",
      "issue": {"id": "test-123"}
    }
  }'
```

### Local Development with ngrok
```bash
# Expose local server for webhook testing
ngrok http 3000

# Use the ngrok URL in Linear webhook settings
```

---

## 🤝 Contributing

### Adding New Commands

1. **Update Command Schema** (`src/command-parser.js`):
   ```javascript
   const CommandSchema = z.object({
     type: z.enum([
       // ... existing types
       'your_new_command'
     ])
   });
   ```

2. **Add Pattern Matching**:
   ```javascript
   this.quickPatterns = [
     // ... existing patterns
     {
       regex: /@goPM\s+your\s+pattern/i,
       type: 'your_new_command'
     }
   ];
   ```

3. **Implement AI Method** (`src/ai-assistant.js`):
   ```javascript
   async yourNewCommand(context) {
     // Your implementation
   }
   ```

4. **Add Route Handler** (`src/webhook-server.js`):
   ```javascript
   case 'your_new_command':
     response = await this.aiAssistant.yourNewCommand(context);
     break;
   ```

---

## 📊 Roadmap

### Phase 1: Foundation ✅
- [x] Basic command parsing and AI integration
- [x] Core PM assistance (test cases, acceptance criteria, requirements)
- [x] Conversational command routing
- [x] Linear webhook integration

### Phase 2: Enhanced Intelligence 🚧
- [ ] Team learning and personalization
- [ ] Integration with project management metrics
- [ ] Multi-language support
- [ ] Template library for common PM artifacts

### Phase 3: Advanced Features 📋
- [ ] Automated project health monitoring
- [ ] Stakeholder communication drafts
- [ ] Cross-team coordination insights
- [ ] Advanced analytics and reporting

---

## 🛠️ Troubleshooting

### Common Issues

**goPM not responding to mentions:**
- Check webhook URL is accessible from internet
- Verify Linear webhook secret matches `.env`
- Check server logs for errors

**AI responses seem generic:**
- Ensure issue has sufficient context in title/description
- Try being more specific in your requests
- Check Anthropic API key has sufficient credits

**Webhook timing out:**
- AI responses can take 10-30 seconds
- Ensure webhook timeout is set to at least 60 seconds in Linear

### Support
- Create issues in this repository
- Check logs at `/logs` directory
- Monitor server health at `/health` endpoint

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Linear Team** for the excellent API and MCP integration
- **Anthropic** for Claude's powerful AI capabilities
- **Product Management Community** for inspiration and best practices

---

**Transform your Linear workflow with AI-powered product management assistance. Get started today!** 🚀