# CLAUDE.md

## Development Context for goPM

This file provides Claude Code with essential context about the goPM codebase architecture, patterns, and development guidelines. It serves as a comprehensive reference for all development activities.

## Project Overview

goPM is a streamlined AI-powered product management assistant that integrates with Linear via webhooks. Users mention `@goPM` in Linear issues/comments to get AI assistance powered by Anthropic's Claude with full project context.

---

## Complete Project Structure

```
goPM/
├── .env.example                 # Environment template
├── .gitignore                   # Git exclusions
├── CLAUDE.md                    # This comprehensive reference file
├── README.md                    # Public documentation
├── SETUP.md                     # Setup instructions
├── package.json                 # Dependencies and scripts
├── jest.config.js               # Test configuration
├── prompts/                     # AI prompt templates
│   └── claude-md-update-prompt.md
├── src/
│   ├── index.js                 # Entry point, starts webhook server
│   ├── webhook-server.js        # Core webhook processing logic  
│   ├── command-parser.js        # Minimal @goPM detection (19 lines)
│   ├── ai-assistant.js          # Claude integration with master prompt
│   ├── linear-client.js         # Linear API wrapper with comment management
│   └── utils/
│       ├── logger.js            # Structured logging utility
│       ├── error-handler.js     # Centralized error processing
│       └── validators.js        # Input validation functions
├── tests/
│   ├── unit/                    # Unit tests for individual functions
│   ├── integration/             # Integration tests for API flows
│   └── fixtures/                # Mock data and test fixtures
├── docs/
│   ├── api.md                   # API documentation
│   ├── deployment.md            # Deployment guide
│   ├── architecture.md          # System architecture
│   └── templates/               # Documentation templates
│       ├── feature-request.md
│       ├── bug-report.md
│       └── deployment-checklist.md
├── scripts/
│   ├── setup.sh                 # Initial setup automation
│   └── deploy.sh                # Deployment automation
└── monitoring/
    ├── health-check.js          # Application health monitoring
    └── metrics.js               # Performance metrics collection
```

---

## Current Status: Production-Ready Linear Agent ✅

**goPM is now a complete Linear agent implementation** that fully complies with Linear's agent specification. The system supports both OAuth agent mode and legacy API key mode, providing comprehensive PM assistance with instant responsiveness and intelligent behaviors.

### **Key Capabilities Now Available:**
- **🤖 Full Linear Agent** - OAuth authentication, assignment handling, proactive behaviors
- **⚡ Instant Responses** - 🤔 acknowledgment within 2 seconds, async AI processing
- **🎯 Smart Context** - Issue type detection, priority analysis, project awareness
- **😀 Interactive** - Emoji reactions, assignment responses, status monitoring
- **🔄 Dual Mode** - Agent (@goPM) + Legacy (@LinearPM) operation

### **Production Deployment Ready:**
- OAuth token persistence across restarts
- Multi-workspace support
- Comprehensive error handling
- Webhook security validation
- Performance monitoring

---

## Feature Development Roadmap

### Phase 1: Core Linear Agent Implementation ✅ COMPLETED
**Focus: Complete Linear Agent Specification**

**Core Linear Agent Features:**
- ✅ **OAuth Agent Authentication** - Full Linear agent with workspace integration
- ✅ **Dual-Mode Operation** - Agent mode (@goPM) + Legacy mode (@LinearPM)
- ✅ **Assignment Handling** - Smart acknowledgment, context-aware responses, tracking
- ✅ **Webhook Event Support** - Comments, Issues, Reactions, Assignments  
- ✅ **Emoji Reaction Handling** - Responds to user feedback and priority indicators
- ✅ **Proactive Behaviors** - Immediate acknowledgment, progress updates, smart completion

**Performance & User Experience:**
- ✅ **Instant Responsiveness** - 🤔 acknowledgment within 2 seconds
- ✅ **Async AI Processing** - Non-blocking workflow with live updates
- ✅ **Progress Indicators** - Real-time status during long AI requests
- ✅ **Context-Aware Completion** - Smart next steps based on request type
- ✅ **Token Persistence** - OAuth tokens survive server restarts

