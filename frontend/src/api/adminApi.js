import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const adminApi = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('classyshop_user') || 'null');
  } catch {
    return null;
  }
};

adminApi.interceptors.request.use((config) => {
  const user = readStoredUser();
  const token = user?.token || localStorage.getItem('classyshop_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const { data } = await adminApi.post('/admin/auth/refresh');
        const token = data?.data?.token || data?.token;
        if (token) {
          localStorage.setItem('classyshop_admin_token', token);
          original.headers.Authorization = `Bearer ${token}`;
          return adminApi(original);
        }
      } catch {
        localStorage.removeItem('classyshop_admin_token');
      }
    }
    return Promise.reject(error);
  }
);

export const unwrap = (response) => ({
  data: response?.data?.data ?? response?.data?.result ?? response?.data?.analytics ?? response?.data,
  meta: response?.data?.meta ?? {},
});

export const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') console.log(...args);
};

export const apiError = (label, error) => {
  const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || 'Request failed';
  if (process.env.NODE_ENV === 'development') console.error(`${label}:`, message, error?.response?.data || '');
};

export const getFirstAvailable = async (paths, config = {}, label = 'API request') => {
  let lastError;
  for (const path of paths) {
    try {
      return await adminApi.get(path, config);
    } catch (error) {
      lastError = error;
      if (![404, 405].includes(error?.response?.status)) break;
    }
  }
  apiError(label, lastError);
  throw lastError;
};

export default adminApi;
