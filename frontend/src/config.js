// In production (Vercel Services), the backend is mounted at /_/backend.
// In local development, Create React App proxies /api to the Flask server.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
