import Anthropic from '@anthropic-ai/sdk';

export class AIAssistant {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async parseConversationalCommand(text) {
    const prompt = `You are a command parser for LinearPM, an AI product management assistant.

Your task is to analyze user requests that mention @LinearPM and determine what type of product management assistance they need.

**Available Command Types:**
- improve_test_cases: User wants help improving existing test cases
- improve_acceptance_criteria: User wants help improving acceptance criteria  
- suggest_requirements: User wants help generating requirements
- break_down_epic: User wants to decompose large features into smaller stories
- estimate_effort: User wants effort estimation guidance
- identify_risks: User wants risk analysis for their feature
- create_user_stories: User wants help creating user stories
- analyze_dependencies: User wants dependency analysis
- suggest_mvp_scope: User wants help defining MVP scope
- conversational_request: General product management question or assistance

**User Request:**
"${text}"

**Instructions:**
1. Analyze the user's intent
2. Return ONLY a JSON object with this exact structure:
{
  "type": "command_type_here",
  "originalText": "${text}",
  "intent": "brief description of what the user wants",
  "confidence": 0.8
}

**Examples:**
- "How long will this take?" → estimate_effort
- "What could go wrong with this feature?" → identify_risks  
- "Can you break this down into smaller pieces?" → break_down_epic
- "What should we build first?" → suggest_mvp_scope
- "Help me write better stories for this" → create_user_stories

Return JSON only, no explanation.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.content[0].text.trim();
      
      // Try to parse as JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Conversational command parsing error:', error);
      return null;
    }
  }

  async improveTestCases(currentTestCases, context) {
    const prompt = `You are a senior product manager and QA expert helping to improve test cases for a Linear issue.

**Issue Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}
- Current State: ${context.state || 'N/A'}

**Current Test Cases:**
${currentTestCases || 'No test cases provided'}

**Your Task:**
Analyze the current test cases and provide specific, actionable improvements. Focus on:

1. **Coverage Gaps**: Identify missing test scenarios
2. **Edge Cases**: Suggest boundary conditions and error scenarios  
3. **User Experience**: Add user-focused acceptance tests
4. **Performance**: Include performance and load considerations
5. **Accessibility**: Suggest accessibility testing scenarios
6. **Security**: Add security-related test cases if relevant

**Response Format:**
Provide your response in this exact markdown format:

## 🧪 Test Case Analysis & Recommendations

### ✅ Current Strengths
- [List what's already good about the existing test cases]

### 🎯 Missing Test Scenarios
- [Specific test cases that should be added]
- [Focus on critical user paths and edge cases]

### 🔧 Improvements to Existing Tests
- [Specific suggestions to make current tests more thorough]
- [Ways to make tests more specific and measurable]

### 📊 Additional Considerations
- **Performance**: [Performance testing suggestions]
- **Accessibility**: [A11y testing recommendations]  
- **Security**: [Security testing considerations if applicable]

### 💡 Implementation Priority
1. **High Priority**: [Most critical tests to add first]
2. **Medium Priority**: [Important but secondary tests]
3. **Nice to Have**: [Tests that would be beneficial but not critical]

Keep your suggestions specific, actionable, and tailored to this particular feature.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (test cases):', error);
      return '❌ Sorry, I encountered an error analyzing the test cases. Please try again later.';
    }
  }

  async improveAcceptanceCriteria(currentCriteria, context) {
    const prompt = `You are a senior product manager helping to improve acceptance criteria for a Linear issue.

**Issue Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}
- Current State: ${context.state || 'N/A'}

**Current Acceptance Criteria:**
${currentCriteria || 'No acceptance criteria provided'}

**Your Task:**
Analyze the current acceptance criteria and provide specific improvements. Focus on:

1. **Clarity**: Make criteria clear and unambiguous
2. **Testability**: Ensure criteria can be objectively verified
3. **Completeness**: Identify missing scenarios and edge cases
4. **User Value**: Connect criteria to user outcomes
5. **Technical Feasibility**: Consider implementation constraints
6. **Definition of Done**: Ensure comprehensive completion criteria

**Response Format:**
Provide your response in this exact markdown format:

## ✅ Acceptance Criteria Analysis & Recommendations

### 🎯 Current Criteria Assessment
- [Analysis of existing criteria - what's clear, what's ambiguous]

### 📝 Improved Criteria (GIVEN-WHEN-THEN Format)
**Feature Functionality:**
- **GIVEN** [initial state/context]
- **WHEN** [user action/trigger]  
- **THEN** [expected outcome/behavior]

[Repeat for each major scenario]

### 🔍 Additional Scenarios to Consider
- [Edge cases not covered in current criteria]
- [Error handling scenarios]
- [Integration touchpoints]

### 🚀 Definition of Done Checklist
- [ ] [Functional requirements met]
- [ ] [UI/UX requirements satisfied]
- [ ] [Performance criteria met]
- [ ] [Accessibility standards followed]
- [ ] [Testing completed]
- [ ] [Documentation updated]

### ⚠️ Assumptions & Dependencies
- [Key assumptions that should be validated]
- [Dependencies on other systems/teams]
- [Technical constraints to consider]

### 💡 Success Metrics
- [How to measure if this feature is successful]
- [Key performance indicators to track]

Make your suggestions specific, measurable, and focused on delivering clear user value.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (acceptance criteria):', error);
      return '❌ Sorry, I encountered an error analyzing the acceptance criteria. Please try again later.';
    }
  }

  async suggestRequirements(context) {
    const prompt = `You are a senior product manager helping to define requirements for a Linear issue.

**Issue Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}
- Current State: ${context.state || 'N/A'}

