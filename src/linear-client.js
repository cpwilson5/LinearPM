import axios from 'axios';

export class LinearClient {
  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY;
    this.baseURL = 'https://api.linear.app/graphql';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async addComment(issueId, content) {
    const mutation = `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: {
          issueId: $issueId
          body: $body
        }) {
          success
          comment {
            id
            body
            createdAt
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query: mutation,
        variables: {
          issueId,
          body: content,
        },
      });

      if (response.data.errors) {
        throw new Error(`Linear API error: ${response.data.errors[0].message}`);
      }

      return response.data.data.commentCreate.comment;
    } catch (error) {
      console.error('Failed to add comment to Linear:', error);
      throw error;
    }
  }

  async getIssue(issueId) {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
          description
          state {
            name
            type
          }
          team {
            name
            key
          }
          assignee {
            name
            email
          }
          comments {
            nodes {
              id
              body
              createdAt
              user {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query,
        variables: { id: issueId },
      });

      if (response.data.errors) {
        throw new Error(`Linear API error: ${response.data.errors[0].message}`);
      }

      return response.data.data.issue;
    } catch (error) {
      console.error('Failed to fetch issue from Linear:', error);
      throw error;
    }
  }

  async updateIssue(issueId, updates) {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            title
            description
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query: mutation,
        variables: {
          id: issueId,
          input: updates,
        },
      });

      if (response.data.errors) {
        throw new Error(`Linear API error: ${response.data.errors[0].message}`);
      }

      return response.data.data.issueUpdate.issue;
    } catch (error) {
      console.error('Failed to update issue in Linear:', error);
      throw error;
    }
  }

  async searchIssues(query) {
    const searchQuery = `
      query SearchIssues($query: String!) {
        issues(filter: { title: { contains: $query } }) {
          nodes {
            id
            title
            description
            state {
              name
            }
            team {
              name
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query: searchQuery,
        variables: { query },
      });

      if (response.data.errors) {
        throw new Error(`Linear API error: ${response.data.errors[0].message}`);
      }

      return response.data.data.issues.nodes;
    } catch (error) {
      console.error('Failed to search issues in Linear:', error);
      throw error;
    }
  }
}