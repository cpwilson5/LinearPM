export class CommandParser {
  async parseCommand(text) {
    if (!text || !text.includes('@goPM')) {
      return null;
    }

    // All @goPM mentions are treated as conversational requests
    return {
      type: 'conversational_request',
      originalText: text.trim(),
      confidence: 1.0
    };
  }

  // Utility method to detect if text contains a goPM mention
  static containsMention(text) {
    return text && text.includes('@goPM');
  }
}