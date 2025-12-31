import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api';
import type { InsulatorRequest as ApiInsulatorRequest } from '../../api/Api';

// Локальный тип с обязательным id для использования в Redux state
export interface InsulatorRequest extends Omit<ApiInsulatorRequest, 'id'> {
  id: number; // Делаем id обязательным
}

interface OrdersState {
  orders: InsulatorRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  isLoading: false,
  error: null,
};

// Async thunk to fetch user's orders
export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (params: { from_date?: string; to_date?: string; status?: string } | undefined = undefined, thunkAPI) => {
    try {
      // Используем сгенерированный API для получения списка заявок с параметрами фильтрации
      // Параметры передаются через query в params
      const queryParams: any = {};
      if (params?.from_date) queryParams.from_date = params.from_date;
      if (params?.to_date) queryParams.to_date = params.to_date;
      if (params?.status) queryParams.status = params.status;
      
      const response = await api.insulatorrequests.insulatorrequestsList({
        query: queryParams,
      } as any);
      // Фильтруем элементы без id и преобразуем тип
      const orders = response.data
        .filter((order): order is ApiInsulatorRequest & { id: number } => order.id !== undefined)
        .map((order) => ({ ...order, id: order.id } as InsulatorRequest));
      return orders;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch orders'
      );
    }
  }
);

// Async thunk to create a new order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: Partial<InsulatorRequest>, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для создания заявки
      const response = await api.insulatorrequests.insulatorrequestsCreate(orderData as ApiInsulatorRequest);
      // Преобразуем тип, гарантируя наличие id
      if (response.data.id === undefined) {
        throw new Error('Created order missing id');
      }
      return { ...response.data, id: response.data.id } as InsulatorRequest;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to create order'
      );
    }
  }
);

// Async thunk to update an order
export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async ({ id, data }: { id: number; data: Partial<InsulatorRequest> }, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для обновления заявки
      const response = await api.insulatorrequests.insulatorrequestsUpdate(
        { id },
        data as ApiInsulatorRequest
      );
      // Преобразуем тип, гарантируя наличие id
      if (response.data.id === undefined) {
        throw new Error('Updated order missing id');
      }
      return { ...response.data, id: response.data.id } as InsulatorRequest;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to update order'
      );
    }
  }
);

// Async thunk to delete an order
export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (id: number, { rejectWithValue }) => {
    try {
      // Используем сгенерированный API для удаления заявки
      await api.insulatorrequests.insulatorrequestsDelete({ id });
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to delete order'
      );
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create order
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.push(action.payload);
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update order
    builder
      .addCase(updateOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete order
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = state.orders.filter((order) => order.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = ordersSlice.actions;
export default ordersSlice.reducer;

