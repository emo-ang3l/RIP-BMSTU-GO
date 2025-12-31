import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store/store';
import { useRoutePath } from '../../hooks/useRoutePath';
import './LoginPage.css';

export const LoginPage = () => {
  // Загружаем сохраненные данные из localStorage
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('savedUsername') || '';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('savedPassword') || '';
  });
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const routePath = useRoutePath();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`${routePath}/home`);
    }
  }, [isAuthenticated, navigate, routePath]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Сохраняем логин и пароль в localStorage при изменении
  useEffect(() => {
    if (username) {
      localStorage.setItem('savedUsername', username);
    } else {
      localStorage.removeItem('savedUsername');
    }
  }, [username]);

  useEffect(() => {
    if (password) {
      localStorage.setItem('savedPassword', password);
    } else {
      localStorage.removeItem('savedPassword');
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate(`${routePath}/home`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Вход в систему</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-control"
              placeholder="Введите имя пользователя"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control"
              placeholder="Введите пароль"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Нет аккаунта?{' '}
            <Link to={`${routePath}/register`} className="auth-link">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

