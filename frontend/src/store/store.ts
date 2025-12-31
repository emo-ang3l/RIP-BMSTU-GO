import { configureStore } from '@reduxjs/toolkit';
import unitsReducer from './slices/unitsSlice';
import filterReducer from './slices/unitsSlice';
import authReducer from './slices/authSlice';
import ordersReducer from './slices/ordersSlice';
import cartReducer from './slices/cartSlice';

/**
 * Redux Store конфигурация
 * 
 * Использует Redux Toolkit с автоматически включенным redux-thunk middleware.
 * configureStore() автоматически добавляет:
 * - redux-thunk для асинхронных действий (createAsyncThunk)
 * - Redux DevTools Extension поддержку
 * - проверку на мутации состояния
 * 
 * Reducers:
 * - units: управление утеплителями
 * - filters: фильтры поиска
 * - auth: состояние авторизации пользователя
 * - orders: список заявок пользователя
 * - cart: корзина/черновик заявки
 */
export const store = configureStore({
  reducer: {
    units: unitsReducer,
    filters: filterReducer,
    auth: authReducer,
    orders: ordersReducer,
    cart: cartReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Экспортируем store для использования в interceptors
// Это позволяет получать токены из Redux state вместо localStorage
declare global {
  interface Window {
    __REDUX_STORE__?: typeof store;
  }
}
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}