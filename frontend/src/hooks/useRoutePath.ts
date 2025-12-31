// Хук для навигации - возвращает путь БЕЗ префикса если basename установлен в BrowserRouter
// Используется только для навигации (navigate, Link, NavLink)
// Для статических ресурсов (изображения) используйте usePathPrefix
export const useRoutePath = (): string => {
  // В dev режиме Tauri basename установлен в BrowserRouter,
  // поэтому React Router автоматически добавляет префикс ко всем путям
  // Для навигации не нужно добавлять pathPrefix
  if (typeof window !== 'undefined') {
    const isTauri = '__TAURI__' in window;
    const currentHref = window.location.href;
    
    // В dev режиме Tauri basename установлен, возвращаем пустую строку
    if (isTauri && currentHref.includes('/RIP-BMSTU-FRONTED')) {
      return '';
    }
  }
  
  // Для веб-версии или production Tauri basename не установлен,
  // но в нашем случае это не используется, так как basename всегда установлен
  return '';
};

