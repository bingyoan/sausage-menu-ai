import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // 如果你有 CSS 的話，沒有可以先註解掉

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)