**Your Task:**
Based on the issue context, suggest comprehensive requirements. Consider:

1. **Functional Requirements**: What the system should do
2. **Non-Functional Requirements**: Performance, security, usability
3. **User Stories**: User-focused requirements
4. **Technical Requirements**: Implementation considerations
5. **Business Requirements**: Value and success criteria

**Response Format:**
Provide your response in this exact markdown format:

## 📋 Requirements Analysis & Suggestions

### 👤 User Stories
**As a** [user type]  
**I want** [functionality]  
**So that** [benefit/value]

[Repeat for different user scenarios]

### ⚙️ Functional Requirements
1. **Core Functionality**
   - [Primary features and capabilities]
   - [Key user interactions]

2. **Data Requirements**
   - [Data that needs to be captured/stored]
   - [Data validation rules]

3. **Integration Requirements**
   - [External systems to integrate with]
   - [API requirements]

### 🎯 Non-Functional Requirements
- **Performance**: [Response time, throughput expectations]
- **Scalability**: [User load, data volume considerations]
- **Security**: [Authentication, authorization, data protection]
- **Usability**: [Ease of use, accessibility requirements]
- **Reliability**: [Uptime, error handling expectations]

### 🔧 Technical Considerations
- [Platform/technology constraints]
- [Browser/device compatibility]
- [Third-party dependencies]

### 📊 Success Criteria
- [Quantifiable measures of success]
- [User adoption metrics]
- [Business impact indicators]

### 🚀 Implementation Phases
**Phase 1 (MVP)**: [Minimum viable features]
**Phase 2**: [Enhanced functionality]
**Phase 3**: [Advanced features]

Focus on delivering clear, actionable requirements that can guide development and testing.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (requirements):', error);
      return '❌ Sorry, I encountered an error generating requirements. Please try again later.';
    }
  }

  async breakDownEpic(context) {
    const prompt = `You are a senior product manager helping to break down an epic into manageable user stories.

**Epic Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}

**Your Task:**
Break this epic down into smaller, manageable user stories that can be completed in 1-2 sprints each.

**Response Format:**
## 🧩 Epic Breakdown: ${context.issueTitle}

### 📋 User Stories

**Story 1: [Story Name]**
- **As a** [user type]
- **I want** [functionality] 
- **So that** [benefit]
- **Acceptance Criteria:**
  - [ ] [Specific criteria]
- **Estimated Effort:** [S/M/L]

[Repeat for each story]

### 🎯 Implementation Order
1. **Phase 1 (Foundation):** [Core stories]
2. **Phase 2 (Enhancement):** [Additional features]
3. **Phase 3 (Polish):** [Nice-to-have features]

### 📊 Story Dependencies
- [Story A] → [Story B] (dependency relationship)

### 💡 Implementation Notes
- [Technical considerations]
- [Integration points]
- [Risk mitigation]

Focus on creating stories that deliver incremental value and can be independently developed and tested.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (break down epic):', error);
      return '❌ Sorry, I encountered an error breaking down the epic. Please try again later.';
    }
  }

  async estimateEffort(context) {
    const prompt = `You are a senior product manager providing effort estimation guidance.

**Feature Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}

**Your Task:**
Provide effort estimation guidance and considerations for this feature.

**Response Format:**
## ⏱️ Effort Estimation Analysis