**Technical Infrastructure:**
- ✅ Enhanced error handling and logging with structured output
- ✅ Webhook security validation with signature verification
- ✅ Performance monitoring and metrics collection
- ✅ Multi-workspace OAuth token management

### Phase 2: Advanced AI Features (Q2 2025)
**Focus: Intelligent Context & Enhanced Integrations**

**Context Enhancement:**
- 🚀 **Optimize Prompts**: Dynamic prompt optimization based on request type and context
- 🚀 **Gong Integration**: Utilize Gong queries to provide sales context and customer insights
- 🚀 **Slack Integration**: Pull Slack conversation history for additional project context
- Context-aware learning from team interaction patterns
- Project-specific prompt customization and templates
- Multi-language support for international teams
- Advanced PM methodologies (Agile, SCRUM, Kanban) with methodology-specific guidance

**AI Card Enhancement:**
- 🚀 **Collapsible AI Execution Sections**: Add collapsed sections to Linear cards with detailed AI agent execution instructions
- Smart card templates based on issue type
- Automated acceptance criteria generation
- Risk analysis and mitigation suggestions

**Production Readiness:**
- Real Linear API integration for workflow states (currently mocked)
- Enhanced error handling and retry logic
- Rate limiting and API optimization
- Performance benchmarking and monitoring

### Phase 3: Visual & Integration Enhancement (Q3 2025)
**Focus: Rich Media & External Integrations**

**Visual Capabilities:**
- 🚀 **Visual Generation**: Integration with v0 or Bolt API to create visual mockups and diagrams
- 🚀 **Puppeteer Integration**: Screenshot capture, UI testing, and visual regression testing
- Interactive flowchart generation for process documentation
- Automated architecture diagrams from code analysis

**Enhanced Integrations:**
- Multi-workspace Linear support with workspace-specific configurations
- Calendar integration for sprint planning and milestone tracking
- Jira migration/sync capabilities with data mapping
- GitHub integration for code-aware project management
- Figma integration for design-development alignment

### Phase 4: Analytics & Intelligence (Q4 2025)
**Focus: Data-Driven Insights**

**Analytics Dashboard:**
- Team productivity analytics with burndown charts and velocity tracking
- Automated sprint retrospectives with sentiment analysis
- Risk prediction and mitigation suggestions based on historical data
- Custom dashboard for PM insights with configurable widgets
- Technical debt tracking and prioritization

**Machine Learning:**
- Pattern recognition for common issues and solutions
- Predictive modeling for project timeline estimation
- Automated code review insights for PM context
- Smart notification routing based on urgency and context

### Phase 5: Enterprise & Deployment (Q1 2026)
**Focus: Scale & Security**

**Enterprise Features:**
- Role-based access control with fine-grained permissions
- Audit logging and compliance reporting (SOX, GDPR)
- Custom AI model fine-tuning for organization-specific knowledge
- SSO integration (SAML, OAuth, LDAP)
- Multi-tenant architecture support

**Deployment & Publishing:**
- 🚀 **AWS Publishing**: Full AWS deployment with auto-scaling and monitoring
- Docker containerization with Kubernetes orchestration
- On-premise deployment options with air-gapped support
- Marketplace listings (Linear App Store, Slack App Directory)
- White-label solutions for enterprise customers

---

## Documentation Templates

### Feature Request Template
```markdown
# Feature Request: [Feature Name]

## Problem Statement
Describe the problem this feature solves.

## Proposed Solution
Detail the proposed implementation.

## AI Agent Execution Instructions
<details>
<summary>🤖 AI Agent Instructions (Collapsed)</summary>

### Context Requirements
- Linear project data needed
- Slack conversation history (if applicable)
- Gong call insights (if customer-facing)

### Execution Steps
1. Analyze current codebase structure
2. Identify integration points
3. Generate implementation plan
4. Create visual mockups (v0/Bolt API)
5. Validate with existing patterns

### Success Criteria
- [ ] Feature meets acceptance criteria
- [ ] Tests pass with >90% coverage
- [ ] Performance benchmarks met
- [ ] Security review completed

</details>

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Technical Considerations
Architecture, security, performance implications.
```

