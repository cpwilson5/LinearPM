import { LinearClient as LinearSDK } from '@linear/sdk';

export class LinearClient {
  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY;
    this.client = new LinearSDK({ apiKey: this.apiKey });
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