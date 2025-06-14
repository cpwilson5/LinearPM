import { LinearClient as LinearSDK } from '@linear/sdk';

export class LinearClient {
  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY;
    this.client = new LinearSDK({ apiKey: this.apiKey });
    this.activeComments = new Map();
    
    // Reusable timestamp formatter
    this.timestampFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getTimestamp() {
    return this.timestampFormatter.format(new Date()) + ' EST';
  }


  async addComment(issueId, content) {
    try {
      const result = await this.client.createComment({
        issueId,
        body: content,
      });

      // Linear SDK returns result with _comment property containing the actual comment
      if (result && result.success && result._comment && result._comment.id) {
        return result._comment;
      } else {
        console.error('Unexpected comment creation result:', result);
        throw new Error('Failed to create comment: Invalid response format');
      }
    } catch (error) {
      console.error('Failed to add comment to Linear:', error);
      throw error;
    }
  }

  async addWorkingComment(issueId) {
    const content = `🤔 working on it\nLast updated: ${this.getTimestamp()}`;
    
    try {
      const comment = await this.addComment(issueId, content);
      this.activeComments.set(issueId, comment.id);
      return comment;
    } catch (error) {
      console.error('Failed to add working comment:', error);
      throw error;
    }
  }

  async updateComment(commentId, content) {
    try {
      const result = await this.client.updateComment(commentId, {
        body: content
      });

      // Linear SDK returns result with _comment property containing the actual comment
      if (result && result.success && result._comment && result._comment.id) {
        return result._comment;
      } else {
        console.error('Unexpected comment update result:', result);
        throw new Error('Failed to update comment: Invalid response format');
      }
    } catch (error) {
      console.error('Failed to update comment in Linear:', error);
      throw error;
    }
  }

  async updateWorkingCommentWithResult(issueId, fullResponse) {
    const commentId = this.activeComments.get(issueId);
    if (!commentId) {
      console.warn(`No active comment found for issue ${issueId}`);
      return null;
    }

    const content = `${fullResponse}\n\nCompleted: ${this.getTimestamp()}`;
    
    try {
      const updatedComment = await this.updateComment(commentId, content);
      this.activeComments.delete(issueId);
      return updatedComment;
    } catch (error) {
      console.error('Failed to update working comment:', error);
      this.activeComments.delete(issueId);
      throw error;
    }
  }


  async getIssueWithProject(issueId) {
    try {
      const issue = await this.client.issue(issueId);
      
      if (!issue) {
        throw new Error(`Issue with ID ${issueId} not found`);
      }

      // Await the project promise if it exists and store it
      if (issue.project) {
        const resolvedProject = await issue.project;
        
        // Create a new object with the resolved project
        return {
          ...issue,
          project: resolvedProject
        };
      }

      return issue;
    } catch (error) {
      console.error('Failed to fetch issue with project from Linear:', error);
      throw error;
    }
  }

  async getProjectContext(issue) {
    try {
      if (!issue.project) {
        console.log('No project associated with issue');
        return "No project associated with issue";
      }

      const project = issue.project;
      
      const projectContext = {
        name: project.name || 'No name',
        description: project.description || 'No description',
        content: project.content || 'No content',
        summary: project.description ? project.description.substring(0, 200) + (project.description.length > 200 ? '...' : '') : 'No summary'
      };
      
      // Use content if description is empty/generic, otherwise use description
      const mainText = (projectContext.description === 'No description' && projectContext.content !== 'No content') 
        ? projectContext.content 
        : projectContext.description;
      
      // Remove the separate project logging since it's now handled in webhook-server
      
      return projectContext;
    } catch (error) {
      console.error('Failed to get project context:', error);
      return "No project associated with issue";
    }
  }


  async handleProcessingError(issueId) {
    const commentId = this.activeComments.get(issueId);
    const timestamp = this.getTimestamp();
    
    const errorBody = `❌ Sorry, I encountered an error processing your request. Please try again.\n\nError time: ${timestamp}`;
    
    try {
      if (commentId) {
        await this.updateComment(commentId, errorBody);
        this.activeComments.delete(issueId);
      } else {
        await this.addComment(issueId, errorBody);
      }
    } catch (error) {
      console.error(`Failed to create error comment for issue ${issueId}:`, error);
    }
  }
}