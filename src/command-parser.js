import { z } from 'zod';

const CommandSchema = z.object({
  type: z.enum([
    'improve_test_cases',
    'improve_acceptance_criteria', 
    'suggest_requirements',
    'break_down_epic',
    'estimate_effort',
    'identify_risks',
    'create_user_stories',
    'analyze_dependencies',
    'suggest_mvp_scope',
    'conversational_request'
  ]),
  originalText: z.string(),
  currentContent: z.string().optional(),
  intent: z.string().optional(),
  confidence: z.number().optional(),
});

export class CommandParser {
  constructor() {
    // Keep basic patterns for backwards compatibility
    this.quickPatterns = [
      {
        regex: /@LinearPM\s+(?:help\s+me\s+)?improve\s+(?:the\s+)?test\s+cases/i,
        type: 'improve_test_cases'
      },
      {
        regex: /@LinearPM\s+(?:help\s+me\s+)?improve\s+(?:the\s+)?acceptance\s+criteria/i,
        type: 'improve_acceptance_criteria'
      },
      {
        regex: /@LinearPM\s+(?:help\s+with\s+|suggest\s+)?requirements/i,
        type: 'suggest_requirements'
      },
      {
        regex: /@LinearPM\s+(?:break\s+down|decompose)\s+(?:this\s+)?epic/i,
        type: 'break_down_epic'
      },
      {
        regex: /@LinearPM\s+(?:estimate|how\s+long|effort)/i,
        type: 'estimate_effort'
      },
      {
        regex: /@LinearPM\s+(?:identify\s+|what\s+are\s+the\s+|find\s+)?risks/i,
        type: 'identify_risks'
      },
      {
        regex: /@LinearPM\s+(?:create\s+|write\s+|suggest\s+)?user\s+stories/i,
        type: 'create_user_stories'
      },
      {
        regex: /@LinearPM\s+(?:analyze\s+|identify\s+|find\s+)?dependencies/i,
        type: 'analyze_dependencies'
      },
      {
        regex: /@LinearPM\s+(?:suggest\s+|define\s+|what\s+should\s+be\s+)?mvp/i,
        type: 'suggest_mvp_scope'
      }
    ];
  }

  async parseCommand(text, aiAssistant = null) {
    if (!text || !text.includes('@LinearPM')) {
      return null;
    }

    // First try quick pattern matching for performance
    for (const pattern of this.quickPatterns) {
      if (pattern.regex.test(text)) {
        const command = {
          type: pattern.type,
          originalText: text.trim(),
          currentContent: this.extractCurrentContent(text, pattern.type),
          confidence: 0.9
        };

        try {
          return CommandSchema.parse(command);
        } catch (error) {
          console.warn('Command validation failed:', error);
          continue;
        }
      }
    }

    // If no pattern matches and we have AI assistant, use conversational parsing
    if (aiAssistant) {
      try {
        const aiParsedCommand = await aiAssistant.parseConversationalCommand(text);
        if (aiParsedCommand) {
          return CommandSchema.parse(aiParsedCommand);
        }
      } catch (error) {
        console.warn('AI command parsing failed:', error);
      }
    }

    // Fallback to conversational request
    if (text.includes('@LinearPM')) {
      return {
        type: 'conversational_request',
        originalText: text.trim(),
        currentContent: this.extractCurrentContent(text, 'conversational_request'),
        confidence: 0.7
      };
    }

    return null;
  }

  extractCurrentContent(text, commandType) {
    // Extract existing content that the user wants improved
    // This is a simple implementation - could be enhanced with better parsing
    
    const lines = text.split('\n');
    let contentStartIndex = -1;
    
    // Find the line with @LinearPM command
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('@LinearPM')) {
        contentStartIndex = i + 1;
        break;
      }
    }
    
    if (contentStartIndex === -1 || contentStartIndex >= lines.length) {
      return '';
    }
    
    // Look for content blocks based on command type
    const remainingLines = lines.slice(contentStartIndex);
    
    if (commandType === 'improve_test_cases') {
      return this.extractSection(remainingLines, [
        'test cases',
        'tests',
        'testing',
        '## test',
        '### test'
      ]);
    }
    
    if (commandType === 'improve_acceptance_criteria') {
      return this.extractSection(remainingLines, [
        'acceptance criteria',
        'acceptance',
        'criteria',
        '## acceptance',
        '### acceptance',
        'definition of done',
        'dod'
      ]);
    }
    
    // For other commands, return remaining text
    return remainingLines.join('\n').trim();
  }

  extractSection(lines, keywords) {
    let sectionStart = -1;
    let sectionEnd = lines.length;
    
    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(keyword => line.includes(keyword))) {
        sectionStart = i;
        break;
      }
    }
    
    if (sectionStart === -1) {
      return lines.join('\n').trim();
    }
    
    // Find section end (next major heading or end of text)
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('##') || line.startsWith('###') || line.startsWith('#')) {
        sectionEnd = i;
        break;
      }
    }
    
    return lines.slice(sectionStart, sectionEnd).join('\n').trim();
  }

  // Utility method to detect if text contains a LinearPM mention
  static containsMention(text) {
    return text && text.includes('@LinearPM');
  }

  // Get all available command types
  getAvailableCommands() {
    return [
      {
        category: 'Quality Improvement',
        commands: [
          {
            command: '@LinearPM improve test cases',
            description: 'Analyze and suggest improvements for existing test cases'
          },
          {
            command: '@LinearPM improve acceptance criteria',
            description: 'Analyze and suggest improvements for acceptance criteria'
          }
        ]
      },
      {
        category: 'Planning & Requirements',
        commands: [
          {
            command: '@LinearPM suggest requirements',
            description: 'Generate comprehensive requirements based on issue context'
          },
          {
            command: '@LinearPM break down this epic',
            description: 'Decompose large features into manageable user stories'
          },
          {
            command: '@LinearPM create user stories',
            description: 'Generate user stories based on feature description'
          },
          {
            command: '@LinearPM suggest MVP scope',
            description: 'Define minimum viable product features'
          }
        ]
      },
      {
        category: 'Risk & Analysis',
        commands: [
          {
            command: '@LinearPM identify risks',
            description: 'Analyze potential risks and blockers for this feature'
          },
          {
            command: '@LinearPM analyze dependencies',
            description: 'Identify dependencies between features and teams'
          },
          {
            command: '@LinearPM estimate effort',
            description: 'Provide effort estimation guidance and considerations'
          }
        ]
      },
      {
        category: 'Conversational',
        commands: [
          {
            command: '@LinearPM [your question here]',
            description: 'Ask any product management question in natural language'
          }
        ]
      }
    ];
  }
}