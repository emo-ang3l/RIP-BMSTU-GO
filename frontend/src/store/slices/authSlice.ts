import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, updateApiTokens } from '../../api';

interface User {
  id?: number; // Опциональный, так как в API тип опциональный
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// НЕ загружаем токены из localStorage - сессия сбрасывается при F5
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      // Используем кастомный эндпоинт /auth/login/ который возвращает токены и sessionid
      const response = await api.auth.authLoginCreate({
        username: credentials.username,
        password: credentials.password,
      });
      // Бэкенд возвращает { access, refresh, sessionid }
      const { access, refresh } = response.data as any;
      
      // Обновляем токены в API клиенте
      if (access) {
        updateApiTokens(access);
      }
      
      // НЕ сохраняем токены в localStorage - сессия сбрасывается при F5
      // Токены хранятся только в Redux state
      
      // Fetch user info используя сгенерированный API
      const userResponse = await api.users.usersMeRead();
      const user = Array.isArray(userResponse.data) ? userResponse.data[0] : userResponse.data;
      
      return { access, refresh, user };
    } catch (error: any) {
      // Логируем ошибку для отладки
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Возвращаем понятное сообщение об ошибке
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Ошибка входа. Проверьте правильность логина и пароля.';
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for registration
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email?: string; password?: string; first_name?: string; last_name?: string }, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для регистрации
      // Примечание: тип User не содержит password (write_only), но бэкенд требует его
      const response = await api.users.usersRegister({
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password, // Пароль обязателен для регистрации
      } as any); // Приведение типа, так как password не входит в тип User
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Registration failed'
      );
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      // Используем сгенерированный API для выхода
      await api.auth.authLogoutCreate();
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    } finally {
      // Очищаем токены из localStorage на всякий случай
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Очищаем токены в API клиенте
      updateApiTokens('');
    }
  }
);

// Async thunk to fetch current user
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для получения информации о пользователе
      const response = await api.users.usersMeRead();
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch user'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ access: string; refresh: string }>) => {
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      // Обновляем токены в API клиенте
      updateApiTokens(action.payload.access);
      // НЕ сохраняем в localStorage - сессия сбрасывается при F5
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.user = action.payload.user;
        state.error = null;
        // Обновляем токены в API клиенте
        if (action.payload.access) {
          updateApiTokens(action.payload.access);
        }
        // Токены хранятся только в Redux state - сессия сбрасывается при F5
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        // localStorage уже очищен в logoutUser thunk
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        // Очищаем токены из localStorage на всякий случай
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

