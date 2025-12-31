// Хук для определения префикса пути в зависимости от окружения
export const usePathPrefix = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  
  const isTauri = '__TAURI__' in window;
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;
  const hostname = window.location.hostname;
  
  // В dev режиме Tauri использует devUrl с префиксом /RIP-BMSTU-FRONTED/
  // Проверяем текущий URL чтобы определить правильный префикс
  if (isTauri) {
    // Проверяем несколько условий для определения dev режима
    const isDevMode = 
      currentPath.startsWith('/RIP-BMSTU-FRONTED') || 
      currentHref.includes('/RIP-BMSTU-FRONTED') ||
      (hostname !== 'localhost' && hostname !== '127.0.0.1' && currentPath !== '/');
    
    if (isDevMode) {
      return '/RIP-BMSTU-FRONTED';
    }
    // Иначе в production build используем пустой префикс
    return '';
  }
  
  // Для веб-версии всегда используем префикс
  return '/RIP-BMSTU-FRONTED';
};

