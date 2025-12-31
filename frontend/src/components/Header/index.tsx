// src/components/Navbar.tsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchCartInfo, clearCart } from '../../store/slices/cartSlice';
import { clearFilters } from '../../store/slices/unitsSlice';
import { AppDispatch, RootState } from '../../store/store';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { count: cartCount, requestId } = useSelector((state: RootState) => state.cart);
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCartInfo());
    } else {
      dispatch(clearCart());
    }
  }, [dispatch, isAuthenticated]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(clearCart());
    dispatch(clearFilters());
    navigate(`${routePath}/login`);
    closeMobileMenu();
  };


  const handleCartClick = () => {
    if (requestId) {
      navigate(`${routePath}/insulatorequests/${requestId}`);
    } else {
      navigate(`${routePath}/insulators`);
    }
    closeMobileMenu();
  };

  return (
    <header className="navbar-camo">
      <div className="navbar-inner-camo">
        {/* ЛОГОТИП СЛЕВА */}
        <NavLink to={`${routePath}/home`} className="logo-camo" onClick={closeMobileMenu}>
          <div className="logo-container">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="logo-text">THERMO</span>
          </div>
        </NavLink>

        {/* ВКЛАДКИ ПО ЦЕНТРУ (ТОЛЬКО НА ДЕСКТОПЕ) */}
        <nav className="nav-tabs-camo desktop-only">
          <NavLink
            to={`${routePath}/home`}
            className={({ isActive }) =>
              `nav-tab-item ${isActive ? 'active' : ''}`
            }
            onClick={closeMobileMenu}
          >
            Домой
          </NavLink>
          <NavLink
            to={`${routePath}/insulators`}
            className={({ isActive }) =>
              `nav-tab-item ${isActive ? 'active' : ''}`
            }
            onClick={closeMobileMenu}
          >
            Услуги
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to={`${routePath}/orders`}
              className={({ isActive }) =>
                `nav-tab-item ${isActive ? 'active' : ''}`
              }
              onClick={closeMobileMenu}
            >
              Мои заказы
            </NavLink>
          )}
        </nav>

        {/* ПРАВАЯ ЧАСТЬ С АВТОРИЗАЦИЕЙ */}
        <div className="navbar-auth desktop-only">
          {isAuthenticated ? (
            <div className="auth-user-menu">
              <button 
                onClick={handleCartClick} 
                className={`cart-icon-btn ${requestId ? 'cart-active' : 'cart-disabled'}`}
                disabled={!requestId}
                title={requestId ? `Корзина: ${cartCount} товар(ов)` : 'Корзина пуста'}
              >
                <img src={`${pathPrefix}/basket.png`} alt="Корзина" />
                {cartCount > 0 && <span className="cart-badge-header">{cartCount}</span>}
              </button>
              <span className="user-name">{user?.username || 'Пользователь'}</span>
              <NavLink
                to={`${routePath}/profile`}
                className="btn-auth btn-profile"
                onClick={closeMobileMenu}
              >
                Изменить данные
              </NavLink>
              <button
                onClick={handleLogout}
                className="btn-auth btn-logout"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <NavLink
                to={`${routePath}/login`}
                className="btn-auth btn-login"
                onClick={closeMobileMenu}
              >
                Войти
              </NavLink>
              <NavLink
                to={`${routePath}/register`}
                className="btn-auth btn-register"
                onClick={closeMobileMenu}
              >
                Регистрация
              </NavLink>
            </div>
          )}
        </div>

        {/* БУРГЕР-МЕНЮ (ТОЛЬКО НА МОБИЛКЕ) */}
        <div
          className={`mobile-menu-wrapper ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
        >
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* МОБИЛЬНОЕ МЕНЮ */}
          <nav
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <NavLink
              to={`${routePath}/home`}
              className={`mobile-menu-item ${location.pathname.includes('/home') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Домой
            </NavLink>
            <NavLink
              to={`${routePath}/insulators`}
              className={`mobile-menu-item ${location.pathname.includes('/insulators') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Услуги
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink
                  to={`${routePath}/orders`}
                  className={`mobile-menu-item ${location.pathname.includes('/orders') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Мои заказы
                </NavLink>
                <button
                  onClick={handleCartClick}
                  className={`mobile-menu-item ${requestId ? '' : 'disabled'}`}
                  disabled={!requestId}
                >
                  Корзина {requestId ? `(${cartCount})` : '(пуста)'}
                </button>
                <NavLink
                  to={`${routePath}/profile`}
                  className={`mobile-menu-item ${location.pathname.includes('/profile') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Профиль
                </NavLink>
                <div className="mobile-user-info">
                  <span>{user?.username || 'Пользователь'}</span>
                </div>
                <button onClick={handleLogout} className="mobile-menu-item btn-logout-mobile">
                  Выйти
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <NavLink
                  to={`${routePath}/login`}
                  className={`mobile-menu-item ${location.pathname.includes('/login') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Войти
                </NavLink>
                <NavLink
                  to={`${routePath}/register`}
                  className={`mobile-menu-item ${location.pathname.includes('/register') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Регистрация
                </NavLink>
              </>
            )}
          </nav>
        </div>
            
      </div>
    </header>
  );
};