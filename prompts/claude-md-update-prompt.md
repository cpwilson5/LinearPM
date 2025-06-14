# CLAUDE.md Update Prompt

Update the CLAUDE.md file for goPM with the following comprehensive sections:

## 1. Complete Project Structure
Expand the current structure to include all necessary directories and base files:
```
goPM/
├── .env.example                 # Environment template
├── .gitignore                   # Git exclusions
├── CLAUDE.md                    # This file
├── README.md                    # Public documentation
├── SETUP.md                     # Setup instructions
├── package.json                 # Dependencies and scripts
├── jest.config.js               # Test configuration
├── src/
│   ├── index.js                 # Entry point
│   ├── webhook-server.js        # Core webhook logic
│   ├── command-parser.js        # @goPM detection
│   ├── ai-assistant.js          # Claude integration
│   ├── linear-client.js         # Linear API wrapper
│   └── utils/
│       ├── logger.js            # Structured logging
│       ├── error-handler.js     # Error processing
│       └── validators.js        # Input validation
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test data
├── docs/
│   ├── api.md                   # API documentation
│   ├── deployment.md            # Deployment guide
│   └── architecture.md          # System architecture
├── scripts/
│   ├── setup.sh                 # Initial setup script
│   └── deploy.sh                # Deployment script
└── monitoring/
    ├── health-check.js          # Health monitoring
    └── metrics.js               # Performance metrics
```

## 2. Detailed Feature Development Roadmap
Create a phased development plan:

**Phase 1: Core Optimization (Current)**
- Enhanced error handling and logging
- Performance monitoring and metrics
- Improved webhook security validation
- Unit and integration test coverage

**Phase 2: Advanced AI Features**
- Context-aware learning from team interactions
- Project-specific prompt customization
- Multi-language support for international teams
- Advanced PM methodologies (Agile, SCRUM, Kanban)

**Phase 3: Enhanced Integration**
- Multi-workspace Linear support
- Slack/Discord integration for notifications
- Calendar integration for sprint planning
- Jira migration/sync capabilities

**Phase 4: Analytics & Intelligence**
- Team productivity analytics
- Automated sprint retrospectives
- Risk prediction and mitigation suggestions
- Custom dashboard for PM insights

**Phase 5: Enterprise Features**
- Role-based access control
- Audit logging and compliance
- Custom AI model fine-tuning
- On-premise deployment options

## 3. Documentation Templates
Include templates for:
- **Feature Request Template**: Standard format for new features
- **Bug Report Template**: Issue tracking and resolution
- **API Documentation Template**: Consistent API docs
- **Testing Documentation**: Test case formats
- **Deployment Checklist**: Pre-deployment verification

## 4. Comprehensive Code Standards
Define standards for:
- **Code Style**: ESLint configuration, Prettier settings
- **Naming Conventions**: Functions, variables, files
- **Error Handling**: Consistent error patterns
- **Testing Requirements**: Coverage thresholds, test patterns
- **Git Workflow**: Branch naming, commit messages, PR process
- **Security Practices**: Input validation, secret management
- **Performance Guidelines**: Response time targets, optimization

## 5. Development Workflow Patterns
Document patterns for:
- **Feature Development**: From ideation to deployment
- **Bug Fix Process**: Issue identification to resolution
- **Code Review Guidelines**: Review criteria and process
- **Testing Strategy**: Unit, integration, and E2E testing
- **Deployment Process**: Staging, production, rollback procedures

## 6. Troubleshooting Guide
Expand current troubleshooting with:
- **Common Issues**: Frequent problems and solutions
- **Debugging Tools**: Logging, monitoring, profiling
- **Performance Issues**: Optimization strategies
- **Security Concerns**: Vulnerability detection and mitigation
- **Deployment Failures**: Recovery procedures

## 7. Integration Patterns
Document integration approaches for:
- **Webhook Management**: Securing and scaling webhooks
- **API Rate Limiting**: Handling Linear and Anthropic limits
- **State Management**: Session handling and persistence
- **Error Recovery**: Graceful degradation strategies

Include implementation examples, configuration templates, and best practices for each section. The updated CLAUDE.md should serve as a complete reference that eliminates the need for continuous context management while providing clear guidance for all development activities.

Focus on making each section actionable with specific examples, code snippets, and implementation guidelines rather than abstract concepts.