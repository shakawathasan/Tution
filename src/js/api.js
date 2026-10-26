// Robust API wrapper snippet to prevent infinite loaders
export async function safeApiCall(endpoint, fallbackData = []) {
  try {
    const response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout to prevent hanging loaders
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`API call to ${endpoint} failed, utilizing local state/fallback:`, error);
    // Check localStorage cache or fallback
    const cached = localStorage.getItem(`shikho_${endpoint}`);
    if (cached) return JSON.parse(cached);
    return fallbackData;
  }
}

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