### Bug Report Template
```markdown
# Bug Report: [Issue Summary]

## Description
What happened vs. what was expected.

## Reproduction Steps
1. Step 1
2. Step 2
3. Step 3

## Environment
- Linear workspace: [workspace]
- goPM version: [version]
- Timestamp: [timestamp]

## AI Agent Debug Instructions
<details>
<summary>🔍 Debug Execution Plan (Collapsed)</summary>

### Investigation Steps
1. Check webhook logs for timestamp
2. Analyze Linear API response patterns
3. Review Claude API interaction logs
4. Validate environment configuration

### Data Collection
- Webhook payload structure
- Error stack traces
- Performance metrics at time of issue
- Related Slack conversations (if applicable)

</details>
```

### Deployment Checklist
```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed
- [ ] Performance benchmarks validated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Rollback plan documented

## Deployment
- [ ] Blue-green deployment initiated
- [ ] Health checks passing
- [ ] Webhook endpoints responding
- [ ] Linear integration validated
- [ ] Claude API connectivity confirmed

## Post-Deployment
- [ ] Monitoring alerts configured
- [ ] Error tracking active
- [ ] Performance metrics baseline established
- [ ] User acceptance testing completed
```

---

## Comprehensive Code Standards

### Code Style Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-unused-vars': 'error'
  }
};

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Naming Conventions
```javascript
// Functions: camelCase with descriptive verbs
async function handleLinearWebhook(payload) { }
async function processGongInsights(callId) { }

// Variables: camelCase with context
const linearClient = new LinearClient();
const slackConversationHistory = await fetchSlackHistory();

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const WEBHOOK_TIMEOUT_MS = 60000;

// Files: kebab-case
// linear-client.js, ai-assistant.js, gong-integration.js
```

### Error Handling Patterns
```javascript
// Standardized error handling with context
async function processLinearEvent(eventData) {
  try {
    const result = await handleLinearWebhook(eventData);
    return result;
  } catch (error) {
    const errorContext = {
      function: 'processLinearEvent',
      eventType: eventData.type,
      issueId: eventData.data?.issue?.id,
      timestamp: new Date().toISOString()
    };
    
    logger.error('Linear event processing failed', { error, context: errorContext });
    await this.handleProcessingError(eventData.data?.issue?.id, error);
    throw new ProcessingError('Failed to process Linear event', { cause: error });
  }
}
```

### Testing Requirements
```javascript
// Unit test example with comprehensive coverage
describe('LinearClient', () => {
  test('should resolve project context correctly', async () => {
    const mockIssue = { id: '123', project: Promise.resolve({ name: 'Test Project' }) };
    const result = await linearClient.resolveIssueWithProject(mockIssue);
    
    expect(result.project.name).toBe('Test Project');
    expect(result.id).toBe('123');
  });
  
  test('should handle missing project gracefully', async () => {
    const mockIssue = { id: '123', project: null };
    const result = await linearClient.resolveIssueWithProject(mockIssue);
    
    expect(result.project).toBeNull();
  });
});

// Integration test for full workflow
describe('E2E Webhook Processing', () => {
  test('should process @goPM mention with Slack context', async () => {
    const webhookPayload = createMockWebhookPayload();
    const response = await request(app)
      .post('/webhook')
      .send(webhookPayload)
      .expect(200);
    
    expect(response.body.processed).toBe(true);
    // Verify comment was updated in Linear
    // Verify Slack context was included
  });
});
```

