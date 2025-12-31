import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './styles/styles.css';

// Определяем base URL для BrowserRouter
// В dev режиме Tauri используем basename, чтобы React Router правильно обрабатывал пути
// pathPrefix используется только для статических ресурсов (изображения)
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
let basename: string | undefined = undefined;

if (typeof window !== 'undefined') {
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;
  
  if (isTauri) {
    // В dev режиме Tauri использует devUrl с префиксом /RIP-BMSTU-FRONTED/
    if (currentPath.startsWith('/RIP-BMSTU-FRONTED') || currentHref.includes('/RIP-BMSTU-FRONTED')) {
      basename = '/RIP-BMSTU-FRONTED'; // dev режим
    } else {
      basename = '/'; // production build
    }
  } else {
    // Для веб-версии используем undefined (vite.config.ts уже настроен base)
    basename = undefined;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <BrowserRouter basename={basename}>        
      <App />
    </BrowserRouter>
  </Provider>
);