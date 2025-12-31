// src/components/Breadcrumbs.tsx
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useLocation, Link } from 'react-router-dom';
import { useRoutePath } from '../../hooks/useRoutePath';

export const BootstrapBreadcrumbs = () => {
  const location = useLocation();
  const routePath = useRoutePath();

  // location.pathname в React Router уже учитывает basename (убирает префикс)
  // Поэтому просто разбиваем путь
  const pathnames = location.pathname.split('/').filter((x) => x);

  const nameMap: { [key: string]: string } = {
    home: 'Домой',
    insulators: 'Услуги',
    requests: 'Заявки',
    draft: 'Черновик',
  };

  // Название с детальной страницы (передаёшь через navigate(..., { state: { name: 'Пеноплэкс 50 мм' } }))
  const detailName = (location.state as any)?.name;

  return (
    <Breadcrumb className="breadcrumbs-bootstrap">
      {/* Всегда ссылка "Домой" */}
      <Breadcrumb.Item linkAs={Link} linkProps={{ to: `${routePath}/home` }}>
        Домой
      </Breadcrumb.Item>

      {pathnames.map((value, index) => {
        // Пропускаем "home" — он уже есть выше
        if (value === 'home') return null;

        const to = `${routePath}/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // Если это последний элемент и он идёт после insulators — показываем название из state
        if (isLast && pathnames[index - 1] === 'insulators' && detailName) {
          return (
            <Breadcrumb.Item key={to} active>
              {detailName}
            </Breadcrumb.Item>
          );
        }

        // Обычный пункт
        const displayName = nameMap[value] || value;

        return (
          <Breadcrumb.Item
            key={to}
            linkAs={Link}
            linkProps={{ to }}
            active={isLast}
          >
            {displayName}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
};