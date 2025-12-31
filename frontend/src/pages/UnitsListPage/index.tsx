// src/pages/InsulatorsList.tsx
import { useState, useEffect } from 'react';
import { InsulatorCard } from '../../components/UnitCard/index';
import { fetchInsulators } from '../../modules/mocks';
import { BootstrapBreadcrumbs } from '../../components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSearch,
  setMinPrice,
  setMaxPrice,
  useFilters,
} from '../../store/slices/unitsSlice';
import { fetchCartInfo } from '../../store/slices/cartSlice';
import { AppDispatch, RootState } from '../../store/store';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';

export const InsulatorsList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации
  const filters = useFilters(); // ← фильтры из Redux

  // === Локальные значения инпутов (для плавного ввода) ===
  const [searchInput, setSearchInput] = useState(filters.search);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice);

  const [insulators, setInsulators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // === КОРЗИНА ИЗ REDUX ===
  const { count: cartCount, requestId: cartRequestId } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // === Загрузка корзины с бэкенда ===
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCartInfo());
    }
  }, [dispatch, isAuthenticated]);

  // === Загрузка утеплителей по фильтрам из Redux ===
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInsulators(
          filters.search,
          filters.minPrice ? Number(filters.minPrice) : undefined,
          filters.maxPrice ? Number(filters.maxPrice) : undefined
        );
        setInsulators(data);
      } catch {
        setInsulators([]);
      }
      setLoading(false);
    };
    load();
  }, [filters.search, filters.minPrice, filters.maxPrice]);

  // === Обработчики ===
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setSearch(searchInput.trim()));
  };

  const handleClear = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    dispatch(setSearch(''));
    dispatch(setMinPrice(''));
    dispatch(setMaxPrice(''));
  };

  const goToCart = () => {
    if (cartRequestId) {
      navigate(`${routePath}/insulatorequests/${cartRequestId}`);
    } else {
      navigate(`${routePath}/insulators`);
    }
  };

  return (
    <>
      <div className="container-camo" style={{ padding: '20px 0px' }}>
        <BootstrapBreadcrumbs />
      </div>

      <div className="insulators-page">
        {/* === ФОРМА ПОИСКА === */}
        <form onSubmit={handleSearch} className="search-form">
          {/* ПОИСК */}
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="clear-btn-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
            <button type="submit" className="search-btn-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          {/* ЦЕНА ОТ */}
          <div className="input-wrapper">
            <input
              type="number"
              placeholder="Цена от"
              value={minPriceInput}
              onChange={(e) => {
                const val = e.target.value;
                setMinPriceInput(val);
                dispatch(setMinPrice(val)); // ← в Redux сразу
              }}
              className="price-input"
            />
            {minPriceInput && (
              <button
                type="button"
                onClick={() => {
                  setMinPriceInput('');
                  dispatch(setMinPrice(''));
                }}
                className="clear-btn-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ЦЕНА ДО */}
          <div className="input-wrapper">
            <input
              type="number"
              placeholder="Цена до"
              value={maxPriceInput}
              onChange={(e) => {
                const val = e.target.value;
                setMaxPriceInput(val);
                dispatch(setMaxPrice(val)); // ← в Redux сразу
              }}
              className="price-input"
            />
            {maxPriceInput && (
              <button
                type="button"
                onClick={() => {
                  setMaxPriceInput('');
                  dispatch(setMaxPrice(''));
                }}
                className="clear-btn-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* СБРОС */}
          {(searchInput || minPriceInput || maxPriceInput) && (
            <button
              type="button"
              onClick={handleClear}
              className="reset-btn"
            >
              Сбросить
            </button>
          )}

          {/* КОРЗИНА — ТВОЯ ОРИГИНАЛЬНАЯ */}
          <button
            type="button"
            onClick={goToCart}
            className="cart-btn"
            title={`Корзина: ${cartCount} товар(ов)`}
          >
            <img src={`${pathPrefix}/basket.png`} alt="Корзина" />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>
        </form>

        {/* === СПИСОК КАРТОЧЕК === */}
        <div className="insulators-grid">
          {loading ? (
            <div className="loading-wrapper">
              <img src={`${pathPrefix}/77310a9e5492a5e62c5b3ecee4a5ebd0.gif`} alt="Загрузка..." className="loading-spinner" />
              <p className="empty-text">Идет загрузка</p>
            </div>
          ) : insulators.length === 0 ? (
            <div className="empty-state">
              <img src={`${pathPrefix}/0dc6f19bc2da6d2e30622c52379bdee7.gif`} alt="Ничего не найдено" className="empty-image" />
              <p className="empty-text">Ничего не найдено</p>
              <p className="empty-subtext">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            insulators.map((ins) => (
              <div key={ins.id} className="insulator-card-wrapper">
                <InsulatorCard insulator={ins} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};