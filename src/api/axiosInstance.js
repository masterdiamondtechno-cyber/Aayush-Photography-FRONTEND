import axios from 'axios';
import { withApiOrigin } from './apiOrigin';
import { useAcademicYearStore } from '../store/academicYearStore';

const BASE_URL = withApiOrigin('');

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const { selectedAcademicYear } = useAcademicYearStore.getState();
    if (selectedAcademicYear && selectedAcademicYear.academicYearId) {
      config.headers['x-academic-year-id'] = selectedAcademicYear.academicYearId;
    }
    
    // Auto-inject academicYearId for all POST requests if applicable
    if (config.method === 'post' && config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      const { selectedAcademicYear } = useAcademicYearStore.getState();
      if (selectedAcademicYear && selectedAcademicYear.academicYearId && !config.data.academicYearId) {
        config.data.academicYearId = selectedAcademicYear.academicYearId;
      }
    }
    
    // Enhanced Log outgoing requests
    console.groupCollapsed(`🚀 [API Request] ${config.method.toUpperCase()} ${config.url}`);
    console.log('URL:', config.baseURL + config.url);
    console.log('Method:', config.method.toUpperCase());
    console.log('Params:', config.params || 'None');
    console.log('Payload:', config.data || 'None');
    console.log('Headers:', config.headers);
    console.log('Time:', new Date().toLocaleTimeString());
    console.groupEnd();
    
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Enhanced Log incoming responses
    console.groupCollapsed(`✅ [API Response] ${response.config.method.toUpperCase()} ${response.config.url}`);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.groupEnd();

    const data = response.data;
    if (
      response.config.skipEnvelopeValidation ||
      response.config.url?.split('?')[0].replace(/\/+$/, '').endsWith('/api/auth/check-status')
    ) {
      return data;
    }

    const { status, code, message } = data || {};
    const normalizedStatus = status?.toUpperCase();
    
    if (
      normalizedStatus === 'SUCCESS' || 
      normalizedStatus === 'OTP_REQUIRED' || 
      code === 200 || 
      Array.isArray(data) || 
      (typeof data === 'object' && !status && !code)
    ) {
      return data;
    }
    
    const error = new Error(message || 'Request failed');
    error.code = code;
    return Promise.reject(error);
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If it's a login request, don't try to refresh
      if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Use axios directly to avoid interceptors
          const response = await axios.post(withApiOrigin('/api/auth/refresh'), { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
          processQueue(null, accessToken);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          if (window.location.pathname !== '/login') {
            localStorage.clear();
            sessionStorage.clear();
            sessionStorage.setItem('logout_msg', 'session_expired');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Handle empty database lists (404 status with structured JSON)
    const errData = error.response?.data;
    if (error.response?.status === 404 && errData && typeof errData === 'object') {
      const { message } = errData;
      if (message && (message.toLowerCase().includes('no ') || message.toLowerCase().includes('not found') || message.toLowerCase().includes('empty'))) {
        console.warn(`⚠️ [API Normalizer] Intercepted 404 empty state: "${message}". Normalizing to empty array SUCCESS.`);
        return {
          status: 'SUCCESS',
          code: 200,
          message: message,
          data: []
        };
      }
    }

    // Default error handling
    if (error.response?.status === 401 || error.response?.status === 403) {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail !== 'superadmin@school.com' && userEmail !== 'superadmin@system.com' && userEmail !== 'superadmin') {
         if (window.location.pathname !== '/login') {
            const errMsg = error.response?.data?.message || '';
            const isInactive = errMsg.toLowerCase().includes('inactive');
            
            localStorage.clear();
            sessionStorage.clear();
            
            if (isInactive) {
               sessionStorage.setItem('logout_msg', 'inactive');
            } else {
               sessionStorage.setItem('logout_msg', 'session_expired');
            }
            window.location.href = '/login';
         }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
