import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="h-[844px] w-[390px] bg-[#F4F6F9] flex flex-col font-sans overflow-hidden rounded-[40px] shadow-2xl relative border-[8px] border-slate-800">
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-50"></div>
        <App />
      </div>
    </div>
  </React.StrictMode>,
)
