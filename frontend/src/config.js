// In production (Vercel Services), the backend is mounted at /_/backend.
// In local development, Create React App proxies /api to the Flask server.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? '/_/backend' : '');

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export const asArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeCountryStatus = (payload) => ({
  'Admin-1': asArray(payload?.['Admin-1']),
  'Admin-2': asArray(payload?.['Admin-2']),
});
