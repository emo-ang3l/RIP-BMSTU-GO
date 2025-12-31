import axios from 'axios';
import { API_BASE } from './base';
import { setCredentials } from '../store/slices/authSlice';

// Функция для получения токенов из Redux store
const getTokenFromStore = (): string | null => {
  if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
    const state = window.__REDUX_STORE__.getState();
    return state.auth.accessToken;
  }
  return null;
};

const getRefreshTokenFromStore = (): string | null => {
  if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
    const state = window.__REDUX_STORE__.getState();
    return state.auth.refreshToken;
  }
  return null;
};

/**
 * API Client для взаимодействия с бэкенд-сервисом
 * 
 * ПРИМЕЧАНИЕ: Этот файл оставлен для обратной совместимости.
 * Основной API клиент теперь находится в src/api/index.ts и использует
 * сгенерированный код из src/api/Api.ts (создан через swagger-typescript-api).
 * 
 * Для использования API импортируйте из src/api/index.ts:
 * import { api } from '../../api';
 * 
 * Все эндпоинты соответствуют спецификации OpenAPI/Swagger (openapi.json):
 * - /api/auth/token/ - получение JWT токенов
 * - /api/auth/token/refresh/ - обновление access токена
 * - /api/users/ - управление пользователями
 * - /api/insulators/ - управление утеплителями
 * - /api/insulatorrequests/ - управление заявками
 * 
 * Redux-thunk middleware используется для асинхронных действий (createAsyncThunk),
 * что позволяет обрабатывать pending/fulfilled/rejected состояния запросов.
 */
// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
// Используем токены из Redux store вместо localStorage
apiClient.interceptors.request.use(
  (config) => {
    // Если заголовок Authorization уже установлен (например, при логине), не перезаписываем его
    if (!config.headers.Authorization) {
      const token = getTokenFromStore();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshTokenFromStore();
        if (refreshToken) {
          // Use axios directly to avoid interceptor loop
          const response = await axios.post(`${API_BASE}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const { access } = response.data;
          // Обновляем токен в Redux store через dispatch
          if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
            window.__REDUX_STORE__.dispatch(setCredentials({ access, refresh: refreshToken }));
          }
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
          window.__REDUX_STORE__.dispatch({
            type: 'auth/logoutUser/fulfilled',
          });
        }
        window.location.href = '/RIP-BMSTU-FRONTED/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