### Git Workflow Standards
```bash
# Branch naming convention
feature/convert-to-linear-agent
fix/webhook-timeout-handling
refactor/optimize-ai-prompts
docs/update-api-documentation

# Commit message format
feat: add Gong integration for customer context
fix: resolve webhook timeout in large projects  
refactor: optimize Claude prompt for better context
docs: add deployment guide for AWS publishing
test: add integration tests for Slack context

# PR requirements
- All tests passing
- Code coverage >90%
- Security scan clean
- Performance benchmarks met
- Documentation updated
```

---

## Development Workflow Patterns

### Feature Development Lifecycle
```javascript
// 1. Feature Planning Phase
async function planFeature(featureRequest) {
  // Analyze existing codebase
  const codebaseAnalysis = await analyzeCodebase(featureRequest.area);
  
  // Generate implementation plan
  const plan = await generateImplementationPlan(featureRequest, codebaseAnalysis);
  
  // Create visual mockups if UI changes
  if (featureRequest.hasUI) {
    const mockups = await generateVisualMockups(featureRequest);
    plan.mockups = mockups;
  }
  
  return plan;
}

// 2. Implementation with Context
async function implementFeature(plan) {
  // Pull relevant context
  const context = await gatherFeatureContext(plan);
  
  // Implement with TDD
  await writeTests(plan.testCases);
  await implementCode(plan.implementation);
  await validateImplementation(plan.successCriteria);
  
  return { implemented: true, context };
}
```

### Bug Fix Process
```javascript
// Systematic bug investigation and resolution
async function investigateBug(bugReport) {
  const investigation = {
    webhookLogs: await analyzeWebhookLogs(bugReport.timestamp),
    linearApiLogs: await getLinearApiLogs(bugReport.issueId),
    claudeApiLogs: await getClaudeApiLogs(bugReport.timestamp),
    slackContext: await getSlackContext(bugReport.issueId),
    gongInsights: await getGongInsights(bugReport.customerInfo)
  };
  
  const rootCause = await identifyRootCause(investigation);
  const fix = await generateFix(rootCause);
  
  return { investigation, rootCause, fix };
}
```

### Code Review Guidelines
```javascript
// Automated code review checklist
const codeReviewChecklist = {
  security: [
    'No hardcoded secrets or API keys',
    'Input validation implemented',
    'Authentication/authorization checks',
    'SQL injection prevention'
  ],
  performance: [
    'Database queries optimized',
    'Caching strategy implemented',
    'Memory leaks prevented',
    'API rate limiting respected'
  ],
  maintainability: [
    'Code follows established patterns',
    'Functions are single-purpose',
    'Error handling is comprehensive',
    'Documentation is up-to-date'
  ]
};
```

---

## Integration Patterns

### Webhook Management
```javascript
// Enhanced webhook security with signature verification
class WebhookSecurityManager {
  constructor(secret) {
    this.secret = secret;
  }
  
  verifySignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
  
  async processWithRetry(processor, payload, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await processor(payload);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }
  }
}
```

### Gong Integration Pattern
```javascript
// Gong API integration for customer insights
class GongIntegrationManager {
  constructor(apiKey) {
    this.client = new GongClient(apiKey);
  }
  
  async getCustomerInsights(customerInfo) {
    try {
      const calls = await this.client.searchCalls({
        customerEmail: customerInfo.email,
        dateRange: { last: '30d' }
      });
      
      const insights = await this.analyzeCalls(calls);
      return {
        recentPainPoints: insights.painPoints,
        featureRequests: insights.requests,
        satisfactionTrend: insights.satisfaction
      };
    } catch (error) {
      logger.warn('Gong insights unavailable', { error, customerInfo });
      return null;
    }
  }
}
```

