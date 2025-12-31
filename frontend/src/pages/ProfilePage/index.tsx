import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store/store';
import { api } from '../../api';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';
import './ProfilePage.css';

export const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`${routePath}/login`);
      return;
    }
    dispatch(fetchCurrentUser());
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) return;
    
    try {
      // Используем сгенерированный API для обновления профиля
      await api.users.usersMeUpdate({
        username: user.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      await dispatch(fetchCurrentUser());
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Профиль успешно обновлен' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Ошибка при обновлении профиля' 
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Пароль должен содержать минимум 8 символов' });
      return;
    }

    try {
      // Note: You may need to implement a password change endpoint
      // This is a placeholder - adjust based on your API
      const response = await fetch('/api/users/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        }),
      });

      if (response.ok) {
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
        setMessage({ type: 'success', text: 'Пароль успешно изменен' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.detail || 'Ошибка при изменении пароля' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при изменении пароля. Возможно, эта функция еще не реализована на сервере.' });
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Личный кабинет</h1>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Смена пароля
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Информация о пользователе</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                Редактировать
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="form-control"
                />
                <small>Имя пользователя нельзя изменить</small>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Имя</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Фамилия</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      email: user.email || '',
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Имя пользователя:</span>
                <span className="info-value">{user.username}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email || 'Не указан'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Имя:</span>
                <span className="info-value">{user.first_name || 'Не указано'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Фамилия:</span>
                <span className="info-value">{user.last_name || 'Не указано'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'password' && (
        <div className="profile-section">
          <h2>Смена пароля</h2>
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Текущий пароль</label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Новый пароль</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                minLength={8}
                className="form-control"
              />
              <small>Минимум 8 символов</small>
            </div>

            <div className="form-group">
              <label>Подтвердите новый пароль</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
                minLength={8}
                className="form-control"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Изменить пароль
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

