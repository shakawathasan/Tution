/**
 * API Client for ShikhoTuition BD
 */

let currentAuthToken = localStorage.getItem('tuition_auth_token') || 'demo-token-user-admin';

export function setAuthToken(token) {
  currentAuthToken = token;
  localStorage.setItem('tuition_auth_token', token);
}

export function getAuthToken() {
  return currentAuthToken;
}

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...options.headers,
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response;
}