### Slack Context Integration
```javascript
// Slack integration for conversation context
class SlackContextManager {
  constructor(botToken) {
    this.client = new WebClient(botToken);
  }
  
  async fetchConversationContext(channelId, threadId) {
    try {
      const thread = await this.client.conversations.replies({
        channel: channelId,
        ts: threadId,
        limit: 50
      });
      
      return {
        participants: this.extractParticipants(thread.messages),
        keyDecisions: this.identifyDecisions(thread.messages),
        actionItems: this.extractActionItems(thread.messages),
        technicalDiscussion: this.identifyTechnicalContent(thread.messages)
      };
    } catch (error) {
      logger.warn('Slack context unavailable', { error, channelId, threadId });
      return null;
    }
  }
}
```

### Visual Generation Integration
```javascript
// v0/Bolt API integration for visual mockups
class VisualGenerationManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  
  async generateMockup(description, context) {
    try {
      const prompt = this.buildVisualPrompt(description, context);
      const response = await fetch('https://api.v0.dev/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, format: 'react' })
      });
      
      const mockup = await response.json();
      return {
        component: mockup.code,
        preview: mockup.preview_url,
        editable_url: mockup.edit_url
      };
    } catch (error) {
      logger.error('Visual generation failed', { error, description });
      return null;
    }
  }
}
```

---

## AI Integration & Prompt Optimization

### Master Prompt System
```javascript
// Dynamic prompt optimization based on context
class PromptOptimizer {
  constructor() {
    this.templates = {
      epic_breakdown: this.loadTemplate('epic-breakdown'),
      risk_analysis: this.loadTemplate('risk-analysis'),
      acceptance_criteria: this.loadTemplate('acceptance-criteria'),
      effort_estimation: this.loadTemplate('effort-estimation')
    };
  }
  
  async optimizePrompt(requestText, context) {
    const requestType = await this.classifyRequest(requestText);
    const baseTemplate = this.templates[requestType] || this.templates.generic;
    
    // Enrich with available context
    const enrichedContext = await this.enrichContext(context);
    
    return this.buildOptimizedPrompt(baseTemplate, enrichedContext);
  }
  
  async enrichContext(baseContext) {
    const enriched = { ...baseContext };
    
    // Add Gong insights if customer-related
    if (baseContext.customerInfo) {
      enriched.gongInsights = await this.gongManager.getCustomerInsights(baseContext.customerInfo);
    }
    
    // Add Slack context if channel mentioned
    if (baseContext.slackChannelId) {
      enriched.slackContext = await this.slackManager.fetchConversationContext(
        baseContext.slackChannelId,
        baseContext.threadId
      );
    }
    
    return enriched;
  }
}
```

### Linear Agent Conversion
```javascript
// Convert from webhook to full Linear bot agent
class LinearAgentManager {
  constructor(linearClient, aiAssistant) {
    this.linear = linearClient;
    this.ai = aiAssistant;
    this.activeAgents = new Map();
  }
  
  async initializeAgent(workspaceId) {
    const agent = {
      id: `agent-${workspaceId}`,
      workspace: workspaceId,
      capabilities: [
        'issue_analysis',
        'epic_breakdown',
        'risk_assessment',
        'effort_estimation',
        'acceptance_criteria_generation'
      ],
      integrations: {
        gong: this.gongManager,
        slack: this.slackManager,
        visual: this.visualManager
      }
    };
    
    this.activeAgents.set(workspaceId, agent);
    await this.registerAgentWithLinear(agent);
    
    return agent;
  }
  
  async processAgentRequest(agentId, request) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    
    // Add collapsed AI execution section to Linear card
    const executionPlan = await this.generateExecutionPlan(request);
    await this.addCollapsedSection(request.issueId, executionPlan);
    
    // Process with full context
    const result = await this.ai.processWithFullContext(request, agent.integrations);
    
    return result;
  }
}
```

---

## Monitoring & Performance

