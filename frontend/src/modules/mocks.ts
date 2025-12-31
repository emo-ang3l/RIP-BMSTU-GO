// frontend/src/api/api.ts  (новый файл)
import { Insulator } from './types';
import { API_BASE } from '../api/base';

const MOCK_INSULATORS: Insulator[] = [
  {
    id: 1,
    insulator_name: "Минвата Rockwool",
    insulator_description: "Отличная теплоизоляция",
    image_key: null,
    image_url: null,
    thermal_conductivity: 0.035
  },
   {
    id: 2,
    insulator_name: "Минвата Rockwool",
    insulator_description: "Отличная теплоизоляция",
    image_key: null,
    image_url: null,
    thermal_conductivity: 0.035
  },
   {
    id: 3,
    insulator_name: "Минвата Rockwool",
    insulator_description: "Отличная теплоизоляция",
    image_key: null,
    image_url: null,
    thermal_conductivity: 0.035
  },
   {
    id: 4,
    insulator_name: "Минвата Rockwool",
    insulator_description: "Отличная теплоизоляция",
    image_key: null,
    image_url: null,
    thermal_conductivity: 0.035
  },
   {
    id: 5,
    insulator_name: "Минвата Rockwool",
    insulator_description: "Отличная теплоизоляция",
    image_key: null,
    image_url: null,
    thermal_conductivity: 0.035
  }
];

export const fetchInsulators = async (search = '', minPrice?: number, maxPrice?: number): Promise<Insulator[]> => {
  const params = new URLSearchParams();
  if (search) params.append('q', search);
  if (minPrice !== undefined) params.append('min_price', String(minPrice));
  if (maxPrice !== undefined) params.append('max_price', String(maxPrice));

  try {
    // Используем API_BASE для правильного URL в зависимости от окружения
    // В Tauri используем полный URL, в браузере - относительный через прокси
    const apiUrl = API_BASE ? `${API_BASE}/api/insulators/?${params}` : `/api/insulators/?${params}`;
    const res = await fetch(apiUrl);    
    if (!res.ok) throw new Error();
      return await res.json();
  } catch (e) {
    console.warn('Бэк недоступен — моки');
    return MOCK_INSULATORS.filter(i => {
      const matchesName = search ? i.insulator_name.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesMinPrice = minPrice === undefined || (i.thermal_conductivity * 1000) >= minPrice;
      const matchesMaxPrice = maxPrice === undefined || (i.thermal_conductivity * 1000) <= maxPrice;
      return matchesName && matchesMinPrice && matchesMaxPrice;
    });
  }
};


export const fetchInsulatorById = async (id: number): Promise<Insulator> => {
  try {
    // Используем API_BASE для правильного URL в зависимости от окружения
    const apiUrl = API_BASE ? `${API_BASE}/api/insulators/${id}/` : `/api/insulators/${id}/`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    const mock = MOCK_INSULATORS.find(i => i.id === id);
    if (!mock) throw new Error('Not found');
    return mock;
  }
};