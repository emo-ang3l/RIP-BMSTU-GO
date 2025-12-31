import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store/store';
import { useRoutePath } from '../../hooks/useRoutePath';
import '../LoginPage/LoginPage.css';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      // After successful registration, redirect to login
      navigate(`${routePath}/login`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Регистрация</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Введите имя пользователя"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Введите email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="first_name">Имя</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="form-control"
              placeholder="Введите имя"
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Фамилия</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="form-control"
              placeholder="Введите фамилию"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="form-control"
              placeholder="Введите пароль (минимум 8 символов)"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Уже есть аккаунт?{' '}
            <Link to={`${routePath}/login`} className="auth-link">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

