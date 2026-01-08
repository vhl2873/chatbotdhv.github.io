/**
 * API Client - Gọi API đến FastAPI backend
 */

const APIClient = {
  /**
   * Base URL của API
   */
  baseUrl: 'http://localhost:8000',

  /**
   * Gọi API chat
   */
  async chat(userQuery) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_query: userQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
};

// Export
if (typeof window !== 'undefined') {
  window.APIClient = APIClient;
}
