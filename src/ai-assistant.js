import Anthropic from '@anthropic-ai/sdk';

export class AIAssistant {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async handleConversationalRequest(requestText, context) {
    const prompt = `You are tasked with reviewing a user story based on Linear Project context and specific feature requirements. Your goal is to do what is provided in the comment. Ensure the response is clear and actionable for both human engineers and AI agents. Follow these steps to complete the task:

1. Review the Project context which is attached to the linear issue

2. Review the comment to determine what the user is requesting

3. Review the feature requirements which are listed in the body of the issue

4. Provide a response as a product manager and ensure it's concise, direct and to the point. If the user asked for help with test cases, acceptance criteria or writing the user story or issue then use this format:

**Title:** Write a concise, action-oriented title that summarizes the feature.

**User type:** Identify the specific user or persona this story is for.

**Want:** Describe the specific functionality or capability the user desires.

**So that:** Explain the clear business value or outcome of this feature.

**Acceptance Criteria:**
- List 3-5 specific, testable requirements, including edge cases and constraints.

**Test Scenarios:**
- Write 2-3 Gherkin-style scenarios, including a happy path and at least one edge case.

Provide your response using clear markdown formatting with proper headers and bullet points.

**Project Context:**
${typeof context.projectContext === 'string' 
  ? context.projectContext 
  : `- Name: ${context.projectContext?.name || 'N/A'}
- Description: ${context.projectContext?.description || 'N/A'}
- Content: ${context.projectContext?.content || 'N/A'}
- Summary: ${context.projectContext?.summary || 'N/A'}`}

**Issue Context:**
- Title: ${context.issueTitle || 'N/A'}
- Description: ${context.issueDescription || 'N/A'}
- Team: ${context.team || 'N/A'}
- Current State: ${context.state || 'N/A'}

**User Request:**
${requestText}`;

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