### Health Check System
```javascript
// monitoring/health-check.js
class HealthCheckManager {
  constructor() {
    this.checks = [
      { name: 'linear_api', check: this.checkLinearAPI },
      { name: 'claude_api', check: this.checkClaudeAPI },
      { name: 'webhook_endpoint', check: this.checkWebhookEndpoint },
      { name: 'gong_integration', check: this.checkGongIntegration },
      { name: 'slack_integration', check: this.checkSlackIntegration }
    ];
  }
  
  async runHealthChecks() {
    const results = await Promise.allSettled(
      this.checks.map(async ({ name, check }) => ({
        name,
        status: await check(),
        timestamp: new Date().toISOString()
      }))
    );
    
    return {
      overall: results.every(r => r.value?.status === 'healthy') ? 'healthy' : 'degraded',
      checks: results.map(r => r.value),
      version: process.env.npm_package_version
    };
  }
}
```

### Performance Metrics
```javascript
// monitoring/metrics.js  
class MetricsCollector {
  constructor() {
    this.metrics = {
      webhook_processing_time: [],
      ai_response_time: [],
      linear_api_latency: [],
      memory_usage: [],
      error_rate: []
    };
  }
  
  recordWebhookProcessing(startTime, endTime, success) {
    const duration = endTime - startTime;
    this.metrics.webhook_processing_time.push({
      duration,
      success,
      timestamp: new Date().toISOString()
    });
    
    // Alert if processing time exceeds threshold
    if (duration > 30000) { // 30 seconds
      this.alertSlowProcessing(duration);
    }
  }
}
```

---

## Deployment & AWS Publishing

### AWS Infrastructure
```yaml
# aws-infrastructure.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'goPM AWS Infrastructure'

Resources:
  goPMECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: gopm-cluster
      
  goPMTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: gopm-task
      Cpu: 512
      Memory: 1024
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ContainerDefinitions:
        - Name: gopm-container
          Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/gopm:latest
          PortMappings:
            - ContainerPort: 3000
          Environment:
            - Name: NODE_ENV
              Value: production
          Secrets:
            - Name: LINEAR_API_KEY
              ValueFrom: !Ref LinearAPIKeySecret
            - Name: ANTHROPIC_API_KEY  
              ValueFrom: !Ref AnthropicAPIKeySecret

  goPMService:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref goPMECSCluster
      TaskDefinition: !Ref goPMTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref goPMSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
```

### Deployment Scripts
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting goPM deployment to AWS..."

# Build and push Docker image
docker build -t gopm:latest .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY
docker tag gopm:latest $ECR_REPOSITORY:latest
docker push $ECR_REPOSITORY:latest

# Update ECS service
aws ecs update-service --cluster gopm-cluster --service gopm-service --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable --cluster gopm-cluster --services gopm-service

echo "✅ Deployment completed successfully"

# Run health checks
curl -f https://gopm.example.com/health || exit 1

echo "🎉 goPM is live and healthy!"
```

---

## Security & Compliance

### Security Configuration
```javascript
// Enhanced webhook signature verification
class SecurityManager {
  static validateWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  }
  
  static sanitizeInput(input) {
    // Remove potential XSS and injection attacks
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
}
```

---

## Testing Strategy

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ]
};
```

---

## Troubleshooting Guide

### Common Issues & Solutions

**Issue: Webhook not receiving events**
```bash
# Debug steps
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Linear-Signature: sha256=test" \
  -d '{"type":"Comment","action":"create","data":{"body":"@goPM test"}}'

# Check logs
docker logs gopm-container --tail 50

# Verify webhook URL in Linear settings
```

**Issue: AI responses are slow or generic**
```javascript
// Check context enrichment
const debugContext = await this.buildDebugContext(issueId);
console.log('Context quality score:', this.scoreContext(debugContext));

// Optimize prompts
const optimizedPrompt = await this.promptOptimizer.optimize(request, context);
```

**Issue: Integration failures (Gong/Slack)**
```javascript
// Graceful degradation pattern
async function getEnrichedContext(baseContext) {
  const enriched = { ...baseContext };
  
  try {
    enriched.gongInsights = await this.gongManager.getInsights(baseContext);
  } catch (error) {
    logger.warn('Gong integration unavailable', { error });
    enriched.gongInsights = null;
  }
  
  try {
    enriched.slackContext = await this.slackManager.getContext(baseContext);
  } catch (error) {
    logger.warn('Slack integration unavailable', { error });
    enriched.slackContext = null;
  }
  
  return enriched;
}
```

