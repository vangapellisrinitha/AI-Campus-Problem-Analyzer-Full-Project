// Base API URL pointing to the Express backend
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Checks the health status of the backend API
 * @returns {Promise<Object>} Status response from server
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || `HTTP ${response.status} (${response.statusText})` };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Server returned status: ${response.status}`
      };
    }
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unable to connect to backend server'
    };
  }
};

/**
 * Submits a new campus problem report to the backend
 * @param {Object} problemData - Problem details submitted by the student
 * @returns {Promise<Object>} Response object containing success flag, data, or error messages
 */
export const submitProblem = async (problemData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(problemData)
    });

    // Safely parse JSON or text response to avoid syntax errors on non-JSON HTTP responses
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      data = {
        message: textResponse || `Server returned HTTP ${response.status} (${response.statusText})`
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
        errors: Array.isArray(data.errors) && data.errors.length > 0
          ? data.errors
          : [data.message || `Server error: HTTP ${response.status}`]
      };
    }

    return {
      success: true,
      message: data.message || 'Problem submitted successfully',
      data: data.data
    };
  } catch (error) {
    // True network-level failures (e.g., connection refused, DNS error, CORS blocked)
    return {
      success: false,
      message: error.message || 'Network error: Failed to communicate with backend server',
      errors: [
        `Connection failed: ${error.message || 'Network request failed'}. Please verify that the backend is running on ${API_BASE_URL}.`
      ]
    };
  }
};

/**
 * Retrieves all stored campus complaints from the backend
 * @returns {Promise<Object>} Response containing count and array of complaints
 */
export const getProblems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems`);
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      data = { message: textResponse || `Server returned HTTP ${response.status}` };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Failed to fetch complaints (HTTP ${response.status})`,
        data: []
      };
    }

    return {
      success: true,
      count: data.count || (data.data ? data.data.length : 0),
      data: data.data || []
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error: Failed to fetch complaints',
      data: []
    };
  }
};
