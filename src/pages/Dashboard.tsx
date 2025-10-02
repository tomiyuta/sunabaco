import { useState, useEffect, useMemo } from 'react'
import { BarChart3, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../contexts/DataContext'
import { aggregateByWorkType, generateRatioData, calculateTotals } from '../utils/dataAggregation'

const COLORS = ['#3B82F6', '#EF4444']

export default function Dashboard() {
  const { workItems, workCodes } = useData()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // データが空の場合はモックデータを使用
  const mockData = [
    { name: '組立', 規内: 120, 規外: 15, 計: 135 },
    { name: '配管', 規内: 95, 規外: 8, 計: 103 },
    { name: '電気', 規内: 80, 規外: 12, 計: 92 },
    { name: '塗装', 規内: 60, 規外: 5, 計: 65 },
    { name: 'その他', 規内: 45, 規外: 3, 計: 48 },
  ]

  // 実際のデータから集計データを生成
  const chartData = useMemo(() => {
    if (workItems.length === 0) {
      return mockData
    }
    
    return aggregateByWorkType(workItems, workCodes)
  }, [workItems, workCodes])

  const pieData = useMemo(() => {
    if (workItems.length === 0) {
      return [
        { name: '規内', value: 400, color: '#3B82F6' },
        { name: '規外', value: 43, color: '#EF4444' },
      ]
    }
    return generateRatioData(workItems)
  }, [workItems])

  const totals = useMemo(() => {
    if (workItems.length === 0) {
      return {
        totalInHours: 400,
        totalOutHours: 43,
        totalHours: 443,
        overtimeRatio: 9.7
      }
    }
    return calculateTotals(workItems)
  }, [workItems])

  const { totalInHours, totalOutHours, totalHours, overtimeRatio } = totals

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-1">
            工数集計の概要
            {workItems.length > 0 && (
              <span className="ml-2 text-sm text-blue-600">
                (データ件数: {workItems.length}件)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">{isOnline ? 'オンライン' : 'オフライン'}</span>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">規内工数</p>
              <p className="text-2xl font-bold text-gray-900">{totalInHours.toLocaleString()}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">規外工数</p>
              <p className="text-2xl font-bold text-gray-900">{totalOutHours.toLocaleString()}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総工数</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toLocaleString()}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">規外比率</p>
              <p className="text-2xl font-bold text-gray-900">{overtimeRatio}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 棒グラフ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">工種別工数</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="規内" fill="#3B82F6" name="規内" />
              <Bar dataKey="規外" fill="#EF4444" name="規外" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 円グラフ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">規内/規外比率</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* 最近の活動 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">最近の活動</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">データ取込が完了しました</p>
                <p className="text-xs text-gray-500">2分前</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">コードマスタが更新されました</p>
                <p className="text-xs text-gray-500">1時間前</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">未定義コードが検出されました</p>
                <p className="text-xs text-gray-500">3時間前</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

