const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL.replace(/\/$/, '')}/api/v1`;

// Customer API fetch helper — completely isolated from admin session/headers
export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('wagh_token');
  const clerkUid = localStorage.getItem('wagh_clerk_uid');
  const clerkEmail = localStorage.getItem('wagh_clerk_email');
  const clerkName = localStorage.getItem('wagh_clerk_name');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(clerkUid ? { 'x-user-uid': clerkUid, 'x-clerk-user-id': clerkUid } : {}),
    ...(clerkEmail ? { 'x-user-email': clerkEmail } : {}),
    ...(clerkName ? { 'x-user-name': clerkName } : {}),
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

// Dedicated Admin API fetch helper — strictly uses wagh_admin_token
export async function fetchAdminApi(endpoint, options = {}) {
  const adminToken =
    localStorage.getItem('wagh_admin_token') || sessionStorage.getItem('wagh_admin_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('wagh_admin_token');
        sessionStorage.removeItem('wagh_admin_token');
      }
      throw new Error(data.message || 'Admin request failed');
    }
    return data;
  } catch (err) {
    console.warn(`Admin API Error [${endpoint}]:`, err.message);
    throw err;
  }
}
