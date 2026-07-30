import { auth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('wagh_token');
  const currentUser = auth.currentUser;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(currentUser ? {
      'x-user-uid': currentUser.uid || '',
      'x-user-email': currentUser.email || '',
      'x-user-name': currentUser.displayName || '',
    } : {}),
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
