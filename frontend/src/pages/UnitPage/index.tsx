// src/pages/InsulatorDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInsulatorById } from '../../modules/mocks';
import { Insulator } from '../../modules/types';
import { BootstrapBreadcrumbs } from '../../components/Breadcrumbs';
import { addToRequest } from '../../store/slices/cartSlice';
import { AppDispatch, RootState } from '../../store/store';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';

export const InsulatorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.cart);
  const [insulator, setInsulator] = useState<Insulator | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchInsulatorById(Number(id)).then(setInsulator);
  }, [id]);

  const handleAddToRequest = async () => {
    if (!insulator) return;
    
    if (!isAuthenticated) {
      navigate(`${routePath}/login`);
      return;
    }


    setIsAdding(true);
    try {
      await dispatch(addToRequest(insulator.id));
      // Optional: show success message or navigate to cart
      // alert('Утеплитель добавлен в заявку');
    } catch (error) {
      console.error('Failed to add to request:', error);
      alert('Ошибка при добавлении в заявку');
    } finally {
      setIsAdding(false);
    }
  };

  if (!insulator) {
    return (
      <div className="loading-wrapper">
        <img src={`${pathPrefix}/77310a9e5492a5e62c5b3ecee4a5ebd0.gif`} alt="Загрузка..." className="loading-spinner" />
        <p className="empty-text">Идет загрузка</p>
      </div>
    );
  }

  return (
    <>
      {/* === BREADCRUMBS === */}
      <div className="hero-wrapper" style={{padding: '0px 20px', backgroundColor: '#f8f8f8' }}>
        <div className="container-camo" style={{ padding: '20px 0px' }}>
          <BootstrapBreadcrumbs />
        </div>
      </div>

      {/* === ДЕТАЛИ — КАРТОЧКА STARBUCKS === */}
      <div className="hero-wrapper" style={{ backgroundColor: '#f8f8f8', padding: '60px 0' }}>
        <div className="container-camo">
          <div className="insulator-detail-card">
            <div className="insulator-image-wrapper">
              <img
                src={insulator.image_url || `${pathPrefix}/default-image.jpg`}
                alt={insulator.insulator_name}
                className="insulator-detail-img"
              />
            </div>

            <div className="insulator-content-wrapper">
              {/* Заголовок */}
              <h1 className="insulator-title">{insulator.insulator_name}</h1>

              {/* Статус */}
              {/* Характеристики */}
              <div className="insulator-specs">
                <div className="spec-item">
                  <span className="spec-label">Теплопроводность</span>
                  <span className="spec-value">{insulator.thermal_conductivity} Вт/м·К</span>
                </div>
              </div>

              {/* Описание */}
              <div className="insulator-description">
                <h3>Описание</h3>
                <p>{insulator.insulator_description}</p>
              </div>

              {/* Кнопка */}
              {isAuthenticated ? (
                <button
                  onClick={handleAddToRequest}
                  disabled={isAdding || isLoading}
                  className="btn-add-to-cart"
                >
                  {isAdding ? 'Добавление...' : 'Добавить в заявку'}
                </button>
              ) : !isAuthenticated ? (
                <button
                  onClick={() => navigate(`${routePath}/login`)}
                  className="btn-add-to-cart"
                >
                  Войти для добавления в заявку
                </button>
              ) : (
                <button
                  disabled
                  className="btn-add-to-cart"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  Утеплитель недоступен
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};