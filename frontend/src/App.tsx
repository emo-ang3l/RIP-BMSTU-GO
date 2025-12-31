// src/App.tsx — ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ ПОД ТВОЮ СТРУКТУРУ
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Header/index';
import { Home } from './pages/HomePage/index';
import { InsulatorsList } from './pages/UnitsListPage/index';
import { InsulatorDetail } from './pages/UnitPage/index';
import { LoginPage } from './pages/LoginPage/index';
import { RegisterPage } from './pages/RegisterPage/index';
import { OrdersListPage } from './pages/OrdersListPage/index';
import { RequestPage } from './pages/RequestPage/index';
import { ProfilePage } from './pages/ProfilePage/index';
import { Snowfall } from './components/Snowfall/index';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { AppDispatch, RootState } from './store/store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Очищаем localStorage при загрузке страницы - сессия сбрасывается при F5
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  useEffect(() => {
    // Fetch current user if token exists (только из Redux state)
    if (accessToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, accessToken]);

  return (
    <>
      <Snowfall />
      <Navbar />
      <div style={{ padding: '0 20px', backgroundColor: '#f7f7f7', minHeight: 'calc(100vh - 100px)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/insulators" element={<InsulatorsList />} />
          <Route path="/insulators/:id" element={<InsulatorDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrdersListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/insulatorequests/:id" 
            element={
              <ProtectedRoute>
                <RequestPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </>
  );
}

export default App;