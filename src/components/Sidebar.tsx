import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Upload, 
  Settings, 
  FileText,
  Home
} from 'lucide-react'

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: 'データ取込', href: '/import', icon: Upload },
  { name: 'コード管理', href: '/codes', icon: Settings },
  { name: 'レポート', href: '/reports', icon: FileText },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">日報集計アプリ</h1>
        <p className="text-sm text-gray-500 mt-1">iPad対応版</p>
      </div>
      
      <nav className="mt-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-4 text-sm font-medium touch-target ${
                isActive
                  ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

