// Определяем базовый URL API на основе текущего хоста
// Если фронтенд открыт с IP-адреса (например, 192.168.1.108:3000),
// то API будет обращаться к тому же IP на порту 8000
const getApiBase = (): string => {
  // Проверяем переменную окружения для API URL (приоритет)
  if (typeof process !== 'undefined' && process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  
  // Проверяем, работаем ли мы в Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  
  // В Tauri приложении используем localhost по умолчанию
  // (можно изменить на нужный IP, если бэкенд на другом адресе)
  if (isTauri) {
    // В Tauri прокси Vite не работает, поэтому используем прямой URL
    // По умолчанию используем localhost, но можно изменить на нужный IP
    return 'http://localhost:8000';
  }
  
  // В браузере используем относительные пути через прокси Vite
  // для избежания Mixed Content (HTTPS страница -> HTTP API)
  if (typeof window !== 'undefined') {
    // Если страница загружена по HTTPS, используем относительные пути
    // которые будут проксироваться через Vite
    if (window.location.protocol === 'https:') {
      return ''; // Относительный путь - будет использован прокси Vite
    }
    
    // Для HTTP также используем относительные пути через прокси
    // чтобы все запросы шли через один механизм
    return ''; // Относительный путь - будет использован прокси Vite
  }
  
  // Fallback для SSR или других случаев
  return 'http://localhost:8000';
};

export const API_BASE = getApiBase();

// Логируем базовый URL для отладки (всегда, чтобы видеть в production)
if (typeof window !== 'undefined') {
  console.log('API Base URL:', API_BASE);
  console.log('Current hostname:', window.location.hostname);
  console.log('Current href:', window.location.href);
  console.log('Is Tauri:', '__TAURI__' in window);
}