---

## Key Architecture Decisions

### Production Linear Agent Architecture
The codebase implements a complete Linear agent following Linear's official specification:
- **Dual-mode operation**: OAuth agent mode (@goPM) + legacy webhook mode (@LinearPM)
- **Event-driven architecture**: Comprehensive webhook routing for all Linear event types
- **Async processing**: Immediate acknowledgment with background AI processing
- **Smart state management**: OAuth token persistence, assignment tracking, progress monitoring

### Core Patterns

#### Instant Response Pattern
```javascript
// 1. Immediate acknowledgment (< 2 seconds)
const immediateResponse = `🤔`;
const workingComment = await this.agentClient.createComment(issueId, immediateResponse, workspaceId);

// 2. Async AI processing with live updates
this.processAgentCommandAsync(issueId, originalText, context, workspaceId, workingCommentId);

// 3. Progress updates for long requests
const progressMessage = `🧠 Still thinking...\n\n_Processing for ${elapsed}s..._`;
await this.agentClient.updateWorkingComment(issueId, workingCommentId, progressMessage, workspaceId);

// 4. Smart completion with next steps
const completionMessage = `${response}\n\n🎯 **Next Steps**: ${nextSteps}\n\n🤖 _Completed: ${timestamp}_`;
```

#### Assignment Handling Pattern
```javascript
// 1. Detect assignment to agent
if (issue.assignee && issue.assignee.id === agentUserId) {
  // 2. Track assignment with metadata
  this.agentAssignments.set(issue.id, { workspaceId, assignedAt, issueType, priority });
  
  // 3. Context-aware acknowledgment
  const acknowledgeMessage = await this.createAssignmentAcknowledgment(issue, projectContext);
  await this.agentClient.createComment(issue.id, acknowledgeMessage, workspaceId);
}
```

#### Context Building Pattern
Always include project context in AI requests:
```javascript
const context = {
  issueTitle: issue.title,
  issueDescription: issue.description, 
  comments: issue.comments?.nodes || [],
  team: issue.team?.name,
  state: issue.state?.name,
  projectContext: projectContext, // Key: includes project name, description, content
  gongInsights: await this.gongManager.getInsights(issue), // New
  slackContext: await this.slackManager.getContext(issue), // New
  visualMockups: await this.visualManager.generate(issue) // New
};
```

#### Logging Pattern
Structured console output with emojis:
```javascript
console.log(`💬 Received Comment ${commentSnippet}`);
console.log(`📋 For Issue ${issueId} ${issue.title} ${issueSnippet}`);
console.log(`🏗️ Related to Project ${projectName} ${projectSnippet}`);
console.log(`🎯 Gong Insights: ${gongInsights?.painPoints?.length || 0} pain points identified`);
console.log(`💬 Slack Context: ${slackContext?.keyDecisions?.length || 0} decisions captured`);
```

---

## Environment Configuration

### Required Environment Variables
```bash
# Core APIs
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx  
LINEAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# New Integrations
GONG_API_KEY=gong_xxxxxxxxxxxxxxxx
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxxxxx
V0_API_KEY=v0_xxxxxxxxxxxxxxxx

# Optional Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
WEBHOOK_TIMEOUT_MS=60000
MAX_RETRY_ATTEMPTS=3

# AWS Configuration (for deployment)
AWS_REGION=us-east-1
ECR_REPOSITORY=123456789.dkr.ecr.us-east-1.amazonaws.com/gopm
```

---

This comprehensive CLAUDE.md serves as your complete project reference, eliminating the need for continuous context management while providing detailed guidance for all aspects of goPM development, from basic patterns to advanced integrations and AWS deployment.