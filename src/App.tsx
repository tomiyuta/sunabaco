import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { DataProvider } from './contexts/DataContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Import from './pages/Import'
import Codes from './pages/Codes'
import Reports from './pages/Reports'

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // オフライン状態の監視
  window.addEventListener('online', () => setIsOffline(false))
  window.addEventListener('offline', () => setIsOffline(true))

  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {isOffline && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
              <p className="font-bold">オフライン</p>
              <p>インターネット接続を確認してください</p>
            </div>
          )}
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<Import />} />
              <Route path="/codes" element={<Codes />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </DataProvider>
  )
}

export default App