### 🎯 Complexity Assessment
- **Overall Complexity:** [High/Medium/Low]
- **Technical Complexity:** [Analysis]
- **UI/UX Complexity:** [Analysis]
- **Integration Complexity:** [Analysis]

### 📊 Estimation Breakdown
**Frontend Work:**
- [Component/feature]: [time estimate]

**Backend Work:**
- [API/service]: [time estimate]

**Testing & QA:**
- [Testing effort]: [time estimate]

**Total Estimated Range:** [X-Y days/weeks]

### ⚠️ Risk Factors
- [Factor 1]: Could add [X days] if [condition]
- [Factor 2]: [Risk description and impact]

### 📋 Estimation Methodology
- **Story Points:** [If using agile estimation]
- **Similar Features:** [Reference past work]
- **Team Velocity:** [Considerations]

### 💡 Recommendations
- [Suggestion 1]
- [Suggestion 2]
- [Ways to reduce scope or risk]

Remember: Estimates are guidance, not commitments. Build in buffer for unknowns.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (estimate effort):', error);
      return '❌ Sorry, I encountered an error with effort estimation. Please try again later.';
    }
  }

  async identifyRisks(context) {
    const prompt = `You are a senior product manager conducting risk analysis for a feature.

**Feature Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}

**Your Task:**
Identify potential risks and provide mitigation strategies.

**Response Format:**
## ⚠️ Risk Analysis: ${context.issueTitle}

### 🔴 High Risk Items
**[Risk Name]**
- **Probability:** [High/Medium/Low]
- **Impact:** [High/Medium/Low]  
- **Description:** [What could go wrong]
- **Mitigation:** [How to prevent/minimize]
- **Contingency:** [What to do if it happens]

### 🟡 Medium Risk Items
[Same format as above]

### 🟢 Low Risk Items
[Same format as above]

### 📊 Risk Matrix Summary
| Risk | Probability | Impact | Priority |
|------|-------------|--------|----------|
| [Risk 1] | High | High | 🔴 Critical |

### 🛡️ Risk Mitigation Plan
1. **Immediate Actions:** [What to do now]
2. **Ongoing Monitoring:** [What to watch for]
3. **Escalation Triggers:** [When to escalate]

### 💡 Proactive Measures
- [Suggestion 1]
- [Suggestion 2]
- [Early validation approaches]

Focus on risks that could impact timeline, quality, or user experience.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (identify risks):', error);
      return '❌ Sorry, I encountered an error with risk analysis. Please try again later.';
    }
  }

  async createUserStories(context) {
    const prompt = `You are a senior product manager helping to create user stories for a feature.

**Feature Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}

**Your Task:**
Create comprehensive user stories that cover all aspects of this feature.

**Response Format:**
## 👥 User Stories: ${context.issueTitle}

### 🎯 Primary User Stories

**Story 1: [Core Functionality]**
- **As a** [specific user type]
- **I want** [specific functionality]
- **So that** [specific benefit/value]

**Acceptance Criteria:**
- **Given** [context/pre-condition]
- **When** [user action]
- **Then** [expected result]

**Definition of Done:**
- [ ] [Functional requirement]
- [ ] [UI/UX requirement] 
- [ ] [Testing requirement]

### 🔄 Edge Case Stories

**Story X: [Error Handling]**
[Same format for edge cases, error scenarios]

### 👤 User Personas Considered
- **Primary:** [Main user type and their needs]
- **Secondary:** [Other users who might interact]

### 📱 User Journey Map
1. [Step 1 in user flow]
2. [Step 2 in user flow]
3. [Decision points and alternatives]

### ✅ Story Validation
- **Business Value:** [How this delivers value]
- **User Research:** [Validation approach needed]
- **Success Metrics:** [How to measure success]

