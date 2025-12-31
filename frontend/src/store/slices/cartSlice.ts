import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '../../api';
import { API_BASE } from '../../api/base';

export interface CartItem {
  id: number;
  insulator: {
    id: number;
    insulator_name: string;
    image_url?: string;
    thermal_conductivity: number;
  };
  quantity: number;
  order: number;
  DetailRequestActive: boolean;
  user_comment?: string;
  calculated_thickness?: number;
}

interface CartState {
  requestId: number | null;
  items: CartItem[];
  count: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  requestId: null,
  items: [],
  count: 0,
  isLoading: false,
  error: null,
};

// Fetch cart icon info
export const fetchCartInfo = createAsyncThunk(
  'cart/fetchCartInfo',
  async (_, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для получения информации о корзине
      // Примечание: сгенерированный тип указывает массив, но бэкенд возвращает объект {request_id, count}
      const response = await api.insulatorrequests.insulatorrequestsCartIcon();
      // Обрабатываем ответ: если это массив (неправильный тип), преобразуем в объект
      // Если это объект (правильный ответ), используем как есть
      const data = response.data as any;
      if (Array.isArray(data)) {
        // Если пришел массив (неправильный тип в сгенерированном API), возвращаем пустую корзину
        return { request_id: null, count: 0 };
      }
      // Правильный ответ - объект с request_id и count
      return data;
    } catch (error: any) {
      // If not authenticated, return empty cart
      if (error.response?.status === 401) {
        return { request_id: null, count: 0 };
      }
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch cart');
    }
  }
);

// Add insulator to request
export const addToRequest = createAsyncThunk(
  'cart/addToRequest',
  async (insulatorId: number, { rejectWithValue, dispatch }) => {
    try {
      // Используем прямой axios запрос, так как бэкенд не использует тело запроса
      // и сгенерированный API требует его, что вызывает ошибку 500
      const getTokenFromStore = () => {
        if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
          const state = window.__REDUX_STORE__.getState();
          return state.auth.accessToken;
        }
        return null;
      };
      const token = getTokenFromStore();
      // Используем относительный путь через прокси Vite если API_BASE пустой (для HTTPS)
      const addToRequestURL = API_BASE ? `${API_BASE}/api/insulators/${insulatorId}/add-to-request/` : `/api/insulators/${insulatorId}/add-to-request/`;
      
      // Логируем для отладки
      console.log('Adding to request:', {
        url: addToRequestURL,
        insulatorId,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'no token'
      });
      
      // Бэкенд не использует тело запроса, отправляем пустой объект
      const response = await axios.post(
        addToRequestURL,
        {}, // Пустое тело - бэкенд не использует его
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );
      // Refresh cart info after adding
      await dispatch(fetchCartInfo());
      return response.data;
    } catch (error: any) {
      console.error('Add to request error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Пытаемся извлечь детали ошибки из ответа
      let errorMessage = 'Failed to add to request';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          // Если это HTML страница с ошибкой, попробуем извлечь текст
          errorMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch request details with items
export const fetchRequestDetails = createAsyncThunk(
  'cart/fetchRequestDetails',
  async (requestId: number, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для получения деталей заявки
      const response = await api.insulatorrequests.insulatorrequestsRead({ id: requestId });
      const data = response.data;
      
      // Log the response structure for debugging
      console.log('API Response structure:', Object.keys(data));
      console.log('Full API Response:', data);
      
      return data;
    } catch (error: any) {
      console.error('Error fetching request details:', error);
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch request');
    }
  }
);

// Remove item from request
export const removeItemFromRequest = createAsyncThunk(
  'cart/removeItem',
  async ({ requestId, insulatorId }: { requestId: number; insulatorId: number }, { rejectWithValue, dispatch }) => {
    try {
      // Используем сгенерированный API для удаления элемента из заявки
      await api.insulatorrequests.insulatorrequestsRemoveItem({
        id: requestId,
        insulatorId: String(insulatorId),
      });
      // Refresh request details
      await dispatch(fetchRequestDetails(requestId));
      // Refresh cart info
      await dispatch(fetchCartInfo());
      return insulatorId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to remove item');
    }
  }
);

// Update request item
export const updateRequestItem = createAsyncThunk(
  'cart/updateItem',
  async (
    { requestId, insulatorId, data }: { requestId: number; insulatorId: number; data: Partial<CartItem> },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // Примечание: API для обновления элемента заявки может отсутствовать в сгенерированном API
      // Используем прямой вызов через axios для этого эндпоинта
      const getTokenFromStore = () => {
        if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
          const state = window.__REDUX_STORE__.getState();
          return state.auth.accessToken;
        }
        return null;
      };
      const token = getTokenFromStore();
      const updateURL = API_BASE ? `${API_BASE}/api/insulatorrequests/${requestId}/items/${insulatorId}/` : `/api/insulatorrequests/${requestId}/items/${insulatorId}/`;
      const response = await axios.put(
        updateURL,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // Refresh request details
      await dispatch(fetchRequestDetails(requestId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update item');
    }
  }
);

// Form/confirm request
export const formRequest = createAsyncThunk(
  'cart/formRequest',
  async (requestId: number, { rejectWithValue, dispatch }) => {
    try {
      // Используем сгенерированный API для подтверждения заявки
      // Метод form требует данные, но мы можем передать пустой объект или текущие данные заявки
      const currentRequest = await api.insulatorrequests.insulatorrequestsRead({ id: requestId });
      const response = await api.insulatorrequests.insulatorrequestsForm(
        { id: requestId },
        currentRequest.data
      );
      // Refresh request details
      await dispatch(fetchRequestDetails(requestId));
      // Refresh cart info
      await dispatch(fetchCartInfo());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to form request');
    }
  }
);

// Update request fields
export const updateRequest = createAsyncThunk(
  'cart/updateRequest',
  async (
    { requestId, data }: { requestId: number; data: any },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // Используем сгенерированный API для частичного обновления заявки
      const response = await api.insulatorrequests.insulatorrequestsPartialUpdate(
        { id: requestId },
        data
      );
      // Refresh request details
      await dispatch(fetchRequestDetails(requestId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update request');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.requestId = null;
      state.items = [];
      state.count = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart info
    builder
      .addCase(fetchCartInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCartInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requestId = action.payload.request_id;
        state.count = action.payload.count || 0;
        state.error = null;
      })
      .addCase(fetchCartInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.requestId = null;
        state.count = 0;
      });

    // Add to request
    builder
      .addCase(addToRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addToRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch request details
    builder
      .addCase(fetchRequestDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRequestDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requestId = action.payload.id ?? null;
        // Backend returns items in 'insulators' field as an array
        if (action.payload.insulators && Array.isArray(action.payload.insulators)) {
          state.items = action.payload.insulators;
        } else {
          state.items = [];
        }
        state.error = null;
      })
      .addCase(fetchRequestDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove item
    builder
      .addCase(removeItemFromRequest.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.insulator.id !== action.payload);
        state.count = Math.max(0, state.count - 1);
      });

    // Form request
    builder
      .addCase(formRequest.fulfilled, (state) => {
        // After forming, cart should be empty
        state.requestId = null;
        state.items = [];
        state.count = 0;
      });
  },
});

export const { clearCart, clearError } = cartSlice.actions;
export default cartSlice.reducer;

