import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRequestDetails,
  removeItemFromRequest,
  updateRequestItem,
  updateRequest,
  formRequest,
} from '../../store/slices/cartSlice';
import { AppDispatch, RootState } from '../../store/store';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';
import './RequestPage.css';

export const RequestPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isLoading, error } = useSelector((state: RootState) => state.cart);
  const [requestData, setRequestData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    required_r_value: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`${routePath}/login`);
      return;
    }

    if (id) {
      dispatch(fetchRequestDetails(Number(id))).then((result) => {
        if (fetchRequestDetails.fulfilled.match(result)) {
          console.log('Request data:', result.payload); // Debug log
          setRequestData(result.payload);
          setFormData({
            required_r_value: String(result.payload.required_r_value || ''),
          });
          
          // Try multiple possible field names for items
          let extractedItems: any[] = [];
          
          // Log all keys to see what's available
          console.log('All response keys:', Object.keys(result.payload));
          
          // Backend returns items in 'insulators' field as an array
          if (result.payload.insulators && Array.isArray(result.payload.insulators)) {
            extractedItems = result.payload.insulators;
            console.log('Found items in insulators field:', extractedItems);
          } else {
            // Try other possible field names as fallback
            const possibleFields = [
              'details',
              'items',
              'detail_request_insulators',
              'detailrequestinsulator_set',
              'insulator_items',
              'request_items',
            ];
            
            for (const field of possibleFields) {
              const payload = result.payload as any;
              if (payload[field] && Array.isArray(payload[field]) && payload[field].length > 0) {
                extractedItems = payload[field];
                console.log(`Found items in field "${field}":`, extractedItems);
                break;
              }
            }
          }
          
          console.log('Final extracted items:', extractedItems);
          setItems(extractedItems);
        }
      });
    }
  }, [dispatch, id, isAuthenticated, navigate]);

  const isDraft = requestData?.status_request === 'DRAFT';
  const canEdit = isDraft;

  const handleRemoveItem = async (insulatorId: number) => {
    if (!id) return;
    if (window.confirm('Удалить этот утеплитель из заявки?')) {
      const result = await dispatch(removeItemFromRequest({ requestId: Number(id), insulatorId }));
      if (removeItemFromRequest.fulfilled.match(result)) {
        // Refresh request details to get updated items
        const refreshResult = await dispatch(fetchRequestDetails(Number(id)));
        if (fetchRequestDetails.fulfilled.match(refreshResult)) {
          const payload = refreshResult.payload as any;
          if (payload.details && Array.isArray(payload.details)) {
            setItems(payload.details);
          } else if (payload.items && Array.isArray(payload.items)) {
            setItems(payload.items);
          } else if (payload.insulators && Array.isArray(payload.insulators)) {
            setItems(payload.insulators);
          }
        }
      }
    }
  };

  const handleUpdateQuantity = async (insulatorId: number, quantity: number) => {
    if (!id || !canEdit) return;
    if (quantity < 1) {
      handleRemoveItem(insulatorId);
      return;
    }
    const result = await dispatch(
      updateRequestItem({
        requestId: Number(id),
        insulatorId,
        data: { quantity },
      })
    );
    if (updateRequestItem.fulfilled.match(result)) {
      // Refresh request details to get updated items
      const refreshResult = await dispatch(fetchRequestDetails(Number(id)));
      if (fetchRequestDetails.fulfilled.match(refreshResult)) {
        const payload = refreshResult.payload as any;
        if (payload.details && Array.isArray(payload.details)) {
          setItems(payload.details);
        } else if (payload.items && Array.isArray(payload.items)) {
          setItems(payload.items);
        } else if (payload.insulators && Array.isArray(payload.insulators)) {
          setItems(payload.insulators);
        }
      }
    }
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await dispatch(
      updateRequest({
        requestId: Number(id),
        data: {
          ...formData,
          required_r_value: parseFloat(formData.required_r_value) || 0,
        },
      })
    );
    setIsEditing(false);
  };

  const handleFormRequest = async () => {
    if (!id) return;
    if (!formData.required_r_value) {
      alert('Заполните R-значение');
      return;
    }
    if (window.confirm('Подтвердить заявку? После подтверждения редактирование будет недоступно.')) {
      const result = await dispatch(formRequest(Number(id)));
      if (formRequest.fulfilled.match(result)) {
        alert('Заявка успешно сформирована!');
        navigate(`${routePath}/orders`);
      }
    }
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

  if (isLoading && !requestData) {
    return (
      <div className="request-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка заявки...</p>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="request-container">
        <div className="error-state">
          <p>Заявка не найдена</p>
          <button onClick={() => navigate(`${routePath}/orders`)} className="btn btn-primary">
            Вернуться к заявкам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="request-container">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Однострочная карточка с данными заявки */}
      <div className="request-single-row">
        <div className="request-row-header">
          <h1>Заявка #{requestData.id}</h1>
          {getStatusBadge(requestData.status_request)}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleUpdateRequest} className="request-row-form">
            <div className="request-row-fields">
              <div className="field-group">
                <label>Дата создания</label>
                <span>{formatDate(requestData.creation_datetime)}</span>
              </div>
              <div className="field-group">
                <label>R-значение *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.required_r_value}
                  onChange={(e) => setFormData({ ...formData, required_r_value: e.target.value })}
                  required
                  className="form-control"
                />
              </div>
              <div className="field-group">
                <label>Толщина (мм)</label>
                <span>{requestData.total_thickness ? `${requestData.total_thickness.toFixed(2)}` : '-'}</span>
              </div>
            </div>
            <div className="request-row-actions">
              <button type="submit" className="btn btn-primary btn-sm">Сохранить</button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">Отмена</button>
            </div>
          </form>
        ) : (
          <div className="request-row-data">
            <div className="field-group">
              <label>Дата создания</label>
              <span>{formatDate(requestData.creation_datetime)}</span>
            </div>
            <div className="field-group">
              <label>R-значение</label>
              <span>{requestData.required_r_value || '-'}</span>
            </div>
            <div className="field-group">
              <label>Толщина (мм)</label>
              <span>{requestData.total_thickness ? `${requestData.total_thickness.toFixed(2)}` : '-'}</span>
            </div>
            {canEdit && (
              <div className="field-group">
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
                  Редактировать
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Список утеплителей */}
      <div className="request-items-section">
        <h2>Утеплители в заявке</h2>
        <div className="items-list">
            {items.length === 0 ? (
              <div className="empty-items">
                <p>В заявке пока нет утеплителей</p>
                <button onClick={() => navigate(`${routePath}/insulators`)} className="btn btn-primary">
                  Добавить утеплители
                </button>
              </div>
            ) : (
              items.map((item: any, index: number) => {
                // Backend returns items with structure: { insulator: {...}, quantity: 1, ... }
                const insulator = item.insulator;
                const insulatorId = insulator?.id;
                const quantity = item.quantity || 1;
                const insulatorName = insulator?.insulator_name || `Утеплитель #${insulatorId}`;
                const imageUrl = insulator?.image_url || `${pathPrefix}/default-image.jpg`;
                const thermalConductivity = insulator?.thermal_conductivity;

                // Создаем уникальный ключ: используем item.id если есть, иначе комбинацию insulatorId и index
                const uniqueKey = item.id ? `item-${item.id}` : `insulator-${insulatorId}-${index}`;

                return (
                  <div key={uniqueKey} className="item-card">
                    <div className="item-image">
                      <img
                        src={imageUrl}
                        alt={insulatorName}
                      />
                    </div>
                    <div className="item-info">
                      <h3>{insulatorName}</h3>
                      <div className="item-info-fields">
                        {thermalConductivity !== undefined && (
                          <div className="item-field">
                            <span className="item-field-label">Теплопроводность:</span>
                            <span className="item-field-value">{thermalConductivity} Вт/м·К</span>
                          </div>
                        )}
                        {item.calculated_thickness && (
                          <div className="item-field">
                            <span className="item-field-label">Расчетная толщина:</span>
                            <span className="item-field-value item-field-value-highlight">{item.calculated_thickness.toFixed(2)} мм</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="item-actions">
                      {canEdit ? (
                        <>
                          <div className="quantity-control">
                            <label>Количество:</label>
                            <div className="quantity-buttons">
                              <button
                                onClick={() => handleUpdateQuantity(insulatorId, quantity - 1)}
                                className="quantity-btn"
                              >
                                -
                              </button>
                              <span className="quantity-value">{quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(insulatorId, quantity + 1)}
                                className="quantity-btn"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(insulatorId)}
                            className="btn btn-danger btn-sm"
                          >
                            Удалить
                          </button>
                        </>
                      ) : (
                        <div className="quantity-display">
                          <span>Количество: {quantity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>

      {/* Кнопка подтверждения */}
      {canEdit && (
        <div className="request-actions">
          <button onClick={handleFormRequest} className="btn btn-primary btn-large" disabled={items.length === 0}>
            Подтвердить заявку
          </button>
          <button onClick={() => navigate(`${routePath}/insulators`)} className="btn btn-secondary">
            Добавить утеплители
          </button>
        </div>
      )}

    </div>
  );
};

