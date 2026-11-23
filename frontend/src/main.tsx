import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from './store/store.ts';
import { antdTheme } from './theme/theme.ts';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={antdTheme}>
        <App />
      </ConfigProvider>
    </Provider>
  </StrictMode>,
);
