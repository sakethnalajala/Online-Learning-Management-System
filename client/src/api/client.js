import axios from 'axios';

/**
 * In development VITE_API_URL is empty and the Vite proxy forwards /api to the
 * backend, so the app stays single-origin. In production it points at Render.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiBase = BASE_URL;

/** Turns a stored upload path (/uploads/...) into a loadable URL. */
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const TOKEN_KEY = 'lumina.accessToken';
const REFRESH_KEY = 'lumina.refreshToken';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Broadcast so AuthContext can react to a session ending mid-request. */
const signalSessionExpired = () => {
  window.dispatchEvent(new CustomEvent('lumina:session-expired'));
};

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response) {
      // Network failure or timeout — give the UI something meaningful to show.
      return Promise.reject({
        status: 0,
        message:
          error.code === 'ECONNABORTED'
            ? 'The request timed out. Please check your connection and try again.'
            : 'Cannot reach the server. Make sure the backend is running.',
        errors: null,
        isNetworkError: true,
      });
    }

    const normalised = {
      status: response.status,
      message: response.data?.message || 'Something went wrong.',
      errors: response.data?.errors || null,
    };

    // One transparent refresh attempt on a 401, then give up and log out.
    const isAuthRoute = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register');
    if (response.status === 401 && !config._retried && !isAuthRoute && tokenStore.getRefresh()) {
      config._retried = true;
      try {
        refreshing =
          refreshing ||
          axios.post(
            `${BASE_URL}/api/auth/refresh`,
            { refreshToken: tokenStore.getRefresh() },
            { withCredentials: true }
          );
        const refreshed = await refreshing;
        refreshing = null;

        tokenStore.set(refreshed.data.data.accessToken, refreshed.data.data.refreshToken);
        config.headers.Authorization = `Bearer ${refreshed.data.data.accessToken}`;
        return api(config);
      } catch {
        refreshing = null;
        tokenStore.clear();
        signalSessionExpired();
        return Promise.reject(normalised);
      }
    }

    if (response.status === 401 && !isAuthRoute) {
      tokenStore.clear();
      signalSessionExpired();
    }

    return Promise.reject(normalised);
  }
);

export default api;
