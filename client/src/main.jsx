import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { AppProviders } from './providers/AppProviders'
import './index.css'
import './i18n/config'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AppProviders>
        <App />
      </AppProviders>
    </Provider>
  </StrictMode>,
)
