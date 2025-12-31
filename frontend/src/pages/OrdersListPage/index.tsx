import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserOrders, deleteOrder } from '../../store/slices/ordersSlice';
import { AppDispatch, RootState } from '../../store/store';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';
import './OrdersListPage.css';

export const OrdersListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации
  const { orders, isLoading, error } = useSelector((state: RootState) => state.orders);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Установить обе даты сегодняшней датой по умолчанию при первой загрузке
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`${routePath}/login`);
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (!dateFrom && !dateTo) {
      setDateFrom(today);
      setDateTo(today);
    }
  }, [isAuthenticated, navigate, dateFrom, dateTo]);

  // Загрузка заявок с фильтрацией и polling
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    // Функция загрузки с текущими фильтрами
    const loadOrders = () => {
      dispatch(fetchUserOrders({
        from_date: dateFrom || undefined,
        to_date: dateTo || undefined,
        status: statusFilter || undefined,
      }));
    };
    
    // Первоначальная загрузка
    loadOrders();
    
    // Polling каждые 5 секунд для обновления списка заявок
    const intervalId = setInterval(() => {
      loadOrders();
    }, 5000);
    
    // Очистка интервала при размонтировании компонента
    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch, isAuthenticated, dateFrom, dateTo, statusFilter]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      await dispatch(deleteOrder(id));
      // Перезагружаем с текущими фильтрами
      dispatch(fetchUserOrders({
        from_date: dateFrom || undefined,
        to_date: dateTo || undefined,
        status: statusFilter || undefined,
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Черновик', className: 'badge-draft' },
      FORMED: { label: 'Сформирован', className: 'badge-formed' },
      COMPLETED: { label: 'Завершен', className: 'badge-completed' },
      REJECTED: { label: 'Отклонен', className: 'badge-rejected' },
      DELETED: { label: 'Удален', className: 'badge-deleted' },
    };
    const statusInfo = statusMap[status] || { label: status, className: 'badge-default' };
    return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ' ' + date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Фильтрация на бэкенде, исключаем только DRAFT и DELETED на клиенте для отображения
  const filteredOrders = orders.filter((order) => {
    // Исключаем черновики и удаленные из отображения
    return order.status_request !== 'DRAFT' && order.status_request !== 'DELETED';
  });

  const handleClearFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFrom(today);
    setDateTo(today);
    setStatusFilter('');
  };

  if (isLoading) {
    return (
      <div className="orders-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Мои заказы</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/RIP-BMSTU-FRONTED/home')}
        >
          Создать новый заказ
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Фильтры */}
      <div className="orders-filters">
        <div className="filter-group">
          <label>Дата от:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Дата до:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Статус:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">Все</option>
            <option value="FORMED">Сформирован</option>
            <option value="COMPLETED">Завершен</option>
            <option value="REJECTED">Отклонен</option>
          </select>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleClearFilters}
        >
          Сбросить
        </button>
      </div>

      {/* Счетчик результатов */}
      <div className="orders-results-count">
        Найдено заявок: <strong>{filteredOrders.length}</strong>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>Заявки не найдены</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`${routePath}/home`)}
          >
            Создать первый заказ
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="order-item-card"
              onClick={() => navigate(`${routePath}/insulatorequests/${order.id}`)}
            >
              <div className="order-item-info">
                <div className="order-item-header">
                  <h3>Заявка #{order.id}</h3>
                  {getStatusBadge(order.status_request || '')}
                </div>
                <div className="order-item-fields">
                  <div className="order-item-field">
                    <span className="order-field-label">Дата создания:</span>
                    <span className="order-field-value">{formatDate(order.creation_datetime || '')}</span>
                  </div>
                  <div className="order-item-field">
                    <span className="order-field-label">R-значение:</span>
                    <span className="order-field-value">{order.required_r_value || '-'}</span>
                  </div>
                  <div className="order-item-field">
                    <span className="order-field-label">Толщина:</span>
                    <span className="order-field-value order-field-value-highlight">
                      {order.total_thickness ? `${order.total_thickness.toFixed(2)} мм` : '-'}
                    </span>
                  </div>
                </div>
              </div>
              {user?.is_staff && (
                <div className="order-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(order.id)}
                    disabled={order.status_request === 'COMPLETED'}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

