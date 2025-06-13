import { LinearClient as LinearSDK } from '@linear/sdk';

export class LinearClient {
  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY;
    this.client = new LinearSDK({ apiKey: this.apiKey });
    this.activeComments = new Map();
  }

  async addComment(issueId, content) {
    try {
      const result = await this.client.createComment({
        issueId,
        body: content,
      });

      if (result.success && result.comment) {
        return result.comment;
      } else {
        throw new Error('Failed to create comment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add comment to Linear:', error);
      throw error;
    }
  }

  async addWorkingComment(issueId) {
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' EST';
    const content = `🤔 working on it\nLast updated: ${timestamp}`;
    
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

      if (result.success && result.comment) {
        return result.comment;
      } else {
        throw new Error('Failed to update comment: ' + (result.error || 'Unknown error'));
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

    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' EST';
    
    const content = `${fullResponse}\n\nCompleted: ${timestamp}`;
    
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

  async getIssue(issueId) {
    try {
      const issue = await this.client.issue(issueId);
      
      if (!issue) {
        throw new Error(`Issue with ID ${issueId} not found`);
      }

      return issue;
    } catch (error) {
      console.error('Failed to fetch issue from Linear:', error);
      throw error;
    }
  }

  async getIssueWithProject(issueId) {
    try {
      const issue = await this.client.issue(issueId, {
        project: true
      });
      
      if (!issue) {
        throw new Error(`Issue with ID ${issueId} not found`);
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
        console.log('📋 Project Context: No project associated with issue');
        return "No project associated with issue";
      }

      const project = issue.project;
      const projectContext = {
        name: project.name || 'No name',
        description: project.description || 'No description',
        summary: project.description ? project.description.substring(0, 200) + (project.description.length > 200 ? '...' : '') : 'No summary'
      };
      
      console.log('📋 Project Context Retrieved:');
      console.log(`  Name: ${projectContext.name}`);
      console.log(`  Description: ${projectContext.description}`);
      
      return projectContext;
    } catch (error) {
      console.error('Failed to get project context:', error);
      return "No project associated with issue";
    }
  }

  async updateIssue(issueId, updates) {
    try {
      const result = await this.client.issueUpdate(issueId, updates);

      if (result.success && result.issue) {
        return result.issue;
      } else {
        throw new Error('Failed to update issue: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      throw error;
    }
  }

  async searchIssues(query) {
    try {
      const issues = await this.client.issues({
        filter: { 
          title: { contains: query } 
        }
      });

      return issues.nodes;
    } catch (error) {
      console.error('Failed to search issues in Linear:', error);
      throw error;
    }
  }
}