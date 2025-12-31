import { Api, HttpClient } from './Api';
import { API_BASE } from './base';
import axios from 'axios';

/**
 * Функция для получения токенов из Redux store
 */
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
 * Security Worker для автоматической подстановки токенов в запросы
 * Используется сгенерированным API для автоматической авторизации
 */
const securityWorker = async (securityData: { accessToken?: string } | null) => {
  const token = securityData?.accessToken || getTokenFromStore();
  if (token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return {};
};

// Создаем HttpClient с настройкой interceptors для обновления токенов
// Если API_BASE пустой (относительный путь), используем '/api'
const baseURL = API_BASE ? `${API_BASE}/api` : '/api';
const httpClient = new HttpClient({
  baseURL,
  securityWorker,
  secure: true,
});

// Настраиваем interceptors для автоматического обновления токенов
httpClient.instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и мы еще не пытались обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshTokenFromStore();
        if (refreshToken) {
          // Используем axios напрямую, чтобы избежать циклических вызовов
          // Используем относительный путь через прокси если API_BASE пустой
          const refreshURL = API_BASE ? `${API_BASE}/api/auth/token/refresh/` : '/api/auth/token/refresh/';
          const response = await axios.post(refreshURL, {
            refresh: refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const { access } = response.data;
          // Обновляем токен в Redux store
          if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
            // Используем прямой dispatch для избежания циклической зависимости
            window.__REDUX_STORE__.dispatch({
              type: 'auth/setCredentials',
              payload: { access, refresh: refreshToken },
            });
          }
          
          // Обновляем заголовок и повторяем запрос
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return httpClient.instance(originalRequest);
        }
      } catch (refreshError) {
        // Обновление токена не удалось, очищаем токены и перенаправляем на логин
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

// Создаем и экспортируем инстанс API
export const api = new Api(httpClient);

/**
 * Функция для обновления токенов в API клиенте
 * Вызывается после успешной авторизации
 */
export const updateApiTokens = (accessToken: string) => {
  httpClient.setSecurityData({ accessToken });
};

