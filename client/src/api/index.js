const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('wagh_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (err) {
    console.warn(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}
