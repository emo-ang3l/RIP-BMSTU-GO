import { Insulator } from '../../modules/types';
import { Link } from 'react-router-dom';
import { usePathPrefix } from '../../hooks/usePathPrefix';
import { useRoutePath } from '../../hooks/useRoutePath';

interface Props {
  insulator: Insulator;
}

export const InsulatorCard = ({ insulator }: Props) => {
  const pathPrefix = usePathPrefix(); // Для изображений
  const routePath = useRoutePath(); // Для навигации
  const imageUrl = insulator.image_url || `${pathPrefix}/default-image.jpg`;

  return (
    <div className="card-wrapper">
      <Link 
        to={`${routePath}/insulators/${insulator.id}`} 
        className="card-link"
        state={{ name: insulator.insulator_name }}
      >
        <div className="card-container">
          <div className="card-image-container">
            <img src={imageUrl} alt={insulator.insulator_name} className="card-image" />
          </div>
          <div className="card-body-container">
            <div className="card-text-container">
              <p className="card-body-text">{insulator.insulator_name}</p>
              <div className="card-price-container">
                <p className="card-price-text">{insulator.thermal_conductivity} Вт/м·К</p>
                <div className="card-count-container">
                  <p className="card-count-text">за 1 м²</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

    </div>
  );
};