Focus on creating stories that are independently valuable and testable.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (create user stories):', error);
      return '❌ Sorry, I encountered an error creating user stories. Please try again later.';
    }
  }

  async analyzeDependencies(context) {
    const prompt = `You are a senior product manager analyzing dependencies for a feature.

**Feature Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}

**Your Task:**
Identify all types of dependencies that could impact this feature's development.

**Response Format:**
## 🔗 Dependency Analysis: ${context.issueTitle}

### 🏗️ Technical Dependencies
**Internal Systems:**
- [System/Service]: [How it's needed]
- [API/Database]: [Integration requirements]

**External Services:**
- [Third-party service]: [Dependency type]
- [External API]: [Risk level]

### 👥 Team Dependencies
**Engineering Teams:**
- [Team name]: [What they need to provide]
- [Shared resources]: [Coordination needed]

**Other Teams:**
- **Design:** [Design deliverables needed]
- **QA:** [Testing dependencies]  
- **DevOps:** [Infrastructure needs]

### 📊 Data Dependencies
- [Data source]: [Availability and format]
- [Data migration]: [If needed]
- [Performance requirements]: [Constraints]

### 🎯 Feature Dependencies
**Prerequisite Features:**
- [Feature A]: Must be complete before starting
- [Feature B]: Needed for integration

**Dependent Features:**
- [Feature C]: Waiting on this feature
- [Feature D]: Would be blocked by delays

### ⏰ Timeline Dependencies
**Critical Path Items:**
- [Dependency]: [Impact on timeline]
- [Blocking factors]: [Mitigation approach]

### 🚨 Risk Assessment
- **High Risk:** [Dependencies that could cause major delays]
- **Medium Risk:** [Dependencies with moderate impact]
- **Mitigation Strategies:** [How to reduce dependency risk]

### 💡 Recommendations
1. [Approach to minimize dependencies]
2. [Parallel work opportunities]  
3. [Early validation strategies]

Focus on identifying dependencies early to prevent surprises during development.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (analyze dependencies):', error);
      return '❌ Sorry, I encountered an error analyzing dependencies. Please try again later.';
    }
  }

  async suggestMvpScope(context) {
    const prompt = `You are a senior product manager defining MVP scope for a feature.

**Feature Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}

**Your Task:**
Define a minimum viable product scope that delivers core value with minimal complexity.

**Response Format:**
## 🎯 MVP Scope Definition: ${context.issueTitle}

### 💎 Core Value Proposition
**Primary User Need:** [The main problem we're solving]
**Success Metric:** [How we'll measure success]

### ✅ MVP Features (Must Have)
1. **[Feature 1]**
   - **User Value:** [Why it's essential]
   - **Complexity:** [Low/Medium/High]
   
2. **[Feature 2]**
   - **User Value:** [Why it's essential]
   - **Complexity:** [Low/Medium/High]

### 🔄 Phase 2 Features (Should Have)
- [Feature A]: [Why it's important but not MVP]
- [Feature B]: [Enhancement that can wait]

### 💡 Future Features (Could Have)
- [Feature X]: [Nice to have for later]
- [Feature Y]: [Potential future enhancement]

### 🚫 Explicitly Out of Scope
- [Feature Z]: [Why we're not including this]
- [Complex integrations]: [Can be added later]

### 👤 MVP User Journey
1. [Step 1]: [Minimal happy path]
2. [Step 2]: [Core interaction]
3. [Step 3]: [Value realization]

### 📊 MVP Success Criteria
- **Functional:** [What must work]
- **Performance:** [Minimum acceptable performance]
- **User Experience:** [Core UX requirements]

### ⏱️ MVP Timeline Estimate
- **Development:** [Time estimate]
- **Testing:** [QA requirements]
- **Launch:** [Go-to-market considerations]

### 🎯 MVP Validation Plan
- **User Testing:** [How to validate with users]
- **Metrics:** [What to measure]
- **Learning Goals:** [What we want to learn]

Focus on the smallest possible feature set that delivers real user value and validates core assumptions.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (suggest MVP scope):', error);
      return '❌ Sorry, I encountered an error defining MVP scope. Please try again later.';
    }
  }

  async handleConversationalRequest(requestText, context) {
    const prompt = `You are LinearPM, an AI product management assistant for Linear. A user has mentioned you in a Linear issue with a request.

**Issue Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}
- Current State: ${context.state || 'N/A'}

**User Request:**
${requestText}

**Your Capabilities:**
You're an expert product manager who can help with:
- Requirements gathering and analysis
- User story creation and refinement
- Epic breakdown and prioritization
- Risk assessment and mitigation
- Effort estimation and planning
- Dependency analysis
- MVP scope definition
- Test case and acceptance criteria
- Stakeholder communication
- Process improvements
- Technical feasibility assessment
- User experience considerations

**Response Guidelines:**
1. Understand the user's intent and context
2. Provide specific, actionable product management advice
3. Use markdown formatting for clear structure
4. Reference the issue context when relevant
5. Ask clarifying questions if needed
6. Suggest concrete next steps
7. Consider both technical and business perspectives

**Response Format:**
Use clear headings and bullet points. Be conversational but professional. Focus on practical, implementable advice.

Respond as a senior product manager would - with expertise, empathy, and strategic thinking.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('AI Assistant error (generic):', error);
      return '❌ Sorry, I encountered an error processing your request. Please try again later.';
    }
  }
}